/**
 * Layanan autentikasi, manajemen sesi token, dan pengecekan otorisasi role
 * Menggunakan CacheService (L1 Cache) + Google Sheets (Persistent Fallback)
 */

function getSessionCache_() {
  try {
    return CacheService.getScriptCache();
  } catch (err) {
    console.error("Gagal mengakses CacheService:", err);
    return null;
  }
}

function putSessionCache_(token, sessionData) {
  const cache = getSessionCache_();
  if (!cache || !token || !sessionData) return;

  try {
    const ttl = APP_CONFIG.CACHE_TTL_SECONDS || 21600;
    const sessionKey = (APP_CONFIG.CACHE_PREFIX || "esteh_sess_") + token;
    const userKey = (APP_CONFIG.CACHE_USER_PREFIX || "esteh_user_") + String(sessionData.username || "").toLowerCase();

    cache.put(sessionKey, JSON.stringify(sessionData), ttl);
    if (sessionData.username) {
      cache.put(userKey, token, ttl);
    }
  } catch (err) {
    console.error("Gagal menyimpan sesi ke cache:", err);
  }
}

function getCachedSession_(token) {
  const cache = getSessionCache_();
  if (!cache || !token) return null;

  try {
    const sessionKey = (APP_CONFIG.CACHE_PREFIX || "esteh_sess_") + token;
    const raw = cache.get(sessionKey);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || !data.token || !data.username) return null;

    // Cek kedaluwarsa sesi
    if (data.expiresAt) {
      const expTime = new Date(data.expiresAt).getTime();
      if (!isNaN(expTime) && Date.now() > expTime) {
        removeSessionCache_(token, data.username);
        return null;
      }
    }

    return data;
  } catch (err) {
    console.error("Gagal membaca sesi dari cache:", err);
    return null;
  }
}

function removeSessionCache_(token, username) {
  const cache = getSessionCache_();
  if (!cache) return;

  try {
    const keysToRemove = [];
    if (token) {
      keysToRemove.push((APP_CONFIG.CACHE_PREFIX || "esteh_sess_") + token);
    }
    if (username) {
      const userKey = (APP_CONFIG.CACHE_USER_PREFIX || "esteh_user_") + String(username).toLowerCase();
      if (!token) {
        const cachedToken = cache.get(userKey);
        if (cachedToken) {
          keysToRemove.push((APP_CONFIG.CACHE_PREFIX || "esteh_sess_") + cachedToken);
        }
      }
      keysToRemove.push(userKey);
    }

    if (keysToRemove.length > 0) {
      cache.removeAll(keysToRemove);
    }
  } catch (err) {
    console.error("Gagal menghapus sesi dari cache:", err);
  }
}

function handleLogin_(payload) {
  const username = sanitize_(payload.username || payload.email || payload.Username || "").toLowerCase();
  const password = sanitize_(payload.password || payload.sandi || payload.Password || "");

  if (!username || !password) {
    return jsonResponse_(false, null, "Username dan password wajib diisi.");
  }

  const userSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.USER);
  let users = readTable_(userSheet);

  if (users.length === 0 && APP_CONFIG.DEFAULT_USERS && APP_CONFIG.DEFAULT_USERS.length > 0) {
    initMasterTabDefaults_(userSheet, APP_CONFIG.MASTER_TABS.USER);
    users = readTable_(userSheet);
  }

  const matchedUser = users.find(u => {
    const uName = String(u["NAMA / USERNAME"] || u["NAMA/USERNAME"] || u.USERNAME || u.username || u.Email || u.EMAIL || u.email || u.NAMA || u.nama || "").trim().toLowerCase();
    const uId = String(u.ID || u.id || "").trim().toLowerCase();
    const uPass = String(u.PASSWORD || u.password || u.Sandi || u.sandi || u.SANDI || "").trim();
    const matchUser = (uName === username || uName.split("@")[0] === username || uId === username);
    return matchUser && uPass === password;
  });

  if (!matchedUser) {
    return jsonResponse_(false, null, "Username atau password salah.");
  }

  const rawStatus = String(matchedUser.STATUS || matchedUser.status || "").trim().toLowerCase();
  if (rawStatus && rawStatus !== "aktif" && rawStatus !== "active") {
    return jsonResponse_(false, null, "Akun ini sedang nonaktif. Hubungi admin.");
  }

  // 1. Bersihkan sesi lama dari Cache
  removeSessionCache_(null, username);

  // 2. Bersihkan sesi lama dari Sheet (hapus baris fisik dari bawah ke atas)
  const sessionsSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.SESSIONS);
  const sessions = readTable_(sessionsSheet);
  const rowsToDelete = [];

  sessions.forEach(s => {
    const sUser = String(s.USERNAME || s.username || s.email || "").toLowerCase();
    if (sUser === username) {
      rowsToDelete.push(s._rowIndex);
    }
  });

  rowsToDelete.sort((a, b) => b - a).forEach(rIdx => {
    try {
      sessionsSheet.deleteRow(rIdx);
    } catch (e) {
      console.error("Gagal menghapus baris sesi lama:", e);
    }
  });

  // 3. Buat sesi baru
  const token = Utilities.getUuid();
  const now = new Date();
  const expireDate = new Date(now.getTime() + (APP_CONFIG.SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000));
  const createAtStr = Utilities.formatDate(now, APP_CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  const expireAtStr = Utilities.formatDate(expireDate, APP_CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

  const resolvedUsername = matchedUser["NAMA / USERNAME"] || matchedUser.USERNAME || matchedUser.username || matchedUser.Email || username;
  const rawRole = String(matchedUser.ROLE || matchedUser.role || "staff").toLowerCase();
  const resolvedRole = rawRole.includes("admin") ? "admin" : "staff";
  const resolvedNama = matchedUser.NAMA || matchedUser["NAMA / USERNAME"] || matchedUser.nama || resolvedUsername;
  const resolvedCabang = matchedUser.CABANG || matchedUser.cabang || "";
  const resolvedTelepon = matchedUser["NO. TELEPON"] || matchedUser.TELEPON || matchedUser.telepon || "";

  const sessionData = {
    token: token,
    username: resolvedUsername,
    role: resolvedRole,
    nama: resolvedNama,
    cabang: resolvedCabang,
    telepon: resolvedTelepon,
    expiresAt: expireAtStr
  };

  // 4. Simpan ke CacheService (L1 Cache)
  putSessionCache_(token, sessionData);

  // 5. Simpan ke Sheet Sessions sebagai persistent fallback
  const sessionHeaders = getTableHeaders_(sessionsSheet);
  appendTableRow_(sessionsSheet, sessionHeaders, {
    TOKEN: token,
    USERNAME: resolvedUsername,
    ROLE: resolvedRole,
    CREATE_AT: createAtStr,
    EXPIRE_AT: expireAtStr,
    STATUS: "active"
  });

  return jsonResponse_(true, {
    token: token,
    expiresAt: expireAtStr,
    user: {
      username: resolvedUsername,
      nama: resolvedNama,
      role: resolvedRole,
      cabang: resolvedCabang,
      telepon: resolvedTelepon
    }
  }, "Login berhasil");
}

function handleLogout_(session) {
  if (!session || !session.token) {
    return jsonResponse_(false, null, "Sesi tidak ditemukan.");
  }

  // 1. Hapus seketika dari CacheService
  removeSessionCache_(session.token, session.username);

  // 2. Hapus baris fisik dari Sheet Sessions
  try {
    const sessionsSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.SESSIONS);
    const sessions = readTable_(sessionsSheet);
    const found = sessions.find(s => String(s.TOKEN || "") === session.token);
    if (found && found._rowIndex) {
      sessionsSheet.deleteRow(found._rowIndex);
    }
  } catch (err) {
    console.error("Gagal menghapus baris sesi saat logout:", err);
  }

  return jsonResponse_(true, null, "Logout berhasil.");
}

function requireAuthSession_(e, payload) {
  const token = getBearerToken_(e, payload);
  if (!token) {
    throw new Error("Unauthorized: Bearer token tidak disertakan.");
  }

  // LANGKAH 1: Cek CacheService (L1 Cache - Cepat ~5ms, 0 I/O Sheet)
  const cached = getCachedSession_(token);
  if (cached) {
    return {
      token: cached.token,
      username: cached.username,
      role: String(cached.role || "staff").toLowerCase(),
      nama: cached.nama || cached.username,
      cabang: cached.cabang || "",
      telepon: cached.telepon || ""
    };
  }

  // LANGKAH 2: Fallback ke Sheet (Saat Cache Miss)
  const sessionsSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.SESSIONS);
  const sessions = readTable_(sessionsSheet);
  const found = sessions.find(s => String(s.TOKEN || "") === token && String(s.STATUS || "").toLowerCase() === "active");

  if (!found) {
    throw new Error("Unauthorized: Sesi tidak ditemukan atau telah berakhir.");
  }

  const expireTime = new Date(found.EXPIRE_AT).getTime();
  if (expireTime && Date.now() > expireTime) {
    try {
      sessionsSheet.deleteRow(found._rowIndex);
    } catch (err) {}
    removeSessionCache_(token, found.USERNAME);
    throw new Error("Unauthorized: Token telah kadaluarsa. Silakan login kembali.");
  }

  // Dapatkan profil user lengkap
  const userSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.USER);
  const users = readTable_(userSheet);
  const userProfile = users.find(u => {
    const uName = String(u["NAMA / USERNAME"] || u["NAMA/USERNAME"] || u.USERNAME || "").toLowerCase();
    const uId = String(u.ID || u.id || "").toLowerCase();
    const fUser = String(found.USERNAME || "").toLowerCase();
    return uName === fUser || uId === fUser;
  });

  // Pastikan user masih aktif
  if (userProfile) {
    const rawStatus = String(userProfile.STATUS || userProfile.status || "").trim().toLowerCase();
    if (rawStatus && rawStatus !== "aktif" && rawStatus !== "active") {
      try {
        sessionsSheet.deleteRow(found._rowIndex);
      } catch (err) {}
      removeSessionCache_(token, found.USERNAME);
      throw new Error("Unauthorized: Akun ini sedang nonaktif. Hubungi admin.");
    }
  }

  const rawRole = String(userProfile?.ROLE || found.ROLE || "staff").toLowerCase();
  const resolvedRole = rawRole.includes("admin") ? "admin" : "staff";

  const sessionObj = {
    token: token,
    username: found.USERNAME,
    role: resolvedRole,
    nama: userProfile ? (userProfile["NAMA / USERNAME"] || userProfile.NAMA || userProfile.nama || found.USERNAME) : found.USERNAME,
    cabang: userProfile ? (userProfile.CABANG || userProfile.cabang || "") : "",
    telepon: userProfile ? (userProfile["NO. TELEPON"] || userProfile.TELEPON || userProfile.telepon || "") : "",
    expiresAt: found.EXPIRE_AT
  };

  // Re-cache ke CacheService (Cache Warming untuk 6 jam ke depan)
  putSessionCache_(token, sessionObj);

  return {
    token: sessionObj.token,
    username: sessionObj.username,
    role: sessionObj.role,
    nama: sessionObj.nama,
    cabang: sessionObj.cabang
  };
}

function ensureAdmin_(session) {
  if (!session || String(session.role || "").toLowerCase() !== "admin") {
    throw new Error("Forbidden: Operasi ini hanya diizinkan untuk Admin.");
  }
}
