import { useCallback, useMemo, useState } from "react";
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

  const request = useCallback(async (body, tokenOverride = token) => {
    return gasRequest({ apiUrl, body, token: tokenOverride });
  }, [apiUrl, token]);

  const logout = useCallback(async (force = false) => {
    const tokenAtLogout = token;

    setToken("");
    setUser(null);
    setError("");
    
    try {
      localStorage.removeItem("gas_token");
      localStorage.removeItem("gas_user");
      localStorage.removeItem("gas_last_today_report");
    } catch (err) {
      console.error("Storage error:", err);
    }

    if (!force && tokenAtLogout) {
      request({ action: "logout" }, tokenAtLogout).catch(() => {
        // API logout gagal tidak perlu menghambat clear session lokal.
      });
    }
  }, [request, token]);

  const validateSession = useCallback(async () => {
    if (!token) {
      setIsValidating(false);
      return;
    }

    try {
      await request({ action: "read_reports", limit: 1 });
    } catch (err) {
      if (isAuthErrorMessage(err.message)) {
        await logout(true);
      }
    } finally {
      setIsValidating(false);
    }
  }, [logout, request, token]);

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
