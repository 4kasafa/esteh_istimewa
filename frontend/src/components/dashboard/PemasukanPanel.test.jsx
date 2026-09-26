import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PemasukanPanel from "./PemasukanPanel";

const defaultProps = {
  request: vi.fn().mockResolvedValue({ success: true }),
  onCreateReport: vi.fn().mockResolvedValue(true),
  onSuccess: vi.fn(),
  branches: ["cabang_01", "cabang_02"],
  availableSumberPemasukan: ["Penjualan", "Sponsorship"],
  selectedBranch: "cabang_01",
  user: { nama: "Admin Istimewa", role: "admin" },
  onReloadMaster: vi.fn().mockResolvedValue(true),
};

describe("PemasukanPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders form pemasukan admin (tanggal, cabang, sumber, nominal, keterangan)", () => {
    render(<PemasukanPanel {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /^pemasukan$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/tanggal/i)).toBeInTheDocument();
    expect(screen.getByText("Admin Istimewa")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nominal (Rp)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/keterangan \(opsional\)/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /simpan pemasukan/i })).toBeInTheDocument();
  });

  it("validates nominal > 0", async () => {
    render(<PemasukanPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /simpan pemasukan/i }));
    await waitFor(() => {
      expect(screen.getByText(/nominal pemasukan wajib diisi lebih besar dari 0/i)).toBeInTheDocument();
    });
    expect(defaultProps.onCreateReport).not.toHaveBeenCalled();
  });

  it("opens modal tambah sumber pemasukan baru", async () => {
    const request = vi.fn().mockResolvedValue({ success: true });
    const onReloadMaster = vi.fn().mockResolvedValue(true);
    render(<PemasukanPanel {...defaultProps} request={request} onReloadMaster={onReloadMaster} />);
    fireEvent.click(screen.getByRole("button", { name: /tambah sumber pemasukan/i }));
    expect(screen.getByRole("heading", { name: /tambah sumber pemasukan/i })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/sponsorship/i), { target: { value: "Investasi" } });
    fireEvent.click(screen.getByRole("button", { name: /^simpan$/i }));
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "update_master",
          target: "sumber_pemasukan",
          operation: "create",
        })
      );
      expect(onReloadMaster).toHaveBeenCalled();
    });
  });

  it("submits payload pemasukan via onCreateReport", async () => {
    const onCreateReport = vi.fn().mockResolvedValue(true);
    const onSuccess = vi.fn();
    render(<PemasukanPanel {...defaultProps} onCreateReport={onCreateReport} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("Nominal (Rp)"), { target: { value: "100000" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan pemasukan/i }));
    await waitFor(() => {
      expect(onCreateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          "JENIS TRANSAKSI": "Pemasukan",
          NOMINAL: "100000",
          "TOTAL PENJUALAN": "100000",
          "UANG SETORAN": "100000",
          "TOTAL PENGELUARAN": "0",
          CABANG: "cabang_01",
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
