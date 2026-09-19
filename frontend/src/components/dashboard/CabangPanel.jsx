import { useCallback, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  MapPin,
  Phone,
  Plus,
  Search,
  Store,
  User,
} from "lucide-react";
import { addMockCabang, getMockCabang } from "../../services/mockData";
import AddCabangModal from "./AddCabangModal";

export default function CabangPanel({ selectedBranch = "Semua" }) {
  const [search, setSearch] = useState("");
  const [cabangList, setCabangList] = useState(() => getMockCabang());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSaveCabang = useCallback((newCabang) => {
    const updated = addMockCabang(newCabang);
    setCabangList(updated);
  }, []);

  const filteredCabang = useMemo(() => {
    return cabangList.filter((c) => {
      // Filter by navbar selected branch
      if (selectedBranch && selectedBranch.toLowerCase() !== "semua") {
        if (c.kode.toLowerCase() !== selectedBranch.toLowerCase()) {
          return false;
        }
      }

      // Filter by search keyword
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.nama.toLowerCase().includes(q) ||
        c.kode.toLowerCase().includes(q) ||
        c.alamat.toLowerCase().includes(q) ||
        c.penanggungJawab.toLowerCase().includes(q)
      );
    });
  }, [cabangList, search, selectedBranch]);

  const stats = useMemo(() => {
    const total = cabangList.length;
    const aktif = cabangList.filter((c) => c.status.toLowerCase() === "aktif").length;
    return { total, aktif };
  }, [cabangList]);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow flex items-start justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted">
              Total Outlet Cabang
            </p>
            <h3 className="mt-2 text-2xl font-black text-brand-green-dark">{stats.total} Cabang</h3>
            <p className="mt-1 text-[11px] font-semibold text-brand-muted">cabang_01 & cabang_02</p>
          </div>
          <div className="rounded-2xl bg-brand-green/10 p-3 text-brand-green">
            <Store size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow flex items-start justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted">
              Status Operasional
            </p>
            <h3 className="mt-2 text-2xl font-black text-emerald-600">{stats.aktif} Beroperasi</h3>
            <p className="mt-1 text-[11px] font-semibold text-brand-muted">Semua outlet buka</p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow flex items-start justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted">
              Kapasitas Total
            </p>
            <h3 className="mt-2 text-2xl font-black text-brand-green-dark">1.000 Cup / Hari</h3>
            <p className="mt-1 text-[11px] font-semibold text-brand-muted">Estimasi produksi teh</p>
          </div>
          <div className="rounded-2xl bg-brand-yellow/20 p-3 text-amber-700">
            <Coffee size={20} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-4xl border border-brand-green/10 p-4 sm:p-6 card-shadow space-y-5">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-brand-green-dark">Daftar Cabang</h2>
              <span className="rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-black text-brand-green">
                {filteredCabang.length}
              </span>
            </div>
            <p className="text-xs text-brand-muted font-medium mt-0.5">
              {selectedBranch && selectedBranch.toLowerCase() !== "semua"
                ? `Menampilkan detail outlet ${selectedBranch}`
                : "Menampilkan semua outlet cabang Es Teh Istimewa"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                placeholder="Cari nama, kode, alamat cabang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-brand-green/15 bg-brand-bg/50 pl-9 pr-4 py-2 text-xs font-bold text-brand-green-dark placeholder:text-brand-muted focus:border-brand-green focus:bg-white focus:outline-none transition"
              />
            </div>
            <button
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-green px-3.5 py-2 text-xs font-black text-white hover:bg-brand-green-dark transition-colors shadow-sm cursor-pointer shrink-0"
              onClick={() => setIsAddModalOpen(true)}
              title="Tambah Cabang"
            >
              <Plus size={15} />
              <span>Tambah Cabang</span>
            </button>
          </div>
        </div>

        {/* Cabang Cards */}
        {filteredCabang.length === 0 ? (
          <div className="py-12 text-center text-brand-muted">
            <Store size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Tidak ada cabang yang sesuai filter.</p>
            <p className="text-xs opacity-70 mt-1">
              Coba ganti filter cabang pada navbar atau ubah kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCabang.map((c) => (
              <div
                key={c.id}
                className="rounded-3xl border border-brand-green/10 bg-brand-bg/30 p-5 hover:bg-brand-bg/60 transition-all card-shadow flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-green to-emerald-400 text-white flex items-center justify-center shadow-md shadow-brand-green/20 shrink-0">
                      <Store size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-brand-green-dark leading-tight">{c.nama}</h4>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-black text-brand-green mt-0.5 uppercase tracking-wide">
                        Kode: {c.kode}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-xl border border-brand-green/20 bg-white px-2.5 py-1 text-[10px] font-black uppercase text-brand-green-dark tracking-wide">
                    {c.id}
                  </span>
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-brand-green/10">
                  <div className="flex items-start gap-2 text-brand-green-dark font-medium">
                    <MapPin size={15} className="text-brand-green shrink-0 mt-0.5" />
                    <span>{c.alamat}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-2 text-brand-green-dark font-bold">
                      <User size={14} className="text-brand-green shrink-0" />
                      <span className="truncate">PJ: {c.penanggungJawab}</span>
                    </div>

                    <div className="flex items-center gap-2 text-brand-green-dark font-bold">
                      <Clock size={14} className="text-brand-green shrink-0" />
                      <span className="truncate">{c.jamOperasional}</span>
                    </div>

                    <div className="flex items-center gap-2 text-brand-muted font-semibold">
                      <Phone size={14} className="text-brand-green shrink-0" />
                      <a href={`tel:${c.telepon}`} className="hover:underline truncate">
                        {c.telepon}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-brand-muted font-semibold">
                      <Building2 size={14} className="text-brand-green shrink-0" />
                      <span>{c.kapasitas}</span>
                    </div>
                  </div>
                </div>

                {/* Facility Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {c.fasilitas?.map((f) => (
                    <span
                      key={f}
                      className="rounded-lg bg-brand-green/5 border border-brand-green/10 px-2 py-0.5 text-[10px] font-bold text-brand-green-dark"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-brand-muted/80 pt-1 border-t border-brand-green/5">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-brand-muted/70" />
                    Buka sejak: {c.tanggalBuka}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 size={12} />
                    Terverifikasi
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddCabangModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCabang}
        nextBranchIndex={cabangList.length + 1}
      />
    </div>
  );
}
