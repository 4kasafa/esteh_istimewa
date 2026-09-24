import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import AddKaryawanModal from "./AddKaryawanModal";
import ConfirmDialog from "../common/ConfirmDialog";

function getInitials(name) {
  if (!name) return "ST";
  const clean = String(name).trim();
  if (!clean) return "ST";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ST";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
}

function normalizeKaryawan(u, defaultIndex = 0) {
  if (!u || typeof u !== "object") {
    return {
      id: `EMP-${defaultIndex}`,
      nik: `EMP-${defaultIndex}`,
      nama: "Staff",
      role: "Staff",
      status: "Aktif",
      telepon: "-",
    };
  }

  const rawRole = String(u.ROLE || u.role || "Staff").toLowerCase();
  const role = rawRole.includes("admin") ? "Admin" : "Staff";
  const rawNama = u.nama ?? u["NAMA / USERNAME"] ?? u["NAMA/USERNAME"] ?? u.NAMA ?? u.USERNAME ?? u.username ?? "Staff";
  const nama = String(rawNama || "Staff").trim() || "Staff";
  const rawUsername = u.username ?? u.USERNAME ?? u["NAMA / USERNAME"] ?? u["NAMA/USERNAME"] ?? u.NAMA ?? nama;
  const username = String(rawUsername || "staff").trim() || "staff";
  const id = String(u.id || u.ID || u.nik || `EMP-${username}`);
  const rawNoTelp = u.telepon ?? u["NO. TELEPON"] ?? u["NO TELEPON"] ?? u["NO_TELEPON"] ?? u.TELEPON ?? "-";
  const telepon = String(rawNoTelp || "-");
  const rawStatus = String(u.status || u.STATUS || "Aktif").trim();
  const status = (rawStatus.toLowerCase() === "non aktif" || rawStatus.toLowerCase() === "nonaktif") ? "Non Aktif" : "Aktif";

  return {
    id,
    nik: id,
    nama,
    role,
    status,
    telepon,
    _rowIndex: u._rowIndex ?? null,
  };
}

export default function KaryawanPanel({
  users = [],
  request,
  user,
  onReloadMaster,
}) {
  const [search, setSearch] = useState("");
  // ponytail: daftar karyawan diturunkan dari prop users (satu sumber: loadMasterData
  // di level App). Panel tidak fetch/cache sendiri.
  const karyawanList = useMemo(
    () => (Array.isArray(users) ? users.map((item, idx) => normalizeKaryawan(item, idx)) : []),
    [users],
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingKaryawan, setDeletingKaryawan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSaveKaryawan = useCallback(async (newKaryawan) => {
    if (!request) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const nextItem = normalizeKaryawan({
        ...newKaryawan,
        status: newKaryawan.status || "Aktif",
      });
      const role = String(nextItem.role || "").toLowerCase() === "admin" ? "Admin" : "Staff";
      await request({
        action: "update_master",
        target: "user",
        operation: "create",
        data: {
          "NAMA / USERNAME": nextItem.nama,
          USERNAME: nextItem.nama,
          "NO. TELEPON": nextItem.telepon || "-",
          PASSWORD: nextItem.password || "123456",
          ROLE: role,
          STATUS: nextItem.status || "Aktif",
        },
      });

      // Daftar diperbarui lewat onReloadMaster -> prop users (tanpa optimis lokal).
      if (onReloadMaster) {
        await onReloadMaster();
      }

      setFeedback({
        type: "success",
        message: `Karyawan "${nextItem.nama}" berhasil ditambahkan.`,
      });
      setIsAddModalOpen(false);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message || "Gagal menambahkan data karyawan.",
      });
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [onReloadMaster, request]);

  const handleConfirmDeleteKaryawan = useCallback(async () => {
    if (!deletingKaryawan || !request) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await request({
        action: "update_master",
        target: "user",
        operation: "delete",
        id: deletingKaryawan.id,
        data: {
          "NAMA / USERNAME": deletingKaryawan.nama,
          _rowIndex: deletingKaryawan._rowIndex ?? null,
        },
      });

      setFeedback({
        type: "success",
        message: `Karyawan "${deletingKaryawan.nama}" berhasil dihapus.`,
      });
      setDeletingKaryawan(null);

      if (onReloadMaster) {
        await onReloadMaster();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message || "Gagal menghapus data karyawan.",
      });
    } finally {
      setActionLoading(false);
    }
  }, [deletingKaryawan, onReloadMaster, request]);

  useEffect(() => {
    if (!feedback?.message) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const filteredKaryawan = useMemo(() => {
    return karyawanList.filter((k) => {
      if (!k) return false;

      // Filter by search keyword
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const nama = String(k.nama || "").toLowerCase();
      const nik = String(k.nik || "").toLowerCase();
      const role = String(k.role || "").toLowerCase();
      const shift = String(k.shift || "").toLowerCase();
      const telepon = String(k.telepon || "").toLowerCase();

      return (
        nama.includes(q) ||
        nik.includes(q) ||
        role.includes(q) ||
        shift.includes(q) ||
        telepon.includes(q)
      );
    });
  }, [karyawanList, search]);

  const stats = useMemo(() => {
    const total = karyawanList.length;
    const aktif = karyawanList.filter((k) => String(k?.status || "").toLowerCase() === "aktif").length;
    return { total, aktif };
  }, [karyawanList]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
              Menampilkan seluruh staf terdaftar
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
              Coba ganti kata kunci pencarian.
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
                      {getInitials(k.nama)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-brand-green-dark leading-tight">{k.nama}</h4>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {k.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="rounded-xl border border-brand-green/20 bg-white px-2.5 py-1 text-[10px] font-black uppercase text-brand-green-dark tracking-wide">
                      {k.role}
                    </span>
                    {!(
                      (user?.nama && k.nama && String(user.nama).trim().toLowerCase() === String(k.nama).trim().toLowerCase()) ||
                      (user?.id && k.id && String(user.id).trim().toLowerCase() === String(k.id).trim().toLowerCase())
                    ) && (
                      <button
                        type="button"
                        onClick={() => setDeletingKaryawan(k)}
                        className="p-1.5 rounded-xl text-brand-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Karyawan"
                        aria-label={`Hapus ${k.nama}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs pt-2 border-t border-brand-green/10">
                  <div className="flex items-center gap-2 text-brand-muted font-semibold">
                    <Phone size={14} className="text-brand-green shrink-0" />
                    <a href={`tel:${k.telepon}`} className="hover:underline truncate">
                      {k.telepon}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddKaryawanModal
        key={isAddModalOpen ? "open" : "closed"}
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveKaryawan}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={Boolean(deletingKaryawan)}
        title="Hapus Karyawan?"
        description={`Apakah Anda yakin ingin menghapus data karyawan "${deletingKaryawan?.nama}" (${deletingKaryawan?.role})? Akun dan akses staf ini akan dihapus dari sistem.`}
        confirmLabel="Hapus Karyawan"
        cancelLabel="Batal"
        loading={actionLoading}
        danger
        onCancel={() => setDeletingKaryawan(null)}
        onConfirm={handleConfirmDeleteKaryawan}
      />
    </div>
  );
}
