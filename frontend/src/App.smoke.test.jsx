import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function mockSuccess(data) {
  return Promise.resolve({
    json: () => Promise.resolve({ success: true, data }),
  });
}

describe("App smoke", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders login and can login to dashboard", async () => {
    vi.stubGlobal("fetch", vi.fn((_, options) => {
      const payload = JSON.parse(options.body);
      if (payload.action === "login") {
        return mockSuccess({
          token: "token-123",
          user: { nama: "Kasir Test", role: "kasir" },
        });
      }
      if (payload.action === "read") {
        return mockSuccess([{ id: 1, KASIR: "Kasir Test" }]);
      }
      return mockSuccess([]);
    }));

    render(<App />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "kasir@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("token-123");
      expect(screen.queryByLabelText("Email Address")).not.toBeInTheDocument();
    });
  });

  it("uses lastTodayReport as read id for kasir initial load", async () => {
    const fetchMock = vi.fn((_, options) => {
      const payload = JSON.parse(options.body);
      if (payload.action === "login") {
        return mockSuccess({
          token: "token-456",
          user: { nama: "Kasir Test", role: "kasir" },
          lastTodayReport: "04-03-2026 09:10:11",
        });
      }
      if (payload.action === "read") {
        return mockSuccess([{ id: 2, KASIR: "Kasir Test" }]);
      }
      return mockSuccess([]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "kasir@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("token-456");
    });

    const readCalls = fetchMock.mock.calls
      .map((call) => JSON.parse(call[1].body))
      .filter((payload) => payload.action === "read");

    expect(readCalls.some((payload) => payload.id === "04-03-2026 09:10:11")).toBe(true);
  });
});
