import { useCallback, useState } from "react";
import { isAuthErrorMessage, mapApiErrorMessage } from "../utils/errors";

function toRows(data) {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (data.rows && Array.isArray(data.rows)) return data.rows;
  return [data];
}

export function useDashboardData({ token, isAdmin, request, onAuthError }) {
  const [reportRows, setReportRows] = useState([]);
  const [dbRows, setDbRows] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [masterData, setMasterData] = useState({
    cabang: [],
    bahanBaku: [],
    tipePengeluaran: [],
    sumberPemasukan: [],
    users: [],
    yesterdayStock: {},
  });
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
    setSummaryData(null);
    setMasterData({
      cabang: [],
      bahanBaku: [],
      tipePengeluaran: [],
      sumberPemasukan: [],
      users: [],
      yesterdayStock: {},
    });
    clearFeedback();
  }, [clearFeedback]);

  const loadMasterData = useCallback(async (cabangParam = "") => {
    if (!token) return;
    try {
      if (isAdmin) {
        const [masterRes, initialFormRes] = await Promise.allSettled([
          request({ action: "read_master" }),
          request({ action: "get_initial_form_data", cabang: cabangParam }),
        ]);

        const masterVal = masterRes.status === "fulfilled" ? masterRes.value : null;
        const initialVal = initialFormRes.status === "fulfilled" ? initialFormRes.value : null;

        setMasterData((prev) => ({
          ...prev,
          cabang: masterVal?.cabang || initialVal?.cabangList || prev.cabang,
          bahanBaku: masterVal?.bahanBaku || initialVal?.bahanBakuList || prev.bahanBaku,
          tipePengeluaran: masterVal?.tipePengeluaran || initialVal?.tipePengeluaranList || prev.tipePengeluaran,
          sumberPemasukan: masterVal?.sumberPemasukan || prev.sumberPemasukan,
          users: masterVal?.users || prev.users,
          yesterdayStock: initialVal?.yesterdayStock || prev.yesterdayStock,
        }));
      } else {
        const initialVal = await request({ action: "get_initial_form_data", cabang: cabangParam });
        if (initialVal) {
          setMasterData((prev) => ({
            ...prev,
            cabang: initialVal.cabangList || prev.cabang,
            bahanBaku: initialVal.bahanBakuList || prev.bahanBaku,
            tipePengeluaran: initialVal.tipePengeluaranList || prev.tipePengeluaran,
            yesterdayStock: initialVal.yesterdayStock || prev.yesterdayStock,
          }));
        }
      }
    } catch (err) {
      console.warn("Gagal memuat data master dari server:", err);
    }
  }, [isAdmin, request, token]);

  const loadData = useCallback(async ({ period = "", monthly = false, reportId = "", cabang = "" } = {}) => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      let reportPayload = { action: "read_reports" };
      if (reportId) {
        reportPayload = { action: "read_reports", id: reportId };
      } else if (monthly && period) {
        reportPayload = { action: "read_reports", period };
      }
      if (cabang && cabang.toLowerCase() !== "semua") {
        reportPayload.cabang = cabang;
      }

      const reportData = await request(reportPayload);
      setReportRows(toRows(reportData));

      // Muat data master secara paralel
      loadMasterData(cabang).catch(() => {});

      if (isAdmin) {
        const summaryPayload = { action: "get_summary" };
        if (monthly && period) summaryPayload.period = period;
        if (cabang && cabang.toLowerCase() !== "semua") summaryPayload.cabang = cabang;

        const sumData = await request(summaryPayload);
        setSummaryData(sumData);
        setDbRows(toRows(sumData?.rows || sumData));
      } else {
        setDbRows([]);
        setSummaryData(null);
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
  }, [isAdmin, loadMasterData, onAuthError, request, token]);

  const createReport = useCallback(async (form, period) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await request({ action: "create_report", data: form });
      setMessage("Laporan berhasil disimpan.");
      setTimeout(() => setMessage(""), 5000);

      const newId = response?.["ID TRANSAKSI"] || response?.["NO TRANSAKSI"];
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
      await request({ action: "update_report", id, data: patch });
      setMessage("Data berhasil diperbarui.");
      setTimeout(() => setMessage(""), 5000);

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

  const deleteReport = useCallback(async (id, period, rowIndex) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await request({ action: "delete_report", id, period, rowIndex });
      setMessage("Transaksi berhasil dihapus.");
      setTimeout(() => setMessage(""), 5000);

      setReportRows((prev) =>
        prev.filter((r) => {
          const matchId = id && String(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || r.id || "").toLowerCase() === String(id).toLowerCase();
          const matchRowIndex = rowIndex && r._rowIndex === rowIndex;
          return !matchId && !matchRowIndex;
        })
      );
      setDbRows((prev) =>
        prev.filter((r) => {
          const matchId = id && String(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || r.id || "").toLowerCase() === String(id).toLowerCase();
          const matchRowIndex = rowIndex && r._rowIndex === rowIndex;
          return !matchId && !matchRowIndex;
        })
      );

      await loadData({ monthly: true, period });

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
  }, [loadData, onAuthError, request]);

  return {
    reportRows,
    dbRows,
    summaryData,
    masterData,
    loadMasterData,
    loading,
    message,
    error,
    clearData,
    clearFeedback,
    loadData,
    createReport,
    updateReport,
    deleteReport,
  };
}
