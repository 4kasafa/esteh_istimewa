import { Fragment, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Beaker,
  Candy,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Funnel,
  Leaf,
  Snowflake,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { toCurrency, toPeriodValue } from "../../utils/formatters";
import { filterRows } from "../../utils/dashboard";
import {
  applyReportFilters,
  buildReportStats,
  buildReportTableData,
  getReportArusDanaOptions,
  getReportKasirOptions,
  sanitizeReportRows,
} from "../../utils/reports";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function getDefaultFilter() {
  return {
    range: "month",
    period: toPeriodValue(),
    date: "",
    arusDana: "semua",
    kasir: "semua",
  };
}

function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted wrap-break-word">{label}</p>
          <h3 className="mt-2 text-wrap sm:text-2xl font-black tracking-tight text-brand-green-dark">{value}</h3>
          <p className="mt-2 text-[10px] sm:text-[11px] font-semibold text-brand-muted leading-snug wrap-break-word">{hint}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-brand-green/10 p-2.5 text-brand-green">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function ReportTable({
  rows,
  search,
  onSearchChange,
  expandedRowIds,
  onToggleRow,
  onEditRow,
  onAddReport,
  onFilterClick,
  filterDisabled,
  showAddButton = true,
  showControls = true,
  showFooter = true,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    const blacklist = [
      "TOTAL NOTA",
      "STOK AWAL GELAS",
      "STOK AKHIR GELAS",
      "GELAS MASUK",
      "Rp 100.000",
      "Rp 75.000",
      "Rp 50.000",
      "Rp 20.000",
      "Rp 10.000",
      "Rp 5.000",
      "Rp 2.000",
      "Rp 1.000",
      "Rp 500",
      "Rp 200",
      "Rp 100",
    ];
    return Object.keys(rows[0].row).filter((key) => !blacklist.includes(key));
  }, [rows]);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  function rowValue(item, column) {
    const value = item.row[column];
    return String(value === undefined || value === null || value === "" ? "-" : value);
  }

  return (
    <div className="bg-white rounded-4xl border border-brand-green/5 card-shadow overflow-hidden flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-brand-bg flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-brand-green-dark">Rincian Laporan</h3>
          <p className="text-xs text-brand-muted font-medium">Menampilkan {rows.length} entri data</p>
        </div>

        {showControls ? (
          <div className="flex flex-col sm:flex-row gap-2">
            {showAddButton && (
              <div className="flex justify-center">
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-green px-3 py-2 text-xs font-black text-white hover:bg-brand-green-dark transition-colors"
                  onClick={onAddReport}
                  title="Tambah laporan"
                >
                  <Plus size={14} />
                  <span>Tambah Laporan</span>
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative group flex-1 min-w-0">
                <input
                  className="w-full sm:w-lg pl-10 pr-4 py-2 bg-brand-bg border border-brand-green/15 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-green/20 transition-all placeholder:text-brand-muted/40"
                  placeholder="Cari laporan..."
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted opacity-40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                className="inline-flex items-center justify-center gap-1.5 min-w-fit rounded-2xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-xs font-black text-brand-green-dark hover:bg-brand-green/10 disabled:opacity-50"
                onClick={onFilterClick}
                disabled={filterDisabled}
                title="Filter Data"
              >
                <Funnel size={14} />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>
          </div>
        ) : showAddButton ? (
          <button
            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-2xl bg-brand-green px-3 py-2 text-xs font-black text-white hover:bg-brand-green-dark transition-colors"
            onClick={onAddReport}
            title="Tambah laporan"
          >
            <Plus size={14} />
            <span>Tambah Laporan</span>
          </button>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
        {rows.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="text-4xl opacity-20">📂</div>
            <p className="text-sm font-bold text-brand-muted">Tidak ada data ditemukan</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-2.5 p-2.5 max-h-[56vh] overflow-y-auto no-scrollbar">
              {pageRows.map((item, rowIndex) => {
                const expanded = expandedRowIds.has(item.id);
                const row = item.row;
                return (
                  <div key={`m-${startIndex + rowIndex}`} className="rounded-xl border border-brand-green/10 bg-brand-bg/30 p-2.5 space-y-2 transition-all duration-200 hover:border-brand-green/30 hover:bg-brand-bg/60 hover:shadow-md hover:shadow-brand-green/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted">No Transaksi</p>
                        <p className="text-[11px] font-black text-brand-green-dark wrap-break-word leading-tight">{row["NO TRANSAKSI"] || "-"}</p>
                      </div>
                      <button
                        className="inline-flex items-center text-brand-muted hover:text-brand-green-dark transition-colors shrink-0"
                        onClick={() => onEditRow?.(item)}
                        title="Edit laporan"
                        aria-label="Edit laporan"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-lg bg-white border border-brand-green/10 px-2 py-1.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted">Shift / Kasir</p>
                        <p className="text-[11px] font-black text-brand-green-dark wrap-break-word">{row.SHIFT ?? "-"} / {row.KASIR ?? "-"}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-brand-green/10 px-2 py-1.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted">Arus Dana</p>
                        <p className="text-[11px] font-black text-brand-green-dark wrap-break-word">{row["ARUS DANA"] ?? "-"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        ["Gelas M/L/R", `${row["GELAS MASUK"] ?? 0}/${row["GELAS LAKU"] ?? 0}/${row["GELAS RUSAK"] ?? 0}`],
                        ["Es Depo/Beli", `${row["ESBATU DEPO"] ?? 0}/${row["ESBATU BELI"] ?? 0}`],
                      ].map(([label, value]) => (
                        <div key={`${item.id}-${label}`} className="rounded-lg border border-brand-green/10 bg-white px-2 py-1.5">
                          <p className="text-[8px] font-black uppercase tracking-wider text-brand-muted leading-tight">{label}</p>
                          <p className="mt-0.5 text-[10px] font-black text-brand-green-dark wrap-break-word leading-tight">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        ["Teh", row.TEH ?? 0],
                        ["Gula", row.GULA ?? 0],
                      ].map(([label, value]) => (
                        <div key={`${item.id}-${label}`} className="rounded-lg border border-brand-green/10 bg-white px-2 py-1.5">
                          <p className="text-[8px] font-black uppercase tracking-wider text-brand-muted leading-tight">{label}</p>
                          <p className="mt-0.5 text-[10px] font-black text-brand-green-dark wrap-break-word leading-tight">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-brand-green/20 bg-brand-green/8 px-2.5 py-2 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted">Uang Masuk</p>
                          <p className="text-[13px] font-black text-brand-green-dark wrap-break-word leading-tight">{row["UNAG MASUK"] ?? "-"}</p>
                          <p className="text-[9px] font-semibold text-brand-muted">Pengeluaran: {row.PENGELUARAN ?? "-"}</p>
                        </div>
                        <button
                          className="inline-flex items-center text-brand-muted hover:text-brand-green-dark transition-colors shrink-0"
                          onClick={() => onToggleRow(item.id)}
                          title="Toggle denominasi"
                          aria-label="Toggle denominasi"
                        >
                          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                      {expanded && (
                        <div className=" p-2">
                          {item.denomination.length ? (
                            <div className="grid grid-cols-2 gap-2">
                              {item.denomination.map((denom) => (
                                <div key={`${item.id}-${denom.label}`} className="rounded-lg bg-white px-2 py-1.5">
                                  <p className="text-[10px] font-black text-brand-muted">{denom.label}</p>
                                  <p className="text-[11px] font-black text-brand-green-dark">{denom.value}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] font-semibold text-brand-muted">Tidak ada denominasi terisi.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-bg sticky top-0 z-10">
                  <th className="w-20 px-4 py-3 text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] border-b border-brand-bg">Edit</th>
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-3 text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] border-b border-brand-bg">
                      {column}
                    </th>
                  ))}
                  <th className="w-20 px-4 py-3 text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] border-b border-brand-bg">Denom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-bg">
                {pageRows.map((item, rowIndex) => {
                  const expanded = expandedRowIds.has(item.id);
                  return (
                    <Fragment key={`group-${item.id}-${rowIndex}`}>
                      <tr key={`r-${item.id}-${rowIndex}`} className="transition-all duration-200 hover:bg-brand-bg/50 hover:shadow-[inset_0_0_0_1px_rgba(43,147,72,0.12)]">
                        <td className="px-4 py-2.5 text-xs font-bold text-brand-green-dark/80">
                          <button
                            className="inline-flex items-center text-brand-muted hover:text-brand-green-dark transition-colors"
                            onClick={() => onEditRow?.(item)}
                            title="Edit laporan"
                            aria-label="Edit laporan"
                          >
                            <Pencil size={15} />
                          </button>
                        </td>
                        {columns.map((column) => (
                          <td key={`${item.id}-${column}`} className="px-4 py-2.5 text-[11px] font-bold text-brand-green-dark/80 whitespace-nowrap">
                            {rowValue(item, column)}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 text-xs font-bold text-brand-green-dark/80">
                          <button
                            className="inline-flex items-center text-brand-muted hover:text-brand-green-dark transition-colors"
                            onClick={() => onToggleRow(item.id)}
                            title="Toggle denominasi"
                            aria-label="Toggle denominasi"
                          >
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`denom-${item.id}-${rowIndex}`} className="bg-brand-bg/20">
                          <td className="px-4 py-3 text-[11px] font-black text-brand-green-dark">Denominasi</td>
                          <td className="px-4 py-3" colSpan={Math.max(columns.length + 1, 2)}>
                            {item.denomination.length ? (
                              <div className="flex flex-wrap gap-2">
                                {item.denomination.map((denom) => (
                                  <div key={`${item.id}-${denom.label}`} className="rounded-lg border border-brand-green/10 bg-white px-2.5 py-1.5">
                                    <span className="text-[10px] font-black text-brand-muted">{denom.label}</span>
                                    <span className="ml-2 text-[11px] font-black text-brand-green-dark">{denom.value}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs font-semibold text-brand-muted">Tidak ada denominasi terisi.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {rows.length > 0 && showFooter && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-bg px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-muted">
            <span>Rows:</span>
            <select
              className="rounded-lg border border-brand-green/15 bg-white px-2 py-1 text-xs font-bold text-brand-green-dark"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="text-xs font-bold text-brand-muted">
            {startIndex + 1}-{Math.min(startIndex + pageRows.length, rows.length)} dari {rows.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-brand-green/15 px-3 py-1.5 text-xs font-black text-brand-green-dark disabled:opacity-40"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={safePage <= 1}
            >
              Prev
            </button>
            <span className="text-xs font-black text-brand-muted">Page {safePage}/{totalPages}</span>
            <button
              className="rounded-lg border border-brand-green/15 px-3 py-1.5 text-xs font-black text-brand-green-dark disabled:opacity-40"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={safePage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportPanel({
  reportRows,
  loading,
  isAdmin,
  onRefreshMonthly,
  onRefreshAll,
  onEditRow,
  onAddReport,
}) {
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState(() => new Set());
  const [appliedFilter, setAppliedFilter] = useState(() => getDefaultFilter());
  const [draftFilter, setDraftFilter] = useState(() => getDefaultFilter());
  const [submittingFilter, setSubmittingFilter] = useState(false);

  const normalizedRows = useMemo(() => sanitizeReportRows(reportRows), [reportRows]);
  const hasTodayReport = useMemo(() => {
    const now = new Date();
    return normalizedRows.some((item) => (
      item.timestamp.getFullYear() === now.getFullYear()
      && item.timestamp.getMonth() === now.getMonth()
      && item.timestamp.getDate() === now.getDate()
    ));
  }, [normalizedRows]);
  const arusDanaOptions = useMemo(() => getReportArusDanaOptions(normalizedRows), [normalizedRows]);
  const kasirOptions = useMemo(() => getReportKasirOptions(normalizedRows), [normalizedRows]);

  const filteredRows = useMemo(() => applyReportFilters(normalizedRows, appliedFilter), [appliedFilter, normalizedRows]);
  const stats = useMemo(() => buildReportStats(filteredRows), [filteredRows]);
  const tableRows = useMemo(() => buildReportTableData(filteredRows), [filteredRows]);
  const tableRowsBySearch = useMemo(() => {
    if (!search.trim()) return tableRows;
    const queryRows = tableRows.map((item) => ({
      ...item.row,
      _id: item.id,
      _denom: item.denomination.map((denom) => `${denom.label}:${denom.value}`).join(" "),
    }));
    const matched = filterRows(queryRows, search);
    const allowedIds = new Set(matched.map((item) => item._id));
    return tableRows.filter((item) => allowedIds.has(item.id));
  }, [search, tableRows]);

  function toggleRow(id) {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyFilter() {
    const nextFilter = { ...draftFilter };
    setSubmittingFilter(true);
    setAppliedFilter(nextFilter);
    setIsFilterOpen(false);

    const refreshTask = (nextFilter.range === "month" && isAdmin)
      ? onRefreshMonthly?.(nextFilter.period || toPeriodValue())
      : onRefreshAll?.();

    Promise.resolve(refreshTask)
      .catch(() => {})
      .finally(() => setSubmittingFilter(false));
  }

  async function resetFilter() {
    const defaults = getDefaultFilter();
    setSubmittingFilter(true);
    setDraftFilter(defaults);
    setAppliedFilter(defaults);
    setExpandedRowIds(new Set());
    setIsFilterOpen(false);

    const refreshTask = isAdmin ? onRefreshMonthly?.(defaults.period) : onRefreshAll?.();
    Promise.resolve(refreshTask)
      .catch(() => {})
      .finally(() => setSubmittingFilter(false));
  }

  const filterModal = isFilterOpen ? (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-green-dark/35 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-green/10 bg-white p-5 sm:p-6 shadow-2xl shadow-brand-green-dark/20">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-brand-green-dark">Filter Laporan</h3>
            <p className="text-xs font-semibold text-brand-muted">Filter rentang waktu, arus dana, dan kasir.</p>
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
                  className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${draftFilter.range === item.key ? "bg-brand-green text-white" : "bg-brand-bg text-brand-green-dark"}`}
                  onClick={() => setDraftFilter((prev) => ({ ...prev, range: item.key }))}
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
                value={draftFilter.period}
                onChange={(event) => setDraftFilter((prev) => ({ ...prev, period: event.target.value, range: "month" }))}
                className="mt-2 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-sm font-bold text-brand-green-dark"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Tanggal</label>
              <input
                type="date"
                value={draftFilter.date}
                onChange={(event) => setDraftFilter((prev) => ({ ...prev, date: event.target.value, range: "date" }))}
                className="mt-2 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-sm font-bold text-brand-green-dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Cabang / Arus Dana</label>
              <select
                value={draftFilter.arusDana}
                onChange={(event) => setDraftFilter((prev) => ({ ...prev, arusDana: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-sm font-bold text-brand-green-dark"
              >
                {arusDanaOptions.map((option) => (
                  <option key={option} value={option}>{option === "semua" ? "Semua Cabang" : option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Kasir</label>
              <select
                value={draftFilter.kasir}
                onChange={(event) => setDraftFilter((prev) => ({ ...prev, kasir: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-sm font-bold text-brand-green-dark"
              >
                {kasirOptions.map((option) => (
                  <option key={option} value={option}>{option === "semua" ? "Semua Kasir" : option}</option>
                ))}
              </select>
            </div>
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

  const panelClassName = isAdmin
    ? "flex flex-col min-h-0 gap-4 sm:gap-6 xl:gap-3"
    : "grid grid-rows-[1fr] min-h-0 h-[calc(100dvh-7.5rem)]";

  return (
    <div className={panelClassName}>
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          <StatCard label="Gelas" value={stats.gelasTotal} hint={`Laku: ${stats.gelasLaku} | Rusak: ${stats.gelasRusak}`} icon={Beaker} />
          <StatCard label="Es Batu" value={stats.esBatuTotal} hint={`Depo: ${stats.esBatuDepo} | Beli: ${stats.esBatuBeli}`} icon={Snowflake} />
          <StatCard label="Gula" value={stats.gula} hint="Total pemakaian gula" icon={Candy} />
          <StatCard label="Teh" value={stats.teh} hint="Total pemakaian teh" icon={Leaf} />
          <StatCard label="Uang Lebih" value={toCurrency(stats.uangLebih)} hint="Total uang lebih dari setoran" icon={TrendingUp} />
          <StatCard label="Uang Kurang" value={toCurrency(stats.uangKurang)} hint="Total uang kurang dari setoran" icon={TrendingDown} />
          <StatCard label="Pengeluaran" value={toCurrency(stats.pengeluaran)} hint="Total pengeluaran" icon={Wallet} />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
        <ReportTable
          rows={tableRowsBySearch}
          search={search}
          onSearchChange={setSearch}
          expandedRowIds={expandedRowIds}
          onToggleRow={toggleRow}
          onEditRow={onEditRow}
          onAddReport={onAddReport}
          onFilterClick={() => {
            setDraftFilter(appliedFilter);
            setIsFilterOpen(true);
          }}
          filterDisabled={loading || submittingFilter}
          showAddButton={isAdmin || !hasTodayReport}
          showControls={isAdmin}
          showFooter={isAdmin}
        />
      </div>

      {typeof document !== "undefined" ? createPortal(filterModal, document.body) : null}
    </div>
  );
}
