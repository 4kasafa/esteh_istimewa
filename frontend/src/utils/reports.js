import { DENOMINATIONS_DATA } from "../constants/forms";
import { parseLooseNumber, parseTimestamp, toPeriodValue } from "./formatters";

const REPORT_TIMESTAMP_KEYS = ["TIME STAMP INPUT", "TIMESTAMP INPUT", "NO TRANSAKSI"];
const REPORT_ARUS_DANA_KEYS = ["ARUS DANA", "ARUS_DANA"];
const REPORT_KASIR_KEYS = ["KASIR", "NAMA KASIR"];
const REPORT_TOTAL_NOTA_KEYS = ["TOTAL NOTA", "TOTAL_NOTA"];
const REPORT_UANG_MASUK_KEYS = ["UANG MASUK", "UNAG MASUK", "UANG_MASUK", "INPUT KASIR", "KASIR INPUT"];
const REPORT_INPUT_KASIR_KEYS = ["INPUT KASIR", "KASIR INPUT"];
const REPORT_PENGELUARAN_KEYS = ["PENGELUARAN", "UANG KELUAR"];
const REPORT_SELISIH_KEYS = ["SELISIH"];
const REPORT_GELAS_LAKU_KEYS = ["GELAS LAKU", "GELAS_LAKU"];
const REPORT_GELAS_AWAL_KEYS = ["GELAS AWAL", "GELAS_AWAL", "STOK AWAL GELAS"];
const REPORT_GELAS_SISA_KEYS = ["GELAS SISA", "GELAS_SISA", "STOK AKHIR GELAS"];
const REPORT_GELAS_RUSAK_KEYS = ["GELAS RUSAK", "GELAS_RUSAK"];
const REPORT_GELAS_MASUK_KEYS = ["GELAS MASUK", "GELAS_MASUK"];
const REPORT_ESBATU_DEPO_KEYS = ["ES BATU DEPO", "ESBATU DEPO", "ES BATU_DEPO", "ES BATU DEPO (KG)"];
const REPORT_ESBATU_BELI_KEYS = ["ES BATU BELI", "ESBATU BELI", "ES BATU BELI (KG)"];
const REPORT_GULA_KEYS = ["GULA", "PEMAKAIAN GULA"];
const REPORT_TEH_KEYS = ["TEH", "PEMAKAIAN TEH"];

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

export function sanitizeReportRows(rows) {
  return rows
    .map((rawItem) => {
      const raw = { ...rawItem };
      const timestampStr = getField(raw, REPORT_TIMESTAMP_KEYS);
      const timestamp = parseTimestamp(timestampStr);
      const arusDana = String(getField(raw, REPORT_ARUS_DANA_KEYS, "Tanpa Area")).trim() || "Tanpa Area";
      const kasir = String(getField(raw, REPORT_KASIR_KEYS, "Tanpa Kasir")).trim() || "Tanpa Kasir";
      const denomination = buildDenominationList(raw);

      const gelasAwal = getNumber(raw, REPORT_GELAS_AWAL_KEYS);
      const gelasSisa = getNumber(raw, REPORT_GELAS_SISA_KEYS);
      const gelasRusak = getNumber(raw, REPORT_GELAS_RUSAK_KEYS);
      const gelasLaku = getNumber(raw, REPORT_GELAS_LAKU_KEYS) || Math.max(0, gelasAwal - (gelasSisa + gelasRusak));

      let totalNota = getNumber(raw, REPORT_TOTAL_NOTA_KEYS);
      if (!totalNota && gelasLaku > 0) {
        totalNota = gelasLaku * 4000;
      }

      let uangMasuk = getNumber(raw, REPORT_UANG_MASUK_KEYS);
      if (!uangMasuk && totalNota > 0) {
        uangMasuk = totalNota;
      }

      const pengeluaran = getNumber(raw, REPORT_PENGELUARAN_KEYS);
      const selisih = getNumber(raw, REPORT_SELISIH_KEYS) || (uangMasuk - totalNota);

      raw["GELAS LAKU"] = gelasLaku;
      raw["TOTAL NOTA"] = totalNota;
      raw["UANG MASUK"] = uangMasuk;
      raw["UNAG MASUK"] = uangMasuk;
      raw["PENGELUARAN"] = pengeluaran;
      raw["SELISIH"] = selisih;

      return {
        id: timestampStr ? String(timestampStr).trim() : "",
        raw,
        timestamp,
        arusDana,
        kasir,
        totalNota,
        uangMasuk,
        inputKasir: getNumber(raw, REPORT_INPUT_KASIR_KEYS) || uangMasuk,
        pengeluaran,
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
    })
    .filter((item) => item.timestamp);
}

export function getReportArusDanaOptions(rows) {
  return ["semua", ...Array.from(new Set(rows.map((item) => item.arusDana))).sort((a, b) => a.localeCompare(b))];
}

export function getReportKasirOptions(rows) {
  return ["semua", ...Array.from(new Set(rows.map((item) => item.kasir))).sort((a, b) => a.localeCompare(b))];
}

export function applyReportFilters(rows, { range = "month", period = toPeriodValue(), date = "", arusDana = "semua", kasir = "semua" } = {}) {
  const now = new Date();
  const monthRef = parsePeriod(period);

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

    if (arusDana !== "semua" && item.arusDana !== arusDana) return false;
    if (kasir !== "semua" && item.kasir !== kasir) return false;
    return true;
  });

  return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function buildReportStats(rows) {
  const stats = {
    gelasAwal: 0,
    gelasSisa: 0,
    gelasLaku: 0,
    gelasRusak: 0,
    gelasMasuk: 0,
    esBatuDepo: 0,
    esBatuBeli: 0,
    gula: 0,
    teh: 0,
    uangLebih: 0,
    uangKurang: 0,
    pengeluaran: 0,
    count: rows.length,
  };

  rows.forEach((item) => {
    stats.gelasAwal += item.gelasAwal || 0;
    stats.gelasSisa += item.gelasSisa || 0;
    stats.gelasLaku += item.gelasLaku;
    stats.gelasRusak += item.gelasRusak;
    stats.gelasMasuk += item.gelasMasuk;
    stats.esBatuDepo += item.esBatuDepo;
    stats.esBatuBeli += item.esBatuBeli;
    stats.gula += item.gula;
    stats.teh += item.teh;
    stats.pengeluaran += item.pengeluaran;

    // Hitung selisih per transaksi: Uang Masuk - Total Nota
    const selisih = item.uangMasuk - item.totalNota;
    if (selisih > 0) {
      stats.uangLebih += selisih;
    } else if (selisih < 0) {
      stats.uangKurang += Math.abs(selisih);
    }
  });

  return {
    ...stats,
    gula: Number(stats.gula.toFixed(2)),
    teh: Number(stats.teh.toFixed(2)),
    gelasTotal: stats.gelasLaku,
    esBatuTotal: stats.esBatuDepo + stats.esBatuBeli,
  };
}

export function buildReportTableData(rows) {
  return rows.map((item) => ({
    id: item.id,
    row: item.raw,
    denomination: item.denomination,
  }));
}
