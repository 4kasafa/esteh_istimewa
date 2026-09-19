import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { BRANCH_OPTIONS } from "../../constants/forms";

export default function AddKaryawanModal({ open, onClose, onSave, branches = BRANCH_OPTIONS }) {
  const [form, setForm] = useState(() => ({
    nama: "",
    nik: "EST-03001",
    role: "Staff",
    cabang: branches[0] || "cabang_01",
    shift: "Pagi",
    telepon: "",
    email: "",
    status: "Aktif",
  }));
  const [error, setError] = useState("");

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nama.trim()) {
      setError("Nama karyawan wajib diisi.");
      return;
    }

    const todayStr = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const newKaryawan = {
      id: `EMP-${Date.now()}`,
      nik: form.nik.trim() || "EST-03001",
      nama: form.nama.trim(),
      role: form.role,
      cabang: form.cabang,
      telepon: form.telepon.trim() || "-",
      email:
        form.email.trim() ||
        `${form.nama.toLowerCase().replace(/[^a-z0-9]/g, "")}@estehistimewa.com`,
      status: form.status,
      shift: form.shift,
      tglBergabung: todayStr,
      posisi: `${form.role} Outlet ${form.cabang}`,
    };

    onSave(newKaryawan);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-green-dark/40 backdrop-blur-sm" onClick={onClose} />

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
            className="rounded-xl border border-brand-green/15 p-1.5 text-brand-muted hover:bg-brand-bg transition-colors"
            onClick={onClose}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Pratama"
                value={form.nama}
                onChange={(e) => {
                  setError("");
                  setForm((prev) => ({ ...prev, nama: e.target.value }));
                }}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              />
            </div>

            {/* NIK */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                NIK Karyawan
              </label>
              <input
                type="text"
                value={form.nik}
                onChange={(e) => setForm((prev) => ({ ...prev, nik: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
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
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              >
                <option value="Staff">Staff</option>
                <option value="Kasir">Kasir</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Barista">Barista</option>
                <option value="Manager">Manager</option>
              </select>
            </div>

            {/* Cabang */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Cabang Penugasan
              </label>
              <select
                value={form.cabang}
                onChange={(e) => setForm((prev) => ({ ...prev, cabang: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Shift Kerja
              </label>
              <select
                value={form.shift}
                onChange={(e) => setForm((prev) => ({ ...prev, shift: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              >
                <option value="Pagi">Shift Pagi</option>
                <option value="Siang">Shift Siang</option>
                <option value="Sore">Shift Sore</option>
              </select>
            </div>

            {/* Telepon */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                No. Telepon / WhatsApp
              </label>
              <input
                type="tel"
                placeholder="0812-xxxx-xxxx"
                value={form.telepon}
                onChange={(e) => setForm((prev) => ({ ...prev, telepon: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="budi@estehistimewa.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-brand-green/10">
            <button
              type="button"
              className="rounded-xl border border-brand-green/15 bg-white px-4 py-2.5 text-xs font-black text-brand-green-dark hover:bg-brand-bg transition-colors cursor-pointer"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-green px-5 py-2.5 text-xs font-black text-white hover:bg-brand-green-dark shadow-md shadow-brand-green/20 transition-colors cursor-pointer"
            >
              Simpan Karyawan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
