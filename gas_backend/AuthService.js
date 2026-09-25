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

function getSessionProperties_() {
  return PropertiesService.getScriptProperties();
}

function putSessionCache_(token, sessionData) {
  if (!token || !sessionData) return;
  const raw = JSON.stringify(sessionData);

  const cache = getSessionCache_();
  if (cache) {
    try {
      const ttl = APP_CONFIG.CACHE_TTL_SECONDS || 21600;
      const sessionKey = (APP_CONFIG.SESSION_CONFIG?.CACHE_PREFIX || APP_CONFIG.CACHE_PREFIX || "esteh_sess_") + token;
      cache.put(sessionKey, raw, ttl);
    } catch (err) {
      console.error("Gagal menyimpan sesi ke cache:", err);
    }
  }

  try {
    getSessionProperties_().setProperty(
      (APP_CONFIG.SESSION_CONFIG?.PROPERTY_PREFIX || "sess_") + token,
      raw
    );
  } catch (err) {
    console.error("Gagal menyimpan sesi ke Properties:", err);
  }
}

function getCachedSession_(token) {
  if (!token) return null;
  const cacheKey = (APP_CONFIG.SESSION_CONFIG?.CACHE_PREFIX || APP_CONFIG.CACHE_PREFIX || "esteh_sess_") + token;
  const propKey = (APP_CONFIG.SESSION_CONFIG?.PROPERTY_PREFIX || "sess_") + token;

  try {
    const cache = getSessionCache_();
    if (cache) {
      const raw = cache.get(cacheKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.token && data.username) return data;
      }
    }
  } catch (err) {
    console.error("Gagal membaca sesi dari cache:", err);
  }

  // L2: PropertiesService permanen (tahan >6 jam & redeploy). Token permanen: 0 cek expiresAt.
  try {
    const rawProp = getSessionProperties_().getProperty(propKey);
    if (rawProp) {
      const data = JSON.parse(rawProp);
      if (data && data.token && data.username) {
        putSessionCache_(token, data); // auto-warm L1
        return data;
      }
    }
  } catch (err) {
    console.error("Gagal membaca sesi dari Properties:", err);
  }
  return null;
}

function removeSessionCache_(token) {
  if (!token) return;
  try {
    const cache = getSessionCache_();
    if (cache) cache.remove((APP_CONFIG.SESSION_CONFIG?.CACHE_PREFIX || APP_CONFIG.CACHE_PREFIX || "esteh_sess_") + token);
  } catch (err) {
    console.error("Gagal menghapus sesi dari cache:", err);
  }
  try {
    getSessionProperties_().deleteProperty((APP_CONFIG.SESSION_CONFIG?.PROPERTY_PREFIX || "sess_") + token);
  } catch (err) {
    console.error("Gagal menghapus sesi dari Properties:", err);
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

  // ponytail: sesi permanen — L1 Cache (21600s) + L2 Properties (tanpa TTL).
  const token = Utilities.getUuid();
  const expireAtStr = "PERMANENT";

  const resolvedUsername = matchedUser["NAMA / USERNAME"] || matchedUser.USERNAME || matchedUser.username || matchedUser.Email || username;
  const rawRole = String(matchedUser.ROLE || matchedUser.role || "staff").toLowerCase();
  const resolvedRole = rawRole.includes("admin") ? "admin" : "staff";
  const resolvedNama = matchedUser.NAMA || matchedUser["NAMA / USERNAME"] || matchedUser.nama || resolvedUsername;
  const resolvedTelepon = matchedUser["NO. TELEPON"] || matchedUser.TELEPON || matchedUser.telepon || "";

  const sessionData = {
    token: token,
    username: resolvedUsername,
    role: resolvedRole,
    nama: resolvedNama,
    telepon: resolvedTelepon,
    expiresAt: expireAtStr
  };

  // ponytail: dual-layer L1 Cache + L2 Properties permanen.
  putSessionCache_(token, sessionData);

  return jsonResponse_(true, {
    token: token,
    expiresAt: expireAtStr,
    user: {
      username: resolvedUsername,
      nama: resolvedNama,
      role: resolvedRole,
      telepon: resolvedTelepon
    }
  }, "Login berhasil");
}

function handleLogout_(session) {
  if (!session || !session.token) {
    return jsonResponse_(false, null, "Sesi tidak ditemukan.");
  }

  removeSessionCache_(session.token);

  return jsonResponse_(true, null, "Logout berhasil.");
}

function requireAuthSession_(e, payload) {
  const token = getBearerToken_(e, payload);
  if (!token) {
    throw new Error("Unauthorized: Bearer token tidak disertakan.");
  }

  // Murni cache — sheet tak pernah dibuka di jalur auth.
  const cached = getCachedSession_(token);
  if (!cached) {
    throw new Error("Unauthorized: sesi berakhir, silakan login ulang");
  }

  return {
    token: cached.token,
    username: cached.username,
    role: String(cached.role || "staff").toLowerCase(),
    nama: cached.nama || cached.username,
    telepon: cached.telepon || ""
  };
}

function ensureAdmin_(session) {
  if (!session || String(session.role || "").toLowerCase() !== "admin") {
    throw new Error("Forbidden: Operasi ini hanya diizinkan untuk Admin.");
  }
}

/**
 * Ping ringan untuk validasi sesi — tanpa buka Spreadsheet sama sekali
 * (auth cache-hit = 0 I/O). Pengganti read_reports limit:1 yang berat.
 */
function handlePing_(session) {
  return jsonResponse_(true, {
    ok: true,
    user: {
      username: session.username,
      nama: session.nama || session.username,
      role: session.role
    }
  }, "OK");
}
