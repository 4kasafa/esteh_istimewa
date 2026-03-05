import { useEffect, useMemo, useState } from "react";
import { DASHBOARD_MENU } from "../constants/menu";
import { REPORT_FORM_DEFAULT } from "../constants/forms";
import { filterRows } from "../utils/dashboard";
import Alert from "../components/common/Alert";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import OverviewPanel from "../components/dashboard/OverviewPanel";
import DataTable from "../components/dashboard/DataTable";
import ReportPanel from "../components/dashboard/ReportPanel";
import ReportForm from "../components/forms/ReportForm";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { toPeriodValue } from "../utils/formatters";

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
  onLogout,
}) {
  const isKasir = String(user?.role || "").toLowerCase() === "kasir";
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [mode, setMode] = useState(getViewportMode);
  const [isCollapsed, setIsCollapsed] = useState(mode === "tablet");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState(toPeriodValue());
  const [dbSearch, setDbSearch] = useState("");
  const [reportForm, setReportForm] = useState(REPORT_FORM_DEFAULT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  const filteredDatabase = useMemo(() => filterRows(dbRows, dbSearch), [dbRows, dbSearch]);
  
  const sidebarMenu = useMemo(() => {
    if (!isKasir) return DASHBOARD_MENU;
    const kasirAllowed = new Set(["laporan", "kas-masuk", "setting", "about"]);
    return DASHBOARD_MENU.filter((item) => kasirAllowed.has(item.key));
  }, [isKasir]);

  useEffect(() => {
    if (!sidebarMenu.some((item) => item.key === activeMenu)) {
      setActiveMenu(sidebarMenu[0]?.key || "laporan");
    }
  }, [activeMenu, sidebarMenu]);

  // Logic for Kasir lastTodayReport
  useEffect(() => {
    if (isKasir && user?.lastTodayReport && reportRows.length > 0 && activeMenu === "kas-masuk") {
      const todayReport = reportRows.find(row => row["NO TRANSAKSI"] === user.lastTodayReport);
      if (todayReport) {
        setReportForm({ ...REPORT_FORM_DEFAULT, ...todayReport });
        setIsEditMode(true);
      }
    }
  }, [isKasir, user?.lastTodayReport, reportRows, activeMenu]);

  function handleSelectMenu(menuKey) {
    if (menuKey === "kas-masuk") {
      // Jika bukan kasir, atau kasir tapi belum ada report (tidak di edit mode), reset form
      // Tapi jika kasir dan sudah ada report, biarkan isEditMode tetap true
      if (!isKasir) {
        setIsEditMode(false);
        setReportForm(REPORT_FORM_DEFAULT);
      } else if (!isEditMode) {
        setIsEditMode(false);
        setReportForm(REPORT_FORM_DEFAULT);
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

  function renderTopActions() {
    if (isKasir) {
      return (
        <div className="flex items-center justify-end gap-2 mb-6 bg-white/50 p-4 rounded-2xl border border-white/80 shadow-sm">
          <button
            className="px-5 py-2.5 bg-brand-green text-white rounded-xl text-sm font-bold hover:bg-brand-green-dark transition-all shadow-lg shadow-brand-green/10 disabled:opacity-50"
            onClick={onRefreshAll}
            disabled={loading}
          >
            Refresh Data
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white/50 p-4 rounded-2xl border border-white/80 shadow-sm">
        <div className="flex flex-col gap-1 flex-1 min-w-50">
          <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted opacity-60 ml-1">Periode Laporan</label>
          <input
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="w-full bg-white border border-brand-green/10 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
        <div className="flex gap-2">
          <button
            className="px-5 py-2.5 bg-brand-green text-white rounded-xl text-sm font-bold hover:bg-brand-green-dark transition-all shadow-lg shadow-brand-green/10 disabled:opacity-50"
            onClick={() => onRefreshMonthly(period)}
            disabled={loading}
          >
            Terapkan
          </button>
          <button
            className="px-5 py-2.5 bg-brand-yellow text-brand-green-dark rounded-xl text-sm font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-200/50 disabled:opacity-50"
            onClick={onRefreshAll}
            disabled={loading}
          >
            Semua
          </button>
        </div>
      </div>
    );
  }

  function handleEditReportRow(item) {
    const rowData = item?.row;
    if (!rowData) return;
    setReportForm({ ...REPORT_FORM_DEFAULT, ...rowData });
    setIsEditMode(true);
    setActiveMenu("kas-masuk");
  }

  function handleAddReport() {
    setIsEditMode(false);
    setReportForm(REPORT_FORM_DEFAULT);
    setActiveMenu("kas-masuk");
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (isEditMode) {
      const id = reportForm["NO TRANSAKSI"];
      const patch = { ...reportForm };
      delete patch["NO TRANSAKSI"]; // ID is not updated
      if (await onUpdateReport(id, patch, period)) {
        setActiveMenu("laporan");
      }
    } else {
      const success = await onCreateReport(reportForm, period);
      if (success) {
        if (isKasir) {
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
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-4 no-scrollbar">
          <div className="w-full space-y-4 sm:space-y-6">
            {message && <Alert type="success">{message}</Alert>}
            {error && <Alert type="error">{error}</Alert>}

            <div className="animate-fade-in">
              <div className={panelClass("dashboard")}>
                <OverviewPanel
                  dbRows={dbRows}
                  loading={loading}
                  onRefreshMonthly={onRefreshMonthly}
                  onRefreshAll={onRefreshAll}
                />
              </div>

              <div className={panelClass("laporan")}>
                <ReportPanel
                  reportRows={reportRows}
                  loading={loading}
                  isAdmin={isAdmin}
                  onRefreshMonthly={onRefreshMonthly}
                  onRefreshAll={onRefreshAll}
                  onEditRow={handleEditReportRow}
                  onAddReport={handleAddReport}
                />
              </div>

              <div className={panelClass("kas-masuk")}>
                <div className="bg-white rounded-4xl p-6 sm:p-10 border border-brand-green/5 card-shadow">
                  <ReportForm
                    value={reportForm}
                    loading={loading}
                    user={user}
                    isEdit={isEditMode}
                    onSubmit={handleFormSubmit}
                    onChange={(key, value) => setReportForm((prev) => ({ ...prev, [key]: value }))}
                  />
                </div>
              </div>

              <div className={panelClass("setting")}>
                <div className="space-y-6">
                  {renderTopActions()}
                  <div className="bg-white rounded-4xl p-8 border border-brand-green/5 card-shadow space-y-3">
                    <h3 className="text-xl font-black text-brand-green-dark">Setting Panel</h3>
                    <p className="text-sm text-brand-muted">Konfigurasi dasar akun dan filter laporan ada di menu ini.</p>
                    <p className="text-xs text-brand-muted">Akun aktif: {user?.nama || "User"} ({user?.email || "-"})</p>
                  </div>
                  {isAdmin ? (
                    <DataTable title="Data Database (Admin)" rows={filteredDatabase} search={dbSearch} onSearchChange={setDbSearch} />
                  ) : (
                    <Alert type="info">Data database hanya tersedia untuk akun admin.</Alert>
                  )}
                </div>
              </div>

              <div className={panelClass("about")}>
                <div className="bg-white rounded-4xl p-8 border border-brand-green/5 card-shadow space-y-3">
                  <h3 className="text-xl font-black text-brand-green-dark">About</h3>
                  <p className="text-sm text-brand-muted">Dashboard operasional Es teh Lay untuk input dan monitoring transaksi harian outlet.</p>
                  <p className="text-sm text-brand-muted">Frontend: React + Vite + Tailwind. Backend: Google Apps Script API.</p>
                </div>
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
