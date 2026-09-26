import { describe, expect, it } from "vitest";
import { buildDashboardTableRows, buildExecutiveKpi, buildKpi, buildTrendData, filterRows } from "./dashboard";

describe("filterRows", () => {
  it("filters data case-insensitively", () => {
    const rows = [{ STAFF: "Abdul" }, { STAFF: "Rina" }];
    expect(filterRows(rows, "abd")).toHaveLength(1);
  });
});

describe("buildKpi", () => {
  it("builds KPI aggregate safely", () => {
    const reportRows = [{ id: 1 }, { id: 2 }];
    const dbRows = [
      { "UANG MASUK": "10.000", PENGELUARAN: "2.000", "STATUS SELISIH": "LEBIH" },
      { "UANG MASUK": "5.000", PENGELUARAN: "1.000", "STATUS SELISIH": "KURANG" },
    ];

    expect(buildKpi(reportRows, dbRows)).toEqual({
      totalTransaksi: 2,
      totalUangMasuk: 15000,
      totalPengeluaran: 3000,
      selisihLebih: 1,
    });
  });
});

describe("chart builders", () => {
  it("buildTrendData groups by date", () => {
    const dbRows = [
      { "TIME STAMP INPUT": "01-03-2026 10:00:00", "UANG MASUK": "10.000" },
      { "TIME STAMP INPUT": "01-03-2026 11:00:00", "UANG MASUK": "5.000" },
    ];

    const trend = buildTrendData(dbRows);
    expect(trend).toHaveLength(1);
    expect(trend[0].value).toBe(15000);
  });

  it("buildTrendData handles YYYY-MM-DD and dotted waktu without falling back to today", () => {
    const dbRows = [
      { TANGGAL: "2026-02-10", "WAKTU INPUT": "10.00.00", "UANG MASUK": "20.000" },
      { TANGGAL: "2026-02-10", "WAKTU INPUT": "1899-12-30 11:00:00", "UANG MASUK": "30.000" },
      { TANGGAL: "2026-02-11", "UANG MASUK": "15.000" },
    ];

    const trend = buildTrendData(dbRows);
    expect(trend).toHaveLength(2);
    expect(trend[0].value).toBe(50000);
    expect(trend[1].value).toBe(15000);
  });
});

describe("buildExecutiveKpi", () => {
  it("calculates Total Penjualan = Uang Setoran + Total Pengeluaran correctly without selisih", () => {
    const rows = [
      {
        raw: {
          CABANG: "cabang_01",
          "UANG SETORAN": 465000,
          "TOTAL PENGELUARAN": 35000,
          "TOTAL PENJUALAN": 500000,
          "GELAS TERPAKAI": 160,
          TANGGAL: "2026-03-19",
          "WAKTU INPUT": "21:00:00",
        },
      },
      {
        raw: {
          CABANG: "cabang_02",
          "UANG SETORAN": 300000,
          "TOTAL PENGELUARAN": 50000,
          "TOTAL PENJUALAN": 350000,
          "GELAS TERPAKAI": 110,
          TANGGAL: "2026-03-19",
          "WAKTU INPUT": "21:30:00",
        },
      },
    ];

    const kpi = buildExecutiveKpi(rows);
    expect(kpi.totalSales).toBe(850000);
    expect(kpi.totalExpenses).toBe(85000);
    expect(kpi.totalDeposit).toBe(765000);
    expect(kpi.totalCups).toBe(270);
    expect(kpi.topBranch).toBe("cabang_01");
  });
});

describe("buildDashboardTableRows", () => {
  it("hides SELISIH and STATUS SELISIH columns from the output", () => {
    const rawRows = [
      {
        "ID TRANSAKSI": "TRX-001",
        CABANG: "cabang_01",
        "UANG SETORAN": 465000,
        "TOTAL PENJUALAN": 500000,
        SELISIH: 0,
        "STATUS SELISIH": "PAS",
      },
    ];

    const displayRows = buildDashboardTableRows(rawRows);
    expect(displayRows[0]).not.toHaveProperty("SELISIH");
    expect(displayRows[0]).not.toHaveProperty("STATUS SELISIH");
    expect(displayRows[0]).toHaveProperty("UANG SETORAN", 465000);
    expect(displayRows[0]).toHaveProperty("TOTAL PENJUALAN", 500000);
  });
});

