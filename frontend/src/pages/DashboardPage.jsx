import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DASHBOARD_MENU } from "../constants/menu";
import { REPORT_FORM_DEFAULT } from "../constants/forms";
import Alert from "../components/common/Alert";
import KasKeluarPanel from "../components/dashboard/KasKeluarPanel";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import OverviewPanel from "../components/dashboard/OverviewPanel";
import ReportPanel from "../components/dashboard/ReportPanel";
import ReportForm from "../components/forms/ReportForm";
import KaryawanPanel from "../components/dashboard/KaryawanPanel";
import CabangPanel from "../components/dashboard/CabangPanel";
import SettingPanel from "../components/dashboard/SettingPanel";
import StokPanel from "../components/dashboard/StokPanel";
import SetupBanner from "../components/dashboard/SetupBanner";
import SetupWizard from "../components/dashboard/SetupWizard";
import ConfirmDialog from "../components/common/ConfirmDialog";
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
  message,
  error,
  reportRows,
  masterData,
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
  const [activeMenu, setActiveMenu] = useState(() => (isStaff ? "laporan" : "dashboard"));
  // ponytail: panel berat (overview/laporan/form) di-mount saat pertama dikunjungi
  // saja — bukan semuanya sekaligus. Setelah dikunjungi tetap mounted agar state
  // form tidak hilang. Memotong cascade ~20 useMemo O(n) saat data tiba.
  const [visitedMenus, setVisitedMenus] = useState(() => new Set([isStaff ? "laporan" : "dashboard"]));
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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("esteh_banner_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const viewportMode = mode;

  const branchList = useMemo(() => {
    const raw = masterData?.cabang || masterData?.cabangList || [];
    const names = raw.map((c) => (typeof c === "string" ? c : c.NAMA_CABANG || c.nama || c.ID_CABANG)).filter(Boolean);
    if (user?.cabang && !names.includes(user.cabang)) {
      names.push(user.cabang);
    }
    return names;
  }, [masterData, user?.cabang]);

  const branches = useMemo(() => ["Semua", ...branchList], [branchList]);

  const availableBahan = useMemo(() => {
    return masterData?.bahanBaku || masterData?.bahanBakuList || [];
  }, [masterData]);

  const availableTipePengeluaran = useMemo(() => {
    return masterData?.tipePengeluaran || masterData?.tipePengeluaranList || [];
  }, [masterData]);

  const availableStaff = useMemo(() => {
    const rawUsers = masterData?.users || [];
    const names = rawUsers.map((u) => u["NAMA / USERNAME"] || u["NAMA/USERNAME"] || u.NAMA || u.USERNAME).filter(Boolean);
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
      return [{ key: "laporan", label: "Laporan Hari Ini", icon: "laporan" }];
    }
    if (isAdmin) {
      return DASHBOARD_MENU;
    }
    return DASHBOARD_MENU.filter((item) => item.key !== "pengeluaran" && item.key !== "stok");
  }, [isAdmin, isStaff]);

  // ponytail: reload pasca-simpan silent (sukses sudah tampil, data menyusul).
  const reloadPengeluaran = useCallback(
    (overridePeriod) => onRefreshMonthly(overridePeriod || periodFilter.period || period, { silent: true }),
    [onRefreshMonthly, period, periodFilter.period],
  );

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

  useEffect(() => {
    const allowedKeys = new Set([...sidebarMenu.map((item) => item.key), "pemasukan"]);
    if (!allowedKeys.has(activeMenu)) {
      setActiveMenu(sidebarMenu[0]?.key || "laporan");
    }
  }, [activeMenu, sidebarMenu]);

  // Deteksi otomatis apakah data master esensial (cabang / staf) masih kosong
  const isMasterIncomplete = useMemo(() => {
    if (!isAdmin) return false;
    const rawCabang = masterData?.cabang || masterData?.cabangList || [];
    const rawStaff = (masterData?.users || []).filter(
      (u) => String(u.ROLE || u.role || "").toLowerCase() === "staff"
    );
    return rawCabang.length === 0 || rawStaff.length === 0;
  }, [isAdmin, masterData?.cabang, masterData?.cabangList, masterData?.users]);

  // Otomatis buka wizard saat pertama kali login admin jika data masih kosong & belum pernah dilewati di sesi ini
  // ponytail: deps pakai panjang array (stabil), bukan identitas array yang baru tiap fetch.
  const usersLength = (masterData?.users || []).length;
  useEffect(() => {
    if (!isAdmin || loading) return;
    if (usersLength === 0) return;

    try {
      const isSkipped = sessionStorage.getItem("esteh_wizard_skipped") === "true";
      const isCompleted = localStorage.getItem("esteh_wizard_completed") === "true";
      if (isMasterIncomplete && !isSkipped && !isCompleted) {
        setIsWizardOpen(true);
      }
    } catch {
      /* ignore storage errors */
    }
  }, [isAdmin, isMasterIncomplete, loading, usersLength]);

  const handleOpenWizard = useCallback(() => {
    setIsWizardOpen(true);
  }, []);

  const handleCloseWizard = useCallback(() => {
    try {
      sessionStorage.setItem("esteh_wizard_skipped", "true");
    } catch {
      /* ignore storage errors */
    }
    setIsWizardOpen(false);
  }, []);

  const handleFinishWizard = useCallback(async () => {
    try {
      localStorage.setItem("esteh_wizard_completed", "true");
      sessionStorage.removeItem("esteh_wizard_skipped");
    } catch {
      /* ignore storage errors */
    }
    setIsBannerDismissed(true);
    if (onReloadMaster) {
      await onReloadMaster();
    }
  }, [onReloadMaster]);

  const handleDismissBanner = useCallback(() => {
    try {
      sessionStorage.setItem("esteh_banner_dismissed", "true");
    } catch {
      /* ignore storage errors */
    }
    setIsBannerDismissed(true);
  }, []);

  const showBanner = isAdmin && isMasterIncomplete && !isBannerDismissed && !isWizardOpen;

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
    if (isStaff && todayStaffReport && activeMenu === "pemasukan") {
      setReportForm({ ...REPORT_FORM_DEFAULT, ...todayStaffReport });
      setIsEditMode(true);
    }
  }, [isStaff, todayStaffReport, activeMenu]);

  function handleSelectMenu(menuKey) {
    if (menuKey === "pemasukan") {
      // ponytail: tanpa refetch tiap buka tab (hemat 1-2 request berat).
      // yesterdayStock sudah diupdate lokal pasca-simpan; refresh hanya jika kosong.
      if (Object.keys(masterData?.yesterdayStock || {}).length === 0) {
        onReloadMaster?.().catch?.(() => {});
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
    const rowData = item?.row || item;
    if (!rowData) return;
    setReportForm({ ...REPORT_FORM_DEFAULT, ...rowData });
    setIsEditMode(true);
    setActiveMenu("pemasukan");
  }

  function handleAddReport() {
    if (isStaff && todayStaffReport) {
      handleEditReportRow({ row: todayStaffReport });
      return;
    }
    const defaultBranch = selectedBranch.toLowerCase() !== "semua" ? selectedBranch : (branchList[0] || "");
    setIsEditMode(false);
    setReportForm({ ...REPORT_FORM_DEFAULT, "ARUS DANA": defaultBranch });
    setActiveMenu("pemasukan");
  }

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
      {loading && (
        <div className="fixed inset-0 z-130 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-green-dark/30 backdrop-blur-sm" />
          <div className="relative rounded-3xl px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
              <p className="text-sm font-black text-brand-green-dark tracking-wide">Memuat data...</p>
            </div>
          </div>
        </div>
      )}

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
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-4 no-scrollbar">
          <div className="w-full space-y-4 sm:space-y-6">
            {showBanner && (
              <SetupBanner
                onStartWizard={handleOpenWizard}
                onDismiss={handleDismissBanner}
              />
            )}
            {message && <Alert type="success">{message}</Alert>}
            {error && <Alert type="error">{error}</Alert>}

            <div className="animate-fade-in">
              <div hidden={activeMenu !== "dashboard"} style={{ display: activeMenu === "dashboard" ? "block" : "none" }}>
                {visitedMenus.has("dashboard") && (
                <OverviewPanel
                  reportRows={filteredReportRows}
                  dbRows={filteredReportRows}
                  loading={loading}
                  periodFilter={periodFilter}
                  onPeriodFilterChange={handlePeriodFilterChange}
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

              <div hidden={activeMenu !== "pemasukan"} style={{ display: activeMenu === "pemasukan" ? "block" : "none" }}>
                {visitedMenus.has("pemasukan") && (
                <ReportForm
                  value={reportForm}
                  loading={loading}
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
                  onCancel={() => setActiveMenu("laporan")}
                  onChange={(key, value) => setReportForm((prev) => ({ ...prev, [key]: value }))}
                />
                )}
              </div>

              <div hidden={activeMenu !== "pengeluaran"} style={{ display: activeMenu === "pengeluaran" ? "block" : "none" }}>
                {activeMenu === "pengeluaran" && (
                  <KasKeluarPanel
                    request={request}
                    period={periodFilter.period || period}
                    branches={branchList}
                    staff={availableStaff}
                    availableTipePengeluaran={availableTipePengeluaran}
                    selectedBranch={selectedBranch}
                    onReload={reloadPengeluaran}
                    isAdmin={isAdmin}
                    user={user}
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
                        selectedBranch={selectedBranch}
                        branches={branchList}
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
                <SettingPanel user={user} onOpenWizard={handleOpenWizard} />
              </div>
            </div>
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

      <SetupWizard
        open={isWizardOpen}
        onClose={handleCloseWizard}
        onFinish={handleFinishWizard}
        request={request}
        existingBranches={branchList}
      />
    </div>
  );
}
