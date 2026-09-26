import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, Plus, Store, X } from "lucide-react";
import Alert from "../common/Alert";
import CustomSelect from "../common/CustomSelect";
import { getTodayDateString, toCurrency } from "../../utils/formatters";
import { mapApiErrorMessage } from "../../utils/errors";

export default function PengeluaranPanel({
  request,
  onCreateReport,
  onSuccess,
  branches = [],
  availableTipePengeluaran = [],
  availableBahan = [],
  selectedBranch = "",
  user,
  onReloadMaster,
}) {
  const branchList = useMemo(
    () => (branches.length > 0 ? branches : ["Cabang Utama"]),
    [branches]
  );
  const sumberOptions = useMemo(() => {
    const tipe = (availableTipePengeluaran || [])
      .map((t) => (typeof t === "string" ? t : t.NAMA_TIPE || t.nama || t.ID_TIPE))
      .filter(Boolean);
    const bahan = (availableBahan || [])
      .map((b) => (typeof b === "string" ? b : b.NAMA_BAHAN || b.nama))
      .filter(Boolean);
    return [...new Set([...tipe, ...bahan])];
  }, [availableTipePengeluaran, availableBahan]);

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
  const [newTipe, setNewTipe] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

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

  async function handleAddTipe(e) {
    e.preventDefault();
    const name = newTipe.trim();
    if (!name) return;
    setModalLoading(true);
    try {
      await request?.({
        action: "update_master",
        target: "tipe_pengeluaran",
        operation: "create",
        data: { NAMA_TIPE: name },
      });
      await onReloadMaster?.();
      setSumber(name);
      setNewTipe("");
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
      setAlert({ type: "error", message: "Nominal pengeluaran wajib diisi lebih besar dari 0." });
      return;
    }
    if (!tanggal) {
      setAlert({ type: "error", message: "Tanggal pengeluaran wajib diisi." });
      return;
    }
    if (!sumber) {
      setAlert({ type: "error", message: "Sumber pengeluaran wajib dipilih." });
      return;
    }
    const finalCabang = cabang || branchList[0] || "Cabang Utama";
    setSubmitLoading(true);
    try {
      const now = new Date();
      const waktuInput = `${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}.${String(now.getSeconds()).padStart(2, "0")}`;
      const rupiah = `Rp ${num.toLocaleString("id-ID")}`;
      const payload = {
        TANGGAL: tanggal,
        "WAKTU INPUT": waktuInput,
        "TIMESTAMP INPUT": `${tanggal} ${waktuInput}`,
        CABANG: finalCabang,
        "ARUS DANA": finalCabang,
        STAFF: user?.nama || "Admin",
        "JENIS TRANSAKSI": "Pengeluaran",
        isPengeluaranOnly: true,
        KATEGORI: sumber,
        "TOTAL PENGELUARAN": String(num),
        PENGELUARAN: String(num),
        "UANG KELUAR": String(num),
        "RINCIAN PENGELUARAN": `[${sumber}: ${rupiah}${keterangan ? " - " + keterangan : ""}]`,
        "UANG SETORAN": "0",
        "UANG MASUK": "0",
        "TOTAL PENJUALAN": "0",
        KETERANGAN: keterangan ? `${keterangan} ([${sumber}: ${rupiah}])` : `[${sumber}: ${rupiah}]`,
        pengeluaranList: [{ tipe: sumber, nominal: num, keterangan: keterangan || "" }],
      };
      const ok = onCreateReport ? await onCreateReport(payload) : await request?.({ action: "create_report", data: payload });
      if (onCreateReport && !ok) throw new Error("Gagal menyimpan pengeluaran.");
      setAlert({ type: "success", message: `Pengeluaran sebesar ${toCurrency(num)} berhasil disimpan.` });
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
        <h2 className="text-xl sm:text-2xl font-black text-brand-green-dark tracking-tight">Pengeluaran</h2>
        <p className="text-xs font-semibold text-brand-muted">Catat kas keluar langsung di luar closing shift.</p>
      </div>
      {alert?.message && <Alert type={alert.type}>{alert.message}</Alert>}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <section className="space-y-4 rounded-3xl border border-brand-green/10 bg-white p-5 sm:p-6 card-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Store size={18} className="text-brand-green" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">Informasi Kas Keluar</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="pengeluaran-tanggal" className={labelStyle}>Tanggal</label>
              <input id="pengeluaran-tanggal" type="date" className={inputStyle} value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={submitLoading} />
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
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-green-dark/70">Rincian Pengeluaran</h3>
          </div>
          <div>
            <label className={labelStyle}>Sumber / Tipe Pengeluaran</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                {sumberOptions.length > 0 ? (
                  <CustomSelect value={sumber} options={sumberOptions} onChange={setSumber} disabled={submitLoading} />
                ) : (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-800">Belum ada tipe pengeluaran di Master</div>
                )}
              </div>
              <button type="button" onClick={() => setModalOpen(true)} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-green/10 px-3 py-2.5 text-xs font-black text-brand-green hover:bg-brand-green/20 transition-colors cursor-pointer" title="Tambah sumber pengeluaran">
                <Plus size={14} />
                <span className="hidden sm:inline">Tambah Sumber Pengeluaran</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pengeluaran-nominal" className={labelStyle}>Jumlah Pengeluaran (Rp)</label>
              <input id="pengeluaran-nominal" type="number" min="0" step="any" placeholder="Nominal (Rp)" className={inputStyle} value={nominal} onChange={(e) => setNominal(e.target.value)} disabled={submitLoading} />
            </div>
            <div>
              <label htmlFor="pengeluaran-keterangan" className={labelStyle}>Keterangan (Opsional)</label>
              <input id="pengeluaran-keterangan" type="text" placeholder="Keterangan (Opsional)" className={inputStyle} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} disabled={submitLoading} />
            </div>
          </div>
        </section>

        <div className="flex sm:justify-end">
          <button type="submit" disabled={submitLoading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-brand-green/25 hover:bg-brand-green-dark transition-all disabled:opacity-60 cursor-pointer">
            {submitLoading ? <span>Menyimpan...</span> : (<><CheckCircle2 size={16} /><span>Simpan Pengeluaran</span></>)}
          </button>
        </div>
      </form>

      {modalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-green-dark/35 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <form onSubmit={handleAddTipe} className="relative w-full max-w-sm rounded-3xl border border-brand-green/10 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-base font-black text-brand-green-dark">Tambah Sumber Pengeluaran</h3>
              <button type="button" className="rounded-xl border border-brand-green/15 p-2 text-brand-muted hover:bg-brand-bg cursor-pointer" onClick={() => setModalOpen(false)} title="Tutup"><X size={15} /></button>
            </div>
            <label htmlFor="tipe-baru" className={labelStyle}>Nama Tipe Baru</label>
            <input id="tipe-baru" type="text" className={inputStyle} placeholder="cth: Sewa Tempat" value={newTipe} onChange={(e) => setNewTipe(e.target.value)} disabled={modalLoading} />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-brand-green/15 px-4 py-2.5 text-sm font-black text-brand-green-dark hover:bg-brand-bg cursor-pointer">Batal</button>
              <button type="submit" disabled={modalLoading || !newTipe.trim()} className="rounded-xl bg-brand-green px-4 py-2.5 text-sm font-black text-white hover:bg-brand-green-dark disabled:opacity-50 cursor-pointer">{modalLoading ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
