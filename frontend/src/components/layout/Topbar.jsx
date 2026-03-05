import { BadgeCheck, ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Topbar({ user, mode, isCollapsed, onToggleSidebar }) {
  const toggleLabel = mode === "mobile" ? "Buka menu" : isCollapsed ? "Expand sidebar" : "Collapse sidebar";
  const [branchOpen, setBranchOpen] = useState(false);
  const [branch, setBranch] = useState("Tarakan");
  const [notice, setNotice] = useState("");
  const noticeTimerRef = useRef(null);

  function showNotice(text) {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice(text);
    noticeTimerRef.current = setTimeout(() => {
      setNotice("");
      noticeTimerRef.current = null;
    }, 3000);
  }

  function handleSelectBranch(nextBranch) {
    setBranchOpen(false);
    if (nextBranch === "Balikpapan") {
      showNotice("Balikpapan: Tidak tersedia!");
      return;
    }
    setBranch(nextBranch);
  }

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {notice && mode === "mobile" && (
        <div className="pointer-events-none fixed inset-0 z-120 flex items-center justify-center p-4">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-black text-amber-700 shadow-2xl shadow-amber-200/40">
            {notice}
          </div>
        </div>
      )}

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

          <div className="relative">
            <button
              className="inline-flex items-center gap-2 px-1 py-1 text-left"
              onClick={() => setBranchOpen((prev) => !prev)}
            >
              <div className="flex flex-col -space-y-1">
                <span className="text-[8px] sm:text-[10px] font-black text-brand-muted opacity-50 uppercase tracking-widest">Cabang</span>
                <h2 className="text-sm sm:text-xl font-extrabold text-brand-green-dark truncate max-w-30 sm:max-w-none">{branch}</h2>
              </div>
              <ChevronDown size={16} className={`text-brand-muted transition-transform ${branchOpen ? "rotate-180" : ""}`} />
            </button>

            {branchOpen && (
              <div className="absolute left-0 top-full mt-2 w-44 rounded-xl border border-brand-green/10 bg-white p-1 shadow-xl shadow-brand-green-dark/10">
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-brand-green-dark hover:bg-brand-bg"
                  onClick={() => handleSelectBranch("Tarakan")}
                >
                  Tarakan
                </button>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-brand-green-dark hover:bg-brand-bg"
                  onClick={() => handleSelectBranch("Balikpapan")}
                >
                  Balikpapan
                </button>
              </div>
            )}

            {notice && mode !== "mobile" && (
              <div className="pointer-events-none absolute left-0 top-full mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 shadow-xl shadow-amber-200/30">
                {notice}
              </div>
            )}
          </div>
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
