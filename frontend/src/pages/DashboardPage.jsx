import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DASHBOARD_MENU } from "../constants/menu";
import { REPORT_FORM_DEFAULT } from "../constants/forms";
import Alert from "../components/common/Alert";
import PemasukanPanel from "../components/dashboard/PemasukanPanel";
import PengeluaranPanel from "../components/dashboard/PengeluaranPanel";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import OverviewPanel from "../components/dashboard/OverviewPanel";
import ReportPanel from "../components/dashboard/ReportPanel";
import ReportForm from "../components/forms/ReportForm";
import KaryawanPanel from "../components/dashboard/KaryawanPanel";
import CabangPanel from "../components/dashboard/CabangPanel";
import SettingPanel from "../components/dashboard/SettingPanel";
import StokPanel from "../components/dashboard/StokPanel";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  FormSkeleton,
  MasterPanelSkeleton,
  OverviewSkeleton,
  ReportSkeleton,
} from "../components/dashboard/DashboardSkeleton";
import { generateTrxId, parseTimestamp, toPeriodValue } from "../utils/formatters";

function getViewportMode() {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1280) return "tablet";
  return "desktop";
}

export default function DashboardPage({
  user,
  isAdmin,
  loading,
  // ponytail: sinkronisasi latar — indikator kecil, tanpa overlay & tanpa Alert merah.
  isSyncing = false,
  syncNote = "",
  // ponytail: saving hanya mengunci tombol form (B9) — overlay tetap `loading`.
  saving = false,
  message,
  error,
  reportRows,
  masterData,
  pwa,
  onRefreshMonthly,
  onRefreshAll,
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  request,
  onReloadMaster,
  onLogout,
}) {
  const isStaff = String(user?.role || "").toLowerCase() === "staff";
  const [activeMenu, setActiveMenu] = useState(() => (isStaff ? "laporan_harian" : "dashboard"));
  // ponytail: panel berat (overview/laporan/form) di-mount saat pertama dikunjungi
  // saja — bukan semuanya sekaligus. Setelah dikunjungi tetap mounted agar state
  // form tidak hilang. Memotong cascade ~20 useMemo O(n) saat data tiba.
  const [visitedMenus, setVisitedMenus] = useState(() => new Set([isStaff ? "laporan_harian" : "dashboard"]));
  useEffect(() => {
    setVisitedMenus((prev) => {
      if (prev.has(activeMenu)) return prev;
      const next = new Set(prev);
      next.add(activeMenu);
      return next;
    });
  }, [activeMenu]);
  const [mode, setMode] = useState(getViewportMode);
  const [isCollapsed, setIsCollapsed] = useState(mode === "tablet");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const period = toPeriodValue();
  const [periodFilter, setPeriodFilter] = useState({ range: "month", period: toPeriodValue() });
  const [reportForm, setReportForm] = useState(REPORT_FORM_DEFAULT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const viewportMode = mode;

  const branchList = useMemo(() => {
    const raw = masterData?.cabang || masterData?.cabangList || [];
    return raw.map((c) => (typeof c === "string" ? c : c.NAMA_CABANG || c.nama || c.ID_CABANG)).filter(Boolean);
  }, [masterData]);

  const branches = useMemo(() => ["Semua", ...branchList], [branchList]);

  const availableBahan = useMemo(() => {
    return masterData?.bahanBaku || masterData?.bahanBakuList || [];
  }, [masterData]);

  const availableTipePengeluaran = useMemo(() => {
    return masterData?.tipePengeluaran || masterData?.tipePengeluaranList || [];
  }, [masterData]);

  const availableSumberPemasukan = useMemo(() => {
    return masterData?.sumberPemasukan || masterData?.sumberPemasukanList || [];
  }, [masterData]);

  const availableStaff = useMemo(() => {
    const rawUsers = masterData?.users || masterData?.staffList || [];
    const names = rawUsers.map((u) => (typeof u === "string" ? u : u["NAMA / USERNAME"] || u["NAMA/USERNAME"] || u.NAMA || u.USERNAME)).filter(Boolean);
    if (user?.nama && !names.includes(user.nama)) {
      names.unshift(user.nama);
    }
    return names;
  }, [masterData, user?.nama]);

  const filteredReportRows = useMemo(() => {
    if (!selectedBranch || selectedBranch.toLowerCase() === "semua") return reportRows;
    return (reportRows || []).filter((r) => {
      const branchVal = String(r["ARUS DANA"] || r.ARUS_DANA || "").trim().toLowerCase();
      return branchVal === selectedBranch.toLowerCase();
    });
  }, [reportRows, selectedBranch]);

  useEffect(() => {
    function handleResize() {
      const nextMode = getViewportMode();
      setMode(nextMode);
      if (nextMode === "desktop") {
        setIsCollapsed(false);
        setMobileOpen(false);
      }
      if (nextMode === "tablet") {
        setIsCollapsed(true);
        setMobileOpen(false);
      }
      if (nextMode === "mobile") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const sidebarMenu = useMemo(() => {
    if (isStaff) {
      return [
        { key: "laporan_harian", label: "Laporan Hari Ini", icon: "laporan_harian" },
        { key: "laporan", label: "Laporan", icon: "laporan" },
      ];
    }
    if (isAdmin) {
      return DASHBOARD_MENU;
    }
    return DASHBOARD_MENU.filter((item) => item.key !== "pengeluaran" && item.key !== "stok");
  }, [isAdmin, isStaff]);

  // ponytail: dedup filter identik beruntun (month input bisa fire >1x).
  const lastFilterRef = useRef("");
  const handlePeriodFilterChange = useCallback(
    async (nextFilter) => {
      const key = `${nextFilter.range}|${nextFilter.period || ""}`;
      setPeriodFilter(nextFilter);
      if (lastFilterRef.current === key) return;
      lastFilterRef.current = key;
      if (nextFilter.range === "month") {
        await onRefreshMonthly(nextFilter.period || toPeriodValue());
      } else {
        await onRefreshAll?.();
      }
    },
    [onRefreshMonthly, onRefreshAll],
  );

  // ponytail: refresh = fungsi sync yang sama (dashboard_init, 1 round-trip
  // reports+master) → isSyncing menyala → tombol navbar "Menyinkronkan...".
  const handleRefresh = useCallback(async () => {
    if (periodFilter.range === "month") {
      await onRefreshMonthly(periodFilter.period || period, { refreshMaster: true });
    } else {
      await onRefreshAll?.({ refreshMaster: true });
    }
  }, [onRefreshMonthly, onRefreshAll, period, periodFilter.period, periodFilter.range]);

  useEffect(() => {
    const allowedKeys = new Set([...sidebarMenu.map((item) => item.key), "pemasukan", "pengeluaran", "laporan_harian"]);
    if (!allowedKeys.has(activeMenu)) {
      setActiveMenu(sidebarMenu[0]?.key || "laporan");
    }
  }, [activeMenu, sidebarMenu]);

  const isInitialLoading = loading && (reportRows || []).length === 0;

  // Cari apakah staf sudah memiliki laporan hari ini
  const todayStaffReport = useMemo(() => {
    if (!reportRows || reportRows.length === 0) return null;
    const now = new Date();

    return (
      reportRows.find((r) => {
        if (user?.lastTodayReport && r["NO TRANSAKSI"] === user.lastTodayReport) return true;
        const ts = String(r["TIME STAMP INPUT"] || "");
        const d = parseTimestamp(ts);
        if (d) {
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
          );
        }
        return false;
      }) || null
    );
  }, [reportRows, user?.lastTodayReport]);

  // Logic for Staff lastTodayReport
  useEffect(() => {
    if (isStaff && todayStaffReport && activeMenu === "laporan_harian") {
      setReportForm({ ...REPORT_FORM_DEFAULT, ...todayStaffReport });
      setIsEditMode(true);
    }
  }, [isStaff, todayStaffReport, activeMenu]);

  // ponytail: callback stabil — onChange inline membuat ReportForm menerima
  // identitas baru tiap render (B11).
  const handleReportFormChange = useCallback((key, value) => {
    setReportForm((prev) => ({ ...prev, [key]: value }));
  }, []);
  const handleReportFormCancel = useCallback(() => setActiveMenu("laporan"), []);

  function handleSelectMenu(menuKey) {
    if (menuKey === "laporan_harian") {
      // ponytail: tanpa refetch tiap buka tab (hemat 1-2 request berat).
      // yesterdayStock sudah diupdate lokal pasca-simpan; refresh hanya jika kosong.
      if (Object.keys(masterData?.yesterdayStock || {}).length === 0) {
        onReloadMaster?.(undefined, true).catch?.(() => {});
      }

      const defaultBranch = selectedBranch.toLowerCase() !== "semua" ? selectedBranch : (branchList[0] || "");
      if (!isStaff) {
        setIsEditMode(false);
        setReportForm({ ...REPORT_FORM_DEFAULT, "ARUS DANA": defaultBranch });
      } else if (todayStaffReport) {
        setIsEditMode(true);
        setReportForm({ ...REPORT_FORM_DEFAULT, ...todayStaffReport });
      } else {
        setIsEditMode(false);
        setReportForm({ ...REPORT_FORM_DEFAULT, "ARUS DANA": defaultBranch });
      }
    }
    // ponytail: navigasi manual ke kas → reset mode edit sisa routing sebelumnya.
    if (menuKey === "pemasukan") setEditingIncome(null);
    if (menuKey === "pengeluaran") setEditingExpense(null);
    setActiveMenu(menuKey);
    if (mode === "mobile") {
      setMobileOpen(false);
    }
  }

  function handleToggleSidebar() {
    if (mode === "mobile") {
      setMobileOpen((prev) => !prev);
      return;
    }
    setIsCollapsed((prev) => !prev);
  }


  function handleRequestLogout() {
    setLogoutDialogOpen(true);
  }

  async function handleConfirmLogout() {
    setLogoutLoading(true);
    try {
      await onLogout();
    } finally {
      setLogoutLoading(false);
      setLogoutDialogOpen(false);
    }
  }

  function handleEditReportRow(item) {
    if (!item) return;
    // Kasus A/B: baris transaksi PENGELUARAN dari Laporan (TransactionTable).
    if (item.type === "PENGELUARAN") {
      const parentId = item.parentTrxId || String(item.id || "").split("-EXP-")[0];
      // Kasus B: pengeluaran bagian laporan harian → buka form laporan induk.
      if (item.parentTrxId) {
        const parentRow = (reportRows || []).find((r) =>
          String(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || "").toLowerCase() === String(parentId).toLowerCase()
        );
        if (parentRow) {
          setReportForm({ ...REPORT_FORM_DEFAULT, ...parentRow });
          setIsEditMode(true);
          setEditingExpense(null);
          setEditingIncome(null);
          setActiveMenu("laporan_harian");
          return;
        }
      }
      // Kasus A: pengeluaran mandiri → Kas Keluar mode edit.
      setEditingExpense(item);
      setEditingIncome(null);
      setIsEditMode(false);
      setActiveMenu("pengeluaran");
      return;
    }
    // Kasus C/D: baris PEMASUKAN.
    if (item.type === "PEMASUKAN") {
      const raw = item.raw || {};
      const kategori = String(raw.KATEGORI || raw["KATEGORI"] || "");
      // Kasus C: pemasukan mandiri (kategori non-penjualan) → Kas Masuk mode edit.
      // ponytail: laporan penjualan selalu KATEGORI Penjualan; selain itu mandiri.
      if (kategori !== "Penjualan") {
        setEditingIncome(item);
        setEditingExpense(null);
        setIsEditMode(false);
        setActiveMenu("pemasukan");
        return;
      }
      // Kasus D: laporan harian penjualan → form laporan.
      const rowData = item.raw || item;
      setReportForm({ ...REPORT_FORM_DEFAULT, ...rowData });
      setIsEditMode(true);
      setEditingExpense(null);
      setEditingIncome(null);
      setActiveMenu("laporan_harian");
      return;
    }
    // Fallback: baris tabel laporan (staff / ReportTable) → form laporan.
    const rowData = item?.row || item?.raw || item;
    if (!rowData) return;
    setReportForm({ ...REPORT_FORM_DEFAULT, ...rowData });
    setIsEditMode(true);
    setEditingExpense(null);
    setEditingIncome(null);
    setActiveMenu("laporan_harian");
  }

  const handleCancelEdit = useCallback(() => {
    setEditingExpense(null);
    setEditingIncome(null);
    setActiveMenu("laporan");
  }, []);

  function handleAddReport() {
    if (isStaff && todayStaffReport) {
      handleEditReportRow({ row: todayStaffReport });
      return;
    }
    const defaultBranch = selectedBranch.toLowerCase() !== "semua" ? selectedBranch : (branchList[0] || "");
    setIsEditMode(false);
    setReportForm({ ...REPORT_FORM_DEFAULT, "ARUS DANA": defaultBranch });
    setActiveMenu("laporan_harian");
  }

  const handleKasSuccess = useCallback(() => {
    setEditingExpense(null);
    setEditingIncome(null);
    setActiveMenu("laporan");
  }, []);

  const handleUpdateKas = useCallback(async (id, patch) => {
    const ok = await onUpdateReport?.(id, patch, period);
    if (ok) {
      setEditingExpense(null);
      setEditingIncome(null);
      setActiveMenu("laporan");
    }
    return ok;
  }, [onUpdateReport, period]);

  async function handleFormSubmit(e) {
    e.preventDefault();
    const gelasAwal = Number(reportForm["GELAS AWAL"] ?? reportForm["GELAS MASUK"] ?? reportForm.stokBahan?.["Gelas Cup"]?.awal) || 0;
    const gelasSisa = Number(reportForm["GELAS SISA"] ?? reportForm.stokBahan?.["Gelas Cup"]?.sisa) || 0;
    const gelasRusak = Number(reportForm["GELAS RUSAK"]) || 0;
    const gelasTerpakai = Math.max(0, gelasAwal - (gelasSisa + gelasRusak));
    const gelasLaku = Number(reportForm["GELAS LAKU"]) || gelasTerpakai;

    // Hitung Multiple Pengeluaran jika ada
    let pengeluaranList = reportForm.pengeluaranList || [];
    let totalPengeluaran = pengeluaranList.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
    if (totalPengeluaran === 0) {
      totalPengeluaran = Number(reportForm["TOTAL PENGELUARAN"] || reportForm.PENGELUARAN || 0);
    }

    // Uang Setoran fisik
    const uangSetoran = Number(reportForm["UANG SETORAN"] ?? reportForm["UANG MASUK"] ?? reportForm["UNAG MASUK"] ?? 0);

    // Rumus: Total Penjualan = Uang Setoran + Total Pengeluaran
    const totalPenjualan = uangSetoran + totalPengeluaran;

    let idTransaksi = reportForm["ID TRANSAKSI"] || reportForm["NO TRANSAKSI"] || "";
    const isLegacyId = !idTransaksi || !String(idTransaksi).toUpperCase().startsWith("TRX-") || String(idTransaksi).includes(",");
    if (isLegacyId) {
      idTransaksi = generateTrxId(reportForm.TANGGAL || new Date());
    }

    const payload = {
      ...reportForm,
      "ID TRANSAKSI": idTransaksi,
      "NO TRANSAKSI": idTransaksi,
      "STAFF": reportForm.STAFF || user?.nama || "Staff",
      "CABANG": reportForm.CABANG || reportForm["ARUS DANA"] || selectedBranch,
      "ARUS DANA": reportForm.CABANG || reportForm["ARUS DANA"] || selectedBranch,
      "GELAS AWAL": String(gelasAwal),
      "GELAS SISA": String(gelasSisa),
      "GELAS RUSAK": String(gelasRusak),
      "GELAS TERPAKAI": String(gelasLaku),
      "GELAS LAKU": String(gelasLaku),
      "UANG SETORAN": String(uangSetoran),
      "TOTAL PENGELUARAN": String(totalPengeluaran),
      "PENGELUARAN": String(totalPengeluaran),
      "TOTAL PENJUALAN": String(totalPenjualan),
      "TOTAL NOTA": String(totalPenjualan),
      "UANG MASUK": String(totalPenjualan),
      "UNAG MASUK": String(totalPenjualan),
      "SELISIH": "0",
      pengeluaranList,
    };

    if (isEditMode) {
      const id = reportForm["ID TRANSAKSI"] || reportForm["NO TRANSAKSI"];
      const patch = { ...payload };
      delete patch["ID TRANSAKSI"];
      delete patch["NO TRANSAKSI"];
      if (await onUpdateReport(id, patch, period)) {
        setActiveMenu("laporan");
      }
    } else {
      const success = await onCreateReport(payload, period);
      if (success) {
        if (isStaff) {
          setIsEditMode(true);
          setActiveMenu("laporan");
        } else {
          setReportForm(REPORT_FORM_DEFAULT);
          setActiveMenu("laporan");
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex bg-brand-bg text-brand-text overflow-x-hidden">
      <Sidebar
        menu={sidebarMenu}
        activeMenu={activeMenu}
        mode={mode}
        isOpen={mode === "mobile" ? mobileOpen : true}
        isCollapsed={mode === "mobile" ? false : isCollapsed}
        user={user}
        onLogout={handleRequestLogout}
        onToggle={handleToggleSidebar}
        onCloseMobile={() => setMobileOpen(false)}
        onChangeMenu={handleSelectMenu}
      />

      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <Topbar
          user={user}
          mode={mode}
          isCollapsed={isCollapsed}
          onToggleSidebar={handleToggleSidebar}
          selectedBranch={selectedBranch}
          onSelectBranch={setSelectedBranch}
          branches={branches}
          periodFilter={periodFilter}
          onPeriodFilterChange={handlePeriodFilterChange}
          loading={loading}
          isSyncing={isSyncing}
          onRefresh={handleRefresh}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-4 no-scrollbar">
          <div className="w-full space-y-4 sm:space-y-6">
            {message && <Alert type="success">{message}</Alert>}
            {error && <Alert type="error">{error}</Alert>}
            {(isSyncing || syncNote) && (
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-brand-muted">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isSyncing ? "bg-brand-green animate-pulse" : "bg-amber-400"}`}
                />
                {isSyncing ? "Sinkronisasi data..." : syncNote}
              </p>
            )}

            {isInitialLoading ? (
              activeMenu === "dashboard" ? <OverviewSkeleton /> :
              activeMenu === "laporan" ? <ReportSkeleton /> :
              (activeMenu === "laporan_harian" || activeMenu === "pemasukan" || activeMenu === "pengeluaran") ? <FormSkeleton /> :
              <MasterPanelSkeleton />
            ) : (
            <div className={`transition-opacity duration-200 ${loading ? "opacity-75 pointer-events-none" : "opacity-100"}`}>
            <div className="animate-fade-in">
              <div hidden={activeMenu !== "dashboard"} style={{ display: activeMenu === "dashboard" ? "block" : "none" }}>
                {visitedMenus.has("dashboard") && (
                <OverviewPanel
                  reportRows={filteredReportRows}
                  dbRows={filteredReportRows}
                  periodFilter={periodFilter}
                  onPeriodFilterChange={handlePeriodFilterChange}
                  loading={loading}
                  isSyncing={isSyncing}
                />
                )}
              </div>

              <div hidden={activeMenu !== "laporan"} style={{ display: activeMenu === "laporan" ? "block" : "none" }}>
                  {visitedMenus.has("laporan") && (
                  <ReportPanel
                    reportRows={filteredReportRows}
                    loading={loading}
                    isAdmin={isAdmin}
                    onEditRow={handleEditReportRow}
                    onAddReport={handleAddReport}
                    onDeleteReport={onDeleteReport}
                    period={periodFilter.period || period}
                    todayReport={todayStaffReport}
                  />
                  )}
              </div>

              <div hidden={activeMenu !== "laporan_harian"} style={{ display: activeMenu === "laporan_harian" ? "block" : "none" }}>
                {visitedMenus.has("laporan_harian") && (
                <ReportForm
                  value={reportForm}
                  loading={loading || saving}
                  user={user}
                  isAdmin={isAdmin}
                  viewportMode={viewportMode}
                  isEdit={isEditMode}
                  availableBahan={availableBahan}
                  availableTipePengeluaran={availableTipePengeluaran}
                  availableBranches={branchList}
                  availableStaff={availableStaff}
                  yesterdayStock={masterData?.yesterdayStock || {}}
                  onSubmit={handleFormSubmit}
                  onCancel={handleReportFormCancel}
                  onChange={handleReportFormChange}
                />
                )}
              </div>

              <div hidden={activeMenu !== "pemasukan"} style={{ display: activeMenu === "pemasukan" ? "block" : "none" }}>
                {visitedMenus.has("pemasukan") && (
                  <PemasukanPanel
                    request={request}
                    onCreateReport={(payload) => onCreateReport(payload, period)}
                    onSuccess={handleKasSuccess}
                    branches={branchList}
                    availableSumberPemasukan={availableSumberPemasukan}
                    selectedBranch={selectedBranch}
                    user={user}
                    onReloadMaster={onReloadMaster}
                    editData={editingIncome}
                    onCancelEdit={handleCancelEdit}
                    onUpdateReport={handleUpdateKas}
                  />
                )}
              </div>

              <div hidden={activeMenu !== "pengeluaran"} style={{ display: activeMenu === "pengeluaran" ? "block" : "none" }}>
                {visitedMenus.has("pengeluaran") && (
                  <PengeluaranPanel
                    request={request}
                    onCreateReport={(payload) => onCreateReport(payload, period)}
                    onSuccess={handleKasSuccess}
                    branches={branchList}
                    availableTipePengeluaran={availableTipePengeluaran}
                    availableBahan={availableBahan}
                    selectedBranch={selectedBranch}
                    user={user}
                    onReloadMaster={onReloadMaster}
                    editData={editingExpense}
                    onCancelEdit={handleCancelEdit}
                    onUpdateReport={handleUpdateKas}
                  />
                )}
              </div>

              {isAdmin && (
                <>
                  <div hidden={activeMenu !== "stok"} style={{ display: activeMenu === "stok" ? "block" : "none" }}>
                    {activeMenu === "stok" && (
                      <StokPanel
                        selectedBranch={selectedBranch}
                        branches={branchList}
                        masterBahan={availableBahan}
                        reportRows={filteredReportRows}
                        dbRows={filteredReportRows}
                        request={request}
                        onReloadMaster={onReloadMaster}
                      />
                    )}
                  </div>

                  <div hidden={activeMenu !== "karyawan"} style={{ display: activeMenu === "karyawan" ? "block" : "none" }}>
                    {activeMenu === "karyawan" && (
              <KaryawanPanel
                users={masterData?.users || []}
                request={request}
                user={user}
                onReloadMaster={onReloadMaster}
              />
                    )}
                  </div>

                  <div hidden={activeMenu !== "cabang"} style={{ display: activeMenu === "cabang" ? "block" : "none" }}>
                    {activeMenu === "cabang" && (
                      <CabangPanel
                        selectedBranch={selectedBranch}
                        branches={branchList}
                        rawCabang={masterData?.cabang || []}
                        request={request}
                        onReloadMaster={onReloadMaster}
                      />
                    )}
                  </div>
                </>
              )}

              <div hidden={activeMenu !== "setting"} style={{ display: activeMenu === "setting" ? "block" : "none" }}>
                <SettingPanel user={user} pwa={pwa} />
              </div>
            </div>
            </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={logoutDialogOpen}
        title="Keluar dari Dashboard?"
        description="Session akun akan diakhiri. Kamu bisa login kembali kapan saja."
        confirmLabel="Ya"
        cancelLabel="Tidak"
        loading={logoutLoading}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
      />

    </div>
  );
}
