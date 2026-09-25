import { useCallback, useEffect, useRef, useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ConfirmDialog from "./components/common/ConfirmDialog";
import { useAuthSession } from "./hooks/useAuthSession";
import { useDashboardData } from "./hooks/useDashboardData";
import { usePWAInstall } from "./hooks/usePWAInstall";

export default function App() {
  const [runtimeError, setRuntimeError] = useState(null);
  const apiUrl = import.meta.env.VITE_GAS_API_URL || "";

  // Ref agar validateSession (dipanggil hook) bisa memakai handleAuthError
  // yang baru dibuat setelah hook kembali.
  const sessionExpiredHandlerRef = useRef(() => {});

  const {
    token,
    user,
    isLoggedIn,
    isAdmin,
    isValidating,
    loading: authLoading,
    error: authError,
    request,
    login,
    logout,
    clearAuthError,
  } = useAuthSession(apiUrl, () => sessionExpiredHandlerRef.current());

  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);
  const [reloginLoading, setReloginLoading] = useState(false);

  // 401 / sesi expired: kalau ada credential → dialog Sesi Berakhir;
  // kalau tidak → jalur lama (langsung ke LoginPage).
  const handleAuthError = useCallback(() => {
    let hasCredential = false;
    try {
      hasCredential = Boolean(localStorage.getItem("gas_relogin"));
    } catch {
      hasCredential = false;
    }
    if (hasCredential) {
      setSessionExpiredOpen(true);
    } else {
      logout(true);
    }
  }, [logout]);

  useEffect(() => {
    sessionExpiredHandlerRef.current = handleAuthError;
  }, [handleAuthError]);

  const pwa = usePWAInstall();

  const {
    reportRows,
    masterData,
    loadMasterData,
    loading: dataLoading,
    isSyncing: dataSyncing,
    syncNote: dataSyncNote,
    saving: dataSaving,
    message: dataMessage,
    error: dataError,
    clearData,
    clearFeedback,
    loadData,
    createReport,
    updateReport,
    deleteReport,
  } = useDashboardData({
    token,
    isAdmin,
    request,
    onAuthError: handleAuthError,
  });

  useEffect(() => {
    const handleError = (event) => {
      console.error("Runtime Error:", event.error);
      setRuntimeError(event.error?.message || "Terjadi kesalahan sistem.");
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // ponytail: init sekali per token. user dibaca via ref agar tidak memicu
  // fetch ulang saat object user berganti identitas.
  const initTokenRef = useRef("");
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    if (!isLoggedIn || isValidating) return;
    if (initTokenRef.current === token) return;
    initTokenRef.current = token;
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const u = userRef.current;
    if (isAdmin) {
      loadData({ monthly: true, period, refreshMaster: true }).catch(() => {});
    } else {
      const role = String(u?.role || "").toLowerCase();
      if (!role) return;
      const lastTodayReportId = String(u?.lastTodayReport || "").trim();
      if (lastTodayReportId) {
        loadData({ reportId: lastTodayReportId, refreshMaster: true }).catch(() => {});
      } else {
        loadData({ monthly: false, refreshMaster: true }).catch(() => {});
      }
    }
  }, [isAdmin, isLoggedIn, isValidating, loadData, token]);

  useEffect(() => {
    if (!isLoggedIn) {
      initTokenRef.current = "";
      clearData();
    }
  }, [clearData, isLoggedIn]);

  async function handleLogin(credentials) {
    clearFeedback();
    clearAuthError();
    try {
      await login(credentials);
    } catch {
      // Error state sudah diset di auth hook.
    }
  }

  async function handleRelogin() {
    let credential = null;
    try {
      credential = JSON.parse(localStorage.getItem("gas_relogin") || "null");
    } catch {
      credential = null;
    }
    if (!credential?.username || !credential?.password) {
      setSessionExpiredOpen(false);
      logout(true);
      return;
    }
    setReloginLoading(true);
    clearFeedback();
    clearAuthError();
    try {
      await login(credential);
      setSessionExpiredOpen(false);
    } catch {
      // Gagal (password ganti/dst) → tutup dialog + jalur lama ke LoginPage.
      setSessionExpiredOpen(false);
      await logout(true);
    } finally {
      setReloginLoading(false);
    }
  }

  function handleManualLogin() {
    setSessionExpiredOpen(false);
    logout(true);
  }

  const loading = authLoading || dataLoading;
  const error = authError || dataError || runtimeError;

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9ee] text-[#1B3A1E] p-6 text-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-widest text-xs uppercase opacity-50">Mohon tunggu...</p>
        {!apiUrl && (
          <p className="mt-4 text-red-500 text-xs font-bold">VITE_GAS_API_URL belum dikonfigurasi!</p>
        )}
      </div>
    );
  }

  if (runtimeError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-900 p-8 text-center">
        <h1 className="text-2xl font-black mb-2">Oops!</h1>
        <p className="text-sm font-bold opacity-70 mb-6">{runtimeError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-sm"
        >
          REFRESH HALAMAN
        </button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginPage 
        hasApiUrl={Boolean(apiUrl)} 
        loading={loading} 
        error={error} 
        onLogin={handleLogin} 
      />
    );
  }

  return (
    <>
      <DashboardPage
        user={user}
        isAdmin={isAdmin}
        loading={loading}
        isSyncing={dataSyncing}
        syncNote={dataSyncNote}
        saving={dataSaving}
        message={dataMessage}
        error={error}
        reportRows={reportRows}
        masterData={masterData}
        pwa={pwa}
        onRefreshMonthly={(period, opts) => loadData({ monthly: isAdmin, period, silent: Boolean(opts?.silent) })}
        onRefreshAll={(opts) => loadData({ monthly: false, silent: Boolean(opts?.silent) })}
        onCreateReport={createReport}
        onUpdateReport={updateReport}
        onDeleteReport={deleteReport}
        request={request}
        onReloadMaster={loadMasterData}
        onLogout={logout}
      />

      <ConfirmDialog
        open={sessionExpiredOpen}
        title="Sesi berakhir"
        description="Sesi kamu sudah berakhir. Relogin untuk langsung lanjut tanpa mengetik ulang, atau masuk manual."
        confirmLabel="Relogin"
        cancelLabel="Login manual"
        loading={reloginLoading}
        onConfirm={handleRelogin}
        onCancel={handleManualLogin}
      />
    </>
  );
}
