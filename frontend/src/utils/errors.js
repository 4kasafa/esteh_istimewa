const ERROR_MAP = [
  { match: /missing bearer token|unauthorized|token/i, message: "Session tidak valid. Silakan login ulang." },
  { match: /session not found|session.*revoked|token expired/i, message: "Session habis. Silakan login ulang." },
  { match: /forbidden action|admin-only|forbidden role/i, message: "Akses ditolak. Fitur ini khusus admin." },
  { match: /failed to fetch|network|koneksi internet|timeout|abort/i, message: "Gagal terhubung ke server. Cek koneksi dan deploy GAS." },
  { match: /invalid json|bukan json|tidak valid|response.*json/i, message: "Server sedang sinkronisasi data. Silakan coba klik MASUK sekali lagi." },
];

export function mapApiErrorMessage(rawMessage, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
  const text = String(rawMessage || "").trim();
  if (!text) return fallback;

  const matched = ERROR_MAP.find((item) => item.match.test(text));
  return matched ? matched.message : text;
}

export function isAuthErrorMessage(rawMessage) {
  return /session|token|unauthorized|bearer/i.test(String(rawMessage || ""));
}
