import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function mockSuccess(data) {
  return Promise.resolve({
    json: () => Promise.resolve({ success: true, data }),
  });
}

function createDefaultGasMock() {
  let createdReport = null;
  // Simulasi server: item yang dibuat via update_master ikut terbaca ulang.
  const dynamicUsers = [];
  const dynamicCabang = [];

  return vi.fn((_, options) => {
    let payload = {};
    try {
      payload = JSON.parse(options?.body || "{}");
    } catch {
      payload = {};
    }

    const action = payload.action;

    if (action === "login") {
      const username = String(payload.username || "").toLowerCase();
      const password = String(payload.password || "");

      if (username === "admin" && password === "wrongpassword") {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: false,
            message: "Password salah untuk username admin.",
          }),
        });
      }

      if (username === "admin" && (password === "admin" || password === "123456")) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              token: "token-admin",
              user: { username: "admin", nama: "Admin Istimewa", role: "admin", cabang: "Semua Cabang" },
            },
          }),
        });
      }

      if (username === "joko" || username.includes("staff")) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              token: "token-staff",
              user: { username: "joko", nama: "Joko", role: "staff", cabang: "cabang_01" },
              lastTodayReport: "",
            },
          }),
        });
      }

      return Promise.resolve({
        json: () => Promise.resolve({
          success: false,
          message: "Username atau password salah.",
        }),
      });
    }

    if (action === "logout") {
      createdReport = null;
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: null }),
      });
    }

    if (action === "read" || action === "read_reports") {
      const data = createdReport ? [createdReport] : [];
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data }),
      });
    }

    if (action === "read_database" || action === "get_summary") {
      const rows = createdReport ? [createdReport] : [];
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: {
            rows,
            kpi: { totalPenjualan: 0, totalPengeluaran: 0, totalSetoran: 0, jumlahLaporan: rows.length },
          },
        }),
      });
    }

    if (action === "read_master") {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: {
            users: [
              { USERNAME: "admin", NAMA: "Admin Istimewa", ROLE: "admin", CABANG: "Semua Cabang" },
              { USERNAME: "joko", NAMA: "Joko", ROLE: "staff", CABANG: "cabang_01" },
              { USERNAME: "abu", NAMA: "Abu Arfan", ROLE: "staff", CABANG: "cabang_01" },
              { USERNAME: "arief", NAMA: "Arief Rahman", ROLE: "staff", CABANG: "cabang_02" },
              ...dynamicUsers,
            ],
            cabang: [
              { ID_CABANG: "CAB-01", NAMA_CABANG: "cabang_01", ALAMAT: "Jl. Ahmad Yani" },
              { ID_CABANG: "CAB-02", NAMA_CABANG: "cabang_02", ALAMAT: "Jl. Sudirman" },
              ...dynamicCabang,
            ],
            bahanBaku: [
              { ID_BAHAN: "BAHAN-01", NAMA_BAHAN: "Gelas Cup", SATUAN: "Cup" },
              { ID_BAHAN: "BAHAN-02", NAMA_BAHAN: "Es Batu", SATUAN: "Plastik" },
              { ID_BAHAN: "BAHAN-03", NAMA_BAHAN: "Teh", SATUAN: "Bungkus" },
              { ID_BAHAN: "BAHAN-04", NAMA_BAHAN: "Gula", SATUAN: "Kg" },
            ],
            tipePengeluaran: [
              { ID_TIPE: "EXP-01", NAMA_TIPE: "Beli Es Batu" },
              { ID_TIPE: "EXP-02", NAMA_TIPE: "Air Galon" },
              { ID_TIPE: "EXP-03", NAMA_TIPE: "Plastik / Sedotan" },
              { ID_TIPE: "EXP-04", NAMA_TIPE: "Operasional Lain-lain" },
            ],
          },
        }),
      });
    }

    if (action === "get_initial_form_data") {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: {
            cabangList: [
              { ID_CABANG: "CAB-01", NAMA_CABANG: "cabang_01" },
              { ID_CABANG: "CAB-02", NAMA_CABANG: "cabang_02" },
            ],
            bahanBakuList: [
              { ID_BAHAN: "BAHAN-01", NAMA_BAHAN: "Gelas Cup", SATUAN: "Cup" },
              { ID_BAHAN: "BAHAN-02", NAMA_BAHAN: "Es Batu", SATUAN: "Plastik" },
              { ID_BAHAN: "BAHAN-03", NAMA_BAHAN: "Teh", SATUAN: "Bungkus" },
              { ID_BAHAN: "BAHAN-04", NAMA_BAHAN: "Gula", SATUAN: "Kg" },
            ],
            tipePengeluaranList: [
              { ID_TIPE: "EXP-01", NAMA_TIPE: "Beli Es Batu" },
              { ID_TIPE: "EXP-02", NAMA_TIPE: "Air Galon" },
              { ID_TIPE: "EXP-03", NAMA_TIPE: "Plastik / Sedotan" },
              { ID_TIPE: "EXP-04", NAMA_TIPE: "Operasional Lain-lain" },
            ],
            yesterdayStock: {},
          },
        }),
      });
    }

    if (action === "update_master") {
      const op = String(payload.operation || "").toLowerCase();
      const target = String(payload.target || "").toLowerCase();
      const d = payload.data || {};
      if (op === "create" && target === "user") {
        const created = {
          ID: `USR-${100 + dynamicUsers.length}`,
          "NAMA / USERNAME": d["NAMA / USERNAME"] || d.USERNAME || "",
          USERNAME: d.USERNAME || d["NAMA / USERNAME"] || "",
          "NO. TELEPON": d["NO. TELEPON"] || "-",
          ROLE: d.ROLE || "Staff",
          STATUS: d.STATUS || "Aktif",
          CABANG: d.CABANG || "cabang_01",
        };
        dynamicUsers.push(created);
        return mockSuccess(created);
      }
      if (op === "create" && target === "cabang") {
        const created = {
          ID_CABANG: `CAB-${10 + dynamicCabang.length}`,
          NAMA_CABANG: d.NAMA_CABANG || "",
          ALAMAT: d.ALAMAT || "-",
          STATUS: d.STATUS || "Aktif",
        };
        dynamicCabang.push(created);
        return mockSuccess(created);
      }
      return mockSuccess(null);
    }

    if (action === "create" || action === "create_report") {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = now.getFullYear();
      const todayTimestamp = `${dd}-${mm}-${yyyy} 10:00:00`;
      const id = payload.data?.["ID TRANSAKSI"] || payload.data?.["NO TRANSAKSI"] || `TRX-${yyyy}${mm}${dd}-001`;

      createdReport = {
        ...payload.data,
        "ID TRANSAKSI": id,
        "NO TRANSAKSI": id,
        "TIME STAMP INPUT": todayTimestamp,
        TANGGAL: `${yyyy}-${mm}-${dd}`,
        "WAKTU INPUT": "10:00:00",
      };
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: createdReport }),
      });
    }

    if (action === "update" || action === "update_report") {
      createdReport = { ...createdReport, ...payload.data };
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: createdReport }),
      });
    }

    return Promise.resolve({
      json: () => Promise.resolve({ success: true, data: [] }),
    });
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
    vi.stubGlobal("fetch", createDefaultGasMock());
  });

  it("renders login and can login to dashboard", async () => {
    vi.stubGlobal("fetch", vi.fn((_, options) => {
      const payload = JSON.parse(options.body);
      if (payload.action === "login") {
        return mockSuccess({
          token: "token-123",
          user: { nama: "Staff Test", role: "staff" },
        });
      }
      if (payload.action === "read" || payload.action === "read_reports") {
        return mockSuccess([{ id: 1, STAFF: "Staff Test" }]);
      }
      return mockSuccess([]);
    }));

    render(<App />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "staff@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("token-123");
      expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
    });
  });

  it("uses lastTodayReport as read id for staff initial load", async () => {
    const fetchMock = vi.fn((_, options) => {
      const payload = JSON.parse(options.body);
      if (payload.action === "login") {
        return mockSuccess({
          token: "token-456",
          user: { nama: "Staff Test", role: "staff" },
          lastTodayReport: "04-03-2026 09:10:11",
        });
      }
      if (payload.action === "read" || payload.action === "read_reports") {
        return mockSuccess([{ id: 2, STAFF: "Staff Test" }]);
      }
      return mockSuccess([]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { target: { value: "staff@test.com" }, value: "staff@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      const readCalls = fetchMock.mock.calls
        .map((call) => JSON.parse(call[1].body))
        .filter((payload) => payload.action === "read" || payload.action === "read_reports");
      expect(readCalls.some((payload) => payload.id === "04-03-2026 09:10:11")).toBe(true);
    });
  });

  it("displays branch filter with default 'Semua Cabang' and allows filtering by cabang_01 and cabang_02", async () => {
    render(<App />);

    loginAsAdmin();

    await waitFor(() => {
      expect(screen.getAllByText(/Semua Cabang/i).length).toBeGreaterThan(0);
    });

    // Click branch dropdown button in Topbar
    const branchTrigger = screen.getByTitle(/pilih filter cabang/i);
    expect(branchTrigger).toBeInTheDocument();
    fireEvent.click(branchTrigger);

    // Verify dropdown items
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cabang_01/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cabang_02/i })).toBeInTheDocument();
    });

    // Select cabang_01
    fireEvent.click(screen.getByRole("button", { name: /cabang_01/i }));

    // Topbar button updates to cabang_01
    const updatedTrigger = screen.getByTitle(/pilih filter cabang/i);
    expect(updatedTrigger).toHaveTextContent(/cabang_01/i);
  });

  it("opens Pemasukan menu without error and populates dynamic branches and fields", async () => {
    render(<App />);

    loginAsAdmin();

    await waitFor(() => {
      expect(screen.getAllByText(/Semua Cabang/i).length).toBeGreaterThan(0);
    });

    // Click Pemasukan menu in sidebar
    fireEvent.click(screen.getByRole("button", { name: /^pemasukan$/i }));

    // Verify form opened
    expect(screen.getByRole("heading", { level: 2, name: /laporan baru/i })).toBeInTheDocument();
    expect(screen.getByText(/Gelas Cup/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Uang Setoran/i).length).toBeGreaterThan(0);
  });

  it("staff only sees 'Laporan Hari Ini' menu, default 0 reports, switches to edit mode once reported, and resets on logout", async () => {
    render(<App />);

    loginAsStaff();

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("token-staff");
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

    // Fill minimal report form
    fireEvent.change(screen.getByLabelText("Stok Awal Gelas Cup"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Stok Sisa Gelas Cup"), { target: { value: "50" } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /kirim laporan harian|submit laporan/i });
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

    // Login as staff again -> report is reset
    loginAsStaff();

    await waitFor(() => {
      expect(screen.getByText("Belum ada laporan hari ini")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /buat laporan hari ini/i })).toBeInTheDocument();
    });
  });

  it("filters Karyawan by selected branch in navbar", async () => {
    render(<App />);

    // Login as admin
    loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pengeluaran/i })).toBeInTheDocument();
    });

    // Navigate to Karyawan
    fireEvent.click(screen.getByRole("button", { name: /^karyawan$/i }));
    expect(screen.getByText("Daftar Karyawan")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 4, name: "Abu Arfan" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 4, name: "Arief Rahman" })).toBeInTheDocument();
    });

    // Select cabang_01 in Topbar
    const branchTrigger = screen.getByTitle(/pilih filter cabang/i);
    fireEvent.click(branchTrigger);
    fireEvent.click(screen.getByRole("button", { name: /cabang_01/i }));

    // Only Abu Arfan should be in Karyawan list
    expect(screen.getByRole("heading", { level: 4, name: "Abu Arfan" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 4, name: "Arief Rahman" })).not.toBeInTheDocument();
  });

  it("displays Cabang menu and filters branches by selected branch in navbar", async () => {
    render(<App />);

    // Login as admin
    loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^cabang$/i })).toBeInTheDocument();
    });

    // Navigate to Cabang
    fireEvent.click(screen.getByRole("button", { name: /^cabang$/i }));
    expect(screen.getByText("Daftar Cabang")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 4, name: "Outlet Cabang 01" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 4, name: "Outlet Cabang 02" })).toBeInTheDocument();
    });

    // Select cabang_02 in Topbar
    const branchTrigger = screen.getByTitle(/pilih filter cabang/i);
    fireEvent.click(branchTrigger);
    fireEvent.click(screen.getByRole("button", { name: /cabang_02/i }));

    // Only Outlet Cabang 02 should be in Cabang list
    expect(screen.queryByRole("heading", { level: 4, name: "Outlet Cabang 01" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Outlet Cabang 02" })).toBeInTheDocument();
  });

  it("can add a new employee via Tambah Karyawan modal", async () => {
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

  it("calculates Gelas Cup stock consumption automatically from Stok Awal and Stok Sisa identical to other stock items", async () => {
    render(<App />);

    // Login as staff
    loginAsStaff();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^buat laporan hari ini$/i })).toBeInTheDocument();
    });

    // Open report form
    fireEvent.click(screen.getByRole("button", { name: /^buat laporan hari ini$/i }));
    expect(screen.getByRole("heading", { level: 2, name: "Laporan Baru" })).toBeInTheDocument();

    // Verify fields for Gelas Cup match standard stock items: Stok Awal and Stok Sisa
    await waitFor(() => {
      expect(screen.getByText("Gelas Cup")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Stok Awal Gelas Cup")).toBeInTheDocument();
    expect(screen.getByLabelText("Stok Sisa Gelas Cup")).toBeInTheDocument();

    // Verify custom legacy fields are removed
    expect(screen.queryByText(/^Gelas Rusak$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Gelas Laku$/i)).not.toBeInTheDocument();

    // Find inputs for Gelas Cup
    const awalInput = screen.getByLabelText("Stok Awal Gelas Cup");
    const sisaInput = screen.getByLabelText("Stok Sisa Gelas Cup");

    // Enter Stok Awal = 200, Stok Sisa = 50 -> Terpakai = 150 Cup
    fireEvent.change(awalInput, { target: { value: "200" } });
    fireEvent.change(sisaInput, { target: { value: "50" } });

    // Verify auto-calculated badge: 200 - 50 = 150 Cup
    expect(screen.getByText("150 Cup")).toBeInTheDocument();

    // Change Stok Sisa to 22: 200 - 22 = 178 Cup
    fireEvent.change(sisaInput, { target: { value: "22" } });
    expect(screen.getByText("178 Cup")).toBeInTheDocument();
  });

  it("calculates and displays Total Penjualan as a non-dash numeric value from report input", async () => {
    render(<App />);

    // Login as staff
    loginAsStaff();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^buat laporan hari ini$/i })).toBeInTheDocument();
    });

    // Click "Buat Laporan Hari Ini"
    fireEvent.click(screen.getByRole("button", { name: /^buat laporan hari ini$/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Stok Awal Gelas Cup")).toBeInTheDocument();
    });

    // Input Gelas: Awal=100, Sisa=50 -> Terpakai = 50 Cup
    fireEvent.change(screen.getByLabelText("Stok Awal Gelas Cup"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Stok Sisa Gelas Cup"), { target: { value: "50" } });

    expect(screen.getByText("50 Cup")).toBeInTheDocument();

    // Input Uang Setoran = 164000
    fireEvent.change(screen.getByLabelText(/Uang Setoran/i), { target: { value: "164000" } });

    // Submit report
    const submitBtn = screen.getByRole("button", { name: /kirim laporan harian|submit laporan/i });
    fireEvent.submit(submitBtn.closest("form"));

    // Verify returning to report list and Total Penjualan is Rp 164.000 (not '-')
    await waitFor(() => {
      expect(screen.getByText("Menampilkan 1 entri data")).toBeInTheDocument();
      expect(screen.getAllByText(/50 Cup/i).length).toBeGreaterThan(0);
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
    render(<App />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("token-admin");
    });

    // Nama admin tampil di popup Info Akun (panel form lazy-mount).
    fireEvent.click(screen.getByTitle("Info Akun"));
    expect(screen.getByText("Admin Istimewa")).toBeInTheDocument();
  });

  it("can login with dummy staff account (joko / joko)", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "joko" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "joko" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(localStorage.getItem("gas_token")).toBe("token-staff");
      expect(JSON.parse(localStorage.getItem("gas_user")).nama).toBe("Joko");
      expect(screen.getAllByText(/Laporan Hari Ini/i).length).toBeGreaterThan(0);
    });

    // Verify account info displays Joko when opened
    fireEvent.click(screen.getByTitle("Info Akun"));
    expect(screen.getAllByText("Joko").length).toBeGreaterThan(0);
  });

  it("shows error alert on invalid username/password", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByText(/password salah untuk username admin/i)).toBeInTheDocument();
    });
  });

  it("displays Stok Bahan menu for admin and navigates to Stok panel", async () => {
    render(<App />);

    loginAsAdmin();

    const stokBtn = await screen.findByRole("button", { name: /^stok bahan$/i });
    expect(stokBtn).toBeInTheDocument();

    fireEvent.click(stokBtn);

    await waitFor(() => {
      expect(screen.getByText("Jenis Bahan")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Gelas Cup/i).length).toBeGreaterThan(0);
    });
  });
});
