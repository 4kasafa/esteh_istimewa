import { useState } from "react";
import { UserPlus, X } from "lucide-react";

const labelStyle =
  "block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5";
const inputStyle =
  "w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition";

export default function AddKaryawanModal({ open, onClose, onSave, loading = false }) {
  const [form, setForm] = useState(() => ({
    nama: "",
    role: "Staff",
    telepon: "",
    password: "",
  }));
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!form.nama.trim()) {
      setError("Nama karyawan wajib diisi.");
      return;
    }

    const newKaryawan = {
      id: `EMP-${Date.now()}`,
      nama: form.nama.trim(),
      role: form.role,
      telepon: form.telepon.trim() || "-",
      password: form.password.trim() || "123456",
    };

    try {
      await onSave(newKaryawan);
      onClose();
    } catch (err) {
      setError(err?.message || "Gagal menyimpan karyawan.");
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
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-brand-green-dark">Tambah Karyawan</h3>
              <p className="text-xs font-semibold text-brand-muted">
                Tambahkan staf atau pengelola baru untuk outlet
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-brand-bg/60 border border-brand-green/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">
                  Staff Baru
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Nama */}
              <div className="sm:col-span-2">
                <label className={labelStyle}>
                  Nama / Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Pratama"
                  value={form.nama}
                  onChange={(e) => {
                    setError("");
                    setForm((prev) => ({ ...prev, nama: e.target.value }));
                  }}
                  disabled={loading}
                  className={inputStyle}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                  Peran / Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  disabled={loading}
                  className={inputStyle}
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Telepon */}
              <div>
                <label className={labelStyle}>No. WhatsApp / Telepon</label>
                <input
                  type="tel"
                  placeholder="Contoh: 0812-3456-7890"
                  value={form.telepon}
                  onChange={(e) => setForm((prev) => ({ ...prev, telepon: e.target.value }))}
                  disabled={loading}
                  className={inputStyle}
                />
              </div>

              {/* Password */}
              <div>
                <label className={labelStyle}>Password (Opsional)</label>
                <input
                  type="text"
                  placeholder="Default: 123456"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  disabled={loading}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>

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
              <span>{loading ? "Menyimpan..." : "Simpan Karyawan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
