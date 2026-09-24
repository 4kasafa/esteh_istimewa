import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import KaryawanPanel from "./KaryawanPanel";

describe("KaryawanPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders users from props without fetching read_master", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});

    render(
      <KaryawanPanel
        selectedBranch="Semua"
        branches={["cabang_01", "cabang_02"]}
        users={[
          { ID: "USR-1", "NAMA / USERNAME": 12345, ROLE: "Staff", "NO. TELEPON": 812345678 },
          { ID: "USR-2", "NAMA / USERNAME": null, ROLE: "Admin" },
          { ID: "USR-3", "NAMA / USERNAME": "", ROLE: "Staff" },
          { ID: "USR-4", "NAMA / USERNAME": "Siti Rahma", ROLE: "Staff" },
        ]}
        request={mockRequest}
      />
    );

    expect(screen.getByText("Siti Rahma")).toBeInTheDocument();
    expect(screen.queryByText("Terverifikasi")).not.toBeInTheDocument();

    // Verify initials for numeric name '12345'
    expect(screen.getByText("12")).toBeInTheDocument();
    // Verify initials for "Siti Rahma"
    expect(screen.getByText("SR")).toBeInTheDocument();

    // Panel tidak lagi memanggil read_master sendiri saat mount.
    expect(mockRequest).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "read_master" })
    );
  });

  it("renders raw rows with unusual shapes without throwing", () => {
    const mockRequest = vi.fn().mockResolvedValue({});

    expect(() => {
      render(
        <KaryawanPanel
          selectedBranch="Semua"
          branches={[]}
          users={[
            { id: 99, nama: 998877, role: null, shift: null, telepon: 8213344 },
            { id: "EMP-2", nama: undefined },
          ]}
          request={mockRequest}
        />
      );
    }).not.toThrow();

    expect(screen.getByText("998877")).toBeInTheDocument();
    expect(screen.getAllByText("99").length).toBeGreaterThanOrEqual(1);
  });

  it("allows deleting an employee with confirmation dialog", async () => {
    const mockRequest = vi.fn().mockImplementation((payload) => {
      if (payload.action === "update_master" && payload.operation === "delete") {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({});
    });

    const mockReload = vi.fn().mockResolvedValue();

    render(
      <KaryawanPanel
        selectedBranch="Semua"
        branches={["cabang_01"]}
        users={[
          { ID: "USR-1", "NAMA / USERNAME": "Admin Bos", ROLE: "Admin" },
          { ID: "USR-2", "NAMA / USERNAME": "Budi Staff", ROLE: "Staff" },
        ]}
        request={mockRequest}
        user={{ nama: "Admin Bos", role: "Admin" }}
        onReloadMaster={mockReload}
      />
    );

    expect(screen.getByText("Budi Staff")).toBeInTheDocument();

    // Delete button should not exist for Admin Bos (self)
    expect(screen.queryByLabelText("Hapus Admin Bos")).not.toBeInTheDocument();

    // Delete button should exist for Budi Staff
    const deleteBtn = screen.getByLabelText("Hapus Budi Staff");
    expect(deleteBtn).toBeInTheDocument();

    // Click delete
    deleteBtn.click();

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByText("Hapus Karyawan?")).toBeInTheDocument();
    });

    // Click confirm "Hapus Karyawan" button
    const confirmBtn = screen.getByRole("button", { name: "Hapus Karyawan" });
    confirmBtn.click();

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "update_master",
          target: "user",
          operation: "delete",
          id: "USR-2",
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/berhasil dihapus/i)).toBeInTheDocument();
    });

    expect(mockReload).toHaveBeenCalled();
  });
});
