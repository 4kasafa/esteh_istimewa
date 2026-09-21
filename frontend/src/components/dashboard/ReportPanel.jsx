import { Fragment, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Coffee,
  Pencil,
  Plus,
  Funnel,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import ConfirmDialog from "../common/ConfirmDialog";
import { parseLooseNumber, toCurrency } from "../../utils/formatters";
import { filterRows } from "../../utils/dashboard";
import {
  applyReportFilters,
  buildReportTableData,
  buildTransactionList,
  getReportStaffOptions,
  sanitizeReportRows,
} from "../../utils/reports";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function getDefaultFilter() {
  return {
    date: "",
    staff: "semua",
  };
}

function TablePagination({
  pageSize,
  setPageSize,
  safePage,
  totalPages,
  startIndex,
  itemCount,
  totalItems,
  onPrev,
  onNext,
}) {
  if (totalItems === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-bg px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-muted">
        <span>Rows:</span>
        <select
          className="rounded-lg border border-brand-green/15 bg-white px-2 py-1 text-xs font-bold text-brand-green-dark cursor-pointer"
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="text-xs font-bold text-brand-muted">
        {totalItems > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemCount, totalItems)} / ${totalItems}` : "0 data"}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          className="rounded-lg border border-brand-green/15 px-2.5 py-1 text-xs font-black text-brand-green-dark disabled:opacity-40 cursor-pointer"
          onClick={onPrev}
          disabled={safePage <= 1}
        >
          Prev
        </button>
        <span className="text-xs font-black text-brand-muted">{safePage}/{totalPages}</span>
        <button
          className="rounded-lg border border-brand-green/15 px-2.5 py-1 text-xs font-black text-brand-green-dark disabled:opacity-40 cursor-pointer"
          onClick={onNext}
          disabled={safePage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Smart Row Mobile — gaya e-wallet / banking
function SmartRowMobile({ item, expanded, onToggle, onEdit, onDelete, isAdmin }) {
  const row = item.row;

  const omset = parseLooseNumber(
    row["TOTAL PENJUALAN"] ||
    row["TOTAL NOTA"] ||
    row["UANG MASUK"] ||
    row["UNAG MASUK"] ||
    (parseLooseNumber(row["UANG SETORAN"]) + parseLooseNumber(row["TOTAL PENGELUARAN"] || row.PENGELUARAN || row["UANG KELUAR"]))
  );
  const setoran = parseLooseNumber(row["UANG SETORAN"] || 0);
  const pengeluaran = parseLooseNumber(row["TOTAL PENGELUARAN"] || row.PENGELUARAN || row["UANG KELUAR"] || 0);
  const gelasLaku = row["GELAS LAKU"] ?? row["GELAS TERPAKAI"] ?? 0;
  const cabang = row.CABANG || row["ARUS DANA"] || "-";
  const staff = row.STAFF || "-";
  const shift = row.SHIFT ?? "-";

  // Timestamp ringkas
  const tsRaw = row["TIME STAMP INPUT"] || row["TIMESTAMP INPUT"] || "";
  const tsShort = tsRaw ? String(tsRaw).slice(0, 16).replace("T", " ") : "-";

  // Bahan baku (non-gelas, untuk expand)
  const bahanEntries = Object.entries(row).filter(([k]) => {
    const kl = k.toLowerCase();
    return (
      (kl === "teh" || kl === "gula" || kl.includes("es batu") || kl === "esbatu depo" || kl === "esbatu beli" || kl === "es batu depo" || kl === "es batu beli") &&
      row[k] !== undefined && row[k] !== "" && row[k] !== "0" && row[k] !== 0
    );
  });

  return (
    <div className="rounded-xl border border-brand-green/10 bg-white overflow-hidden transition-all duration-200 hover:border-brand-green/25 hover:shadow-sm hover:shadow-brand-green/8">
      {/* Baris utama */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Kiri: Info cabang + staff + waktu */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-brand-green-dark truncate">{cabang}</p>
          <p className="text-[10px] text-brand-muted font-semibold truncate">
            {staff} · Shift {shift} · {tsShort}
          </p>
        </div>

        {/* Kanan: Omset + Cup + Edit */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-xs font-black text-brand-green-dark">{toCurrency(omset)}</p>
            <p className="text-[10px] font-bold text-brand-muted">{gelasLaku} Cup</p>
          </div>

          <button
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-green-dark hover:bg-brand-bg transition-colors"
            onClick={() => onEdit?.(item)}
            title="Edit laporan"
            aria-label="Edit laporan"
          >
            <Pencil size={13} />
          </button>

          {isAdmin && (
            <button
              className="p-1.5 rounded-lg text-brand-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
              onClick={() => onDelete?.(item)}
              title="Hapus laporan"
              aria-label="Hapus laporan"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-green-dark hover:bg-brand-bg transition-colors"
            onClick={() => onToggle(item.id)}
            title="Lihat rincian"
            aria-label="Toggle rincian"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Detail accordion: Rincian Kas + Bahan */}
      {expanded && (
        <div className="border-t border-brand-bg px-3 py-2.5 space-y-2 bg-brand-bg/30">
          {/* Rincian Kas */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white border border-brand-green/10 px-2.5 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp size={10} className="text-brand-green" />
                <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted">Setoran</p>
              </div>
              <p className="text-[11px] font-black text-brand-green-dark">{toCurrency(setoran)}</p>
            </div>
            <div className="rounded-lg bg-white border border-brand-green/10 px-2.5 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingDown size={10} className="text-amber-600" />
                <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted">Pengeluaran</p>
              </div>
              <p className="text-[11px] font-black text-amber-700">{toCurrency(pengeluaran)}</p>
            </div>
          </div>

          {/* Stok Gelas */}
          <div className="rounded-lg bg-white border border-brand-green/10 px-2.5 py-2">
            <div className="flex items-center gap-1 mb-1">
              <Coffee size={10} className="text-brand-green" />
              <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted">Gelas</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-brand-green-dark/80">
              <span>Awal: {row["GELAS AWAL"] ?? row["GELAS MASUK"] ?? 0}</span>
              <span>Sisa: {row["GELAS SISA"] ?? 0}</span>
              {row["GELAS RUSAK"] > 0 && <span>Rusak: {row["GELAS RUSAK"]}</span>}
              <span className="font-black text-brand-green">Laku: {gelasLaku}</span>
            </div>
          </div>

          {/* Bahan Baku (jika ada) */}
          {bahanEntries.length > 0 && (
            <div className="rounded-lg bg-white border border-brand-green/10 px-2.5 py-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted mb-1">Bahan Baku</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {bahanEntries.map(([k, v]) => (
                  <span key={k} className="text-[10px] font-bold text-brand-green-dark/80">
                    {k}: {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
  onDeleteRow,
  onAddReport,
  onEditTodayReport,
  hasTodayReport = false,
  isAdmin = true,
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
    const rawVal = item.row[column];
    if (column === "TOTAL NOTA" || column === "UANG MASUK" || column === "UNAG MASUK" || column === "TOTAL PENJUALAN") {
      const explicit = parseLooseNumber(rawVal);
      if (explicit > 0) return toCurrency(explicit);
      const setoran = parseLooseNumber(item.row["UANG SETORAN"]);
      const pengeluaran = parseLooseNumber(item.row["TOTAL PENGELUARAN"] || item.row.PENGELUARAN || item.row["UANG KELUAR"]);
      const total = setoran + pengeluaran;
      return total > 0 ? toCurrency(total) : "Rp 0";
    }
    if (column === "UANG SETORAN") {
      const num = parseLooseNumber(rawVal);
      return num > 0 ? toCurrency(num) : "Rp 0";
    }
    if (column === "PENGELUARAN" || column === "UANG KELUAR" || column === "TOTAL PENGELUARAN") {
      const num = parseLooseNumber(rawVal);
      return num > 0 ? toCurrency(num) : "Rp 0";
    }
    return String(rawVal === undefined || rawVal === null || rawVal === "" ? "-" : rawVal);
  }

  return (
    <div className="bg-white rounded-4xl border border-brand-green/5 card-shadow overflow-hidden flex flex-col h-full min-h-0">
      <div className="p-3 sm:p-4 border-b border-brand-bg flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-brand-green-dark">
              {isAdmin ? "Rincian Laporan" : "Laporan Hari Ini"}
            </h3>
            <p className="text-[10px] text-brand-muted font-medium">Menampilkan {rows.length} entri data</p>
          </div>

          {showControls && showAddButton && (
            <button
              className="inline-flex items-center gap-1 rounded-xl bg-brand-green px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-brand-green-dark transition-colors"
              onClick={onAddReport}
              title="Tambah laporan"
            >
              <Plus size={13} />
              <span>Tambah</span>
            </button>
          )}

          {!showControls && (rows.length > 0 || hasTodayReport) && (
            hasTodayReport ? (
              <button
                className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-amber-700 transition-colors"
                onClick={onEditTodayReport}
                title="Edit laporan hari ini"
              >
                <Pencil size={13} />
                <span>Edit Laporan Hari Ini</span>
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-1 rounded-xl bg-brand-green px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-brand-green-dark transition-colors"
                onClick={onAddReport}
                title="Buat laporan hari ini"
              >
                <Plus size={13} />
                <span>Buat Laporan Hari Ini</span>
              </button>
            )
          )}
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                className="w-full pl-9 pr-3 py-2 bg-brand-bg border border-brand-green/15 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-brand-green/20 transition-all placeholder:text-brand-muted/40"
                placeholder="Cari laporan..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted opacity-40">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-xl border border-brand-green/15 bg-brand-bg px-2.5 py-2 text-xs font-black text-brand-green-dark hover:bg-brand-green/10 disabled:opacity-50"
              onClick={onFilterClick}
              disabled={filterDisabled}
              title="Filter Data"
            >
              <Funnel size={13} />
              <span className="hidden sm:inline text-[11px]">Filter</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
        {rows.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-3xl opacity-30">{isAdmin ? "📂" : "📝"}</div>
            <p className="text-sm font-bold text-brand-muted">
              {isAdmin ? "Tidak ada data ditemukan" : "Belum ada laporan hari ini"}
            </p>
            {!isAdmin && !hasTodayReport && (
              <div className="pt-2">
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-green px-4 py-2.5 text-xs font-black text-white hover:bg-brand-green-dark transition-colors shadow-lg shadow-brand-green/20"
                  onClick={onAddReport}
                  title="Buat laporan hari ini"
                >
                  <Plus size={16} />
                  <span>Buat Laporan Hari Ini</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: Smart Row E-Wallet Style */}
            <div className="md:hidden space-y-1.5 p-2.5 max-h-[60vh] overflow-y-auto no-scrollbar">
              {pageRows.map((item, rowIndex) => (
                <SmartRowMobile
                  key={`m-${startIndex + rowIndex}`}
                  item={item}
                  expanded={expandedRowIds.has(item.id)}
                  onToggle={onToggleRow}
                  onEdit={onEditRow}
                  onDelete={onDeleteRow}
                  isAdmin={isAdmin}
                />
              ))}
            </div>

            {/* Desktop: Tabel */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-bg sticky top-0 z-10">
                  <th className={`${isAdmin ? "w-20" : "w-16"} px-3 py-3 text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] border-b border-brand-bg`}>
                    {isAdmin ? "Aksi" : "Edit"}
                  </th>
                  {columns.map((column) => (
                    <th key={column} className="px-3 py-3 text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] border-b border-brand-bg">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-bg">
                {pageRows.map((item, rowIndex) => (
                  <Fragment key={`group-${item.id}-${rowIndex}`}>
                    <tr className="transition-all duration-200 hover:bg-brand-bg/50">
                      <td className="px-3 py-2 text-xs font-bold text-brand-green-dark/80 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            className="inline-flex items-center text-brand-muted hover:text-brand-green-dark transition-colors cursor-pointer"
                            onClick={() => onEditRow?.(item)}
                            title="Edit laporan"
                            aria-label="Edit laporan"
                          >
                            <Pencil size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              className="inline-flex items-center text-brand-muted hover:text-rose-600 transition-colors cursor-pointer"
                              onClick={() => onDeleteRow?.(item)}
                              title="Hapus laporan"
                              aria-label="Hapus laporan"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      {columns.map((column) => (
                        <td key={`${item.id}-${column}`} className="px-3 py-2.5 text-[11px] font-bold text-brand-green-dark/80 whitespace-nowrap">
                          {rowValue(item, column)}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {showFooter && (
        <TablePagination
          pageSize={pageSize}
          setPageSize={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          safePage={safePage}
          totalPages={totalPages}
          startIndex={startIndex}
          itemCount={pageRows.length}
          totalItems={rows.length}
          onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
          onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        />
      )}
    </div>
  );
}

const TRANSACTION_COLUMNS = [
  { key: "type", label: "Jenis" },
  { key: "timestamp", label: "Tanggal" },
  { key: "arusDana", label: "Cabang" },
  { key: "staff", label: "Staff" },
  { key: "keterangan", label: "Keterangan" },
  { key: "nominal", label: "Nominal" },
];

function TransactionTable({
  rows,
  search,
  onSearchChange,
  onEditRow,
  onDeleteRow,
  onAddReport,
  isAdmin,
  onFilterClick,
  filterDisabled,
  showControls = true,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  function formatTimestamp(ts) {
    if (!(ts instanceof Date) || Number.isNaN(ts.getTime())) return "-";
    const dd = String(ts.getDate()).padStart(2, "0");
    const mm = String(ts.getMonth() + 1).padStart(2, "0");
    const yyyy = ts.getFullYear();
    const hh = String(ts.getHours()).padStart(2, "0");
    const mi = String(ts.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy} ${hh}.${mi}`;
  }

  return (
    <div className="bg-white rounded-4xl border border-brand-green/5 card-shadow overflow-hidden flex flex-col h-full min-h-0">
      <div className="p-3 sm:p-4 border-b border-brand-bg flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-brand-green-dark">Semua Transaksi</h3>
            <p className="text-[10px] text-brand-muted font-medium">Menampilkan {rows.length} entri transaksi</p>
          </div>
          {isAdmin && (
            <button
              className="inline-flex items-center gap-1 rounded-xl bg-brand-green px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-brand-green-dark transition-colors"
              onClick={onAddReport}
              title="Tambah laporan"
            >
              <Plus size={13} />
              <span>Tambah</span>
            </button>
          )}
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                className="w-full pl-9 pr-3 py-2 bg-brand-bg border border-brand-green/15 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-brand-green/20 transition-all placeholder:text-brand-muted/40"
                placeholder="Cari transaksi..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted opacity-40">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-xl border border-brand-green/15 bg-brand-bg px-2.5 py-2 text-xs font-black text-brand-green-dark hover:bg-brand-green/10 disabled:opacity-50"
              onClick={onFilterClick}
              disabled={filterDisabled}
              title="Filter Data"
            >
              <Funnel size={13} />
              <span className="hidden sm:inline text-[11px]">Filter</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
        {rows.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-3xl opacity-30">&#x1F4CB;</div>
            <p className="text-sm font-bold text-brand-muted">Tidak ada data transaksi ditemukan</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-1.5 p-2.5 max-h-[60vh] overflow-y-auto no-scrollbar">
              {pageRows.map((item, rowIndex) => (
                <div
                  key={`mt-${startIndex + rowIndex}`}
                  className="rounded-xl border border-brand-green/10 bg-white overflow-hidden transition-all duration-200 hover:border-brand-green/25 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            item.type === "PEMASUKAN"
                              ? "bg-brand-green/12 text-brand-green-dark"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.type === "PEMASUKAN" ? "Masuk" : "Keluar"}
                        </span>
                        <span className="text-[10px] text-brand-muted font-semibold">{formatTimestamp(item.timestamp)}</span>
                      </div>
                      <p className="text-[11px] font-black text-brand-green-dark truncate">{item.keterangan}</p>
                      <p className="text-[10px] text-brand-muted font-semibold truncate">{item.arusDana} &middot; {item.staff}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p
                        className={`text-xs font-black ${
                          item.type === "PEMASUKAN" ? "text-brand-green-dark" : "text-amber-700"
                        }`}
                      >
                        {item.type === "PEMASUKAN" ? "+" : "-"} {toCurrency(item.nominal)}
                      </p>
                      {item.type === "PEMASUKAN" && (
                        <button
                          className="p-1.5 rounded-lg text-brand-muted hover:text-brand-green-dark hover:bg-brand-bg transition-colors"
                          onClick={() => onEditRow?.(item)}
                          title="Edit laporan"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="p-1.5 rounded-lg text-brand-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          onClick={() => onDeleteRow?.(item)}
                          title="Hapus transaksi"
                          aria-label="Hapus transaksi"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-bg sticky top-0 z-10">
                  {isAdmin && (
                    <th className="w-20 px-3 py-3 text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] border-b border-brand-bg">Aksi</th>
                  )}
                  {TRANSACTION_COLUMNS.map((col) => (
                    <th key={col.key} className="px-3 py-3 text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] border-b border-brand-bg">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-bg">
                {pageRows.map((item, rowIndex) => (
                  <tr key={`tr-${startIndex + rowIndex}`} className="transition-all duration-200 hover:bg-brand-bg/50">
                    {isAdmin && (
                      <td className="px-3 py-2 text-xs font-bold text-brand-green-dark/80">
                        <div className="flex items-center gap-1.5">
                          {item.type === "PEMASUKAN" ? (
                            <button
                              className="inline-flex items-center text-brand-muted hover:text-brand-green-dark transition-colors cursor-pointer"
                              onClick={() => onEditRow?.(item)}
                              title="Edit laporan"
                            >
                              <Pencil size={14} />
                            </button>
                          ) : null}
                          <button
                            className="inline-flex items-center text-brand-muted hover:text-rose-600 transition-colors cursor-pointer"
                            onClick={() => onDeleteRow?.(item)}
                            title="Hapus transaksi"
                            aria-label="Hapus transaksi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-[11px] font-bold whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          item.type === "PEMASUKAN"
                            ? "bg-brand-green/12 text-brand-green-dark"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.type === "PEMASUKAN" ? "PEMASUKAN" : "PENGELUARAN"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-bold text-brand-green-dark/80 whitespace-nowrap">
                      {formatTimestamp(item.timestamp)}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-bold text-brand-green-dark/80 whitespace-nowrap">
                      <span className="inline-flex rounded-lg border border-brand-green/15 bg-brand-green/8 px-2.5 py-1 text-[11px] font-black">
                        {item.arusDana}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-bold text-brand-green-dark/80 whitespace-nowrap">{item.staff}</td>
                    <td className="px-3 py-2.5 text-[11px] font-bold text-brand-green-dark/80 max-w-[200px] truncate">{item.keterangan}</td>
                    <td className="px-3 py-2.5 text-[11px] font-black whitespace-nowrap">
                      <span className={item.type === "PEMASUKAN" ? "text-brand-green-dark" : "text-amber-700"}>
                        {item.type === "PEMASUKAN" ? "+" : "-"} {toCurrency(item.nominal)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <TablePagination
        pageSize={pageSize}
        setPageSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        safePage={safePage}
        totalPages={totalPages}
        startIndex={startIndex}
        itemCount={pageRows.length}
        totalItems={rows.length}
        onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
      />
    </div>
  );
}

export default function ReportPanel({
  reportRows,
  dbRows = [],
  loading,
  isAdmin,
  onEditRow,
  onAddReport,
  onDeleteReport,
  period,
  todayReport = null,
}) {
  const [search, setSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState(() => new Set());
  const [appliedFilter, setAppliedFilter] = useState(() => getDefaultFilter());
  const [draftFilter, setDraftFilter] = useState(() => getDefaultFilter());
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const normalizedRows = useMemo(() => sanitizeReportRows(reportRows), [reportRows]);

  const transactionRows = useMemo(() => {
    if (!isAdmin) return [];
    return buildTransactionList(reportRows, dbRows);
  }, [isAdmin, reportRows, dbRows]);

  // Untuk staff, batasi hanya pada data laporan hari ini
  const scopedRows = useMemo(() => {
    if (isAdmin) return normalizedRows;
    const now = new Date();
    return normalizedRows.filter((item) => (
      item.timestamp.getFullYear() === now.getFullYear()
      && item.timestamp.getMonth() === now.getMonth()
      && item.timestamp.getDate() === now.getDate()
    ));
  }, [isAdmin, normalizedRows]);

  const hasTodayReport = useMemo(() => {
    if (todayReport) return true;
    const now = new Date();
    return normalizedRows.some((item) => (
      item.timestamp.getFullYear() === now.getFullYear()
      && item.timestamp.getMonth() === now.getMonth()
      && item.timestamp.getDate() === now.getDate()
    ));
  }, [normalizedRows, todayReport]);

  const staffOptions = useMemo(() => getReportStaffOptions(normalizedRows), [normalizedRows]);

  const filteredRows = useMemo(() => {
    if (!isAdmin) return scopedRows;
    return applyReportFilters(scopedRows, {
      range: appliedFilter.date ? "date" : "all",
      date: appliedFilter.date || "",
      arusDana: "semua",
      staff: appliedFilter.staff || "semua",
    });
  }, [appliedFilter, isAdmin, scopedRows]);

  const filteredTransactions = useMemo(() => {
    if (!isAdmin) return [];
    return applyReportFilters(transactionRows, {
      range: appliedFilter.date ? "date" : "all",
      date: appliedFilter.date || "",
      arusDana: "semua",
      staff: appliedFilter.staff || "semua",
    });
  }, [appliedFilter, isAdmin, transactionRows]);

  const tableRows = useMemo(() => buildReportTableData(filteredRows), [filteredRows]);
  const tableRowsBySearch = useMemo(() => {
    if (!search.trim()) return tableRows;
    const queryRows = tableRows.map((item) => ({
      ...item.row,
      _id: item.id,
    }));
    const matched = filterRows(queryRows, search);
    const allowedIds = new Set(matched.map((item) => item._id));
    return tableRows.filter((item) => allowedIds.has(item.id));
  }, [search, tableRows]);

  const transactionsBySearch = useMemo(() => {
    if (!transactionSearch.trim()) return filteredTransactions;
    return filterRows(filteredTransactions, transactionSearch);
  }, [transactionSearch, filteredTransactions]);

  async function handleConfirmDelete() {
    if (!deletingItem || !onDeleteReport) return;
    setDeleteLoading(true);
    try {
      const id =
        deletingItem.id ||
        deletingItem.row?.["ID TRANSAKSI"] ||
        deletingItem.row?.["NO TRANSAKSI"] ||
        deletingItem.raw?.["ID TRANSAKSI"] ||
        deletingItem.raw?.["NO TRANSAKSI"] ||
        deletingItem["ID TRANSAKSI"] ||
        deletingItem["NO TRANSAKSI"];
      const targetPeriod =
        period ||
        deletingItem.raw?.TANGGAL?.substring(0, 7) ||
        deletingItem.row?.TANGGAL?.substring(0, 7) ||
        deletingItem.raw?.["TIME STAMP INPUT"]?.substring(0, 7);
      const rowIndex =
        deletingItem.row?._rowIndex ||
        deletingItem.raw?._rowIndex ||
        deletingItem._rowIndex;
      await onDeleteReport(id, targetPeriod, rowIndex);
      setDeletingItem(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleEditTodayReport() {
    if (todayReport) {
      onEditRow?.({ row: todayReport });
      return;
    }
    if (tableRows.length > 0) {
      onEditRow?.(tableRows[0]);
      return;
    }
    onAddReport?.();
  }

  function toggleRow(id) {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyFilter() {
    setAppliedFilter({ ...draftFilter });
    setIsFilterOpen(false);
  }

  function resetFilter() {
    const defaults = getDefaultFilter();
    setDraftFilter(defaults);
    setAppliedFilter(defaults);
    setExpandedRowIds(new Set());
    setIsFilterOpen(false);
  }

  const filterModal = isFilterOpen ? (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-green-dark/35 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-green/10 bg-white p-5 sm:p-6 shadow-2xl shadow-brand-green-dark/20">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-brand-green-dark">Filter Laporan</h3>
            <p className="text-xs font-semibold text-brand-muted">Pencarian staff dan tanggal spesifik.</p>
          </div>
          <button
            className="rounded-xl border border-brand-green/15 p-2 text-brand-muted hover:bg-brand-bg cursor-pointer"
            onClick={() => setIsFilterOpen(false)}
            title="Tutup"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Staff Bertugas</label>
            <select
              value={draftFilter.staff || "semua"}
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, staff: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-sm font-bold text-brand-green-dark cursor-pointer"
            >
              {staffOptions.map((option) => (
                <option key={option} value={option}>{option === "semua" ? "Semua Staff" : option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Tanggal Kustom (Opsional)</label>
            <input
              type="date"
              value={draftFilter.date || ""}
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, date: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-3 py-2 text-sm font-bold text-brand-green-dark cursor-pointer"
            />
            <p className="mt-1 text-[10px] text-brand-muted">Kosongkan jika ingin menampilkan seluruh data tanggal pada periode aktif.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-brand-green/15 bg-white px-4 py-2.5 text-sm font-black text-brand-green-dark hover:bg-brand-bg cursor-pointer"
            onClick={resetFilter}
          >
            Reset
          </button>
          <button
            className="rounded-xl bg-brand-green px-4 py-2.5 text-sm font-black text-white hover:bg-brand-green-dark cursor-pointer"
            onClick={applyFilter}
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const panelClassName = isAdmin
    ? "flex flex-col min-h-0 gap-3 sm:gap-4"
    : "grid grid-rows-[1fr] min-h-0 h-[calc(100dvh-7.5rem)]";

  return (
    <div className={panelClassName}>
      <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
        {isAdmin ? (
          <TransactionTable
            rows={transactionsBySearch}
            search={transactionSearch}
            onSearchChange={setTransactionSearch}
            onEditRow={onEditRow}
            onDeleteRow={(item) => setDeletingItem(item)}
            onAddReport={onAddReport}
            isAdmin={isAdmin}
            onFilterClick={() => {
              setDraftFilter(appliedFilter);
              setIsFilterOpen(true);
            }}
            filterDisabled={loading}
            showControls={true}
          />
        ) : (
          <ReportTable
            rows={tableRowsBySearch}
            search={search}
            onSearchChange={setSearch}
            expandedRowIds={expandedRowIds}
            onToggleRow={toggleRow}
            onEditRow={onEditRow}
            onDeleteRow={(item) => setDeletingItem(item)}
            onAddReport={onAddReport}
            onEditTodayReport={handleEditTodayReport}
            hasTodayReport={hasTodayReport}
            isAdmin={isAdmin}
            onFilterClick={() => {
              setDraftFilter(appliedFilter);
              setIsFilterOpen(true);
            }}
            filterDisabled={loading}
            showAddButton={isAdmin || !hasTodayReport}
            showControls={isAdmin}
            showFooter={isAdmin}
          />
        )}
      </div>

      {typeof document !== "undefined" ? createPortal(filterModal, document.body) : null}

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Hapus Transaksi?"
        description={`Apakah Anda yakin ingin menghapus data transaksi ${
          deletingItem?.id ||
          deletingItem?.row?.["ID TRANSAKSI"] ||
          deletingItem?.row?.["NO TRANSAKSI"] ||
          deletingItem?.raw?.["ID TRANSAKSI"] ||
          deletingItem?.raw?.["NO TRANSAKSI"] ||
          ""
        }? Data transaksi beserta rincian pengeluaran terkait akan dihapus secara permanen.`}
        confirmLabel="Hapus Transaksi"
        cancelLabel="Batal"
        loading={deleteLoading}
        danger
        onCancel={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
