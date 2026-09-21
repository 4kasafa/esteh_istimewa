import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SetupWizard from "./SetupWizard";
import SetupBanner from "./SetupBanner";

describe("SetupWizard Component (Per-Step Saving)", () => {
  it("renders null when open is false", () => {
    const { container } = render(<SetupWizard open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Step 1 (Cabang) by default when open is true", () => {
    render(<SetupWizard open={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Daftarkan Cabang \/ Outlet/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Outlet Cabang Pattimura/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lanjut/i })).toBeInTheDocument();
  });

  it("allows adding and removing dynamic rows in Step 1", () => {
    render(<SetupWizard open={true} onClose={vi.fn()} />);

    expect(screen.getByText("Cabang #1")).toBeInTheDocument();
    expect(screen.queryByText("Cabang #2")).not.toBeInTheDocument();

    // Add row
    const addRowBtn = screen.getByRole("button", { name: /Tambah Baris Cabang/i });
    fireEvent.click(addRowBtn);

    expect(screen.getByText("Cabang #2")).toBeInTheDocument();

    // Remove row
    const deleteBtns = screen.getAllByTitle(/Hapus baris ini/i);
    expect(deleteBtns.length).toBeGreaterThan(0);
    fireEvent.click(deleteBtns[0]);

    expect(screen.queryByText("Cabang #2")).not.toBeInTheDocument();
  });

  it("saves data per step, making newly added branch immediately available in Step 2 employee dropdown", async () => {
    const mockRequest = vi.fn().mockResolvedValue({ success: true });
    const mockFinish = vi.fn();
    const mockClose = vi.fn();

    render(
      <SetupWizard
        open={true}
        onClose={mockClose}
        onFinish={mockFinish}
        request={mockRequest}
        existingBranches={["Outlet Cabang Lama"]}
      />
    );

    // --- STEP 1: CABANG ---
    const branchNameInput = screen.getByPlaceholderText(/Outlet Cabang Pattimura/i);
    fireEvent.change(branchNameInput, { target: { value: "Outlet Pattimura Baru" } });

    // Click Lanjut -> Harusnya langsung simpan cabang ke API
    const lanjutBtnStep1 = screen.getByRole("button", { name: /Lanjut/i });
    fireEvent.click(lanjutBtnStep1);

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "update_master",
          target: "cabang",
          operation: "create",
          data: expect.objectContaining({
            NAMA_CABANG: "Outlet Pattimura Baru",
          }),
        })
      );
    });

    // --- STEP 2: KARYAWAN ---
    await waitFor(() => {
      expect(screen.getByText(/2\. Daftarkan Akun Karyawan \/ Staff/i)).toBeInTheDocument();
    });

    // Verifikasi bahwa cabang baru "Outlet Pattimura Baru" langsung ada di opsi dropdown karyawan!
    expect(screen.getByRole("option", { name: "Outlet Pattimura Baru" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Outlet Cabang Lama" })).toBeInTheDocument();

    const staffNameInput = screen.getByPlaceholderText(/Budi Santoso/i);
    fireEvent.change(staffNameInput, { target: { value: "Siti Rahma" } });

    // Click Lanjut -> Harusnya langsung simpan karyawan ke API
    const lanjutBtnStep2 = screen.getByRole("button", { name: /Lanjut/i });
    fireEvent.click(lanjutBtnStep2);

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "update_master",
          target: "user",
          operation: "create",
          data: expect.objectContaining({
            USERNAME: "Siti Rahma",
          }),
        })
      );
    });

    // --- STEP 3: BAHAN BAKU ---
    await waitFor(() => {
      expect(screen.getByText(/3\. Master Bahan Baku/i)).toBeInTheDocument();
    });

    const bahanInput = screen.getByPlaceholderText(/Gelas Cup, Teh Racik/i);
    fireEvent.change(bahanInput, { target: { value: "Teh Melati" } });

    const lanjutBtnStep3 = screen.getByRole("button", { name: /Lanjut/i });
    fireEvent.click(lanjutBtnStep3);

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "update_master",
          target: "bahan_baku",
          operation: "create",
          data: expect.objectContaining({
            NAMA_BAHAN: "Teh Melati",
          }),
        })
      );
    });

    // --- STEP 4: SELESAI ---
    await waitFor(() => {
      expect(screen.getByText(/🎉 Setup Awal Berhasil!/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText("Outlet Pattimura Baru").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Siti Rahma")).toBeInTheDocument();
    expect(screen.getByText("Teh Melati")).toBeInTheDocument();

    // Click Selesai / Masuk ke Dashboard
    const finishBtn = screen.getByRole("button", { name: /Masuk ke Dashboard Utama/i });
    fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(mockFinish).toHaveBeenCalled();
    });
  });

  it("calls onClose when Lewati Nanti is clicked", () => {
    const handleClose = vi.fn();
    render(<SetupWizard open={true} onClose={handleClose} />);

    const skipBtn = screen.getByRole("button", { name: /Lewati Nanti/i });
    fireEvent.click(skipBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe("SetupBanner Component", () => {
  it("renders with title and triggers start and dismiss callbacks", () => {
    const handleStart = vi.fn();
    const handleDismiss = vi.fn();

    render(<SetupBanner onStartWizard={handleStart} onDismiss={handleDismiss} />);

    expect(screen.getByText(/Setup Awal Operasional Belum Lengkap/i)).toBeInTheDocument();

    // Click Mulai
    const startBtn = screen.getByRole("button", { name: /Mulai Setup Wizard/i });
    fireEvent.click(startBtn);
    expect(handleStart).toHaveBeenCalledTimes(1);

    // Click Dismiss
    const dismissBtn = screen.getByRole("button", { name: /Tutup banner/i });
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
