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

function getRequiredSheet_(sheetName) {
  if (!APP_CONFIG.SPREADSHEET_ID || APP_CONFIG.SPREADSHEET_ID === "REPLACE_WITH_SPREADSHEET_ID") {
    throw new Error("Please set APP_CONFIG.SPREADSHEET_ID in Config.js");
  }

  const ss = SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Sheet '" + sheetName + "' not found.");
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
      const value = sanitize_(source[key]);
      if (value === "") {
        return;
      }
      result[targetHeader] = value;
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

function getIdHeader_(headers) {
  const index = (APP_CONFIG.ID_COLUMN_INDEX || 1) - 1;
  if (index < 0 || index >= headers.length) {
    throw new Error("APP_CONFIG.ID_COLUMN_INDEX is out of range.");
  }
  return headers[index];
}

function createTimestampId_() {
  const tz = getAppTimeZone_();
  return Utilities.formatDate(new Date(), tz, "dd-MM-yyyy HH:mm:ss");
}

function getSheetHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    return [];
  }
  return sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(function (cell) {
    return sanitize_(cell);
  });
}

function toHeaderMap_(headers) {
  const out = {};
  headers.forEach(function (header, index) {
    out[normalizeKey_(header)] = index;
  });
  return out;
}
