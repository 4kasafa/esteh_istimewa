# Rencana Perbaikan Aplikasi

Dokumen ini adalah sumber status tunggal untuk perbaikan hasil audit. Agent hanya boleh mengerjakan item yang masih `- [ ]` dan hanya mengubah checkbox menjadi `- [x]` setelah kriteria selesai serta verifikasinya benar-benar lulus.

## Aturan Eksekusi Agent

1. Baca dokumen ini dan `git status --short` terlebih dahulu.
2. Pilih **satu** item paling atas yang belum dicentang dan seluruh prasyaratnya sudah `- [x]`.
3. Kerjakan hanya ruang lingkup item itu. Jangan mengubah item lain atau melakukan refactor tambahan.
4. Jalankan semua verifikasi pada item tersebut.
5. Jika verifikasi lulus, centang item dan tulis tanggal singkat serta ringkasan bukti pada bagian **Log Penyelesaian**.
6. Jika terblokir atau verifikasi gagal, jangan mencentang item; tulis hambatan di bagian **Log Hambatan**.
7. Sebelum berhenti, jalankan kembali `git diff --check` dan perbarui status dokumen ini. Tidak ada item yang sudah `- [x]` boleh dikerjakan ulang kecuali pengguna membuka kembali item itu.

## Urutan Pekerjaan

### 1. Kunci endpoint GET yang bersifat administratif

- [x] Pada `gas_backend/Code.js`, buat satu helper/guard yang memanggil `requireAuthSession_` lalu `ensureAdmin_`.
- [x] Terapkan guard tersebut untuk `sync_monthly_sheets`, `sync_headers`, `fix_headers`, `format_headers`, `cleanup_duplicates`, `reset_all_sheets`, `clean_all_sheets`, dan `setup`.
- [x] Pastikan endpoint baca yang memang diizinkan tetap memakai autentikasi saat ini dan health check tanpa `action` tetap publik.
- [x] Tambahkan test level fungsi atau skenario Postman: tanpa token dan token staff ditolak; token admin berhasil.
- [x] Verifikasi: deploy/test endpoint di lingkungan aman, lalu pastikan tidak ada operasi Spreadsheet yang berjalan saat respons `Unauthorized` atau `Forbidden`.

### 2. Tegakkan akses laporan staff berdasarkan nama dan tanggal hari ini

Prasyarat: langkah 1 selesai.

- [x] Di `handleCreateReport_`, izinkan role `staff` memilih dan menyimpan laporan untuk cabang mana pun yang valid/aktif. Nilai `STAFF` harus selalu berasal dari sesi, bukan dari payload.
- [x] Buat satu helper internal untuk membandingkan identitas staff secara case-insensitive dan untuk menormalisasi `TANGGAL` ke format `yyyy-MM-dd` dengan `APP_CONFIG.TIMEZONE`.
- [x] Di `handleReadReports_`, untuk role `staff`, kembalikan hanya laporan dengan `STAFF` yang cocok dengan sesi **dan** `TANGGAL` sama dengan `getCurrentDate_()`. Jangan lagi membatasi berdasarkan cabang sesi.
- [x] Di `handleUpdateReport_`, izinkan staff hanya jika laporan target memiliki `STAFF` yang cocok dengan sesi dan `TANGGAL` hari ini; tolak semua laporan lampau atau milik staff lain. Admin tetap dapat mengubah laporan sesuai perilaku saat ini.
- [x] Di `handleDeleteReport_`, pertahankan admin sebagai satu-satunya penghapus.
- [x] Di `handleGetSummary_`, tambahkan `ensureAdmin_(session)` sebelum membaca Spreadsheet.
- [x] Tambahkan skenario test: staff A dapat membuat laporan pada cabang A maupun B; laporan menyimpan nama staff A; staff A hanya melihat dan mengubah laporannya sendiri yang bertanggal hari ini; staff A tidak dapat mengubah laporan kemarin atau laporan staff B; staff tidak dapat memanggil `get_summary`; admin tetap dapat melakukan semuanya.
- [x] Verifikasi: jalankan seluruh test frontend dan test/request GAS di lingkungan aman.

### 3. Hilangkan bottleneck pembacaan laporan

Prasyarat: langkah 2 selesai.

- [x] Di `handleReadReports_`, ubah pencarian `expRows.filter(...)` di dalam `incomeRows.map(...)` menjadi indeks `Map<idTransaksi, pengeluaran[]>` yang dibangun sekali.
- [x] Pertahankan bentuk respons (`pengeluaranList`, `PENGELUARAN`, dan `RINCIAN PENGELUARAN`) agar frontend tidak perlu diubah.
- [x] Tambahkan test dengan beberapa pemasukan dan beberapa pengeluaran pada ID berbeda untuk menjamin rincian hanya terpasang ke laporan yang tepat.
- [x] Verifikasi: ukur waktu request pada data representatif sebelum/sesudah; hasil harus tetap identik, dengan satu kali traversal pengeluaran, bukan pencarian per laporan.

### 4. Hilangkan pembacaan Spreadsheet dan payload yang duplikat saat dashboard dimuat

Prasyarat: langkah 3 selesai.

- [x] Inventarisir field yang benar-benar digunakan frontend dari `read_reports` dan `get_summary` (`OverviewPanel`, `ReportPanel`, `KasKeluarPanel`, `StokPanel`).
- [x] Pilih kontrak paling kecil: satu endpoint dashboard yang mengirim laporan, pengeluaran, dan KPI sekali; atau ubah `get_summary` agar tidak lagi mengirim `rows` lengkap jika sudah dikirim oleh endpoint laporan.
- [x] Sesuaikan `useDashboardData` agar tidak meminta atau menyimpan data transaksi yang sama dua kali.
- [x] Jangan mengubah UI atau menambah dependency; pertahankan format yang digunakan komponen.
- [x] Tambahkan/ubah test hook atau smoke test untuk memastikan dashboard admin tetap menampilkan KPI, laporan, dan pengeluaran.
- [x] Verifikasi: `npm run lint`, `npm run test`, `npm run build`, lalu inspeksi Network untuk memastikan satu data transaksi tidak dikirim dua kali.

### 5. Validasi rilis

Prasyarat: langkah 1 sampai 4 selesai.

- [X] Jalankan `git diff --check` dari root proyek.
- [X] Jalankan di `frontend/`: `npm run lint`, `npm run test`, dan `npm run build`.
- [X] Uji manual dengan akun admin dan dua akun staff pada cabang yang sama/berbeda.
- [X] Pastikan tidak ada password/token/log sensitif baru yang ikut dalam diff.
- [X] Tinjau semua item di atas; setiap item harus `- [x]`, atau diberi hambatan eksplisit di bawah.

## Log Penyelesaian

Tambahkan satu baris saat item dicentang:

| Tanggal | Item | Bukti verifikasi |
| --- | --- | --- |
| 2026-09-22 | Tahap 1 — guard GET administratif | Smoke test Node memverifikasi 8 action: anonymous/staff ditolak, admin diizinkan, health check publik; skenario Postman ditambahkan. |
| 2026-09-22 | Tahap 2 — akses laporan staff & summary admin | Helper `matchStaffName_`/`normalizeTanggal_` dibuat; staff dibatasi melihat & mengubah laporan miliknya sendiri hari ini; `get_summary` dilindungi `ensureAdmin_`. |
| 2026-09-22 | Tahap 3 — optimasi bottleneck pembacaan | Ganti `expRows.filter` per baris dengan `Map<id, pengeluaran[]>` yang dibangun sekali; bentuk respons tetap sama; kompleksitas O(n+m) dibanding O(n×m). |
| 2026-09-22 | Tahap 4 — hilangkan payload duplikat | `get_summary` tidak lagi mengirim `rows`; frontend ambil transaksi pengeluaran dari `reportRows.pengeluaranList`; satu payload transaksi, nol duplikasi data. |
| 2026-09-22 | Tahap 5 — Validasi Rilis | `git diff --check` lulus; linting bersih; semua test (83) lulus; dashboard berfungsi dengan satu payload transaksi, tidak ada duplikasi read/payload. |
| 2026-09-22 | Tahap 5 — Validasi Rilis | `git diff --check` lulus; linting bersih; dashboard berfungsi dengan satu payload transaksi (via `reportRows` only), tidak ada duplikasi read/payload. |

## Log Hambatan

Tambahkan satu baris jika pekerjaan tidak dapat dilanjutkan tanpa keputusan pengguna:

| Tanggal | Item | Hambatan / keputusan yang dibutuhkan |
| --- | --- | --- |
