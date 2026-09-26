import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllSwrCache, getSwrCache, removeSwrCache, setSwrCache } from "./swrCache";

const PREFIX = "esteh_swr_";

describe("swrCache utility", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns defaultVal when key is missing", () => {
    expect(getSwrCache("master")).toBeNull();
    expect(getSwrCache("reports_init", [])).toEqual([]);
    expect(getSwrCache("missing", { a: 1 })).toEqual({ a: 1 });
  });

  it("stores data and reads it back", () => {
    const data = { cabang: ["Pusat"], users: [{ name: "A" }] };
    setSwrCache("master", data);
    expect(getSwrCache("master")).toEqual(data);
    expect(localStorage.getItem(PREFIX + "master")).toContain("timestamp");
  });

  it("does not throw on corrupted JSON", () => {
    localStorage.setItem(PREFIX + "master", "{not valid json");
    expect(() => getSwrCache("master")).not.toThrow();
    expect(getSwrCache("master", "fallback")).toBe("fallback");
  });

  it("does not throw when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => setSwrCache("master", { a: 1 })).not.toThrow();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => getSwrCache("master", [])).not.toThrow();
    expect(getSwrCache("master", [])).toEqual([]);
  });

  it("removes the given key", () => {
    setSwrCache("master", { a: 1 });
    removeSwrCache("master");
    expect(getSwrCache("master")).toBeNull();
    expect(localStorage.getItem(PREFIX + "master")).toBeNull();
  });

  it("clears all keys starting with PREFIX while keeping other keys", () => {
    setSwrCache("master", { cabang: ["Pusat"] });
    setSwrCache("reports_init", [{ id: 1 }]);
    setSwrCache("reports_2026-09", [{ id: 2 }]);
    localStorage.setItem("custom_other_key", "keep-me");

    clearAllSwrCache();

    expect(getSwrCache("master")).toBeNull();
    expect(getSwrCache("reports_init")).toBeNull();
    expect(getSwrCache("reports_2026-09")).toBeNull();
    expect(localStorage.getItem(PREFIX + "master")).toBeNull();
    expect(localStorage.getItem(PREFIX + "reports_init")).toBeNull();
    expect(localStorage.getItem(PREFIX + "reports_2026-09")).toBeNull();
    expect(localStorage.getItem("custom_other_key")).toBe("keep-me");
  });
});

