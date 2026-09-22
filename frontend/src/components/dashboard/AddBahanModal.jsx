import { useState } from "react";
import { Package, X } from "lucide-react";

const POPULAR_UNITS = ["Cup", "Gram", "Kg", "Pcs", "Pack", "Dus", "Botol", "Liter"];

function BahanFormDialog({ onClose, onSave, initialData = null, loading = false }) {
  const isEdit = Boolean(initialData?.id);
  const [nama, setNama] = useState(() => initialData?.nama || initialData?.NAMA_BAHAN || "");
  const [satuan, setSatuan] = useState(() => initialData?.satuan || initialData?.SATUAN || "");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanNama = nama.trim();
    const cleanSatuan = satuan.trim() || "";

    if (!cleanNama) {
      setError("Nama bahan baku wajib diisi.");
      return;
    }

    try {
      await onSave({
        id: initialData?.id || initialData?.ID_BAHAN,
        nama: cleanNama,
        satuan: cleanSatuan,
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Gagal menyimpan bahan baku.");
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-green-dark/40 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-green/15 bg-white p-5 sm:p-6 shadow-2xl shadow-brand-green-dark/25 animate-fade-in no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-brand-green/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-brand-green-dark leading-tight">
                {isEdit ? "Edit Bahan Baku" : "Tambah Bahan Baku"}
              </h3>
              <p className="text-xs font-semibold text-brand-muted">
                {isEdit
                  ? `Perbarui data untuk ${initialData?.nama || "bahan"}`
                  : "Daftarkan master bahan baku baru"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-brand-green/15 p-1.5 text-brand-muted hover:bg-brand-bg transition-colors cursor-pointer disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
            title="Tutup"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-3.5 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Nama Bahan */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 ml-1">
              Nama Bahan Baku <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              className="w-full rounded-2xl border border-brand-green/20 bg-brand-bg/40 px-3.5 py-2.5 text-sm font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-brand-muted/40"
              placeholder="Contoh: Gelas Cup, Teh Tubruk, Susu"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Satuan */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5 ml-1">
              Satuan / Unit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full rounded-2xl border border-brand-green/20 bg-brand-bg/40 px-3.5 py-2.5 text-sm font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-brand-muted/40"
              placeholder="Pcs, Cup, Kg, Pack, dll"
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              disabled={loading}
            />

            {/* Quick unit suggestion chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {POPULAR_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setSatuan(u)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    satuan.toLowerCase() === u.toLowerCase()
                      ? "bg-brand-green text-white shadow-xs"
                      : "bg-brand-bg text-brand-muted border border-brand-green/15 hover:bg-white"
                  }`}
                  disabled={loading}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-green/10">
            <button
              type="button"
              className="px-4 py-2.5 rounded-2xl border border-brand-green/20 text-xs font-bold text-brand-muted hover:bg-brand-bg transition-colors cursor-pointer disabled:opacity-50"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl bg-brand-green text-white text-xs font-black shadow-md shadow-brand-green/20 hover:bg-emerald-700 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{isEdit ? "Simpan Perubahan" : "Simpan Bahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddBahanModal({
  open,
  onClose,
  onSave,
  initialData = null,
  loading = false,
}) {
  if (!open) return null;

  return (
    <BahanFormDialog
      key={initialData?.id || initialData?.ID_BAHAN || "new"}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
      loading={loading}
    />
  );
}
