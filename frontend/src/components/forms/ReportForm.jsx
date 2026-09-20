import { useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Trash2, Package, Receipt, Banknote } from "lucide-react";
import { toCurrency, toFormattedTimestamp } from "../../utils/formatters";
import CustomSelect from "../common/CustomSelect";

export default function ReportForm({
  value,
  loading,
  user,
  isEdit = false,
  onChange,
  onSubmit,
  onCancel,
  availableBahan = [],
  availableTipePengeluaran = [],
  availableBranches = [],
  availableStaff = [],
}) {
  const branchOptions = useMemo(() => {
    if (Array.isArray(availableBranches) && availableBranches.length > 0) {
      return availableBranches;
    }
    return [user?.cabang || "Cabang Utama"];
  }, [availableBranches, user?.cabang]);

  const staffOptions = useMemo(() => {
    if (Array.isArray(availableStaff) && availableStaff.length > 0) {
      return availableStaff;
    }
    return [user?.nama || "Staff"];
  }, [availableStaff, user?.nama]);

  const currentCabang = value.CABANG || value["ARUS DANA"] || user?.cabang || branchOptions[0];
  const currentStaff = value.STAFF || user?.nama || staffOptions[0];

  useEffect(() => {
    if (!isEdit) {
      if (!value["ID TRANSAKSI"] && !value["NO TRANSAKSI"]) {
        const id = toFormattedTimestamp();
        onChange("ID TRANSAKSI", id);
        onChange("NO TRANSAKSI", id);
      }
      if (!value.STAFF && currentStaff) {
        onChange("STAFF", currentStaff);
      }
      if (!value.CABANG && !value["ARUS DANA"] && currentCabang) {
        onChange("CABANG", currentCabang);
        onChange("ARUS DANA", currentCabang);
      }
    }
  }, [currentCabang, currentStaff, isEdit, onChange, value]);

  // Dynamic options normalization
  const bahanList = useMemo(() => {
    if (!availableBahan || availableBahan.length === 0) {
      return [
        { id: "BAHAN-01", nama: "Gelas Cup", satuan: "Cup" },
        { id: "BAHAN-02", nama: "Es Batu", satuan: "Plastik" },
        { id: "BAHAN-03", nama: "Teh", satuan: "Bungkus" },
        { id: "BAHAN-04", nama: "Gula", satuan: "Kg" },
      ];
    }
    return availableBahan.map((b, idx) => {
      if (typeof b === "string") return { id: `B-${idx}`, nama: b, satuan: "Unit" };
      return {
        id: b.ID_BAHAN || b.id || `B-${idx}`,
        nama: b.NAMA_BAHAN || b.nama || "",
        satuan: b.SATUAN || b.satuan || "Unit",
        status: b.STATUS || b.status || "Aktif",
      };
    }).filter((b) => String(b.status).toLowerCase() !== "nonaktif" && b.nama);
  }, [availableBahan]);

  const tipePengeluaranOptions = useMemo(() => {
    if (!availableTipePengeluaran || availableTipePengeluaran.length === 0) {
      return ["Gelas Cup", "Es Batu", "Teh", "Gula", "Air Galon", "Plastik / Sedotan", "Operasional Lain-lain"];
    }
    return availableTipePengeluaran
      .map((t) => (typeof t === "string" ? t : t.NAMA_TIPE || t.nama || t.ID_TIPE))
      .filter(Boolean);
  }, [availableTipePengeluaran]);

  // Multiple pengeluaran state
  const pengeluaranList = Array.isArray(value.pengeluaranList) ? value.pengeluaranList : [];

  const handleAddPengeluaran = () => {
    const newItem = {
      id: `exp-${pengeluaranList.length + 1}-${value["ID TRANSAKSI"] || "item"}`,
      tipe: tipePengeluaranOptions[0] || "Operasional Lain-lain",
      nominal: "",
      keterangan: "",
    };
    const nextList = [...pengeluaranList, newItem];
    updatePengeluaranList(nextList);
  };

  const handleRemovePengeluaran = (index) => {
    const nextList = pengeluaranList.filter((_, i) => i !== index);
    updatePengeluaranList(nextList);
  };

  const handleExpenseChange = (index, field, val) => {
    const nextList = pengeluaranList.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: val };
      }
      return item;
    });
    updatePengeluaranList(nextList);
  };

  const updatePengeluaranList = (list) => {
    onChange("pengeluaranList", list);
    const total = list.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
    onChange("TOTAL PENGELUARAN", total);
    onChange("PENGELUARAN", total);

    const rincian = list.map((item) => {
      const nom = Number(item.nominal) || 0;
      return `[${item.tipe}: Rp ${nom.toLocaleString("id-ID")}${item.keterangan ? " - " + item.keterangan : ""}]`;
    }).join(", ");
    onChange("RINCIAN PENGELUARAN", rincian);
  };

  // Bahan Baku calculations
  const stokBahan = value.stokBahan || {};

  const handleBahanChange = (namaBahan, field, val) => {
    const current = stokBahan[namaBahan] || { awal: 0, sisa: 0 };
    const updated = { ...current, [field]: val };
    const nextStokBahan = { ...stokBahan, [namaBahan]: updated };
    onChange("stokBahan", nextStokBahan);

    // Sync Gelas Cup for backward-compatibility
    if (namaBahan.toLowerCase().includes("gelas") || namaBahan.toLowerCase().includes("cup")) {
      if (field === "awal") onChange("GELAS AWAL", val);
      if (field === "sisa") onChange("GELAS SISA", val);
    }
  };

  // Extract Gelas Cup values
  const gelasAwal = Number(value["GELAS AWAL"] ?? stokBahan["Gelas Cup"]?.awal ?? value["GELAS MASUK"] ?? 0) || 0;
  const gelasSisa = Number(value["GELAS SISA"] ?? stokBahan["Gelas Cup"]?.sisa ?? 0) || 0;
  const gelasRusak = Number(value["GELAS RUSAK"] ?? 0) || 0;
  const calculatedGelasLaku = Math.max(0, gelasAwal - (gelasSisa + gelasRusak));

  // Financial calculations
  const totalPengeluaran = Number(value["TOTAL PENGELUARAN"] ?? value.PENGELUARAN ?? 0) || 0;
  const uangSetoran = Number(value["UANG SETORAN"] ?? value["UANG MASUK"] ?? value["UNAG MASUK"] ?? 0) || 0;
  
  // Total Penjualan = Uang Setoran + Total Pengeluaran
  const totalPenjualan = uangSetoran + totalPengeluaran;

  const labelStyle = "block text-[10px] font-black uppercase tracking-[0.15em] text-brand-muted/70 mb-1.5 ml-1";
  const inputStyle = "w-full rounded-2xl border border-brand-green/15 bg-white px-4 py-3 text-sm font-bold text-brand-green-dark focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-brand-muted/30 shadow-xs";
  const sectionCardStyle = "bg-white/90 backdrop-blur-sm rounded-3xl border border-brand-green/10 p-5 sm:p-6 shadow-sm";

  return (
    <form className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-12" onSubmit={onSubmit}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-green/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-2xl sm:text-3xl font-black text-brand-green-dark tracking-tight">
              {isEdit ? "Update Laporan" : "Laporan Baru"}
            </h2>
          </div>
          <p className="text-xs text-brand-muted font-bold mt-1 uppercase tracking-widest opacity-70">
            ID: {value["ID TRANSAKSI"] || value["NO TRANSAKSI"] || "TRX-BARU"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-2xl border border-brand-green/20 bg-white px-4 py-2.5 text-xs font-black text-brand-green-dark hover:bg-brand-bg transition-colors shadow-xs"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Laporan</span>
            </button>
          )}
        </div>
      </header>

      {/* Basic Info */}
      <div className={sectionCardStyle}>
        <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/60 mb-4 flex items-center gap-2">
          <Package size={16} className="text-brand-green" />
          <span>Informasi Outlet & Staff</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Cabang / Outlet</label>
            <CustomSelect
              value={value.CABANG || value["ARUS DANA"] || currentCabang}
              options={branchOptions}
              onChange={(val) => {
                onChange("CABANG", val);
                onChange("ARUS DANA", val);
              }}
              disabled={loading}
            />
          </div>
          <div>
            <label className={labelStyle}>Staff Bertugas</label>
            <CustomSelect
              value={value.STAFF || currentStaff}
              options={staffOptions}
              onChange={(val) => {
                onChange("STAFF", val);
              }}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Bagian 1: Stok Bahan Baku */}
      <section className={sectionCardStyle}>
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-brand-green" />
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/60">
            1. Stok Bahan Baku
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bahanList.map((bahan) => {
            const isGelas = bahan.nama.toLowerCase().includes("gelas") || bahan.nama.toLowerCase().includes("cup");
            const awalVal = isGelas ? (value["GELAS AWAL"] ?? "") : (stokBahan[bahan.nama]?.awal ?? "");
            const sisaVal = isGelas ? (value["GELAS SISA"] ?? "") : (stokBahan[bahan.nama]?.sisa ?? "");
            const awalNum = Number(awalVal) || 0;
            const sisaNum = Number(sisaVal) || 0;
            const terpakai = Math.max(0, awalNum - sisaNum);

            return (
              <div key={bahan.id || bahan.nama} className="p-4 rounded-2xl border border-brand-green/10 bg-brand-bg/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-brand-green-dark">{bahan.nama}</h4>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {isGelas ? bahan.satuan || "Cup" : `${terpakai} ${bahan.satuan || ""}`}
                  </span>
                </div>

                {isGelas ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className={labelStyle}>Gelas Awal</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          aria-label="Gelas Awal"
                          className={inputStyle}
                          value={awalVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            onChange("GELAS AWAL", val);
                            handleBahanChange(bahan.nama, "awal", val);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Gelas Sisa</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          aria-label="Gelas Sisa"
                          className={inputStyle}
                          value={sisaVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            onChange("GELAS SISA", val);
                            handleBahanChange(bahan.nama, "sisa", val);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Gelas Rusak</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          aria-label="Gelas Rusak"
                          className={inputStyle}
                          value={value["GELAS RUSAK"] ?? ""}
                          onChange={(e) => onChange("GELAS RUSAK", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className={labelStyle}>Gelas Laku</span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {calculatedGelasLaku} Cup
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelStyle}>Stok Awal</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        aria-label={`Stok Awal ${bahan.nama}`}
                        className={inputStyle}
                        value={awalVal}
                        onChange={(e) => handleBahanChange(bahan.nama, "awal", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Stok Sisa</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        aria-label={`Stok Sisa ${bahan.nama}`}
                        className={inputStyle}
                        value={sisaVal}
                        onChange={(e) => handleBahanChange(bahan.nama, "sisa", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </section>

      {/* Bagian 2: Pengeluaran Operasional (Multiple) */}
      <section className={sectionCardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-brand-green" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/60">
              2. Pengeluaran Operasional
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddPengeluaran}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-green/10 hover:bg-brand-green/20 text-brand-green-dark font-black text-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Tambah Pengeluaran</span>
          </button>
        </div>

        {pengeluaranList.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-brand-green/10 rounded-2xl bg-brand-bg/20">
            <p className="text-xs font-bold text-brand-muted">Tidak ada pengeluaran operasional hari ini.</p>
            <button
              type="button"
              onClick={handleAddPengeluaran}
              className="mt-2 text-xs font-black text-brand-green hover:underline cursor-pointer"
            >
              + Catat Pengeluaran Baru
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {pengeluaranList.map((item, index) => (
              <div key={item.id || index} className="p-3 sm:p-4 rounded-2xl border border-brand-green/10 bg-brand-bg/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="w-full sm:w-48 shrink-0">
                  <label className="sm:hidden text-[9px] font-bold text-brand-muted uppercase">Tipe</label>
                  <select
                    className="w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2.5 text-xs font-bold text-brand-green-dark focus:outline-none focus:border-brand-green"
                    value={item.tipe}
                    onChange={(e) => handleExpenseChange(index, "tipe", e.target.value)}
                  >
                    {tipePengeluaranOptions.map((tipe) => (
                      <option key={tipe} value={tipe}>{tipe}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-36 shrink-0">
                  <label className="sm:hidden text-[9px] font-bold text-brand-muted uppercase">Nominal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Nominal (Rp)"
                    aria-label={`Nominal Pengeluaran ${index + 1}`}
                    className="w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2.5 text-xs font-bold text-brand-green-dark focus:outline-none focus:border-brand-green"
                    value={item.nominal}
                    onChange={(e) => handleExpenseChange(index, "nominal", e.target.value)}
                    required
                  />
                </div>

                <div className="flex-1">
                  <label className="sm:hidden text-[9px] font-bold text-brand-muted uppercase">Keterangan / Nota</label>
                  <input
                    type="text"
                    placeholder="Keterangan / Nota (Opsional)"
                    className="w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2.5 text-xs font-bold text-brand-green-dark focus:outline-none focus:border-brand-green"
                    value={item.keterangan}
                    onChange={(e) => handleExpenseChange(index, "keterangan", e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePengeluaran(index)}
                  className="self-end sm:self-center p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Hapus baris pengeluaran"
                  aria-label="Hapus pengeluaran"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Total Pengeluaran Display */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900">Total Pengeluaran:</span>
          <span className="text-base font-black text-amber-900">{toCurrency(totalPengeluaran)}</span>
        </div>
      </section>

      {/* 3: Uang Setoran */}
      <section className={sectionCardStyle}>
        <div className="flex items-center gap-2 mb-4">
          <Banknote size={16} className="text-brand-green" />
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/60">
            3. Kas Setoran
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="uang-setoran" className={labelStyle}>
              Uang Setoran Tunai (Rp)
            </label>
            <input
              id="uang-setoran"
              type="number"
              min="0"
              step="any"
              aria-label="Uang Setoran"
              placeholder="Masukkan nominal uang tunai yang disetor (Rp)"
              className="w-full rounded-2xl border-2 border-brand-green/30 bg-white px-5 py-3.5 text-base font-black text-brand-green-dark focus:outline-none focus:ring-4 focus:ring-brand-green/20 focus:border-brand-green transition-all"
              value={value["UANG SETORAN"] ?? value["UANG MASUK"] ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange("UANG SETORAN", val);
                onChange("UANG MASUK", val);
                onChange("UNAG MASUK", val);
              }}
            />
          </div>

          <div>
            <label className={labelStyle}>Catatan Operasional Umum (Opsional)</label>
            <input
              type="text"
              placeholder="Misal: Es batu sempat habis jam 15:00..."
              className={inputStyle}
              value={value.KETERANGAN || ""}
              onChange={(e) => onChange("KETERANGAN", e.target.value)}
            />
          </div>

          {/* Rangkuman Finansial Otomatis */}
          <div className="rounded-2xl bg-linear-to-br from-brand-green-dark to-emerald-900 p-4 text-white">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-3">
              Rangkuman Finansial
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Setoran</p>
                <p className="text-sm font-black mt-0.5 text-white">{toCurrency(uangSetoran)}</p>
              </div>
              <div>
                <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Beban</p>
                <p className="text-sm font-black mt-0.5 text-amber-300">{toCurrency(totalPengeluaran)}</p>
              </div>
              <div>
                <p className="text-[9px] text-emerald-300 font-black uppercase tracking-wider">Omset</p>
                <p className="text-base font-black mt-0.5 text-emerald-300">{toCurrency(totalPenjualan)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tombol Simpan */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-linear-to-r from-brand-green to-emerald-600 hover:from-emerald-700 hover:to-brand-green text-white font-black py-4 sm:py-5 rounded-2xl shadow-xl shadow-brand-green/20 transition-all text-sm uppercase tracking-widest cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Menyimpan Laporan..." : (isEdit ? "Update Laporan" : "Kirim Laporan Harian")}
        </button>
      </div>
    </form>
  );
}
