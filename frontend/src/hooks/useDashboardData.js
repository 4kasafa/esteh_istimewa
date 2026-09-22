import { useCallback, useEffect, useRef, useState } from "react";
import { isAuthErrorMessage, mapApiErrorMessage } from "../utils/errors";

function toRows(data) {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (data.rows && Array.isArray(data.rows)) return data.rows;
  return [data];
}

function sameTrxId(a, b) {
  return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

// ponytail: baris optimistis dari respons tulis agar daftar langsung tampil
// tanpa menunggu reload. Alias disamakan dengan buildReportRows_ backend.
function toOptimisticRow(res, pengeluaranList = []) {
  if (!res || typeof res !== "object") return null;
  const id = res["ID TRANSAKSI"] || res["NO TRANSAKSI"] || res.id;
  if (!id) return null;
  const cabang = res.CABANG || res["ARUS DANA"] || "";
  const nominal = Number(res.NOMINAL ?? res["TOTAL PENJUALAN"] ?? 0) || 0;
  const setoran = Number(res["UANG SETORAN"] ?? 0) || 0;
  const list = Array.isArray(pengeluaranList) ? pengeluaranList : [];
  return {
    ...res,
    "ID TRANSAKSI": id,
    "NO TRANSAKSI": id,
    "ARUS DANA": cabang,
    CABANG: cabang,
    STAFF: res.STAFF || "",
    "UANG MASUK": nominal,
    PENGELUARAN: Math.max(0, nominal - setoran),
    "GELAS AWAL": res["GELAS AWAL"] ?? 0,
    "GELAS SISA": res["GELAS SISA"] ?? 0,
    "GELAS LAKU": res["GELAS TERPAKAI"] ?? res["GELAS LAKU"] ?? 0,
    "TIME STAMP INPUT": `${res.TANGGAL || ""} ${res["WAKTU INPUT"] || ""}`.trim(),
    pengeluaranList: list,
  };
}

export function useDashboardData({ token, isAdmin, request, onAuthError }) {
  const [reportRows, setReportRows] = useState([]);
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
  const loadSequence = useRef(0);
  // ponytail: dedup request identik yang sedang terbang + stabilkan callback
  // agar tidak memicu cascade effect (token dibaca via ref).
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  const inflightRef = useRef(new Map());
  const masterInflightRef = useRef(null);

  const clearFeedback = useCallback(() => {
    setMessage("");
    setError("");
  }, []);

  const clearData = useCallback(() => {
    setReportRows([]);
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
    if (!tokenRef.current) return;
    // Dedup: panggilan master bersamaan cukup 1x.
    if (masterInflightRef.current) return masterInflightRef.current;
    const job = (async () => {
    try {
      if (isAdmin) {
        // ponytail: serial, bukan paralel — GAS men-throttle eksekusi konkuren
        // sehingga 2 request paralel sering balik HTML 404 bukan JSON.
        let masterVal = null;
        let initialVal = null;
        try {
          masterVal = await request({ action: "read_master" });
        } catch (err) {
          console.warn("Gagal memuat master:", err);
        }
        try {
          initialVal = await request({ action: "get_initial_form_data", cabang: cabangParam });
        } catch (err) {
          console.warn("Gagal memuat form awal:", err);
        }

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
    })();
    masterInflightRef.current = job;
    try {
      await job;
    } finally {
      if (masterInflightRef.current === job) masterInflightRef.current = null;
    }
  }, [isAdmin, request]);

  // ponytail: refreshMaster default false. Master (cabang/bahan/stok kemarin) hanya
  // di-refresh saat login & pasca mutasi — bukan tiap ganti filter/periode.
  // ponytail: get_summary tidak di-fetch — hasilnya tak pernah dipakai (KPI dihitung
  // lokal di OverviewPanel dari reportRows). Satu request hemat 1 full scan + 1 rekap.
  // ponytail: serial, maks 1 request GAS dalam penerbangan — paralel men-trigger
  // throttle GAS (balas HTML 404, bukan JSON).
  // ponytail: silent = muat di latar tanpa spinner global (dipakai pasca-simpan
  // agar sukses tampil instan; data menyusul saat fetch selesai).
  const loadData = useCallback(async ({ period = "", monthly = false, reportId = "", cabang = "", refreshMaster = false, silent = false } = {}) => {
    if (!tokenRef.current) return;
    const sequence = ++loadSequence.current;
    // Dedup request identik yang sedang terbang.
    const inflightKey = reportId
      ? `id:${reportId}`
      : `m:${monthly ? period : ""}|c:${cabang}|rm:${refreshMaster ? 1 : 0}`;
    if (inflightRef.current.has(inflightKey)) return inflightRef.current.get(inflightKey);
    const job = (async () => {
    if (!silent) setLoading(true);
    setError("");

    try {
      // Jalur cepat: 1 round-trip ganti 3 request serial (laporan+master+initial).
      // Fallback ke jalur lama agar kompatibel dengan GAS sebelum dashboard_init ada.
      if (!reportId && refreshMaster) {
        try {
          const batch = await request({
            action: "dashboard_init",
            period: monthly && period ? period : "",
            cabang,
          });
          if (batch && (Array.isArray(batch.reports) || batch.master || batch.initial)) {
            if (import.meta.env.DEV) console.info("[init] dashboard_init batch ok");
            if (sequence === loadSequence.current) {
              setReportRows(toRows(batch.reports));
              const m = batch.master || {};
              const init = batch.initial || {};
              setMasterData((prev) => ({
                ...prev,
                cabang: m.cabang || init.cabangList || prev.cabang,
                bahanBaku: m.bahanBaku || init.bahanBakuList || prev.bahanBaku,
                tipePengeluaran: m.tipePengeluaran || init.tipePengeluaranList || prev.tipePengeluaran,
                sumberPemasukan: m.sumberPemasukan || prev.sumberPemasukan,
                users: m.users || prev.users,
                yesterdayStock: init.yesterdayStock || prev.yesterdayStock,
              }));
              setError("");
            }
            return;
          }
        } catch {
          // lanjut ke jalur lama (tanda backend GAS belum deploy ulang)
          if (import.meta.env.DEV) console.warn("[init] dashboard_init gagal — fallback jalur lama, deploy ulang GAS backend");
        }
      }

      let reportPayload = { action: "read_reports" };
      if (reportId) {
        reportPayload = { action: "read_reports", id: reportId };
      } else if (monthly && period) {
        reportPayload = { action: "read_reports", period };
      }
      if (cabang && cabang.toLowerCase() !== "semua") {
        reportPayload.cabang = cabang;
      }

      const reportRes = await request(reportPayload);
      if (sequence === loadSequence.current) setReportRows(toRows(reportRes));

      // Master di-refresh setelah laporan selesai, bukan bersamaan.
      if (refreshMaster) {
        await loadMasterData(cabang).catch(() => {});
      }

      if (sequence === loadSequence.current) setError("");
    } catch (err) {
      const friendlyMessage = mapApiErrorMessage(err.message);
      if (sequence === loadSequence.current) setError(friendlyMessage);
      if (isAuthErrorMessage(err.message)) {
        await onAuthError?.();
      }
    } finally {
      if (!silent && sequence === loadSequence.current) setLoading(false);
    }
    })();
    inflightRef.current.set(inflightKey, job);
    try {
      await job;
    } finally {
      if (inflightRef.current.get(inflightKey) === job) inflightRef.current.delete(inflightKey);
    }
  }, [loadMasterData, onAuthError, request]);

  // ponytail: reload latar pasca-simpan; bila gagal, beri tahu eksplisit
  // (data sudah tersimpan) agar tidak terasa seperti input gagal sunyi.
  const reloadAfterSave = useCallback((args) => {
    loadData({ ...args, refreshMaster: false, silent: true }).catch(() => {
      setError("Data tersimpan, tetapi daftar gagal dimuat ulang. Ganti filter/periode untuk memuat ulang.");
    });
  }, [loadData]);

  const createReport = useCallback(async (form, period) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await request({ action: "create_report", data: form });
      setMessage("Laporan berhasil disimpan.");
      setTimeout(() => setMessage(""), 5000);

      const newId = response?.["ID TRANSAKSI"] || response?.["NO TRANSAKSI"];
      // ponytail: tanpa refreshMaster — master jarang berubah, hemat 2 request berat.
      // yesterdayStock diupdate lokal dari respons agar input berikutnya tetap benar.
      if (response && typeof response === "object") {
        const sisaPatch = {};
        Object.keys(response).forEach((k) => {
          if (k.endsWith(" SISA")) {
            const prefix = k.slice(0, -5);
            sisaPatch[prefix] = response[k];
          }
        });
        if (Object.keys(sisaPatch).length > 0) {
          setMasterData((prev) => {
            const next = { ...(prev.yesterdayStock || {}) };
            (prev.bahanBaku || []).forEach((b) => {
              const name = b.NAMA_BAHAN || b.nama;
              const pfx = String(name || "").toUpperCase();
              if (name && sisaPatch[pfx] !== undefined) next[name] = sisaPatch[pfx];
              if (pfx === "GELAS CUP" && sisaPatch.GELAS !== undefined) next[name] = sisaPatch.GELAS;
            });
            return { ...prev, yesterdayStock: next };
          });
        }
      }
      if (!isAdmin && newId) {
        try {
          localStorage.setItem("gas_last_today_report", newId);
        } catch (err) {
          console.error("Storage error:", err);
        }
      }
      // ponytail: baris langsung tampil (optimistis) — reload latar hanya rekonsiliasi.
      const optimistic = toOptimisticRow(response, form?.pengeluaranList);
      if (optimistic) {
        setReportRows((prev) =>
          prev.some((r) => sameTrxId(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || r.id, newId))
            ? prev.map((r) =>
                sameTrxId(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || r.id, newId) ? { ...r, ...optimistic } : r
              )
            : [...prev, optimistic]
        );
      }
      // ponytail: sukses instan — reload jalan di latar tanpa spinner.
      setLoading(false);
      if (!isAdmin && newId) {
        reloadAfterSave({ reportId: newId });
      } else {
        reloadAfterSave({ monthly: true, period });
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
  }, [isAdmin, onAuthError, reloadAfterSave, request]);

  const updateReport = useCallback(async (id, patch, period) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await request({ action: "update_report", id, data: patch });
      setMessage("Data berhasil diperbarui.");
      setTimeout(() => setMessage(""), 5000);

      // ponytail: baris langsung tampil (optimistis) — reload latar hanya rekonsiliasi.
      const optimistic = toOptimisticRow({ ...patch, ...response, "ID TRANSAKSI": id }, patch?.pengeluaranList);
      if (optimistic) {
        setReportRows((prev) =>
          prev.map((r) =>
            sameTrxId(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || r.id, id) ? { ...r, ...optimistic } : r
          )
        );
      }
      // ponytail: sukses instan — reload jalan di latar tanpa spinner.
      setLoading(false);
      if (!isAdmin && id) {
        reloadAfterSave({ reportId: id });
      } else {
        reloadAfterSave({ monthly: true, period });
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
  }, [isAdmin, onAuthError, reloadAfterSave, request]);

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

      // ponytail: tanpa refreshMaster — baris sudah difilter lokal di atas.
      // Sukses instan, reload di latar tanpa spinner.
      setLoading(false);
      reloadAfterSave({ monthly: true, period });

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
  }, [onAuthError, reloadAfterSave, request]);

  return {
    reportRows,
    masterData,
    loading,
    message,
    error,
    clearData,
    clearFeedback,
    loadMasterData,
    loadData,
    createReport,
    updateReport,
    deleteReport,
  };
}
