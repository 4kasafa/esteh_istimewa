import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OverviewPanel from "./OverviewPanel";

describe("OverviewPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockRows = [
    {
      "ID TRANSAKSI": "TRX-001",
      TANGGAL: "2026-03-01",
      STAFF: "Staff 1",
      CABANG: "Cabang Utama",
      "TOTAL PENJUALAN": 500000,
      "UANG SETORAN": 400000,
      "TOTAL PENGELUARAN": 100000,
      "GELAS TERPAKAI": 50,
    },
  ];

  it("renders cards correctly and displays Total Omset and Setoran Bersih", () => {
    render(<OverviewPanel reportRows={mockRows} dbRows={mockRows} />);

    expect(screen.getAllByText(/Total Omset/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Setoran Bersih/i).length).toBeGreaterThan(0);
  });

  it("performs auto-slide to Setoran Bersih and back to Total Omset on refresh/load", () => {
    render(<OverviewPanel reportRows={mockRows} dbRows={mockRows} />);

    const omsetDot = screen.getByLabelText("Kartu omset");
    const setoranDot = screen.getByLabelText("Kartu setoran");

    // Awalnya di kartu 0 (Omset)
    expect(omsetDot).toHaveClass("w-6");
    expect(setoranDot).toHaveClass("w-2");

    // Advance 700ms -> slide ke Setoran Bersih (kartu 1)
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(omsetDot).toHaveClass("w-2");
    expect(setoranDot).toHaveClass("w-6");

    // Advance 1500ms -> slide kembali ke Total Omset (kartu 0)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(omsetDot).toHaveClass("w-6");
    expect(setoranDot).toHaveClass("w-2");
  });

  it("cancels auto-slide if user manually interacts with cards", () => {
    render(<OverviewPanel reportRows={mockRows} dbRows={mockRows} />);

    const omsetDot = screen.getByLabelText("Kartu omset");
    const setoranDot = screen.getByLabelText("Kartu setoran");

    // User klik kartu setoran secara manual sebelum timer berjalan
    fireEvent.click(setoranDot);
    expect(setoranDot).toHaveClass("w-6");

    // Majukan waktu timer
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Karena user berinteraksi, posisinya tetap di kartu setoran dan tidak dipaksa balik otomatis
    expect(setoranDot).toHaveClass("w-6");
    expect(omsetDot).toHaveClass("w-2");
  });
});
