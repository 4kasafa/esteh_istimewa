import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Receipt,
  Banknote,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toCurrency, generateTrxId, getTodayDateString } from "../../utils/formatters";
import CustomSelect from "../common/CustomSelect";

export default function ReportForm({
  value,
  loading,
  user,
  isAdmin = false,
  viewportMode = "desktop",
  isEdit = false,
  onChange,
  onSubmit,
  onCancel,
  availableBahan = [],
  availableTipePengeluaran = [],
  availableBranches = [],
  availableStaff = [],
  yesterdayStock = {},
}) {
  const isWizard = viewportMode === "mobile" || viewportMode === "wizard";
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const todayString = getTodayDateString();

  const branchOptions = useMemo(() => {
    if (Array.isArray(availableBranches) && availableBranches.length > 0) {
      return availableBranches;
    }
    return [];
  }, [availableBranches]);

  const staffOptions = useMemo(() => {
    if (Array.isArray(availableStaff) && availableStaff.length > 0) {
      return availableStaff;
    }
    return [];
  }, [availableStaff]);

  const currentCabang =
    value.CABANG ||
    value["ARUS DANA"] ||
    (user?.cabang && branchOptions.includes(user.cabang) ? user.cabang : "") ||
    (user?.CABANG && branchOptions.includes(user.CABANG) ? user.CABANG : "") ||
    branchOptions[0] ||
    "";
  const currentStaff = value.STAFF || user?.nama || user?.username || staffOptions[0] || "";

  useEffect(() => {
    if (!isEdit) {
      const currentId = value["ID TRANSAKSI"] || value["NO TRANSAKSI"];
      const isLegacyId = !currentId || !String(currentId).toUpperCase().startsWith("TRX-") || String(currentId).includes(",");
      if (isLegacyId) {
        const id = generateTrxId(value.TANGGAL || todayString);
        onChange("ID TRANSAKSI", id);
        onChange("NO TRANSAKSI", id);
      }
      if (!value.TANGGAL) {
        onChange("TANGGAL", todayString);
      }
      if (!value.STAFF && currentStaff) {
        onChange("STAFF", currentStaff);
      }
      if (!value.CABANG && !value["ARUS DANA"] && currentCabang) {
        onChange("CABANG", currentCabang);
        onChange("ARUS DANA", currentCabang);
      }
    }
  }, [currentCabang, currentStaff, isEdit, onChange, todayString, value]);

  // Dynamic options normalization (strict from sheet, no dummy fallbacks)
  const bahanList = useMemo(() => {
    if (!availableBahan || availableBahan.length === 0) {
      return [];
    }
    return availableBahan
      .map((b, idx) => {
        if (typeof b === "string") return { id: `B-${idx}`, nama: b, satuan: "Unit" };
        return {
          id: b.ID_BAHAN || b.id || `B-${idx}`,
          nama: b.NAMA_BAHAN || b.nama || "",
          satuan: b.SATUAN || b.satuan || "Unit",
          status: b.STATUS || b.status || "Aktif",
        };
      })
      .filter((b) => String(b.status).toLowerCase() !== "nonaktif" && b.nama);
  }, [availableBahan]);

  const tipePengeluaranOptions = useMemo(() => {
    if (!availableTipePengeluaran || availableTipePengeluaran.length === 0) {
      return [];
    }
    return availableTipePengeluaran
      .map((t) => (typeof t === "string" ? t : t.NAMA_TIPE || t.nama || t.ID_TIPE))
      .filter(Boolean);
  }, [availableTipePengeluaran]);

  // Multiple pengeluaran state
  const pengeluaranList = Array.isArray(value.pengeluaranList) ? value.pengeluaranList : [];

  const handleAddPengeluaran = () => {
    const defaultTipe = tipePengeluaranOptions[0] || "";
    const newItem = {
      id: `exp-${pengeluaranList.length + 1}-${value["ID TRANSAKSI"] || "item"}`,
      tipe: defaultTipe,
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

    const rincian = list
      .map((item) => {
        const nom = Number(item.nominal) || 0;
        return `[${item.tipe || "Biaya"}: Rp ${nom.toLocaleString("id-ID")}${item.keterangan ? " - " + item.keterangan : ""}]`;
      })
      .join(", ");
    onChange("RINCIAN PENGELUARAN", rincian);
  };

  // Bahan Baku calculations
  const stokBahan = useMemo(() => value.stokBahan || {}, [value.stokBahan]);

  // Prefill stok awal dari yesterdayStock saat form baru (create mode) dan stokBahan kosong
  useEffect(() => {
    if (!isEdit && Object.keys(stokBahan).length === 0 && Object.keys(yesterdayStock || {}).length > 0) {
      const nextStokBahan = {};
      let gelasAwalVal = "";
      for (const [namaBahan, jumlah] of Object.entries(yesterdayStock)) {
        nextStokBahan[namaBahan] = { awal: jumlah, sisa: jumlah };
        if (namaBahan.toLowerCase().includes("gelas") || namaBahan.toLowerCase().includes("cup")) {
          gelasAwalVal = jumlah;
        }
      }
      onChange("stokBahan", nextStokBahan);
      if (gelasAwalVal !== "") {
        onChange("GELAS AWAL", gelasAwalVal);
        onChange("GELAS SISA", gelasAwalVal);
      }
    }
  }, [isEdit, stokBahan, yesterdayStock, onChange]);

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


  // Financial calculations
  const totalPengeluaran = Number(value["TOTAL PENGELUARAN"] ?? value.PENGELUARAN ?? 0) || 0;
  const uangSetoran =
    Number(value["UANG SETORAN"] ?? value["UANG MASUK"] ?? value["UNAG MASUK"] ?? 0) || 0;
  const totalPenjualan = uangSetoran + totalPengeluaran;

  const labelStyle =
    "block text-[10px] font-black uppercase tracking-[0.15em] text-brand-muted/70 mb-1.5 ml-1";
  const inputStyle =
    "w-full rounded-2xl border border-brand-green/15 bg-white px-4 py-3 text-sm font-bold text-brand-green-dark focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-brand-muted/30 shadow-xs";
  const sectionCardStyle =
    "bg-white/90 backdrop-blur-sm rounded-3xl border border-brand-green/10 p-5 sm:p-6 shadow-sm";

  const validateStep = (step) => {
    setStepError("");
    if (step === 1) {
      if (!value.TANGGAL) {
        setStepError("Tanggal laporan wajib diisi.");
        return false;
      }
      if (!value.CABANG && !value["ARUS DANA"] && branchOptions.length > 0) {
        setStepError("Cabang / outlet wajib dipilih.");
        return false;
      }
      if (!value.STAFF && !user?.nama && !user?.username) {
        setStepError("Nama staff wajib diisi.");
        return false;
      }
    }
    return true;
  };

  // Navigasi wizard murni: langkah maju/loop review, TIDAK PERNAH mensubmit form
  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCurrentStep(1);
    }
    setStepError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setStepError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };


  // Submit form terpisah: divalidasi dan dikirim langsung
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }
    onSubmit(e);
  };

  return (
    <form
      className={`max-w-4xl mx-auto space-y-6 ${isWizard ? "pb-28" : "pb-12"}`}
      onSubmit={handleFormSubmit}
    >
      {/* Header Form */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-green/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-2xl sm:text-3xl font-black text-brand-green-dark tracking-tight">
              {isEdit ? "Update Laporan" : "Laporan Baru"}
            </h2>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 self-start sm:self-center rounded-2xl border border-brand-green/20 bg-white px-4 py-2.5 text-xs font-black text-brand-green-dark hover:bg-brand-bg transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Laporan</span>
          </button>
        )}
      </header>

      {/* Stepper Bar Khusus Mode Wizard (Mobile / Tablet) */}
      {isWizard && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-brand-green/10 p-2.5 shadow-xs">
          <div
            className="w-full h-2 rounded-full bg-brand-green/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={4}
          >
            <div
              className="h-full bg-linear-to-r from-brand-green to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Banner jika ada validasi gagal */}
      {stepError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
          <span>⚠️ {stepError}</span>
        </div>
      )}

      {/* Step 1 / Section 1: Informasi Outlet & Jadwal */}
      {(!isWizard || currentStep === 1) && (
        <div className={sectionCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-brand-green" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">
              1. Informasi Outlet & Jadwal
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tanggal Input Manual - Default Hari Ini */}
            <div>
              <label htmlFor="form-tanggal" className={labelStyle}>
                Tanggal Laporan
              </label>
              <input
                id="form-tanggal"
                type="date"
                max={todayString}
                disabled={isEdit || !isAdmin}
                value={value.TANGGAL || todayString}
                onChange={(e) => onChange("TANGGAL", e.target.value)}
                className={`${inputStyle} ${isEdit || !isAdmin ? "bg-brand-bg/60 cursor-not-allowed opacity-75" : ""}`}
                required
              />
              {(isEdit || !isAdmin) && (
                <p className="text-[10px] font-bold text-brand-muted mt-1.5 ml-1 opacity-70">
                  {isEdit
                    ? "Tanggal tidak dapat diubah pada mode edit."
                    : "Tanggal otomatis hari ini (Terkunci untuk Staff)."}
                </p>
              )}
            </div>

            {/* Cabang / Outlet Dari Sheet */}
            <div>
              <label className={labelStyle}>Cabang / Outlet</label>
              {branchOptions.length > 0 ? (
                <CustomSelect
                  value={value.CABANG || value["ARUS DANA"] || currentCabang}
                  options={branchOptions}
                  onChange={(val) => {
                    onChange("CABANG", val);
                    onChange("ARUS DANA", val);
                  }}
                  disabled={loading}
                />
              ) : (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-xs font-bold text-amber-800">
                  Belum ada cabang di Master Sheet
                </div>
              )}
            </div>

            {/* Staff Bertugas */}
            <div>
              <label className={labelStyle}>Staff Bertugas</label>
              {!isAdmin ? (
                <div>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={value.STAFF || user?.nama || user?.username || ""}
                    className={`${inputStyle} bg-brand-bg/60 cursor-not-allowed opacity-75`}
                  />
                  <p className="text-[10px] font-bold text-brand-muted mt-1.5 ml-1 opacity-70">
                    Otomatis dari akun Anda (Terkunci)
                  </p>
                </div>
              ) : (
                <CustomSelect
                  value={value.STAFF || currentStaff}
                  options={staffOptions}
                  onChange={(val) => {
                    onChange("STAFF", val);
                  }}
                  disabled={loading}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 / Section 2: Stok Bahan Baku */}
      {(!isWizard || currentStep === 2) && (
        <section className={sectionCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-brand-green" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">
              2. Stok Bahan Baku
            </h3>
          </div>

          {bahanList.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-brand-green/15 rounded-3xl bg-brand-bg/30">
              <Package size={28} className="mx-auto text-brand-muted opacity-40 mb-1.5" />
              <p className="text-sm font-black text-brand-green-dark">
                Belum ada bahan baku terdaftar di Master Data
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bahanList.map((bahan) => {
                const isGelas =
                  bahan.nama.toLowerCase().includes("gelas") || bahan.nama.toLowerCase().includes("cup");
                const awalVal =
                  stokBahan[bahan.nama]?.awal ??
                  (isGelas ? value["GELAS AWAL"] : "") ??
                  "";
                const sisaVal =
                  stokBahan[bahan.nama]?.sisa ??
                  (isGelas ? value["GELAS SISA"] : "") ??
                  "";
                const awalNum = Number(awalVal) || 0;
                const sisaNum = Number(sisaVal) || 0;
                const terpakai = Math.max(0, awalNum - sisaNum);

                return (
                  <div
                    key={bahan.id || bahan.nama}
                    className="p-4 rounded-2xl border border-brand-green/10 bg-brand-bg/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-brand-green-dark">{bahan.nama}</h4>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {terpakai} {bahan.satuan || ""}
                      </span>
                    </div>

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
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Step 3 / Section 3: Pengeluaran Operasional (Multiple Rows) */}
      {(!isWizard || currentStep === 3) && (
        <section className={sectionCardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-brand-green" />
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">
                3. Pengeluaran Operasional
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddPengeluaran}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-green hover:text-brand-green-dark bg-brand-green/10 hover:bg-brand-green/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Tambah Baris</span>
            </button>
          </div>

          {pengeluaranList.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-brand-green/15 rounded-2xl bg-brand-bg/30">
              <p className="text-xs font-bold text-brand-muted">
                Tidak ada pengeluaran operasional hari ini.
              </p>
              <button
                type="button"
                onClick={handleAddPengeluaran}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-brand-green hover:underline cursor-pointer"
              >
                <Plus size={14} />
                <span>Klik untuk mencatat nota/pengeluaran</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pengeluaranList.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-2xl border border-brand-green/10 bg-white/70 shadow-xs"
                >
                  <div className="w-full sm:w-48 shrink-0">
                    {tipePengeluaranOptions.length > 0 ? (
                      <CustomSelect
                        value={item.tipe}
                        options={tipePengeluaranOptions}
                        onChange={(val) => handleExpenseChange(index, "tipe", val)}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Tipe pengeluaran"
                        className="w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2.5 text-xs font-bold text-brand-green-dark focus:outline-none focus:border-brand-green"
                        value={item.tipe}
                        onChange={(e) => handleExpenseChange(index, "tipe", e.target.value)}
                      />
                    )}
                  </div>

                  <div className="w-full sm:w-36 shrink-0">
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
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">Total Pengeluaran:</span>
            <span className="text-base font-black text-amber-900">{toCurrency(totalPengeluaran)}</span>
          </div>
        </section>
      )}

      {/* Step 4 / Section 4: Kas Setoran & Rangkuman Finansial */}
      {(!isWizard || currentStep === 4) && (
        <section className={sectionCardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Banknote size={18} className="text-brand-green" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">
              4. Kas Setoran & Rangkuman Finansial
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
                  // backward-compat: sinkronisasi field sheet historis dengan typo kolom 'UNAG MASUK'
                  onChange("UNAG MASUK", val);
                }}
              />
            </div>

            <div>
              <label className={labelStyle}>Keterangan</label>
              <input
                type="text"
                placeholder="Misal: Es batu sempat habis jam 15:00..."
                className={inputStyle}
                value={value.KETERANGAN || ""}
                onChange={(e) => onChange("KETERANGAN", e.target.value)}
              />
            </div>

            {/* Rangkuman Finansial Otomatis (Mobile-First Responsive Layout) */}
            <div className="rounded-3xl bg-linear-to-br from-brand-green-dark via-emerald-950 to-emerald-900 p-4 sm:p-5 text-white shadow-md border border-white/10 space-y-3">
              {/* Header Title */}
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                    Rangkuman Finansial
                  </h4>
                </div>
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">
                  Kalkulasi Otomatis
                </span>
              </div>

              {/* Hero Metric: Total Penjualan (Omset) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Total Penjualan (Omset)
                  </p>
                  <p className="text-[11px] text-white/60 font-medium">
                    Setoran Kas + Pengeluaran
                  </p>
                </div>
                <div className="xs:text-right">
                  <p className="text-lg sm:text-2xl font-black text-emerald-300 tabular-nums tracking-tight">
                    {toCurrency(totalPenjualan)}
                  </p>
                </div>
              </div>

              {/* Breakdown Detail: Setoran Tunai & Total Pengeluaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Setoran Tunai */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Setoran Tunai</p>
                    <p className="text-[10px] text-white/40">Fisik kas disetor</p>
                  </div>
                  <span className="text-sm sm:text-base font-black text-white tabular-nums tracking-tight shrink-0">
                    {toCurrency(uangSetoran)}
                  </span>
                </div>

                {/* Pengeluaran */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider">Pengeluaran</p>
                    <p className="text-[10px] text-white/40">Total nota beban</p>
                  </div>
                  <span className="text-sm sm:text-base font-black text-amber-300 tabular-nums tracking-tight shrink-0">
                    {toCurrency(totalPengeluaran)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Input Laporan - Ditempatkan di Bagian Paling Bawah Langkah 4 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-brand-green to-emerald-600 hover:from-emerald-700 hover:to-brand-green text-white font-black py-4 sm:py-5 rounded-2xl shadow-xl shadow-brand-green/20 transition-all text-sm uppercase tracking-widest cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
                title="Input dan simpan laporan harian ke spreadsheet"
              >
                <CheckCircle2 size={18} />
                <span>{loading ? "Menyimpan Laporan..." : (isEdit ? "Update Laporan" : "Kirim Laporan Harian")}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Sticky Floating Bottom Bar Khusus Mode Wizard (Mobile / Tablet) */}
      {isWizard && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-green/15 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 px-2">
            {/* Tombol Kiri: teks kecil "< kembali" */}
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              aria-label="Kembali"
              title="Kembali"
              className={`
                inline-flex items-center justify-center min-w-20 px-3 h-11 rounded-2xl border text-xs font-black transition-all
                ${
                  currentStep === 1
                    ? "border-brand-green/10 text-brand-muted/30 cursor-not-allowed opacity-40 bg-brand-bg/30"
                    : "border-brand-green/20 bg-white text-brand-green-dark hover:bg-brand-bg shadow-xs cursor-pointer active:scale-95"
                }
              `}
            >
              <span className="text-xs">&lt; kembali</span>
            </button>

            {/* Indikator Tengah */}
            <div className="flex items-center gap-1 text-xs font-black text-brand-muted whitespace-nowrap">
              <span>Langkah {currentStep} dari 4</span>
            </div>

            {/* Tombol Kanan (Langkah 1-3): teks kecil "lanjut >" */}
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                aria-label="Lanjut"
                title="Lanjut ke langkah berikutnya"
                className="inline-flex items-center justify-center min-w-20 px-3 h-11 rounded-2xl border border-brand-green/20 bg-white text-brand-green-dark hover:bg-brand-bg shadow-xs cursor-pointer active:scale-95 transition-all text-xs font-black"
              >
                <span className="text-xs">lanjut &gt;</span>
              </button>
            ) : (
              <span className="inline-flex items-center justify-center min-w-20 px-3 h-11 text-[11px] font-bold text-brand-muted/60">
                Isi &amp; kirim ⬆
              </span>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
