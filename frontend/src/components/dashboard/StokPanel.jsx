import { useMemo, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  XCircle,
} from "lucide-react";
import AddBahanModal from "./AddBahanModal";
import ConfirmDialog from "../common/ConfirmDialog";
import { calculateStockBalances } from "../../utils/stock";

export default function StokPanel({
  selectedBranch = "Semua",
  branches = [],
  masterBahan = [],
  reportRows = [],
  dbRows = [],
  request,
  onReloadMaster,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // "semua" | "tersedia" | "habis"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [localFeedback, setLocalFeedback] = useState(null);

  // ponytail: data master bahan baku berasal dari satu sumber (prop masterBahan,
  // hasil fetch loadMasterData di level App). Panel tidak fetch/cache sendiri.
  const bahanList = useMemo(
    () => (Array.isArray(masterBahan) ? masterBahan : []),
    [masterBahan],
  );

  // Combine rows: prefer reportRows if available, fallback to dbRows
  const combinedRows = useMemo(() => {
    return reportRows && reportRows.length > 0 ? reportRows : dbRows;
  }, [reportRows, dbRows]);

  // Compute calculated stock items
  const stockItems = useMemo(() => {
    return calculateStockBalances(bahanList, combinedRows, branches, selectedBranch);
  }, [bahanList, combinedRows, branches, selectedBranch]);

  // Overall Statistics Bar
  const stats = useMemo(() => {
    const totalBahan = stockItems.length;
    const tersedia = stockItems.filter((item) => item.status === "Tersedia").length;
    const habis = stockItems.filter((item) => item.status === "Habis").length;
    const totalPemakaian = stockItems.reduce((acc, curr) => acc + curr.totalTerpakai, 0);

    return { totalBahan, tersedia, habis, totalPemakaian };
  }, [stockItems]);

  // Filtered Items for Display
  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      // Status filter
      if (statusFilter === "tersedia" && item.status !== "Tersedia") return false;
      if (statusFilter === "habis" && item.status !== "Habis") return false;

      // Keyword search
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.nama.toLowerCase().includes(q) ||
        item.satuan.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [stockItems, statusFilter, search]);

  // Handle Save (Create or Edit)
  async function handleSaveBahan(bahanData) {
    if (!request) return;
    setActionLoading(true);
    setLocalFeedback(null);

    const isEdit = Boolean(bahanData.id);
    const operation = isEdit ? "update" : "create";

    try {
      await request({
        action: "update_master",
        target: "bahan_baku",
        operation,
        data: {
          ID_BAHAN: bahanData.id,
          NAMA_BAHAN: bahanData.nama,
          SATUAN: bahanData.satuan,
        },
      });

      // Daftar item diperbarui lewat onReloadMaster -> prop masterBahan (tanpa optimis lokal).

      setLocalFeedback({
        type: "success",
        message: isEdit
          ? `Bahan baku "${bahanData.nama}" berhasil diperbarui.`
          : `Bahan baku "${bahanData.nama}" berhasil ditambahkan.`,
      });

      if (onReloadMaster) {
        await onReloadMaster();
      }
    } catch (err) {
      setLocalFeedback({
        type: "error",
        message: err?.message || "Terjadi kesalahan saat memproses master bahan baku.",
      });
      throw err;
    } finally {
      setActionLoading(false);
    }
  }

  // Handle Delete Confirmation
  async function handleConfirmDelete() {
    if (!deletingItem || !request) return;
    setActionLoading(true);

    try {
      await request({
        action: "update_master",
        target: "bahan_baku",
        operation: "delete",
        id: deletingItem.id,
        data: {
          ID_BAHAN: deletingItem.id,
          NAMA_BAHAN: deletingItem.nama,
          _rowIndex: deletingItem._rowIndex ?? null,
        },
      });

      setLocalFeedback({
        type: "success",
        message: `Bahan baku "${deletingItem.nama}" berhasil dihapus.`,
      });

      setDeletingItem(null);

      if (onReloadMaster) {
        await onReloadMaster();
      }
    } catch (err) {
      setLocalFeedback({
        type: "error",
        message: err?.message || "Gagal menghapus bahan baku.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Local Feedback Alert */}
      {localFeedback && (
        <div
          className={`flex items-center justify-between rounded-2xl p-3.5 sm:p-4 text-xs font-bold transition-all ${
            localFeedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-800"
              : "bg-red-500/10 border border-red-500/20 text-red-800"
          }`}
        >
          <span>{localFeedback.message}</span>
          <button
            type="button"
            className="text-current opacity-70 hover:opacity-100 cursor-pointer ml-2"
            onClick={() => setLocalFeedback(null)}
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Stat Bar - Clean 4-Column Mobile-First Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Master Bahan */}
        <div className="rounded-2xl border border-brand-green/10 bg-white p-3.5 sm:p-4 card-shadow">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
              <Boxes size={15} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-brand-muted truncate">
              Jenis Bahan
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-green-dark">
            {stats.totalBahan}{" "}
            <span className="text-xs font-bold text-brand-muted/70">Item</span>
          </p>
        </div>

        {/* Stok Tersedia */}
        <div className="rounded-2xl border border-brand-green/10 bg-white p-3.5 sm:p-4 card-shadow">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={15} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 truncate">
              Tersedia
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700">
            {stats.tersedia}{" "}
            <span className="text-xs font-bold text-emerald-600/70">Item</span>
          </p>
        </div>

        {/* Stok Habis */}
        <div className="rounded-2xl border border-brand-green/10 bg-white p-3.5 sm:p-4 card-shadow">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <XCircle size={15} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 truncate">
              Stok Habis
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-700">
            {stats.habis}{" "}
            <span className="text-xs font-bold text-rose-600/70">Item</span>
          </p>
        </div>

        {/* Total Pemakaian Periode Ini */}
        <div className="rounded-2xl border border-brand-green/10 bg-white p-3.5 sm:p-4 card-shadow">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <TrendingDown size={15} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 truncate">
              Total Terpakai
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-green-dark">
            {stats.totalPemakaian.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-bold text-brand-muted/70">Unit</span>
          </p>
        </div>
      </div>

      {/* Control Bar: Search + Filter + Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Search & Status Filters */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted/50"
            />
            <input
              type="text"
              placeholder="Cari bahan baku atau satuan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-brand-green/15 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold text-brand-green-dark placeholder:text-brand-muted/40 focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all shadow-xs"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("semua")}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === "semua"
                  ? "bg-brand-green text-white shadow-xs"
                  : "bg-white text-brand-muted border border-brand-green/15 hover:bg-brand-bg"
              }`}
            >
              Semua ({stats.totalBahan})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("tersedia")}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === "tersedia"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-brand-muted border border-brand-green/15 hover:bg-brand-bg"
              }`}
            >
              Tersedia ({stats.tersedia})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("habis")}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === "habis"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-brand-muted border border-brand-green/15 hover:bg-brand-bg"
              }`}
            >
              Habis ({stats.habis})
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-green text-white text-xs font-black shadow-md shadow-brand-green/20 hover:bg-emerald-700 active:scale-98 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Tambah Bahan</span>
        </button>
      </div>

      {/* Stock Cards Grid - Clean, Flat, No Stacking */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-green/20 bg-white/60 p-8 sm:p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green mb-3">
            <Package size={24} />
          </div>
          <h4 className="text-sm sm:text-base font-black text-brand-green-dark">
            Tidak ada bahan baku ditemukan
          </h4>
          <p className="text-xs font-medium text-brand-muted mt-1 max-w-sm">
            {search.trim()
              ? `Tidak ditemukan bahan baku dengan kata kunci "${search}".`
              : "Belum ada master bahan baku yang terdaftar di sistem."}
          </p>
          {!search.trim() && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsAddModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Tambah Bahan Baku Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const isAvailable = item.status === "Tersedia";

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-brand-green/10 bg-white p-4 sm:p-5 card-shadow flex flex-col justify-between transition-all duration-200 hover:border-brand-green/30"
              >
                {/* Header: Item Identity & Action Buttons */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-black text-brand-green-dark leading-tight truncate">
                          {item.nama}
                        </h4>
                        <span className="rounded-lg bg-brand-bg px-2 py-0.5 text-[10px] font-black text-brand-muted uppercase border border-brand-green/10">
                          {item.satuan}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-brand-muted/70 tracking-wider mt-0.5">
                        {item.id}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl text-brand-muted hover:text-brand-green-dark hover:bg-brand-bg transition-colors cursor-pointer"
                        title="Edit Bahan"
                        aria-label={`Edit ${item.nama}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 rounded-xl text-brand-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Bahan"
                        aria-label={`Hapus ${item.nama}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Sisa Stok Display */}
                  <div className="mt-3.5 flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-brand-muted">
                        Sisa Stok {selectedBranch !== "Semua" ? `(${selectedBranch})` : "Terkini"}
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-brand-green-dark tracking-tight leading-tight mt-0.5">
                        {item.sisa.toLocaleString("id-ID")}{" "}
                        <span className="text-xs font-bold text-brand-muted/80">
                          {item.satuan}
                        </span>
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        isAvailable
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-rose-500/15 text-rose-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isAvailable ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      {item.status}
                    </span>
                  </div>

                  {/* Branch Breakdown (Shown cleanly when 'Semua' selected and multiple branches exist) */}
                  {selectedBranch === "Semua" && item.branchBalances.length > 1 && (
                    <div className="mt-3 pt-2.5 border-t border-brand-green/8 flex flex-wrap gap-1.5">
                      {item.branchBalances.map((b) => (
                        <span
                          key={b.cabang}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-bg text-[10px] font-bold text-brand-muted border border-brand-green/10"
                        >
                          <span className="truncate max-w-[90px]">{b.cabang}:</span>
                          <strong className="text-brand-green-dark font-black">
                            {b.sisa}
                          </strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Metric: Usage */}
                <div className="mt-3 pt-2.5 border-t border-brand-green/8 flex items-center justify-between text-[11px] font-bold text-brand-muted">
                  <span>Terpakai periode ini</span>
                  <span className="font-black text-brand-green-dark">
                    {item.totalTerpakai.toLocaleString("id-ID")} {item.satuan}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddBahanModal
        key={isAddModalOpen ? `open-${editingItem?.id || editingItem?.ID_BAHAN || "new"}` : "closed"}
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveBahan}
        initialData={editingItem}
        loading={actionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Hapus Bahan Baku?"
        description={`Apakah Anda yakin ingin menghapus master bahan "${deletingItem?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        loading={actionLoading}
        onCancel={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
