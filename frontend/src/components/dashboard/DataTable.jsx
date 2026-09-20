import { useMemo, useState } from "react";
import { Funnel } from "lucide-react";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function DataTable({
  title,
  rows,
  search,
  onSearchChange,
  showFilterButton = false,
  onFilterClick,
  filterButtonDisabled = false,
  arusDanaColorMap = {},
  dense = false,
  fitContainer = false,
  headerActions = null,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]).filter((key) => key.trim() !== "" && !key.startsWith("_"));
  }, [rows]);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  function hexToRgba(hex, alpha) {
    const normalized = String(hex || "").replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(91,111,77,${alpha})`;
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getArusDanaStyle(value) {
    const key = String(value || "").trim();
    const color = arusDanaColorMap[key];
    if (!color) {
      return {
        backgroundColor: "rgba(91,111,77,0.12)",
        color: "#1B3A1E",
      };
    }

    return {
      backgroundColor: hexToRgba(color, 0.16),
      color,
      borderColor: hexToRgba(color, 0.35),
    };
  }

  function getSelisihClass(row, value) {
    const status = String(row._selisih_status || "").toLowerCase();
    const text = String(value || "").toLowerCase();
    if (status === "lebih" || text.includes("lebih")) return "bg-emerald-50 text-emerald-700";
    if (status === "kurang" || text.includes("kurang")) return "bg-red-50 text-red-700";
    return "bg-brand-bg text-brand-muted";
  }

  function renderCellValue(row, column) {
    const value = String(row[column] ?? "") || "-";
    if (column.toUpperCase() === "ARUS DANA" || column.toUpperCase() === "CABANG") {
      return (
        <span className="inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-black" style={getArusDanaStyle(value)}>
          {value}
        </span>
      );
    }
    if (column.toUpperCase() === "SELISIH") {
      return <span className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-black ${getSelisihClass(row, value)}`}>{value}</span>;
    }
    return value;
  }

  return (
    <div className={`bg-white rounded-4xl border border-brand-green/5 card-shadow overflow-hidden flex flex-col ${fitContainer ? "h-full" : "max-h-[70vh]"}`}>
      <div className={`${dense ? "p-4" : "p-6"} border-b border-brand-bg flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div>
          <h3 className="text-lg font-extrabold text-brand-green-dark">{title || "Tabel Data"}</h3>
          <p className="text-xs text-brand-muted font-medium">Menampilkan {rows.length} entri data</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <input
              className={`w-full sm:w-64 pl-10 pr-4 ${dense ? "py-2" : "py-2.5"} bg-brand-bg border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-green/20 transition-all placeholder:text-brand-muted/40`}
              placeholder="Cari sesuatu..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted opacity-40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {headerActions}

          {showFilterButton && (
            <button
              className={`inline-flex items-center gap-1.5 rounded-2xl border border-brand-green/15 bg-brand-bg px-3 ${dense ? "py-2" : "py-2.5"} text-xs font-black text-brand-green-dark hover:bg-brand-green/10 disabled:opacity-50`}
              onClick={onFilterClick}
              disabled={filterButtonDisabled}
              title="Filter Data"
            >
              <Funnel size={14} />
              <span className="hidden sm:inline">Filter</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar">
        {rows.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="text-4xl opacity-20">📂</div>
            <p className="text-sm font-bold text-brand-muted">Tidak ada data ditemukan</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3 p-3 max-h-[56vh] overflow-y-auto no-scrollbar">
              {pageRows.map((row, rowIndex) => (
                <div key={`m-${startIndex + rowIndex}`} className="rounded-2xl border border-brand-green/10 bg-brand-bg/30 p-3 space-y-2 transition-all duration-200 hover:border-brand-green/30 hover:bg-brand-bg/60 hover:shadow-md hover:shadow-brand-green/10">
                  {columns.map((column) => (
                    <div key={`${startIndex + rowIndex}-${column}`} className="flex items-start justify-between gap-3">
                      <span className="min-w-23 text-[10px] font-black uppercase tracking-wider text-brand-muted leading-snug">{column}</span>
                      <span className="text-right text-xs font-bold text-brand-green-dark wrap-break-word">
                        {renderCellValue(row, column)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-bg sticky top-0 z-10">
                  {columns.map((column) => (
                  <th key={column} className={`${dense ? "px-4 py-3" : "px-6 py-4"} text-[10px] font-black text-brand-muted uppercase tracking-[0.15em] border-b border-brand-bg`}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-bg">
                {pageRows.map((row, rowIndex) => (
                  <tr key={`r-${startIndex + rowIndex}`} className="group transition-all duration-200 hover:bg-brand-bg/50 hover:shadow-[inset_0_0_0_1px_rgba(43,147,72,0.12)]">
                    {columns.map((column) => (
                      <td key={`${startIndex + rowIndex}-${column}`} className={`${dense ? "px-4 py-2.5 text-[11px]" : "px-6 py-4 text-xs"} font-bold text-brand-green-dark/80 whitespace-nowrap`}>
                        {renderCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {rows.length > 0 && (
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
