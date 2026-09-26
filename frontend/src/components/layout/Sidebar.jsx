import {
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Settings,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ICON_MAP = {
  dashboard: LayoutDashboard,
  laporan: FileText,
  laporan_harian: ClipboardCheck,
  pemasukan: ArrowDownCircle,
  pengeluaran: ArrowUpCircle,
  stok: Package,
  karyawan: Users,
  cabang: Store,
  kasMasuk: ArrowDownCircle,
  kasKeluar: ArrowUpCircle,
  setting: Settings,
  about: Info,
};

export default function Sidebar({
  menu,
  activeMenu,
  isOpen,
  isCollapsed,
  mode,
  user,
  onLogout,
  onToggle,
  onCloseMobile,
  onChangeMenu,
}) {
  const showLabel = !isCollapsed;
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountWrapRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!isAccountOpen) return;
      if (!accountWrapRef.current?.contains(event.target)) {
        setIsAccountOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isAccountOpen]);

  return (
    <>
      {mode === "mobile" && isOpen && (
        <div className="fixed inset-0 z-40 bg-brand-green-dark/20 backdrop-blur-sm" onClick={onCloseMobile} />
      )}

      <aside
        className={`
          ${mode === "mobile" ? "fixed" : "relative"} inset-y-0 left-0 z-50
          ${isCollapsed ? "w-22" : "w-72"}
          ${mode === "mobile" && !isOpen ? "-translate-x-full" : "translate-x-0"}
          bg-brand-green-dark text-white p-4 transition-all duration-300
          flex flex-col
        `}
      >
        <div className="mb-8">
          <div className={`${showLabel ? "flex items-start justify-between gap-3" : "flex flex-col items-center gap-3"}`}>
            <div className={`flex items-center ${showLabel ? "gap-3" : "justify-center"}`}>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 overflow-hidden shadow-lg flex items-center justify-center font-black transition-transform hover:scale-110 active:scale-95 duration-300 p-0.5">
                <img src="/Appic.svg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              {showLabel && (
                <div>
                  <h1 className="text-xl font-black tracking-tight text-white leading-none mb-1">Es Teh Istimewa</h1>
                  <p className="text-[10px] tracking-[0.18em] text-white/45">App By Kasafa</p>
                </div>
              )}
            </div>

            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-400 hover:bg-white/20 hover:text-white transition-colors"
              onClick={onToggle}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menu.map((item) => {
            const isActive = activeMenu === item.key;
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;

            return (
              <button
                key={item.key}
                aria-label={item.label}
                className={`
                  group relative w-full rounded-2xl px-3 py-3 text-sm font-bold transition-all
                  flex items-center ${showLabel ? "gap-3 justify-start" : "justify-center"}
                  ${isActive ? "bg-emerald-600 text-white shadow-lg shadow-black/25" : "text-white/70 hover:text-white hover:bg-white/8"}
                `}
                onClick={() => onChangeMenu(item.key)}
                title={item.label}
              >
                <Icon size={18} />
                {showLabel && <span>{item.label}</span>}
                {!showLabel && (
                  <span className="pointer-events-none absolute left-full top-1/2 ml-4 -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-brand-green-dark px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl shadow-black/20 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative mt-4" ref={accountWrapRef}>
          {isAccountOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-64 rounded-2xl border border-white/15 bg-brand-green-dark p-4 shadow-2xl shadow-black/30">
              <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-white/70">Info Akun</h4>
              <div className="space-y-2 text-xs text-white">
                <div className="flex items-center gap-2">
                  <UserRound size={14} className="text-emerald-400" />
                  <span className="truncate font-bold">{user?.nama || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-emerald-400" />
                  <span className="truncate">{user?.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck size={14} className="text-emerald-400" />
                  <span className="uppercase">{user?.role || "-"}</span>
                </div>
              </div>
              <button
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/20 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-red-200 hover:bg-red-500/20"
                onClick={onLogout}
              >
                <LogOut size={14} />
                Logout / Keluar
              </button>
            </div>
          )}

          <button
            className={`w-full rounded-2xl border border-white/10 bg-white/5 p-3 ${showLabel ? "" : "text-center"} hover:bg-white/10 transition-colors`}
            onClick={() => setIsAccountOpen((prev) => !prev)}
            title="Info Akun"
          >
            <div className={`flex items-center ${showLabel ? "gap-3" : "justify-center"}`}>
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                <UserRound size={18} />
              </div>
              {showLabel && (
                <div className="min-w-0 text-left">
                  <p className="truncate text-xs font-black text-white">{user?.nama || "User"}</p>
                  <p className="truncate text-[11px] text-white/55">{user?.email || "-"}</p>
                </div>
              )}
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
