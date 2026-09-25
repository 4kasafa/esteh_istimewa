/**
 * Repository akses Master Spreadsheet dan otomasi pembuatan File Bulanan di Google Drive
 */

// ponytail: memo per eksekusi — openById/getSheetByName round-trip Drive tiap
// panggilan (6x per bootstrap). Global GAS di-reset tiap cold start jadi tidak
// basi lintas request; readTable_ sengaja TIDAK di-memo (basi setelah tulis).
let MASTER_SS_ = null;
let MASTER_SHEETS_ = null;

function getMasterSpreadsheet_() {
  if (MASTER_SS_) return MASTER_SS_;

  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      MASTER_SS_ = active;
      return MASTER_SS_;
    }
  } catch (e) {}

  if (APP_CONFIG.SPREADSHEET_ID) {
    MASTER_SS_ = SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
    return MASTER_SS_;
  }
  throw new Error("Spreadsheet ID belum diatur.");
}

function getMasterSheet_(tabName) {
  if (!MASTER_SHEETS_) MASTER_SHEETS_ = {};
  if (MASTER_SHEETS_[tabName]) return MASTER_SHEETS_[tabName];

  const ss = getMasterSpreadsheet_();
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    initMasterTabDefaults_(sheet, tabName);
  } else if (sheet.getLastRow() === 0) {
    initMasterTabDefaults_(sheet, tabName);
  }
  MASTER_SHEETS_[tabName] = sheet;
  return sheet;
}

function initMasterTabDefaults_(sheet, tabName) {
  const configs = {
    [APP_CONFIG.MASTER_TABS.USER]: {
      headers: ["ID", "NAMA / USERNAME", "NO. TELEPON", "PASSWORD", "ROLE", "STATUS"],
      color: "#2B9348",
      defaults: APP_CONFIG.DEFAULT_USERS
    },
    [APP_CONFIG.MASTER_TABS.CABANG]: {
      headers: ["ID_CABANG", "NAMA_CABANG", "ALAMAT", "STATUS"],
      color: "#1B6B93",
      defaults: APP_CONFIG.DEFAULT_CABANG
    },
    [APP_CONFIG.MASTER_TABS.BAHAN_BAKU]: {
      headers: ["ID_BAHAN", "NAMA_BAHAN", "SATUAN"],
      color: "#F6C945",
      defaults: APP_CONFIG.DEFAULT_BAHAN_BAKU
    },
    [APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN]: {
      headers: ["ID_TIPE", "NAMA_TIPE"],
      color: "#E07A5F",
      defaults: APP_CONFIG.DEFAULT_TIPE_PENGELUARAN
    },
    [APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN]: {
      headers: ["ID_SUMBER", "NAMA_SUMBER", "STATUS"],
      color: "#8E7DBE",
      defaults: APP_CONFIG.DEFAULT_SUMBER_PEMASUKAN
    },
    [APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN]: {
      headers: ["PERIODE", "SPREADSHEET_ID", "NAMA_FILE", "URL_FILE", "CREATED_AT"],
      color: "#2A9D8F",
      defaults: []
    }
  };

  const cfg = configs[tabName];
  if (!cfg) return;

  const range = sheet.getRange(1, 1, 1, cfg.headers.length);
  range.setValues([cfg.headers]);
  formatHeaderRange_(sheet, cfg.headers.length, cfg.color);
  applyOptimalColumnWidths_(sheet, cfg.headers);

  // Hapus kolom berlebih di luar skema resmi
  if (sheet.getLastColumn() > cfg.headers.length) {
    const extraCols = sheet.getLastColumn() - cfg.headers.length;
    try {
      sheet.deleteColumns(cfg.headers.length + 1, extraCols);
    } catch (colErr) {
      console.warn("Gagal menghapus kolom berlebih pada tab " + tabName, colErr);
    }
  }

  if (cfg.defaults && cfg.defaults.length > 0 && sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, cfg.defaults.length, cfg.headers.length).setValues(cfg.defaults);
  }

  // Terapkan Data Validation Dropdown
  applyMasterDataValidations_(sheet, tabName);
}

function normalizePeriod_(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, APP_CONFIG.TIMEZONE, "yyyy-MM");
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}/.test(s)) {
    return s.substring(0, 7);
  }
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
    return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, "yyyy-MM");
  }
  return s;
}

function readTable_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (!data || data.length === 0) return [];

  // Cari baris pertama yang berisi header (mengantisipasi baris 1 kosong)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(data.length, 5); i++) {
    const nonEmptyCells = data[i].filter(c => String(c).trim() !== "");
    if (nonEmptyCells.length >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = data[headerRowIndex].map(h => String(h).trim());
  const rows = [];

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const rowObj = { _rowIndex: i + 1 };
    let hasValue = false;
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      const h = headers[j];
      if (!h) continue;

      // Konversi objek Date dari Google Sheets agar string perbandingan tidak gagal
      if (val instanceof Date) {
        const hKey = normalizeHeaderKey_(h);
        const hours = val.getHours();
        const minutes = val.getMinutes();
        const seconds = val.getSeconds();

        if (hKey === "periode") {
          val = Utilities.formatDate(val, APP_CONFIG.TIMEZONE, "yyyy-MM");
        } else if (hours === 0 && minutes === 0 && seconds === 0) {
          val = Utilities.formatDate(val, APP_CONFIG.TIMEZONE, "yyyy-MM-dd");
        } else {
          val = Utilities.formatDate(val, APP_CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
        }
      }

      rowObj[h] = val;
      const upper = h.toUpperCase();
      if (rowObj[upper] === undefined) rowObj[upper] = val;
      const lower = h.toLowerCase();
      if (rowObj[lower] === undefined) rowObj[lower] = val;
      if (val !== "" && val !== null && val !== undefined) hasValue = true;
    }
    if (hasValue) rows.push(rowObj);
  }

  return rows;
}

function getTableHeaders_(sheet) {
  const data = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues();
  if (!data || data.length === 0) return [];
  return data[0].map(h => String(h).trim()).filter(Boolean);
}

function normalizeHeaderKey_(key) {
  return String(key || "").toLowerCase().replace(/[\s_\-./]/g, "");
}

function getFieldCaseInsensitive_(obj, header) {
  if (!obj) return "";
  if (Object.prototype.hasOwnProperty.call(obj, header)) return obj[header];
  const target = normalizeHeaderKey_(header);
  for (const key of Object.keys(obj)) {
    if (normalizeHeaderKey_(key) === target) {
      return obj[key];
    }
  }
  return "";
}

/**
 * ponytail: prebuild Map normalized-key → value sekali per objek + headerKeys
 * sekali per tabel, lalu lookup O(1) per sel — ganti nested loop H×K yang
 * menjalankan regex per pasangan (B10).
 */
function buildRowLookup_(obj) {
  const map = new Map();
  Object.keys(obj).forEach(k => {
    const nk = normalizeHeaderKey_(k);
    if (!map.has(nk)) map.set(nk, obj[k]); // pertahankan key pertama (sama dengan loop urut)
  });
  return map;
}

function mapRowToHeaders_(headers, headerKeys, obj) {
  const lookup = buildRowLookup_(obj);
  return headers.map((h, i) => {
    if (Object.prototype.hasOwnProperty.call(obj, h)) return obj[h];
    const v = lookup.get(headerKeys[i]);
    return v === undefined ? "" : v;
  });
}

function appendTableRow_(sheet, headers, obj) {
  sheet.appendRow(mapRowToHeaders_(headers, headers.map(normalizeHeaderKey_), obj));
  return sheet.getLastRow();
}

/**
 * ponytail: 1x setValues untuk N baris — ganti N appendRow satuan yang lambat.
 * Dipakai jalur tulis (create/update) agar submit tidak timeout.
 */
function appendRowsBatch_(sheet, headers, objs) {
  if (!sheet || !objs || objs.length === 0) return 0;
  const headerKeys = headers.map(normalizeHeaderKey_);
  const values = objs.map(obj => mapRowToHeaders_(headers, headerKeys, obj));
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
  return values.length;
}

/**
 * ponytail: baca kolom ID saja (kolom A) untuk cek duplikat/generate ID —
 * ganti full readTable_ yang makin lambat seiring tabel membesar.
 */
function readIdColumnSet_(sheet) {
  const ids = new Set();
  if (!sheet || sheet.getLastRow() <= 1) return ids;
  try {
    const vals = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    vals.forEach(v => {
      const s = String(v[0] || "").trim().toLowerCase();
      if (s) ids.add(s);
    });
  } catch (e) {}
  return ids;
}

function updateTableRow_(sheet, headers, rowIndex, obj) {
  const rowValues = mapRowToHeaders_(headers, headers.map(normalizeHeaderKey_), obj);
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
}

function deleteTableRow_(sheet, rowIndex) {
  sheet.deleteRow(rowIndex);
}

function columnIndexToLetter_(col) {
  let temp = col;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

function getBahanHeaderPrefix_(namaBahan) {
  const upper = String(namaBahan || "").toUpperCase().trim();
  if (upper === "GELAS CUP" || upper === "GELAS") {
    return "GELAS";
  }
  return upper;
}

// ponytail: cache master 5 tab (User, Cabang, Bahan Baku, Tipe Pengeluaran,
// Sumber Pemasukan) — 1 key, TTL 300 detik. Tulis lewat API selalu invalidate
// via invalidateMasterCache_(). Ceiling: edit Sheet manual (onEdit / ketikan
// tangan) baru terlihat maks 300 detik.
const MASTER_CACHE_KEY_ = "esteh_master_v1";
const MASTER_CACHE_TTL_ = 300;

function getMasterCache_() {
  try {
    return CacheService.getScriptCache();
  } catch (e) {
    return null;
  }
}

function invalidateMasterCache_() {
  const cache = getMasterCache_();
  if (!cache) return;
  try {
    cache.remove(MASTER_CACHE_KEY_);
  } catch (e) {
    console.warn("Gagal invalidate cache master:", e);
  }
}

/**
 * Snapshot 5 tab master sekali baca + sekali JSON per request.
 * readTable_ sudah konversi Date → string, jadi aman di-serialize.
 * Jalur TULIS master tetap readTable_ segar (butuh _rowIndex akurat).
 */
function readMasterSnapshot_() {
  const cache = getMasterCache_();
  if (cache) {
    try {
      const raw = cache.get(MASTER_CACHE_KEY_);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Gagal baca cache master:", e);
    }
  }

  const snap = {
    user: readTable_(getMasterSheet_(APP_CONFIG.MASTER_TABS.USER)),
    cabang: readTable_(getMasterSheet_(APP_CONFIG.MASTER_TABS.CABANG)),
    bahanBaku: readTable_(getMasterSheet_(APP_CONFIG.MASTER_TABS.BAHAN_BAKU)),
    tipePengeluaran: readTable_(getMasterSheet_(APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN)),
    sumberPemasukan: readTable_(getMasterSheet_(APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN))
  };

  if (cache) {
    try {
      cache.put(MASTER_CACHE_KEY_, JSON.stringify(snap), MASTER_CACHE_TTL_);
    } catch (e) {
      console.warn("Gagal simpan cache master:", e);
    }
  }
  return snap;
}

function readActiveBahanBaku_() {
  return readMasterSnapshot_().bahanBaku.filter(r => String(r.NAMA_BAHAN || r.ID_BAHAN || "").trim() !== "");
}

function readActiveCabang_() {
  return readMasterSnapshot_().cabang.filter(r => {
    const st = String(r.STATUS || "").trim().toLowerCase();
    return st === "aktif" || st === "active";
  });
}

function readActiveTipePengeluaran_() {
  return readMasterSnapshot_().tipePengeluaran.filter(r => String(r.NAMA_TIPE || r.ID_TIPE || "").trim() !== "");
}

const COLUMN_WIDTH_MAP = {
  // ID & Kode
  "id": 100,
  "id_cabang": 110,
  "id_bahan": 110,
  "id_tipe": 110,
  "id_sumber": 110,
  "id_transaksi": 150,
  "id transaksi": 150,
  "no transaksi": 150,
  "token": 200,

  // Tanggal & Waktu
  "tanggal": 115,
  "tgl": 160,
  "waktu input": 115,
  "timestamp": 160,
  "time stamp input": 160,
  "timestamp input": 160,
  "create_at": 160,
  "expire_at": 160,
  "created_at": 160,
  "periode": 110,

  // Cabang & User
  "cabang": 160,
  "nama_cabang": 180,
  "arus dana": 160,
  "staff": 140,
  "user": 140,
  "username": 150,
  "nama / username": 180,
  "no. telepon": 140,
  "password": 120,
  "role": 100,
  "status": 100,
  "alamat": 260,

  // Finansial & Transaksi
  "jenis transaksi": 130,
  "kategori": 160,
  "type_pengeluaran": 160,
  "tipe pengeluaran": 160,
  "nama_tipe": 180,
  "nama_sumber": 180,
  "nominal": 130,
  "uang setoran": 130,
  "uang masuk": 130,
  "uang keluar": 130,
  "total": 140,
  "total penjualan": 140,
  "total pengeluaran": 140,

  // Bahan Baku & Satuan
  "nama_bahan": 180,
  "satuan": 100,

  // Keterangan & File
  "keterangan": 240,
  "rincian pengeluaran": 240,
  "detail": 260,
  "spreadsheet_id": 220,
  "nama_file": 220,
  "url_file": 260,
  "aksi": 130
};

function applyOptimalColumnWidths_(sheet, headers) {
  if (!sheet || !headers || headers.length === 0) return;
  try {
    headers.forEach((h, idx) => {
      const col = idx + 1;
      const key = String(h || "").toLowerCase().trim();
      let width = COLUMN_WIDTH_MAP[key];

      if (!width) {
        if (key.endsWith(" awal") || key.endsWith(" sisa") || key.endsWith(" terpakai")) {
          width = 110;
        } else {
          width = Math.min(260, Math.max(100, Math.round(String(h).length * 9.5)));
        }
      }

      sheet.setColumnWidth(col, width);
    });
  } catch (err) {
    console.warn("Gagal set lebar kolom:", err);
  }
}

function formatHeaderRange_(sheet, colCount, bgColor = "#2B9348") {
  if (!sheet || colCount <= 0) return;
  const range = sheet.getRange(1, 1, 1, colCount);
  range.setBackground(bgColor)
    .setFontColor(bgColor === "#F6C945" ? "#1B3A1E" : "#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);
}

/**
 * Mendapatkan file spreadsheet bulanan. Jika belum ada, otomatis dibuat di folder yang sama dengan Master Spreadsheet.
 */
function syncMonthlyFileListRecord_(listSheet, periode, spreadsheetId, fileName, fileUrl) {
  try {
    const norm = normalizePeriod_(periode);
    const existing = readTable_(listSheet);
    const headersList = getTableHeaders_(listSheet);
    const nowStr = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    // Kunci kolom A (PERIODE) sebagai Plain Text agar Google Sheets tidak mengubahnya menjadi tipe Tanggal
    listSheet.getRange("A:A").setNumberFormat("@");

    const match = existing.find(f => normalizePeriod_(f.PERIODE) === norm);
    if (match) {
      updateTableRow_(listSheet, headersList, match._rowIndex, {
        PERIODE: "'" + norm,
        SPREADSHEET_ID: spreadsheetId,
        NAMA_FILE: fileName,
        URL_FILE: fileUrl,
        CREATED_AT: match.CREATED_AT || nowStr
      });
    } else {
      appendTableRow_(listSheet, headersList, {
        PERIODE: "'" + norm,
        SPREADSHEET_ID: spreadsheetId,
        NAMA_FILE: fileName,
        URL_FILE: fileUrl,
        CREATED_AT: nowStr
      });
    }
  } catch (err) {
    console.error("Gagal sinkronisasi List_File_Bulanan:", err);
  }
}

/**
 * Memperbarui nama cabang di SEMUA file bulanan (Transaksi + Pengeluaran) saat
 * cabang di-rename di master, lalu rebuild Rekapitulasi agar data tetap konsisten.
 * Mengembalikan ringkasan hasil per file.
 */
function syncCabangRenameToMonthlyFiles_(oldName, newName) {
  const oldKey = String(oldName || "").trim();
  const newKey = String(newName || "").trim();
  if (!oldKey || !newKey || oldKey === newKey) return "Tidak ada perubahan nama cabang.";

  const listSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN);
  let monthlyFiles = [];
  if (listSheet && listSheet.getLastRow() > 1) {
    monthlyFiles = readTable_(listSheet);
  }

  // Fallback: scan folder Drive master untuk file yang mungkin tidak terdaftar
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
              PERIODE: normalizePeriod_(fName.replace("Esteh - Laporan Bulanan ", "").trim())
            });
          }
        }
      }
    }
  } catch (errDrive) {
    console.warn("Pencarian Drive bulanan untuk rename cabang:", errDrive);
  }

  const results = [];
  monthlyFiles.forEach(mf => {
    if (!mf.SPREADSHEET_ID) return;
    try {
      const ss = SpreadsheetApp.openById(mf.SPREADSHEET_ID);
      let changed = false;

      const transSheet = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
      if (transSheet && transSheet.getLastRow() > 1) {
        changed = renameCabangInSheetColumn_(transSheet, "CABANG", oldKey, newKey) || changed;
      }

      const expSheet = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.PENGELUARAN);
      if (expSheet && expSheet.getLastRow() > 1) {
        changed = renameCabangInSheetColumn_(expSheet, "CABANG", oldKey, newKey) || changed;
      }

      if (changed) {
        const period = mf.PERIODE || getCurrentPeriod_();
        try {
          setupRekapitulasiSheet_(ss, period);
          results.push(ss.getName() + " (Transaksi+Pengeluaran diubah & Rekapitulasi diperbarui)");
        } catch (rekapErr) {
          results.push(ss.getName() + " (nama diubah, Rekapitulasi gagal: " + rekapErr.message + ")");
          console.warn("Gagal rebuild Rekapitulasi saat rename cabang:", rekapErr);
        }
      }
    } catch (errFile) {
      console.warn("Gagal rename cabang di file bulanan:", mf.SPREADSHEET_ID, errFile);
    }
  });

  return results.length > 0
    ? results.join("; ")
    : "Tidak ada file bulanan yang berisi nama cabang '" + oldKey + "'.";
}

/**
 * Mengganti nilai kolom bernama `headerName` (mis. CABANG) yang persis sama dengan
 * `oldName` menjadi `newName`. Pengembalian: true jika ada baris yang diubah.
 */
function renameCabangInSheetColumn_(sheet, headerName, oldName, newName) {
  const headers = getTableHeaders_(sheet);
  const colIdx = headers.indexOf(headerName);
  if (colIdx < 0) return false;
  const numRows = sheet.getLastRow() - 1;
  if (numRows <= 0) return false;

  const col = colIdx + 1;
  const values = sheet.getRange(2, col, numRows, 1).getValues();
  let changed = false;
  const newValues = values.map(row => {
    if (String(row[0] || "").trim() === oldName) {
      changed = true;
      return [newName];
    }
    return row;
  });
  if (changed) {
    sheet.getRange(2, col, numRows, 1).setValues(newValues);
  }
  return changed;
}

/**
 * Mendapatkan file spreadsheet bulanan.
 * Jika belum ada, otomatis dibuat di folder yang sama dengan Master Spreadsheet.
 * Dilengkapi ScriptLock dan pengecekan folder Drive agar TIDAK terjadi duplikasi file.
 */
function getOrCreateMonthlySpreadsheet_(periode, options) {
  const targetPeriod = normalizePeriod_(periode) || getCurrentPeriod_();
  const skipEnsure = Boolean(options && options.skipEnsure);

  // ponytail: jalur cepat — ID file diingat di cache sehingga request baca
  // (read_reports/get_summary/form) cukup 1x openById tanpa scan Drive + reformat.
  try {
    const idCache = CacheService.getScriptCache();
    const cachedId = idCache.get("monthly_id_" + targetPeriod);
    if (cachedId) {
      try {
        const cachedSs = SpreadsheetApp.openById(cachedId);
        if (cachedSs) return cachedSs;
      } catch (e) { /* ID basi, lanjut ke jalur lambat */ }
    }
  } catch (e) {}

  const lock = LockService.getScriptLock();

  // Kunci script hingga 30 detik untuk mencegah race-condition saat multiple request bersamaan
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    console.warn("ScriptLock timeout, continuing:", lockErr);
  }

  try {
    const listSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN);
    const existingFiles = readTable_(listSheet);

    // Langkah 1: Cek dari tab List_File_Bulanan di Master Spreadsheet
    const found = existingFiles.find(f => normalizePeriod_(f.PERIODE) === targetPeriod);
    if (found && found.SPREADSHEET_ID) {
      try {
        const ss = SpreadsheetApp.openById(found.SPREADSHEET_ID);
        if (ss) {
          rememberMonthlyId_(targetPeriod, found.SPREADSHEET_ID);
          // ponytail: path baca tidak reformat — header disinkron saat tulis/setup saja
          if (!skipEnsure) ensureMonthlyTabsExist_(ss, targetPeriod);
          return ss;
        }
      } catch (e) {
        console.warn("Spreadsheet ID di List_File_Bulanan tidak dapat dibuka, mencari di Drive:", e);
      }
    }

    // Cari folder tempat file Master berada
    const masterFile = DriveApp.getFileById(APP_CONFIG.SPREADSHEET_ID);
    const parents = masterFile.getParents();
    const folder = parents.hasNext() ? parents.next() : null;
    const targetFileName = "Esteh - Laporan Bulanan " + targetPeriod;

    // Langkah 2: Cek langsung ke Google Drive Folder (PENCEGAHAN DUPLIKASI!)
    if (folder) {
      const driveFiles = folder.getFilesByName(targetFileName);
      let bestFile = null;
      let maxRows = -1;

      // Jika sudah ada satu atau beberapa file di Drive, pilih yang memiliki data transaksi terbanyak
      while (driveFiles.hasNext()) {
        const candidate = driveFiles.next();
        try {
          const testSs = SpreadsheetApp.openById(candidate.getId());
          const testTrans = testSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
          const rowCount = testTrans ? testTrans.getLastRow() : 0;
          if (rowCount > maxRows) {
            maxRows = rowCount;
            bestFile = candidate;
          }
        } catch (e) {
          if (!bestFile) bestFile = candidate;
        }
      }

      if (bestFile) {
        const existingSs = SpreadsheetApp.openById(bestFile.getId());
        if (!skipEnsure) ensureMonthlyTabsExist_(existingSs, targetPeriod);
        syncMonthlyFileListRecord_(listSheet, targetPeriod, bestFile.getId(), targetFileName, bestFile.getUrl());
        rememberMonthlyId_(targetPeriod, bestFile.getId());
        return existingSs;
      }
    }

    // Langkah 3: Jika benar-benar belum ada di manapun, buat 1 file baru di Drive
    const newSs = SpreadsheetApp.create(targetFileName);
    const newFile = DriveApp.getFileById(newSs.getId());

    if (folder) {
      try {
        newFile.moveTo(folder);
      } catch (moveErr) {
        try {
          folder.addFile(newFile);
          DriveApp.getRootFolder().removeFile(newFile);
        } catch (addErr) {
          console.error("Gagal memindahkan file bulanan ke folder master:", addErr);
        }
      }
    }

    // 1. Tab Transaksi (gunakan sheet pertama apapun namanya untuk menghindari sheet kosong tersisa)
    const existingSheets = newSs.getSheets();
    const transSheet = existingSheets.length > 0 ? existingSheets[0] : newSs.insertSheet(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
    transSheet.setName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);

    const baseHeaders = [
      "ID TRANSAKSI",
      "TANGGAL",
      "WAKTU INPUT",
      "CABANG",
      "STAFF",
      "JENIS TRANSAKSI",
      "KATEGORI",
      "NOMINAL",
      "UANG SETORAN",
      "KETERANGAN"
    ];

    const activeBahan = readActiveBahanBaku_();
    activeBahan.forEach(b => {
      const pfx = getBahanHeaderPrefix_(b.NAMA_BAHAN);
      baseHeaders.push(pfx + " AWAL", pfx + " SISA", pfx + " TERPAKAI");
    });

    transSheet.getRange(1, 1, 1, baseHeaders.length).setValues([baseHeaders]);
    formatHeaderRange_(transSheet, baseHeaders.length, "#2B9348");
    applyOptimalColumnWidths_(transSheet, baseHeaders);
    transSheet.getRange("B:B").setNumberFormat("@");
    transSheet.getRange("H:I").setNumberFormat("Rp #,##0");

    // 3. Tab Rekapitulasi (Format standar kantor profesional, perhitungan formula otomatis)
    setupRekapitulasiSheet_(newSs, targetPeriod);

    // 4. Tab Log_Aplikasi
    const logSheet = newSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.LOG_APLIKASI) || newSs.insertSheet(APP_CONFIG.MONTHLY_TABS.LOG_APLIKASI);
    const logHeaders = ["TIMESTAMP", "AKSI", "USER", "CABANG", "DETAIL", "STATUS"];
    logSheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);
    formatHeaderRange_(logSheet, logHeaders.length, "#555555");
    applyOptimalColumnWidths_(logSheet, logHeaders);

    // Catat ke List_File_Bulanan di Master
    syncMonthlyFileListRecord_(listSheet, targetPeriod, newSs.getId(), targetFileName, newSs.getUrl());
    rememberMonthlyId_(targetPeriod, newSs.getId());

    return newSs;
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * Ingat ID file bulanan di cache agar request baca berikutnya tanpa scan Drive.
 */
function rememberMonthlyId_(periode, spreadsheetId) {
  try {
    if (!periode || !spreadsheetId) return;
    CacheService.getScriptCache().put("monthly_id_" + periode, spreadsheetId, 21600);
  } catch (e) {}
}

function writeAppLog_(monthlySs, action, user, cabang, detail, status = "SUCCESS") {
  try {
    if (!monthlySs) return;
    const logSheet = monthlySs.getSheetByName(APP_CONFIG.MONTHLY_TABS.LOG_APLIKASI);
    if (!logSheet) return;

    const headers = getTableHeaders_(logSheet);
    const nowStr = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    appendTableRow_(logSheet, headers, {
      TIMESTAMP: nowStr,
      AKSI: action,
      USER: user || "System",
      CABANG: cabang || "-",
      DETAIL: detail || "",
      STATUS: status
    });
  } catch (err) {
    console.error("Gagal mencatat log aplikasi:", err);
  }
}

/**
 * Setup format tampilan dan rumus otomatis pada Tab Rekapitulasi Laporan Bulanan
 */
function setupRekapitulasiSheet_(ss, targetPeriod) {
  try {
    const tabName = APP_CONFIG.MONTHLY_TABS.REKAPITULASI;
    let rekapSheet = ss.getSheetByName(tabName);
    if (!rekapSheet) {
      rekapSheet = ss.insertSheet(tabName);
    } else {
      rekapSheet.clear();
    }

    const parts = String(targetPeriod || "").split("-");
    const year = parseInt(parts[0], 10) || new Date().getFullYear();
    const month = parseInt(parts[1], 10) || (new Date().getMonth() + 1);
    const monthNamesIndo = [
      "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
      "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ];
    const monthName = monthNamesIndo[month - 1] || "BULAN";
    const daysInMonth = new Date(year, month, 0).getDate();

    const activeCabang = readActiveCabang_();
    const cabangList = activeCabang;
    const totalCabang = cabangList.length;
    const totalColIdx = Math.max(2, totalCabang + 2);
    const totalColLetter = columnIndexToLetter_(totalCabang > 0 ? totalCabang + 2 : 2);
    const firstCabangLetter = "B";
    const lastCabangLetter = totalCabang > 0 ? columnIndexToLetter_(totalCabang + 1) : "B";

    const uniqueTipeMap = new Map();
    try {
      const transSheet = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
      if (transSheet && transSheet.getLastRow() > 1) {
        const recorded = readTable_(transSheet);
        recorded.forEach(e => {
          if (String(e["JENIS TRANSAKSI"] || "").toLowerCase() === "pengeluaran") {
            const name = String(e.KATEGORI || "").trim();
            if (name && !uniqueTipeMap.has(name.toLowerCase())) {
              uniqueTipeMap.set(name.toLowerCase(), name);
            }
          }
        });
      }
    } catch (e) {}

    const tipeList = Array.from(uniqueTipeMap.values()).map(n => ({ NAMA_TIPE: n }));

    // 1. Header Atas: REKAP PENJUALAN BULAN [BULAN] [TAHUN]
    const titleText = "REKAP PENJUALAN BULAN " + monthName + " " + year;
    rekapSheet.getRange(1, 1).setValue(titleText);
    const titleRange = rekapSheet.getRange(1, 1, 1, Math.max(totalColIdx, 2));
    titleRange.merge()
      .setBackground("#1B4D3E")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setFontSize(12)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    rekapSheet.setRowHeight(1, 38);

    // 2. Tabel Rekap Pemasukan Header (Baris 3)
    const headerRow = ["Tgl"];
    cabangList.forEach(c => headerRow.push(c.NAMA_CABANG));
    headerRow.push("Total");

    rekapSheet.getRange(3, 1, 1, headerRow.length).setValues([headerRow]);
    const headerRange = rekapSheet.getRange(3, 1, 1, headerRow.length);
    headerRange.setBackground("#2B9348")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setFontSize(10)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    rekapSheet.setRowHeight(3, 28);

    // 3. Baris Harian 1 .. daysInMonth (Baris 4 sampai 3 + daysInMonth)
    const dailyRows = [];
    const monthStr = String(month).padStart(2, "0");
    for (let d = 1; d <= daysInMonth; d++) {
      const r = 3 + d;
      const row = [d];
      if (totalCabang > 0) {
        for (let cIdx = 0; cIdx < totalCabang; cIdx++) {
          const branchCol = columnIndexToLetter_(2 + cIdx);
          // Formula penjumlahan pemasukan cabang pada tanggal itu dari tab Transaksi (Kolom H: NOMINAL) dan JENIS TRANSAKSI = Pemasukan
          row.push(`=MAX(SUMIFS(Transaksi!$H:$H, Transaksi!$D:$D, ${branchCol}$3, Transaksi!$B:$B, "${year}-${monthStr}-" & TEXT($A${r}, "00"), Transaksi!$F:$F, "Pemasukan"), SUMIFS(Transaksi!$H:$H, Transaksi!$D:$D, ${branchCol}$3, Transaksi!$B:$B, DATE(${year}, ${month}, $A${r}), Transaksi!$F:$F, "Pemasukan"))`);
        }
        // Kolom Total menjumlahkan seluruh pemasukan cabang pada hari itu
        row.push(`=SUM(${firstCabangLetter}${r}:${lastCabangLetter}${r})`);
      } else {
        // Jika belum ada cabang di Master, kolom Total membaca langsung dari tab Transaksi jika ada transaksi
        row.push(`=MAX(SUMIFS(Transaksi!$H:$H, Transaksi!$B:$B, "${year}-${monthStr}-" & TEXT($A${r}, "00"), Transaksi!$F:$F, "Pemasukan"), SUMIFS(Transaksi!$H:$H, Transaksi!$B:$B, DATE(${year}, ${month}, $A${r}), Transaksi!$F:$F, "Pemasukan"))`);
      }
      dailyRows.push(row);
    }
    rekapSheet.getRange(4, 1, dailyRows.length, headerRow.length).setValues(dailyRows);

    // Alignment & Number format
    rekapSheet.getRange(4, 1, daysInMonth, 1).setHorizontalAlignment("center");
    rekapSheet.getRange(4, 2, daysInMonth, headerRow.length - 1)
      .setNumberFormat("Rp #,##0")
      .setHorizontalAlignment("right");

    // Alternating subtle zebra striping
    for (let d = 1; d <= daysInMonth; d++) {
      const r = 3 + d;
      const bg = (d % 2 === 0) ? "#F9FBF9" : "#FFFFFF";
      rekapSheet.getRange(r, 1, 1, headerRow.length).setBackground(bg);
    }

    // 4. Baris TOTAL PEMASUKAN
    const totalPemasukanRow = 3 + daysInMonth + 1;
    const totalPemasukanValues = ["TOTAL PEMASUKAN"];
    if (totalCabang > 0) {
      for (let cIdx = 0; cIdx < totalCabang; cIdx++) {
        const branchCol = columnIndexToLetter_(2 + cIdx);
        totalPemasukanValues.push(`=SUM(${branchCol}4:${branchCol}${totalPemasukanRow - 1})`);
      }
      totalPemasukanValues.push(`=SUM(${firstCabangLetter}${totalPemasukanRow}:${lastCabangLetter}${totalPemasukanRow})`);
    } else {
      totalPemasukanValues.push(`=SUM(B4:B${totalPemasukanRow - 1})`);
    }

    const tpRange = rekapSheet.getRange(totalPemasukanRow, 1, 1, totalPemasukanValues.length);
    tpRange.setValues([totalPemasukanValues]);
    tpRange.setBackground("#E8F5E9")
      .setFontWeight("bold")
      .setVerticalAlignment("middle")
      .setBorder(true, null, true, null, null, null, "#2B9348", SpreadsheetApp.BorderStyle.SOLID);
    rekapSheet.getRange(totalPemasukanRow, 1).setHorizontalAlignment("left");
    rekapSheet.getRange(totalPemasukanRow, 2, 1, totalPemasukanValues.length - 1)
      .setNumberFormat("Rp #,##0")
      .setHorizontalAlignment("right");
    rekapSheet.setRowHeight(totalPemasukanRow, 30);

    const totalPemasukanCell = `${totalColLetter}${totalPemasukanRow}`;

    // Border tabel pemasukan
    rekapSheet.getRange(3, 1, daysInMonth + 2, headerRow.length)
      .setBorder(true, true, true, true, true, true, "#D0D0D0", SpreadsheetApp.BorderStyle.SOLID);

    // 5. Rekap Pengeluaran Header (di bawah TOTAL PEMASUKAN)
    const pengeluaranHeaderRow = totalPemasukanRow + 2;
    rekapSheet.getRange(pengeluaranHeaderRow, 1, 1, 2).setValues([["Type Pengeluaran", "Total"]]);
    const expHeaderRange = rekapSheet.getRange(pengeluaranHeaderRow, 1, 1, 2);
    expHeaderRange.setBackground("#E07A5F")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    rekapSheet.setRowHeight(pengeluaranHeaderRow, 28);

    // Baris Type Pengeluaran: dihitung murni dari data yang ada di tab Transaksi
    const expRows = [];
    for (let tIdx = 0; tIdx < tipeList.length; tIdx++) {
      const expRowIdx = pengeluaranHeaderRow + 1 + tIdx;
      expRows.push([
        tipeList[tIdx].NAMA_TIPE,
        `=SUMIFS(Transaksi!$H:$H, Transaksi!$G:$G, A${expRowIdx}, Transaksi!$F:$F, "Pengeluaran")`
      ]);
    }

    if (expRows.length > 0) {
      rekapSheet.getRange(pengeluaranHeaderRow + 1, 1, expRows.length, 2).setValues(expRows);
      rekapSheet.getRange(pengeluaranHeaderRow + 1, 1, expRows.length, 1).setHorizontalAlignment("left");
      rekapSheet.getRange(pengeluaranHeaderRow + 1, 2, expRows.length, 1)
        .setNumberFormat("Rp #,##0")
        .setHorizontalAlignment("right");
    }

    // Baris TOTAL PENGELUARAN: jika tidak ada pengeluaran maka Rp 0, jika ada jumlahkan seluruhnya
    const totalPengeluaranRow = pengeluaranHeaderRow + 1 + expRows.length;
    const totalExpValues = [
      "TOTAL PENGELUARAN",
      expRows.length === 0
        ? '=SUMIFS(Transaksi!$H:$H, Transaksi!$F:$F, "Pengeluaran")'
        : `=SUM(B${pengeluaranHeaderRow + 1}:B${totalPengeluaranRow - 1})`
    ];
    const teRange = rekapSheet.getRange(totalPengeluaranRow, 1, 1, 2);
    teRange.setValues([totalExpValues]);
    teRange.setBackground("#FBEAE5")
      .setFontWeight("bold")
      .setVerticalAlignment("middle")
      .setBorder(true, null, true, null, null, null, "#E07A5F", SpreadsheetApp.BorderStyle.SOLID);
    rekapSheet.getRange(totalPengeluaranRow, 1).setHorizontalAlignment("left");
    rekapSheet.getRange(totalPengeluaranRow, 2).setNumberFormat("Rp #,##0").setHorizontalAlignment("right");
    rekapSheet.setRowHeight(totalPengeluaranRow, 30);

    const totalPengeluaranCell = `B${totalPengeluaranRow}`;

    // Border tabel pengeluaran
    rekapSheet.getRange(pengeluaranHeaderRow, 1, expRows.length + 2, 2)
      .setBorder(true, true, true, true, true, true, "#D0D0D0", SpreadsheetApp.BorderStyle.SOLID);

    // 6. Hasil Akhir / Saldo Bersih
    const ringkasanHeaderRow = totalPengeluaranRow + 2;
    rekapSheet.getRange(ringkasanHeaderRow, 1, 1, 2).setValues([["RINGKASAN HASIL AKHIR", ""]]);
    const rkHeaderRange = rekapSheet.getRange(ringkasanHeaderRow, 1, 1, 2);
    rkHeaderRange.merge()
      .setBackground("#1B6B93")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    rekapSheet.setRowHeight(ringkasanHeaderRow, 28);

    const summaryRows = [
      ["Total Pemasukan", `=${totalPemasukanCell}`],
      ["Total Pengeluaran", `=${totalPengeluaranCell}`],
      ["Hasil Bersih", `=B${ringkasanHeaderRow + 1}-B${ringkasanHeaderRow + 2}`]
    ];
    rekapSheet.getRange(ringkasanHeaderRow + 1, 1, summaryRows.length, 2).setValues(summaryRows);
    rekapSheet.getRange(ringkasanHeaderRow + 1, 1, summaryRows.length, 1)
      .setHorizontalAlignment("left")
      .setFontWeight("bold");
    rekapSheet.getRange(ringkasanHeaderRow + 1, 2, summaryRows.length, 1)
      .setNumberFormat("Rp #,##0")
      .setHorizontalAlignment("right")
      .setFontWeight("bold");

    // Baris Hasil Bersih Highlight
    const hasilBersihRow = ringkasanHeaderRow + 3;
    rekapSheet.getRange(hasilBersihRow, 1, 1, 2)
      .setBackground("#D1E7DD")
      .setFontSize(11)
      .setBorder(true, null, true, null, null, null, "#1B6B93", SpreadsheetApp.BorderStyle.DOUBLE);

    // Border tabel ringkasan
    rekapSheet.getRange(ringkasanHeaderRow, 1, summaryRows.length + 1, 2)
      .setBorder(true, true, true, true, true, true, "#D0D0D0", SpreadsheetApp.BorderStyle.SOLID);

    // Atur Lebar Kolom (Proporsional: Kolom 1 160px, Cabang 130px)
    rekapSheet.setColumnWidth(1, 160);
    for (let col = 2; col <= Math.max(totalColIdx, 2); col++) {
      rekapSheet.setColumnWidth(col, 130);
    }
  } catch (err) {
    console.error("Gagal setup sheet rekapitulasi:", err);
  }
}

/**
 * ponytail: nilai Rekapitulasi live via SUMIFS — rebuild penuh hanya bila
 * struktur berubah (kolom cabang baru / baris tipe baru). Cek 2 baca kecil;
 * gagal = lewati diam-diam, simpan transaksi tidak boleh gagal karenanya.
 */
function maybeRefreshRekapitulasi_(ss, period, cabangName, tipeNames) {
  try {
    if (!ss) return;
    const rekap = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.REKAPITULASI);
    if (!rekap || rekap.getLastRow() <= 1) {
      setupRekapitulasiSheet_(ss, period);
      return;
    }
    const cabangKey = String(cabangName || "").trim().toLowerCase();
    const tipes = (tipeNames || []).map(t => String(t || "").trim()).filter(Boolean);
    if (!cabangKey && tipes.length === 0) return;

    let needRebuild = false;
    if (cabangKey) {
      const headerVals = rekap.getRange(3, 1, 1, Math.max(2, rekap.getLastColumn())).getValues()[0]
        .map(v => String(v || "").trim().toLowerCase());
      if (headerVals.indexOf(cabangKey) === -1) needRebuild = true;
    }
    if (!needRebuild && tipes.length > 0) {
      const colA = rekap.getRange(1, 1, rekap.getLastRow(), 1).getValues()
        .map(r => String(r[0] || "").trim().toLowerCase());
      if (tipes.some(t => colA.indexOf(t.toLowerCase()) === -1)) needRebuild = true;
    }
    if (needRebuild) setupRekapitulasiSheet_(ss, period);
  } catch (e) {
    console.warn("Lewati refresh Rekapitulasi:", e);
  }
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

/**
 * Menyelaraskan header kolom Tab Transaksi dengan Master Bahan Baku yang sedang aktif.
 * - Kolom dasar tetap (ID, Tanggal, Cabang, Nominal, dll.)
 * - Kolom bahan baku usang yang sudah dihapus dari master akan dipangkas/dibersihkan.
 * - Kolom bahan baku baru akan ditambahkan.
 * - Data transaksi yang sudah ada dipetakan ulang tanpa kehilangan data pada bahan baku aktif.
 */
function syncMonthlyTransaksiHeaders_(transSheet) {
  if (!transSheet) return;
  try {
    const baseHeaders = [
      "ID TRANSAKSI",
      "TANGGAL",
      "WAKTU INPUT",
      "CABANG",
      "STAFF",
      "JENIS TRANSAKSI",
      "KATEGORI",
      "NOMINAL",
      "UANG SETORAN",
      "KETERANGAN"
    ];

    const activeBahan = readActiveBahanBaku_();
    const expectedHeaders = [...baseHeaders];
    activeBahan.forEach(b => {
      const pfx = getBahanHeaderPrefix_(b.NAMA_BAHAN);
      expectedHeaders.push(pfx + " AWAL", pfx + " SISA", pfx + " TERPAKAI");
    });

    const currentHeaders = getTableHeaders_(transSheet);

    // Periksa apakah ada perbedaan kolom (jumlah, nama, atau urutan)
    let needsSync = (currentHeaders.length !== expectedHeaders.length);
    if (!needsSync) {
      for (let i = 0; i < expectedHeaders.length; i++) {
        if (currentHeaders[i] !== expectedHeaders[i]) {
          needsSync = true;
          break;
        }
      }
    }

    // Selalu pastikan format header dan lebar kolom proporsional
    formatHeaderRange_(transSheet, expectedHeaders.length, "#2B9348");
    applyOptimalColumnWidths_(transSheet, expectedHeaders);
    transSheet.getRange("B:B").setNumberFormat("@");
    transSheet.getRange("H:I").setNumberFormat("Rp #,##0");

    if (!needsSync) return;

    const lastRow = transSheet.getLastRow();
    if (lastRow <= 1) {
      transSheet.clear();
      transSheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      formatHeaderRange_(transSheet, expectedHeaders.length, "#2B9348");
      applyOptimalColumnWidths_(transSheet, expectedHeaders);
      transSheet.getRange("B:B").setNumberFormat("@");
      transSheet.getRange("H:I").setNumberFormat("Rp #,##0");
      if (transSheet.getMaxColumns() > expectedHeaders.length) {
        try {
          transSheet.deleteColumns(expectedHeaders.length + 1, transSheet.getMaxColumns() - expectedHeaders.length);
        } catch (e) {}
      }
      return;
    }

    // Jika sudah ada data transaksi, baca seluruh data dan petakan ulang ke skema baru
    const existingRows = readTable_(transSheet);
    const newValues = existingRows.map(row => {
      return expectedHeaders.map(header => getFieldCaseInsensitive_(row, header));
    });

    transSheet.clear();
    transSheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    formatHeaderRange_(transSheet, expectedHeaders.length, "#2B9348");
    applyOptimalColumnWidths_(transSheet, expectedHeaders);
    transSheet.getRange("B:B").setNumberFormat("@");
    transSheet.getRange("H:I").setNumberFormat("Rp #,##0");

    if (newValues.length > 0) {
      transSheet.getRange(2, 1, newValues.length, expectedHeaders.length).setValues(newValues);
    }

    if (transSheet.getMaxColumns() > expectedHeaders.length) {
      try {
        transSheet.deleteColumns(expectedHeaders.length + 1, transSheet.getMaxColumns() - expectedHeaders.length);
      } catch (e) {}
    }
  } catch (err) {
    console.error("Gagal sinkronisasi header transaksi:", err);
  }
}

/**
 * Menyelaraskan header kolom Tab Pengeluaran agar memiliki kolom resmi:
 * ID_TRANSAKSI, TANGGAL, CABANG, STAFF, TYPE_PENGELUARAN, NOMINAL, KETERANGAN
 */
function syncMonthlyPengeluaranHeaders_(expSheet) {
  if (!expSheet) return;
  try {
    const expectedHeaders = ["ID_TRANSAKSI", "TANGGAL", "CABANG", "STAFF", "TYPE_PENGELUARAN", "NOMINAL", "KETERANGAN"];
    const currentHeaders = getTableHeaders_(expSheet);

    let needsSync = (currentHeaders.length !== expectedHeaders.length);
    if (!needsSync) {
      for (let i = 0; i < expectedHeaders.length; i++) {
        if (currentHeaders[i] !== expectedHeaders[i]) {
          needsSync = true;
          break;
        }
      }
    }

    // Selalu pastikan format header dan lebar kolom proporsional
    formatHeaderRange_(expSheet, expectedHeaders.length, "#E07A5F");
    applyOptimalColumnWidths_(expSheet, expectedHeaders);
    expSheet.getRange("B:B").setNumberFormat("@");
    expSheet.getRange("F:F").setNumberFormat("Rp #,##0");

    if (!needsSync) return;

    const lastRow = expSheet.getLastRow();
    if (lastRow <= 1) {
      expSheet.clear();
      expSheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      formatHeaderRange_(expSheet, expectedHeaders.length, "#E07A5F");
      applyOptimalColumnWidths_(expSheet, expectedHeaders);
      expSheet.getRange("B:B").setNumberFormat("@");
      expSheet.getRange("F:F").setNumberFormat("Rp #,##0");
      if (expSheet.getMaxColumns() > expectedHeaders.length) {
        try {
          expSheet.deleteColumns(expectedHeaders.length + 1, expSheet.getMaxColumns() - expectedHeaders.length);
        } catch (e) {}
      }
      return;
    }

    const existingRows = readTable_(expSheet);
    const newValues = existingRows.map(row => {
      return expectedHeaders.map(header => getFieldCaseInsensitive_(row, header));
    });

    expSheet.clear();
    expSheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    formatHeaderRange_(expSheet, expectedHeaders.length, "#E07A5F");
    applyOptimalColumnWidths_(expSheet, expectedHeaders);
    expSheet.getRange("B:B").setNumberFormat("@");
    expSheet.getRange("F:F").setNumberFormat("Rp #,##0");

    if (newValues.length > 0) {
      expSheet.getRange(2, 1, newValues.length, expectedHeaders.length).setValues(newValues);
    }

    if (expSheet.getMaxColumns() > expectedHeaders.length) {
      try {
        expSheet.deleteColumns(expectedHeaders.length + 1, expSheet.getMaxColumns() - expectedHeaders.length);
      } catch (e) {}
    }
  } catch (err) {
    console.error("Gagal sinkronisasi header pengeluaran:", err);
  }
}

/**
 * Memastikan semua tab penting di spreadsheet bulanan sudah tersedia
 */
function ensureMonthlyTabsExist_(ss, targetPeriod) {
  try {
    // 1. Pastikan Tab Transaksi ada dan header tersinkron dengan Master Bahan Baku aktif
    const transSheet = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
    if (transSheet) {
      syncMonthlyTransaksiHeaders_(transSheet);
    }

    // 2. Pastikan Tab Pengeluaran ada dan terformat (dengan kolom STAFF)
    let expSheet = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.PENGELUARAN);
    if (!expSheet) {
      expSheet = ss.insertSheet(APP_CONFIG.MONTHLY_TABS.PENGELUARAN);
      const expHeaders = ["ID_TRANSAKSI", "TANGGAL", "CABANG", "STAFF", "TYPE_PENGELUARAN", "NOMINAL", "KETERANGAN"];
      expSheet.getRange(1, 1, 1, expHeaders.length).setValues([expHeaders]);
      formatHeaderRange_(expSheet, expHeaders.length, "#E07A5F");
      expSheet.getRange("B:B").setNumberFormat("@");
      expSheet.getRange("F:F").setNumberFormat("Rp #,##0");
    } else {
      syncMonthlyPengeluaranHeaders_(expSheet);
      expSheet.getRange("B:B").setNumberFormat("@");
      expSheet.getRange("F:F").setNumberFormat("Rp #,##0");
    }

    // 3. Pastikan Tab Rekapitulasi ada, terformat, dan bersih dari hardcode lama
    const rekapSheet = ss.getSheetByName(APP_CONFIG.MONTHLY_TABS.REKAPITULASI);
    if (!rekapSheet || rekapSheet.getLastRow() <= 1) {
      setupRekapitulasiSheet_(ss, targetPeriod);
    } else {
      // Jika tab Rekapitulasi sudah ada, periksa apakah masih mengandung teks dummy hardcode lama
      try {
        const lastRow = rekapSheet.getLastRow();
        if (lastRow >= 30) {
          const sample = rekapSheet.getRange(30, 1, Math.min(25, lastRow - 29), 1).getValues().flat().join(" ");
          if (
            sample.indexOf("Beli Es Batu") !== -1 ||
            sample.indexOf("Operasional Lain-lain") !== -1 ||
            sample.indexOf("Air Galon") !== -1 ||
            sample.indexOf("Plastik / Sedotan") !== -1 ||
            sample.indexOf("(Tidak ada pengeluaran)") !== -1
          ) {
            setupRekapitulasiSheet_(ss, targetPeriod);
          }
        }
      } catch (checkErr) {
        console.warn("Pengecekan hardcode lama Rekapitulasi:", checkErr);
      }
    }
  } catch (err) {
    console.warn("Gagal memastikan tab bulanan lengkap:", err);
  }
}

/**
 * Merapikan seluruh header dan lebar kolom pada Master Spreadsheet & semua File Bulanan di Google Drive.
 * Mengatasi masalah kolom kekecilan/kebesaran agar tampil proporsional dan rapi.
 */
function formatAllSpreadsheetsStyling_() {
  const logs = [];

  // 1. Format seluruh tab di Master Spreadsheet
  try {
    const masterSs = getMasterSpreadsheet_();
    const masterTabs = [
      { name: APP_CONFIG.MASTER_TABS.USER, color: "#2B9348" },
      { name: APP_CONFIG.MASTER_TABS.CABANG, color: "#1B6B93" },
      { name: APP_CONFIG.MASTER_TABS.BAHAN_BAKU, color: "#F6C945" },
      { name: APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN, color: "#E07A5F" },
      { name: APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN, color: "#8E7DBE" },
      { name: APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN, color: "#2A9D8F" }
    ];

    masterTabs.forEach(t => {
      const sheet = masterSs.getSheetByName(t.name);
      if (sheet && sheet.getLastRow() >= 1) {
        const headers = getTableHeaders_(sheet);
        if (headers.length > 0) {
          formatHeaderRange_(sheet, headers.length, t.color);
          applyOptimalColumnWidths_(sheet, headers);
        }
      }
    });
    logs.push("Master Spreadsheet: Seluruh header dan lebar kolom berhasil dirapikan.");
  } catch (errMaster) {
    console.warn("Gagal merapikan Master Spreadsheet:", errMaster);
    logs.push("Gagal merapikan Master: " + errMaster.message);
  }

  // 2. Format seluruh file bulanan
  try {
    const listSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.LIST_FILE_BULANAN);
    let monthlyFiles = [];
    if (listSheet && listSheet.getLastRow() > 1) {
      monthlyFiles = readTable_(listSheet);
    }

    monthlyFiles.forEach(mf => {
      if (!mf.SPREADSHEET_ID) return;
      try {
        const mSs = SpreadsheetApp.openById(mf.SPREADSHEET_ID);
        const period = mf.PERIODE || getCurrentPeriod_();
        ensureMonthlyTabsExist_(mSs, period);
        logs.push(`${mSs.getName()}: Header dan kolom bulanan berhasil dirapikan.`);
      } catch (errFile) {
        logs.push(`Error file ${mf.SPREADSHEET_ID}: ${errFile.message}`);
      }
    });
  } catch (errMonthly) {
    console.warn("Gagal merapikan file bulanan:", errMonthly);
  }

  return logs.join("\n");
}

