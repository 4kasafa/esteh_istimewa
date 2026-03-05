function sanitize_(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
}

function normalizeKey_(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
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

function getAppTimeZone_() {
  try {
    if (APP_CONFIG && APP_CONFIG.SPREADSHEET_ID) {
      const ss = SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
      const spreadsheetTimeZone = sanitize_(ss.getSpreadsheetTimeZone());
      if (spreadsheetTimeZone) {
        return spreadsheetTimeZone;
      }
    }
  } catch (error) {
    // Ignore and fallback.
  }

  return Session.getScriptTimeZone() || "Asia/Makassar";
}

function asDate_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return value;
  }
  const text = sanitize_(value);
  if (!text) {
    return null;
  }
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  const fallback = new Date(text.replace(" ", "T"));
  if (!isNaN(fallback.getTime())) {
    return fallback;
  }
  return null;
}

function formatDateTime_(date) {
  const tz = getAppTimeZone_();
  return Utilities.formatDate(date, tz, "dd-MM-yyyy HH:mm:ss");
}

function normalizeLaporanId_(value) {
  const text = String(sanitize_(value) || "");
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseNonNegativeNumber_(fieldName, value) {
  const text = sanitize_(value);
  if (text === "") {
    throw new Error("Field '" + fieldName + "' must be a valid number");
  }

  if (typeof text === "number") {
    if (!isFinite(text)) {
      throw new Error("Field '" + fieldName + "' must be a valid number");
    }
    if (text < 0) {
      throw new Error("Field '" + fieldName + "' must be greater than or equal to 0");
    }
    return text;
  }

  let raw = String(text).trim();
  raw = raw.replace(/\s+/g, "").replace(/rp/gi, "");

  // 1.234.567,89 -> 1234567.89
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) {
    // 1,234,567.89 -> 1234567.89
    raw = raw.replace(/,/g, "");
  } else {
    raw = raw.replace(",", ".");
  }

  const numeric = Number(raw);
  if (!isFinite(numeric)) {
    throw new Error("Field '" + fieldName + "' must be a valid number");
  }
  if (numeric < 0) {
    throw new Error("Field '" + fieldName + "' must be greater than or equal to 0");
  }
  return numeric;
}

function parseMonthlyFilter_(payload) {
  const source = payload || {};
  const monthText = String(sanitize_(source.month || source.bulan) || "");
  const yearText = String(sanitize_(source.year || source.tahun) || "");
  const periodText = String(sanitize_(source.period || source.periode || source.monthYear || source.month_year) || "");

  if (!monthText && !yearText && !periodText) {
    return null;
  }

  let month = null;
  let year = null;
  let match = null;

  if (periodText) {
    match = periodText.match(/^(\d{4})[-\/](\d{1,2})$/);
    if (match) {
      year = Number(match[1]);
      month = Number(match[2]);
    } else {
      match = periodText.match(/^(\d{1,2})[-\/](\d{4})$/);
      if (match) {
        month = Number(match[1]);
        year = Number(match[2]);
      } else {
        throw new Error("Invalid monthly filter. Use 'period' as yyyy-MM or MM-yyyy");
      }
    }
  } else {
    if (!monthText || !yearText) {
      throw new Error("Monthly filter requires both 'month' and 'year'");
    }
    month = Number(monthText);
    year = Number(yearText);
  }

  if (!isFinite(month) || month < 1 || month > 12) {
    throw new Error("Invalid month. Allowed range: 1-12");
  }
  if (!isFinite(year) || year < 1900 || year > 9999) {
    throw new Error("Invalid year format");
  }

  return {
    month: Math.floor(month),
    year: Math.floor(year),
  };
}

function filterObjectsByMonthFromHeader_(objects, headerName, monthlyFilter) {
  const items = objects || [];
  if (!headerName || !monthlyFilter) {
    return items;
  }

  return items.filter(function (item) {
    const dateValue = parseLaporanDate_(item ? item[headerName] : "");
    if (!dateValue) {
      return false;
    }
    return (dateValue.getMonth() + 1) === monthlyFilter.month && dateValue.getFullYear() === monthlyFilter.year;
  });
}

function parseMonthlyFilterFromIdValue_(idValue) {
  const text = String(sanitize_(idValue) || "");
  if (!text) {
    return null;
  }

  var match = text.match(/^(\d{4})[-\/](\d{1,2})$/);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
    };
  }

  match = text.match(/^(\d{1,2})[-\/](\d{4})$/);
  if (match) {
    return {
      month: Number(match[1]),
      year: Number(match[2]),
    };
  }

  return null;
}
