import { describe, it, expect, beforeEach } from "vitest";
import {
  SETUP_STATE_KEY,
  clearTempSetupData,
  isSetupStateValid,
  readSetupState,
  saveSetupState,
} from "./setupState";

const VALID_PAYLOAD = {
  cabang: ["Outlet Pattimura"],
  staff: ["Siti Rahma"],
  bahan: ["Teh Melati"],
};

describe("setupState (localStorage setup wizard)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(readSetupState()).toBeNull();
    expect(isSetupStateValid()).toBe(false);
  });

  it("returns null when stored JSON is corrupt", () => {
    localStorage.setItem(SETUP_STATE_KEY, "{bukan-json");
    expect(readSetupState()).toBeNull();
    expect(isSetupStateValid()).toBe(false);
  });

  it("returns null when completed is false or missing", () => {
    localStorage.setItem(
      SETUP_STATE_KEY,
      JSON.stringify({ completed: false, cabang: ["A"], staff: ["B"] })
    );
    expect(isSetupStateValid()).toBe(false);

    localStorage.setItem(
      SETUP_STATE_KEY,
      JSON.stringify({ cabang: ["A"], staff: ["B"] })
    );
    expect(isSetupStateValid()).toBe(false);
  });

  it("stays valid when completed is true even with empty cabang/staff (setup opsional)", () => {
    localStorage.setItem(
      SETUP_STATE_KEY,
      JSON.stringify({ completed: true, cabang: [], staff: [] })
    );
    expect(isSetupStateValid()).toBe(true);
    expect(readSetupState().cabang).toEqual([]);
    expect(readSetupState().staff).toEqual([]);
  });

  it("accepts completed as string true", () => {
    localStorage.setItem(
      SETUP_STATE_KEY,
      JSON.stringify({ completed: "true", cabang: ["A"], staff: ["B"] })
    );
    expect(isSetupStateValid()).toBe(true);
  });

  it("roundtrips a valid setup state", () => {
    saveSetupState(VALID_PAYLOAD);

    const state = readSetupState();
    expect(state).toMatchObject({
      completed: true,
      cabang: ["Outlet Pattimura"],
      staff: ["Siti Rahma"],
      bahan: ["Teh Melati"],
    });
    expect(typeof state.savedAt).toBe("string");
    expect(isSetupStateValid()).toBe(true);
  });

  it("clears legacy and temporary trigger data", () => {
    localStorage.setItem("esteh_wizard_completed", "true");
    sessionStorage.setItem("esteh_wizard_skipped", "true");
    sessionStorage.setItem("esteh_banner_dismissed", "true");

    clearTempSetupData();

    expect(localStorage.getItem("esteh_wizard_completed")).toBeNull();
    expect(sessionStorage.getItem("esteh_wizard_skipped")).toBeNull();
    expect(sessionStorage.getItem("esteh_banner_dismissed")).toBeNull();
  });
});
