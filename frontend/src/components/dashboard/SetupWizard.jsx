import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Package,
  Plus,
  Store,
  Trash2,
  Users,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

const STEP_NAMES = ["Cabang", "Karyawan", "Bahan Baku", "Selesai"];

export default function SetupWizard({
  open,
  onClose,
  onFinish,
  request,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");

  // Step 1: Cabang (otomatis generate id, user hanya isi nama & alamat)
  const [cabangList, setCabangList] = useState([
    { id: "cab-temp-1", nama: "", alamat: "", isSaved: false },
  ]);

  // Step 2: Karyawan / Staff
  const [karyawanList, setKaryawanList] = useState([
    { id: "emp-temp-1", nama: "", telepon: "", password: "", isSaved: false },
  ]);

  // Step 3: Master Bahan Baku
  const [bahanList, setBahanList] = useState([
    { id: "bhn-temp-1", nama: "", satuan: "", isSaved: false },
  ]);

  // Saving state per step
  const [isSaving, setIsSaving] = useState(false);
  const [savingText, setSavingText] = useState("");

  if (!open) return null;

  // --- Handlers Step 1: Cabang ---
  const handleAddCabang = () => {
    setCabangList((prev) => [
      ...prev,
      { id: `cab-temp-${Date.now()}`, nama: "", alamat: "", isSaved: false },
    ]);
  };

  const handleRemoveCabang = (id) => {
    setCabangList((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCabangChange = (id, field, value) => {
    setCabangList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value, isSaved: false } : c))
    );
  };

  // --- Handlers Step 2: Karyawan ---
  const handleAddKaryawan = () => {
    setKaryawanList((prev) => [
      ...prev,
      {
        id: `emp-temp-${Date.now()}`,
        nama: "",
        telepon: "",
        password: "",
        isSaved: false,
      },
    ]);
  };

  const handleRemoveKaryawan = (id) => {
    setKaryawanList((prev) => prev.filter((k) => k.id !== id));
  };

  const handleKaryawanChange = (id, field, value) => {
    setKaryawanList((prev) =>
      prev.map((k) => (k.id === id ? { ...k, [field]: value, isSaved: false } : k))
    );
  };

  // --- Handlers Step 3: Bahan Baku ---
  const handleAddBahan = () => {
    setBahanList((prev) => [
      ...prev,
      { id: `bhn-temp-${Date.now()}`, nama: "", satuan: "", isSaved: false },
    ]);
  };

  const handleRemoveBahan = (id) => {
    setBahanList((prev) => prev.filter((b) => b.id !== id));
  };

  const handleBahanChange = (id, field, value) => {
    setBahanList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value, isSaved: false } : b))
    );
  };

  // --- Step Navigation & Validation ---
  const validateCurrentStep = () => {
    setStepError("");

    if (currentStep === 1) {
      for (let i = 0; i < cabangList.length; i++) {
        const item = cabangList[i];
        if (item.alamat.trim() && !item.nama.trim()) {
          setStepError(`Nama cabang pada baris #${i + 1} wajib diisi.`);
          return false;
        }
      }
    } else if (currentStep === 2) {
      for (let i = 0; i < karyawanList.length; i++) {
        const item = karyawanList[i];
        if ((item.telepon.trim() || item.password.trim()) && !item.nama.trim()) {
          setStepError(`Nama staf pada baris #${i + 1} wajib diisi.`);
          return false;
        }
      }
    } else if (currentStep === 3) {
      for (let i = 0; i < bahanList.length; i++) {
        const item = bahanList[i];
        if (item.satuan.trim() && !item.nama.trim()) {
          setStepError(`Nama bahan baku pada baris #${i + 1} wajib diisi.`);
          return false;
        }
      }
    }

    return true;
  };

  // Simpan data per langkah sebelum berpindah ke langkah selanjutnya
  const handleNext = async () => {
    if (!validateCurrentStep()) return;
    setStepError("");

    // --- STEP 1 -> 2: Simpan Cabang ke Sheets ---
    if (currentStep === 1) {
      const unsaved = cabangList.filter((c) => Boolean(c.nama.trim()) && !c.isSaved);
      if (unsaved.length > 0 && request) {
        setIsSaving(true);
        try {
          // ponytail: 1 bulk request ganti N request serial (backend create_many).
          setSavingText(`Menyimpan ${unsaved.length} cabang...`);
          await request({
            action: "update_master",
            target: "cabang",
            operation: "create",
            data: unsaved.map((c) => ({
              NAMA_CABANG: c.nama.trim(),
              ALAMAT: c.alamat.trim() || "-",
              STATUS: "Aktif",
            })),
          });

          setCabangList((prev) =>
            prev.map((c) => (c.nama.trim() ? { ...c, isSaved: true } : c))
          );
        } catch (err) {
          setStepError(err?.message || "Gagal menyimpan cabang ke spreadsheet.");
          setIsSaving(false);
          return;
        } finally {
          setIsSaving(false);
          setSavingText("");
        }
      }

      setCurrentStep(2);
      return;
    }

    // --- STEP 2 -> 3: Simpan Karyawan ke Sheets ---
    if (currentStep === 2) {
      const unsaved = karyawanList.filter((k) => Boolean(k.nama.trim()) && !k.isSaved);
      if (unsaved.length > 0 && request) {
        setIsSaving(true);
        try {
          // ponytail: 1 bulk request ganti N request serial (backend create_many).
          setSavingText(`Menyimpan ${unsaved.length} staf...`);
          await request({
            action: "update_master",
            target: "user",
            operation: "create",
            data: unsaved.map((k) => ({
              "NAMA / USERNAME": k.nama.trim(),
              USERNAME: k.nama.trim(),
              "NO. TELEPON": k.telepon.trim() || "-",
              PASSWORD: k.password.trim() || "123456",
              ROLE: "Staff",
              STATUS: "Aktif",
            })),
          });

          setKaryawanList((prev) =>
            prev.map((k) => (k.nama.trim() ? { ...k, isSaved: true } : k))
          );
        } catch (err) {
          setStepError(err?.message || "Gagal menyimpan staf ke spreadsheet.");
          setIsSaving(false);
          return;
        } finally {
          setIsSaving(false);
          setSavingText("");
        }
      }

      setCurrentStep(3);
      return;
    }

    // --- STEP 3 -> 4: Simpan Bahan Baku ke Sheets & Lanjut ke Selesai ---
    if (currentStep === 3) {
      const unsaved = bahanList.filter((b) => Boolean(b.nama.trim()) && !b.isSaved);
      if (unsaved.length > 0 && request) {
        setIsSaving(true);
        try {
          // ponytail: 1 bulk request ganti N request serial (backend create_many).
          setSavingText(`Menyimpan ${unsaved.length} bahan baku...`);
          await request({
            action: "update_master",
            target: "bahan_baku",
            operation: "create",
            data: unsaved.map((b) => ({
              NAMA_BAHAN: b.nama.trim(),
              SATUAN: b.satuan.trim() || "",
            })),
          });

          setBahanList((prev) =>
            prev.map((b) => (b.nama.trim() ? { ...b, isSaved: true } : b))
          );
        } catch (err) {
          setStepError(err?.message || "Gagal menyimpan bahan baku ke spreadsheet.");
          setIsSaving(false);
          return;
        } finally {
          setIsSaving(false);
          setSavingText("");
        }
      }

      // Background reload master data
      if (onFinish) {
        try {
          Promise.resolve(onFinish()).catch(() => {});
        } catch {
          /* ignore */
        }
      }

      setCurrentStep(4);
      return;
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setStepError("");
    }
  };

  const handleCompleteWizard = async () => {
    if (onFinish) {
      await onFinish();
    }
    onClose();
  };

  // --- Filtered Valid Data for Summary ---
  const validCabang = cabangList.filter((c) => Boolean(c.nama.trim()));
  const validKaryawan = karyawanList.filter((k) => Boolean(k.nama.trim()));
  const validBahan = bahanList.filter((b) => Boolean(b.nama.trim()));

  const sectionCardStyle =
    "bg-white rounded-2xl sm:rounded-3xl border border-brand-green/10 p-4 sm:p-6 shadow-xs";
  const labelStyle =
    "block text-[10px] font-black uppercase tracking-wider text-brand-muted/70 mb-1 ml-0.5";
  const inputStyle =
    "w-full rounded-xl sm:rounded-2xl border border-brand-green/15 bg-white px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-brand-green-dark focus:outline-none focus:ring-3 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-brand-muted/30 shadow-xs";

  return (
    <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col overflow-hidden select-none">
      {/* Background subtle glow */}
      <div className="absolute left-1/4 top-10 w-80 h-80 bg-green-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 bottom-10 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP HEADER (PINNED / NON-SCROLLABLE) */}
      <header className="shrink-0 z-20 bg-white border-b border-brand-green/10 px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center p-1 shadow-sm shrink-0">
              <img src="/Appic.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-brand-green-dark tracking-tight leading-tight">
                  Es Teh Istimewa
                </h1>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-brand-green/10 text-brand-green">
                  Setup Wizard
                </span>
              </div>
            </div>
          </div>

          {!isSaving && currentStep < 4 && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-green-dark px-2.5 py-1.5 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer"
            >
              <span>Lewati Nanti</span>
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      {/* 2. COMPACT RESPONSIVE STEPPER (PINNED / NON-SCROLLABLE) */}
      <div className="shrink-0 z-10 max-w-3xl mx-auto w-full px-3 sm:px-6 pt-3 sm:pt-4">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-brand-green/10 p-2.5 sm:p-3 shadow-xs">
          {/* Mobile view: Simple Step title & counter */}
          <div className="flex sm:hidden items-center justify-between text-xs font-bold text-brand-green-dark mb-1.5 px-0.5">
            <span className="font-black text-brand-green">
              {currentStep}. {STEP_NAMES[currentStep - 1]}
            </span>
            <span className="text-[10px] font-black text-brand-muted bg-brand-bg px-2 py-0.5 rounded-md border border-brand-green/10">
              {currentStep}/4
            </span>
          </div>

          {/* Desktop view: 4 Step labels */}
          <div className="hidden sm:flex items-center justify-between text-[11px] font-black uppercase tracking-wider mb-2 px-1 text-brand-muted">
            {STEP_NAMES.map((name, idx) => (
              <span
                key={name}
                className={`transition-colors ${
                  currentStep === idx + 1
                    ? "text-brand-green font-black"
                    : currentStep > idx + 1
                    ? "text-emerald-700/80"
                    : "opacity-40"
                }`}
              >
                {idx + 1}. {name}
              </span>
            ))}
          </div>

          {/* Progress Bar */}
          <div
            className="w-full h-1.5 sm:h-2 rounded-full bg-brand-green/10 overflow-hidden"
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
      </div>

      {/* 3. MAIN CONTENT AREA (ISOLATED SCROLLABLE CONTAINER) */}
      <main className="flex-1 overflow-y-auto no-scrollbar max-w-3xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-4 space-y-4">
        {/* Error Alert */}
        {stepError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{stepError}</span>
          </div>
        )}

        {/* ===================== STEP 1: CABANG ===================== */}
        {currentStep === 1 && (
          <div className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 pb-3 border-b border-brand-green/10">
              <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                <Store size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-brand-green-dark">
                  1. Daftarkan Cabang / Outlet
                </h3>
                <p className="text-[11px] text-brand-muted font-medium">
                  ID cabang akan dibuatkan otomatis oleh sistem.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              {cabangList.map((cabang, idx) => (
                <div
                  key={cabang.id}
                  className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-brand-bg/60 border border-brand-green/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">
                        Cabang #{idx + 1}
                      </span>
                      {cabang.isSaved && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">
                          <CheckCircle2 size={10} />
                          Tersimpan
                        </span>
                      )}
                    </div>
                    {cabangList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCabang(cabang.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className={labelStyle}>
                        Nama Cabang <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Outlet Cabang Pattimura"
                        value={cabang.nama}
                        onChange={(e) =>
                          handleCabangChange(cabang.id, "nama", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>Alamat Lengkap</label>
                      <input
                        type="text"
                        placeholder="Contoh: Jl. Pattimura No. 12"
                        value={cabang.alamat}
                        onChange={(e) =>
                          handleCabangChange(cabang.id, "alamat", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCabang}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-green/20 bg-white text-brand-green hover:bg-brand-green/5 text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Tambah Baris Cabang</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 2: KARYAWAN ===================== */}
        {currentStep === 2 && (
          <div className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 pb-3 border-b border-brand-green/10">
              <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-brand-green-dark">
                  2. Daftarkan Akun Karyawan / Staff
                </h3>
                <p className="text-[11px] text-brand-muted font-medium">
                  Akun staf dapat mengakses seluruh outlet.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              {karyawanList.map((karyawan, idx) => (
                <div
                  key={karyawan.id}
                  className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-brand-bg/60 border border-brand-green/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">
                        Staff #{idx + 1}
                      </span>
                      {karyawan.isSaved && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">
                          <CheckCircle2 size={10} />
                          Tersimpan
                        </span>
                      )}
                    </div>
                    {karyawanList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKaryawan(karyawan.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className={labelStyle}>
                        Nama / Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Budi Santoso"
                        value={karyawan.nama}
                        onChange={(e) =>
                          handleKaryawanChange(karyawan.id, "nama", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>No. WhatsApp / Telepon</label>
                      <input
                        type="tel"
                        placeholder="Contoh: 0812-3456-7890"
                        value={karyawan.telepon}
                        onChange={(e) =>
                          handleKaryawanChange(karyawan.id, "telepon", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>Password (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Default: 123456"
                        value={karyawan.password}
                        onChange={(e) =>
                          handleKaryawanChange(karyawan.id, "password", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddKaryawan}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-green/20 bg-white text-brand-green hover:bg-brand-green/5 text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Tambah Baris Karyawan</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 3: BAHAN BAKU ===================== */}
        {currentStep === 3 && (
          <div className={sectionCardStyle}>
            <div className="flex items-center gap-2.5 pb-3 border-b border-brand-green/10">
              <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-brand-green-dark">
                  3. Master Bahan Baku
                </h3>
                <p className="text-[11px] text-brand-muted font-medium">
                  Stok fisik awal akan dicatat staf pada laporan hari pertama.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              {bahanList.map((bahan, idx) => (
                <div
                  key={bahan.id}
                  className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-brand-bg/60 border border-brand-green/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">
                        Bahan Baku #{idx + 1}
                      </span>
                      {bahan.isSaved && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">
                          <CheckCircle2 size={10} />
                          Tersimpan
                        </span>
                      )}
                    </div>
                    {bahanList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBahan(bahan.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className={labelStyle}>
                        Nama Bahan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Gelas Cup, Teh Racik, Gula Pasir"
                        value={bahan.nama}
                        onChange={(e) =>
                          handleBahanChange(bahan.id, "nama", e.target.value)
                        }
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>Satuan Takaran</label>
                      <input
                        type="text"
                        list="satuan-options"
                        placeholder="Contoh: Pcs, Kg, Gram, Cup"
                        value={bahan.satuan}
                        onChange={(e) =>
                          handleBahanChange(bahan.id, "satuan", e.target.value)
                        }
                        className={inputStyle}
                      />
                      <datalist id="satuan-options">
                        <option value="Pcs" />
                        <option value="Cup" />
                        <option value="Kg" />
                        <option value="Gram" />
                        <option value="Bal" />
                        <option value="Bungkus" />
                        <option value="Liter" />
                        <option value="Botol" />
                      </datalist>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddBahan}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-green/20 bg-white text-brand-green hover:bg-brand-green/5 text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Tambah Baris Bahan Baku</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 4: SELESAI & RINGKASAN ===================== */}
        {currentStep === 4 && (
          <div className={`${sectionCardStyle} text-center py-6 sm:py-8 space-y-4 sm:space-y-5 animate-fade-in`}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-brand-green-dark tracking-tight">
                🎉 Setup Awal Berhasil!
              </h2>
              <p className="text-xs text-brand-muted font-medium max-w-md mx-auto">
                Seluruh data operasional awal telah tersimpan ke Google Sheets.
              </p>
            </div>

            {/* Rangkuman Data Terdaftar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left">
              {/* Cabang */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-brand-bg/70 border border-brand-green/10 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Store size={14} className="text-brand-green" />
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-green-dark">
                    Cabang ({validCabang.length})
                  </h4>
                </div>
                {validCabang.length > 0 ? (
                  <ul className="divide-y divide-brand-green/5 text-xs font-bold text-brand-green-dark">
                    {validCabang.map((c) => (
                      <li key={c.id} className="py-1 flex justify-between gap-2">
                        <span className="truncate">{c.nama}</span>
                        <span className="text-brand-muted font-normal text-[10px] truncate max-w-30">
                          {c.alamat || "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-brand-muted/70 italic">Tidak ada cabang baru.</p>
                )}
              </div>

              {/* Karyawan */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-brand-bg/70 border border-brand-green/10 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-brand-green" />
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-green-dark">
                    Staf ({validKaryawan.length})
                  </h4>
                </div>
                {validKaryawan.length > 0 ? (
                  <ul className="divide-y divide-brand-green/5 text-xs font-bold text-brand-green-dark">
                    {validKaryawan.map((k) => (
                      <li key={k.id} className="py-1 flex justify-between gap-2">
                        <span className="truncate">{k.nama}</span>
                        <span className="text-brand-muted font-normal text-[10px] truncate">
                          {k.telepon || "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-brand-muted/70 italic">Tidak ada staf baru.</p>
                )}
              </div>

              {/* Bahan Baku */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-brand-bg/70 border border-brand-green/10 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Package size={14} className="text-brand-green" />
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-green-dark">
                    Bahan Baku ({validBahan.length})
                  </h4>
                </div>
                {validBahan.length > 0 ? (
                  <ul className="divide-y divide-brand-green/5 text-xs font-bold text-brand-green-dark">
                    {validBahan.map((b) => (
                      <li key={b.id} className="py-1 flex justify-between gap-2">
                        <span className="truncate">{b.nama}</span>
                        <span className="text-brand-muted font-normal text-[10px]">
                          {b.satuan || "Pcs"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-brand-muted/70 italic">Tidak ada bahan baku baru.</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCompleteWizard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl sm:rounded-2xl bg-linear-to-r from-brand-green to-emerald-600 hover:from-emerald-700 hover:to-brand-green text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-brand-green/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Masuk ke Dashboard Utama</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. PINNED BOTTOM NAVIGATION BAR (FIXED/NON-SCROLLABLE FOOTER) */}
      <footer className="shrink-0 z-20 bg-white/95 backdrop-blur-md border-t border-brand-green/15 px-3 sm:px-6 py-2.5 sm:py-3 shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {/* Tombol Kembali */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSaving}
            aria-label="Kembali"
            title="Kembali ke langkah sebelumnya"
            className={`
              inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-black transition-all
              ${
                currentStep === 1 || isSaving
                  ? "border-brand-green/10 text-brand-muted/30 cursor-not-allowed opacity-40 bg-brand-bg/30"
                  : "border-brand-green/20 bg-white text-brand-green-dark hover:bg-brand-bg shadow-xs cursor-pointer active:scale-95"
              }
            `}
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          {/* Stepper Indicator Badge / Saving Spinner */}
          {isSaving ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black animate-pulse">
              <Loader2 size={13} className="animate-spin text-amber-600" />
              <span className="truncate max-w-40 sm:max-w-none">
                {savingText || "Menyimpan..."}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-black text-xs">
              <span>{currentStep}</span>
              <span className="opacity-40">/</span>
              <span>4</span>
            </div>
          )}

          {/* Tombol Selanjutnya / Selesai */}
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSaving}
              aria-label="Selanjutnya"
              title="Simpan langkah ini dan lanjut ke langkah berikutnya"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-brand-green text-white hover:bg-brand-green-dark text-xs font-black shadow-md shadow-brand-green/20 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <span>{isSaving ? "Menyimpan..." : "Lanjut"}</span>
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowRight size={15} />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteWizard}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all"
            >
              <CheckCircle2 size={15} />
              <span>Selesai</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
