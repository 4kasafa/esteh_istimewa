function handleCreateDatabase_(payload, session) {
  ensurePermission_(session, "create_database", payload);

  if (!isAdmin_(session)) {
    throw new Error("Action 'create_database' is admin-only");
  }

  const sheet = getDatabaseSheet_();
  const headers = getSheetHeaders_(sheet);
  if (headers.length === 0) {
    throw new Error("Sheet '" + getDatabaseSheetName_() + "' has no headers.");
  }

  const idHeader = getDatabaseHeaderName_(headers, "TIME STAMP INPUT");
  if (!idHeader) {
    throw new Error("Sheet '" + getDatabaseSheetName_() + "' missing header: TIME STAMP INPUT");
  }

  const source = getPayloadDataSource_(payload);
  const rowData = extractRowData_(payload, headers);

  if (!rowData[idHeader]) {
    rowData[idHeader] = createTimestampId_();
  }

  const rowValues = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(rowData, header) ? rowData[header] : "";
  });

  sheet.appendRow(rowValues);
  const rowIndex = sheet.getLastRow();
  applyBorderToDatabaseRow_(sheet, rowIndex, getLastNonEmptyHeaderColumn_(headers));

  return jsonResponse_(true, rowData, "Database entry created");
}

function handleReadDatabase_(payload, session) {
  ensurePermission_(session, "read_database", payload);
  const id = sanitize_(payload.id);
  const monthlyFilter = parseMonthlyFilter_(payload) || parseMonthlyFilterFromIdValue_(id);

  if (monthlyFilter && !isAdmin_(session)) {
    throw new Error("Monthly filter is admin-only");
  }

  const sheet = getDatabaseSheet_();
  const headers = getSheetHeaders_(sheet);
  if (headers.length === 0) {
    return jsonResponse_(true, [], "No data");
  }

  const idHeader = getDatabaseHeaderName_(headers, "TIME STAMP INPUT");
  if (!idHeader) {
    throw new Error("Sheet '" + getDatabaseSheetName_() + "' missing header: TIME STAMP INPUT");
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return jsonResponse_(true, id ? null : [], id ? "Data not found" : "No data");
  }

  const values = sheet.getDataRange().getDisplayValues();
  let objects = values.slice(1).map(function (row) {
    return rowToObject_(headers, row);
  });
  if (monthlyFilter) {
    objects = filterObjectsByMonthFromHeader_(objects, idHeader, monthlyFilter);
    return jsonResponse_(true, objects, "Data list");
  }

  if (id) {
    const found = objects.find(function (item) {
      return sanitize_(item[idHeader]) === id;
    });
    return jsonResponse_(true, found || null, found ? "Data found" : "Data not found");
  }

  return jsonResponse_(true, objects, "Data list");
}

function getDatabaseSheetName_() {
  return sanitize_(APP_CONFIG.DATABASE_SHEET_NAME) || "Database";
}

function getDatabaseSheet_() {
  return getRequiredSheet_(getDatabaseSheetName_());
}

function syncCreateToDatabase_(databaseSheet, session, rowData, source, idHeader) {
  const headers = getSheetHeaders_(databaseSheet);
  ensureDatabaseFormulaColumnsReady_(databaseSheet, headers);
  const patch = alignDatabasePatchToHeaders_(headers, buildDatabasePatch_(session, rowData, source, idHeader));
  const required = ["TIME STAMP INPUT", "SHIFT", "ARUS DANA", "KASIR"];
  required.forEach(function (headerName) {
    const actual = getDatabaseHeaderName_(headers, headerName);
    if (!actual) {
      throw new Error("Sheet '" + getDatabaseSheetName_() + "' missing header: " + headerName);
    }
  });

  // Insert a new row, then set only mapped columns so extra custom columns stay untouched.
  const lastRow = databaseSheet.getLastRow();
  const insertAfter = lastRow > 0 ? lastRow : 1;
  databaseSheet.insertRowAfter(insertAfter);
  const databaseRowIndex = insertAfter + 1;

  Object.keys(patch).forEach(function (headerName) {
    const columnIndex = headers.indexOf(headerName);
    if (columnIndex === -1) {
      return;
    }
    databaseSheet.getRange(databaseRowIndex, columnIndex + 1).setValue(patch[headerName]);
  });

  applyBorderToDatabaseRow_(databaseSheet, databaseRowIndex, getLastNonEmptyHeaderColumn_(headers));
  return databaseRowIndex;
}

function applyBorderToDatabaseRow_(sheet, row, colCount) {
  if (!colCount || colCount < 1) {
    return;
  }
  const range = sheet.getRange(row, 1, 1, colCount);
  // Set basic border (solid light gray)
  range.setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
  // Set bottom border (medium gray)
  range.setBorder(null, null, true, null, null, null, "#999999", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  if (row === 1) {
    range.setBackground("#3498db")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
  }

  range.setVerticalAlignment("middle");
}

function getLastNonEmptyHeaderColumn_(headers) {
  const list = headers || [];
  for (var i = list.length - 1; i >= 0; i--) {
    if (sanitize_(list[i]) !== "") {
      return i + 1;
    }
  }
  return 0;
}

function buildDatabasePatch_(session, rincianObj, source, idHeader) {
  const out = {};
  const idValue = sanitize_(rincianObj && rincianObj[idHeader]);
  if (idValue) {
    out["TIME STAMP INPUT"] = idValue;
  }

  const shift = readByAliases_(rincianObj, source, ["SHIFT"]);
  if (shift !== "") {
    out["SHIFT"] = shift;
  }

  const arusDana = readByAliases_(rincianObj, source, ["ARUS DANA"]);
  if (arusDana !== "") {
    out["ARUS DANA"] = arusDana;
  }

  const kasir = readByAliases_(rincianObj, source, ["KASIR"]);
  if (kasir !== "") {
    out["KASIR"] = kasir;
  }

  const keterangan = readByAliases_(rincianObj, source, ["KETERANGAN"]);
  if (keterangan !== "") {
    out["KETERANGAN"] = keterangan;
  }

  const pengeluaran = readByAliases_(rincianObj, source, ["PENGELUARAN"]);
  if (pengeluaran !== "") {
    out["PENGELUARAN"] = pengeluaran;
  }

  const uangMasuk = readByAliases_(rincianObj, source, ["UANG MASUK", "UNAG MASUK"]);
  if (uangMasuk !== "") {
    out["UANG MASUK"] = uangMasuk;
    // Backward compatibility for sheets using legacy/typo header.
    out["UNAG MASUK"] = uangMasuk;
  }

  const totalNota = resolveTotalNotaValue_(rincianObj, source);
  if (totalNota !== "") {
    out["TOTAL NOTA"] = totalNota;
    // Compatibility with Database sheets that name this column as UANG LAKU.
    out["UANG LAKU"] = totalNota;
    // Compatibility with sheets where column F is labeled INPUT KASIR.
    out["INPUT KASIR"] = totalNota;
  }

  out["UANG KELUAR"] = resolveUangKeluarForRole_(session, rincianObj, source);

  return out;
}

function resolveTotalNotaValue_(rincianObj, source) {
  return readByAliases_(rincianObj, source, ["TOTAL NOTA", "TOTALNOTA", "UANG LAKU", "UANGLAKU"]);
}

function alignDatabasePatchToHeaders_(headers, patch) {
  const out = {};
  const list = headers || [];
  Object.keys(patch || {}).forEach(function (key) {
    const actual = getDatabaseHeaderName_(list, key);
    if (actual) {
      out[actual] = patch[key];
    }
  });
  return out;
}

function setRowByHeaderPatch_(sheet, headers, rowIndex, patch) {
  Object.keys(patch || {}).forEach(function (headerName) {
    const columnIndex = (headers || []).indexOf(headerName);
    if (columnIndex === -1) {
      return;
    }
    sheet.getRange(rowIndex, columnIndex + 1).setValue(patch[headerName]);
  });
}

function ensureDatabaseFormulaColumnsReady_(sheet, headers) {
  const targetHeaders = ["STATUS SELISIH", "SELISIH"];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return;
  }

  targetHeaders.forEach(function (expectedHeader) {
    const headerName = getDatabaseHeaderName_(headers, expectedHeader);
    if (!headerName) {
      return;
    }

    const colIndex = (headers || []).indexOf(headerName);
    if (colIndex < 0) {
      return;
    }

    const headerFormula = sheet.getRange(1, colIndex + 1).getFormula();
    if (!headerFormula || headerFormula.toUpperCase().indexOf("ARRAYFORMULA") === -1) {
      return;
    }

    // Clear residual manual values that block ARRAYFORMULA spill range.
    sheet.getRange(2, colIndex + 1, lastRow - 1, 1).clearContent();
  });
}

function readByAliases_(rincianObj, source, aliases) {
  const keys = aliases || [];
  for (var i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (rincianObj && Object.prototype.hasOwnProperty.call(rincianObj, key)) {
      const value = sanitize_(rincianObj[key]);
      if (value !== "") {
        return value;
      }
    }
  }

  const normalizedSource = {};
  const rawSource = source || {};
  Object.keys(rawSource).forEach(function (key) {
    normalizedSource[normalizeKey_(key)] = sanitize_(rawSource[key]);
  });

  for (var j = 0; j < keys.length; j++) {
    const normalizedKey = normalizeKey_(keys[j]);
    if (Object.prototype.hasOwnProperty.call(normalizedSource, normalizedKey) && normalizedSource[normalizedKey] !== "") {
      return normalizedSource[normalizedKey];
    }
  }

  return "";
}

function getDatabaseHeaderName_(headers, expectedHeader) {
  const target = normalizeKey_(expectedHeader);
  for (var i = 0; i < (headers || []).length; i++) {
    if (normalizeKey_(headers[i]) === target) {
      return headers[i];
    }
  }
  return "";
}

function findRowIndexByHeaderValue_(sheet, headers, headerName, expectedValue) {
  const index = (headers || []).indexOf(headerName);
  if (index === -1) {
    return -1;
  }
  const headerRow = 1;
  const lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) {
    return -1;
  }
  const count = lastRow - headerRow;
  const values = sheet.getRange(headerRow + 1, index + 1, count, 1).getDisplayValues();
  const normalizedExpected = normalizeLaporanId_(expectedValue);
  for (var i = 0; i < values.length; i++) {
    if (normalizeLaporanId_(values[i][0]) === normalizedExpected) {
      return headerRow + 1 + i;
    }
  }
  return -1;
}

function safeDeleteRow_(sheet, rowIndex) {
  if (!sheet || rowIndex < 1 || rowIndex > sheet.getLastRow()) {
    return;
  }
  sheet.deleteRow(rowIndex);
}

function resolveUangKeluarForRole_(session, rincianObj, source) {
  const raw = readByAliases_(rincianObj, source, ["UANG KELUAR"]);

  if (isKasir_(session)) {
    if (raw !== "") {
      const kasirValue = parseNonNegativeNumber_("UANG KELUAR", raw);
      if (kasirValue > 0) {
        throw new Error("Field 'UANG KELUAR' is admin-only. Kasir value must be 0");
      }
    }
    return "";
  }

  if (raw === "") {
    return "";
  }
  return parseNonNegativeNumber_("UANG KELUAR", raw);
}
