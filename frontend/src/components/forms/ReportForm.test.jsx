import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReportForm from "./ReportForm";
import { getTodayDateString } from "../../utils/formatters";

describe("ReportForm Component", () => {
  const defaultProps = {
    value: {
      "ID TRANSAKSI": "TRX-001",
      TANGGAL: getTodayDateString(),
      CABANG: "Cabang Utama",
      STAFF: "Budi",
      "UANG SETORAN": 150000,
      "TOTAL PENGELUARAN": 0,
      pengeluaranList: [],
      stokBahan: {},
    },
    loading: false,
    user: { nama: "Budi", role: "staff" },
    isAdmin: false,
    viewportMode: "mobile",
    isEdit: false,
    onChange: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    onCancel: vi.fn(),
    availableBahan: [
      { ID_BAHAN: "B-1", NAMA_BAHAN: "Gelas Cup", SATUAN: "Cup", STATUS: "Aktif" },
      { ID_BAHAN: "B-2", NAMA_BAHAN: "Teh", SATUAN: "Bungkus", STATUS: "Aktif" },
    ],
    availableTipePengeluaran: ["Es Batu", "Air Galon"],
    availableBranches: ["Cabang Utama", "Cabang 2"],
    availableStaff: ["Budi", "Siti"],
  };

  it("renders wizard mode with visual progress bar on mobile/tablet viewports", () => {
    render(<ReportForm {...defaultProps} viewportMode="mobile" />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText(/Langkah 1 dari 4/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Lompat ke Info Outlet/i })).not.toBeInTheDocument();

    // Floating navigation bar buttons with text labels
    expect(screen.getByRole("button", { name: /^kembali$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^kembali$/i })).toHaveTextContent(/kembali/i);
    expect(screen.getByRole("button", { name: /lanjut/i })).toBeInTheDocument();
  });

  it("renders standard single-page layout without stepper or floating bar on desktop viewport", () => {
    render(<ReportForm {...defaultProps} viewportMode="desktop" />);

    // No stepper
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    // All sections are simultaneously visible
    expect(screen.getByText(/1\. Informasi Outlet & Jadwal/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Stok Bahan Baku/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Pengeluaran Operasional/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Kas Setoran & Rangkuman Finansial/i)).toBeInTheDocument();

    // Desktop submit button
    expect(screen.getByRole("button", { name: /kirim laporan harian/i })).toBeInTheDocument();
  });

  it("allows advancing through steps in wizard mode via navigation buttons", () => {
    render(<ReportForm {...defaultProps} viewportMode="mobile" />);

    // Starts on Step 1
    expect(screen.getByText(/1\. Informasi Outlet & Jadwal/i)).toBeInTheDocument();
    expect(screen.queryByText(/2\. Stok Bahan Baku/i)).not.toBeInTheDocument();

    const nextBtn = screen.getByRole("button", { name: /lanjut/i });

    // Advance to Step 2
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Langkah 2 dari 4/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Stok Bahan Baku/i)).toBeInTheDocument();
    expect(screen.queryByText(/1\. Informasi Outlet & Jadwal/i)).not.toBeInTheDocument();

    // Advance to Step 3
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    expect(screen.getByText(/Langkah 3 dari 4/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Pengeluaran Operasional/i)).toBeInTheDocument();

    // Advance to Step 4
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    expect(screen.getByText(/Langkah 4 dari 4/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Kas Setoran & Rangkuman Finansial/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kirim laporan/i })).toBeInTheDocument();
  });

  it("locks date input in edit mode", () => {
    render(<ReportForm {...defaultProps} isEdit={true} />);

    const dateInput = screen.getByLabelText(/Tanggal Laporan/i);
    expect(dateInput).toBeDisabled();
    expect(screen.getByText(/Tanggal tidak dapat diubah pada mode edit/i)).toBeInTheDocument();
  });

  it("locks staff input for staff user and allows selection for admin", () => {
    const { rerender } = render(<ReportForm {...defaultProps} isAdmin={false} />);

    const staffInput = screen.getByDisplayValue("Budi");
    expect(staffInput).toBeDisabled();
    expect(screen.getByText(/Otomatis dari akun Anda \(Terkunci\)/i)).toBeInTheDocument();

    // Rerender as admin
    rerender(<ReportForm {...defaultProps} isAdmin={true} user={{ nama: "Admin", role: "admin" }} />);
    // In admin mode, it renders a CustomSelect dropdown instead of disabled text input
    expect(screen.queryByText(/Otomatis dari akun Anda \(Terkunci\)/i)).not.toBeInTheDocument();
  });

  it("displays empty state when availableBahan from sheet is empty", () => {
    render(
      <ReportForm
        {...defaultProps}
        viewportMode="desktop"
        availableBahan={[]}
      />
    );

    expect(screen.getByText(/Belum ada bahan baku terdaftar di Master Data/i)).toBeInTheDocument();
    // Ensures no hardcoded dummy items like Gelas Cup, Es Batu are displayed
    expect(screen.queryByLabelText("Gelas Awal")).not.toBeInTheDocument();
  });

  it("displays empty state when availableBranches is empty", () => {
    render(
      <ReportForm
        {...defaultProps}
        viewportMode="desktop"
        availableBranches={[]}
      />
    );

    expect(screen.getByText(/Belum ada cabang di Master Sheet/i)).toBeInTheDocument();
  });

  it("uses text input for expense type when availableTipePengeluaran is empty", () => {
    const onChangeMock = vi.fn();
    render(
      <ReportForm
        {...defaultProps}
        viewportMode="desktop"
        value={{
          ...defaultProps.value,
          pengeluaranList: [{ id: "exp-1", tipe: "Beli Es", nominal: "15000", keterangan: "" }],
        }}
        availableTipePengeluaran={[]}
        onChange={onChangeMock}
      />
    );

    // If options are empty, it renders an input type text instead of select
    const tipeInput = screen.getByPlaceholderText(/Tipe pengeluaran/i);
    expect(tipeInput).toBeInTheDocument();
    expect(tipeInput.tagName).toBe("INPUT");
  });

  it("places submit button at bottom of Step 4 and uses text navigation buttons", () => {
    const onSubmitMock = vi.fn((e) => e.preventDefault());
    render(<ReportForm {...defaultProps} viewportMode="mobile" onSubmit={onSubmitMock} />);

    // On Step 1: Navigation buttons with visible text labels
    const prevBtn = screen.getByRole("button", { name: /^kembali$/i });
    const nextBtn = screen.getByRole("button", { name: /^lanjut$/i });
    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
    expect(prevBtn).toHaveTextContent(/kembali/i);
    expect(nextBtn).toHaveTextContent(/lanjut/i);
    expect(screen.getByText(/Langkah 1 dari 4/i)).toBeInTheDocument();

    // Submit button is NOT on Step 1 (it is placed at the bottom of Step 4)
    expect(screen.queryByRole("button", { name: /kirim laporan/i })).not.toBeInTheDocument();

    // Clicking Lanjut advances through steps without triggering submit
    fireEvent.click(nextBtn);
    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Langkah 2 dari 4/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Stok Bahan Baku/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^lanjut$/i }));
    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Langkah 3 dari 4/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Pengeluaran Operasional/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^lanjut$/i }));
    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Langkah 4 dari 4/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Kas Setoran & Rangkuman Finansial/i)).toBeInTheDocument();

    // On Step 4: Submit button is now present at the bottom of Step 4
    const submitBtn = screen.getByRole("button", { name: /kirim laporan/i });
    expect(submitBtn).toBeInTheDocument();

    // Clicking submit button triggers onSubmit
    fireEvent.click(submitBtn);
    expect(onSubmitMock).toHaveBeenCalledTimes(1);

    // On Step 4 the floating next button is replaced by a hint (submit lives in section)
    expect(screen.queryByRole("button", { name: /^lanjut$/i })).not.toBeInTheDocument();
    // Back button with text still available on Step 4
    expect(screen.getByRole("button", { name: /^kembali$/i })).toHaveTextContent(/kembali/i);
  });

  it("locks tanggal for staff but keeps it editable for admin", () => {
    const { rerender } = render(<ReportForm {...defaultProps} isAdmin={false} />);
    expect(screen.getByLabelText(/Tanggal Laporan/i)).toBeDisabled();

    rerender(<ReportForm {...defaultProps} isAdmin={true} user={{ nama: "Admin", role: "admin" }} />);
    expect(screen.getByLabelText(/Tanggal Laporan/i)).not.toBeDisabled();
  });

  it("defaults cabang to user penugasan when available", () => {
    render(
      <ReportForm
        {...defaultProps}
        viewportMode="desktop"
        value={{ ...defaultProps.value, CABANG: "", "ARUS DANA": "" }}
        user={{ nama: "Joko", role: "staff", cabang: "Cabang 2" }}
        isAdmin={false}
      />
    );
    expect(screen.getByText("Cabang 2")).toBeInTheDocument();
  });
});

