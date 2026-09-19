import { useCallback, useEffect, useMemo, useState } from "react";
import { DASHBOARD_MENU } from "../constants/menu";
import { BRANCH_OPTIONS, DENOMINATIONS_DATA, REPORT_FORM_DEFAULT } from "../constants/forms";
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
import ConfirmDialog from "../components/common/ConfirmDialog";
import { parseTimestamp, toPeriodValue } from "../utils/formatters";

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
  dbRows,
  onRefreshMonthly,
  onRefreshAll,
  onCreateReport,
  onUpdateReport,
  request,
  onLogout,
}) {
  const isStaff = String(user?.role || "").toLowerCase() === "staff" || String(user?.role || "").toLowerCase() === "kasir";
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [mode, setMode] = useState(getViewportMode);
  const [isCollapsed, setIsCollapsed] = useState(mode === "tablet");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const period = toPeriodValue();
  const [reportForm, setReportForm] = useState(REPORT_FORM_DEFAULT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const branches = useMemo(() => ["Semua", ...BRANCH_OPTIONS], []);

  const filteredReportRows = useMemo(() => {
    if (!selectedBranch || selectedBranch.toLowerCase() === "semua") return reportRows;
    return (reportRows || []).filter((r) => {
      const branchVal = String(r["ARUS DANA"] || r.ARUS_DANA || "").trim().toLowerCase();
      return branchVal === selectedBranch.toLowerCase();
    });
  }, [reportRows, selectedBranch]);

  const filteredDbRows = useMemo(() => {
    if (!selectedBranch || selectedBranch.toLowerCase() === "semua") return dbRows;
    return (dbRows || []).filter((r) => {
      const branchVal = String(r["ARUS DANA"] || r.ARUS_DANA || "").trim().toLowerCase();
      return branchVal === selectedBranch.toLowerCase();
    });
  }, [dbRows, selectedBranch]);

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
    return DASHBOARD_MENU.filter((item) => item.key !== "pengeluaran");
  }, [isAdmin, isStaff]);

  const reloadPengeluaran = useCallback(
    (overridePeriod) => onRefreshMonthly(overridePeriod || period),
    [onRefreshMonthly, period],
  );

  useEffect(() => {
    const allowedKeys = new Set([...sidebarMenu.map((item) => item.key), "pemasukan"]);
    if (!allowedKeys.has(activeMenu)) {
      setActiveMenu(sidebarMenu[0]?.key || "laporan");
    }
  }, [activeMenu, sidebarMenu]);

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
      const defaultBranch = selectedBranch.toLowerCase() !== "semua" ? selectedBranch : (BRANCH_OPTIONS[0] || "");
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

  function panelClass(menuKey) {
    return activeMenu === menuKey ? "block" : "hidden";
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
    const defaultBranch = selectedBranch.toLowerCase() !== "semua" ? selectedBranch : (BRANCH_OPTIONS[0] || "");
    setIsEditMode(false);
    setReportForm({ ...REPORT_FORM_DEFAULT, "ARUS DANA": defaultBranch });
    setActiveMenu("pemasukan");
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const gelasAwal = Number(reportForm["GELAS AWAL"] ?? reportForm["GELAS MASUK"]) || 0;
    const gelasSisa = Number(reportForm["GELAS SISA"]) || 0;
    const gelasRusak = Number(reportForm["GELAS RUSAK"]) || 0;
    const gelasLaku = Number(reportForm["GELAS LAKU"]) || Math.max(0, gelasAwal - (gelasSisa + gelasRusak));
    const denomTotal = DENOMINATIONS_DATA.reduce((acc, item) => {
      const count = parseInt(reportForm[item.label]) || 0;
      return acc + (count * item.value);
    }, 0);
    const autoTotalPenjualan = gelasLaku * 4000;
    const totalNota = autoTotalPenjualan > 0 ? autoTotalPenjualan : (Number(reportForm["TOTAL NOTA"]) || denomTotal);
    const uangMasuk = denomTotal > 0 ? denomTotal : (Number(reportForm["UANG MASUK"] || reportForm["UNAG MASUK"]) || totalNota);
    const pengeluaran = Number(reportForm.PENGELUARAN || 0);
    const selisih = uangMasuk - totalNota;

    const payload = {
      ...reportForm,
      "GELAS AWAL": String(gelasAwal),
      "GELAS SISA": String(gelasSisa),
      "GELAS RUSAK": String(gelasRusak),
      "GELAS LAKU": String(gelasLaku),
      "TOTAL NOTA": String(totalNota),
      "UANG MASUK": String(uangMasuk),
      "UNAG MASUK": String(uangMasuk),
      "SELISIH": String(selisih),
      "PENGELUARAN": String(pengeluaran),
    };

    if (isEditMode) {
      const id = reportForm["NO TRANSAKSI"];
      const patch = { ...payload };
      delete patch["NO TRANSAKSI"]; // ID is not updated
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
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-4 no-scrollbar">
          <div className="w-full space-y-4 sm:space-y-6">
            {message && <Alert type="success">{message}</Alert>}
            {error && <Alert type="error">{error}</Alert>}

            <div className="animate-fade-in">
              <div className={panelClass("dashboard")}>
                <OverviewPanel
                  dbRows={filteredDbRows}
                  loading={loading}
                  onRefreshMonthly={onRefreshMonthly}
                  onRefreshAll={onRefreshAll}
                />
              </div>

              <div className={panelClass("laporan")}>
                <ReportPanel
                  reportRows={filteredReportRows}
                  loading={loading}
                  isAdmin={isAdmin}
                  onRefreshMonthly={onRefreshMonthly}
                  onRefreshAll={onRefreshAll}
                  onEditRow={handleEditReportRow}
                  onAddReport={handleAddReport}
                  todayReport={todayStaffReport}
                />
              </div>

              <div className={panelClass("pemasukan")}>
                <div className="bg-white rounded-4xl p-6 sm:p-10 border border-brand-green/5 card-shadow">
                  <ReportForm
                    value={reportForm}
                    loading={loading}
                    user={user}
                    isEdit={isEditMode}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setActiveMenu("laporan")}
                    onChange={(key, value) => setReportForm((prev) => ({ ...prev, [key]: value }))}
                  />
                </div>
              </div>

              <div className={panelClass("pengeluaran")}>
                <KasKeluarPanel
                  dbRows={filteredDbRows}
                  request={request}
                  period={period}
                  onReload={reloadPengeluaran}
                  user={user}
                />
              </div>

              <div className={panelClass("karyawan")}>
                <KaryawanPanel selectedBranch={selectedBranch} />
              </div>

              <div className={panelClass("cabang")}>
                <CabangPanel selectedBranch={selectedBranch} />
              </div>

              <div className={panelClass("setting")}>
                <SettingPanel user={user} />
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
    </div>
  );
}
