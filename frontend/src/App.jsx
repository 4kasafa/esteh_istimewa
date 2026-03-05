import { useCallback, useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { useAuthSession } from "./hooks/useAuthSession";
import { useDashboardData } from "./hooks/useDashboardData";

export default function App() {
  const [runtimeError, setRuntimeError] = useState(null);
  const apiUrl = import.meta.env.VITE_GAS_API_URL || "";

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
    validateSession,
    clearAuthError,
  } = useAuthSession(apiUrl);

  const handleAuthError = useCallback(() => logout(true), [logout]);

  const {
    reportRows,
    dbRows,
    loading: dataLoading,
    message: dataMessage,
    error: dataError,
    clearData,
    clearFeedback,
    loadData,
    createReport,
    updateReport,
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

  useEffect(() => {
    validateSession().catch(err => {
      console.error("Validation failed:", err);
    });
  }, [validateSession]);

  useEffect(() => {
    if (isLoggedIn && !isValidating) {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      if (isAdmin) {
        loadData({ monthly: true, period }).catch(() => {});
      } else {
        const role = String(user?.role || "").toLowerCase();
        if (!role) return;
        const lastTodayReportId = String(user?.lastTodayReport || "").trim();
        if (lastTodayReportId) {
          loadData({ reportId: lastTodayReportId }).catch(() => {});
        } else {
          loadData({ monthly: false }).catch(() => {});
        }
      }
    }
  }, [isAdmin, isLoggedIn, isValidating, loadData, user?.lastTodayReport, user?.role]);

  useEffect(() => {
    if (!isLoggedIn) {
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

  const loading = authLoading || dataLoading;
  const error = authError || dataError || runtimeError;

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9ee] text-[#1B3A1E] p-6 text-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-widest text-xs uppercase opacity-50">Memvalidasi Sesi...</p>
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
    return <LoginPage hasApiUrl={Boolean(apiUrl)} loading={loading} error={error} onLogin={handleLogin} />;
  }

  return (
    <DashboardPage
      user={user}
      isAdmin={isAdmin}
      loading={loading}
      message={dataMessage}
      error={error}
      reportRows={reportRows}
      dbRows={dbRows}
      onRefreshMonthly={(period) => loadData({ monthly: isAdmin, period })}
      onRefreshAll={() => loadData({ monthly: false })}
      onCreateReport={createReport}
      onUpdateReport={updateReport}
      onLogout={logout}
    />
  );
}
