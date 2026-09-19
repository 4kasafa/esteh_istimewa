import { parseTimestamp, toFormattedTimestamp } from "../utils/formatters";
import { INITIAL_KARYAWAN } from "../constants/karyawan";
import { INITIAL_CABANG } from "../constants/cabang";
import { DENOMINATIONS_DATA } from "../constants/forms";

const STORAGE_KEY_REPORTS = "esteh_mock_reports_v7";
const STORAGE_KEY_DATABASE = "esteh_mock_database_v7";
const STORAGE_KEY_KARYAWAN = "esteh_mock_karyawan_v1";
const STORAGE_KEY_CABANG = "esteh_mock_cabang_v1";

function generateInitialReports() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const d = String(yesterday.getDate()).padStart(2, "0");

  return [
    {
      "TIME STAMP INPUT": `${d}-${m}-${y} 08:30:00`,
      "NO TRANSAKSI": `TRX-${y}${m}${d}-001`,
      SHIFT: "Pagi",
      "ARUS DANA": "cabang_01",
      KASIR: "Abu Arfan",
      "GELAS AWAL": 200,
      "GELAS SISA": 48,
      "GELAS RUSAK": 2,
      "GELAS LAKU": 150,
      "GELAS MASUK": 200,
      "ES BATU DEPO": 4,
      "ES BATU BELI": 1,
      TEH: 2,
      GULA: 4,
      PENGELUARAN: 25000,
      KETERANGAN: "Operasional pagi cabang 01",
      "TOTAL NOTA": 600000,
      "UANG MASUK": 600000,
      SELISIH: 0,
      "Rp 100.000": 4,
      "Rp 50.000": 3,
      "Rp 20.000": 2,
      "Rp 10.000": 1,
    },
    {
      "TIME STAMP INPUT": `${d}-${m}-${y} 14:00:00`,
      "NO TRANSAKSI": `TRX-${y}${m}${d}-002`,
      SHIFT: "Siang",
      "ARUS DANA": "cabang_01",
      KASIR: "Fajar",
      "GELAS AWAL": 250,
      "GELAS SISA": 39,
      "GELAS RUSAK": 1,
      "GELAS LAKU": 210,
      "GELAS MASUK": 250,
      "ES BATU DEPO": 5,
      "ES BATU BELI": 2,
      TEH: 3,
      GULA: 5,
      PENGELUARAN: 30000,
      KETERANGAN: "Operasional siang cabang 01",
      "TOTAL NOTA": 840000,
      "UANG MASUK": 840000,
      SELISIH: 0,
      "Rp 100.000": 6,
      "Rp 50.000": 4,
      "Rp 20.000": 2,
    },
    {
      "TIME STAMP INPUT": `${d}-${m}-${y} 09:15:00`,
      "NO TRANSAKSI": `TRX-${y}${m}${d}-003`,
      SHIFT: "Pagi",
      "ARUS DANA": "cabang_02",
      KASIR: "Arief Rahman",
      "GELAS AWAL": 200,
      "GELAS SISA": 25,
      "GELAS RUSAK": 0,
      "GELAS LAKU": 175,
      "GELAS MASUK": 200,
      "ES BATU DEPO": 4,
      "ES BATU BELI": 1,
      TEH: 2,
      GULA: 4,
      PENGELUARAN: 15000,
      KETERANGAN: "Operasional pagi cabang 02",
      "TOTAL NOTA": 700000,
      "UANG MASUK": 700000,
      SELISIH: 0,
      "Rp 100.000": 5,
      "Rp 50.000": 3,
      "Rp 20.000": 2,
      "Rp 10.000": 1,
    },
    {
      "TIME STAMP INPUT": `${d}-${m}-${y} 18:30:00`,
      "NO TRANSAKSI": `TRX-${y}${m}${d}-004`,
      SHIFT: "Sore",
      "ARUS DANA": "cabang_02",
      KASIR: "Arya Ahman",
      "GELAS AWAL": 200,
      "GELAS SISA": 4,
      "GELAS RUSAK": 1,
      "GELAS LAKU": 195,
      "GELAS MASUK": 200,
      "ES BATU DEPO": 4,
      "ES BATU BELI": 1,
      TEH: 2,
      GULA: 4,
      PENGELUARAN: 20000,
      KETERANGAN: "Operasional sore cabang 02",
      "TOTAL NOTA": 780000,
      "UANG MASUK": 780000,
      SELISIH: 0,
      "Rp 100.000": 5,
      "Rp 50.000": 5,
      "Rp 20.000": 1,
      "Rp 10.000": 1,
    },
  ];
}

function generateInitialDatabase() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const d = String(yesterday.getDate()).padStart(2, "0");

  return [
    {
      "TIME STAMP INPUT": `${d}-${m}-${y} 08:30:00`,
      SHIFT: "Pagi",
      "ARUS DANA": "cabang_01",
      KASIR: "Abu Arfan",
      KETERANGAN: "Penjualan pagi cabang 01",
      "UANG MASUK": 600000,
      "TOTAL NOTA": 600000,
      "UANG KELUAR": 25000,
      PENGELUARAN: 25000,
    },
    {
      "TIME STAMP INPUT": `${d}-${m}-${y} 14:00:00`,
      SHIFT: "Siang",
      "ARUS DANA": "cabang_01",
      KASIR: "Fajar",
      KETERANGAN: "Penjualan siang cabang 01",
      "UANG MASUK": 840000,
      "TOTAL NOTA": 840000,
      "UANG KELUAR": 30000,
      PENGELUARAN: 30000,
    },
    {
      "TIME STAMP INPUT": `${d}-${m}-${y} 09:15:00`,
      SHIFT: "Pagi",
      "ARUS DANA": "cabang_02",
      KASIR: "Arief Rahman",
      KETERANGAN: "Penjualan pagi cabang 02",
      "UANG MASUK": 700000,
      "TOTAL NOTA": 700000,
      "UANG KELUAR": 15000,
      PENGELUARAN: 15000,
    },
    {
      "TIME STAMP INPUT": `${d}-${m}-${y} 18:30:00`,
      SHIFT: "Sore",
      "ARUS DANA": "cabang_02",
      KASIR: "Arya Ahman",
      KETERANGAN: "Penjualan sore cabang 02",
      "UANG MASUK": 780000,
      "TOTAL NOTA": 780000,
      "UANG KELUAR": 20000,
      PENGELUARAN: 20000,
    },
  ];
}

function getStored(key, fallbackFn) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = fallbackFn();
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return fallbackFn();
  }
}

function saveStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Mock storage error:", err);
  }
}

function calculateDenomTotal(data) {
  if (!data || typeof data !== "object") return 0;
  return DENOMINATIONS_DATA.reduce((acc, item) => {
    const count = parseInt(data[item.label]) || 0;
    return acc + (count * item.value);
  }, 0);
}

function sanitizeStoredReport(r) {
  const gelasAwal = Number(r["GELAS AWAL"] ?? r["GELAS MASUK"]) || 0;
  const gelasSisa = Number(r["GELAS SISA"]) || 0;
  const gelasRusak = Number(r["GELAS RUSAK"]) || 0;
  const gelasLaku = Number(r["GELAS LAKU"]) || Math.max(0, gelasAwal - (gelasSisa + gelasRusak));
  const autoTotalPenjualan = gelasLaku * 4000;
  const denomTotal = calculateDenomTotal(r);
  const totalNota = autoTotalPenjualan > 0 ? autoTotalPenjualan : (Number(r["TOTAL NOTA"]) || denomTotal);
  const uangMasuk = denomTotal > 0 ? denomTotal : (Number(r["UANG MASUK"] || r["UNAG MASUK"]) || totalNota);
  const pengeluaran = Number(r.PENGELUARAN || r["UANG KELUAR"] || 0);
  const selisih = uangMasuk - totalNota;
  return {
    ...r,
    "GELAS AWAL": gelasAwal,
    "GELAS SISA": gelasSisa,
    "GELAS RUSAK": gelasRusak,
    "GELAS LAKU": gelasLaku,
    "TOTAL NOTA": totalNota,
    "UANG MASUK": uangMasuk,
    "UNAG MASUK": uangMasuk,
    "PENGELUARAN": pengeluaran,
    "SELISIH": selisih,
  };
}

export function handleMockRequest(body) {
  const action = body?.action || "read";

  if (action === "login") {
    const rawIdentifier = String(body.username || body.email || "").trim();
    const identifier = rawIdentifier.toLowerCase();
    const password = String(body.password || "").trim();

    // 1. Akun Dummy Admin: username 'admin', password 'admin'
    if (identifier === "admin") {
      if (password === "admin" || !password || password === "123456") {
        return {
          token: "bypass-admin",
          user: {
            id: "ADM-MOCK",
            nama: "Admin Istimewa",
            username: "admin",
            email: "admin@estehistimewa.com",
            role: "admin",
            lastTodayReport: "",
          },
        };
      }
      throw new Error("Password salah untuk username admin (password: admin)");
    }

    // 2. Akun Dummy Staff: username 'joko', password 'joko'
    if (identifier === "joko") {
      if (password === "joko" || !password) {
        return {
          token: "bypass-staff",
          user: {
            id: "STAFF-JOKO",
            nama: "Joko",
            username: "joko",
            email: "joko@estehistimewa.com",
            role: "staff",
            cabang: "cabang_01",
            lastTodayReport: "",
          },
        };
      }
      throw new Error("Password salah untuk username joko (password: joko)");
    }

    // Fallbacks untuk tes lama atau bypass email
    if (identifier.includes("admin") || identifier === "owner@estehistimewa.com") {
      return {
        token: "bypass-admin",
        user: {
          id: "ADM-MOCK",
          nama: "Admin Istimewa",
          username: identifier,
          email: body.email || `${identifier}@estehistimewa.com`,
          role: "admin",
          lastTodayReport: "",
        },
      };
    }

    if (identifier.includes("kasir") || identifier.includes("staff")) {
      return {
        token: "bypass-staff",
        user: {
          id: "STAFF-MOCK",
          nama: identifier.split("@")[0] || "Staff Istimewa",
          username: identifier,
          email: body.email || `${identifier}@estehistimewa.com`,
          role: "staff",
          lastTodayReport: "",
        },
      };
    }

    throw new Error("Username atau password salah. Silakan gunakan admin / admin atau joko / joko.");
  }

  if (action === "read") {
    const rawReports = getStored(STORAGE_KEY_REPORTS, generateInitialReports);
    const reports = rawReports.map(sanitizeStoredReport);
    if (body?.id) {
      return reports.filter((r) => r["NO TRANSAKSI"] === body.id || r["TIME STAMP INPUT"] === body.id);
    }
    return reports;
  }

  if (action === "read_database") {
    return getStored(STORAGE_KEY_DATABASE, generateInitialDatabase);
  }

  if (action === "create") {
    const rawReports = getStored(STORAGE_KEY_REPORTS, generateInitialReports);
    const reports = rawReports.map(sanitizeStoredReport);
    const database = getStored(STORAGE_KEY_DATABASE, generateInitialDatabase);
    const id = `TRX-MOCK-${Date.now()}`;
    const timestamp = toFormattedTimestamp();

    const rawData = body.data || {};
    const gelasAwal = Number(rawData["GELAS AWAL"] ?? rawData["GELAS MASUK"]) || 0;
    const gelasSisa = Number(rawData["GELAS SISA"]) || 0;
    const gelasRusak = Number(rawData["GELAS RUSAK"]) || 0;
    const gelasLaku = Number(rawData["GELAS LAKU"]) || Math.max(0, gelasAwal - (gelasSisa + gelasRusak));
    const autoTotalPenjualan = gelasLaku * 4000;
    const denomTotal = calculateDenomTotal(rawData);
    const totalNota = autoTotalPenjualan > 0 ? autoTotalPenjualan : (Number(rawData["TOTAL NOTA"]) || denomTotal);
    const uangMasuk = denomTotal > 0 ? denomTotal : (Number(rawData["UANG MASUK"] || rawData["UNAG MASUK"]) || totalNota);
    const pengeluaran = Number(rawData.PENGELUARAN || rawData["UANG KELUAR"] || 0);
    const selisih = uangMasuk - totalNota;

    const newReport = {
      ...rawData,
      "TIME STAMP INPUT": timestamp,
      "NO TRANSAKSI": id,
      "GELAS AWAL": gelasAwal,
      "GELAS SISA": gelasSisa,
      "GELAS RUSAK": gelasRusak,
      "GELAS LAKU": gelasLaku,
      "TOTAL NOTA": totalNota,
      "UANG MASUK": uangMasuk,
      "UNAG MASUK": uangMasuk,
      "PENGELUARAN": pengeluaran,
      "SELISIH": selisih,
    };

    reports.unshift(newReport);
    saveStored(STORAGE_KEY_REPORTS, reports);

    database.unshift({
      "TIME STAMP INPUT": timestamp,
      SHIFT: newReport.SHIFT || "Pagi",
      "ARUS DANA": newReport["ARUS DANA"] || "cabang_01",
      KASIR: newReport.KASIR || "User",
      KETERANGAN: newReport.KETERANGAN || "",
      "UANG MASUK": uangMasuk,
      "TOTAL NOTA": totalNota,
      "UANG KELUAR": pengeluaran,
      PENGELUARAN: pengeluaran,
      "SELISIH": selisih,
      "STATUS SELISIH": selisih > 0 ? "LEBIH" : selisih < 0 ? "KURANG" : "PAS",
    });
    saveStored(STORAGE_KEY_DATABASE, database);

    return newReport;
  }

  if (action === "update") {
    const rawReports = getStored(STORAGE_KEY_REPORTS, generateInitialReports);
    const reports = rawReports.map(sanitizeStoredReport);
    const patch = body.data || {};

    const updated = reports.map((r) => {
      if (r["NO TRANSAKSI"] === body.id || r["TIME STAMP INPUT"] === body.id) {
        const merged = { ...r, ...patch };
        const gelasAwal = Number(merged["GELAS AWAL"] ?? merged["GELAS MASUK"]) || 0;
        const gelasSisa = Number(merged["GELAS SISA"]) || 0;
        const gelasRusak = Number(merged["GELAS RUSAK"]) || 0;
        const gelasLaku = Number(merged["GELAS LAKU"]) || Math.max(0, gelasAwal - (gelasSisa + gelasRusak));
        const autoTotalPenjualan = gelasLaku * 4000;
        const denomTotal = calculateDenomTotal(merged);
        const totalNota = autoTotalPenjualan > 0 ? autoTotalPenjualan : (Number(merged["TOTAL NOTA"]) || denomTotal);
        const uangMasuk = denomTotal > 0 ? denomTotal : (Number(merged["UANG MASUK"] || merged["UNAG MASUK"]) || totalNota);
        const pengeluaran = Number(merged.PENGELUARAN || merged["UANG KELUAR"] || 0);
        const selisih = uangMasuk - totalNota;

        return {
          ...merged,
          "GELAS AWAL": gelasAwal,
          "GELAS SISA": gelasSisa,
          "GELAS RUSAK": gelasRusak,
          "GELAS LAKU": gelasLaku,
          "TOTAL NOTA": totalNota,
          "UANG MASUK": uangMasuk,
          "UNAG MASUK": uangMasuk,
          "PENGELUARAN": pengeluaran,
          "SELISIH": selisih,
        };
      }
      return r;
    });
    saveStored(STORAGE_KEY_REPORTS, updated);
    return { success: true };
  }

  if (action === "create_database") {
    const database = getStored(STORAGE_KEY_DATABASE, generateInitialDatabase);
    const item = body.data || {};
    const nominal = Number(item["UANG KELUAR"] || item.PENGELUARAN || 0);
    database.unshift({
      "TIME STAMP INPUT": item["TIMESTAMP INPUT"] || toFormattedTimestamp(),
      SHIFT: item.SHIFT || "Pagi",
      "ARUS DANA": item["ARUS DANA"] || "cabang_01",
      KASIR: item.KASIR || "User",
      KETERANGAN: item.KETERANGAN || "Kas Keluar",
      "UANG MASUK": 0,
      "TOTAL NOTA": 0,
      "UANG KELUAR": nominal,
      PENGELUARAN: nominal,
    });
    saveStored(STORAGE_KEY_DATABASE, database);
    return { success: true };
  }

  if (action === "read_karyawan") {
    return getStored(STORAGE_KEY_KARYAWAN, () => INITIAL_KARYAWAN);
  }

  if (action === "logout") {
    clearTodayStaffReports();
    return { success: true };
  }

  return [];
}

export function clearTodayStaffReports() {
  try {
    const now = new Date();

    const isEntryToday = (entry) => {
      if (!entry) return false;
      const ts = String(entry["TIME STAMP INPUT"] || entry["TIMESTAMP INPUT"] || "");
      if (!ts) return false;
      const parsed = parseTimestamp(ts);
      if (parsed) {
        return (
          parsed.getFullYear() === now.getFullYear() &&
          parsed.getMonth() === now.getMonth() &&
          parsed.getDate() === now.getDate()
        );
      }
      const d = String(now.getDate()).padStart(2, "0");
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const y = now.getFullYear();
      return ts.startsWith(`${d}-${m}-${y}`);
    };

    ["esteh_mock_reports_v5", "esteh_mock_reports_v6", "esteh_mock_reports_v7"].forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter((r) => !isEntryToday(r));
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch (err) {
        void err;
      }
    });

    ["esteh_mock_database_v5", "esteh_mock_database_v6", "esteh_mock_database_v7"].forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter((item) => !isEntryToday(item));
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch (err) {
        void err;
      }
    });

    localStorage.removeItem("gas_last_today_report");
    const rawUser = localStorage.getItem("gas_user");
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (u.lastTodayReport) {
          u.lastTodayReport = "";
          localStorage.setItem("gas_user", JSON.stringify(u));
        }
      } catch (err) {
        void err;
      }
    }
  } catch (err) {
    console.error("Failed to clear today staff reports:", err);
  }
}

// Reset laporan hari ini saat inisialisasi agar demo siap dari nol
clearTodayStaffReports();

export function getMockKaryawan() {
  return getStored(STORAGE_KEY_KARYAWAN, () => INITIAL_KARYAWAN);
}

export function addMockKaryawan(newKaryawan) {
  const current = getMockKaryawan();
  const updated = [newKaryawan, ...current];
  saveStored(STORAGE_KEY_KARYAWAN, updated);
  return updated;
}

export function getMockCabang() {
  return getStored(STORAGE_KEY_CABANG, () => INITIAL_CABANG);
}

export function addMockCabang(newCabang) {
  const current = getMockCabang();
  const updated = [...current, newCabang];
  saveStored(STORAGE_KEY_CABANG, updated);
  return updated;
}
