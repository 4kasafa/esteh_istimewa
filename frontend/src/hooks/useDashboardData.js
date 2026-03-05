import { useCallback, useState } from "react";
import { isAuthErrorMessage, mapApiErrorMessage } from "../utils/errors";

function toRows(data) {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  return [data];
}

export function useDashboardData({ token, isAdmin, request, onAuthError }) {
  const [reportRows, setReportRows] = useState([]);
  const [dbRows, setDbRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearFeedback = useCallback(() => {
    setMessage("");
    setError("");
  }, []);

  const clearData = useCallback(() => {
    setReportRows([]);
    setDbRows([]);
    clearFeedback();
  }, [clearFeedback]);

  const loadData = useCallback(async ({ period = "", monthly = false, reportId = "" } = {}) => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      let reportPayload = { action: "read" };
      if (reportId) {
        reportPayload = { action: "read", id: reportId };
      } else if (monthly && period) {
        reportPayload = { action: "read", period };
      }
      const reportData = await request(reportPayload);
      setReportRows(toRows(reportData));

      if (isAdmin) {
        const dbPayload = monthly && period ? { action: "read_database", period } : { action: "read_database" };
        const dbData = await request(dbPayload);
        setDbRows(toRows(dbData));
      } else {
        setDbRows([]);
      }
    } catch (err) {
      const friendlyMessage = mapApiErrorMessage(err.message);
      setError(friendlyMessage);
      if (isAuthErrorMessage(err.message)) {
        await onAuthError?.();
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, onAuthError, request, token]);

  const createReport = useCallback(async (form, period) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await request({ action: "create", data: form });
      setMessage("Laporan berhasil disimpan.");
      setTimeout(() => setMessage(""), 5000);

      const newId = response?.["NO TRANSAKSI"];
      if (!isAdmin && newId) {
        try {
          localStorage.setItem("gas_last_today_report", newId);
        } catch (err) {
          console.error("Storage error:", err);
        }
        await loadData({ reportId: newId });
      } else {
        await loadData({ monthly: true, period });
      }

      return true;
    } catch (err) {
      const friendlyMessage = mapApiErrorMessage(err.message);
      setError(friendlyMessage);
      if (isAuthErrorMessage(err.message)) {
        await onAuthError?.();
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, loadData, onAuthError, request]);

  const updateReport = useCallback(async (id, patch, period) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await request({ action: "update", id, data: patch });
      setMessage("Data berhasil diupdate.");
      setTimeout(() => setMessage(""), 10000);

      if (!isAdmin && id) {
        await loadData({ reportId: id });
      } else {
        await loadData({ monthly: true, period });
      }

      return true;
    } catch (err) {
      const friendlyMessage = mapApiErrorMessage(err.message);
      setError(friendlyMessage);
      if (isAuthErrorMessage(err.message)) {
        await onAuthError?.();
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, loadData, onAuthError, request]);

  return {
    reportRows,
    dbRows,
    loading,
    message,
    error,
    clearData,
    clearFeedback,
    loadData,
    createReport,
    updateReport,
  };
}
