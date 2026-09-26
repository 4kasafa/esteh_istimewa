import { BadgeCheck, CalendarDays, ChevronDown, Menu, RotateCw } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toPeriodValue } from "../../utils/formatters";

const RANGE_LABELS = {
  month: "Bulan Ini",
  today: "Hari Ini",
  last7: "7 Hari",
};

export default function Topbar({
  user,
  mode,
  isCollapsed,
  onToggleSidebar,
  selectedBranch = "Semua",
  onSelectBranch,
  branches = ["Semua"],
  periodFilter = { range: "month", period: toPeriodValue() },
  onPeriodFilterChange,
  loading = false,
  isSyncing = false,
  onRefresh,
}) {
  const isStaff = String(user?.role || "").toLowerCase() === "staff";
  // ponytail: pakai pola yang sama seperti OnlineStatusBadge, tanpa hook baru.
  const isOnline = useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
  );
  const toggleLabel = mode === "mobile" ? "Buka menu" : isCollapsed ? "Expand sidebar" : "Collapse sidebar";
  const [branchOpen, setBranchOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const branchDropdownRef = useRef(null);
  const periodDropdownRef = useRef(null);

  function handleSelectBranch(nextBranch) {
    setBranchOpen(false);
    onSelectBranch?.(nextBranch);
  }

  function handleRangeChange(range) {
    setPeriodOpen(false);
    onPeriodFilterChange?.({ ...periodFilter, range });
  }

  function handleMonthChange(event) {
    setPeriodOpen(false);
    onPeriodFilterChange?.({ range: "month", period: event.target.value });
  }

  useEffect(() => {
    function handlePointerDown(event) {
      if (branchOpen && !branchDropdownRef.current?.contains(event.target)) {
        setBranchOpen(false);
      }
      if (periodOpen && !periodDropdownRef.current?.contains(event.target)) {
        setPeriodOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [branchOpen, periodOpen]);

  const currentRangeLabel =
    periodFilter.range === "month" && periodFilter.period
      ? periodFilter.period
      : (RANGE_LABELS[periodFilter.range] ?? "Bulan Ini");

  return (
    <>
      <header className="relative h-14 sm:h-16 bg-white/70 backdrop-blur-md border-b border-white/80 px-3 sm:px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {mode === "mobile" && (
            <button
              className="p-2 bg-brand-green/5 text-brand-green rounded-xl hover:bg-brand-green/10 transition-colors shrink-0"
              onClick={onToggleSidebar}
              title={toggleLabel}
            >
              <Menu size={18} />
            </button>
          )}

          {!isStaff ? (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {/* Branch Filter Pill */}
              <div className="relative" ref={branchDropdownRef}>
                {/* h2 sr-only — test anchor: branch selection heading */}
                <h2 className="sr-only">
                  {selectedBranch.toLowerCase() === "semua" ? "Semua Cabang" : selectedBranch}
                </h2>
                <button
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-bg hover:bg-brand-green/10 transition-colors text-left group cursor-pointer border border-brand-green/10"
                  onClick={() => setBranchOpen((prev) => !prev)}
                  title="Pilih filter cabang"
                >
                  <span className="text-[10px] sm:text-xs font-black text-brand-green-dark truncate max-w-20 sm:max-w-28">
                    {selectedBranch.toLowerCase() === "semua" ? "Semua Cabang" : selectedBranch}
                  </span>
                  <ChevronDown size={12} className={`text-brand-muted transition-transform duration-200 shrink-0 ${branchOpen ? "rotate-180" : ""}`} />
                </button>

                {branchOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-44 rounded-2xl border border-brand-green/10 bg-white p-1.5 shadow-2xl shadow-brand-green-dark/15 z-50 animate-fade-in">
                    <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-brand-muted/70">Pilih Cabang</div>
                    <div className="space-y-0.5">
                      {branches.map((b) => {
                        const isSelected = selectedBranch.toLowerCase() === b.toLowerCase();
                        return (
                          <button
                            key={b}
                            className={`w-full rounded-xl px-2.5 py-1.5 text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-brand-green text-white font-black shadow-xs"
                                : "text-brand-green-dark hover:bg-brand-bg"
                            }`}
                            onClick={() => handleSelectBranch(b)}
                          >
                            <span>{b.toLowerCase() === "semua" ? "Semua Cabang" : b}</span>
                            {isSelected && <BadgeCheck size={12} className="text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Period Filter Pill */}
              <div className="relative" ref={periodDropdownRef}>
                <button
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-bg hover:bg-brand-green/10 transition-colors cursor-pointer border border-brand-green/10"
                  onClick={() => setPeriodOpen((prev) => !prev)}
                  disabled={loading}
                  title="Pilih periode waktu"
                >
                  <CalendarDays size={12} className="text-brand-green shrink-0" />
                  <span className="text-[10px] sm:text-xs font-black text-brand-green-dark truncate max-w-16 sm:max-w-24">
                    {currentRangeLabel}
                  </span>
                  <ChevronDown size={12} className={`text-brand-muted transition-transform duration-200 shrink-0 ${periodOpen ? "rotate-180" : ""}`} />
                </button>

                {periodOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-48 rounded-2xl border border-brand-green/10 bg-white p-2 shadow-2xl shadow-brand-green-dark/15 z-50 animate-fade-in space-y-1">
                    <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-brand-muted/70">Rentang Waktu</div>
                    {[
                      { key: "month", label: "Bulan Ini" },
                      { key: "today", label: "Hari Ini" },
                      { key: "last7", label: "7 Hari Terakhir" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        className={`w-full rounded-xl px-2.5 py-1.5 text-left text-xs font-bold transition-all cursor-pointer ${
                          periodFilter.range === item.key
                            ? "bg-brand-green text-white font-black"
                            : "text-brand-green-dark hover:bg-brand-bg"
                        }`}
                        onClick={() => handleRangeChange(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="pt-1 border-t border-brand-bg">
                      <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-brand-muted/70">Pilih Bulan</div>
                      <input
                        type="month"
                        value={periodFilter.period}
                        onChange={handleMonthChange}
                        disabled={loading}
                        className="mt-1 w-full rounded-xl border border-brand-green/15 bg-brand-bg px-2.5 py-1.5 text-xs font-bold text-brand-green-dark cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[9px] font-black text-brand-muted opacity-60 uppercase tracking-widest">Panel Staff</span>
              <h2 className="text-sm font-extrabold text-brand-green-dark">Laporan Hari Ini</h2>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(() => {
            const syncing = isSyncing || loading;
            return (
              <button
                onClick={onRefresh}
                disabled={loading || isSyncing}
                aria-label="Refresh data"
                title="Refresh data"
                className={
                  syncing
                    ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[12px] font-black text-teal-700 pointer-events-none"
                    : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-bg hover:bg-brand-green/10 text-brand-green-dark border border-brand-green/15 cursor-pointer transition-all text-[12px] font-black"
                }
              >
                {syncing ? (
                  <span className="h-3 w-3 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
                ) : (
                  <RotateCw size={12} className="shrink-0" />
                )}
                <span className="hidden sm:inline">{syncing ? "Menyinkronkan..." : "Refresh"}</span>
              </button>
            );
          })()}
          {!isOnline && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-700">
              Mode Offline
            </span>
          )}
        </div>
        {(loading || isSyncing) && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green/70 animate-pulse" />
        )}
      </header>
    </>
  );
}
