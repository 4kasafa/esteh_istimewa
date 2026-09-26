import { DENOMINATIONS_DATA } from "../constants/forms";
import { formatTimestamp, parseLooseNumber, parseTimestamp, toPeriodValue } from "./formatters";

const REPORT_TIMESTAMP_KEYS = ["TIME STAMP INPUT", "TIMESTAMP INPUT", "TANGGAL", "NO TRANSAKSI", "ID TRANSAKSI"];
const REPORT_ARUS_DANA_KEYS = ["CABANG", "ARUS DANA", "ARUS_DANA"];
const REPORT_STAFF_KEYS = ["STAFF", "NAMA STAFF"];
const REPORT_TOTAL_NOTA_KEYS = ["TOTAL PENJUALAN", "TOTAL NOTA", "TOTAL_NOTA"];
const REPORT_PENGELUARAN_KEYS = ["TOTAL PENGELUARAN", "PENGELUARAN", "UANG KELUAR"];
const REPORT_GELAS_LAKU_KEYS = ["GELAS TERPAKAI", "GELAS LAKU", "GELAS_LAKU"];
const REPORT_GELAS_AWAL_KEYS = ["GELAS AWAL", "GELAS_AWAL", "STOK AWAL GELAS"];
const REPORT_GELAS_SISA_KEYS = ["GELAS SISA", "GELAS_SISA", "STOK AKHIR GELAS"];
const REPORT_GELAS_RUSAK_KEYS = ["GELAS RUSAK", "GELAS_RUSAK"];
const REPORT_GELAS_MASUK_KEYS = ["GELAS MASUK", "GELAS_MASUK"];
const REPORT_ESBATU_DEPO_KEYS = ["ES BATU DEPO", "ESBATU DEPO", "ES BATU_DEPO"];
const REPORT_ESBATU_BELI_KEYS = ["ES BATU BELI", "ESBATU BELI", "ES BATU TERPAKAI"];
const REPORT_GULA_KEYS = ["GULA", "GULA TERPAKAI", "PEMAKAIAN GULA"];
const REPORT_TEH_KEYS = ["TEH", "TEH TERPAKAI", "PEMAKAIAN TEH"];

function getField(row, keys, fallback = "") {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return fallback;
}

function getNumber(row, keys) {
  return parseLooseNumber(getField(row, keys));
}

function parsePeriod(period) {
  const [year, month] = String(period || "").split("-").map(Number);
  if (!year || !month) return null;
  return { year, month: month - 1 };
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildDenominationList(rawRow) {
  return DENOMINATIONS_DATA.map((item) => ({
    label: item.label,
    value: parseLooseNumber(rawRow[item.label]),
  })).filter((item) => item.value > 0);
}

export function extractRowTimestamp(raw) {
  if (!raw || typeof raw !== "object") return new Date();

  // 1. Coba kombinasi TANGGAL dan WAKTU INPUT terlebih dahulu
  const rawTanggal = raw.TANGGAL || raw.tanggal || raw.Tgl || raw.tgl;
  const rawWaktu = raw["WAKTU INPUT"] || raw["WAKTU"] || raw.waktuInput || raw.waktu || "";
  if (rawTanggal) {
    let cleanTanggal = String(rawTanggal).trim();
    if (/^\d{4}-\d{2}-\d{2}\b/.test(cleanTanggal)) {
      cleanTanggal = cleanTanggal.substring(0, 10);
    }
    let cleanWaktu = String(rawWaktu).trim();
    if (cleanWaktu.includes("1899-12-30")) {
      cleanWaktu = cleanWaktu.replace(/.*1899-12-30\s*/, "");
    }
    const combined = `${cleanTanggal} ${cleanWaktu}`.trim();
    const parsedCombined = parseTimestamp(combined);
    if (parsedCombined) return parsedCombined;

    const parsedTgl = parseTimestamp(cleanTanggal);
    if (parsedTgl) return parsedTgl;
  }

  // 2. Coba field-field kandidat secara berurutan
  const candidateKeys = [
    "TIME STAMP INPUT",
    "TIMESTAMP INPUT",
    "TIMESTAMP",
    "TIME STAMP",
    "TANGGAL",
    "tanggal",
    "NO TRANSAKSI",
    "ID TRANSAKSI",
    "id",
  ];

  for (const key of candidateKeys) {
    const val = raw[key];
    if (val !== undefined && val !== null && val !== "") {
      const parsed = parseTimestamp(val);
      if (parsed) return parsed;
    }
  }

  return new Date();
}

export function sanitizeReportRows(rows) {
  return rows
    .map((rawItem) => {
      const raw = { ...rawItem };
      const rawTimestampStr = getField(raw, REPORT_TIMESTAMP_KEYS, "");
      const timestamp = extractRowTimestamp(raw);
      if (rawTimestampStr && (!raw["TIME STAMP INPUT"] || String(raw["TIME STAMP INPUT"]).includes("1899-12-30"))) {
        raw["TIME STAMP INPUT"] = formatTimestamp(timestamp);
      }
      const arusDana = String(getField(raw, REPORT_ARUS_DANA_KEYS, "cabang_01")).trim() || "cabang_01";
      const staff = String(getField(raw, REPORT_STAFF_KEYS, "Staff")).trim() || "Staff";
      const denomination = buildDenominationList(raw);

      const gelasAwal = getNumber(raw, REPORT_GELAS_AWAL_KEYS);
      const gelasSisa = getNumber(raw, REPORT_GELAS_SISA_KEYS);
      const gelasRusak = getNumber(raw, REPORT_GELAS_RUSAK_KEYS);
      const gelasLaku = getNumber(raw, REPORT_GELAS_LAKU_KEYS) || Math.max(0, gelasAwal - (gelasSisa + gelasRusak));

      const pengeluaran = getNumber(raw, REPORT_PENGELUARAN_KEYS);
      const rawSetoran = getField(raw, ["UANG SETORAN"]);
      let setoran = 0;
      if (rawSetoran !== "") {
        setoran = parseLooseNumber(rawSetoran);
      } else {
        const fallbackSetoran = getField(raw, ["UANG MASUK", "UNAG MASUK"]);
        setoran = fallbackSetoran !== "" ? parseLooseNumber(fallbackSetoran) : 0;
      }

      // ponytail: baris kas keluar mandiri tetap Uang Masuk 0 — jangan fallback jadi omset.
      const isExpenseOnly = String(raw["JENIS TRANSAKSI"] || "").toLowerCase() === "pengeluaran";
      let totalNota = getNumber(raw, REPORT_TOTAL_NOTA_KEYS);
      if (!totalNota && !isExpenseOnly) {
        totalNota = setoran + pengeluaran;
      }

      const uangSetoran = setoran;
      const selisih = 0; // Selisih dihapus dari sistem baru

      raw["GELAS AWAL"] = gelasAwal;
      raw["GELAS SISA"] = gelasSisa;
      raw["GELAS TERPAKAI"] = gelasLaku;
      raw["GELAS LAKU"] = gelasLaku;
      raw["TOTAL PENJUALAN"] = totalNota;
      raw["TOTAL NOTA"] = totalNota;
      raw["UANG SETORAN"] = uangSetoran;
      raw["UANG MASUK"] = totalNota;
      raw["UNAG MASUK"] = totalNota;
      raw["TOTAL PENGELUARAN"] = pengeluaran;
      raw["PENGELUARAN"] = pengeluaran;
      raw["SELISIH"] = selisih;
      raw["CABANG"] = arusDana;
      raw["ARUS DANA"] = arusDana;
      raw["STAFF"] = staff;

      const id = String(getField(raw, ["ID TRANSAKSI", "NO TRANSAKSI", "id"], rawTimestampStr)).trim();

      return {
        id,
        raw,
        timestamp,
        arusDana,
        cabang: arusDana,
        staff,
        totalNota,
        totalPenjualan: totalNota,
        uangSetoran: uangSetoran,
        uangMasuk: totalNota,
        pengeluaran,
        totalPengeluaran: pengeluaran,
        rincianPengeluaran: raw["RINCIAN PENGELUARAN"] || "",
        pengeluaranList: raw.pengeluaranList || [],
        selisih,
        gelasAwal,
        gelasSisa,
        gelasLaku,
        gelasRusak,
        gelasMasuk: getNumber(raw, REPORT_GELAS_MASUK_KEYS),
        esBatuDepo: getNumber(raw, REPORT_ESBATU_DEPO_KEYS),
        esBatuBeli: getNumber(raw, REPORT_ESBATU_BELI_KEYS),
        gula: getNumber(raw, REPORT_GULA_KEYS),
        teh: getNumber(raw, REPORT_TEH_KEYS),
        denomination,
      };
    });
}

export function getReportArusDanaOptions(rows) {
  return [
    "semua",
    ...Array.from(new Set(rows.map((item) => String(item?.arusDana || item?.cabang || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  ];
}

export function getReportStaffOptions(rows) {
  return [
    "semua",
    ...Array.from(new Set(rows.map((item) => String(item?.staff || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  ];
}

export function applyReportFilters(rows, { range = "month", period = toPeriodValue(), date = "", arusDana = "semua", staff = "semua" } = {}) {
  const now = new Date();
  const monthRef = parsePeriod(period);
  const staffFilter = staff;

  const filtered = rows.filter((item) => {
    const dt = item.timestamp;

    if (range === "today") {
      if (!isSameDay(dt, now)) return false;
    } else if (range === "last7") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      if (dt < start || dt > end) return false;
    } else if (range === "date" && date) {
      const selected = new Date(date);
      if (Number.isNaN(selected.getTime()) || !isSameDay(dt, selected)) return false;
    } else if (range === "month") {
      if (!monthRef || dt.getFullYear() !== monthRef.year || dt.getMonth() !== monthRef.month) return false;
    }

    if (arusDana !== "semua" && item.arusDana.toLowerCase() !== arusDana.toLowerCase()) return false;
    if (staffFilter !== "semua") {
      const itemStaff = String(item.staff || "").toLowerCase();
      if (itemStaff !== staffFilter.toLowerCase()) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function buildTransactionList(reportRows = []) {
  const sanitizedReports = sanitizeReportRows(reportRows).filter((item) => item.id);

  // ponytail: baris kas keluar mandiri hanya jadi PENGELUARAN — tanpa phantom PEMASUKAN.
  const reportTransactions = sanitizedReports
    .filter((item) => String(item.raw["JENIS TRANSAKSI"] || "").toLowerCase() !== "pengeluaran")
    .map((item) => ({
      type: "PEMASUKAN",
      id: item.id,
      timestamp: item.timestamp,
      arusDana: item.arusDana,
      cabang: item.cabang,
      staff: item.staff,
      keterangan: item.raw["KETERANGAN"] || (item.raw["KATEGORI"] && item.raw["KATEGORI"] !== "Penjualan" ? item.raw["KATEGORI"] : "Laporan Penjualan Harian"),
      nominal: item.totalPenjualan,
      raw: item.raw,
    }));

  // Use pengeluaranList from report rows (already includes detailed expenses)
  const expenseTransactions = sanitizedReports
    .filter((item) => (item.pengeluaranList || []).length > 0)
    .flatMap((item) =>
      (item.pengeluaranList || []).map((exp, idx) => {
        const ts = item.timestamp;
        const arusDana = item.arusDana;
        const staff = item.staff;
        const nominal = parseLooseNumber(exp.nominal);
        const keterangan = exp.keterangan ? `${exp.tipe} - ${exp.keterangan}` : (exp.tipe || "Pengeluaran");
        const id = `${item.id}-EXP-${idx}`;
        const isStandaloneExpense = String(item.raw["JENIS TRANSAKSI"] || "").toLowerCase() === "pengeluaran";
        return {
          type: "PENGELUARAN",
          id,
          ...(!isStandaloneExpense ? { parentTrxId: item.id } : {}),
          timestamp: ts,
          arusDana,
          cabang: arusDana,
          staff,
          keterangan,
          nominal,
          raw: { ...item.raw, "TYPE_PENGELUARAN": exp.tipe, "NOMINAL": exp.nominal, "KETERANGAN": exp.keterangan }
        };
      })
    );

  const merged = [...reportTransactions, ...expenseTransactions];
  return merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function buildReportTableData(rows) {
  return rows.map((item) => ({
    id: item.id,
    row: item.raw,
    denomination: item.denomination,
  }));
}
