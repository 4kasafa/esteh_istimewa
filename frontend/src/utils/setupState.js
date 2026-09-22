// State setup awal operasional yang disimpan di localStorage.
// Banner Alert Wizard & auto-open SetupWizard hanya tampil jika state ini
// hilang atau invalid (JSON corrupt / completed tidak true).
// completed=true sendiri sudah cukup menandakan setup selesai (setup tidak wajib diisi penuh).
export const SETUP_STATE_KEY = "esteh_setup_state";

// Flag lama & temporary yang dibersihkan setelah setup tercatat valid.
const LEGACY_COMPLETED_KEY = "esteh_wizard_completed";
const TEMP_SKIPPED_KEY = "esteh_wizard_skipped";
const TEMP_BANNER_KEY = "esteh_banner_dismissed";

function sanitizeNames(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

export function readSetupState() {
  try {
    const raw = localStorage.getItem(SETUP_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    if (parsed.completed !== true && parsed.completed !== "true") return null;
    return {
      version: parsed.version || 1,
      completed: true,
      cabang: sanitizeNames(parsed.cabang),
      staff: sanitizeNames(parsed.staff),
      bahan: sanitizeNames(parsed.bahan),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : null,
    };
  } catch {
    return null;
  }
}

export function isSetupStateValid() {
  return readSetupState() !== null;
}

export function saveSetupState({ cabang = [], staff = [], bahan = [] } = {}) {
  const normalized = {
    version: 1,
    completed: true,
    cabang: sanitizeNames(cabang),
    staff: sanitizeNames(staff),
    bahan: sanitizeNames(bahan),
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SETUP_STATE_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore storage errors */
  }
  return normalized;
}

export function clearTempSetupData() {
  try {
    localStorage.removeItem(LEGACY_COMPLETED_KEY);
    sessionStorage.removeItem(TEMP_SKIPPED_KEY);
    sessionStorage.removeItem(TEMP_BANNER_KEY);
  } catch {
    /* ignore storage errors */
  }
}
