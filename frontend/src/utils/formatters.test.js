import { describe, expect, it } from "vitest";
import {
  cleanRupiahInput,
  formatRupiahNumber,
  generateTrxId,
  isExpenseId,
  parseLooseNumber,
  parseTimestamp,
} from "./formatters";

describe("parseLooseNumber", () => {
  it("parses Indonesian number format", () => {
    expect(parseLooseNumber("1.250.000")).toBe(1250000);
  });

  it("parses currency with symbol", () => {
    expect(parseLooseNumber("Rp 20.000")).toBe(20000);
  });

  it("returns 0 for empty values", () => {
    expect(parseLooseNumber("")).toBe(0);
    expect(parseLooseNumber(null)).toBe(0);
  });
});

describe("parseTimestamp", () => {
  it("parses dd-mm-yyyy format", () => {
    const result = parseTimestamp("01-03-2026 22:22:26");
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(2);
  });

  it("parses Indonesian month string", () => {
    const result = parseTimestamp("Minggu, 1 Maret 2026 22.22.26");
    expect(result).toBeInstanceOf(Date);
    expect(result?.getDate()).toBe(1);
  });

  it("parses YYYY-MM-DD format with colons and dots in time", () => {
    const resColons = parseTimestamp("2026-09-26 14:30:00");
    expect(resColons?.getFullYear()).toBe(2026);
    expect(resColons?.getMonth()).toBe(8);
    expect(resColons?.getDate()).toBe(26);
    expect(resColons?.getHours()).toBe(14);
    expect(resColons?.getMinutes()).toBe(30);

    const resDots = parseTimestamp("2026-09-26 14.30.00");
    expect(resDots?.getFullYear()).toBe(2026);
    expect(resDots?.getMonth()).toBe(8);
    expect(resDots?.getDate()).toBe(26);
    expect(resDots?.getHours()).toBe(14);
    expect(resDots?.getMinutes()).toBe(30);

    const resDateOnly = parseTimestamp("2026-09-26");
    expect(resDateOnly?.getFullYear()).toBe(2026);
    expect(resDateOnly?.getDate()).toBe(26);
  });

  it("parses DD/MM/YYYY with slashes and single digits", () => {
    const res = parseTimestamp("26/09/2026 14:30:00");
    expect(res?.getFullYear()).toBe(2026);
    expect(res?.getMonth()).toBe(8);
    expect(res?.getDate()).toBe(26);

    const resSingle = parseTimestamp("1/3/2026");
    expect(resSingle?.getFullYear()).toBe(2026);
    expect(resSingle?.getMonth()).toBe(2);
    expect(resSingle?.getDate()).toBe(1);
  });

  it("cleans Google Sheets epoch 1899-12-30 from concatenated time", () => {
    const res = parseTimestamp("2026-09-26 1899-12-30 14:30:00");
    expect(res?.getFullYear()).toBe(2026);
    expect(res?.getMonth()).toBe(8);
    expect(res?.getDate()).toBe(26);
    expect(res?.getHours()).toBe(14);
    expect(res?.getMinutes()).toBe(30);
  });

  it("extracts date from TRX and EXP transaction IDs", () => {
    const resTrx = parseTimestamp("TRX-20260301-001");
    expect(resTrx?.getFullYear()).toBe(2026);
    expect(resTrx?.getMonth()).toBe(2);
    expect(resTrx?.getDate()).toBe(1);

    const resExp = parseTimestamp("EXP-20260301-143000-ABCD");
    expect(resExp?.getFullYear()).toBe(2026);
    expect(resExp?.getMonth()).toBe(2);
    expect(resExp?.getDate()).toBe(1);
    expect(resExp?.getHours()).toBe(14);
  });

  it("returns null for invalid timestamp", () => {
    expect(parseTimestamp("invalid-date")).toBeNull();
  });
});

describe("generateTrxId", () => {  it("generates TRX ID format with timestamp", () => {
    const trxId = generateTrxId("2026-09-21");
    expect(trxId).toMatch(/^TRX-20260921-\d{6}-[A-Z0-9]{4}$/);
  });

  it("generates TRX ID with counter", () => {
    const trxId = generateTrxId("2026-09-21", 5);
    expect(trxId).toBe("TRX-20260921-005");
  });

  it("falls back to current date if date is empty or invalid", () => {
    const trxId = generateTrxId();
    expect(trxId).toMatch(/^TRX-\d{8}-\d{6}-[A-Z0-9]{4}$/);
  });

  it("generates unique IDs with TRX and EXP prefixes", () => {
    const a = generateTrxId(new Date(), "TRX");
    const b = generateTrxId(new Date(), "TRX");
    expect(a).toMatch(/^TRX-\d{8}-\d{6}-[A-Z0-9]{4}$/);
    expect(b).toMatch(/^TRX-\d{8}-\d{6}-[A-Z0-9]{4}$/);
    expect(a).not.toBe(b);
    const c = generateTrxId(new Date(), "EXP");
    expect(c).toMatch(/^EXP-\d{8}-\d{6}-[A-Z0-9]{4}$/);
    expect(isExpenseId(c)).toBe(true);
    expect(isExpenseId(a)).toBe(false);
  });

  it("includes 4-char entropy", () => {
    const trxId = generateTrxId(new Date(), "TRX");
    expect(trxId.split("-")).toHaveLength(4);
    expect(trxId.split("-")[3]).toMatch(/^[A-Z0-9]{4}$/);
  });
});

describe("cleanRupiahInput", () => {
  it("membersihkan karakter non-digit", () => {
    expect(cleanRupiahInput("Rp 200.000")).toBe("200000");
    expect(cleanRupiahInput("200.000")).toBe("200000");
    expect(cleanRupiahInput("Rp200.000,00?")).toBe("20000000");
  });

  it("menangani kosong/null/undefined", () => {
    expect(cleanRupiahInput("")).toBe("");
    expect(cleanRupiahInput(null)).toBe("");
    expect(cleanRupiahInput(undefined)).toBe("");
  });

  it("normalisasi leading zeros", () => {
    expect(cleanRupiahInput("0500")).toBe("500");
    expect(cleanRupiahInput("00")).toBe("0");
    expect(cleanRupiahInput("0")).toBe("0");
  });

  it("menangani number input", () => {
    expect(cleanRupiahInput(0)).toBe("0");
    expect(cleanRupiahInput(200000)).toBe("200000");
  });
});

describe("formatRupiahNumber", () => {
  it("memformat ribuan dengan titik", () => {
    expect(formatRupiahNumber(200000)).toBe("200.000");
    expect(formatRupiahNumber("1500000")).toBe("1.500.000");
    expect(formatRupiahNumber("500")).toBe("500");
  });

  it("menangani nol dan kosong", () => {
    expect(formatRupiahNumber("0")).toBe("0");
    expect(formatRupiahNumber(0)).toBe("0");
    expect(formatRupiahNumber("")).toBe("");
    expect(formatRupiahNumber(null)).toBe("");
    expect(formatRupiahNumber(undefined)).toBe("");
  });
});

