import { describe, expect, it } from "vitest";
import { buildAreaData, buildKpi, buildTrendData, filterRows } from "./dashboard";

describe("filterRows", () => {
  it("filters data case-insensitively", () => {
    const rows = [{ KASIR: "Abdul" }, { KASIR: "Rina" }];
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

  it("buildAreaData returns sorted top area", () => {
    const dbRows = [
      { "ARUS DANA": "A", "UANG MASUK": "10.000" },
      { "ARUS DANA": "B", "UANG MASUK": "2.000" },
      { "ARUS DANA": "A", "UANG MASUK": "1.000" },
    ];

    const area = buildAreaData(dbRows);
    expect(area[0]).toEqual({ label: "A", value: 11000 });
  });
});
