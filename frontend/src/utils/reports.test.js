import { describe, expect, it } from "vitest";
import {
  applyReportFilters,
  buildTransactionList,
  getReportArusDanaOptions,
  getReportStaffOptions,
  sanitizeReportRows,
} from "./reports";

describe("sanitizeReportRows", () => {
  it("calculates Total Penjualan = Uang Setoran + Total Pengeluaran correctly", () => {
    const rawData = [
      {
        "ID TRANSAKSI": "TRX-20260319-cabang_01",
        TANGGAL: "2026-03-19",
        "WAKTU INPUT": "21:00:00",
        CABANG: "cabang_01",
        STAFF: "Joko",
        "UANG SETORAN": 465000,
        "TOTAL PENGELUARAN": 35000,
        "RINCIAN PENGELUARAN": "[Beli Es: Rp 20.000], [Air Galon: Rp 15.000]",
        "GELAS AWAL": 200,
        "GELAS SISA": 40,
        "GELAS TERPAKAI": 160,
      },
    ];

    const sanitized = sanitizeReportRows(rawData);
    expect(sanitized).toHaveLength(1);
    const item = sanitized[0];
    expect(item.uangSetoran).toBe(465000);
    expect(item.totalPengeluaran).toBe(35000);
    expect(item.totalPenjualan).toBe(500000);
    expect(item.gelasAwal).toBe(200);
    expect(item.gelasSisa).toBe(40);
    expect(item.gelasLaku).toBe(160);
    expect(item.selisih).toBe(0);
    expect(item.raw["UANG SETORAN"]).toBe(465000);
    expect(item.raw["TOTAL PENJUALAN"]).toBe(500000);
  });

  it("accurately preserves Uang Setoran = 0 without overwriting with Total Penjualan", () => {
    const rawData = [
      {
        "ID TRANSAKSI": "TRX-20260319-cabang_02",
        "UANG SETORAN": 0,
        "TOTAL PENGELUARAN": 20000,
        "TOTAL PENJUALAN": 20000,
        "GELAS AWAL": 50,
        "GELAS SISA": 45,
      },
    ];

    const sanitized = sanitizeReportRows(rawData);
    expect(sanitized[0].uangSetoran).toBe(0);
    expect(sanitized[0].raw["UANG SETORAN"]).toBe(0);
    expect(sanitized[0].totalPenjualan).toBe(20000);
  });

  it("defaults Total Penjualan to 0 if no setoran/pengeluaran specified (no 4000 hardcode)", () => {
    const rawData = [
      {
        "ID TRANSAKSI": "TRX-20260319-cabang_01",
        "GELAS AWAL": 100,
        "GELAS SISA": 60,
      },
    ];

    const sanitized = sanitizeReportRows(rawData);
    expect(sanitized[0].gelasLaku).toBe(40);
    expect(sanitized[0].totalPenjualan).toBe(0);
  });

  it("handles STAFF field and extracts options correctly", () => {
    const rawData = [
      {
        "ID TRANSAKSI": "TRX-1",
        STAFF: "Budi Santoso",
      },
      {
        "ID TRANSAKSI": "TRX-2",
        STAFF: "Siti Rahma",
      },
    ];

    const sanitized = sanitizeReportRows(rawData);
    expect(sanitized[0].staff).toBe("Budi Santoso");
    expect(sanitized[1].staff).toBe("Siti Rahma");

    const options = getReportStaffOptions(sanitized);
    expect(options).toEqual(["semua", "Budi Santoso", "Siti Rahma"]);

    const filteredBudi = applyReportFilters(sanitized, { range: "month", period: "2026-03", staff: "Budi Santoso" });
    // Both items were created without explicit timestamp, so timestamp is new Date()
    expect(filteredBudi.every((i) => i.staff === "Budi Santoso")).toBe(true);
  });

  it("handles empty or undefined staff and arusDana values without crashing", () => {
    const brokenRows = [
      { id: "1", staff: undefined, arusDana: undefined },
      { id: "2", staff: "Budi", arusDana: "cabang_01" },
      { id: "3", staff: "", arusDana: "" },
    ];
    expect(getReportStaffOptions(brokenRows)).toEqual(["semua", "Budi"]);
    expect(getReportArusDanaOptions(brokenRows)).toEqual(["semua", "cabang_01"]);
  });
});

describe("buildTransactionList", () => {
  const incomeRow = {
    "ID TRANSAKSI": "TRX-INC-001",
    "NO TRANSAKSI": "TRX-INC-001",
    "TIME STAMP INPUT": "19-03-2026 10:00:00",
    "ARUS DANA": "cabang_01",
    STAFF: "Joko",
    "UANG SETORAN": 465000,
    "TOTAL PENGELUARAN": 35000,
    "TOTAL PENJUALAN": 500000,
    "GELAS TERPAKAI": 160,
    pengeluaranList: [
      { tipe: "Operasional", nominal: 25000, keterangan: "Beli Es Batu" }
    ]
  };

  it("merges pemasukan from reports and pengeluaran from reportRows.pengeluaranList", () => {
    const list = buildTransactionList([incomeRow]);

    expect(list).toHaveLength(2);
    expect(list.filter((t) => t.type === "PEMASUKAN")).toHaveLength(1);
    expect(list.filter((t) => t.type === "PENGELUARAN")).toHaveLength(1);

    const pemasukan = list.find((t) => t.type === "PEMASUKAN");
    expect(pemasukan.nominal).toBe(500000);
    expect(pemasukan.keterangan).toBe("TRX-INC-001");

    const pengeluaran = list.find((t) => t.type === "PENGELUARAN");
    expect(pengeluaran.nominal).toBe(25000);
    expect(pengeluaran.keterangan).toBe("Operasional");
  });

  it("hanya mengambil record dengan pengeluaranList sebagai pengeluaran", () => {
    const noExpenseRow = {
      "ID TRANSAKSI": "TRX-NO-EXP",
      "TIME STAMP INPUT": "19-03-2026 10:00:00",
      "ARUS DANA": "cabang_01",
      STAFF: "Joko",
      "TOTAL PENJUALAN": 300000,
      "UANG SETORAN": 300000
    };
    const list = buildTransactionList([incomeRow, noExpenseRow]);
    expect(list).toHaveLength(3);
    expect(list.filter((t) => t.type === "PENGELUARAN")).toHaveLength(1);
  });

  it("mengurutkan berdasarkan timestamp menurun", () => {
    const morningIncome = {
      ...incomeRow,
      "ID TRANSAKSI": "TRX-MORNING",
      "TIME STAMP INPUT": "19-03-2026 09:00:00",
      "TOTAL PENJUALAN": 300000,
      "UANG SETORAN": 300000,
      pengeluaranList: []
    };
    const afternoonIncome = {
      ...incomeRow,
      "ID TRANSAKSI": "TRX-AFTERNOON",
      "TIME STAMP INPUT": "19-03-2026 14:00:00",
      "TOTAL PENJUALAN": 500000,
      "UANG SETORAN": 500000,
      pengeluaranList: []
    };
    const list = buildTransactionList([afternoonIncome, morningIncome]);
    expect(list[0].id).toBe("TRX-AFTERNOON");
    expect(list[1].id).toBe("TRX-MORNING");
  });

  it("bisa di-filter dengan applyReportFilters (cabang + staff)", () => {
    const list = buildTransactionList([incomeRow]);
    const filtered = applyReportFilters(
      list,
      { range: "month", period: "2026-03", arusDana: "cabang_01", staff: "Budi" },
    );
    expect(filtered).toHaveLength(0);
  });

  it("mengembalikan array kosong saat tidak ada data", () => {
    expect(buildTransactionList([])).toEqual([]);
    expect(buildTransactionList()).toEqual([]);
    expect(buildTransactionList([{}])).toEqual([]);
  });
});
