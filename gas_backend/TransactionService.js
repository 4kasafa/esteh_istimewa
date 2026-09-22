/**
 * Layanan Transaksi: Form Data Staff, Simpan/Update Laporan Harian, Baca Laporan Transaksi
 */

function getPreviousPeriod_(period) {
  const parts = String(period || "").split("-");
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }
  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return year + "-" + String(month).padStart(2, "0");
}

function handleGetInitialFormData_(payload, session) {
  const cabangList = readActiveCabang_();
  const bahanBakuList = readActiveBahanBaku_();
  const tipePengeluaranList = readActiveTipePengeluaran_();

  const requestedCabang = sanitize_(payload.cabang || session.cabang || (cabangList[0] ? cabangList[0].NAMA_CABANG : ""));
  const yesterdayStock = {};

  try {
    const currentPeriod = sanitize_(payload.period || (payload.tanggal ? payload.tanggal.substring(0, 7) : "") || getCurrentPeriod_());
    // ponytail: baca saja — tanpa reformat tab (disinkron saat tulis/setup)
    const monthlySs = getOrCreateMonthlySpreadsheet_(currentPeriod, { skipEnsure: true });
    const transSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
    const transRows = readTable_(transSheet);

    let branchRows = transRows.filter(r => 
      String(r.CABANG || "").toLowerCase() === requestedCabang.toLowerCase()
    );

    // Jika pada bulan berjalan belum ada laporan sama sekali untuk cabang ini, cari dari bulan sebelumnya
    if (branchRows.length === 0) {
      try {
        const prevPeriod = getPreviousPeriod_(currentPeriod);
        const listSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN);
        const listFiles = readTable_(listSheet);
        const prevFile = listFiles.find(f => String(f.PERIODE || "").trim() === prevPeriod);
        if (prevFile && prevFile.SPREADSHEET_ID) {
          const prevSs = SpreadsheetApp.openById(prevFile.SPREADSHEET_ID);
          const prevTransSheet = prevSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
          if (prevTransSheet) {
            const prevRows = readTable_(prevTransSheet);
            branchRows = prevRows.filter(r => 
              String(r.CABANG || "").toLowerCase() === requestedCabang.toLowerCase()
            );
          }
        }
      } catch (prevErr) {
        console.warn("Pencarian sisa stok bulan sebelumnya:", prevErr);
      }
    }

    if (branchRows.length > 0) {
      const lastReport = branchRows[branchRows.length - 1];
      bahanBakuList.forEach(b => {
        const pfx = getBahanHeaderPrefix_(b.NAMA_BAHAN);
        const sisaVal = parseNumber_(lastReport[pfx + " SISA"]);
        yesterdayStock[b.NAMA_BAHAN] = sisaVal;
      });
    } else {
      bahanBakuList.forEach(b => {
        yesterdayStock[b.NAMA_BAHAN] = 0;
      });
    }
  } catch (err) {
    console.error("Gagal membaca stok sisa kemarin:", err);
    bahanBakuList.forEach(b => {
      yesterdayStock[b.NAMA_BAHAN] = 0;
    });
  }

  return jsonResponse_(true, {
    cabangList: cabangList,
    bahanBakuList: bahanBakuList,
    tipePengeluaranList: tipePengeluaranList,
    yesterdayStock: yesterdayStock
  }, "Form data berhasil dimuat.");
}

function handleCreateReport_(payload, session) {
  const data = payload.data || payload;
  const cabang = sanitize_(data.cabang || data.CABANG || data["ARUS DANA"] || session.cabang || "cabang_01");
  const tanggal = sanitize_(data.tanggal || data.TANGGAL || getCurrentDate_());
  const waktuInput = sanitize_(data.waktuInput || data["WAKTU INPUT"] || getCurrentTime_());
  const staff = sanitize_(session.nama || session.username);
  const keterangan = sanitize_(data.keterangan || data.KETERANGAN || "");

  // Finansial: Setoran + Total Pengeluaran = Total Penjualan
  let uangSetoran = 0;
  if (data.uangSetoran !== undefined && data.uangSetoran !== "") {
    uangSetoran = parseNumber_(data.uangSetoran);
  } else if (data["UANG SETORAN"] !== undefined && data["UANG SETORAN"] !== "") {
    uangSetoran = parseNumber_(data["UANG SETORAN"]);
  } else if (data["UANG MASUK"] !== undefined && data["UANG MASUK"] !== "") {
    uangSetoran = parseNumber_(data["UANG MASUK"]);
  }
  
  let pengeluaranList = [];
  if (Array.isArray(data.pengeluaranList)) {
    pengeluaranList = data.pengeluaranList;
  } else if (Array.isArray(data.pengeluaran)) {
    pengeluaranList = data.pengeluaran;
  }

  let totalPengeluaran = 0;
  let rincianPengeluaran = sanitize_(data.rincianPengeluaran || data["RINCIAN PENGELUARAN"] || "");

  if (pengeluaranList.length > 0) {
    totalPengeluaran = pengeluaranList.reduce((acc, curr) => acc + parseNumber_(curr.nominal), 0);
    if (!rincianPengeluaran) {
      rincianPengeluaran = pengeluaranList.map(item => {
        const nomStr = "Rp " + parseNumber_(item.nominal).toLocaleString("id-ID");
        const ketStr = item.keterangan ? " - " + item.keterangan : "";
        return "[" + item.tipe + ": " + nomStr + ketStr + "]";
      }).join(", ");
    }
  } else if (data.totalPengeluaran !== undefined && data.totalPengeluaran !== "") {
    totalPengeluaran = parseNumber_(data.totalPengeluaran);
  } else if (data["TOTAL PENGELUARAN"] !== undefined && data["TOTAL PENGELUARAN"] !== "") {
    totalPengeluaran = parseNumber_(data["TOTAL PENGELUARAN"]);
  } else if (data.PENGELUARAN !== undefined && data.PENGELUARAN !== "") {
    totalPengeluaran = parseNumber_(data.PENGELUARAN);
  }

  // ponytail: stok dihitung DULU (dulu dipakai di isPengeluaranOnly sebelum
  // dideklarasi = ReferenceError untuk payload tertentu).
  const stokBahan = data.stokBahan || {};
  const activeBahan = readActiveBahanBaku_();

  const stokFields = ["AWAL", "SISA", "TERPAKAI"];
  const usedBahan = [];
  activeBahan.forEach(b => {
    const pfx = getBahanHeaderPrefix_(b.NAMA_BAHAN);
    const itemStok = stokBahan[b.NAMA_BAHAN] || stokBahan[b.ID_BAHAN] || {};
    const hasStokEntry = [itemStok.awal, itemStok.sisa, itemStok.terpakai].some(v => v !== undefined && v !== "");
    const hasTopLevel = stokFields.some(f => data[pfx + " " + f] !== undefined && data[pfx + " " + f] !== "");
    if (hasStokEntry || hasTopLevel) {
      usedBahan.push({ bahan: b, pfx: pfx });
    }
  });

  const isPengeluaranOnly = Boolean(
    data.isPengeluaranOnly ||
    String(data["JENIS TRANSAKSI"] || "").toLowerCase() === "pengeluaran" ||
    payload.action === "create_database" ||
    (uangSetoran === 0 && !data["UANG SETORAN"] && !data["UANG MASUK"] && !data["TOTAL PENJUALAN"] && totalPengeluaran > 0 && usedBahan.length === 0)
  );

  const totalPenjualan = isPengeluaranOnly ? 0 : (uangSetoran + totalPengeluaran);

  const periode = tanggal.substring(0, 7) || getCurrentPeriod_();
  // ponytail: tulis tanpa reformat tab (skipEnsure) + tanpa full-scan tabel.
  const monthlySs = getOrCreateMonthlySpreadsheet_(periode, { skipEnsure: true });
  const transSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
  const headers = getTableHeaders_(transSheet);
  const existingIds = readIdColumnSet_(transSheet);

  let idTransaksi = sanitize_(data.id || data["ID TRANSAKSI"] || data["NO TRANSAKSI"]);
  const isLegacyId = !idTransaksi || !String(idTransaksi).toUpperCase().startsWith("TRX-") || String(idTransaksi).includes(",") || /\s/.test(String(idTransaksi).trim());
  if (isLegacyId) {
    const baseDate = tanggal ? tanggal.replace(/-/g, "") : Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyyMMdd");
    const dateStr = baseDate.length >= 8 ? baseDate.substring(0, 8) : baseDate;
    const baseId = "TRX-" + dateStr + "-";
    let uniqueCount = existingIds.size;
    let newIdStr = baseId + String(uniqueCount + 1).padStart(3, "0");
    while (existingIds.has(newIdStr.toLowerCase())) {
        uniqueCount++;
        newIdStr = baseId + String(uniqueCount + 1).padStart(3, "0");
    }
    idTransaksi = newIdStr;
  } else if (existingIds.has(idTransaksi.toLowerCase())) {
    // ponytail: idempoten — retry/abort yang dobel tidak append 2x.
    return jsonResponse_(true, {
      "ID TRANSAKSI": idTransaksi,
      "NO TRANSAKSI": idTransaksi,
      "ARUS DANA": cabang,
      "CABANG": cabang,
      "TANGGAL": tanggal
    }, "Laporan sudah tersimpan sebelumnya.");
  }

  const rowObj = {
    "ID TRANSAKSI": idTransaksi,
    "TANGGAL": tanggal,
    "WAKTU INPUT": waktuInput,
    "CABANG": cabang,
    "STAFF": staff,
    "JENIS TRANSAKSI": "Pemasukan",
    "KATEGORI": "Penjualan",
    "NOMINAL": totalPenjualan,
    "UANG SETORAN": uangSetoran,
    "KETERANGAN": keterangan
  };

  usedBahan.forEach(({ bahan, pfx }) => {
    const itemStok = stokBahan[bahan.NAMA_BAHAN] || stokBahan[bahan.ID_BAHAN] || {};

    let awal = 0;
    if (itemStok.awal !== undefined && itemStok.awal !== "") {
      awal = parseNumber_(itemStok.awal);
    } else if (data[pfx + " AWAL"] !== undefined && data[pfx + " AWAL"] !== "") {
      awal = parseNumber_(data[pfx + " AWAL"]);
    } else if (pfx === "GELAS" && data["GELAS AWAL"] !== undefined && data["GELAS AWAL"] !== "") {
      awal = parseNumber_(data["GELAS AWAL"]);
    }

    let sisa = 0;
    if (itemStok.sisa !== undefined && itemStok.sisa !== "") {
      sisa = parseNumber_(itemStok.sisa);
    } else if (data[pfx + " SISA"] !== undefined && data[pfx + " SISA"] !== "") {
      sisa = parseNumber_(data[pfx + " SISA"]);
    } else if (pfx === "GELAS" && data["GELAS SISA"] !== undefined && data["GELAS SISA"] !== "") {
      sisa = parseNumber_(data["GELAS SISA"]);
    }

    const terpakai = Math.max(0, awal - sisa);

    rowObj[pfx + " AWAL"] = awal;
    rowObj[pfx + " SISA"] = sisa;
    rowObj[pfx + " TERPAKAI"] = terpakai;
  });

  Object.keys(rowObj).forEach(key => {
    if (!headers.includes(key)) {
      headers.push(key);
      const cell = transSheet.getRange(1, headers.length);
      cell.setValue(key)
        .setBackground("#2B9348")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
    }
  });

  // ponytail: kumpulkan semua baris lalu 1x setValues per sheet —
  // ganti N appendRow satuan yang bikin submit timeout.
  const transBatch = [];
  const expBatch = [];
  if (!isPengeluaranOnly) {
    transBatch.push(rowObj);
  }

  // Catat rincian pengeluaran ke tab Pengeluaran resmi (kolom terpisah) dan tab Transaksi (formula)
  const expSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.PENGELUARAN);
  const expHeaders = expSheet ? getTableHeaders_(expSheet) : [];

  if (pengeluaranList.length > 0) {
    pengeluaranList.forEach(item => {
      const expNominal = parseNumber_(item.nominal);
      if (expNominal > 0) {
        const itemTipe = sanitize_(item.tipe || "Operasional Lain-lain");
        const itemKet = sanitize_(item.keterangan || "");

        // 1. Tulis ke tab Pengeluaran resmi: Nominal dan Keterangan terpisah rapi (termasuk kolom STAFF)
        if (expSheet) {
          expBatch.push({
            "ID_TRANSAKSI": idTransaksi,
            "TANGGAL": tanggal,
            "CABANG": cabang,
            "STAFF": staff,
            "TYPE_PENGELUARAN": itemTipe,
            "NOMINAL": expNominal,
            "KETERANGAN": itemKet
          });
        }

        // 2. Tulis ke tab Transaksi untuk kalkulasi formula Rekapitulasi
        transBatch.push({
          "ID TRANSAKSI": idTransaksi,
          "TANGGAL": tanggal,
          "WAKTU INPUT": waktuInput,
          "CABANG": cabang,
          "STAFF": staff,
          "JENIS TRANSAKSI": "Pengeluaran",
          "KATEGORI": itemTipe,
          "NOMINAL": expNominal,
          "TOTAL PENGELUARAN": expNominal,
          "PENGELUARAN": expNominal,
          "UANG KELUAR": expNominal,
          "TOTAL PENJUALAN": 0,
          "UANG SETORAN": 0,
          "KETERANGAN": itemKet
        });
      }
    });
  } else if (totalPengeluaran > 0) {
    const fallbackKet = sanitize_(keterangan || "");
    if (expSheet) {
      expBatch.push({
        "ID_TRANSAKSI": idTransaksi,
        "TANGGAL": tanggal,
        "CABANG": cabang,
        "STAFF": staff,
        "TYPE_PENGELUARAN": "Operasional Lain-lain",
        "NOMINAL": totalPengeluaran,
        "KETERANGAN": fallbackKet
      });
    }

    transBatch.push({
      "ID TRANSAKSI": idTransaksi,
      "TANGGAL": tanggal,
      "WAKTU INPUT": waktuInput,
      "CABANG": cabang,
      "STAFF": staff,
      "JENIS TRANSAKSI": "Pengeluaran",
      "KATEGORI": "Operasional Lain-lain",
      "NOMINAL": totalPengeluaran,
      "TOTAL PENGELUARAN": totalPengeluaran,
      "PENGELUARAN": totalPengeluaran,
      "UANG KELUAR": totalPengeluaran,
      "TOTAL PENJUALAN": 0,
      "UANG SETORAN": 0,
      "KETERANGAN": fallbackKet
    });
  }

  appendRowsBatch_(transSheet, headers, transBatch);
  if (expSheet) appendRowsBatch_(expSheet, expHeaders, expBatch);

  // ponytail: nilai Rekapitulasi live via SUMIFS — rebuild hanya bila ada
  // cabang/tipe baru; manual refresh_rekap tetap tersedia sebagai fallback.
  const newTipes = pengeluaranList.map(item => sanitize_(item.tipe || "Operasional Lain-lain"));
  if (newTipes.length === 0 && totalPengeluaran > 0) newTipes.push("Operasional Lain-lain");
  maybeRefreshRekapitulasi_(monthlySs, periode, cabang, newTipes);

  writeAppLog_(monthlySs, "CREATE_REPORT", session.username, cabang, "ID: " + idTransaksi, "SUCCESS");

  rowObj["NO TRANSAKSI"] = idTransaksi;
  rowObj["ARUS DANA"] = cabang;

  return jsonResponse_(true, rowObj, "Laporan berhasil disimpan.");
}

function handleUpdateReport_(payload, session) {
  const data = payload.data || payload;
  const id = sanitize_(payload.id || data.id || data["ID TRANSAKSI"] || data["NO TRANSAKSI"]);

  if (!id) {
    return jsonResponse_(false, null, "ID Laporan wajib disertakan untuk update.");
  }

  const tanggal = sanitize_(data.tanggal || data.TANGGAL || getCurrentDate_());
  const periode = tanggal.substring(0, 7) || getCurrentPeriod_();
  const monthlySs = getOrCreateMonthlySpreadsheet_(periode, { skipEnsure: true });
  const transSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
  const headers = getTableHeaders_(transSheet);
  const rows = readTable_(transSheet);

  const existing = rows.find(r => 
    String(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || "").toLowerCase() === id.toLowerCase() &&
    String(r["JENIS TRANSAKSI"] || "").toLowerCase() === "pemasukan"
  );

  if (!existing) {
    return jsonResponse_(false, null, "Laporan dengan ID " + id + " tidak ditemukan.");
  }

  const userRole = String(session.role || "").toLowerCase();
  const today = getCurrentDate_();
  const rowStaff = existing["STAFF"] || "";
  const rowTanggal = normalizeTanggal_(existing["TANGGAL"] || "");

  if (userRole === "staff") {
    if (!matchStaffName_(rowStaff, session.nama)) {
      return jsonResponse_(false, null, "Forbidden: Staff hanya dapat mengubah laporan miliknya sendiri.");
    }
    if (rowTanggal !== today) {
      return jsonResponse_(false, null, "Forbidden: Staff hanya dapat mengubah laporan tanggal hari ini.");
    }
  }

  // Finansial
  let uangSetoran = 0;
  if (data.uangSetoran !== undefined && data.uangSetoran !== "") {
    uangSetoran = parseNumber_(data.uangSetoran);
  } else if (data["UANG SETORAN"] !== undefined && data["UANG SETORAN"] !== "") {
    uangSetoran = parseNumber_(data["UANG SETORAN"]);
  } else if (existing["UANG SETORAN"] !== undefined && existing["UANG SETORAN"] !== "") {
    uangSetoran = parseNumber_(existing["UANG SETORAN"]);
  }
  
  let totalPengeluaran = 0;
  if (Array.isArray(data.pengeluaranList) && data.pengeluaranList.length > 0) {
    totalPengeluaran = data.pengeluaranList.reduce((acc, curr) => acc + parseNumber_(curr.nominal), 0);
  } else if (data.totalPengeluaran !== undefined && data.totalPengeluaran !== "") {
    totalPengeluaran = parseNumber_(data.totalPengeluaran);
  } else if (data["TOTAL PENGELUARAN"] !== undefined && data["TOTAL PENGELUARAN"] !== "") {
    totalPengeluaran = parseNumber_(data["TOTAL PENGELUARAN"]);
  } else if (data.PENGELUARAN !== undefined && data.PENGELUARAN !== "") {
    totalPengeluaran = parseNumber_(data.PENGELUARAN);
  } else if (existing["TOTAL PENGELUARAN"] !== undefined && existing["TOTAL PENGELUARAN"] !== "") {
    totalPengeluaran = parseNumber_(existing["TOTAL PENGELUARAN"]);
  }

  let rincianPengeluaran = sanitize_(data.rincianPengeluaran || data["RINCIAN PENGELUARAN"] || "");
  
  const totalPenjualan = uangSetoran + totalPengeluaran;

  const updatedObj = Object.assign({}, existing, {
    "UANG SETORAN": uangSetoran,
    "NOMINAL": totalPenjualan,
    "KETERANGAN": sanitize_(data.keterangan || data.KETERANGAN || existing.KETERANGAN || "")
  });

  const stokBahan = data.stokBahan || {};
  const activeBahan = readActiveBahanBaku_();
  const stokFields = ["AWAL", "SISA", "TERPAKAI"];

  const toUpdate = [];
  activeBahan.forEach(b => {
    const pfx = getBahanHeaderPrefix_(b.NAMA_BAHAN);
    const itemStok = stokBahan[b.NAMA_BAHAN] || stokBahan[b.ID_BAHAN] || {};
    const hasStokEntry = [itemStok.awal, itemStok.sisa, itemStok.terpakai].some(v => v !== undefined && v !== "");
    const hasTopLevel = stokFields.some(f => data[pfx + " " + f] !== undefined && data[pfx + " " + f] !== "");
    const hasExistingValue = [" AWAL", " SISA", " TERPAKAI"].some(f => existing[pfx + f] !== undefined && existing[pfx + f] !== null && existing[pfx + f] !== "");
    if (hasStokEntry || hasTopLevel || hasExistingValue) {
      toUpdate.push({ bahan: b, pfx: pfx });
    }
  });

  toUpdate.forEach(({ bahan, pfx }) => {
    const itemStok = stokBahan[bahan.NAMA_BAHAN] || stokBahan[bahan.ID_BAHAN] || {};

    let awal = 0;
    if (itemStok.awal !== undefined && itemStok.awal !== "") {
      awal = parseNumber_(itemStok.awal);
    } else if (data[pfx + " AWAL"] !== undefined && data[pfx + " AWAL"] !== "") {
      awal = parseNumber_(data[pfx + " AWAL"]);
    } else if (pfx === "GELAS" && data["GELAS AWAL"] !== undefined && data["GELAS AWAL"] !== "") {
      awal = parseNumber_(data["GELAS AWAL"]);
    } else {
      awal = parseNumber_(existing[pfx + " AWAL"] || 0);
    }

    let sisa = 0;
    if (itemStok.sisa !== undefined && itemStok.sisa !== "") {
      sisa = parseNumber_(itemStok.sisa);
    } else if (data[pfx + " SISA"] !== undefined && data[pfx + " SISA"] !== "") {
      sisa = parseNumber_(data[pfx + " SISA"]);
    } else if (pfx === "GELAS" && data["GELAS SISA"] !== undefined && data["GELAS SISA"] !== "") {
      sisa = parseNumber_(data["GELAS SISA"]);
    } else {
      sisa = parseNumber_(existing[pfx + " SISA"] || 0);
    }

    const terpakai = Math.max(0, awal - sisa);

    updatedObj[pfx + " AWAL"] = awal;
    updatedObj[pfx + " SISA"] = sisa;
    updatedObj[pfx + " TERPAKAI"] = terpakai;
  });

  Object.keys(updatedObj).forEach(key => {
    if (!headers.includes(key)) {
      headers.push(key);
      const cell = transSheet.getRange(1, headers.length);
      cell.setValue(key)
        .setBackground("#2B9348")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
    }
  });

  // Hapus semua baris pengeluaran lama dengan ID ini di tab Transaksi (dari bawah ke atas)
  const rowsToDelete = rows.filter(r => 
    String(r["ID TRANSAKSI"] || "").toLowerCase() === id.toLowerCase() && 
    String(r["JENIS TRANSAKSI"] || "").toLowerCase() === "pengeluaran"
  ).sort((a,b) => b._rowIndex - a._rowIndex);
  
  rowsToDelete.forEach(r => {
    try {
      transSheet.deleteRow(r._rowIndex);
    } catch(e){}
  });

  // Hapus juga dari tab Pengeluaran resmi
  const expSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.PENGELUARAN);
  if (expSheet && expSheet.getLastRow() > 1) {
    const expRows = readTable_(expSheet);
    const expRowsToDelete = expRows.filter(r =>
      String(r.ID_TRANSAKSI || r["ID TRANSAKSI"] || "").toLowerCase() === id.toLowerCase()
    ).sort((a, b) => b._rowIndex - a._rowIndex);

    expRowsToDelete.forEach(r => {
      try {
        expSheet.deleteRow(r._rowIndex);
      } catch (e) {}
    });
  }

  updateTableRow_(transSheet, headers, existing._rowIndex, updatedObj);

  // Re-insert pengeluaran ke tab Pengeluaran dan tab Transaksi (1x setValues per sheet)
  const expHeaders = expSheet ? getTableHeaders_(expSheet) : [];
  const pengeluaranList = data.pengeluaranList || [];
  const transBatch = [];
  const expBatch = [];
  if (pengeluaranList.length > 0) {
    pengeluaranList.forEach(item => {
      const expNominal = parseNumber_(item.nominal);
      if (expNominal > 0) {
        const itemTipe = sanitize_(item.tipe || "Operasional Lain-lain");
        const itemKet = sanitize_(item.keterangan || "");

        // 1. Tulis ke tab Pengeluaran (termasuk kolom STAFF)
        if (expSheet) {
          expBatch.push({
            "ID_TRANSAKSI": id,
            "TANGGAL": tanggal,
            "CABANG": updatedObj.CABANG,
            "STAFF": updatedObj.STAFF,
            "TYPE_PENGELUARAN": itemTipe,
            "NOMINAL": expNominal,
            "KETERANGAN": itemKet
          });
        }

        // 2. Tulis ke tab Transaksi
        transBatch.push({
          "ID TRANSAKSI": id,
          "TANGGAL": tanggal,
          "WAKTU INPUT": updatedObj["WAKTU INPUT"],
          "CABANG": updatedObj.CABANG,
          "STAFF": updatedObj.STAFF,
          "JENIS TRANSAKSI": "Pengeluaran",
          "KATEGORI": itemTipe,
          "NOMINAL": expNominal,
          "UANG SETORAN": 0,
          "KETERANGAN": itemKet
        });
      }
    });
  } else if (totalPengeluaran > 0) {
    const fallbackKet = sanitize_(data.keterangan || updatedObj.KETERANGAN || "");
    if (expSheet) {
      expBatch.push({
        "ID_TRANSAKSI": id,
        "TANGGAL": tanggal,
        "CABANG": updatedObj.CABANG,
        "STAFF": updatedObj.STAFF,
        "TYPE_PENGELUARAN": "Operasional Lain-lain",
        "NOMINAL": totalPengeluaran,
        "KETERANGAN": fallbackKet
      });
    }

    transBatch.push({
      "ID TRANSAKSI": id,
      "TANGGAL": tanggal,
      "WAKTU INPUT": updatedObj["WAKTU INPUT"],
      "CABANG": updatedObj.CABANG,
      "STAFF": updatedObj.STAFF,
      "JENIS TRANSAKSI": "Pengeluaran",
      "KATEGORI": "Operasional Lain-lain",
      "NOMINAL": totalPengeluaran,
      "UANG SETORAN": 0,
      "KETERANGAN": fallbackKet
    });
  }
  appendRowsBatch_(transSheet, headers, transBatch);
  if (expSheet) appendRowsBatch_(expSheet, expHeaders, expBatch);

  // ponytail: rebuild Rekapitulasi hanya bila ada cabang/tipe baru (nilai live via SUMIFS).
  const updatedTipes = pengeluaranList.map(item => sanitize_(item.tipe || "Operasional Lain-lain"));
  if (updatedTipes.length === 0 && totalPengeluaran > 0) updatedTipes.push("Operasional Lain-lain");
  maybeRefreshRekapitulasi_(monthlySs, periode, updatedObj.CABANG, updatedTipes);

  writeAppLog_(monthlySs, "UPDATE_REPORT", session.username, updatedObj.CABANG, "ID: " + id, "SUCCESS");

  updatedObj["NO TRANSAKSI"] = id;
  updatedObj["ARUS DANA"] = updatedObj.CABANG;

  return jsonResponse_(true, updatedObj, "Laporan berhasil diperbarui.");
}

function handleDeleteReport_(payload, session) {
  ensureAdmin_(session);

  const data = payload.data || payload;
  const id = sanitize_(payload.id || data.id || data["ID TRANSAKSI"] || data["NO TRANSAKSI"]);
  const rowIndex = parseNumber_(payload.rowIndex || data.rowIndex || data._rowIndex || 0);

  if (!id && !rowIndex) {
    return jsonResponse_(false, null, "ID Transaksi atau rowIndex wajib disertakan untuk penghapusan.");
  }

  const tanggal = sanitize_(data.tanggal || data.TANGGAL || "");
  let periode = sanitize_(payload.period || payload.periode || (tanggal ? tanggal.substring(0, 7) : "") || getCurrentPeriod_());

  const monthlySs = getOrCreateMonthlySpreadsheet_(periode);
  const transSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
  if (!transSheet) {
    return jsonResponse_(false, null, "Sheet Transaksi tidak ditemukan pada periode " + periode);
  }

  const rows = readTable_(transSheet);

  let rowsToDelete = [];
  if (id) {
    rowsToDelete = rows.filter(r => 
      String(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || "").toLowerCase() === id.toLowerCase()
    );
  }

  if (rowsToDelete.length === 0 && rowIndex > 1) {
    const targetRow = rows.find(r => r._rowIndex === rowIndex);
    if (targetRow) {
      rowsToDelete = [targetRow];
    }
  }

  if (rowsToDelete.length === 0) {
    return jsonResponse_(false, null, "Transaksi dengan ID " + (id || rowIndex) + " tidak ditemukan.");
  }

  const cabang = rowsToDelete[0].CABANG || rowsToDelete[0]["ARUS DANA"] || "Tanpa Cabang";

  // Hapus dari indeks baris terbesar ke terkecil pada tab Transaksi
  rowsToDelete
    .sort((a, b) => b._rowIndex - a._rowIndex)
    .forEach(r => {
      try {
        transSheet.deleteRow(r._rowIndex);
      } catch (e) {
        console.warn("Gagal menghapus baris " + r._rowIndex + ":", e);
      }
    });

  // Hapus baris rincian pengeluaran terkait di tab Pengeluaran
  const expSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.PENGELUARAN);
  if (expSheet && expSheet.getLastRow() > 1) {
    const expRows = readTable_(expSheet);
    const targetId = String(id || (rowsToDelete[0] && (rowsToDelete[0]["ID TRANSAKSI"] || rowsToDelete[0]["NO TRANSAKSI"])) || "").toLowerCase();
    if (targetId) {
      const expRowsToDelete = expRows.filter(r =>
        String(r.ID_TRANSAKSI || r["ID TRANSAKSI"] || "").toLowerCase() === targetId
      ).sort((a, b) => b._rowIndex - a._rowIndex);

      expRowsToDelete.forEach(r => {
        try {
          expSheet.deleteRow(r._rowIndex);
        } catch (e) {
          console.warn("Gagal menghapus baris pengeluaran " + r._rowIndex + ":", e);
        }
      });
    }
  }

  // ponytail: tanpa rebuild Rekapitulasi sinkron — refresh eksplisit via refresh_rekap.
  writeAppLog_(monthlySs, "DELETE_REPORT", session.username, cabang, "ID: " + (id || rowIndex) + " (" + rowsToDelete.length + " baris)", "SUCCESS");

  return jsonResponse_(true, { deletedId: id || rowIndex, deletedCount: rowsToDelete.length }, "Transaksi berhasil dihapus.");
}

/**
 * Normalisasi baris Transaksi mentah menjadi baris laporan siap frontend.
 * Dipakai bersama handleReadReports_ & handleDashboardInit_ agar 1x scan.
 */
function buildReportRows_(rows, session, cabangFilter, idFilter) {
  const expRows = rows.filter(r => String(r["JENIS TRANSAKSI"] || "").toLowerCase() === "pengeluaran");
  const incomeRows = rows.filter(r => String(r["JENIS TRANSAKSI"] || "").toLowerCase() !== "pengeluaran"); // Termasuk Pemasukan atau data lama yang kosong

  // Indeks pengeluaran per ID transaksi, dibangun sekali (bukan filter per baris pemasukan)
  const expByTrx = new Map();
  expRows.forEach(e => {
    const eId = String(e["ID TRANSAKSI"] || e["NO TRANSAKSI"] || "").toLowerCase();
    if (!expByTrx.has(eId)) expByTrx.set(eId, []);
    expByTrx.get(eId).push({
      tipe: e.KATEGORI || "Operasional Lain-lain",
      nominal: parseNumber_(e.NOMINAL || 0),
      keterangan: e.KETERANGAN || ""
    });
  });

  let filtered = incomeRows.map(r => {
    const trxId = String(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || "").toLowerCase();
    const pList = expByTrx.get(trxId) || [];

    // Calculate total pengeluaran and string representation
    let rowPengeluaran = parseNumber_(r["TOTAL PENGELUARAN"] || 0);
    let rowRincian = r["RINCIAN PENGELUARAN"] || "";

    if (pList.length > 0) {
      if (rowPengeluaran === 0) {
        rowPengeluaran = pList.reduce((acc, curr) => acc + curr.nominal, 0);
      }
      rowRincian = pList.map(item => {
        const nomStr = "Rp " + parseNumber_(item.nominal).toLocaleString("id-ID");
        const ketStr = item.keterangan ? " - " + item.keterangan : "";
        return "[" + item.tipe + ": " + nomStr + ketStr + "]";
      }).join(", ");
    }

    let rowPemasukan = parseNumber_(r["NOMINAL"] || r["TOTAL PENJUALAN"] || 0);

    // Normalisasi alias untuk kemudahan konsumsi frontend
    return Object.assign({}, r, {
      "NO TRANSAKSI": r["ID TRANSAKSI"] || r._rowIndex,
      "ARUS DANA": r["CABANG"] || "",
      "STAFF": r["STAFF"] || "",
      "UANG MASUK": rowPemasukan,
      "PENGELUARAN": rowPengeluaran,
      "RINCIAN PENGELUARAN": rowRincian,
      "GELAS AWAL": r["GELAS AWAL"] || 0,
      "GELAS SISA": r["GELAS SISA"] || 0,
      "GELAS LAKU": r["GELAS TERPAKAI"] || 0,
      "TIME STAMP INPUT": (r["TANGGAL"] || "") + " " + (r["WAKTU INPUT"] || ""),
      "pengeluaranList": pList
    });
  });

  if (idFilter) {
    filtered = filtered.filter(r =>
      String(r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || "").toLowerCase() === idFilter.toLowerCase()
    );
  }

  if (cabangFilter && cabangFilter.toLowerCase() !== "semua") {
    filtered = filtered.filter(r =>
      String(r.CABANG || "").toLowerCase() === cabangFilter.toLowerCase()
    );
  }

  // Jika user adalah staff, batasi laporan ke cabang tempat staff bertugas
  const userRole = String(session.role || "").toLowerCase();
  if (userRole === "staff") {
    const today = getCurrentDate_();
    filtered = filtered.filter(r => {
      const rowStaff = r["STAFF"] || "";
      const rowTanggal = normalizeTanggal_(r["TANGGAL"] || "");
      return matchStaffName_(rowStaff, session.nama) && rowTanggal === today;
    });
  }

  return filtered;
}

function handleReadReports_(payload, session) {
  const period = sanitize_(payload.period || getCurrentPeriod_());
  const cabangFilter = sanitize_(payload.cabang || payload["ARUS DANA"] || "");
  const idFilter = sanitize_(payload.id || payload["NO TRANSAKSI"] || "");
  const limit = parseInt(payload.limit, 10);
  const offset = parseInt(payload.offset, 10) || 0;

  try {
    // ponytail: baca saja — tanpa reformat tab (disinkron saat tulis/setup)
    const monthlySs = getOrCreateMonthlySpreadsheet_(period, { skipEnsure: true });
    const transSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
    // ponytail: validasi sesi (limit kecil) cukup auth lolos — tanpa scan tabel
    if (!isNaN(limit) && limit <= 1) {
      return jsonResponse_(true, [], "Sesi valid.");
    }
    const rows = readTable_(transSheet);
    let filtered = buildReportRows_(rows, session, cabangFilter, idFilter);

    // ponytail: limit/offset beneran agar filter tidak selalu kirim full 1 bulan.
    if (!isNaN(limit) && limit > 1) {
      filtered = filtered.slice(offset, offset + limit);
    } else if (offset > 0) {
      filtered = filtered.slice(offset);
    }

    return jsonResponse_(true, filtered, "Data laporan transaksi.");
  } catch (err) {
    console.error("Gagal membaca laporan bulanan:", err);
    return jsonResponse_(true, [], "Belum ada data untuk periode ini.");
  }
}

/**
 * Batch init 1 round-trip ganti 3 request serial (laporan + master + initial).
 * 1x auth + 1x open master + 1x open bulanan, tanpa backfill/tanpa fallback bulan lalu.
 */
function handleDashboardInit_(payload, session) {
  const period = sanitize_(payload.period || getCurrentPeriod_());
  const cabangFilter = sanitize_(payload.cabang || payload["ARUS DANA"] || "");
  const isAdmin = String(session.role || "").toLowerCase() === "admin";

  try {
    // ponytail: baca saja — tanpa reformat tab (disinkron saat tulis/setup)
    const monthlySs = getOrCreateMonthlySpreadsheet_(period, { skipEnsure: true });
    const transSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
    const transRows = transSheet ? readTable_(transSheet) : [];
    const reports = buildReportRows_(transRows, session, cabangFilter, "");

    const cabangSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.CABANG);
    const bahanSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.BAHAN_BAKU);
    const tipeSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN);
    const cabangRows = readTable_(cabangSheet);
    const bahanRows = readTable_(bahanSheet);
    const tipeRows = readTable_(tipeSheet);

    const cabangList = cabangRows.filter(r => {
      const st = String(r.STATUS || "").trim().toLowerCase();
      return st === "aktif" || st === "active";
    });
    const bahanBakuList = bahanRows.filter(r => String(r.NAMA_BAHAN || r.ID_BAHAN || "").trim() !== "");
    const tipePengeluaranList = tipeRows.filter(r => String(r.NAMA_TIPE || r.ID_TIPE || "").trim() !== "");

    // yesterdayStock dari scan yang sama (tanpa baca ulang / tanpa bulan lalu).
    const requestedCabang = cabangFilter && cabangFilter.toLowerCase() !== "semua"
      ? cabangFilter
      : sanitize_(session.cabang || (cabangList[0] ? cabangList[0].NAMA_CABANG : ""));
    const yesterdayStock = {};
    const branchRows = requestedCabang
      ? transRows.filter(r => String(r.CABANG || "").toLowerCase() === requestedCabang.toLowerCase())
      : [];
    if (branchRows.length > 0) {
      const lastReport = branchRows[branchRows.length - 1];
      bahanBakuList.forEach(b => {
        const pfx = getBahanHeaderPrefix_(b.NAMA_BAHAN);
        yesterdayStock[b.NAMA_BAHAN] = parseNumber_(lastReport[pfx + " SISA"]);
      });
    } else {
      bahanBakuList.forEach(b => { yesterdayStock[b.NAMA_BAHAN] = 0; });
    }

    let master = null;
    if (isAdmin) {
      const userSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.USER);
      const sumberSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN);
      const rawUsers = readTable_(userSheet);
      const users = rawUsers.map(u => {
        const rawRole = String(u.ROLE || u.role || "Staff").trim().toLowerCase();
        return {
          _rowIndex: u._rowIndex,
          ID: String(u.ID ?? u.id ?? "").trim(),
          "NAMA / USERNAME": String(u["NAMA / USERNAME"] ?? u.USERNAME ?? u.username ?? "").trim(),
          USERNAME: String(u["NAMA / USERNAME"] ?? u.USERNAME ?? u.username ?? "").trim(),
          ROLE: rawRole.includes("admin") ? "Admin" : "Staff",
          role: rawRole.includes("admin") ? "Admin" : "Staff",
          CABANG: String(u.CABANG || u.cabang || "").trim(),
          STATUS: String(u.STATUS || u.status || "Aktif").trim()
        };
      });
      master = {
        users: users,
        cabang: cabangRows,
        bahanBaku: bahanRows,
        tipePengeluaran: tipeRows,
        sumberPemasukan: readTable_(sumberSheet)
      };
    }

    return jsonResponse_(true, {
      reports: reports,
      master: master,
      initial: {
        cabangList: cabangList,
        bahanBakuList: bahanBakuList,
        tipePengeluaranList: tipePengeluaranList,
        yesterdayStock: yesterdayStock
      }
    }, "Dashboard init berhasil dimuat.");
  } catch (err) {
    console.error("Gagal dashboard init:", err);
    return jsonResponse_(true, { reports: [], master: null, initial: null }, "Belum ada data untuk periode ini.");
  }
}
