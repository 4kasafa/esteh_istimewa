import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSwrCache, removeSwrCache, setSwrCache } from "./swrCache";

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
});
