import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  MapPin,
  Plus,
  Search,
  Store,
  Trash2,
} from "lucide-react";
import AddCabangModal from "./AddCabangModal";
import ConfirmDialog from "../common/ConfirmDialog";

function normalizeCabang(c, defaultIndex = 0) {
  if (!c || typeof c !== "object") {
    return {
      id: `CAB-${defaultIndex}`,
      kode: "cabang_01",
      nama: "Cabang Utama",
      alamat: "-",
      status: "Aktif",
    };
  }
  const rawName = String(c.NAMA_CABANG || c.nama || "Cabang");
  const displayName = rawName.toLowerCase().startsWith("cabang_")
    ? `Outlet ${rawName.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`
    : rawName;

  const rawStatus = String(c.STATUS || c.status || "Aktif").trim();
  const status = (rawStatus.toLowerCase() === "non aktif" || rawStatus.toLowerCase() === "nonaktif") ? "Non Aktif" : "Aktif";

  return {
    id: String(c.ID_CABANG || c.id || `CAB-${c._rowIndex || defaultIndex}`),
    kode: String(c.NAMA_CABANG || c.kode || "cabang_01"),
    nama: displayName,
    alamat: String(c.ALAMAT || c.alamat || "-"),
    status,
    _rowIndex: c._rowIndex ?? null,
  };
}

export default function CabangPanel({
  selectedBranch = "Semua",
  rawCabang = [],
  request,
  onReloadMaster,
}) {
  const [search, setSearch] = useState("");
  // ponytail: daftar cabang diturunkan dari prop rawCabang (satu sumber: loadMasterData
  // di level App). Panel tidak fetch/cache sendiri.
  const cabangList = useMemo(
    () => (Array.isArray(rawCabang) ? rawCabang.map((c, idx) => normalizeCabang(c, idx)) : []),
    [rawCabang],
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingCabang, setDeletingCabang] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // ponytail: 1 bulk request ganti N request serial (backend create_many) —
  // payload array penambahan bulk cabang.
  const handleSaveCabang = useCallback(async (rows) => {
    if (!request) return;
    const filled = (Array.isArray(rows) ? rows : []).filter((r) => String(r?.nama || "").trim());
    if (filled.length === 0) {
      throw new Error("Isi minimal satu nama cabang.");
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      await request({
        action: "update_master",
        target: "cabang",
        operation: "create",
        data: filled.map((r) => ({
          NAMA_CABANG: String(r.nama).trim(),
          ALAMAT: String(r.alamat || "").trim() || "-",
          STATUS: "Aktif",
        })),
      });

      // Daftar diperbarui lewat onReloadMaster -> prop rawCabang (tanpa optimis lokal).
      if (onReloadMaster) {
        await onReloadMaster();
      }

      setFeedback({
        type: "success",
        message: filled.length === 1
          ? `Cabang "${filled[0].nama.trim()}" berhasil ditambahkan.`
          : `${filled.length} cabang berhasil ditambahkan.`,
      });
      setIsAddModalOpen(false);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message || "Gagal menambahkan data cabang.",
      });
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [onReloadMaster, request]);

  const handleConfirmDeleteCabang = useCallback(async () => {
    if (!deletingCabang || !request) return;
    if (cabangList.length <= 1) {
      setFeedback({
        type: "error",
        message: "Tidak dapat menghapus cabang terakhir pada sistem.",
      });
      setDeletingCabang(null);
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      await request({
        action: "update_master",
        target: "cabang",
        operation: "delete",
        id: deletingCabang.id,
        data: {
          NAMA_CABANG: deletingCabang.kode,
          _rowIndex: deletingCabang._rowIndex ?? null,
        },
      });

      setFeedback({
        type: "success",
        message: `Cabang "${deletingCabang.nama}" berhasil dihapus.`,
      });
      setDeletingCabang(null);

      if (onReloadMaster) {
        await onReloadMaster();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message || "Gagal menghapus data cabang.",
      });
    } finally {
      setActionLoading(false);
    }
  }, [cabangList.length, deletingCabang, onReloadMaster, request]);

  useEffect(() => {
    if (!feedback?.message) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const filteredCabang = useMemo(() => {
    return cabangList.filter((c) => {
      if (!c) return false;
      const kode = String(c.kode || "").toLowerCase();
      const nama = String(c.nama || "").toLowerCase();
      const alamat = String(c.alamat || "").toLowerCase();
      const penanggungJawab = String(c.penanggungJawab || "").toLowerCase();

      // Filter by navbar selected branch
      if (selectedBranch && selectedBranch.toLowerCase() !== "semua") {
        const sel = selectedBranch.toLowerCase();
        if (
          kode !== sel &&
          nama !== sel &&
          !nama.includes(sel)
        ) {
          return false;
        }
      }

      // Filter by search keyword
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        nama.includes(q) ||
        kode.includes(q) ||
        alamat.includes(q) ||
        penanggungJawab.includes(q)
      );
    });
  }, [cabangList, search, selectedBranch]);

  const stats = useMemo(() => {
    const total = cabangList.length;
    const aktif = cabangList.filter((c) => String(c?.status || "").toLowerCase() === "aktif").length;
    return { total, aktif };
  }, [cabangList]);

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl p-3.5 sm:p-4 text-xs font-bold transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-800"
              : "bg-red-500/10 border border-red-500/20 text-red-800"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            className="text-current opacity-70 hover:opacity-100 cursor-pointer ml-2"
            onClick={() => setFeedback(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow flex items-start justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted">
              Total Outlet Cabang
            </p>
            <h3 className="mt-2 text-2xl font-black text-brand-green-dark">{stats.total} Cabang</h3>
            <p className="mt-1 text-[11px] font-semibold text-brand-muted">{stats.total > 0 ? `${stats.aktif} dari ${stats.total} cabang aktif` : "Belum ada cabang"}</p>
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
            <p className="mt-1 text-[11px] font-semibold text-brand-muted">Outlet aktif melayani</p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow flex items-start justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-muted">
              Lokasi Terdata
            </p>
            <h3 className="mt-2 text-2xl font-black text-brand-green-dark">{cabangList.filter((c) => c.alamat && c.alamat !== "-").length} Lokasi</h3>
            <p className="mt-1 text-[11px] font-semibold text-brand-muted">Alamat outlet terverifikasi</p>
          </div>
          <div className="rounded-2xl bg-brand-yellow/20 p-3 text-amber-700">
            <Store size={20} />
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
                    <div className="h-12 w-12 rounded-2xl bg-linear-to-tr from-brand-green to-emerald-400 text-white flex items-center justify-center shadow-md shadow-brand-green/20 shrink-0">
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
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="rounded-xl border border-brand-green/20 bg-white px-2.5 py-1 text-[10px] font-black uppercase text-brand-green-dark tracking-wide">
                      {c.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeletingCabang(c)}
                      className="p-1.5 rounded-xl text-brand-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Cabang"
                      aria-label={`Hapus ${c.nama}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-brand-green/10">
                  <div className="flex items-start gap-2 text-brand-green-dark font-medium">
                    <MapPin size={15} className="text-brand-green shrink-0 mt-0.5" />
                    <span>{c.alamat}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddCabangModal
        key={isAddModalOpen ? `open-${cabangList.length}` : "closed"}
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCabang}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={Boolean(deletingCabang)}
        title="Hapus Cabang?"
        description={`Apakah Anda yakin ingin menghapus outlet cabang "${deletingCabang?.nama}" (${deletingCabang?.kode})? Cabang akan dinonaktifkan dari sistem.`}
        confirmLabel="Hapus Cabang"
        cancelLabel="Batal"
        loading={actionLoading}
        danger
        onCancel={() => setDeletingCabang(null)}
        onConfirm={handleConfirmDeleteCabang}
      />
    </div>
  );
}
