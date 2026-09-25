import { useCallback, useEffect, useRef, useState } from "react";
import { isAuthErrorMessage, mapApiErrorMessage } from "../utils/errors";
import { getSwrCache, removeSwrCache, setSwrCache } from "../utils/swrCache";

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
    // ponytail: respons create expense-only sudah membawa PENGELUARAN benar;
    // fallback hitung lokal untuk jalur lama yang tidak membalikkannya.
    "PENGELUARAN": res.PENGELUARAN ?? Math.max(0, nominal - setoran),
    "GELAS AWAL": res["GELAS AWAL"] ?? 0,
    "GELAS SISA": res["GELAS SISA"] ?? 0,
    "GELAS LAKU": res["GELAS TERPAKAI"] ?? res["GELAS LAKU"] ?? 0,
    "TIME STAMP INPUT": `${res.TANGGAL || ""} ${res["WAKTU INPUT"] || ""}`.trim(),
    pengeluaranList: list,
  };
}

// ponytail: respons create/update membawa key "<BAHAN> SISA" → patch lokal
// yesterdayStock agar input berikutnya benar tanpa refetch.
function extractSisaPatch(response) {
  const patch = {};
  if (!response || typeof response !== "object") return patch;
  Object.keys(response).forEach((k) => {
    if (k.endsWith(" SISA")) patch[k.slice(0, -5)] = response[k];
  });
  return patch;
}

function patchYesterdayStock(prev, sisaPatch) {
  if (Object.keys(sisaPatch).length === 0) return prev;
  const next = { ...(prev.yesterdayStock || {}) };
  (prev.bahanBaku || []).forEach((b) => {
    const name = b.NAMA_BAHAN || b.nama;
    const pfx = String(name || "").toUpperCase();
    if (name && sisaPatch[pfx] !== undefined) next[name] = sisaPatch[pfx];
    if (pfx === "GELAS CUP" && sisaPatch.GELAS !== undefined) next[name] = sisaPatch.GELAS;
  });
  return { ...prev, yesterdayStock: next };
}

const DEFAULT_MASTER = {
  cabang: [],
  bahanBaku: [],
  tipePengeluaran: [],
  sumberPemasukan: [],
  users: [],
  yesterdayStock: {},
};

export function useDashboardData({ token, isAdmin, request, onAuthError }) {
  // ponytail: boot instan — baca cache lokal dulu, jaringan hanya merekonsiliasi.
  const [reportRows, setReportRows] = useState(() => getSwrCache("reports_init", []));
  const [masterData, setMasterData] = useState(() => getSwrCache("master", DEFAULT_MASTER));
  const [loading, setLoading] = useState(false);
  // ponytail: status sinkronisasi latar agar UI bisa menampilkan indikator halus
  // tanpa memblokir data yang sudah tampil dari cache.
  const [isSyncing, setIsSyncing] = useState(false);
  // ponytail: status halus saat sinkronisasi latar gagal tapi data lokal ada —
  // pengganti Alert merah (data tetap layak pakai, bukan error fatal).
  const [syncNote, setSyncNote] = useState("");
  // ponytail: saving terpisah dari loading — overlay fullscreen hanya untuk
  // baca; menulis tidak memblokir dashboard (B9).
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadSequence = useRef(0);
  // ponytail: dedup request identik yang sedang terbang + stabilkan callback
  // agar tidak memicu cascade effect (token dibaca via ref).
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  // ponytail: cermin sinkron masterData — dipakai untuk merge batch dashboard_init
  // di luar updater React (side-effect di updater dobel-jalan di StrictMode).
  const masterRef = useRef(masterData);
  useEffect(() => {
    masterRef.current = masterData;
  }, [masterData]);
  // ponytail: ref untuk keputusan blocking di loadData — boot dengan data cache
  // tidak boleh memunculkan overlay fullscreen (itulah "jeda 3-5 detik").
  const hasLocalRef = useRef(false);
  useEffect(() => {
    hasLocalRef.current = reportRows.length > 0 || (masterData?.cabang || []).length > 0;
  }, [reportRows, masterData]);
  const inflightRef = useRef(new Map());
  const masterInflightRef = useRef(null);

  const clearFeedback = useCallback(() => {
    setMessage("");
    setError("");
  }, []);

  // ponytail: 401 → tunggu silent relogin (onAuthError) selesai, lalu ulangi
  // request sekali secara transparan. Tanpa ini user lihat error sesaat
  // padahal token baru sudah didapat di background.
  const requestWithRetry = useCallback(async (payload) => {
    try {
      return await request(payload);
    } catch (err) {
      if (!isAuthErrorMessage(err?.message)) throw err;
      const healed = await onAuthError?.();
      if (!healed) throw err;
      return await request(payload);
    }
  }, [onAuthError, request]);

  const clearData = useCallback(() => {
    setReportRows([]);
    setMasterData(DEFAULT_MASTER);
    // ponytail: logout membuang cache — jangan bocorkan data cabang ke sesi berikutnya.
    removeSwrCache("master");
    removeSwrCache("reports_init");
    setSyncNote("");
    clearFeedback();
  }, [clearFeedback]);

  // ponytail: admin cukup read_master (sudah bawa cabang/bahan/tipe/sumber/users);
  // get_initial_form_data hanya saat butuh yesterdayStock (wantInitial=true).
  // Staff tetap get_initial_form_data saja (satu-satunya yang dibutuhkan).
  const loadMasterData = useCallback(async (cabangParam = "", wantInitial = false) => {
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
        if (wantInitial) {
          try {
            initialVal = await request({ action: "get_initial_form_data", cabang: cabangParam });
          } catch (err) {
            console.warn("Gagal memuat form awal:", err);
          }
        }

        setMasterData((prev) => {
          const cabang = masterVal?.cabang || initialVal?.cabangList || prev.cabang;
          const bahanBaku = masterVal?.bahanBaku || initialVal?.bahanBakuList || prev.bahanBaku;
          const tipePengeluaran = masterVal?.tipePengeluaran || initialVal?.tipePengeluaranList || prev.tipePengeluaran;
          const prevStock = initialVal?.yesterdayStock || prev.yesterdayStock || {};
          const nextStock = { ...prevStock };
          // ponytail: default 0 untuk bahan baru (belum pernah ada laporan).
          // Hanya bila sudah ada isi — kalau masih kosong total, biarkan kosong
          // agar jalur "buka pemasukan saat kosong" tetap memicu initial fetch.
          if (Object.keys(prevStock).length > 0) {
            bahanBaku.forEach((b) => {
              const name = b.NAMA_BAHAN || b.nama;
              if (name && nextStock[name] === undefined) nextStock[name] = 0;
            });
          }
          return {
            ...prev,
            cabang,
            bahanBaku,
            tipePengeluaran,
            sumberPemasukan: masterVal?.sumberPemasukan || prev.sumberPemasukan,
            users: masterVal?.users || prev.users,
            yesterdayStock: nextStock,
          };
        });
      } else {
        const initialVal = await request({ action: "get_initial_form_data", cabang: cabangParam });
        if (initialVal) {
          setMasterData((prev) => ({
            ...prev,
            cabang: initialVal.cabangList || prev.cabang,
            bahanBaku: initialVal.bahanBakuList || prev.bahanBaku,
            tipePengeluaran: initialVal.tipePengeluaranList || prev.tipePengeluaran,
            yesterdayStock: initialVal.yesterdayStock || prev.yesterdayStock,
            users: initialVal.staffList || initialVal.users || prev.users,
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
    // ponytail: overlay fullscreen hanya bila belum ada data lokal. Boot ulang
    // dengan cache harus cat langsung (0 ms), bukan tertutup spinner "Memuat...".
    // Ganti periode tetap blocking (umpan balik lama, diganti skeleton di task06).
    const blocking = !silent && !(refreshMaster && hasLocalRef.current);
    if (blocking) setLoading(true);
    setError("");
    setSyncNote("");

    try {
      // Jalur cepat: 1 round-trip ganti 3 request serial (laporan+master+initial).
      // ponytail: TANPA fallback waterfall. dashboard_init gagal/timeout → data
      // lokal dari cache tetap tampil; 3-5 request serial berikutnya hanya
      // memperpanjang kegagalan (dulu >1 menit, 6 log request).
      if (refreshMaster) {
        setIsSyncing(true);
        try {
          const batch = await requestWithRetry({
            action: "dashboard_init",
            period: monthly && period ? period : "",
            cabang,
            id: reportId || "",
          });
          if (batch && (Array.isArray(batch.reports) || batch.master || batch.initial)) {
            if (import.meta.env.DEV) console.info("[init] dashboard_init batch ok");
            if (sequence === loadSequence.current) {
              const m = batch.master || {};
              const init = batch.initial || {};
              const prevM = masterRef.current;
              const nextMaster = {
                ...prevM,
                cabang: m.cabang || init.cabangList || prevM.cabang,
                bahanBaku: m.bahanBaku || init.bahanBakuList || prevM.bahanBaku,
                tipePengeluaran: m.tipePengeluaran || init.tipePengeluaranList || prevM.tipePengeluaran,
                sumberPemasukan: m.sumberPemasukan || prevM.sumberPemasukan,
                users: m.users || init.users || init.staffList || prevM.users,
                yesterdayStock: init.yesterdayStock || prevM.yesterdayStock,
              };
              masterRef.current = nextMaster;
              setReportRows(toRows(batch.reports));
              setMasterData(nextMaster);
              setError("");
              setSyncNote("");
              // SWR: tulis ulang cache → refresh berikutnya tampil 0 ms.
              setSwrCache("master", nextMaster);
              if (Array.isArray(batch.reports)) {
                setSwrCache("reports_" + (period || "init"), batch.reports);
                setSwrCache("reports_init", batch.reports);
              }
            }
            return;
          }
          throw new Error("Respons dashboard_init tidak sesuai format.");
        } catch (err) {
          // ponytail: cukup satu peringatan — tidak ada read_reports +
          // read_master + get_initial_form_data menyusul.
          console.warn("[init] dashboard_init gagal — memakai data lokal tersimpan:", err?.message || err);
          if (sequence === loadSequence.current) {
            if (hasLocalRef.current) {
              // Data lokal ada → status halus, bukan Alert merah.
              setSyncNote("Menampilkan data lokal. Muat ulang halaman bila ingin sinkron ulang.");
            } else {
              setError(mapApiErrorMessage(err?.message));
            }
          }
          if (isAuthErrorMessage(err?.message)) await onAuthError?.();
          return;
        } finally {
          setIsSyncing(false);
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

      const reportRes = await requestWithRetry(reportPayload);
      if (sequence === loadSequence.current) setReportRows(toRows(reportRes));

      if (sequence === loadSequence.current) setError("");
    } catch (err) {
      const friendlyMessage = mapApiErrorMessage(err.message);
      if (sequence === loadSequence.current) setError(friendlyMessage);
      if (isAuthErrorMessage(err.message)) {
        await onAuthError?.();
      }
    } finally {
      if (blocking && sequence === loadSequence.current) setLoading(false);
    }
    })();
    inflightRef.current.set(inflightKey, job);
    try {
      await job;
    } finally {
      if (inflightRef.current.get(inflightKey) === job) inflightRef.current.delete(inflightKey);
    }
  }, [onAuthError, requestWithRetry]);

  // ponytail: reloadAfterSave dihapus (B8) — create/update/delete tidak lagi
  // memicu read_reports ulang; baris optimis + patch * SISA sudah cukup.
  const createReport = useCallback(async (form) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await request({ action: "create_report", data: form });
      setMessage("Laporan berhasil disimpan.");
      setTimeout(() => setMessage(""), 5000);

      const newId = response?.["ID TRANSAKSI"] || response?.["NO TRANSAKSI"];
      // ponytail: tanpa refreshMaster — master jarang berubah, hemat 2 request berat.
      // yesterdayStock diupdate lokal dari respons agar input berikutnya tetap benar.
      const sisaPatch = extractSisaPatch(response);
      if (Object.keys(sisaPatch).length > 0) {
        setMasterData((prev) => patchYesterdayStock(prev, sisaPatch));
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
      // ponytail: tanpa reload pasca-tulis — baris optimis sudah benar
      // (respons create membawa PENGELUARAN & * SISA yang akurat).
      setSaving(false);

      return true;
    } catch (err) {
      const friendlyMessage = mapApiErrorMessage(err.message);
      setError(friendlyMessage);
      if (isAuthErrorMessage(err.message)) {
        await onAuthError?.();
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [isAdmin, onAuthError, request]);

  const updateReport = useCallback(async (id, patch) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await request({ action: "update_report", id, data: patch });
      setMessage("Data berhasil diperbarui.");
      setTimeout(() => setMessage(""), 5000);

      // ponytail: patch yesterdayStock dari key * SISA respons (tanpa refetch).
      const sisaPatch = extractSisaPatch(response);
      if (Object.keys(sisaPatch).length > 0) {
        setMasterData((prev) => patchYesterdayStock(prev, sisaPatch));
      }

      // ponytail: baris langsung tampil (optimistis) — tanpa reload pasca-tulis.
      const optimistic = toOptimisticRow({ ...patch, ...response, "ID TRANSAKSI": id }, patch?.pengeluaranList);
      if (optimistic) {
        setReportRows((prev) =>
          prev.map((r) =>
            sameTrxId(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || r.id, id) ? { ...r, ...optimistic } : r
          )
        );
      }
      setSaving(false);

      return true;
    } catch (err) {
      const friendlyMessage = mapApiErrorMessage(err.message);
      setError(friendlyMessage);
      if (isAuthErrorMessage(err.message)) {
        await onAuthError?.();
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [onAuthError, request]);

  const deleteReport = useCallback(async (id, period, rowIndex) => {
    setSaving(true);
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

      // ponytail: tanpa refreshMaster & tanpa reload pasca-hapus — baris
      // sudah difilter lokal di atas.
      setSaving(false);

      return true;
    } catch (err) {
      const friendlyMessage = mapApiErrorMessage(err.message);
      setError(friendlyMessage);
      if (isAuthErrorMessage(err.message)) {
        await onAuthError?.();
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [onAuthError, request]);

  return {
    reportRows,
    masterData,
    loading,
    isSyncing,
    syncNote,
    saving,
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
