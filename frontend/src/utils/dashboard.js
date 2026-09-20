import { parseLooseNumber, parseTimestamp, toPeriodValue, toShortIndonesianDay } from "./formatters";

function getArusDana(row) {
  return String(row.CABANG || row["ARUS DANA"] || row.ARUS_DANA || "Tanpa Area").trim() || "Tanpa Area";
}

function getAmount(row) {
  const explicit = parseLooseNumber(row["TOTAL PENJUALAN"] || row["UANG MASUK"] || row["UNAG MASUK"] || row["TOTAL NOTA"]);
  if (explicit > 0) return explicit;
  const setoran = parseLooseNumber(row["UANG SETORAN"]);
  const pengeluaran = parseLooseNumber(row["TOTAL PENGELUARAN"] || row.PENGELUARAN);
  return setoran + pengeluaran;
}

function getTimestamp(row) {
  const tsStr = row.TANGGAL
    ? (row.TANGGAL + " " + (row["WAKTU INPUT"] || "00:00:00"))
    : (row["TIME STAMP INPUT"] || row["TIMESTAMP INPUT"] || row["NO TRANSAKSI"] || row["ID TRANSAKSI"]);
  return parseTimestamp(tsStr) || new Date();
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parsePeriod(period) {
  const [year, month] = String(period || "").split("-").map(Number);
  if (!year || !month) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  return { year, month: month - 1 };
}

function colorByIndex(index) {
  const palette = ["#2B9348", "#F6C945", "#1B6B93", "#E07A5F", "#8E7DBE", "#2A9D8F", "#D62828", "#4E8098"];
  return palette[index % palette.length];
}

export function filterRows(rows, keyword) {
  const query = String(keyword || "").trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
}

export function buildKpi(reportRows, dbRows) {
  const totalTransaksi = reportRows.length;
  const totalUangMasuk = dbRows.reduce((sum, row) => sum + getAmount(row), 0);
  const totalPengeluaran = dbRows.reduce((sum, row) => sum + parseLooseNumber(row["TOTAL PENGELUARAN"] || row.PENGELUARAN), 0);
  const selisihLebih = dbRows.filter((row) => String(row["STATUS SELISIH"] || "").toUpperCase() === "LEBIH").length;

  return { totalTransaksi, totalUangMasuk, totalPengeluaran, selisihLebih };
}

export function buildExecutiveKpi(rows) {
  let totalSales = 0;
  let totalExpenses = 0;
  let totalDeposit = 0;
  let totalCups = 0;

  const branchSales = new Map();
  const daySet = new Set();

  rows.forEach((item) => {
    const raw = item.raw || item;
    const amount = getAmount(raw);
    const expense = parseLooseNumber(raw["TOTAL PENGELUARAN"] || raw.PENGELUARAN);
    const deposit = parseLooseNumber(raw["UANG SETORAN"] || (amount - expense));
    const cups = parseLooseNumber(raw["GELAS TERPAKAI"] || raw["GELAS LAKU"] || raw["GELAS CUP TERPAKAI"] || raw["GELAS CUP_TERPAKAI"]);

    totalSales += amount;
    totalExpenses += expense;
    totalDeposit += deposit;
    totalCups += cups;

    const b = getArusDana(raw);
    branchSales.set(b, (branchSales.get(b) || 0) + amount);

    const dt = item.timestamp || getTimestamp(raw);
    if (dt) daySet.add(dateKey(dt));
  });

  const sortedBranches = Array.from(branchSales.entries()).sort((a, b) => b[1] - a[1]);
  const topBranch = sortedBranches[0]?.[0] || "-";
  const topBranchSales = sortedBranches[0]?.[1] || 0;
  const avgDaily = daySet.size ? totalSales / daySet.size : totalSales;

  return {
    totalSales,
    totalExpenses,
    totalDeposit,
    totalCups,
    topBranch,
    topBranchSales,
    avgDaily,
  };
}

export function buildTrendData(dbRows) {
  const map = new Map();
  dbRows.forEach((row) => {
    const dt = getTimestamp(row);
    if (!dt) return;
    const key = dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    map.set(key, (map.get(key) || 0) + getAmount(row));
  });

  return Array.from(map.entries()).map(([label, value]) => ({ label, value })).slice(-8);
}

export function buildAreaData(dbRows) {
  const map = new Map();
  dbRows.forEach((row) => {
    const area = getArusDana(row);
    map.set(area, (map.get(area) || 0) + getAmount(row));
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export function sanitizeDatabaseRows(rows) {
  return rows
    .map((raw) => {
      const timestamp = getTimestamp(raw);
      const arusDana = getArusDana(raw);
      return {
        raw,
        timestamp,
        arusDana,
        amount: getAmount(raw),
      };
    })
    .filter((item) => item.timestamp);
}

export function getArusDanaOptions(rows) {
  const set = new Set(rows.map((item) => item.arusDana));
  return ["semua", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}

export function applyDashboardFilters(rows, { range = "month", period = toPeriodValue(), date = "", arusDana = "semua" } = {}) {
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
      if (dt.getFullYear() !== monthRef.year || dt.getMonth() !== monthRef.month) return false;
    }

    if (arusDana !== "semua" && item.arusDana.toLowerCase() !== arusDana.toLowerCase()) return false;
    return true;
  });

  return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function buildTotalsByArusDana(rows) {
  const map = new Map();
  rows.forEach((item) => {
    map.set(item.arusDana, (map.get(item.arusDana) || 0) + item.amount);
  });
  return map;
}

export function buildDashboardCards(rows) {
  const totalSales = rows.reduce((sum, item) => sum + item.amount, 0);
  const totalByArusDana = buildTotalsByArusDana(rows);
  const sortedBranches = Array.from(totalByArusDana.entries()).sort((a, b) => b[1] - a[1]);
  const topBranch = sortedBranches[0]?.[0] || "-";
  const topBranchSales = sortedBranches[0]?.[1] || 0;

  const daySet = new Set(rows.map((item) => dateKey(item.timestamp)));
  const avgDaily = daySet.size ? totalSales / daySet.size : totalSales;

  return {
    totalSales,
    topBranch,
    topBranchSales,
    avgDaily,
  };
}

export function buildDonutData(rows) {
  const totalByArusDana = buildTotalsByArusDana(rows);
  const total = Array.from(totalByArusDana.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(totalByArusDana.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      value,
      percent: total ? (value / total) * 100 : 0,
      color: colorByIndex(index),
    }));
}

function buildSeriesDayKeys(range, period, date) {
  const now = new Date();

  if (range === "today") {
    return [dateKey(now)];
  }

  if (range === "last7") {
    const keys = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      keys.push(dateKey(d));
    }
    return keys;
  }

  if (range === "date" && date) {
    const selected = new Date(date);
    if (!Number.isNaN(selected.getTime())) return [dateKey(selected)];
  }

  const { year, month } = parsePeriod(period);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const endDay = isCurrentMonth ? now.getDate() : new Date(year, month + 1, 0).getDate();

  const keys = [];
  for (let day = 1; day <= endDay; day += 1) {
    keys.push(dateKey(new Date(year, month, day)));
  }
  return keys;
}

export function buildLineSeries(rows, { range = "month", period = toPeriodValue(), date = "" } = {}) {
  const keys = buildSeriesDayKeys(range, period, date);
  const amountByDate = new Map();
  rows.forEach((item) => {
    const key = dateKey(item.timestamp);
    amountByDate.set(key, (amountByDate.get(key) || 0) + item.amount);
  });

  return keys.map((key) => {
    const dt = new Date(key);
    return {
      key,
      label: dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      shortLabel: dt.toLocaleDateString("id-ID", { day: "2-digit" }),
      value: amountByDate.get(key) || 0,
    };
  });
}

export function buildAreaPerformance(rows) {
  return buildDonutData(rows).slice(0, 6).map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
  }));
}

export function buildDashboardTableRows(rawRows) {
  const hiddenColumns = new Set([
    "KASIR",
    "INPUT STAFF",
    "STAFF INPUT",
    "STATUS SELISIH",
    "SELISIH",
    "SALDO AKHIR",
  ]);

  return rawRows.map((row) => {
    const source = { ...row };

    if (source["TIME STAMP INPUT"]) {
      source["TIME STAMP INPUT"] = toShortIndonesianDay(source["TIME STAMP INPUT"]);
    } else if (source["TIMESTAMP INPUT"]) {
      source["TIMESTAMP INPUT"] = toShortIndonesianDay(source["TIMESTAMP INPUT"]);
    }

    if (source.STAFF) {
      source.STAFF = String(source.STAFF).trim();
    }

    const keys = Object.keys(source).filter((key) => !hiddenColumns.has(key.toUpperCase()));
    const keteranganIndex = keys.findIndex((key) => key.toUpperCase() === "KETERANGAN");
    if (keteranganIndex >= 0) {
      const [keterangan] = keys.splice(keteranganIndex, 1);
      keys.push(keterangan);
    }

    const ordered = {};
    keys.forEach((key) => {
      ordered[key] = source[key];
    });
    return ordered;
  });
}
