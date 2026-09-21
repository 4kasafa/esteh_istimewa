import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import CabangPanel from "./CabangPanel";

describe("CabangPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders branches from master and allows deleting when multiple branches exist", async () => {
    const mockRequest = vi.fn().mockImplementation((payload) => {
      if (payload.action === "read_master") {
        return Promise.resolve({
          cabang: [
            { ID_CABANG: "CAB-01", NAMA_CABANG: "Cabang Utama", ALAMAT: "Jl. Merdeka No. 1", STATUS: "Aktif" },
            { ID_CABANG: "CAB-02", NAMA_CABANG: "Cabang Timur", ALAMAT: "Jl. Sudirman No. 2", STATUS: "Aktif" },
          ],
        });
      }
      if (payload.action === "update_master" && payload.operation === "delete") {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({});
    });

    const mockReload = vi.fn().mockResolvedValue();

    render(
      <CabangPanel
        selectedBranch="Semua"
        branches={["Cabang Utama", "Cabang Timur"]}
        request={mockRequest}
        onReloadMaster={mockReload}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Cabang Timur")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText("Hapus Cabang Timur");
    expect(deleteBtn).toBeInTheDocument();

    deleteBtn.click();

    await waitFor(() => {
      expect(screen.getByText("Hapus Cabang?")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: "Hapus Cabang" });
    confirmBtn.click();

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "update_master",
          target: "cabang",
          operation: "delete",
          id: "CAB-02",
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/berhasil dihapus/i)).toBeInTheDocument();
    });
  });

  it("prevents deletion if only one branch remains", async () => {
    const mockRequest = vi.fn().mockImplementation((payload) => {
      if (payload.action === "read_master") {
        return Promise.resolve({
          cabang: [
            { ID_CABANG: "CAB-01", NAMA_CABANG: "Cabang Tunggal", ALAMAT: "Jl. Merdeka No. 1", STATUS: "Aktif" },
          ],
        });
      }
      return Promise.resolve({});
    });

    render(
      <CabangPanel
        selectedBranch="Semua"
        branches={["Cabang Tunggal"]}
        request={mockRequest}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Cabang Tunggal")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText("Hapus Cabang Tunggal");
    deleteBtn.click();

    await waitFor(() => {
      expect(screen.getByText("Hapus Cabang?")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: "Hapus Cabang" });
    confirmBtn.click();

    await waitFor(() => {
      expect(screen.getByText(/Tidak dapat menghapus cabang terakhir/i)).toBeInTheDocument();
    });

    expect(mockRequest).not.toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update_master",
        target: "cabang",
        operation: "delete",
      })
    );
  });
});
