function doGet(e) {
  try {
    const action = sanitize_(e && e.parameter ? e.parameter.action : "").toLowerCase();

    if (!action) {
      return jsonResponse_(true, [], "Data list");
    }

    if (action === "read") {
      return handleRead_(e && e.parameter ? e.parameter : {});
    }

    return jsonResponse_(false, null, "Unknown action for GET. Allowed: read");
  } catch (error) {
    return jsonResponse_(false, null, error.message);
  }
}

function doPost(e) {
  try {
    const payload = getPayload_(e);
    const action = (payload.action || "").toLowerCase();

    switch (action) {
      case "create":
        return handleCreate_(payload);
      case "read":
        return handleRead_(payload);
      case "update":
        return handleUpdate_(payload);
      default:
        return jsonResponse_(false, null, "Unknown action for POST. Allowed: create, read, update");
    }
  } catch (error) {
    return jsonResponse_(false, null, error.message);
  }
}

function handleCreate_(payload) {
  const sheet = getOrCreateSheet_();
  const headers = ensureHeaders_(sheet);
  const idHeader = getIdHeader_(headers);

  const rowData = extractRowData_(payload, headers);
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

  sheet.appendRow(rowValues);
  const newRow = sheet.getLastRow();
  applyBorderToRincianRow_(sheet, newRow, headers.length);

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

function handleRead_(payload) {
  const sheet = getOrCreateSheet_();
  const headers = ensureHeaders_(sheet);

  const id = sanitize_(payload.id);
  const values = sheet.getDataRange().getDisplayValues();
  const dataStartRow = (APP_CONFIG.HEADER_ROW || 1) + 1;

  if (values.length < dataStartRow) {
    return jsonResponse_(true, id ? null : [], id ? "Data not found" : "No data");
  }

  const objects = values.slice(dataStartRow - 1).map(function (row) {
    return rowToObject_(headers, row);
  });

  if (id) {
    const idHeader = getIdHeader_(headers);
    const found = objects.find(function (item) {
      return sanitize_(item[idHeader]) === id;
    });
    return jsonResponse_(true, found || null, found ? "Data found" : "Data not found");
  }

  return jsonResponse_(true, objects, "Data list");
}

function handleUpdate_(payload) {
  const sheet = getOrCreateSheet_();
  const headers = ensureHeaders_(sheet);
  const idHeader = getIdHeader_(headers);

  const id = sanitize_(payload.id);
  if (!id) {
    return jsonResponse_(false, null, "Field 'id' is required");
  }

  const rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex === -1) {
    return jsonResponse_(false, null, "Data not found");
  }

  const currentRow = sheet.getRange(rowIndex, 1, 1, headers.length).getDisplayValues()[0];
  const currentObj = rowToObject_(headers, currentRow);
  const updateData = extractRowData_(payload, headers);
  delete updateData[idHeader];
  const nextObj = Object.assign({}, currentObj, updateData);

  const nextValues = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(nextObj, header) ? nextObj[header] : "";
  });

  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([nextValues]);

  return jsonResponse_(true, nextObj, "Data updated");
}

function getPayload_(e) {
  const safeParam = (e && e.parameter) || {};
  const body = e && e.postData && e.postData.contents ? e.postData.contents : "";

  if (!body) {
    return safeParam;
  }

  let json = {};
  try {
    json = JSON.parse(body);
  } catch (error) {
    throw new Error("Invalid JSON body");
  }

  return Object.assign({}, safeParam, json);
}

function getOrCreateSheet_() {
  if (!APP_CONFIG.SPREADSHEET_ID || APP_CONFIG.SPREADSHEET_ID === "REPLACE_WITH_SPREADSHEET_ID") {
    throw new Error("Please set APP_CONFIG.SPREADSHEET_ID in Config.js");
  }

  const ss = SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(APP_CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(APP_CONFIG.SHEET_NAME);
  }

  return sheet;
}

function ensureHeaders_(sheet) {
  const defaultHeaders = APP_CONFIG.DEFAULT_HEADERS || [];
  const headerRow = APP_CONFIG.HEADER_ROW || 1;
  const lastColumn = sheet.getLastColumn();
  const readLength = lastColumn > 0 ? lastColumn : defaultHeaders.length;

  if (readLength === 0) {
    throw new Error("No headers available. Set APP_CONFIG.DEFAULT_HEADERS or create sheet headers.");
  }

  const firstRow = sheet.getRange(headerRow, 1, 1, readLength).getDisplayValues()[0];
  const isHeaderEmpty = firstRow.every(function (cell) {
    return sanitize_(cell) === "";
  });

  if (isHeaderEmpty && defaultHeaders.length > 0) {
    sheet.getRange(headerRow, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    return defaultHeaders.slice();
  }

  return firstRow.map(function (header) {
    return sanitize_(header);
  });
}

function findRowIndexById_(sheet, id) {
  const headerRow = APP_CONFIG.HEADER_ROW || 1;
  const idColumnIndex = APP_CONFIG.ID_COLUMN_INDEX || 1;
  const lastRow = sheet.getLastRow();

  if (lastRow <= headerRow) {
    return -1;
  }

  const count = lastRow - headerRow;
  const idValues = sheet.getRange(headerRow + 1, idColumnIndex, count, 1).getDisplayValues();
  for (var i = 0; i < idValues.length; i++) {
    if (sanitize_(idValues[i][0]) === id) {
      return headerRow + 1 + i;
    }
  }

  return -1;
}

function rowToObject_(headers, row) {
  const out = {};
  headers.forEach(function (header, i) {
    out[header] = row[i];
  });
  return out;
}

function sanitize_(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
}

function extractRowData_(payload, headers) {
  const result = {};
  const source = getPayloadDataSource_(payload);
  const normalizedHeaderMap = {};

  headers.forEach(function (header) {
    normalizedHeaderMap[normalizeKey_(header)] = header;
  });

  Object.keys(source).forEach(function (key) {
    if (key === "action" || key === "id" || key === "data") {
      return;
    }

    let targetHeader = null;
    if (Object.prototype.hasOwnProperty.call(normalizedHeaderMap, normalizeKey_(key))) {
      targetHeader = normalizedHeaderMap[normalizeKey_(key)];
    } else if (Object.prototype.hasOwnProperty.call(source, key) && headers.indexOf(key) !== -1) {
      targetHeader = key;
    }

    if (targetHeader) {
      result[targetHeader] = sanitize_(source[key]);
    }
  });

  return result;
}

function getPayloadDataSource_(payload) {
  if (payload && typeof payload.data === "object" && payload.data !== null && !Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload || {};
}

function normalizeKey_(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getIdHeader_(headers) {
  const index = (APP_CONFIG.ID_COLUMN_INDEX || 1) - 1;
  if (index < 0 || index >= headers.length) {
    throw new Error("APP_CONFIG.ID_COLUMN_INDEX is out of range.");
  }
  return headers[index];
}

function createTimestampId_() {
  const tz = Session.getScriptTimeZone() || "Asia/Makassar";
  return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
}

function jsonResponse_(ok, data, message) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: ok,
      message: message || "",
      data: data,
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
