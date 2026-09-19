import { useCallback, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  Clock,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { addMockKaryawan, getMockCabang, getMockKaryawan } from "../../services/mockData";
import AddKaryawanModal from "./AddKaryawanModal";

export default function KaryawanPanel({ selectedBranch = "Semua" }) {
  const [search, setSearch] = useState("");
  const [karyawanList, setKaryawanList] = useState(() => getMockKaryawan());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const availableBranches = useMemo(() => {
    try {
      const data = getMockCabang();
      return data.map((c) => c.kode);
    } catch {
      return ["cabang_01", "cabang_02"];
    }
  }, []);

  const handleSaveKaryawan = useCallback((newKaryawan) => {
    const updated = addMockKaryawan(newKaryawan);
    setKaryawanList(updated);
  }, []);

  const filteredKaryawan = useMemo(() => {
    return karyawanList.filter((k) => {
      // Filter by navbar selected branch
      if (selectedBranch && selectedBranch.toLowerCase() !== "semua") {
        if (k.cabang.toLowerCase() !== selectedBranch.toLowerCase()) {
          return false;
        }
      }

      // Filter by search keyword
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        k.nama.toLowerCase().includes(q) ||
        k.nik.toLowerCase().includes(q) ||
        k.role.toLowerCase().includes(q) ||
        k.cabang.toLowerCase().includes(q) ||
        k.shift.toLowerCase().includes(q) ||
        k.telepon.toLowerCase().includes(q)
      );
    });
  }, [karyawanList, search, selectedBranch]);

  const stats = useMemo(() => {
    const total = karyawanList.length;
    const aktif = karyawanList.filter((k) => k.status.toLowerCase() === "aktif").length;
    const branches = new Set(karyawanList.map((k) => k.cabang)).size;
    return { total, aktif, branches };
  }, [karyawanList]);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow flex items-start justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted">
              Total Karyawan
            </p>
            <h3 className="mt-2 text-2xl font-black text-brand-green-dark">{stats.total} Orang</h3>
            <p className="mt-1 text-[11px] font-semibold text-brand-muted">Seluruh outlet aktif</p>
          </div>
          <div className="rounded-2xl bg-brand-green/10 p-3 text-brand-green">
            <Users size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow flex items-start justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted">
              Status Aktif
            </p>
            <h3 className="mt-2 text-2xl font-black text-emerald-600">{stats.aktif} Aktif</h3>
            <p className="mt-1 text-[11px] font-semibold text-brand-muted">Bekerja normal</p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow flex items-start justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted">
              Cabang Penugasan
            </p>
            <h3 className="mt-2 text-2xl font-black text-brand-green-dark">{stats.branches} Cabang</h3>
            <p className="mt-1 text-[11px] font-semibold text-brand-muted">cabang_01 & cabang_02</p>
          </div>
          <div className="rounded-2xl bg-brand-yellow/20 p-3 text-amber-700">
            <Building2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-4xl border border-brand-green/10 p-4 sm:p-6 card-shadow space-y-5">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-brand-green-dark">Daftar Karyawan</h2>
              <span className="rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-black text-brand-green">
                {filteredKaryawan.length}
              </span>
            </div>
            <p className="text-xs text-brand-muted font-medium mt-0.5">
              {selectedBranch && selectedBranch.toLowerCase() !== "semua"
                ? `Menampilkan staf penugasan ${selectedBranch}`
                : "Menampilkan semua staf di seluruh cabang"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                placeholder="Cari nama, NIK, shift..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-brand-green/15 bg-brand-bg/50 pl-9 pr-4 py-2 text-xs font-bold text-brand-green-dark placeholder:text-brand-muted focus:border-brand-green focus:bg-white focus:outline-none transition"
              />
            </div>
            <button
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-green px-3.5 py-2 text-xs font-black text-white hover:bg-brand-green-dark transition-colors shadow-sm cursor-pointer shrink-0"
              onClick={() => setIsAddModalOpen(true)}
              title="Tambah Karyawan"
            >
              <Plus size={15} />
              <span>Tambah Karyawan</span>
            </button>
          </div>
        </div>

        {/* Karyawan Cards */}
        {filteredKaryawan.length === 0 ? (
          <div className="py-12 text-center text-brand-muted">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Tidak ada karyawan yang sesuai filter.</p>
            <p className="text-xs opacity-70 mt-1">
              Coba ganti filter cabang pada navbar atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKaryawan.map((k) => (
              <div
                key={k.id}
                className="rounded-3xl border border-brand-green/10 bg-brand-bg/30 p-5 hover:bg-brand-bg/60 transition-all card-shadow flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-green to-emerald-400 text-white flex items-center justify-center text-lg font-black shadow-md shadow-brand-green/20 shrink-0">
                      {k.nama
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-brand-green-dark leading-tight">{k.nama}</h4>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {k.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-brand-muted mt-0.5">{k.nik}</p>
                    </div>
                  </div>

                  <span className="rounded-xl border border-brand-green/20 bg-white px-2.5 py-1 text-[10px] font-black uppercase text-brand-green-dark tracking-wide">
                    {k.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-brand-green/10">
                  <div className="flex items-center gap-2 text-brand-green-dark font-bold">
                    <Building2 size={14} className="text-brand-green shrink-0" />
                    <span className="truncate">{k.cabang}</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-green-dark font-bold">
                    <Clock size={14} className="text-brand-green shrink-0" />
                    <span>Shift {k.shift}</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-muted font-semibold">
                    <Phone size={14} className="text-brand-green shrink-0" />
                    <a href={`tel:${k.telepon}`} className="hover:underline truncate">
                      {k.telepon}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-brand-muted font-semibold">
                    <Mail size={14} className="text-brand-green shrink-0" />
                    <span className="truncate">{k.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-brand-muted/80 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-brand-muted/70" />
                    Bergabung: {k.tglBergabung}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <ShieldCheck size={12} />
                    Terverifikasi
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddKaryawanModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveKaryawan}
        branches={availableBranches}
      />
    </div>
  );
}
