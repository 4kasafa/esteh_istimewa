function doGet(e) {
  try {
    const action = sanitize_(e && e.parameter ? e.parameter.action : "").toLowerCase();

    if (!action) {
      return jsonResponse_(true, [], "Data list");
    }

    if (action === "read") {
      const payload = e && e.parameter ? e.parameter : {};
      const session = requireAuthSession_(e, payload);
      return handleRead_(payload, session);
    }

    if (action === "read_database") {
      const payload = e && e.parameter ? e.parameter : {};
      const session = requireAuthSession_(e, payload);
      return handleReadDatabase_(payload, session);
    }

    return jsonResponse_(false, null, "Unknown action for GET. Allowed: read, read_database");
  } catch (error) {
    return jsonResponse_(false, null, error.message);
  }
}

function doPost(e) {
  try {
    const payload = getPayload_(e);
    const action = (payload.action || "").toLowerCase();

    if (action === "login") {
      return handleLogin_(payload);
    }

    if (action === "logout") {
      const logoutSession = requireAuthSession_(e, payload);
      return handleLogout_(logoutSession);
    }

    const session = requireAuthSession_(e, payload);

    switch (action) {
      case "create":
        return handleCreate_(payload, session);
      case "read":
        return handleRead_(payload, session);
      case "read_database":
        return handleReadDatabase_(payload, session);
      case "update":
        return handleUpdate_(payload, session);
      default:
        return jsonResponse_(false, null, "Unknown action for POST. Allowed: login, logout, create, read, read_database, update");
    }
  } catch (error) {
    return jsonResponse_(false, null, error.message);
  }
}

function handleCreate_(payload, session) {
  ensurePermission_(session, "create", payload);

  if (isKasir_(session)) {
    if (hasAnyLaporanInSession_(session) || hasTodayLaporanByEmail_(session.email)) {
      return jsonResponse_(false, null, "Kasir can only create one laporan per day.");
    }
  }

  const sheet = getOrCreateSheet_();
  const headers = ensureHeaders_(sheet);
  const idHeader = getIdHeader_(headers);
  const source = getPayloadDataSource_(payload);

  const rowData = extractRowData_(payload, headers);
  validateNumericFields_(rowData, headers);
  applyAutoCalculatedFields_(sheet, headers, rowData, source, {});
  const explicitId = sanitize_(payload.id);
  if (explicitId) {
    rowData[idHeader] = explicitId;
  }
  if (!rowData[idHeader]) {
    rowData[idHeader] = createTimestampId_();
  }

  const rowValues = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(rowData, header) ? rowData[header] : "";
  });

  let rincianRowIndex = -1;
  let databaseSheet = null;
  let databaseRowIndex = -1;
  try {
    sheet.appendRow(rowValues);
    rincianRowIndex = sheet.getLastRow();
    applyBorderToRincianRow_(sheet, rincianRowIndex, headers.length);

    databaseSheet = getDatabaseSheet_();
    databaseRowIndex = syncCreateToDatabase_(databaseSheet, session, rowData, source, idHeader);

    if (isKasir_(session) && rowData[idHeader]) {
      appendLaporanToSession_(session, rowData[idHeader]);
    }
  } catch (error) {
    if (databaseSheet && databaseRowIndex > 0) {
      safeDeleteRow_(databaseSheet, databaseRowIndex);
    }
    if (rincianRowIndex > 0) {
      safeDeleteRow_(sheet, rincianRowIndex);
    }
    throw error;
  }

  return jsonResponse_(true, rowData, "Data created");
}

function applyBorderToRincianRow_(sheet, row, colCount) {
  const range = sheet.getRange(row, 1, 1, colCount);
  // Set basic border (solid light gray)
  range.setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
  // Set bottom border (medium gray)
  range.setBorder(null, null, true, null, null, null, "#999999", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  if (row === (APP_CONFIG.HEADER_ROW || 1)) {
    range.setBackground("#3498db")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
  } else {
    // Alternating background color
    range.setBackground(row % 2 === 0 ? "#f0f8ff" : "#ffffff");
    
    // 1. NO TRANSAKSI (Col 1) -> Left
    sheet.getRange(row, 1).setHorizontalAlignment("left");
    
    // 2. SHIFT, ARUS DANA, KASIR (Col 2-4) -> Center
    if (colCount >= 4) {
      sheet.getRange(row, 2, 1, 3).setHorizontalAlignment("center");
    }
    
    // 3. Numeric data (Col 5 up to total - 2) -> Right
    if (colCount >= 7) {
      sheet.getRange(row, 5, 1, colCount - 6).setHorizontalAlignment("right");
    } else if (colCount >= 5) {
      // If we don't have enough columns for the "last 2" rule to be distinct
      sheet.getRange(row, 5, 1, colCount - 4).setHorizontalAlignment("right");
    }

    // 4. TEH & GULA (Last 2 columns) -> Left
    if (colCount >= 2) {
      sheet.getRange(row, colCount - 1, 1, 2).setHorizontalAlignment("left");
    }
  }
  range.setVerticalAlignment("middle");
}

function handleRead_(payload, session) {
  ensurePermission_(session, "read", payload);
  const sheet = getOrCreateSheet_();
  const headers = ensureHeaders_(sheet);
  const idHeader = getIdHeader_(headers);
  const id = sanitize_(payload.id);
  const monthlyFilter = parseMonthlyFilter_(payload) || parseMonthlyFilterFromIdValue_(id);

  if (monthlyFilter && !isAdmin_(session)) {
    throw new Error("Monthly filter is admin-only");
  }

  const values = sheet.getDataRange().getDisplayValues();
  const dataStartRow = (APP_CONFIG.HEADER_ROW || 1) + 1;

  if (values.length < dataStartRow) {
    return jsonResponse_(true, id ? null : [], id ? "Data not found" : "No data");
  }

  let objects = values.slice(dataStartRow - 1).map(function (row) {
    return rowToObject_(headers, row);
  });
  if (monthlyFilter) {
    objects = filterObjectsByMonthFromHeader_(objects, idHeader, monthlyFilter);
    return jsonResponse_(true, objects, "Data list");
  }

  if (isKasir_(session)) {
    const allowedIdSet = getSessionLaporanSet_(session);
    objects = objects.filter(function (item) {
      const key = normalizeLaporanId_(item[idHeader]);
      return key && allowedIdSet.has(key);
    });
  }

  if (id) {
    const found = objects.find(function (item) {
      return sanitize_(item[idHeader]) === id;
    });
    return jsonResponse_(true, found || null, found ? "Data found" : "Data not found");
  }

  return jsonResponse_(true, objects, "Data list");
}

function handleUpdate_(payload, session) {
  ensurePermission_(session, "update", payload);
  const sheet = getOrCreateSheet_();
  const headers = ensureHeaders_(sheet);
  const idHeader = getIdHeader_(headers);
  const source = getPayloadDataSource_(payload);

  const id = sanitize_(payload.id);
  if (!id) {
    return jsonResponse_(false, null, "Field 'id' is required");
  }

  if (isKasir_(session)) {
    const allowedIdSet = getSessionLaporanSet_(session);
    const idKey = normalizeLaporanId_(id);
    if (!idKey || !allowedIdSet.has(idKey)) {
      return jsonResponse_(false, null, "Kasir can only edit data created in current session.");
    }
  }

  const rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex === -1) {
    return jsonResponse_(false, null, "Data not found");
  }

  const currentRow = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  const currentObj = rowToObject_(headers, currentRow);
  const updateData = extractRowData_(payload, headers);
  validateNumericFields_(updateData, headers);
  delete updateData[idHeader];
  const nextObj = Object.assign({}, currentObj, updateData);
  applyAutoCalculatedFields_(sheet, headers, nextObj, source, { excludeRowIndex: rowIndex });
  const nextValues = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(nextObj, header) ? nextObj[header] : "";
  });

  const databaseSheet = getDatabaseSheet_();
  const databaseHeaders = getSheetHeaders_(databaseSheet);
  ensureDatabaseFormulaColumnsReady_(databaseSheet, databaseHeaders);
  const databaseTimeStampHeader = getDatabaseHeaderName_(databaseHeaders, "TIME STAMP INPUT");
  if (!databaseTimeStampHeader) {
    throw new Error("Sheet '" + getDatabaseSheetName_() + "' missing header: TIME STAMP INPUT");
  }
  const databaseRowIndex = findRowIndexByHeaderValue_(databaseSheet, databaseHeaders, databaseTimeStampHeader, id);
  if (databaseRowIndex === -1) {
    throw new Error("Data '" + id + "' not found in sheet '" + getDatabaseSheetName_() + "'");
  }

  const currentDatabaseRow = databaseSheet.getRange(databaseRowIndex, 1, 1, databaseHeaders.length).getValues()[0];
  const currentDatabaseObj = rowToObject_(databaseHeaders, currentDatabaseRow);
  const databasePatch = alignDatabasePatchToHeaders_(databaseHeaders, buildDatabasePatch_(session, nextObj, source, idHeader));
  const previousDatabasePatch = {};
  Object.keys(databasePatch).forEach(function (header) {
    if (Object.prototype.hasOwnProperty.call(currentDatabaseObj, header)) {
      previousDatabasePatch[header] = currentDatabaseObj[header];
    }
  });

  try {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([nextValues]);
    setRowByHeaderPatch_(databaseSheet, databaseHeaders, databaseRowIndex, databasePatch);
  } catch (error) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([currentRow]);
    setRowByHeaderPatch_(databaseSheet, databaseHeaders, databaseRowIndex, previousDatabasePatch);
    throw error;
  }

  return jsonResponse_(true, nextObj, "Data updated");
}
