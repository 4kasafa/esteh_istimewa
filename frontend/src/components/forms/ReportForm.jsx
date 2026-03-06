import { useEffect, useMemo } from "react";
import { 
  DENOMINATIONS_DATA, 
  SHIFT_OPTIONS, 
  BRANCH_OPTIONS,
  KASIR_OPTIONS 
} from "../../constants/forms";
import { toFormattedTimestamp } from "../../utils/formatters";
import CustomSelect from "../common/CustomSelect";

export default function ReportForm({ 
  value, 
  loading, 
  user, 
  isEdit = false, 
  onChange, 
  onSubmit 
}) {
  
  useEffect(() => {
    if (!isEdit) {
      if (!value["NO TRANSAKSI"]) onChange("NO TRANSAKSI", toFormattedTimestamp());
      if (!value["KASIR"] && user?.nama) onChange("KASIR", user.nama);
    }
  }, [isEdit, user?.nama, onChange, value]);

  const denomTotal = useMemo(() => {
    return DENOMINATIONS_DATA.reduce((acc, item) => {
      const count = parseInt(value[item.label]) || 0;
      return acc + (count * item.value);
    }, 0);
  }, [value]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const labelStyle = "block text-[9px] font-black uppercase tracking-[0.15em] text-brand-muted/60 mb-1.5 ml-1";
  const inputStyle = "w-full rounded-xl border border-brand-green/10 bg-white px-3.5 py-2.5 text-sm font-bold text-brand-green-dark focus:outline-none focus:ring-4 focus:ring-brand-green/5 focus:border-brand-green transition-all placeholder:text-brand-muted/20 focus:placeholder:text-transparent shadow-sm";
  const groupTitleStyle = "text-[11px] font-black text-brand-green-dark/40 uppercase tracking-[0.2em] mb-5 flex items-center gap-3 before:content-[''] before:w-1 before:h-3 before:bg-brand-green/30 before:rounded-full";

  return (
    <form className="max-w-375 mx-auto animate-fade-in flex flex-col lg:h-[calc(100vh-8.5rem)]" onSubmit={onSubmit}>
      {/* Fixed Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-green/10 pb-2 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-brand-green-dark tracking-tighter">
            {isEdit ? "Update Laporan" : "Laporan Baru"}
          </h2>
          <p className="text-[9px] sm:text-[10px] text-brand-muted font-bold mt-0.5 uppercase tracking-widest opacity-60">
            ID: {value["NO TRANSAKSI"]}
          </p>
        </div>
      </header>

      {/* Main Dual-Column Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 mt-5 min-h-0 overflow-hidden">
        
        {/* Left Column: Form Sections (Groups A-D) - Now first on mobile */}
        <div className="lg:flex-1 lg:overflow-y-auto lg:pr-4 no-scrollbar order-1 lg:order-1 space-y-8 pb-10 lg:pb-0">
          
          <div className="space-y-8 mt-2 lg:mt-0">
            {/* Group A: Metadata */}
            <section>
              <h3 className={groupTitleStyle}>Informasi Dasar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Shift</label>
                  <CustomSelect 
                    value={value.SHIFT} 
                    options={SHIFT_OPTIONS} 
                    onChange={(val) => onChange("SHIFT", val)} 
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Cabang</label>
                  <CustomSelect 
                    value={value["ARUS DANA"]} 
                    options={BRANCH_OPTIONS} 
                    onChange={(val) => onChange("ARUS DANA", val)} 
                    placeholder="Pilih Cabang"
                    disabled={loading}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelStyle}>Kasir</label>
                  <CustomSelect 
                    value={value.KASIR} 
                    options={KASIR_OPTIONS} 
                    onChange={(val) => onChange("KASIR", val)} 
                    placeholder="Pilih Kasir"
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            {/* Group B: Inventory */}
            <section>
              <h3 className={groupTitleStyle}>Data Gelas</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelStyle}>Laku</label>
                  <input type="number" min="0" step="any" className={inputStyle} value={value["GELAS LAKU"]} onChange={(e) => onChange("GELAS LAKU", e.target.value)} required />
                </div>
                <div>
                  <label className={labelStyle}>Masuk</label>
                  <input type="number" min="0" step="any" className={inputStyle} value={value["GELAS MASUK"]} onChange={(e) => onChange("GELAS MASUK", e.target.value)} required />
                </div>
                <div>
                  <label className={labelStyle}>Rusak</label>
                  <input type="number" min="0" step="any" className={inputStyle} value={value["GELAS RUSAK"]} onChange={(e) => onChange("GELAS RUSAK", e.target.value)} required />
                </div>
              </div>
            </section>

            {/* Group C: Supplies */}
            <section>
              <h3 className={groupTitleStyle}>Bahan Baku</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelStyle}>Es (Depo)</label>
                  <input type="number" min="0" step="any" className={inputStyle} value={value["ES BATU DEPO"]} onChange={(e) => onChange("ES BATU DEPO", e.target.value)} required placeholder="0" />
                </div>
                <div>
                  <label className={labelStyle}>Es (Beli)</label>
                  <input type="number" min="0" step="any" className={inputStyle} value={value["ES BATU BELI"]} onChange={(e) => onChange("ES BATU BELI", e.target.value)} required placeholder="0" />
                </div>
                <div>
                  <label className={labelStyle}>Teh</label>
                  <input type="number" min="0" step="any" className={inputStyle} value={value["TEH"]} onChange={(e) => onChange("TEH", e.target.value)} required placeholder="0" />
                </div>
                <div>
                  <label className={labelStyle}>Gula</label>
                  <input type="number" min="0" step="any" className={inputStyle} value={value["GULA"]} onChange={(e) => onChange("GULA", e.target.value)} required placeholder="0" />
                </div>
              </div>
            </section>

            {/* Group D: Expenses */}
            <section>
              <h3 className={groupTitleStyle}>Pengeluaran & Keterangan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelStyle}>Nominal</label>
                  <input type="number" min="0" step="any" className={inputStyle} value={value.PENGELUARAN} onChange={(e) => onChange("PENGELUARAN", e.target.value)} required />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelStyle}>Keterangan (Opsional)</label>
                  <input className={inputStyle} value={value.KETERANGAN} onChange={(e) => onChange("KETERANGAN", e.target.value)} placeholder="Keterangan laporan..." />
                </div>
              </div>
            </section>
          </div>

          {/* Desktop Submit Area */}
          <div className="hidden lg:block pt-8 border-t border-brand-green/5 mt-auto">
            <button
              className="w-full bg-linear-to-r from-brand-yellow to-yellow-500 hover:scale-[1.01] active:scale-[0.99] text-brand-green-dark font-black py-4 rounded-xl shadow-xl shadow-brand-yellow/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              <span className="tracking-[0.2em] uppercase text-[10px]">{isEdit ? "Update Laporan" : "Kirim Laporan Harian"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Group E (Denominations) - Now second on mobile */}
        <div className="lg:w-105 shrink-0 order-2 lg:order-2">
          <div className="bg-[#1B3A1E] rounded-4xl flex flex-col h-full lg:h-full max-h-125 text-white shadow-2xl shadow-brand-green/20 overflow-hidden">
            <header className="p-5 sm:p-6 border-b border-white/5">
              <h3 className="text-lg font-black tracking-tight">Rincian Kas</h3>
              <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">Hitung fisik uang tunai</p>
            </header>

            {/* Internal Scrollable Denoms */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 no-scrollbar">
              {DENOMINATIONS_DATA.map((item) => {
                const count = parseInt(value[item.label]) || 0;
                const subtotal = count * item.value;
                return (
                  <label key={item.label} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3.5 last:border-0 cursor-pointer group/item hover:bg-white/2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-white uppercase tracking-[0.2em] mb-1.5 group-hover/item:text-brand-yellow transition-colors">{item.label}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-white/10 font-black text-[9px]">×</span>
                        <input
                          type="number"
                          min="0"
                          className="w-20 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-black text-white focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-yellow/40 transition-all focus:placeholder:text-transparent"
                          value={value[item.label]}
                          onChange={(e) => onChange(item.label, e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-brand-yellow tracking-tight tabular-nums group-hover/item:scale-105 transition-transform origin-right">{formatCurrency(subtotal).replace("Rp", "").trim()}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            
            {/* Anchored Footer Total */}
            <footer className="p-5 sm:p-6 bg-white/4 border-t border-white/10 shrink-0">
               <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">Total Akhir</p>
                    <p className="text-[10px] font-bold text-white/50">Estimasi Tunai</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-brand-yellow tabular-nums leading-none">{formatCurrency(denomTotal)}</p>
                  </div>
               </div>
            </footer>
          </div>
        </div>

        {/* Mobile Submit Button */}
        <div className="lg:hidden order-3">
          <button
            className="w-full bg-linear-to-r from-brand-yellow to-yellow-500 text-brand-green-dark font-black py-3 rounded-xl transition-all"
            type="submit"
            disabled={loading}
          >
            <span className="tracking-[0.2em] uppercase text-xs">{isEdit ? "Update Laporan" : "Submit Laporan"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
