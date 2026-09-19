import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function mockSuccess(data) {
  return Promise.resolve({
    json: () => Promise.resolve({ success: true, data }),
  });
}

function loginAsAdmin() {
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
  fireEvent.click(screen.getByRole("button", { name: /masuk/i }));
}

function loginAsStaff() {
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "joko" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "joko" } });
  fireEvent.click(screen.getByRole("button", { name: /masuk/i }));
}

describe("App smoke", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders login and can login to dashboard", async () => {
    vi.stubGlobal("fetch", vi.fn((_, options) => {
      const payload = JSON.parse(options.body);
      if (payload.action === "login") {
        return mockSuccess({
          token: "token-123",
          user: { nama: "Kasir Test", role: "kasir" },
        });
      }
      if (payload.action === "read") {
        return mockSuccess([{ id: 1, KASIR: "Kasir Test" }]);
      }
      return mockSuccess([]);
    }));

    render(<App />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "kasir@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("token-123");
      expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
    });
  });

  it("uses lastTodayReport as read id for kasir initial load", async () => {
    const fetchMock = vi.fn((_, options) => {
      const payload = JSON.parse(options.body);
      if (payload.action === "login") {
        return mockSuccess({
          token: "token-456",
          user: { nama: "Kasir Test", role: "kasir" },
          lastTodayReport: "04-03-2026 09:10:11",
        });
      }
      if (payload.action === "read") {
        return mockSuccess([{ id: 2, KASIR: "Kasir Test" }]);
      }
      return mockSuccess([]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { target: { value: "kasir@test.com" }, value: "kasir@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("token-456");
    });

    const readCalls = fetchMock.mock.calls
      .map((call) => JSON.parse(call[1].body))
      .filter((payload) => payload.action === "read");

    expect(readCalls.some((payload) => payload.id === "04-03-2026 09:10:11")).toBe(true);
  });

  it("displays branch filter with default 'Semua Cabang' and allows filtering by cabang_01 and cabang_02", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText(/Semua Cabang/i)).toBeInTheDocument();
    });

    // Click branch dropdown button in Topbar
    const branchTrigger = screen.getByTitle(/pilih filter cabang/i);
    expect(branchTrigger).toBeInTheDocument();
    fireEvent.click(branchTrigger);

    // Verify dropdown items
    expect(screen.getByRole("button", { name: /cabang_01/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cabang_02/i })).toBeInTheDocument();

    // Select cabang_01
    fireEvent.click(screen.getByRole("button", { name: /cabang_01/i }));

    // Topbar header updates to cabang_01
    expect(screen.getByRole("heading", { level: 2, name: /cabang_01/i })).toBeInTheDocument();
  });

  it("staff only sees 'Laporan Hari Ini' menu, default 0 reports, switches to edit mode once reported, and resets on logout", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    loginAsStaff();

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("bypass-staff");
      expect(screen.getAllByText(/Laporan Hari Ini/i).length).toBeGreaterThan(0);
    });

    // Staff ONLY sees "Laporan Hari Ini" menu in sidebar
    expect(screen.getByRole("button", { name: /^laporan hari ini$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^pemasukan$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^pengeluaran$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^karyawan$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^cabang$/i })).not.toBeInTheDocument();

    // Staff mode does NOT have branch filter options in navbar/topbar
    expect(screen.queryByTitle(/pilih filter cabang/i)).not.toBeInTheDocument();
    expect(screen.getByText("Panel Staff")).toBeInTheDocument();

    // Default: 0 reports for today
    expect(screen.getByText("Belum ada laporan hari ini")).toBeInTheDocument();
    const createBtn = screen.getByRole("button", { name: /^buat laporan hari ini$/i });
    expect(createBtn).toBeInTheDocument();

    // Click "Buat Laporan Hari Ini" to create new report
    fireEvent.click(createBtn);

    // Form opens in create mode
    expect(screen.getByRole("heading", { level: 2, name: "Laporan Baru" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kembali ke laporan/i })).toBeInTheDocument();

    // Submit form (mock request creates report)
    const submitBtn = screen.getByRole("button", { name: /submit laporan/i });
    fireEvent.click(submitBtn);

    // After submit, returned to Laporan Hari Ini
    await waitFor(() => {
      expect(screen.getByText("Menampilkan 1 entri data")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edit laporan hari ini/i })).toBeInTheDocument();
    });

    // Clicking "Edit Laporan Hari Ini" opens form in Edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit laporan hari ini/i }));
    expect(screen.getByRole("heading", { level: 2, name: "Update Laporan" })).toBeInTheDocument();

    // Click kembali
    fireEvent.click(screen.getByRole("button", { name: /kembali ke laporan/i }));
    expect(screen.getByText("Menampilkan 1 entri data")).toBeInTheDocument();

    // Logout
    const accountTrigger = screen.getByTitle("Info Akun");
    fireEvent.click(accountTrigger);
    const logoutBtn = await screen.findByRole("button", { name: /logout \/ keluar/i });
    fireEvent.click(logoutBtn);
    const confirmLogout = await screen.findByRole("button", { name: /^ya$/i });
    fireEvent.click(confirmLogout);

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Login as staff again -> report is reset (gone)!
    loginAsStaff();

    await waitFor(() => {
      expect(screen.getByText("Belum ada laporan hari ini")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /buat laporan hari ini/i })).toBeInTheDocument();
    });
  });

  it("filters Karyawan by selected branch in navbar", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    // Login as admin to test all menus including Pengeluaran
    loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pengeluaran/i })).toBeInTheDocument();
    });

    // Navigate to Karyawan
    fireEvent.click(screen.getByRole("button", { name: /^karyawan$/i }));
    expect(screen.getByText("Daftar Karyawan")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Abu Arfan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Arief Rahman" })).toBeInTheDocument();

    // Select cabang_01 in Topbar
    const branchTrigger = screen.getByTitle(/pilih filter cabang/i);
    fireEvent.click(branchTrigger);
    fireEvent.click(screen.getByRole("button", { name: /cabang_01/i }));

    // Only Abu Arfan should be in Karyawan list
    expect(screen.getByRole("heading", { level: 4, name: "Abu Arfan" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 4, name: "Arief Rahman" })).not.toBeInTheDocument();
  });

  it("displays Cabang menu and filters branches by selected branch in navbar", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    // Login as admin
    loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^cabang$/i })).toBeInTheDocument();
    });

    // Navigate to Cabang
    fireEvent.click(screen.getByRole("button", { name: /^cabang$/i }));
    expect(screen.getByText("Daftar Cabang")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Outlet Cabang 01" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Outlet Cabang 02" })).toBeInTheDocument();

    // Select cabang_02 in Topbar
    const branchTrigger = screen.getByTitle(/pilih filter cabang/i);
    fireEvent.click(branchTrigger);
    fireEvent.click(screen.getByRole("button", { name: /cabang_02/i }));

    // Only Outlet Cabang 02 should be in Cabang list
    expect(screen.queryByRole("heading", { level: 4, name: "Outlet Cabang 01" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Outlet Cabang 02" })).toBeInTheDocument();
  });

  it("can add a new employee via Tambah Karyawan modal", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    // Login as admin
    loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^karyawan$/i })).toBeInTheDocument();
    });

    // Navigate to Karyawan
    fireEvent.click(screen.getByRole("button", { name: /^karyawan$/i }));
    expect(screen.getByText("Daftar Karyawan")).toBeInTheDocument();

    // Click Tambah Karyawan
    const addBtn = screen.getByRole("button", { name: /tambah karyawan/i });
    fireEvent.click(addBtn);

    // Modal opens
    expect(screen.getByRole("heading", { level: 3, name: "Tambah Karyawan" })).toBeInTheDocument();

    // Fill form
    const namaInput = screen.getByPlaceholderText(/budi pratama/i);
    fireEvent.change(namaInput, { target: { value: "Siti Rahma" } });

    // Submit form
    const saveBtn = screen.getByRole("button", { name: /simpan karyawan/i });
    fireEvent.click(saveBtn);

    // Verify modal closes and new employee is rendered in the list
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 4, name: "Siti Rahma" })).toBeInTheDocument();
    });
  });

  it("can add a new branch via Tambah Cabang modal", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    // Login as admin
    loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^cabang$/i })).toBeInTheDocument();
    });

    // Navigate to Cabang
    fireEvent.click(screen.getByRole("button", { name: /^cabang$/i }));
    expect(screen.getByText("Daftar Cabang")).toBeInTheDocument();

    // Click Tambah Cabang
    const addBtn = screen.getByRole("button", { name: /tambah cabang/i });
    fireEvent.click(addBtn);

    // Modal opens
    expect(screen.getByRole("heading", { level: 3, name: "Tambah Cabang Baru" })).toBeInTheDocument();

    // Fill form
    const namaInput = screen.getByPlaceholderText(/outlet cabang 03/i);
    fireEvent.change(namaInput, { target: { value: "Outlet Cabang 03" } });

    // Submit form
    const saveBtn = screen.getByRole("button", { name: /simpan cabang/i });
    fireEvent.click(saveBtn);

    // Verify modal closes and new branch is rendered in the list
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 4, name: "Outlet Cabang 03" })).toBeInTheDocument();
    });
  });

  it("calculates Gelas Laku automatically from Gelas Awal, Sisa, and Rusak without manual input in report form", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    // Login as staff
    loginAsStaff();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^buat laporan hari ini$/i })).toBeInTheDocument();
    });

    // Open report form
    fireEvent.click(screen.getByRole("button", { name: /^buat laporan hari ini$/i }));
    expect(screen.getByRole("heading", { level: 2, name: "Laporan Baru" })).toBeInTheDocument();

    // Verify fields: Gelas Awal, Gelas Sisa, Gelas Rusak, Gelas Laku
    expect(screen.getByText(/^Gelas Awal$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Gelas Sisa$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Gelas Rusak$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Gelas Laku$/i)).toBeInTheDocument();

    // Verify Gelas Laku has no text/number input field
    expect(screen.queryByRole("spinbutton", { name: /^gelas laku$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /^gelas laku$/i })).not.toBeInTheDocument();

    // Find inputs for Gelas Awal, Sisa, Rusak
    const awalInput = screen.getByLabelText("Gelas Awal");
    const sisaInput = screen.getByLabelText("Gelas Sisa");
    const rusakInput = screen.getByLabelText("Gelas Rusak");

    // Enter Gelas Awal = 200, Gelas Sisa = 48, Gelas Rusak = 2
    fireEvent.change(awalInput, { target: { value: "200" } });
    fireEvent.change(sisaInput, { target: { value: "48" } });
    fireEvent.change(rusakInput, { target: { value: "2" } });

    // Verify auto-calculated badge: 200 - 48 - 2 = 150 Cup
    expect(screen.getByText("150 Cup")).toBeInTheDocument();

    // Change Gelas Sisa to 20: 200 - 20 - 2 = 178 Cup
    fireEvent.change(sisaInput, { target: { value: "20" } });
    expect(screen.getByText("178 Cup")).toBeInTheDocument();

    // Verify Total Penjualan calculation display
    expect(screen.getByText(/178 Cup × Rp 4.000/i)).toBeInTheDocument();
  });

  it("calculates and displays Total Penjualan as a non-dash numeric value from report input", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    // Login as staff
    loginAsStaff();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^buat laporan hari ini$/i })).toBeInTheDocument();
    });

    // Click "Buat Laporan Hari Ini"
    fireEvent.click(screen.getByRole("button", { name: /^buat laporan hari ini$/i }));

    // Input Gelas: Awal=100, Sisa=50, Rusak=9 -> Gelas Laku = 41 Cup
    fireEvent.change(screen.getByLabelText("Gelas Awal"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Gelas Sisa"), { target: { value: "50" } });
    fireEvent.change(screen.getByLabelText("Gelas Rusak"), { target: { value: "9" } });

    expect(screen.getByText("41 Cup")).toBeInTheDocument();
    expect(screen.getByText(/41 Cup × Rp 4.000/i)).toBeInTheDocument();

    // Submit report
    const submitBtn = screen.getByRole("button", { name: /submit laporan/i });
    fireEvent.submit(submitBtn.closest("form"));

    // Verify returning to report list and Total Penjualan is Rp 164.000 (not '-')
    await waitFor(() => {
      expect(screen.getByText("Menampilkan 1 entri data")).toBeInTheDocument();
      expect(screen.getAllByText(/41 Cup/i).length).toBeGreaterThan(0);
      // Total Penjualan must show Rp 164.000 and not '-'
      expect(screen.getAllByText(/Rp\s*164\.000/i).length).toBeGreaterThan(0);
    });
  });

  it("can toggle password visibility between password and text", () => {
    render(<App />);

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /lihat password/i });
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /sembunyikan password/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /sembunyikan password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("can login with dummy admin account (admin / admin)", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByText("Admin Istimewa")).toBeInTheDocument();
      expect(localStorage.getItem("gas_token")).toBe("bypass-admin");
    });
  });

  it("can login with dummy staff account (joko / joko)", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "joko" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "joko" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("bypass-staff");
      expect(JSON.parse(localStorage.getItem("gas_user")).nama).toBe("Joko");
      expect(screen.getAllByText(/Laporan Hari Ini/i).length).toBeGreaterThan(0);
    });

    // Verify account info displays Joko when opened
    fireEvent.click(screen.getByTitle("Info Akun"));
    expect(screen.getAllByText("Joko").length).toBeGreaterThan(0);
  });


  it("shows error alert on invalid username/password", async () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<App />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByText(/password salah untuk username admin/i)).toBeInTheDocument();
    });
  });
});

