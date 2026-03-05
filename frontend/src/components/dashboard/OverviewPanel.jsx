import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Store, TrendingUp, X } from "lucide-react";
import DataTable from "./DataTable";
import DonutChart from "./DonutChart";
import LineChart from "./LineChart";
import BarChart from "./BarChart";
import { toCurrency, toPeriodValue } from "../../utils/formatters";
import {
  applyDashboardFilters,
  buildAreaPerformance,
  buildDashboardCards,
  buildDashboardTableRows,
  buildDonutData,
  buildLineSeries,
  filterRows,
  getArusDanaOptions,
  sanitizeDatabaseRows,
} from "../../utils/dashboard";

function getDefaultTableFilter() {
  return {
    range: "month",
    period: toPeriodValue(),
    date: "",
    arusDana: "semua",
  };
}

function Card({ icon, label, value, hint }) {
  const IconComponent = icon;

  return (
    <div className="rounded-3xl border border-brand-green/10 bg-white p-3 sm:p-4 xl:p-3 2xl:p-4 card-shadow h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted leading-tight wrap-break-word">{label}</p>
          <h3 className="mt-1.5 text-wrap sm:text-xl 2xl:text-2xl font-black tracking-tight text-brand-green-dark leading-tight">{value}</h3>
          <p className="mt-1.5 text-[10px] sm:text-[11px] font-semibold text-brand-muted leading-snug wrap-break-word">{hint}</p>
        </div>
        <div className="rounded-xl bg-brand-green/10 p-2 text-brand-green shrink-0">
          <IconComponent size={16} />
        </div>
      </div>
    </div>
  );
}

export default function OverviewPanel({ dbRows, loading, onRefreshMonthly, onRefreshAll }) {
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedTableFilter, setAppliedTableFilter] = useState(() => getDefaultTableFilter());
  const [draftTableFilter, setDraftTableFilter] = useState(() => getDefaultTableFilter());
  const [submittingFilter, setSubmittingFilter] = useState(false);

  const normalizedRows = useMemo(() => sanitizeDatabaseRows(dbRows), [dbRows]);
  const arusDanaOptions = useMemo(() => getArusDanaOptions(normalizedRows), [normalizedRows]);
  const tableScopedRows = useMemo(() => {
    return applyDashboardFilters(normalizedRows, appliedTableFilter);
  }, [appliedTableFilter, normalizedRows]);

  // Table-first data flow: cards/charts selalu dihitung dari dataset tabel.
  const cards = useMemo(() => buildDashboardCards(tableScopedRows), [tableScopedRows]);
  const donutData = useMemo(() => buildDonutData(tableScopedRows), [tableScopedRows]);
  const arusDanaColorMap = useMemo(() => {
    const map = {};
    donutData.forEach((item) => {
      map[item.label] = item.color;
    });
    return map;
  }, [donutData]);
  const lineSeries = useMemo(() => {
    return buildLineSeries(tableScopedRows, {
      range: appliedTableFilter.range,
      period: appliedTableFilter.period || toPeriodValue(),
      date: appliedTableFilter.date,
    });
  }, [appliedTableFilter.date, appliedTableFilter.period, appliedTableFilter.range, tableScopedRows]);
  const areaData = useMemo(() => buildAreaPerformance(tableScopedRows), [tableScopedRows]);

  const tableRows = useMemo(() => tableScopedRows.map((item) => item.raw), [tableScopedRows]);
  const tableDisplayRows = useMemo(() => buildDashboardTableRows(tableRows), [tableRows]);
  const filteredTableRows = useMemo(() => filterRows(tableDisplayRows, search), [search, tableDisplayRows]);

  function openFilterModal() {
    setDraftTableFilter(appliedTableFilter);
    setIsFilterOpen(true);
  }

  async function applyFilter() {
    const nextFilter = { ...draftTableFilter };
    setSubmittingFilter(true);
    try {
      // Selaras dokumen API:
      // month => read_database by period
      // today/last7/date => read_database all, lalu filter lokal
      if (nextFilter.range === "month") {
        await onRefreshMonthly?.(nextFilter.period || toPeriodValue());
      } else {
        await onRefreshAll?.();
      }

      setAppliedTableFilter(nextFilter);
      setIsFilterOpen(false);
    } finally {
      setSubmittingFilter(false);
    }
  }

  async function resetFilter() {
    const defaultFilter = getDefaultTableFilter();
    setSubmittingFilter(true);
    try {
      await onRefreshMonthly?.(defaultFilter.period);
      setDraftTableFilter(defaultFilter);
      setAppliedTableFilter(defaultFilter);
      setIsFilterOpen(false);
    } finally {
      setSubmittingFilter(false);
    }
  }

  const filterModal = isFilterOpen ? (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-green-dark/35 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />

      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-green/10 bg-white p-5 sm:p-6 shadow-2xl shadow-brand-green-dark/20">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-brand-green-dark">Filter Data Tabel</h3>
            <p className="text-xs font-semibold text-brand-muted">Pilih rentang waktu dan cabang/arus dana.</p>
          </div>
          <button
            className="rounded-xl border border-brand-green/15 p-2 text-brand-muted hover:bg-brand-bg"
            onClick={() => setIsFilterOpen(false)}
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Rentang</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { key: "month", label: "Bulan Ini" },
                { key: "today", label: "Hari Ini" },
                { key: "last7", label: "7 Hari Terakhir" },
                { key: "date", label: "Pilih Tanggal" },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${draftTableFilter.range === item.key ? "bg-brand-green text-white" : "bg-brand-bg text-brand-green-dark"}`}
                  onClick={() => setDraftTableFilter((prev) => ({ ...prev, range: item.key }))}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Bulan</label>
              <input
                type="month"
                value={draftTableFilter.period}
                onChange={(event) => setDraftTableFilter((prev) => ({ ...prev, period: event.target.value, range: "month" }))}
                className="mt-2 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-sm font-bold text-brand-green-dark"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Tanggal</label>
              <input
                type="date"
                value={draftTableFilter.date}
                onChange={(event) => setDraftTableFilter((prev) => ({ ...prev, date: event.target.value, range: "date" }))}
                className="mt-2 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-sm font-bold text-brand-green-dark"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Cabang / Arus Dana</label>
            <select
              value={draftTableFilter.arusDana}
              onChange={(event) => setDraftTableFilter((prev) => ({ ...prev, arusDana: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-sm font-bold text-brand-green-dark"
            >
              {arusDanaOptions.map((option) => (
                <option key={option} value={option}>{option === "semua" ? "Semua Cabang" : option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-brand-green/15 bg-white px-4 py-2.5 text-sm font-black text-brand-green-dark hover:bg-brand-bg disabled:opacity-50"
            onClick={resetFilter}
            disabled={loading || submittingFilter}
          >
            Reset
          </button>
          <button
            className="rounded-xl bg-brand-green px-4 py-2.5 text-sm font-black text-white hover:bg-brand-green-dark disabled:opacity-60"
            onClick={applyFilter}
            disabled={loading || submittingFilter}
          >
            {submittingFilter ? "Memproses..." : "Terapkan"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden xl:space-y-0 xl:h-[calc(100vh-9.25rem)] xl:grid xl:grid-cols-12 xl:grid-rows-[auto_1fr_1fr] xl:gap-3">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3 xl:col-span-12 xl:row-span-1">
        <Card
          icon={TrendingUp}
          label="Total Penjualan Bulan Ini"
          value={toCurrency(cards.totalSales)}
          hint="Akumulasi pemasukan sesuai filter aktif"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:contents">
          <Card
            icon={Store}
            label="Cabang Terlaris Bulan Ini"
            value={cards.topBranch}
            hint={`Total: ${toCurrency(cards.topBranchSales)}`}
          />
          <Card
            icon={CalendarDays}
            label="Rata-rata Penjualan Harian"
            value={toCurrency(cards.avgDaily)}
            hint="Rata-rata harian berdasarkan data terfilter"
          />
        </div>
      </div>

      <div className="xl:col-span-4 xl:row-span-2 min-h-0">
        <div className="rounded-3xl border border-brand-green/10 bg-white p-4 xl:p-3 2xl:p-4 card-shadow min-h-0 h-full overflow-auto">
          <h4 className="mb-4 text-sm font-black uppercase tracking-wider text-brand-muted">Kontribusi Penjualan Per Cabang</h4>
          <DonutChart data={donutData} />
          <div className="my-4 h-px bg-brand-bg" />
          <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-brand-muted">Performa Area Arus Dana</h4>
          <BarChart data={areaData} color="#F6C945" />
        </div>
      </div>

      <div className="rounded-3xl border border-brand-green/10 bg-white p-4 xl:p-3 2xl:p-4 card-shadow xl:col-span-8 xl:row-span-1 min-h-0">
        <h4 className="mb-4 text-sm font-black uppercase tracking-wider text-brand-muted">Tren Pemasukan Harian</h4>
        <LineChart data={lineSeries} />
      </div>

      <div className="xl:col-span-8 xl:row-span-1 min-h-0">
        <DataTable
          title="Data Database (Tanpa Setoran Bank BRI)"
          rows={filteredTableRows}
          search={search}
          onSearchChange={setSearch}
          showFilterButton
          onFilterClick={openFilterModal}
          filterButtonDisabled={loading || submittingFilter}
          arusDanaColorMap={arusDanaColorMap}
          dense
          fitContainer
        />
      </div>

      {typeof document !== "undefined" ? createPortal(filterModal, document.body) : null}
    </div>
  );
}
