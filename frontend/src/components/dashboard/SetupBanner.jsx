import { Sparkles, ArrowRight, X } from "lucide-react";

export default function SetupBanner({ onStartWizard, onDismiss }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#14381C] via-[#1B4D26] to-[#14381C] p-4 sm:p-5 text-white shadow-xl shadow-brand-green-dark/10 border border-emerald-500/20 animate-fade-in mb-5 sm:mb-6">
      {/* Glow background accent */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-black tracking-tight text-white">
                Setup Awal Operasional Belum Lengkap
              </h4>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Penting
              </span>
            </div>
            <p className="text-xs font-semibold text-white/75 mt-0.5 max-w-xl leading-relaxed">
              Daftarkan cabang, staf, dan bahan baku Anda dengan panduan langkah-demi-langkah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center shrink-0">
          <button
            type="button"
            onClick={onStartWizard}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#14381C] text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <span>Mulai Set data awal</span>
            <ArrowRight size={15} />
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup banner untuk sesi ini"
              aria-label="Tutup banner"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
