function handleLogin_(payload) {
  const email = normalizeEmail_(payload.email || payload.Email);
  const sandi = sanitize_(payload.password || payload.Password || payload.sandi || payload.Sandi);

  if (!email || !sandi) {
    return jsonResponse_(false, null, "Fields 'email' and 'password' are required");
  }

  const user = findUserByCredential_(email, sandi);
  if (!user) {
    return jsonResponse_(false, null, "Email or password invalid");
  }

  revokeActiveSessionsByEmail_(user.email);

  const token = generateToken_();
  const now = new Date();
  const expireAt = createSessionExpireAt_(now);
  const isKasirRole = normalizeRole_(user.role) === "kasir";
  const restoredTodayLaporan = isKasirRole
    ? findLatestTodayLaporanByEmail_(user.email)
    : "";

  const sessionData = {
    token: token,
    email: user.email,
    role: user.role,
    createAt: now,
    expireAt: expireAt,
    laporan: restoredTodayLaporan,
    status: "active",
  };
  createSession_(sessionData);

  const responseData = {
    token: token,
    expiresAt: formatDateTime_(expireAt),
    user: {
      email: user.email,
      nama: user.nama,
      role: user.role,
    },
  };

  if (isKasirRole) {
    responseData.lastTodayReport = restoredTodayLaporan || null;
  }

  return jsonResponse_(true, responseData, "Login success");
}

function handleLogout_(session) {
  if (!session || !session.rowIndex) {
    return jsonResponse_(false, null, "Session not found");
  }

  revokeSessionByRow_(session.rowIndex);
  return jsonResponse_(true, null, "Logout success");
}

function requireAuthSession_(e, payload) {
  const token = getBearerToken_(e, payload);
  if (!token) {
    throw new Error("Missing Bearer token");
  }

  const session = findActiveSessionByToken_(token);
  if (!session) {
    throw new Error("Session not found or revoked");
  }

  if (new Date().getTime() > session.expireAt.getTime()) {
    revokeSessionByRow_(session.rowIndex);
    throw new Error("Token expired");
  }

  return session;
}

function ensurePermission_(session, action, payload) {
  const role = normalizeRole_(session.role);
  if (role === "admin") {
    return true;
  }

  if (role !== "kasir") {
    throw new Error("Unknown role: " + session.role);
  }

  if (action === "create" || action === "update" || action === "read") {
    if (action === "read") {
      return true;
    }
    return true;
  }

  throw new Error("Forbidden action for kasir");
}

function getBearerToken_(e, payload) {
  const param = (e && e.parameter) || {};
  const candidates = [
    payload && (payload.authorization || payload.Authorization || payload.auth),
    param.authorization,
    param.Authorization,
  ];

  for (var i = 0; i < candidates.length; i++) {
    const token = extractBearerToken_(candidates[i]);
    if (token) {
      return token;
    }
  }

  const directToken = sanitize_(payload && payload.token);
  return directToken || "";
}

function extractBearerToken_(value) {
  const text = sanitize_(value);
  if (!text) {
    return "";
  }
  const match = text.match(/^Bearer\s+(.+)$/i);
  return match ? sanitize_(match[1]) : "";
}

function findUserByCredential_(email, sandi) {
  const sheet = getRequiredSheet_("User");
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) {
    return null;
  }

  const headers = data[0].map(function (item) {
    return sanitize_(item);
  });
  const map = toHeaderMap_(headers);
  const emailIdx = map.email;
  const sandiIdx = map.sandi;
  const roleIdx = map.role;
  const namaIdx = map.nama;

  if (emailIdx === undefined || sandiIdx === undefined || roleIdx === undefined) {
    throw new Error("Sheet 'User' must have headers: Email, Sandi, Role, Nama");
  }

  for (var i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = normalizeEmail_(row[emailIdx]);
    const rowSandi = sanitize_(row[sandiIdx]);
    if (rowEmail === email && rowSandi === sandi) {
      return {
        email: rowEmail,
        role: normalizeRole_(row[roleIdx]),
        nama: sanitize_(row[namaIdx]),
      };
    }
  }

  return null;
}

function createSession_(sessionData) {
  const sheet = getRequiredSheet_("Sessions");
  const headers = getSheetHeaders_(sheet);
  const map = toHeaderMap_(headers);
  const required = ["token", "email", "role", "createat", "expireat", "laporan", "status"];
  required.forEach(function (key) {
    if (map[key] === undefined) {
      throw new Error("Sheet 'Sessions' missing header: " + key);
    }
  });

  const row = new Array(headers.length).fill("");
  row[map.token] = sessionData.token;
  row[map.email] = sessionData.email;
  row[map.role] = sessionData.role;
  row[map.createat] = sessionData.createAt;
  row[map.expireat] = sessionData.expireAt;
  row[map.laporan] = sessionData.laporan || "";
  row[map.status] = sessionData.status || "active";
  sheet.appendRow(row);
}

function getSessionRetentionDays_() {
  const configured = Number(APP_CONFIG && APP_CONFIG.SESSION_RETENTION_DAYS);
  if (!isFinite(configured) || configured <= 0) {
    return 7;
  }
  return configured;
}

function getSessionCleanupIntervalDays_() {
  const configured = Number(APP_CONFIG && APP_CONFIG.SESSION_CLEANUP_INTERVAL_DAYS);
  if (!isFinite(configured) || configured <= 0) {
    return 7;
  }
  return configured;
}

function getSessionCleanupHour_() {
  const configured = Number(APP_CONFIG && APP_CONFIG.SESSION_CLEANUP_HOUR);
  if (!isFinite(configured) || configured < 0 || configured > 23) {
    return 1;
  }
  return Math.floor(configured);
}

function cleanupSessionsJob_() {
  return purgeOldSessions_();
}

function setupSessionCleanupTrigger_() {
  const handler = "cleanupSessionsJob_";
  const triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    if (trigger.getHandlerFunction && trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger(handler)
    .timeBased()
    .everyDays(getSessionCleanupIntervalDays_())
    .atHour(getSessionCleanupHour_())
    .create();
}

function purgeOldSessions_() {
  const sheet = getRequiredSheet_("Sessions");
  const all = sheet.getDataRange().getValues();
  if (all.length < 2) {
    return 0;
  }

  const headers = all[0].map(function (item) {
    return sanitize_(item);
  });
  const map = toHeaderMap_(headers);
  const createAtIdx = map.createat;
  const expireAtIdx = map.expireat;
  if (createAtIdx === undefined && expireAtIdx === undefined) {
    return 0;
  }

  const now = new Date();
  const retentionDays = getSessionRetentionDays_();
  const threshold = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));
  let deleted = 0;

  for (var i = all.length - 1; i >= 1; i--) {
    const row = all[i];
    const createAt = createAtIdx === undefined ? null : asDate_(row[createAtIdx]);
    const expireAt = expireAtIdx === undefined ? null : asDate_(row[expireAtIdx]);
    const referenceDate = createAt || expireAt;
    if (!referenceDate) {
      continue;
    }

    if (referenceDate.getTime() <= threshold.getTime()) {
      sheet.deleteRow(i + 1);
      deleted++;
    }
  }

  return deleted;
}

function findActiveSessionByToken_(token) {
  const sheet = getRequiredSheet_("Sessions");
  const all = sheet.getDataRange().getValues();
  if (all.length < 2) {
    return null;
  }

  const headers = all[0].map(function (item) {
    return sanitize_(item);
  });
  const map = toHeaderMap_(headers);
  const tokenIdx = map.token;
  const statusIdx = map.status;
  const expireAtIdx = map.expireat;
  if (tokenIdx === undefined || expireAtIdx === undefined) {
    throw new Error("Sheet 'Sessions' must have headers: token, expireAt");
  }

  for (var i = 1; i < all.length; i++) {
    const row = all[i];
    const rowToken = sanitize_(row[tokenIdx]);
    if (rowToken !== token) {
      continue;
    }
    const status = statusIdx === undefined ? "active" : sanitize_(row[statusIdx]).toLowerCase();
    if (status && status !== "active") {
      continue;
    }
    const expireAt = asDate_(row[expireAtIdx]);
    if (!expireAt) {
      continue;
    }
    return {
      rowIndex: i + 1,
      token: rowToken,
      email: map.email === undefined ? "" : normalizeEmail_(row[map.email]),
      role: map.role === undefined ? "" : normalizeRole_(row[map.role]),
      createAt: map.createat === undefined ? null : asDate_(row[map.createat]),
      expireAt: expireAt,
      laporan: map.laporan === undefined ? "" : sanitize_(row[map.laporan]),
      status: status || "active",
    };
  }

  return null;
}

function revokeActiveSessionsByEmail_(email) {
  const sheet = getRequiredSheet_("Sessions");
  const all = sheet.getDataRange().getValues();
  if (all.length < 2) {
    return;
  }
  const headers = all[0].map(function (item) {
    return sanitize_(item);
  });
  const map = toHeaderMap_(headers);
  if (map.email === undefined || map.status === undefined) {
    return;
  }

  for (var i = 1; i < all.length; i++) {
    const rowEmail = normalizeEmail_(all[i][map.email]);
    const rowStatus = sanitize_(all[i][map.status]).toLowerCase();
    if (rowEmail === email && (!rowStatus || rowStatus === "active")) {
      sheet.getRange(i + 1, map.status + 1).setValue("revoke");
    }
  }
}

function revokeSessionByRow_(rowIndex) {
  const sheet = getRequiredSheet_("Sessions");
  const headers = getSheetHeaders_(sheet);
  const map = toHeaderMap_(headers);
  if (map.status === undefined) {
    return;
  }
  sheet.getRange(rowIndex, map.status + 1).setValue("revoke");
}

function appendLaporanToSession_(session, idValue) {
  const cleanId = sanitize_(idValue);
  if (!cleanId || !session || !session.rowIndex) {
    return;
  }

  const sheet = getRequiredSheet_("Sessions");
  const headers = getSheetHeaders_(sheet);
  const map = toHeaderMap_(headers);
  if (map.laporan === undefined) {
    return;
  }
  const cell = sheet.getRange(session.rowIndex, map.laporan + 1);
  const current = sanitize_(cell.getDisplayValue());
  const list = splitLaporan_(current);
  if (list.indexOf(cleanId) === -1) {
    list.push(cleanId);
    cell.setValue(list.join("\n"));
  }
  session.laporan = list.join("\n");
}

function getSessionLaporanSet_(session) {
  const source = splitLaporan_(session && session.laporan ? session.laporan : "");
  return new Set(source.map(function (id) {
    return normalizeLaporanId_(id);
  }).filter(function (id) {
    return id !== "";
  }));
}

function splitLaporan_(raw) {
  const text = String(sanitize_(raw) || "");
  if (!text) {
    return [];
  }

  // Preferred format: one id per line (safe even when id contains commas).
  if (text.indexOf("\n") !== -1) {
    return text
      .split("\n")
      .map(function (item) {
        return sanitize_(item);
      })
      .filter(function (item) {
        return item !== "";
      });
  }

  // Backward compatibility: if old data used custom delimiter.
  if (text.indexOf("||") !== -1) {
    return text
      .split("||")
      .map(function (item) {
        return sanitize_(item);
      })
      .filter(function (item) {
        return item !== "";
      });
  }

  // Single legacy value (including values containing commas).
  return [sanitize_(text)];
}

function hasAnyLaporanInSession_(session) {
  return splitLaporan_(session && session.laporan ? session.laporan : "").length > 0;
}

function hasTodayLaporanInSession_(session) {
  const entries = splitLaporan_(session && session.laporan ? session.laporan : "");
  if (entries.length === 0) {
    return false;
  }

  const todayKey = getDateKey_(new Date());
  for (var i = 0; i < entries.length; i++) {
    const laporanDate = parseLaporanDate_(entries[i]);
    if (laporanDate && getDateKey_(laporanDate) === todayKey) {
      return true;
    }
  }

  return false;
}

function hasTodayLaporanByEmail_(email) {
  const targetEmail = normalizeEmail_(email);
  if (!targetEmail) {
    return false;
  }

  const sheet = getRequiredSheet_("Sessions");
  const all = sheet.getDataRange().getValues();
  if (all.length < 2) {
    return false;
  }

  const headers = all[0].map(function (item) {
    return sanitize_(item);
  });
  const map = toHeaderMap_(headers);
  if (map.email === undefined || map.laporan === undefined) {
    return false;
  }

  const todayKey = getDateKey_(new Date());
  for (var rowIndex = 1; rowIndex < all.length; rowIndex++) {
    const row = all[rowIndex];
    const rowEmail = normalizeEmail_(row[map.email]);
    if (rowEmail !== targetEmail) {
      continue;
    }

    const entries = splitLaporan_(row[map.laporan]);
    if (entries.length === 0) {
      continue;
    }

    // Primary check: session row created today and has laporan.
    if (map.createat !== undefined) {
      const createdAt = asDate_(row[map.createat]);
      if (createdAt && getDateKey_(createdAt) === todayKey) {
        return true;
      }
    }

    // Fallback check: parse laporan id date.
    for (var i = 0; i < entries.length; i++) {
      const laporanDate = parseLaporanDate_(entries[i]);
      if (laporanDate && getDateKey_(laporanDate) === todayKey) {
        return true;
      }
    }
  }

  return false;
}

function findLatestTodayLaporanByEmail_(email) {
  const targetEmail = normalizeEmail_(email);
  if (!targetEmail) {
    return "";
  }

  const sheet = getRequiredSheet_("Sessions");
  const all = sheet.getDataRange().getValues();
  if (all.length < 2) {
    return "";
  }

  const headers = all[0].map(function (item) {
    return sanitize_(item);
  });
  const map = toHeaderMap_(headers);
  if (map.email === undefined || map.laporan === undefined) {
    return "";
  }

  const todayKey = getDateKey_(new Date());
  for (var rowIndex = all.length - 1; rowIndex >= 1; rowIndex--) {
    const row = all[rowIndex];
    const rowEmail = normalizeEmail_(row[map.email]);
    if (rowEmail !== targetEmail) {
      continue;
    }

    const entries = splitLaporan_(row[map.laporan]);
    if (entries.length === 0) {
      continue;
    }

    // Primary check: session row created today, inherit latest laporan entry.
    if (map.createat !== undefined) {
      const createdAt = asDate_(row[map.createat]);
      if (createdAt && getDateKey_(createdAt) === todayKey) {
        return sanitize_(entries[entries.length - 1]);
      }
    }

    // Fallback check: parse laporan id date and pick latest matched entry.
    for (var i = entries.length - 1; i >= 0; i--) {
      const laporanId = sanitize_(entries[i]);
      const laporanDate = parseLaporanDate_(laporanId);
      if (laporanDate && getDateKey_(laporanDate) === todayKey) {
        return laporanId;
      }
    }
  }

  return "";
}

function parseLaporanDate_(value) {
  const text = String(sanitize_(value) || "");
  if (!text) {
    return null;
  }

  // Preferred format: dd-MM-yyyy HH:mm:ss
  var match = text.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
  if (match) {
    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      Number(match[4] || 0),
      Number(match[5] || 0),
      Number(match[6] || 0)
    );
  }

  // Backward compatibility: yyyy-MM-dd HH:mm:ss
  match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4] || 0),
      Number(match[5] || 0),
      Number(match[6] || 0)
    );
  }

  // Indonesian display format from sheet, e.g.:
  // "Minggu, 1 Maret 2026 22.22.26" or "1 Maret 2026 22:22:26"
  match = text.match(/^(?:[^,]+,\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2})[.:](\d{2})[.:](\d{2}))?$/i);
  if (match) {
    var monthName = String(match[2] || "").toLowerCase();
    var monthMap = {
      januari: 0,
      february: 1,
      februari: 1,
      march: 2,
      maret: 2,
      april: 3,
      may: 4,
      mei: 4,
      june: 5,
      juni: 5,
      july: 6,
      juli: 6,
      august: 7,
      agustus: 7,
      september: 8,
      october: 9,
      oktober: 9,
      november: 10,
      december: 11,
      desember: 11,
    };

    if (Object.prototype.hasOwnProperty.call(monthMap, monthName)) {
      return new Date(
        Number(match[3]),
        monthMap[monthName],
        Number(match[1]),
        Number(match[4] || 0),
        Number(match[5] || 0),
        Number(match[6] || 0)
      );
    }
  }

  return asDate_(text);
}

function getDateKey_(date) {
  return Utilities.formatDate(date, getAppTimeZone_(), "yyyy-MM-dd");
}

function isKasir_(session) {
  return normalizeRole_(session && session.role) === "kasir";
}

function isAdmin_(session) {
  return normalizeRole_(session && session.role) === "admin";
}

function normalizeEmail_(value) {
  return sanitize_(value).toLowerCase();
}

function normalizeRole_(value) {
  return sanitize_(value).toLowerCase();
}

function generateToken_() {
  return Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
}

function createSessionExpireAt_(baseDate) {
  const start = baseDate instanceof Date ? baseDate : new Date();
  // Token expires 24 hours from login time.
  return new Date(start.getTime() + (3 * 60 * 60 * 1000));
}
