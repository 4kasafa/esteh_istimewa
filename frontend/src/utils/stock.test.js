import { describe, expect, it } from "vitest";
import {
  calculateStockBalances,
  getBahanHeaderPrefix,
  normalizeBahanItem,
} from "./stock";

describe("stock utility", () => {
  it("normalizes bahan item properly", () => {
    expect(normalizeBahanItem(null, 0)).toEqual({
      id: "BAHAN-01",
      nama: "Bahan 1",
      satuan: "",
      _rowIndex: null,
    });

    expect(normalizeBahanItem("Gelas Cup", 1)).toEqual({
      id: "BAHAN-02",
      nama: "Gelas Cup",
      satuan: "",
      _rowIndex: null,
    });

    expect(
      normalizeBahanItem({ ID_BAHAN: "BAHAN-05", NAMA_BAHAN: "Teh", SATUAN: "Pack" })
    ).toEqual({
      id: "BAHAN-05",
      nama: "Teh",
      satuan: "Pack",
      _rowIndex: null,
    });
  });

  it("preserves _rowIndex for delete-by-row of ID-less imported rows", () => {
    const normalized = normalizeBahanItem({ NAMA_BAHAN: "Teh", _rowIndex: 8 });
    expect(normalized._rowIndex).toBe(8);

    const [item] = calculateStockBalances(
      [{ NAMA_BAHAN: "Teh", _rowIndex: 8 }],
      [],
      [],
      "Semua"
    );
    expect(item._rowIndex).toBe(8);
  });

  it("handles header prefix mapping", () => {
    expect(getBahanHeaderPrefix("Gelas Cup")).toBe("GELAS");
    expect(getBahanHeaderPrefix("Gelas")).toBe("GELAS");
    expect(getBahanHeaderPrefix("Teh Tubruk")).toBe("TEH TUBRUK");
    expect(getBahanHeaderPrefix("Gula Pasir")).toBe("GULA PASIR");
  });

  it("calculates stock balances across branches from transaction rows", () => {
    const masterBahan = [
      { ID_BAHAN: "BAHAN-01", NAMA_BAHAN: "Gelas Cup", SATUAN: "Cup" },
      { ID_BAHAN: "BAHAN-02", NAMA_BAHAN: "Teh", SATUAN: "Pack" },
      { ID_BAHAN: "BAHAN-03", NAMA_BAHAN: "Susu", SATUAN: "Kaleng" },
    ];

    const branches = ["Outlet 01", "Outlet 02"];

    const transactionRows = [
      // Day 1
      {
        TANGGAL: "2026-03-01",
        "WAKTU INPUT": "10:00",
        CABANG: "Outlet 01",
        "GELAS AWAL": "500",
        "GELAS SISA": "350",
        "GELAS TERPAKAI": "150",
        "TEH AWAL": "10",
        "TEH SISA": "8",
        "TEH TERPAKAI": "2",
      },
      {
        TANGGAL: "2026-03-01",
        "WAKTU INPUT": "10:30",
        CABANG: "Outlet 02",
        "GELAS AWAL": "400",
        "GELAS SISA": "300",
        "GELAS TERPAKAI": "100",
        "TEH AWAL": "5",
        "TEH SISA": "4",
        "TEH TERPAKAI": "1",
      },
      // Day 2 (latest for Outlet 01)
      {
        TANGGAL: "2026-03-02",
        "WAKTU INPUT": "11:00",
        CABANG: "Outlet 01",
        "GELAS AWAL": "350",
        "GELAS SISA": "200",
        "GELAS TERPAKAI": "150",
        "TEH AWAL": "8",
        "TEH SISA": "5",
        "TEH TERPAKAI": "3",
      },
    ];

    // Evaluate for "Semua"
    const resultsAll = calculateStockBalances(masterBahan, transactionRows, branches, "Semua");
    expect(resultsAll).toHaveLength(3);

    const gelas = resultsAll.find((b) => b.nama === "Gelas Cup");
    expect(gelas.sisa).toBe(500); // 200 (Outlet 01 latest) + 300 (Outlet 02 latest)
    expect(gelas.totalTerpakai).toBe(400); // 150 + 100 + 150
    expect(gelas.status).toBe("Tersedia");
    expect(gelas.branchBalances).toEqual([
      { cabang: "Outlet 01", sisa: 200 },
      { cabang: "Outlet 02", sisa: 300 },
    ]);

    const teh = resultsAll.find((b) => b.nama === "Teh");
    expect(teh.sisa).toBe(9); // 5 (Outlet 01) + 4 (Outlet 02)
    expect(teh.totalTerpakai).toBe(6); // 2 + 1 + 3

    const susu = resultsAll.find((b) => b.nama === "Susu");
    expect(susu.sisa).toBe(0);
    expect(susu.totalTerpakai).toBe(0);
    expect(susu.status).toBe("Habis");

    // Evaluate for specific branch: "Outlet 01"
    const resultsBranch1 = calculateStockBalances(masterBahan, transactionRows, branches, "Outlet 01");
    const gelasB1 = resultsBranch1.find((b) => b.nama === "Gelas Cup");
    expect(gelasB1.sisa).toBe(200);
    expect(gelasB1.totalTerpakai).toBe(300); // 150 + 150 from Outlet 01 only
  });
});
