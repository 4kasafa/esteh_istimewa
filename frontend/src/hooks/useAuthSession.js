import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gasRequest } from "../services/gasApi";
import { isAuthErrorMessage, mapApiErrorMessage } from "../utils/errors";

function loadStoredUser() {
  try {
    const raw = localStorage.getItem("gas_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u && u.lastTodayReport) {
      u.lastTodayReport = "";
      localStorage.setItem("gas_user", JSON.stringify(u));
    }
    return u;
  } catch (err) {
    console.error("Storage error:", err);
    return null;
  }
}

export function useAuthSession(apiUrl) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("gas_token") || "";
    } catch {
      return "";
    }
  });
  const [user, setUser] = useState(loadStoredUser);
  const [isValidating, setIsValidating] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLoggedIn = Boolean(token);
  const isAdmin = useMemo(() => String(user?.role || "").toLowerCase() === "admin", [user]);

  // ponytail: request stabil (identitas tidak berubah saat token ganti) agar tidak
  // memicu cascade useEffect di App/useDashboardData. Token dibaca via ref.
  const tokenRef = useRef(token);
  const apiUrlRef = useRef(apiUrl);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  useEffect(() => {
    apiUrlRef.current = apiUrl;
  }, [apiUrl]);
  const validatingRef = useRef(null);
  const validatedTokenRef = useRef("");

  const request = useCallback(async (body, tokenOverride) => {
    const t = tokenOverride !== undefined ? tokenOverride : tokenRef.current;
    return gasRequest({ apiUrl: apiUrlRef.current, body, token: t });
  }, []);

  const logout = useCallback(async (force = false) => {
    const tokenAtLogout = tokenRef.current;

    validatedTokenRef.current = "";
    validatingRef.current = null;
    setToken("");
    setUser(null);
    setError("");
    
    try {
      localStorage.removeItem("gas_token");
      localStorage.removeItem("gas_user");
      localStorage.removeItem("gas_last_today_report");
      // ponytail: kunci cache master panel (P1 tidak lagi menulisnya, ini migrasi sekali).
      localStorage.removeItem("esteh_cabang_list");
      localStorage.removeItem("esteh_karyawan_list");
      localStorage.removeItem("esteh_bahan_list");
    } catch (err) {
      console.error("Storage error:", err);
    }

    if (!force && tokenAtLogout) {
      request({ action: "logout" }, tokenAtLogout).catch(() => {
        // API logout gagal tidak perlu menghambat clear session lokal.
      });
    }
  }, [request]);

  const validateSession = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) {
      setIsValidating(false);
      return;
    }
    // Skip jika token ini sudah tervalidasi (mis. tepat setelah login) atau
    // validasi sedang berjalan (StrictMode double-invoke).
    if (validatedTokenRef.current === t) {
      setIsValidating(false);
      return;
    }
    if (validatingRef.current === t) return;
    validatingRef.current = t;

    try {
      // ping ringan (tanpa buka Sheet bulanan). Fallback ke read_reports limit:1
      // agar tetap kompatibel dengan GAS lama sebelum action ping ada.
      try {
        await request({ action: "ping" }, t);
      } catch {
        await request({ action: "read_reports", limit: 1 }, t);
      }
      validatedTokenRef.current = t;
    } catch (err) {
      if (isAuthErrorMessage(err.message)) {
        await logout(true);
      }
    } finally {
      if (validatingRef.current === t) validatingRef.current = null;
      setIsValidating(false);
    }
  }, [logout, request]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError("");

    const username = String(credentials?.username || credentials?.email || "").trim();
    const password = String(credentials?.password || "").trim();

    try {
      const loginData = await request({ action: "login", username, password }, "");
      if (!loginData?.token || !loginData?.user) {
        throw new Error("Format data login tidak valid.");
      }

      const normalizedUser = {
        ...loginData.user,
        lastTodayReport: loginData.lastTodayReport || "",
      };

      // Tandai tervalidasi agar effect App tidak mengulang validate tepat setelah login.
      validatedTokenRef.current = loginData.token;
      setIsValidating(false);
      setToken(loginData.token);
      setUser(normalizedUser);
      
      try {
        localStorage.setItem("gas_token", loginData.token);
        localStorage.setItem("gas_user", JSON.stringify(normalizedUser));
        if (normalizedUser.lastTodayReport) {
          localStorage.setItem("gas_last_today_report", normalizedUser.lastTodayReport);
        }
      } catch (err) {
        console.error("Storage error:", err);
      }
      return loginData;
    } catch (err) {
      const message = mapApiErrorMessage(err.message);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  const clearAuthError = useCallback(() => setError(""), []);

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    isValidating,
    loading,
    error,
    request,
    login,
    logout,
    validateSession,
    clearAuthError,
  };
}
