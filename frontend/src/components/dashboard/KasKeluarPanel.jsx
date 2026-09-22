import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Plus,
  Receipt,
  Store,
  Trash2,
} from "lucide-react";

import Alert from "../common/Alert";
import CustomSelect from "../common/CustomSelect";
import { getTodayDateString } from "../../utils/formatters";
import { mapApiErrorMessage } from "../../utils/errors";
import { toCurrency } from "../../utils/formatters";

function buildEmptyExpense(defaultTipe = "") {
  return {
    id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tipe: defaultTipe,
    nominal: "",
    keterangan: "",
  };
}

export default function KasKeluarPanel({
  request,
  period,
  branches = [],
  staff = [],
  availableTipePengeluaran = [],
  selectedBranch = "",
  onReload,
  isAdmin = false,
  user,
}) {
  const branchList = useMemo(() => {
    return branches.length > 0 ? branches : [user?.cabang || "Cabang Utama"];
  }, [branches, user?.cabang]);

  const staffList = useMemo(() => {
    return staff.length > 0 ? staff : [user?.nama || "Staff"];
  }, [staff, user?.nama]);

  const tipePengeluaranOptions = useMemo(() => {
    if (!availableTipePengeluaran || availableTipePengeluaran.length === 0) {
      return [
        "Operasional Toko",
        "Bahan Baku",
        "Kebersihan",
        "Listrik / Air",
        "Transportasi",
        "Lain-lain",
      ];
    }
    return availableTipePengeluaran
      .map((t) => (typeof t === "string" ? t : t.NAMA_TIPE || t.nama || t.ID_TIPE))
      .filter(Boolean);
  }, [availableTipePengeluaran]);

  const defaultBranch = useMemo(() => {
    if (selectedBranch && selectedBranch.toLowerCase() !== "semua") return selectedBranch;
    return user?.cabang || branchList[0] || "";
  }, [selectedBranch, user?.cabang, branchList]);

  const defaultStaff = user?.nama || staffList[0] || "";

  const [tanggal, setTanggal] = useState(() => getTodayDateString());
  const [cabang, setCabang] = useState(() => defaultBranch);
  const [staffName, setStaffName] = useState(() => defaultStaff);
  const [catatan, setCatatan] = useState("");
  const [pengeluaranList, setPengeluaranList] = useState(() => [
    buildEmptyExpense(tipePengeluaranOptions[0] || ""),
  ]);

  const [alert, setAlert] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!cabang && defaultBranch) {
      setCabang(defaultBranch);
    }
  }, [defaultBranch, cabang]);

  useEffect(() => {
    if (!staffName && defaultStaff) {
      setStaffName(defaultStaff);
    }
  }, [defaultStaff, staffName]);

  useEffect(() => {
    if (!alert?.message || alert.type !== "success") return undefined;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  const handleAddRow = () => {
    const defaultTipe = tipePengeluaranOptions[0] || "";
    setPengeluaranList((prev) => [...prev, buildEmptyExpense(defaultTipe)]);
  };

  const handleRemoveRow = (index) => {
    setPengeluaranList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, val) => {
    setPengeluaranList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const totalPengeluaran = useMemo(() => {
    return pengeluaranList.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  }, [pengeluaranList]);

  const handleReset = () => {
    setTanggal(getTodayDateString());
    setCabang(defaultBranch);
    setStaffName(defaultStaff);
    setCatatan("");
    setPengeluaranList([buildEmptyExpense(tipePengeluaranOptions[0] || "")]);
    setAlert(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    const validExpenses = pengeluaranList
      .map((item) => ({
        tipe: item.tipe || tipePengeluaranOptions[0] || "Operasional",
        nominal: Number(item.nominal) || 0,
        keterangan: item.keterangan || "",
      }))
      .filter((item) => item.nominal > 0);

    if (validExpenses.length === 0) {
      setAlert({
        type: "error",
        message: "Masukkan minimal 1 baris pengeluaran dengan nominal lebih besar dari 0.",
      });
      return;
    }

    if (!tanggal) {
      setAlert({ type: "error", message: "Tanggal pengeluaran wajib diisi." });
      return;
    }

    const finalCabang = cabang || branchList[0] || "Cabang Utama";
    const finalStaff = (!isAdmin ? user?.nama : staffName) || user?.nama || "Staff";

    setSubmitLoading(true);
    try {
      const now = new Date();
      const waktuInput = `${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}.${String(now.getSeconds()).padStart(2, "0")}`;
      const rincian = validExpenses
        .map(
          (item) =>
            `[${item.tipe}: Rp ${item.nominal.toLocaleString("id-ID")}${
              item.keterangan ? " - " + item.keterangan : ""
            }]`
        )
        .join(", ");

      const payload = {
        action: "create_report",
        data: {
          TANGGAL: tanggal,
          "WAKTU INPUT": waktuInput,
          "TIMESTAMP INPUT": `${tanggal} ${waktuInput}`,
          CABANG: finalCabang,
          "ARUS DANA": finalCabang,
          STAFF: finalStaff,
          "JENIS TRANSAKSI": "Pengeluaran",
          isPengeluaranOnly: true,
          "TOTAL PENGELUARAN": String(totalPengeluaran),
          PENGELUARAN: String(totalPengeluaran),
          "UANG KELUAR": String(totalPengeluaran),
          "RINCIAN PENGELUARAN": rincian,
          "UANG SETORAN": "0",
          "UANG MASUK": "0",
          "TOTAL PENJUALAN": "0",
          KETERANGAN: catatan ? `${catatan} (${rincian})` : rincian,
          pengeluaranList: validExpenses,
        },
      };

      if (request) {
        await request(payload);
      }

      setAlert({
        type: "success",
        message: `Pengeluaran sebesar ${toCurrency(
          totalPengeluaran
        )} berhasil disimpan. Data otomatis masuk ke tabel transaksi di menu Laporan.`,
      });

      // Reset form fields
      setCatatan("");
      setPengeluaranList([buildEmptyExpense(tipePengeluaranOptions[0] || "")]);

      if (onReload) {
        const targetPeriod = tanggal.substring(0, 7) || period;
        await onReload(targetPeriod);
      }
    } catch (err) {
      setAlert({ type: "error", message: mapApiErrorMessage(err?.message || err) });
    } finally {
      setSubmitLoading(false);
    }
  };

  const inputStyle =
    "w-full rounded-2xl border border-brand-green/20 bg-brand-bg/60 px-4 py-2.5 text-sm font-bold text-brand-green-dark focus:border-brand-green focus:bg-white focus:outline-none transition";
  const labelStyle =
    "text-[10px] font-black uppercase tracking-[0.32em] text-brand-muted mb-2 block";
  const sectionCardStyle =
    "space-y-4 rounded-3xl border border-brand-green/10 bg-white p-5 sm:p-6 card-shadow";

  return (
    <div className="space-y-5 pb-8 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-brand-green-dark tracking-tight">
            Pengeluaran
          </h2>
          <p className="text-xs font-semibold text-brand-muted">
            Catat biaya dan nota operasional outlet secara langsung tanpa tabel terpisah.
          </p>
        </div>
      </div>

      {alert?.message && <Alert type={alert.type}>{alert.message}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Section 1: Informasi Header */}
        <section className={sectionCardStyle}>
          <div className="flex items-center gap-2 mb-2">
            <Store size={18} className="text-brand-green" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">
              1. Informasi Outlet & Tanggal
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Tanggal Pengeluaran */}
            <div>
              <label htmlFor="exp-tanggal" className={labelStyle}>
                Tanggal Pengeluaran
              </label>
              <div className="relative">
                <input
                  id="exp-tanggal"
                  type="date"
                  className={inputStyle}
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  disabled={submitLoading}
                />
              </div>
            </div>

            {/* Cabang */}
            <div>
              <label className={labelStyle}>Cabang Outlet</label>
              {!isAdmin && user?.cabang ? (
                <div className="rounded-2xl border border-brand-green/20 bg-brand-bg/60 px-4 py-2.5 text-sm font-bold text-brand-green-dark">
                  {user.cabang}
                </div>
              ) : (
                <CustomSelect
                  value={cabang}
                  options={branchList}
                  onChange={setCabang}
                  disabled={submitLoading}
                />
              )}
            </div>

            {/* Staff Bertugas */}
            <div>
              <label className={labelStyle}>Staff Bertugas</label>
              {!isAdmin ? (
                <div className="rounded-2xl border border-brand-green/20 bg-brand-bg/60 px-4 py-2.5 text-sm font-bold text-brand-green-dark">
                  {user?.nama || user?.username || "Staff"}
                </div>
              ) : (
                <CustomSelect
                  value={staffName}
                  options={staffList}
                  onChange={setStaffName}
                  disabled={submitLoading}
                />
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Rincian Pengeluaran Dinamis */}
        <section className={sectionCardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-brand-green" />
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">
                2. Pengeluaran Operasional
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-green hover:text-brand-green-dark bg-brand-green/10 hover:bg-brand-green/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Tambah Baris</span>
            </button>
          </div>

          {pengeluaranList.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-brand-green/15 rounded-2xl bg-brand-bg/30">
              <p className="text-xs font-bold text-brand-muted">
                Tidak ada pengeluaran dicatat.
              </p>
              <button
                type="button"
                onClick={handleAddRow}
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
                  {/* Tipe / Kategori Pengeluaran */}
                  <div className="w-full sm:w-48 shrink-0">
                    {tipePengeluaranOptions.length > 0 ? (
                      <CustomSelect
                        value={item.tipe}
                        options={tipePengeluaranOptions}
                        onChange={(val) => handleRowChange(index, "tipe", val)}
                        disabled={submitLoading}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Tipe pengeluaran"
                        className="w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2.5 text-xs font-bold text-brand-green-dark focus:outline-none focus:border-brand-green"
                        value={item.tipe}
                        onChange={(e) => handleRowChange(index, "tipe", e.target.value)}
                        disabled={submitLoading}
                      />
                    )}
                  </div>

                  {/* Nominal Pengeluaran */}
                  <div className="w-full sm:w-40 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Nominal (Rp)"
                      aria-label={`Nominal Pengeluaran ${index + 1}`}
                      className="w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2.5 text-xs font-bold text-brand-green-dark focus:outline-none focus:border-brand-green"
                      value={item.nominal}
                      onChange={(e) => handleRowChange(index, "nominal", e.target.value)}
                      disabled={submitLoading}
                    />
                  </div>

                  {/* Keterangan / Nota */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Keterangan / Nota (Opsional)"
                      aria-label={`Keterangan Pengeluaran ${index + 1}`}
                      className="w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2.5 text-xs font-bold text-brand-green-dark focus:outline-none focus:border-brand-green"
                      value={item.keterangan}
                      onChange={(e) => handleRowChange(index, "keterangan", e.target.value)}
                      disabled={submitLoading}
                    />
                  </div>

                  {/* Tombol Hapus */}
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="self-end sm:self-center p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                    title="Hapus baris pengeluaran"
                    aria-label={`Hapus baris pengeluaran ${index + 1}`}
                    disabled={submitLoading || pengeluaranList.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Total Pengeluaran Banner */}
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">
              Total Pengeluaran:
            </span>
            <span className="text-base sm:text-lg font-black text-amber-900">
              {toCurrency(totalPengeluaran)}
            </span>
          </div>
        </section>

        {/* Section 3: Catatan Tambahan (Opsional) */}
        <section className={sectionCardStyle}>
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={18} className="text-brand-green" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">
              3. Catatan Tambahan (Opsional)
            </h3>
          </div>

          <div>
            <textarea
              className={`${inputStyle} resize-none`}
              rows="2"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan umum transaksi pengeluaran (opsional)..."
              disabled={submitLoading}
            />
          </div>
        </section>

        {/* Tombol Aksi Form */}
        <div className="flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitLoading}
            className="w-full sm:w-auto rounded-2xl border border-brand-green/20 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-brand-green-dark hover:bg-brand-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-brand-green/25 hover:bg-brand-green-dark transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitLoading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Simpan Pengeluaran</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
