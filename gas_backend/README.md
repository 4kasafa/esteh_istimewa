# Gas Backend API (Google Apps Script) - Es Teh Istimewa

Backend ini menyediakan API modular berbasis Google Apps Script dengan arsitektur **Master Spreadsheet Terpusat + File Transaksi Bulanan Terpisah Otomatis di Google Drive**.

## 1. Arsitektur Google Drive & Google Sheets

```
Folder Google Drive Proyek:
 ├── [FILE 1] Master_Esteh (Spreadsheet Master Utama)
 │    ├── User                  (Akun login: ID, NAMA / USERNAME, NO. TELEPON, PASSWORD, ROLE [Admin/Staff], STATUS [Aktif/Non Aktif])
 │    ├── Cabang                (Daftar seluruh cabang/outlet aktif: ID_CABANG, NAMA_CABANG, ALAMAT, STATUS)
 │    ├── Bahan_Baku            (Master bahan baku: ID_BAHAN, NAMA_BAHAN, SATUAN)
 │    ├── Tipe_Pengeluaran      (Master kategori biaya: ID_TIPE, NAMA_TIPE)
 │    ├── Sumber_Pemasukan      (Daftar sumber pemasukan: ID_SUMBER, NAMA_SUMBER, STATUS)
 │    ├── List_File_Bulanan     (Katalog ID file spreadsheet bulanan yang otomatis dibuat sistem)
 │    └── Sessions              (Manajemen token autentikasi & sesi login aktif)
 │
 ├── [FILE 2] Esteh - Laporan Bulanan 2026-03 (Otomatis dibuat oleh GAS di folder yang sama)
 │    ├── Transaksi             (Pemasukan setoran & penjualan harian staff, 1 baris per laporan)
 │    ├── Pengeluaran           (Itemized rincian pengeluaran operasional per transaksi)
 │    ├── Rekapitulasi          (Formula SUMIFS per cabang & SUMIF pengeluaran bulan tersebut)
 │    └── Log_Aplikasi          (Catatan aktivitas input & modifikasi sistem)
 │
 └── [FILE 3] Esteh - Laporan Bulanan YYYY-MM (Otomatis dibuat saat memasuki bulan baru)
```

## 2. Struktur Modul Backend

- `Config.js`: Konfigurasi SPREADSHEET_ID master, zona waktu Asia/Jakarta, session TTL, default master data.
- `ResponseHelper.js`: Helper format JSON response seragam (`{ success, data, message, timestamp }`), sanitizer, parser angka/tanggal.
- `SheetRepository.js`: Gateway I/O Master Spreadsheet & pembuat File Bulanan otomatis di Google Drive dengan formula Rekapitulasi otomatis.
- `AuthService.js`: Autentikasi Username & Password, Session token UUID di tab Sessions, role guard (admin / staff).
- `MasterService.js`: CRUD data master (User, Cabang, Bahan Baku, Tipe Pengeluaran, Sumber Pemasukan) dengan auto-sync & proteksi paste multi-baris.
- `TransactionService.js`: Handler form data staff, simpan/edit laporan harian, kalkulasi Penjualan = Setoran + Pengeluaran, sinkronisasi tab Pengeluaran, bahan baku dinamis, dan pencatatan Log_Aplikasi.
- `SummaryService.js`: Agregasi ringkasan omset, pengeluaran, setoran, dan pemakaian bahan untuk Dashboard Owner.
- `Setup.js`: Fungsi 1-klik `setupMasterSpreadsheet()` untuk menginisialisasi 7 tab Master sekaligus beserta data validasi dropdown.
- `Code.js`: Router utama `doGet` dan `doPost`.

## 3. Rumus & Logika Finansial

- **`Uang Setoran`**: Uang tunai fisik yang disetor saat tutup shift/toko.
- **`Pengeluaran Hari Itu`**: Total belanja operasional outlet (mendukung multiple item tercatat di tab Pengeluaran).
- **`Hasil Penjualan Hari Itu (Omset)`** = `Uang Setoran` + `Total Pengeluaran`.
- **`Stok Bahan Baku`**: `Terpakai = Stok Awal - Stok Sisa`.
- **`Hasil Bersih (Rekapitulasi)`** = `Total Pemasukan` - `Total Pengeluaran`.

## 4. Daftar Endpoint API (POST JSON)

| Action | Keterangan | Payload Utama |
|---|---|---|
| `login` | Autentikasi user | `{ action: "login", username, password }` |
| `logout` | Revoke sesi aktif | `{ action: "logout" }` |
| `get_initial_form_data` | Ambil data form staff & sisa stok kemarin | `{ action: "get_initial_form_data", cabang }` |
| `create_report` / `create` | Simpan laporan harian ke spreadsheet bulanan | `{ action: "create_report", data: { cabang, tanggal, uangSetoran, pengeluaranList, stokBahan, keterangan } }` |
| `update_report` / `update` | Perbarui laporan harian | `{ action: "update_report", id, data: { ... } }` |
| `read_reports` / `read` | Baca daftar transaksi laporan periode tertentu | `{ action: "read_reports", period: "YYYY-MM", cabang, id }` |
| `get_summary` / `read_database` | Ambil KPI & agregasi untuk Dashboard Owner | `{ action: "get_summary", period: "YYYY-MM", cabang }` |
| `read_master` | Baca seluruh entitas master (Admin only) | `{ action: "read_master" }` |
| `update_master` | Tambah/Edit/Hapus data master (Admin only) | `{ action: "update_master", target, operation, data }` |
| `refresh_rekap` | Regenerasi formula tab Rekapitulasi bulanan | `{ action: "refresh_rekap", period: "YYYY-MM" }` |
| `setup` | Inisialisasi tab Master Spreadsheet awal | `{ action: "setup" }` |
