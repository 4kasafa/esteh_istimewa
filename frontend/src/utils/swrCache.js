const PREFIX = "esteh_swr_";

// ponytail: semua akses dibungkus try/catch — localStorage bisa penuh,
// diblokir (private mode), atau isinya korup. Gagal = pakai default, bukan crash.
export function getSwrCache(key, defaultVal = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return defaultVal;
    const parsed = JSON.parse(raw);
    return parsed?.data !== undefined ? parsed.data : defaultVal;
  } catch {
    return defaultVal;
  }
}

export function setSwrCache(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn("Storage quota exceeded or disabled:", e);
  }
}

export function removeSwrCache(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // storage tidak tersedia — tidak ada yang perlu dihapus
  }
}
