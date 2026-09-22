import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import OnlineStatusBadge from "./OnlineStatusBadge";

afterEach(() => {
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});

function goOffline() {
  Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
  act(() => window.dispatchEvent(new Event("offline")));
}

function goOnline() {
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  act(() => window.dispatchEvent(new Event("online")));
}

describe("OnlineStatusBadge", () => {
  it("renders nothing when online", () => {
    render(<OnlineStatusBadge />);
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });

  it("shows badge when offline", () => {
    render(<OnlineStatusBadge />);
    goOffline();
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it("hides badge when back online", () => {
    render(<OnlineStatusBadge />);
    goOffline();
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
    goOnline();
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });
});
