export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const REPORT_FORM_DEFAULT = {
  "ID TRANSAKSI": "",
  "NO TRANSAKSI": "",
  TANGGAL: getTodayDateString(),
  "WAKTU INPUT": "",
  CABANG: "",
  "ARUS DANA": "",
  STAFF: "",
  "UANG SETORAN": "",
  "TOTAL PENGELUARAN": 0,
  "TOTAL PENJUALAN": 0,
  "RINCIAN PENGELUARAN": "",
  pengeluaranList: [],
  stokBahan: {},
  // Backward compatibility fields
  "GELAS AWAL": "",
  "GELAS SISA": "",
  "GELAS RUSAK": "",
  "GELAS LAKU": 0,
  "ES BATU DEPO": "0",
  "ES BATU BELI": "0",
  TEH: "0",
  GULA: "0",
  PENGELUARAN: 0,
  "TOTAL NOTA": 0,
  "UANG MASUK": 0,
  "UNAG MASUK": 0,
  SELISIH: 0,
  KETERANGAN: "",
};

export const DEFAULT_BAHAN_BAKU = [];
export const DEFAULT_TIPE_PENGELUARAN = [];
export const STAFF_OPTIONS = [];
export const BRANCH_OPTIONS = [];
export const SHIFT_OPTIONS = [];

export const DENOMINATIONS_DATA = [
  { label: "Rp 100.000", value: 100000 },
  { label: "Rp 75.000", value: 75000 },
  { label: "Rp 50.000", value: 50000 },
  { label: "Rp 20.000", value: 20000 },
  { label: "Rp 10.000", value: 10000 },
  { label: "Rp 5.000", value: 5000 },
  { label: "Rp 2.000", value: 2000 },
  { label: "Rp 1.000", value: 1000 },
  { label: "Rp 500", value: 500 },
  { label: "Rp 200", value: 200 },
  { label: "Rp 100", value: 100 },
];
