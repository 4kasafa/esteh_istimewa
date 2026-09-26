import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PengeluaranPanel from "./PengeluaranPanel";

const defaultProps = {
  request: vi.fn().mockResolvedValue({ success: true }),
  onCreateReport: vi.fn().mockResolvedValue(true),
  onSuccess: vi.fn(),
  branches: ["cabang_01", "cabang_02"],
  availableTipePengeluaran: ["Sewa Tempat"],
  availableBahan: [{ NAMA_BAHAN: "Gelas Cup" }],
  selectedBranch: "cabang_01",
  user: { nama: "Admin Istimewa", role: "admin" },
  onReloadMaster: vi.fn().mockResolvedValue(true),
};

describe("PengeluaranPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders form pengeluaran admin (tanggal, cabang, dropdown gabungan, nominal, keterangan)", () => {
    render(<PengeluaranPanel {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /^pengeluaran$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/tanggal/i)).toBeInTheDocument();
    expect(screen.getByText("Admin Istimewa")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nominal (Rp)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/keterangan \(opsional\)/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /simpan pengeluaran/i })).toBeInTheDocument();
  });

  it("validates nominal > 0", async () => {
    render(<PengeluaranPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /simpan pengeluaran/i }));
    await waitFor(() => {
      expect(screen.getByText(/nominal pengeluaran wajib diisi lebih besar dari 0/i)).toBeInTheDocument();
    });
    expect(defaultProps.onCreateReport).not.toHaveBeenCalled();
  });

  it("opens modal tambah tipe pengeluaran baru", async () => {
    const request = vi.fn().mockResolvedValue({ success: true });
    const onReloadMaster = vi.fn().mockResolvedValue(true);
    render(<PengeluaranPanel {...defaultProps} request={request} onReloadMaster={onReloadMaster} />);
    fireEvent.click(screen.getByRole("button", { name: /tambah sumber pengeluaran/i }));
    expect(screen.getByRole("heading", { name: /tambah sumber pengeluaran/i })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/sewa tempat/i), { target: { value: "Renovasi Toko" } });
    fireEvent.click(screen.getByRole("button", { name: /^simpan$/i }));
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "update_master",
          target: "tipe_pengeluaran",
          operation: "create",
        })
      );
      expect(onReloadMaster).toHaveBeenCalled();
    });
  });

  it("submits payload pengeluaran via onCreateReport", async () => {
    const onCreateReport = vi.fn().mockResolvedValue(true);
    const onSuccess = vi.fn();
    render(<PengeluaranPanel {...defaultProps} onCreateReport={onCreateReport} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("Nominal (Rp)"), { target: { value: "50000" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan pengeluaran/i }));
    await waitFor(() => {
      expect(onCreateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          "JENIS TRANSAKSI": "Pengeluaran",
          isPengeluaranOnly: true,
          "TOTAL PENGELUARAN": "50000",
          "UANG SETORAN": "0",
          CABANG: "cabang_01",
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
