import { describe, expect, it } from "vitest";
import { generateTrxId, parseLooseNumber, parseTimestamp } from "./formatters";

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

  it("returns null for invalid timestamp", () => {
    expect(parseTimestamp("invalid-date")).toBeNull();
  });
});

describe("generateTrxId", () => {
  it("generates TRX ID format with timestamp", () => {
    const trxId = generateTrxId("2026-09-21");
    expect(trxId).toMatch(/^TRX-20260921-\d{6}$/);
  });

  it("generates TRX ID with counter", () => {
    const trxId = generateTrxId("2026-09-21", 5);
    expect(trxId).toBe("TRX-20260921-005");
  });

  it("falls back to current date if date is empty or invalid", () => {
    const trxId = generateTrxId();
    expect(trxId).toMatch(/^TRX-\d{8}-\d{6}$/);
  });
});

