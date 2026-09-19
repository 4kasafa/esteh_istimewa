import { BadgeCheck, ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Topbar({
  user,
  mode,
  isCollapsed,
  onToggleSidebar,
  selectedBranch = "Semua",
  onSelectBranch,
  branches = ["Semua", "cabang_01", "cabang_02"],
}) {
  const isStaff = String(user?.role || "").toLowerCase() === "staff";
  const toggleLabel = mode === "mobile" ? "Buka menu" : isCollapsed ? "Expand sidebar" : "Collapse sidebar";
  const [branchOpen, setBranchOpen] = useState(false);
  const dropdownRef = useRef(null);

  function handleSelectBranch(nextBranch) {
    setBranchOpen(false);
    onSelectBranch?.(nextBranch);
  }

  useEffect(() => {
    function handlePointerDown(event) {
      if (!branchOpen) return;
      if (!dropdownRef.current?.contains(event.target)) {
        setBranchOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [branchOpen]);

  return (
    <>
      <header className="h-16 sm:h-20 bg-white/70 backdrop-blur-md border-b border-white/80 px-3 sm:px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {mode === "mobile" && (
            <button
              className="p-2 sm:p-2.5 bg-brand-green/5 text-brand-green rounded-xl hover:bg-brand-green/10 transition-colors"
              onClick={onToggleSidebar}
              title={toggleLabel}
            >
              <Menu size={20} />
            </button>
          )}

          {!isStaff ? (
            <div className="relative" ref={dropdownRef}>
              <button
                className="inline-flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/80 transition-colors text-left group cursor-pointer"
                onClick={() => setBranchOpen((prev) => !prev)}
                title="Pilih filter cabang"
              >
                <div className="flex flex-col -space-y-0.5">
                  <span className="text-[9px] font-black text-brand-muted opacity-60 uppercase tracking-widest">Filter Cabang</span>
                  <h2 className="text-sm sm:text-base font-extrabold text-brand-green-dark truncate max-w-32 sm:max-w-none">
                    {selectedBranch.toLowerCase() === "semua" ? "Semua Cabang" : selectedBranch}
                  </h2>
                </div>
                <ChevronDown size={16} className={`text-brand-muted transition-transform duration-200 ${branchOpen ? "rotate-180" : ""}`} />
              </button>

              {branchOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 rounded-2xl border border-brand-green/10 bg-white p-1.5 shadow-2xl shadow-brand-green-dark/15 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-brand-muted/70">
                    Pilih Cabang
                  </div>
                  <div className="space-y-1">
                    {branches.map((b) => {
                      const isSelected = selectedBranch.toLowerCase() === b.toLowerCase();
                      return (
                        <button
                          key={b}
                          className={`w-full rounded-xl px-3 py-2 text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-brand-green text-white font-black shadow-xs"
                              : "text-brand-green-dark hover:bg-brand-bg"
                          }`}
                          onClick={() => handleSelectBranch(b)}
                        >
                          <span>{b.toLowerCase() === "semua" ? "Semua Cabang" : b}</span>
                          {isSelected && <BadgeCheck size={14} className="text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[9px] font-black text-brand-muted opacity-60 uppercase tracking-widest">Panel Staff</span>
              <h2 className="text-sm sm:text-base font-extrabold text-brand-green-dark">Laporan Hari Ini</h2>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-brand-green/10 bg-white px-2 py-1.5 sm:px-2.5 sm:py-2">
            <BadgeCheck size={14} className="text-brand-green" />
            <div className="text-left leading-none">
              <p className="text-xs sm:text-sm font-black text-brand-green-dark uppercase">{user?.role || "staff"}</p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
