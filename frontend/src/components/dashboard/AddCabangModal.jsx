import { useState } from "react";
import { Store, X } from "lucide-react";

export default function AddCabangModal({ open, onClose, onSave, nextBranchIndex = 3 }) {
  const defaultKode = `cabang_${String(nextBranchIndex).padStart(2, "0")}`;
  const defaultNama = `Outlet Cabang ${String(nextBranchIndex).padStart(2, "0")}`;

  const [form, setForm] = useState({
    nama: defaultNama,
    kode: defaultKode,
    alamat: "",
    penanggungJawab: "",
    telepon: "",
    jamOperasional: "08:00 - 22:00 WITA",
    status: "Aktif",
    kapasitas: "500 Cup / Hari",
  });
  const [error, setError] = useState("");

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nama.trim()) {
      setError("Nama outlet cabang wajib diisi.");
      return;
    }
    if (!form.kode.trim()) {
      setError("Kode cabang wajib diisi (contoh: cabang_03).");
      return;
    }

    const todayStr = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());

    const newCabang = {
      id: `CAB-${Date.now()}`,
      kode: form.kode.trim().toLowerCase().replace(/\s+/g, "_"),
      nama: form.nama.trim(),
      alamat: form.alamat.trim() || "Alamat belum diatur",
      penanggungJawab: form.penanggungJawab.trim() || "-",
      telepon: form.telepon.trim() || "-",
      jamOperasional: form.jamOperasional.trim() || "08:00 - 22:00 WITA",
      status: form.status,
      jumlahStaff: 0,
      tanggalBuka: todayStr,
      kapasitas: form.kapasitas.trim() || "500 Cup / Hari",
      fasilitas: ["Take Away", "QRIS Payment"],
    };

    onSave(newCabang);
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
              <Store size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-brand-green-dark">Tambah Cabang Baru</h3>
              <p className="text-xs font-semibold text-brand-muted">
                Daftarkan outlet baru Es Teh Istimewa
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
            {/* Nama Cabang */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Nama Outlet Cabang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Outlet Cabang 03 - Jl. Pattimura"
                value={form.nama}
                onChange={(e) => {
                  setError("");
                  setForm((prev) => ({ ...prev, nama: e.target.value }));
                }}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              />
            </div>

            {/* Kode Cabang */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Kode Cabang (ID) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cabang_03"
                value={form.kode}
                onChange={(e) => {
                  setError("");
                  setForm((prev) => ({ ...prev, kode: e.target.value }));
                }}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Status Operasional
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              >
                <option value="Aktif">Aktif (Buka)</option>
                <option value="Persiapan">Persiapan (Coming Soon)</option>
                <option value="Tutup">Tutup Sementara</option>
              </select>
            </div>

            {/* Alamat */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Alamat Lengkap
              </label>
              <textarea
                rows={2}
                placeholder="Jl. Pattimura No. 45, Tarakan Tengah"
                value={form.alamat}
                onChange={(e) => setForm((prev) => ({ ...prev, alamat: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition resize-none"
              />
            </div>

            {/* Penanggung Jawab */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Penanggung Jawab / Kepala Outlet
              </label>
              <input
                type="text"
                placeholder="Contoh: Rian Hidayat"
                value={form.penanggungJawab}
                onChange={(e) => setForm((prev) => ({ ...prev, penanggungJawab: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              />
            </div>

            {/* Telepon */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                No. Telepon Outlet
              </label>
              <input
                type="tel"
                placeholder="0812-xxxx-xxxx"
                value={form.telepon}
                onChange={(e) => setForm((prev) => ({ ...prev, telepon: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              />
            </div>

            {/* Jam Operasional */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Jam Operasional
              </label>
              <input
                type="text"
                value={form.jamOperasional}
                onChange={(e) => setForm((prev) => ({ ...prev, jamOperasional: e.target.value }))}
                className="w-full rounded-xl border border-brand-green/15 bg-brand-bg/50 px-3.5 py-2.5 text-xs font-bold text-brand-green-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition"
              />
            </div>

            {/* Kapasitas */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Target Kapasitas
              </label>
              <input
                type="text"
                placeholder="500 Cup / Hari"
                value={form.kapasitas}
                onChange={(e) => setForm((prev) => ({ ...prev, kapasitas: e.target.value }))}
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
              Simpan Cabang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
