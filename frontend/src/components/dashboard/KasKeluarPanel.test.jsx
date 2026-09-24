import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import KasKeluarPanel from "./KasKeluarPanel";

describe("KasKeluarPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps = {
    request: vi.fn().mockResolvedValue({ success: true }),
    period: "2026-09",
    branches: ["Cabang Utama", "Cabang Timur"],
    staff: ["Admin", "Budi"],
    availableTipePengeluaran: ["Operasional Toko", "Bahan Baku", "Kebersihan"],
    selectedBranch: "Cabang Utama",
    onReload: vi.fn().mockResolvedValue(),
    isAdmin: true,
    user: { nama: "Admin", role: "admin" },
  };

  it("renders the expense form directly without any table", () => {
    render(<KasKeluarPanel {...defaultProps} />);

    // Directly shows heading and form sections
    expect(screen.getByRole("heading", { name: /^Pengeluaran$/i })).toBeInTheDocument();
    expect(screen.getByText(/1\. Informasi Outlet & Tanggal/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Pengeluaran Operasional/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Catatan Tambahan/i)).toBeInTheDocument();

    // Submit and Reset buttons
    expect(screen.getByRole("button", { name: /Simpan Pengeluaran/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset Form/i })).toBeInTheDocument();

    // No table should be present
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("allows adding and removing dynamic expense rows and dynamically calculates total", async () => {
    render(<KasKeluarPanel {...defaultProps} />);

    // Starts with 1 row
    const nominalInputs = screen.getAllByPlaceholderText("Nominal (Rp)");
    expect(nominalInputs).toHaveLength(1);

    // Initial total is 0
    expect(screen.getByText("Rp 0")).toBeInTheDocument();

    // Fill first row with 25000
    fireEvent.change(nominalInputs[0], { target: { value: "25000" } });
    expect(screen.getByText("Rp 25.000")).toBeInTheDocument();

    // Add a second row
    const addRowBtn = screen.getByRole("button", { name: /Tambah Baris/i });
    fireEvent.click(addRowBtn);

    const updatedNominalInputs = screen.getAllByPlaceholderText("Nominal (Rp)");
    expect(updatedNominalInputs).toHaveLength(2);

    // Fill second row with 50000
    fireEvent.change(updatedNominalInputs[1], { target: { value: "50000" } });
    expect(screen.getByText("Rp 75.000")).toBeInTheDocument();

    // Remove first row
    const removeButtons = screen.getAllByTitle("Hapus baris pengeluaran");
    expect(removeButtons).toHaveLength(2);
    fireEvent.click(removeButtons[0]);

    // Now 1 row remains with nominal 50000, and total is 50.000
    expect(screen.getAllByPlaceholderText("Nominal (Rp)")).toHaveLength(1);
    expect(screen.getByText("Rp 50.000")).toBeInTheDocument();
  });

  it("shows error alert when trying to submit with 0 or empty nominal", async () => {
    const mockRequest = vi.fn();
    render(<KasKeluarPanel {...defaultProps} request={mockRequest} />);

    const submitBtn = screen.getByRole("button", { name: /Simpan Pengeluaran/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Masukkan minimal 1 baris pengeluaran dengan nominal lebih besar dari 0/i)).toBeInTheDocument();
    });

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("submits the expense correctly and invokes onReload", async () => {
    const mockRequest = vi.fn().mockResolvedValue({ success: true });
    const mockReload = vi.fn().mockResolvedValue();

    render(
      <KasKeluarPanel
        {...defaultProps}
        request={mockRequest}
        onReload={mockReload}
      />
    );

    const nominalInput = screen.getByPlaceholderText("Nominal (Rp)");
    fireEvent.change(nominalInput, { target: { value: "45000" } });

    const noteInput = screen.getByPlaceholderText("Keterangan / Nota (Opsional)");
    fireEvent.change(noteInput, { target: { value: "Beli Galon Air" } });

    const submitBtn = screen.getByRole("button", { name: /Simpan Pengeluaran/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "create_report",
          data: expect.objectContaining({
            "JENIS TRANSAKSI": "Pengeluaran",
            isPengeluaranOnly: true,
            "TOTAL PENGELUARAN": "45000",
            PENGELUARAN: "45000",
            "UANG SETORAN": "0",
            CABANG: "Cabang Utama",
            pengeluaranList: [
              expect.objectContaining({
                nominal: 45000,
                keterangan: "Beli Galon Air",
              }),
            ],
          }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Pengeluaran sebesar Rp 45\.000 berhasil disimpan/i)).toBeInTheDocument();
      expect(mockReload).toHaveBeenCalled();
    });
  });

  it("resets form when Reset Form is clicked", () => {
    render(<KasKeluarPanel {...defaultProps} />);

    const nominalInput = screen.getByPlaceholderText("Nominal (Rp)");
    fireEvent.change(nominalInput, { target: { value: "100000" } });
    expect(screen.getByText("Rp 100.000")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /Reset Form/i });
    fireEvent.click(resetBtn);

    expect(screen.getByPlaceholderText("Nominal (Rp)").value).toBe("");
    expect(screen.getByText("Rp 0")).toBeInTheDocument();
  });
});
