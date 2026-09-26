import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, Plus, Store, X } from "lucide-react";
import Alert from "../common/Alert";
import CustomSelect from "../common/CustomSelect";
import { getTodayDateString, toCurrency } from "../../utils/formatters";
import { mapApiErrorMessage } from "../../utils/errors";

export default function PemasukanPanel({
  request,
  onCreateReport,
  onSuccess,
  branches = [],
  availableSumberPemasukan = [],
  selectedBranch = "",
  user,
  onReloadMaster,
  editData = null,
  onCancelEdit,
  onUpdateReport,
}) {
  const branchList = useMemo(
    () => (branches.length > 0 ? branches : ["Cabang Utama"]),
    [branches]
  );
  const sumberOptions = useMemo(() => {
    if (!availableSumberPemasukan || availableSumberPemasukan.length === 0) return [];
    return availableSumberPemasukan
      .map((s) =>
        typeof s === "string" ? s : s.NAMA_SUMBER || s.nama || s.NAMA || s.ID_SUMBER
      )
      .filter(Boolean);
  }, [availableSumberPemasukan]);

  const defaultBranch = useMemo(() => {
    if (selectedBranch && selectedBranch.toLowerCase() !== "semua") return selectedBranch;
    return branchList[0] || "";
  }, [selectedBranch, branchList]);

  const [tanggal, setTanggal] = useState(() => getTodayDateString());
  const [cabang, setCabang] = useState(() => defaultBranch);
  const [sumber, setSumber] = useState(() => sumberOptions[0] || "");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newSumber, setNewSumber] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const isEditing = Boolean(editData?.id || editData?.raw);

  useEffect(() => {
    if (!editData) return;
    const raw = editData.raw || editData;
    const ts = editData.timestamp instanceof Date ? editData.timestamp : null;
    const pad = (n) => String(n).padStart(2, "0");
    const tsDate = ts ? `${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())}` : "";
    if (raw.TANGGAL) setTanggal(String(raw.TANGGAL).substring(0, 10));
    else if (tsDate) setTanggal(tsDate);
    if (raw.CABANG || editData.arusDana || editData.cabang) setCabang(raw.CABANG || editData.arusDana || editData.cabang || "");
    const src = raw.KATEGORI || raw["KATEGORI"] || "";
    if (src) setSumber(src);
    const nom = raw.NOMINAL ?? editData.nominal ?? "";
    if (nom !== "" && nom !== undefined) setNominal(String(nom));
    if (raw.KETERANGAN) setKeterangan(raw.KETERANGAN === src ? "" : raw.KETERANGAN);
    else if (editData.keterangan && editData.keterangan !== src) setKeterangan(editData.keterangan);
  }, [editData]);

  useEffect(() => {
    if (!cabang && defaultBranch) setCabang(defaultBranch);
  }, [defaultBranch, cabang]);
  useEffect(() => {
    if (!sumber && sumberOptions[0]) setSumber(sumberOptions[0]);
  }, [sumberOptions, sumber]);
  useEffect(() => {
    if (!alert?.message || alert.type !== "success") return undefined;
    const t = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(t);
  }, [alert]);

  async function handleAddSumber(e) {
    e.preventDefault();
    const name = newSumber.trim();
    if (!name) return;
    setModalLoading(true);
    try {
      await request?.({
        action: "update_master",
        target: "sumber_pemasukan",
        operation: "create",
        data: { NAMA_SUMBER: name, STATUS: "Aktif" },
      });
      await onReloadMaster?.();
      setSumber(name);
      setNewSumber("");
      setModalOpen(false);
    } catch (err) {
      setAlert({ type: "error", message: mapApiErrorMessage(err?.message || err) });
    } finally {
      setModalLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setAlert(null);
    const num = Number(nominal) || 0;
    if (num <= 0) {
      setAlert({ type: "error", message: "Nominal pemasukan wajib diisi lebih besar dari 0." });
      return;
    }
    if (!tanggal) {
      setAlert({ type: "error", message: "Tanggal pemasukan wajib diisi." });
      return;
    }
    if (!sumber) {
      setAlert({ type: "error", message: "Sumber pemasukan wajib dipilih." });
      return;
    }
    const finalCabang = cabang || branchList[0] || "Cabang Utama";
    setSubmitLoading(true);
    try {
      // ponytail: mode edit → update baris yang sama, bukan create baru.
      if (isEditing && onUpdateReport) {
        const payload = {
          TANGGAL: tanggal,
          CABANG: finalCabang,
          "ARUS DANA": finalCabang,
          KATEGORI: sumber,
          NOMINAL: String(num),
          "TOTAL PENJUALAN": String(num),
          "UANG MASUK": String(num),
          "UANG SETORAN": String(num),
          "TOTAL PENGELUARAN": "0",
          PENGELUARAN: "0",
          KETERANGAN: keterangan || sumber,
        };
        const editId = editData.id || editData.raw?.["ID TRANSAKSI"] || editData.raw?.["NO TRANSAKSI"];
        const ok = await onUpdateReport(editId, payload);
        if (!ok) throw new Error("Gagal menyimpan perubahan pemasukan.");
        setAlert({ type: "success", message: `Pemasukan sebesar ${toCurrency(num)} berhasil diperbarui.` });
        onSuccess?.();
        return;
      }
      const now = new Date();
      const waktuInput = `${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}.${String(now.getSeconds()).padStart(2, "0")}`;
      const payload = {
        TANGGAL: tanggal,
        "WAKTU INPUT": waktuInput,
        "TIMESTAMP INPUT": `${tanggal} ${waktuInput}`,
        CABANG: finalCabang,
        "ARUS DANA": finalCabang,
        STAFF: user?.nama || "Admin",
        "JENIS TRANSAKSI": "Pemasukan",
        KATEGORI: sumber,
        NOMINAL: String(num),
        "TOTAL PENJUALAN": String(num),
        "UANG MASUK": String(num),
        "UANG SETORAN": String(num),
        "TOTAL PENGELUARAN": "0",
        PENGELUARAN: "0",
        KETERANGAN: keterangan || sumber,
      };
      const ok = onCreateReport ? await onCreateReport(payload) : await request?.({ action: "create_report", data: payload });
      if (onCreateReport && !ok) throw new Error("Gagal menyimpan pemasukan.");
      setAlert({ type: "success", message: `Pemasukan sebesar ${toCurrency(num)} berhasil disimpan.` });
      setNominal("");
      setKeterangan("");
      onSuccess?.();
    } catch (err) {
      setAlert({ type: "error", message: mapApiErrorMessage(err?.message || err) });
    } finally {
      setSubmitLoading(false);
    }
  }

  const inputStyle =
    "w-full rounded-2xl border border-brand-green/20 bg-brand-bg/60 px-4 py-2.5 text-sm font-bold text-brand-green-dark focus:border-brand-green focus:bg-white focus:outline-none transition";
  const labelStyle = "text-[10px] font-black uppercase tracking-[0.32em] text-brand-muted mb-2 block";

  return (
    <div className="space-y-5 pb-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-brand-green-dark tracking-tight">{isEditing ? "Edit Pemasukan" : "Pemasukan"}</h2>
        <p className="text-xs font-semibold text-brand-muted">{isEditing ? "Perbarui kas masuk yang sudah tercatat." : "Catat kas masuk langsung di luar closing shift."}</p>
      </div>
      {alert?.message && <Alert type={alert.type}>{alert.message}</Alert>}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <section className="space-y-4 rounded-3xl border border-brand-green/10 bg-white p-5 sm:p-6 card-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Store size={18} className="text-brand-green" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">Informasi Kas Masuk</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="pemasukan-tanggal" className={labelStyle}>Tanggal</label>
              <input id="pemasukan-tanggal" type="date" className={inputStyle} value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={submitLoading} />
            </div>
            <div>
              <label className={labelStyle}>Dicatat Oleh</label>
              <div className="rounded-2xl border border-brand-green/20 bg-brand-bg/60 px-4 py-2.5 text-sm font-bold text-brand-green-dark">{user?.nama || "Admin"}</div>
            </div>
            <div>
              <label className={labelStyle}>Cabang</label>
              <CustomSelect value={cabang} options={branchList} onChange={setCabang} disabled={submitLoading} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-brand-green/10 bg-white p-5 sm:p-6 card-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={18} className="text-brand-green" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">Rincian Pemasukan</h3>
          </div>
          <div>
            <label className={labelStyle}>Sumber Pemasukan</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                {sumberOptions.length > 0 ? (
                  <CustomSelect value={sumber} options={sumberOptions} onChange={setSumber} disabled={submitLoading} />
                ) : (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-800">Belum ada sumber pemasukan di Master</div>
                )}
              </div>
              <button type="button" onClick={() => setModalOpen(true)} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-green/10 px-3 py-2.5 text-xs font-black text-brand-green hover:bg-brand-green/20 transition-colors cursor-pointer" title="Tambah sumber pemasukan">
                <Plus size={14} />
                <span className="hidden sm:inline">Tambah Sumber Pemasukan</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pemasukan-nominal" className={labelStyle}>Jumlah Pemasukan (Rp)</label>
              <input id="pemasukan-nominal" type="number" min="0" step="any" placeholder="Nominal (Rp)" className={inputStyle} value={nominal} onChange={(e) => setNominal(e.target.value)} disabled={submitLoading} />
            </div>
            <div>
              <label htmlFor="pemasukan-keterangan" className={labelStyle}>Keterangan (Opsional)</label>
              <input id="pemasukan-keterangan" type="text" placeholder="Keterangan (Opsional)" className={inputStyle} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} disabled={submitLoading} />
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          {isEditing && (
            <button type="button" onClick={() => onCancelEdit?.()} disabled={submitLoading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-green/20 px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-brand-green-dark hover:bg-brand-bg transition-all disabled:opacity-60 cursor-pointer">
              <span>Batal</span>
            </button>
          )}
          <button type="submit" disabled={submitLoading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-brand-green/25 hover:bg-brand-green-dark transition-all disabled:opacity-60 cursor-pointer">
            {submitLoading ? <span>Menyimpan...</span> : isEditing ? (<><CheckCircle2 size={16} /><span>Simpan Perubahan</span></>) : (<><CheckCircle2 size={16} /><span>Simpan Pemasukan</span></>)}
          </button>
        </div>
      </form>

      {modalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-green-dark/35 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <form onSubmit={handleAddSumber} className="relative w-full max-w-sm rounded-3xl border border-brand-green/10 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-base font-black text-brand-green-dark">Tambah Sumber Pemasukan</h3>
              <button type="button" className="rounded-xl border border-brand-green/15 p-2 text-brand-muted hover:bg-brand-bg cursor-pointer" onClick={() => setModalOpen(false)} title="Tutup"><X size={15} /></button>
            </div>
            <label htmlFor="sumber-baru" className={labelStyle}>Nama Sumber Baru</label>
            <input id="sumber-baru" type="text" className={inputStyle} placeholder="cth: Sponsorship" value={newSumber} onChange={(e) => setNewSumber(e.target.value)} disabled={modalLoading} />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-brand-green/15 px-4 py-2.5 text-sm font-black text-brand-green-dark hover:bg-brand-bg cursor-pointer">Batal</button>
              <button type="submit" disabled={modalLoading || !newSumber.trim()} className="rounded-xl bg-brand-green px-4 py-2.5 text-sm font-black text-white hover:bg-brand-green-dark disabled:opacity-50 cursor-pointer">{modalLoading ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
