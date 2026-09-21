import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import StokPanel from "./StokPanel";

describe("StokPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const sampleMasterBahan = [
    { ID_BAHAN: "BAHAN-01", NAMA_BAHAN: "Gelas Cup", SATUAN: "Cup" },
    { ID_BAHAN: "BAHAN-02", NAMA_BAHAN: "Teh Tubruk", SATUAN: "Pack" },
    { ID_BAHAN: "BAHAN-03", NAMA_BAHAN: "Gula Cair", SATUAN: "Botol" },
  ];

  const sampleBranches = ["Outlet 01", "Outlet 02"];

  const sampleReportRows = [
    {
      TANGGAL: "2026-03-01",
      "WAKTU INPUT": "10:00",
      CABANG: "Outlet 01",
      "GELAS AWAL": "500",
      "GELAS SISA": "350",
      "GELAS TERPAKAI": "150",
      "TEH TUBRUK SISA": "10",
      "TEH TUBRUK TERPAKAI": "2",
      "GULA CAIR SISA": "0",
      "GULA CAIR TERPAKAI": "5",
    },
    {
      TANGGAL: "2026-03-01",
      "WAKTU INPUT": "10:30",
      CABANG: "Outlet 02",
      "GELAS AWAL": "400",
      "GELAS SISA": "250",
      "GELAS TERPAKAI": "150",
      "TEH TUBRUK SISA": "5",
      "TEH TUBRUK TERPAKAI": "3",
      "GULA CAIR SISA": "0",
      "GULA CAIR TERPAKAI": "2",
    },
  ];

  it("renders stock statistics and cards correctly", () => {
    render(
      <StokPanel
        selectedBranch="Semua"
        branches={sampleBranches}
        masterBahan={sampleMasterBahan}
        reportRows={sampleReportRows}
      />
    );

    // Verify stat cards
    expect(screen.getByText("Jenis Bahan")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // 3 jenis bahan

    // Check items displayed
    expect(screen.getByText("Gelas Cup")).toBeInTheDocument();
    expect(screen.getByText("Teh Tubruk")).toBeInTheDocument();
    expect(screen.getByText("Gula Cair")).toBeInTheDocument();

    // Check remaining stock: Gelas 350 + 250 = 600
    expect(screen.getByText("600")).toBeInTheDocument();
    // Teh: 10 + 5 = 15
    expect(screen.getByText("15")).toBeInTheDocument();
    // Gula Cair: 0 (Habis)
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
  });

  it("filters items by status filter pills", () => {
    render(
      <StokPanel
        selectedBranch="Semua"
        branches={sampleBranches}
        masterBahan={sampleMasterBahan}
        reportRows={sampleReportRows}
      />
    );

    // Click "Habis" filter pill
    const habisPill = screen.getByRole("button", { name: /Habis/i });
    fireEvent.click(habisPill);

    expect(screen.getByText("Gula Cair")).toBeInTheDocument();
    expect(screen.queryByText("Gelas Cup")).not.toBeInTheDocument();
    expect(screen.queryByText("Teh Tubruk")).not.toBeInTheDocument();

    // Click "Tersedia" filter pill
    const tersediaPill = screen.getByRole("button", { name: /Tersedia/i });
    fireEvent.click(tersediaPill);

    expect(screen.getByText("Gelas Cup")).toBeInTheDocument();
    expect(screen.getByText("Teh Tubruk")).toBeInTheDocument();
    expect(screen.queryByText("Gula Cair")).not.toBeInTheDocument();
  });

  it("filters items by search keyword", () => {
    render(
      <StokPanel
        selectedBranch="Semua"
        branches={sampleBranches}
        masterBahan={sampleMasterBahan}
        reportRows={sampleReportRows}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari bahan baku atau satuan/i);
    fireEvent.change(searchInput, { target: { value: "Teh" } });

    expect(screen.getByText("Teh Tubruk")).toBeInTheDocument();
    expect(screen.queryByText("Gelas Cup")).not.toBeInTheDocument();
    expect(screen.queryByText("Gula Cair")).not.toBeInTheDocument();
  });

  it("opens modal and triggers request to add new master bahan", async () => {
    const mockRequest = vi.fn().mockResolvedValue({ success: true });
    const mockReloadMaster = vi.fn().mockResolvedValue(true);

    render(
      <StokPanel
        selectedBranch="Semua"
        branches={sampleBranches}
        masterBahan={sampleMasterBahan}
        reportRows={sampleReportRows}
        request={mockRequest}
        onReloadMaster={mockReloadMaster}
      />
    );

    // Click "+ Tambah Bahan" button
    const addButton = screen.getByRole("button", { name: /Tambah Bahan/i });
    fireEvent.click(addButton);

    // Modal should be open
    expect(screen.getByText("Tambah Bahan Baku")).toBeInTheDocument();

    const namaInput = screen.getByPlaceholderText(/Contoh: Gelas Cup, Teh Tubruk, Susu/i);
    fireEvent.change(namaInput, { target: { value: "Susu Kental Manis" } });

    // Click Kaleng or enter satuan
    const satuanInput = screen.getByPlaceholderText(/Pcs, Cup, Kg, Pack, dll/i);
    fireEvent.change(satuanInput, { target: { value: "Kaleng" } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Simpan Bahan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        action: "update_master",
        target: "bahan_baku",
        operation: "create",
        data: {
          ID_BAHAN: undefined,
          NAMA_BAHAN: "Susu Kental Manis",
          SATUAN: "Kaleng",
        },
      });
    });

    expect(mockReloadMaster).toHaveBeenCalled();
  });
});
