import { useState } from "react";
import { Plus, Store, Trash2, X } from "lucide-react";

// ponytail: struktur form multi-baris penambahan cabang — user hanya isi
// nama & alamat (ID dibuatkan backend), 1x bulk save. Field lama
// (kode/PJ/telepon/jam/kapasitas) dibuang: tak ada kolomnya di sheet Cabang.
export default function AddCabangModal({ open, onClose, onSave, loading = false }) {
  const [rows, setRows] = useState([{ id: "cab-temp-1", nama: "", alamat: "" }]);
  const [error, setError] = useState("");

  if (!open) return null;

  function handleAddRow() {
    setRows((prev) => [...prev, { id: `cab-temp-${Date.now()}`, nama: "", alamat: "" }]);
  }

  function handleRemoveRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleChange(id, field, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].alamat.trim() && !rows[i].nama.trim()) {
        setError(`Nama cabang pada baris #${i + 1} wajib diisi.`);
        return;
      }
    }
    if (!rows.some((r) => r.nama.trim())) {
      setError("Isi minimal satu nama cabang.");
      return;
    }

    try {
      await onSave(rows);
      onClose();
    } catch (err) {
      setError(err?.message || "Gagal menyimpan cabang.");
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-green-dark/40 backdrop-blur-sm" onClick={loading ? undefined : onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-green/15 bg-white p-5 sm:p-7 shadow-2xl shadow-brand-green-dark/20 animate-fade-in no-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-brand-green/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
              <Store size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-brand-green-dark">Tambah Cabang Baru</h3>
              <p className="text-xs font-semibold text-brand-muted">
                ID cabang akan dibuatkan otomatis oleh sistem.
              </p>
            </div>
          </div>
          <button
            className="rounded-xl border border-brand-green/15 p-1.5 text-brand-muted hover:bg-brand-bg transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-brand-bg/60 border border-brand-green/10 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">
                  Cabang #{idx + 1}
                </span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus baris ini"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-brand-muted/70 mb-1 ml-0.5">
                    Nama Cabang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Outlet Cabang Pattimura"
                    value={row.nama}
                    onChange={(e) => {
                      setError("");
                      handleChange(row.id, "nama", e.target.value);
                    }}
                    className="w-full rounded-xl border border-brand-green/15 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-brand-muted/70 mb-1 ml-0.5">
                    Alamat Lengkap
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jl. Pattimura No. 12"
                    value={row.alamat}
                    onChange={(e) => {
                      setError("");
                      handleChange(row.id, "alamat", e.target.value);
                    }}
                    className="w-full rounded-xl border border-brand-green/15 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-green/20 bg-white text-brand-green hover:bg-brand-green/5 text-xs font-black transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Tambah Baris Cabang</span>
          </button>

          {/* Actions */}
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
              <span>{loading ? "Menyimpan..." : "Simpan Cabang"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
