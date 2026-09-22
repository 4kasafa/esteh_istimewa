/**
 * Layanan Rekapitulasi & Summary Finansial untuk Dashboard Business Owner
 */

function handleGetSummary_(payload, session) {
  ensureAdmin_(session);
  const period = sanitize_(payload.period || getCurrentPeriod_());
  const cabangFilter = sanitize_(payload.cabang || payload["ARUS DANA"] || "");

  try {
    // ponytail: baca saja — tanpa reformat tab (disinkron saat tulis/setup)
    const monthlySs = getOrCreateMonthlySpreadsheet_(period, { skipEnsure: true });
    const transSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
    const allRows = readTable_(transSheet);

    let rows = allRows;
    if (cabangFilter && cabangFilter.toLowerCase() !== "semua") {
      rows = rows.filter(r => String(r.CABANG || "").toLowerCase() === cabangFilter.toLowerCase());
    }

    let totalPenjualan = 0;
    let totalPengeluaran = 0;
    let totalSetoran = 0;
    const bahanTerpakai = {};
    const trendMap = {};
    const cabangMap = {};

    const activeBahan = readActiveBahanBaku_();
    activeBahan.forEach(b => {
      bahanTerpakai[b.NAMA_BAHAN] = 0;
    });

    const normalizedRows = rows.map(r => {
      const isExpRow = String(r["JENIS TRANSAKSI"] || "").toLowerCase() === "pengeluaran";
      const setoran = parseNumber_(r["UANG SETORAN"]);
      const pengeluaran = parseNumber_(r["TOTAL PENGELUARAN"] || (isExpRow ? (r["NOMINAL"] || r["PENGELUARAN"] || r["UANG KELUAR"]) : 0));
      const penjualan = isExpRow ? 0 : (parseNumber_(r["TOTAL PENJUALAN"]) || (setoran + pengeluaran));
      const cabang = r.CABANG || "Tanpa Cabang";
      const tanggal = r.TANGGAL || "";

      totalSetoran += setoran;
      totalPengeluaran += pengeluaran;
      totalPenjualan += penjualan;

      activeBahan.forEach(b => {
        const pfx = getBahanHeaderPrefix_(b.NAMA_BAHAN);
        let terpakai = parseNumber_(r[pfx + " TERPAKAI"]);
        if (terpakai === 0) {
          const awal = parseNumber_(r[pfx + " AWAL"]);
          const sisa = parseNumber_(r[pfx + " SISA"]);
          if (awal > 0) {
            terpakai = Math.max(0, awal - sisa);
          } else if (pfx === "GELAS") {
            terpakai = parseNumber_(r["GELAS LAKU"]);
          }
        }
        bahanTerpakai[b.NAMA_BAHAN] = (bahanTerpakai[b.NAMA_BAHAN] || 0) + terpakai;
      });

      // Trend harian
      if (tanggal) {
        if (!trendMap[tanggal]) {
          trendMap[tanggal] = { tanggal: tanggal, penjualan: 0, pengeluaran: 0, setoran: 0 };
        }
        trendMap[tanggal].penjualan += penjualan;
        trendMap[tanggal].pengeluaran += pengeluaran;
        trendMap[tanggal].setoran += setoran;
      }

      // Per cabang
      if (!cabangMap[cabang]) {
        cabangMap[cabang] = {
          cabang: cabang,
          jumlahLaporan: 0,
          totalPenjualan: 0,
          totalPengeluaran: 0,
          totalSetoran: 0,
          gelasTerpakai: 0
        };
      }
      cabangMap[cabang].jumlahLaporan += 1;
      cabangMap[cabang].totalPenjualan += penjualan;
      cabangMap[cabang].totalPengeluaran += pengeluaran;
      cabangMap[cabang].totalSetoran += setoran;
      cabangMap[cabang].gelasTerpakai += parseNumber_(r["GELAS TERPAKAI"]);

      return Object.assign({}, r, {
        "NO TRANSAKSI": r["ID TRANSAKSI"] || r._rowIndex,
        "ARUS DANA": cabang,
        "STAFF": r["STAFF"] || "",
        "TIME STAMP INPUT": tanggal + " " + (r["WAKTU INPUT"] || ""),
        "UANG MASUK": penjualan,
        "PENGELUARAN": pengeluaran,
        "UANG KELUAR": pengeluaran,
        "UANG SETORAN": setoran,
        "GELAS LAKU": parseNumber_(r["GELAS TERPAKAI"])
      });
    });

    const perCabang = Object.keys(cabangMap).map(k => cabangMap[k]);
    const trendHarian = Object.keys(trendMap).sort().map(k => trendMap[k]);

    // Jika dipanggil dengan action 'read_database', kirimkan array rows untuk kompatibilitas DataTable
    if (String(payload.action || "").toLowerCase() === "read_database") {
      return jsonResponse_(true, normalizedRows, "Data database bulanan.");
    }

    let rekapRows = [];
    try {
      const rekapSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.REKAPITULASI);
      if (rekapSheet) rekapRows = readTable_(rekapSheet);
    } catch {
      // Abaikan jika sheet rekap tidak ada
    }

    // ponytail: tidak mengirim rows normalisasi — frontend sudah punya reportRows dari read_reports
    return jsonResponse_(true, {
      periode: period,
      kpi: {
        totalPenjualan: totalPenjualan,
        totalPengeluaran: totalPengeluaran,
        totalSetoran: totalSetoran,
        jumlahLaporan: rows.length,
        bahanTerpakai: bahanTerpakai
      },
      perCabang: perCabang,
      rekapitulasi: rekapRows,
      trendHarian: trendHarian
    }, "Data ringkasan berhasil dihitung.");
  } catch (err) {
    console.error("Gagal mendapatkan ringkasan bulanan:", err);
    if (String(payload.action || "").toLowerCase() === "read_database") {
      return jsonResponse_(true, [], "Belum ada data.");
    }
    return jsonResponse_(true, {
      periode: period,
      kpi: { totalPenjualan: 0, totalPengeluaran: 0, totalSetoran: 0, jumlahLaporan: 0, bahanTerpakai: {} },
      perCabang: [],
      trendHarian: [],
      rows: []
    }, "Data kosong.");
  }
}
