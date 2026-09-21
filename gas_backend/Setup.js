/**
 * Script 1-klik untuk inisialisasi Master Spreadsheet
 * Jalankan fungsi setupMasterSpreadsheet() di Script Editor Apps Script jika spreadsheet baru disiapkan.
 */

function setupMasterSpreadsheet() {
  const ss = SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);

  const tabsSetup = [
    {
      name: APP_CONFIG.MASTER_TABS.USER,
      headers: ["ID", "NAMA / USERNAME", "NO. TELEPON", "PASSWORD", "ROLE", "STATUS"],
      color: "#2B9348",
      defaults: APP_CONFIG.DEFAULT_USERS
    },
    {
      name: APP_CONFIG.MASTER_TABS.CABANG,
      headers: ["ID_CABANG", "NAMA_CABANG", "ALAMAT", "STATUS"],
      color: "#1B6B93",
      defaults: APP_CONFIG.DEFAULT_CABANG
    },
    {
      name: APP_CONFIG.MASTER_TABS.BAHAN_BAKU,
      headers: ["ID_BAHAN", "NAMA_BAHAN", "SATUAN"],
      color: "#F6C945",
      defaults: APP_CONFIG.DEFAULT_BAHAN_BAKU
    },
    {
      name: APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN,
      headers: ["ID_TIPE", "NAMA_TIPE"],
      color: "#E07A5F",
      defaults: APP_CONFIG.DEFAULT_TIPE_PENGELUARAN
    },
    {
      name: APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN,
      headers: ["ID_SUMBER", "NAMA_SUMBER", "STATUS"],
      color: "#8E7DBE",
      defaults: APP_CONFIG.DEFAULT_SUMBER_PEMASUKAN
    },
    {
      name: APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN,
      headers: ["PERIODE", "SPREADSHEET_ID", "NAMA_FILE", "URL_FILE", "CREATED_AT"],
      color: "#2A9D8F",
      defaults: []
    },
    {
      name: APP_CONFIG.MASTER_TABS.SESSIONS,
      headers: ["TOKEN", "USERNAME", "ROLE", "CREATE_AT", "EXPIRE_AT", "STATUS"],
      color: "#4E8098",
      defaults: []
    }
  ];

  tabsSetup.forEach(t => {
    let sheet = ss.getSheetByName(t.name);
    if (!sheet) {
      sheet = ss.insertSheet(t.name);
    }

    // Set Header & Format Proporsional
    const range = sheet.getRange(1, 1, 1, t.headers.length);
    range.setValues([t.headers]);
    formatHeaderRange_(sheet, t.headers.length, t.color);
    applyOptimalColumnWidths_(sheet, t.headers);

    // Hapus kolom berlebih di luar skema resmi jika sheet pernah dibuat sebelumnya
    if (sheet.getLastColumn() > t.headers.length) {
      const extraCols = sheet.getLastColumn() - t.headers.length;
      try {
        sheet.deleteColumns(t.headers.length + 1, extraCols);
      } catch (colErr) {
        console.warn("Gagal menghapus kolom berlebih pada tab " + t.name, colErr);
      }
    }

    // Isi Default Data jika sheet masih kosong (hanya ada header)
    if (t.defaults && t.defaults.length > 0 && sheet.getLastRow() <= 1) {
      sheet.getRange(2, 1, t.defaults.length, t.headers.length).setValues(t.defaults);
    }

    // Terapkan Data Validation Dropdown
    applyMasterDataValidations_(sheet, t.name);
  });

  // Hapus "Sheet1" default jika ada dan bukan salah satu tab di atas
  const sheet1 = ss.getSheetByName("Sheet1");
  if (sheet1 && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(sheet1);
    } catch {
      // Abaikan jika tidak bisa dihapus
    }
  }

  // Otomatis buat / pastikan file spreadsheet bulanan bulan ini ada di Google Drive dan tercatat di List_File_Bulanan
  let monthlyInfo = "";
  try {
    const curPeriod = getCurrentPeriod_();
    const monthlySs = getOrCreateMonthlySpreadsheet_(curPeriod);
    setupRekapitulasiSheet_(monthlySs, curPeriod);
    monthlyInfo = "\nFile Bulanan siap: " + monthlySs.getName() + " (" + monthlySs.getUrl() + ")";
  } catch (errMonthly) {
    console.warn("Gagal inisialisasi file bulanan saat setup:", errMonthly);
  }

  return "Master Spreadsheet berhasil diinisialisasi lengkap dengan 7 tab!" + monthlyInfo;
}

/**
 * Fungsi 1-klik untuk langsung membuat / mengupdate file spreadsheet bulanan bulan ini (atau periode tertentu)
 * Dapat dijalankan langsung dari Script Editor Google Apps Script: pilih fungsi 'createMonthlySpreadsheet' lalu klik Run.
 */
function createMonthlySpreadsheet(periode) {
  const targetPeriod = periode || getCurrentPeriod_();
  const ss = getOrCreateMonthlySpreadsheet_(targetPeriod);
  setupRekapitulasiSheet_(ss, targetPeriod);
  return "File spreadsheet bulanan berhasil disiapkan dan Rekapitulasi diperbarui:\nNama: " + ss.getName() + "\nURL: " + ss.getUrl();
}

/**
 * Fungsi khusus untuk me-refresh tab Rekapitulasi murni dari tab Pengeluaran tanpa data hardcode
 */
function refreshRekapitulasi(periode) {
  const targetPeriod = periode || getCurrentPeriod_();
  const ss = getOrCreateMonthlySpreadsheet_(targetPeriod);
  setupRekapitulasiSheet_(ss, targetPeriod);
  return "Tab Rekapitulasi periode " + targetPeriod + " berhasil di-refresh 100% mengikuti tab Pengeluaran!";
}

/**
 * Fungsi untuk membersihkan file bulanan ganda/duplikat di Google Drive
 * - Mencari seluruh file "Esteh - Laporan Bulanan YYYY-MM" di folder master
 * - Menyimpan 1 file utama yang memiliki baris transaksi terbanyak atau paling update
 * - Memindahkan seluruh file duplikat kosong ke Sampah (Trash)
 * - Menyelaraskan tab List_File_Bulanan di Master Spreadsheet
 */
function cleanupDuplicateMonthlySpreadsheets() {
  const masterFile = DriveApp.getFileById(APP_CONFIG.SPREADSHEET_ID);
  const parents = masterFile.getParents();
  if (!parents.hasNext()) return "Folder master tidak ditemukan.";
  const folder = parents.next();

  const files = folder.getFiles();
  const monthlyFilesMap = {};

  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    if (name.startsWith("Esteh - Laporan Bulanan ")) {
      const periode = normalizePeriod_(name.replace("Esteh - Laporan Bulanan ", "").trim());
      if (!monthlyFilesMap[periode]) {
        monthlyFilesMap[periode] = [];
      }
      monthlyFilesMap[periode].push(f);
    }
  }

  const results = [];
  const listSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN);
  listSheet.getRange("A:A").setNumberFormat("@");

  Object.keys(monthlyFilesMap).forEach(periode => {
    const fileList = monthlyFilesMap[periode];
    if (fileList.length <= 1) {
      if (fileList.length === 1) {
        syncMonthlyFileListRecord_(listSheet, periode, fileList[0].getId(), fileList[0].getName(), fileList[0].getUrl());
      }
      return;
    }

    // Cari file yang berisi transaksi terbanyak
    let candidates = [];
    fileList.forEach(file => {
      let rowCount = 0;
      try {
        const ss = SpreadsheetApp.openById(file.getId());
        const tSheet = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
        if (tSheet) {
          rowCount = tSheet.getLastRow();
        }
      } catch (e) {
        rowCount = 0;
      }
      candidates.push({ file: file, rows: rowCount, modified: file.getLastUpdated() });
    });

    // Urutkan berdasarkan baris terbanyak, lalu tanggal modifikasi terbaru
    candidates.sort((a, b) => b.rows - a.rows || b.modified.getTime() - a.modified.getTime());
    const bestFile = candidates[0].file;

    // Pindahkan duplikat lainnya ke Sampah (Trash)
    let trashedCount = 0;
    for (let i = 1; i < candidates.length; i++) {
      try {
        candidates[i].file.setTrashed(true);
        trashedCount++;
      } catch (e) {
        console.error("Gagal memindahkan file ke trash:", e);
      }
    }

    syncMonthlyFileListRecord_(listSheet, periode, bestFile.getId(), bestFile.getName(), bestFile.getUrl());
    results.push(`Periode ${periode}: Berhasil mempertahankan 1 file utama (${bestFile.getName()}) dan membersihkan ${trashedCount} file duplikat kosong ke Sampah.`);
  });

  return results.length > 0 ? results.join("\n") : "Tidak ada file duplikat ditemukan. Folder Drive sudah rapi!";
}

/**
 * Fungsi Pembersih Total (Wipe & Reset):
 * Menghapus seluruh data hardcode/dummy di Master Spreadsheet & Seluruh File Bulanan
 * - Tab User di Master: Menyisakan HANYA 1 akun Admin bawaan (Admin / admin)
 * - Tab Cabang, Bahan_Baku, Tipe_Pengeluaran, Sumber_Pemasukan, Sessions di Master: Bersih total (tersisa header resmi)
 * - Seluruh File Bulanan di Drive (Transaksi, Pengeluaran, Log_Aplikasi): Bersih total (tersisa header resmi)
 * - Tab Rekapitulasi: Dibersihkan total dan dirender ulang MURNI tanpa kategori hardcode apapun!
 */
function resetAndCleanAllSheets() {
  const ss = SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
  const logs = [];

  // 1. Bersihkan Tab-tab Master Spreadsheet
  const masterCleanTargets = [
    {
      tab: APP_CONFIG.MASTER_TABS.USER,
      keepData: [["USR-001", "Admin", "-", "admin", "Admin", "Aktif"]]
    },
    { tab: APP_CONFIG.MASTER_TABS.CABANG, keepData: null },
    { tab: APP_CONFIG.MASTER_TABS.BAHAN_BAKU, keepData: null },
    { tab: APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN, keepData: null },
    { tab: APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN, keepData: null },
    { tab: APP_CONFIG.MASTER_TABS.SESSIONS, keepData: null }
  ];

  masterCleanTargets.forEach(target => {
    const sheet = ss.getSheetByName(target.tab);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      const maxCols = Math.max(sheet.getLastColumn(), 10);
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, maxCols).clearContent().clearFormat();
      }
      if (target.keepData && target.keepData.length > 0) {
        sheet.getRange(2, 1, target.keepData.length, target.keepData[0].length).setValues(target.keepData);
      }
      applyMasterDataValidations_(sheet, target.tab);
      logs.push(`Tab Master '${target.tab}' berhasil dibersihkan.`);
    }
  });

  // 2. Bersihkan Seluruh File Spreadsheet Bulanan di Google Drive
  const listSheet = ss.getSheetByName(APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN);
  let monthlyFiles = [];
  if (listSheet && listSheet.getLastRow() > 1) {
    monthlyFiles = readTable_(listSheet);
  }

  try {
    const masterFile = DriveApp.getFileById(APP_CONFIG.SPREADSHEET_ID);
    const parents = masterFile.getParents();
    if (parents.hasNext()) {
      const folder = parents.next();
      const files = folder.getFiles();
      while (files.hasNext()) {
        const f = files.next();
        const fName = f.getName();
        if (fName.startsWith("Esteh - Laporan Bulanan ")) {
          if (!monthlyFiles.some(m => m.SPREADSHEET_ID === f.getId())) {
            monthlyFiles.push({
              SPREADSHEET_ID: f.getId(),
              NAMA_FILE: fName,
              PERIODE: normalizePeriod_(fName.replace("Esteh - Laporan Bulanan ", "").trim())
            });
          }
        }
      }
    }
  } catch (errDrive) {
    console.warn("Pencarian Drive bulanan:", errDrive);
  }

  // Jika belum ada file bulanan di daftar, pastikan bulan ini diproses
  const curPeriod = getCurrentPeriod_();
  if (monthlyFiles.length === 0) {
    const curSs = getOrCreateMonthlySpreadsheet_(curPeriod);
    monthlyFiles.push({
      SPREADSHEET_ID: curSs.getId(),
      NAMA_FILE: curSs.getName(),
      PERIODE: curPeriod
    });
  }

  monthlyFiles.forEach(mf => {
    if (!mf.SPREADSHEET_ID) return;
    try {
      const mSs = SpreadsheetApp.openById(mf.SPREADSHEET_ID);
      const period = mf.PERIODE || curPeriod;

      // Bersihkan Tab Transaksi dan sinkronkan header ke master aktif
      const tSheet = mSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
      if (tSheet) {
        if (tSheet.getLastRow() > 1) {
          tSheet.getRange(2, 1, tSheet.getLastRow() - 1, tSheet.getLastColumn()).clearContent().clearFormat();
        }
        syncMonthlyTransaksiHeaders_(tSheet);
      }

      // Bersihkan Tab Pengeluaran dan sinkronkan header resmi
      const expSheet = mSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.PENGELUARAN);
      if (expSheet) {
        if (expSheet.getLastRow() > 1) {
          expSheet.getRange(2, 1, expSheet.getLastRow() - 1, expSheet.getLastColumn()).clearContent().clearFormat();
        }
        syncMonthlyPengeluaranHeaders_(expSheet);
      }

      // Bersihkan Tab Log_Aplikasi
      const logSheet = mSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.LOG_APLIKASI);
      if (logSheet && logSheet.getLastRow() > 1) {
        logSheet.getRange(2, 1, logSheet.getLastRow() - 1, logSheet.getLastColumn()).clearContent().clearFormat();
      }

      // Rebuild Tab Rekapitulasi: 100% bersih tanpa data dummy!
      setupRekapitulasiSheet_(mSs, period);
      logs.push(`File Bulanan '${mSs.getName()}' berhasil dibersihkan & Rekapitulasi di-reset total.`);
    } catch (errCleanMonthly) {
      logs.push(`Peringatan file ${mf.SPREADSHEET_ID}: ${errCleanMonthly.message}`);
    }
  });

  return logs.join("\n");
}

/**
 * Sinkronisasi seluruh file bulanan di Google Drive:
 * 1. Menyelaraskan header Transaksi dengan Master Bahan Baku aktif (memangkas kolom usang)
 * 2. Memastikan seluruh item pengeluaran tercatat di tab Pengeluaran dengan kolom terpisah (termasuk kolom STAFF)
 * 3. Membangun ulang tab Rekapitulasi
 */
function syncAndMigrateMonthlySheets() {
  const masterFile = DriveApp.getFileById(APP_CONFIG.SPREADSHEET_ID);
  const parents = masterFile.getParents();
  if (!parents.hasNext()) return "Folder master tidak ditemukan.";
  const folder = parents.next();

  const listSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN);
  let monthlyFiles = [];
  if (listSheet && listSheet.getLastRow() > 1) {
    monthlyFiles = readTable_(listSheet);
  }

  // Scan Drive folder untuk menemukan file yang belum terdaftar
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    if (name.startsWith("Esteh - Laporan Bulanan ")) {
      if (!monthlyFiles.some(m => m.SPREADSHEET_ID === f.getId())) {
        monthlyFiles.push({
          SPREADSHEET_ID: f.getId(),
          NAMA_FILE: name,
          PERIODE: normalizePeriod_(name.replace("Esteh - Laporan Bulanan ", "").trim())
        });
      }
    }
  }

  const logs = [];

  monthlyFiles.forEach(mf => {
    if (!mf.SPREADSHEET_ID) return;
    try {
      const ss = SpreadsheetApp.openById(mf.SPREADSHEET_ID);
      const period = mf.PERIODE || getCurrentPeriod_();

      // 1. Pastikan seluruh tab penting ada dan terformat
      ensureMonthlyTabsExist_(ss, period);

      // 2. Selaraskan header kolom tab Transaksi dengan master Bahan Baku aktif
      const transSheet = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
      if (transSheet) {
        syncMonthlyTransaksiHeaders_(transSheet);
      }

      // 3. Selaraskan header tab Pengeluaran & migrasi data jika masih kosong
      const expSheet = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.PENGELUARAN);
      if (expSheet) {
        syncMonthlyPengeluaranHeaders_(expSheet);
      }

      if (expSheet && transSheet && expSheet.getLastRow() <= 1 && transSheet.getLastRow() > 1) {
        const transRows = readTable_(transSheet);
        const expHeaders = getTableHeaders_(expSheet);
        let migratedCount = 0;

        transRows.forEach(r => {
          if (String(r["JENIS TRANSAKSI"] || "").toLowerCase() === "pengeluaran") {
            const nom = parseNumber_(r.NOMINAL);
            if (nom > 0) {
              appendTableRow_(expSheet, expHeaders, {
                "ID_TRANSAKSI": r["ID TRANSAKSI"] || r["NO TRANSAKSI"] || "",
                "TANGGAL": r.TANGGAL || "",
                "CABANG": r.CABANG || "",
                "STAFF": r.STAFF || "",
                "TYPE_PENGELUARAN": r.KATEGORI || "Operasional Lain-lain",
                "NOMINAL": nom,
                "KETERANGAN": r.KETERANGAN || ""
              });
              migratedCount++;
            }
          }
        });
        if (migratedCount > 0) {
          logs.push(`${ss.getName()}: Berhasil memigrasi ${migratedCount} item ke tab Pengeluaran.`);
        }
      }

      // 4. Bangun ulang tab Rekapitulasi
      setupRekapitulasiSheet_(ss, period);
      logs.push(`${ss.getName()}: Header Transaksi, Pengeluaran & Rekapitulasi tersinkronisasi.`);
    } catch (err) {
      logs.push(`Error file ${mf.SPREADSHEET_ID}: ${err.message}`);
    }
  });

  // 5. Pastikan Master Spreadsheet juga rapi
  try {
    formatAllSpreadsheetsStyling_();
    logs.push("Seluruh styling header dan lebar kolom telah dirapikan.");
  } catch (eStyling) {}

  return logs.join("\n");
}

/**
 * Fungsi 1-klik untuk merapikan seluruh header dan proporsi kolom di semua sheet (Master + Bulanan)
 * Dapat dijalankan langsung dari Script Editor Apps Script: pilih 'fixAllHeadersAndColumnWidths' lalu Run.
 */
function fixAllHeadersAndColumnWidths() {
  return formatAllSpreadsheetsStyling_();
}

/**
 * Terapkan aturan Data Validation Dropdown pada tab master
 */
function applyMasterDataValidations_(sheet, tabName) {
  try {
    const numRows = Math.max(100, sheet.getMaxRows() - 1);

    const roleRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Admin", "Staff"], true)
      .setAllowInvalid(false)
      .build();

    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Aktif", "Non Aktif"], true)
      .setAllowInvalid(false)
      .build();

    if (tabName === APP_CONFIG.MASTER_TABS.USER) {
      // Role di kolom 5, Status di kolom 6
      sheet.getRange(2, 5, numRows, 1).setDataValidation(roleRule);
      sheet.getRange(2, 6, numRows, 1).setDataValidation(statusRule);
    } else if (tabName === APP_CONFIG.MASTER_TABS.CABANG) {
      // Status di kolom 4
      sheet.getRange(2, 4, numRows, 1).setDataValidation(statusRule);
    } else if (tabName === APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN) {
      // Status di kolom 3
      sheet.getRange(2, 3, numRows, 1).setDataValidation(statusRule);
    }
  } catch (err) {
    console.warn("Gagal menerapkan data validation:", err);
  }
}

