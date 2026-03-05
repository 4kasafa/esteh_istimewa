function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Input Kas - Toko Lay')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

// ============= FUNGSI DATA CABANG =============
function getDataCabang() {
  try {
    console.log("Mengambil data cabang...");
    var ss;
    try {
      ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    } catch (e) {
      console.error("Gagal membuka spreadsheet:", e.message);
      return ["Cabang 1", "Cabang 2", "Cabang 3"];
    }
    
    var sheet = ss.getSheetByName("Nama");
    if (!sheet) return ["Cabang 1", "Cabang 2", "Cabang 3"];
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 3) return ["Cabang 1", "Cabang 2", "Cabang 3"];
    
    var range = sheet.getRange(3, 5, lastRow - 2, 1);
    var values = range.getValues();
    
    var data = [];
    var seen = {};
    for (var i = 0; i < values.length; i++) {
      var value = values[i][0];
      if (value && typeof value === 'string' && value.trim() !== '') {
        var trimmed = value.trim();
        if (!seen[trimmed]) {
          data.push(trimmed);
          seen[trimmed] = true;
        }
      }
    }
    data.sort();
    return data.length === 0 ? ["Cabang 1", "Cabang 2", "Cabang 3"] : data;
  } catch (error) {
    console.error("Error getDataCabang:", error.message);
    return ["Cabang 1", "Cabang 2", "Cabang 3"];
  }
}

// ============= FUNGSI DATA KASIR =============
function getDataKasir() {
  try {
    console.log("Mengambil data kasir...");
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    var sheet = ss.getSheetByName("Nama");
    if (!sheet) return ["Kasir 1", "Kasir 2", "Kasir 3"];
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 3) return ["Kasir 1", "Kasir 2", "Kasir 3"];
    
    var range = sheet.getRange(3, 2, lastRow - 2, 1);
    var values = range.getValues();
    
    var data = [];
    var seen = {};
    for (var i = 0; i < values.length; i++) {
      var value = values[i][0];
      if (value && typeof value === 'string' && value.trim() !== '') {
        var trimmed = value.trim();
        if (!seen[trimmed]) {
          data.push(trimmed);
          seen[trimmed] = true;
        }
      }
    }
    data.sort();
    return data.length === 0 ? ["Kasir 1", "Kasir 2", "Kasir 3"] : data;
  } catch (error) {
    console.error("Error getDataKasir:", error.message);
    return ["Kasir 1", "Kasir 2", "Kasir 3"];
  }
}

// ============= FUNGSI SIMPAN DATA =============
function simpanData(d) {
  try {
    if (!d.tanggal || !d.shift || !d.cabang || !d.kasir) {
      throw new Error("Data wajib tidak lengkap");
    }
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    var tanggalTransaksi = new Date(d.tanggal);
    if (d.jam) {
      var timeParts = d.jam.split(':');
      if (timeParts.length >= 2) {
        tanggalTransaksi.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
      }
    }
    if (d.jenis === "masuk") {
      return simpanKasMasuk(d, ss, tanggalTransaksi);
    } else if (d.jenis === "keluar") {
      return simpanKasKeluar(d, ss, tanggalTransaksi);
    } else {
      throw new Error("Jenis transaksi tidak valid");
    }
  } catch (error) {
    console.error("Error simpanData:", error.message);
    return "❌ Error: " + error.message;
  }
}

function simpanKasMasuk(d, ss, tanggalTransaksi) {
  var sheetDB = ss.getSheetByName("Database");
  var sheetRincian = ss.getSheetByName("Rincian");
  if (!sheetDB || !sheetRincian) throw new Error("Sheet Database atau Rincian tidak ditemukan");
  
  var noTransaksi = generateNoTransaksi(sheetDB);
  
  var rowDataDB = [
    new Date(), noTransaksi, tanggalTransaksi, d.jam || "", d.shift, d.cabang, d.kasir, d.keterangan || "",
    parseFloat(d.penjualan) || 0, parseFloat(d.pengeluaran) || 0, parseFloat(d.subtotal) || 0, "", "", "", ""
  ];
  sheetDB.appendRow(rowDataDB);
  var newRowDB = sheetDB.getLastRow();
  sheetDB.getRange(newRowDB, 1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  sheetDB.getRange(newRowDB, 3).setNumberFormat('dddd/mmmm/yyyy');
  sheetDB.getRange(newRowDB, 9, 1, 3).setNumberFormat('#,##0');
  applyBorderToDatabaseRow(sheetDB, newRowDB);
  
  var jumlahLembar = new Array(11).fill(0);
  if (d.pecahan && Array.isArray(d.pecahan)) {
    var nominals = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    d.pecahan.forEach(function(item) {
      var index = nominals.indexOf(item.nominal);
      if (index !== -1) jumlahLembar[index] = item.jumlah || 0;
    });
  }
  
  var rowDataRincian = [
    noTransaksi, tanggalTransaksi, d.jam || "", d.shift, d.cabang, d.kasir,
    ...jumlahLembar, parseFloat(d.penjualan) || 0, parseFloat(d.pengeluaran) || 0, parseFloat(d.subtotal) || 0
  ];
  sheetRincian.appendRow(rowDataRincian);
  var newRowRincian = sheetRincian.getLastRow();
  sheetRincian.getRange(newRowRincian, 2).setNumberFormat('dd/mm/yyyy');
  sheetRincian.getRange(newRowRincian, 7, 1, 11).setNumberFormat('#,##0');
  sheetRincian.getRange(newRowRincian, 18, 1, 3).setNumberFormat('#,##0');
  applyBorderToRincianRow(sheetRincian, newRowRincian);
  
  return "✅ Kas Masuk berhasil disimpan! No. Transaksi: " + noTransaksi;
}

function simpanKasKeluar(d, ss, tanggalTransaksi) {
  var sheetDB = ss.getSheetByName("Database");
  if (!sheetDB) throw new Error("Sheet Database tidak ditemukan");
  
  var noTransaksi = generateNoTransaksi(sheetDB);
  var totalKolomN = (parseFloat(d.subtotal) || 0) + (parseFloat(d.jumlah_keluar) || 0);
  
  var rowDataDB = [
    new Date(), noTransaksi, tanggalTransaksi, d.jam || "", d.shift, d.cabang, d.kasir, d.keterangan || "",
    "", "", "", "", "", totalKolomN, ""
  ];
  sheetDB.appendRow(rowDataDB);
  var newRowDB = sheetDB.getLastRow();
  sheetDB.getRange(newRowDB, 1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  sheetDB.getRange(newRowDB, 3).setNumberFormat('dddd/mmmm/yyyy');
  sheetDB.getRange(newRowDB, 14).setNumberFormat('#,##0');
  applyBorderToDatabaseRow(sheetDB, newRowDB);
  
  return "✅ Kas Keluar berhasil disimpan! No. Transaksi: " + noTransaksi + " (Total: Rp " + totalKolomN.toLocaleString('id-ID') + ")";
}

function generateNoTransaksi(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return "LAY-000001";
  var lastNoCell = sheet.getRange(lastRow, 2).getValue();
  if (lastNoCell && lastNoCell.toString().startsWith("LAY-")) {
    var lastNo = parseInt(lastNoCell.toString().replace("LAY-", "")) || 0;
    return "LAY-" + (lastNo + 1).toString().padStart(6, '0');
  }
  return "LAY-000001";
}

// ============= BORDER HELPERS =============
function applyBorderToDatabaseRow(sheet, row) {
  var range = sheet.getRange(row, 1, 1, 15);
  range.setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
  range.setBorder(null, null, true, null, null, null, "#999999", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  if (row === 1) {
    range.setBackground("#4a86e8").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  } else {
    range.setBackground(row % 2 === 0 ? "#f9f9f9" : "#ffffff");
    sheet.getRange(row, 1).setHorizontalAlignment("left");
    sheet.getRange(row, 2, 1, 6).setHorizontalAlignment("center");
    sheet.getRange(row, 8).setHorizontalAlignment("left").setWrap(true);
    sheet.getRange(row, 9, 1, 3).setHorizontalAlignment("right");
    sheet.getRange(row, 14).setHorizontalAlignment("right");
  }
  range.setVerticalAlignment("middle");
}

function applyBorderToRincianRow(sheet, row) {
  var range = sheet.getRange(row, 1, 1, 20);
  range.setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
  range.setBorder(null, null, true, null, null, null, "#999999", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  if (row === 1) {
    range.setBackground("#3498db").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  } else {
    range.setBackground(row % 2 === 0 ? "#f0f8ff" : "#ffffff");
    sheet.getRange(row, 1, 1, 6).setHorizontalAlignment("center");
    sheet.getRange(row, 7, 1, 14).setHorizontalAlignment("right");
  }
  range.setVerticalAlignment("middle");
}

// ============= LAPORAN =============
function getLaporanData(filter) {
  try {
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    var sheetRincian = ss.getSheetByName("Rincian");
    var sheetDB = ss.getSheetByName("Database");
    if (!sheetRincian || !sheetDB) return { error: "Sheet tidak ditemukan" };
    
    var dataRincian = sheetRincian.getLastRow() > 1 ? sheetRincian.getRange(2, 1, sheetRincian.getLastRow() - 1, 20).getValues() : [];
    var dataDB = sheetDB.getLastRow() > 1 ? sheetDB.getRange(2, 1, sheetDB.getLastRow() - 1, 15).getValues() : [];
    
    var totalPenjualan = 0, totalPengeluaran = 0, totalFisik = 0;
    var rincianUang = {100000:0, 75000:0, 50000:0, 20000:0, 10000:0, 5000:0, 2000:0, 1000:0, 500:0, 200:0, 100:0};
    var countMasuk = 0;
    
    dataRincian.forEach(function(row) {
      var rowDate = Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (rowDate !== filter.tanggal) return;
      if (filter.shift && row[3] !== filter.shift) return;
      if (filter.cabang && row[4] !== filter.cabang) return;
      if (filter.kasir && row[5] !== filter.kasir) return;
      
      countMasuk++;
      totalPenjualan += parseFloat(row[17]) || 0;
      totalPengeluaran += parseFloat(row[18]) || 0;
      totalFisik += parseFloat(row[19]) || 0;
      [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100].forEach((nom, i) => rincianUang[nom] += parseFloat(row[6+i]) || 0);
    });
    
    var totalKeluar = 0, countKeluar = 0;
    dataDB.forEach(function(row) {
      var valKeluar = parseFloat(row[13]) || 0;
      if (valKeluar === 0) return;
      var rowDate = Utilities.formatDate(row[2], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (rowDate !== filter.tanggal) return;
      if (filter.shift && row[4] !== filter.shift) return;
      if (filter.cabang && row[5] !== filter.cabang) return;
      if (filter.kasir && row[6] !== filter.kasir) return;
      countKeluar++;
      totalKeluar += valKeluar;
    });
    
    if (countMasuk === 0 && countKeluar === 0) return { error: "Tidak ada data untuk filter tersebut" };
    
    return {
      tanggal: filter.tanggal, shift: filter.shift || "Semua Shift", cabang: filter.cabang || "Semua Cabang",
      kasir: filter.kasir || "Semua Kasir", totalPenjualan, totalPengeluaran, totalFisik,
      setoran: totalPenjualan - totalPengeluaran - totalFisik, rincianUang,
      countMasuk, countKeluar, totalKeluar
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ============= FUNGSI UNTUK MENERAPKAN BORDER KE SEMUA DATA YANG SUDAH ADA =============
function applyBorderToAllData() {
  try {
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    var sheetDB = ss.getSheetByName("Database");
    if (sheetDB && sheetDB.getLastRow() > 1) {
      for (var row = 2; row <= sheetDB.getLastRow(); row++) applyBorderToDatabaseRow(sheetDB, row);
    }
    var sheetRincian = ss.getSheetByName("Rincian");
    if (sheetRincian && sheetRincian.getLastRow() > 1) {
      for (var row = 2; row <= sheetRincian.getLastRow(); row++) applyBorderToRincianRow(sheetRincian, row);
    }
    return "✅ Border berhasil diterapkan ke semua data yang sudah ada!";
  } catch (error) {
    return "❌ Error: " + error.message;
  }
}

// ============= FUNGSI TEST =============
function testKoneksi() {
  try {
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    var res = "✅ Spreadsheet berhasil dibuka\n";
    ["Nama", "Database", "Rincian"].forEach(name => {
      var s = ss.getSheetByName(name);
      res += (s ? "✅ Sheet '" + name + "' ditemukan (" + s.getLastRow() + " baris)\n" : "❌ Sheet '" + name + "' tidak ditemukan\n");
    });
    return res;
  } catch (error) {
    return "❌ Error test koneksi: " + error.message;
  }
}

function testFungsi() {
  try {
    console.log("Data cabang:", getDataCabang());
    console.log("Data kasir:", getDataKasir());
    return "Test fungsi berhasil (cek log)";
  } catch (error) {
    return "❌ Error: " + error.message;
  }
}

function resetAuth() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  return "Authorization reset (triggers dihapus)";
}
