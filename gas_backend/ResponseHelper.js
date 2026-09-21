/**
 * Helper untuk format respons JSON seragam dan penanganan parsing dasar
 */

function jsonResponse_(success, data, message) {
  const responsePayload = {
    success: Boolean(success),
    data: data !== undefined ? data : null,
    message: message || (success ? "Success" : "Error"),
    timestamp: Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")
  };

  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getPayload_(e) {
  if (!e) return {};

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch {
      // jika gagal parse JSON dari body, fallback ke parameter
    }
  }

  if (e.parameter) {
    return e.parameter;
  }

  return {};
}

function sanitize_(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseNumber_(value, defaultValue = 0) {
  if (value === null || value === undefined || value === "") return defaultValue;
  if (typeof value === "number") return isNaN(value) ? defaultValue : value;

  // Bersihkan format mata uang seperti "Rp 1.250.000", "1.250.000", dll.
  const cleaned = String(value)
    .replace(/[^0-9,-]/g, "")
    .replace(/,/g, ".");

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getBearerToken_(e, payload) {
  const authorizationHeader = e && e.headers
    ? (e.headers.Authorization || e.headers.authorization || "")
    : "";

  if (authorizationHeader.toLowerCase().startsWith("bearer ")) {
    return authorizationHeader.substring(7).trim();
  }

  if (payload && payload.authorization) {
    const auth = String(payload.authorization).trim();
    if (auth.toLowerCase().startsWith("bearer ")) {
      return auth.substring(7).trim();
    }
    return auth;
  }

  if (payload && payload.token) {
    return String(payload.token).trim();
  }

  return "";
}

function getCurrentDate_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM-dd");
}

function getCurrentTime_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "HH:mm:ss");
}

function getCurrentPeriod_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM");
}
