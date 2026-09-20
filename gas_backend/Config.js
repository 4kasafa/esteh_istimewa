const APP_CONFIG = {
  // Spreadsheet ID Master Utama (Google Sheets)
  SPREADSHEET_ID: "1QLEe3-x8iQwHeBjf8m8Kkb7Yx9g2tAilwGOAjWIZJ0k",
  
  TIMEZONE: "Asia/Jakarta",
  HEADER_ROW: 1,
  SESSION_RETENTION_DAYS: 7,
  CACHE_TTL_SECONDS: 21600, // 6 jam (maksimal CacheService di Google Apps Script)
  CACHE_PREFIX: "esteh_sess_",
  CACHE_USER_PREFIX: "esteh_user_",

  // Tab Master di Master Spreadsheet
  MASTER_TABS: {
    USER: "User",
    CABANG: "Cabang",
    BAHAN_BAKU: "Bahan_Baku",
    TIPE_PENGELUARAN: "Tipe_Pengeluaran",
    SUMBER_PEMASUKAN: "Sumber_Pemasukan",
    LIST_FILE_BULANAN: "List_File_Bulanan",
    SESSIONS: "Sessions"
  },

  // Tab di Spreadsheet Bulanan
  MONTHLY_TABS: {
    TRANSAKSI: "Transaksi",
    PENGELUARAN: "Pengeluaran",
    REKAPITULASI: "Rekapitulasi",
    LOG_APLIKASI: "Log_Aplikasi"
  },

  // Default Master Data untuk Inisialisasi (Setup.js)
  // Tab User: ID, NAMA / USERNAME, NO. TELEPON, PASSWORD, ROLE, STATUS
  // Hanya 1 akun Admin bawaan untuk akses awal sistem, tanpa data dummy staff
  DEFAULT_USERS: [
    ["USR-001", "Admin", "-", "admin", "Admin", "Aktif"]
  ],

  DEFAULT_CABANG: [],

  // Bahan Baku: ID_BAHAN, NAMA_BAHAN, SATUAN (Tanpa data dummy)
  DEFAULT_BAHAN_BAKU: [],

  // Tipe Pengeluaran: ID_TIPE, NAMA_TIPE (Tanpa data dummy)
  DEFAULT_TIPE_PENGELUARAN: [],

  // Sumber Pemasukan: ID_SUMBER, NAMA_SUMBER, STATUS (Tanpa data dummy)
  DEFAULT_SUMBER_PEMASUKAN: []
};
