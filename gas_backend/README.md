# Gas Backend API (Google Apps Script)

Backend ini menyediakan API transaksi kasir berbasis Google Apps Script + Google Spreadsheet.

Target utama dokumentasi ini: frontend bisa integrasi cepat tanpa perlu baca source code.

## Ringkasan

- Runtime: Google Apps Script (V8)
- Data store: Google Spreadsheet
- Auth: token session per login
- Role:
  - `admin`: akses penuh
  - `kasir`: create/read/update terbatas
- Format response konsisten:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

## Struktur File (Refactor)

- `Code.js`: route utama + flow request (`doGet`, `doPost`, handler inti)
- `Auth.js`: login/logout, validasi token, role permission, session helper
- `DatabaseService.js`: sinkronisasi dan baca tab `Database`
- `CalculationService.js`: kalkulasi otomatis (`stok`, `nota`, `uang masuk`)
- `CommonUtils.js`: util umum (sanitize, parse number/date, json response)
- `SheetUtils.js`: util spreadsheet/payload/header mapping
- `Config.js`: konfigurasi Spreadsheet dan header
- `appsscript.json`: Apps Script manifest

## Konfigurasi

Edit `Config.js`:

- `SPREADSHEET_ID`
- `SHEET_NAME` (default `Rincian`)
- `DATABASE_SHEET_NAME` (default `Database`)
- `HEADER_ROW` (default `1`)
- `ID_COLUMN_INDEX` (default `1`)

## Kebutuhan Sheet

### 1) `Rincian`

- Dibuat otomatis jika belum ada.
- Header default diambil dari `APP_CONFIG.DEFAULT_HEADERS` jika header kosong.
- ID data ada di kolom sesuai `ID_COLUMN_INDEX` (umumnya `NO TRANSAKSI`).

### 2) `User`

Header wajib:

- `Email`
- `Sandi`
- `Role`
- `Nama`

### 3) `Sessions`

Header wajib:

- `token`
- `email`
- `role`
- `createAt`
- `expireAt`
- `laporan`
- `status`

### 4) `Database`

Minimal wajib:

- `TIME STAMP INPUT`
- `SHIFT`
- `ARUS DANA`
- `KASIR`

Kolom kompatibel yang akan diisi jika tersedia:

- `KETERANGAN`
- `PENGELUARAN`
- `UANG MASUK` / `UNAG MASUK`
- `TOTAL NOTA` / `UANG LAKU` / `INPUT KASIR`
- `UANG KELUAR`

Catatan penting:

- Kolom formula seperti `SELISIH` / `STATUS SELISIH` tidak diisi manual oleh backend.
- Backend menjaga agar tidak bentrok dengan `ARRAYFORMULA`.

## Base URL

Setelah deploy Web App, kamu akan dapat URL seperti:

`https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`

Gunakan URL ini sebagai base API frontend.

## Autentikasi

### Login

`POST` dengan body:

```json
{
  "action": "login",
  "email": "admin@contoh.com",
  "password": "rahasia"
}
```

Response sukses:

```json
{
  "success": true,
  "message": "Login success",
  "data": {
    "token": "...",
    "expiresAt": "01-03-2026 23:59:59",
    "user": {
      "email": "admin@contoh.com",
      "nama": "Admin",
      "role": "admin"
    }
  }
}
```

Khusus role `kasir`, response login juga menyertakan laporan terakhir hari ini (jika ada):

```json
{
  "success": true,
  "message": "Login success",
  "data": {
    "token": "...",
    "expiresAt": "01-03-2026 23:59:59",
    "user": {
      "email": "kasir@contoh.com",
      "nama": "Kasir 1",
      "role": "kasir"
    },
    "lastTodayReport": {
      "NO TRANSAKSI": "01-03-2026 22:22:26",
      "SHIFT": "Pagi",
      "ARUS DANA": "KAMPUNG SATU"
    }
  }
}
```

### Kirim token ke request lain

Bisa salah satu:

- `authorization: "Bearer <token>"`
- `Authorization: "Bearer <token>"`
- `token: "<token>"`

## Endpoint API

### 1) `create`

- Method: `POST`
- Auth: wajib
- Role: `admin`, `kasir`
- Efek:
  - insert ke `Rincian`
  - sinkron ke `Database`
  - kalkulasi otomatis dijalankan

Contoh:

```json
{
  "action": "create",
  "authorization": "Bearer <token>",
  "data": {
    "SHIFT": "Pagi",
    "ARUS DANA": "KAMPUNG SATU",
    "KASIR": "Abdul",
    "GELAS MASUK": 120,
    "GELAS LAKU": 100,
    "GELAS RUSAK": 0,
    "Rp 100.000": 1,
    "Rp 50.000": 2,
    "Rp 20.000": 3,
    "Rp 10.000": 4,
    "Rp 5.000": 1
  }
}
```

### 2) `read`

- Method: `POST` (disarankan), `GET` juga didukung
- Auth: wajib
- Role: `admin`, `kasir`
- Query/body:
  - tanpa `id` => list
  - dengan `id` => detail
  - dengan `id` format `MM-yyyy` / `yyyy-MM` => list bulanan (admin only, tanpa query filter tambahan)
  - filter bulanan (admin only) berdasarkan kolom ID timestamp (`NO TRANSAKSI`):
    - opsi 1: `month` + `year` (contoh: `month=3&year=2026`)
    - opsi 2: `period` format `yyyy-MM` atau `MM-yyyy` (contoh: `period=2026-03`)

Contoh POST (list):

```json
{
  "action": "read",
  "authorization": "Bearer <token>"
}
```

Contoh POST (bulanan):

```json
{
  "action": "read",
  "authorization": "Bearer <admin_token>",
  "period": "2026-03"
}
```

Contoh POST (bulanan via `id` lama):

```json
{
  "action": "read",
  "authorization": "Bearer <admin_token>",
  "id": "03-2026"
}
```

### 3) `read_database`

- Method: `POST` (disarankan), `GET` juga didukung
- Auth: wajib
- Role: `admin` only
- Query/body:
  - tanpa `id` => list data tab `Database`
  - dengan `id` => detail by `TIME STAMP INPUT`
  - dengan `id` format `MM-yyyy` / `yyyy-MM` => list bulanan (admin only)
  - filter bulanan berdasarkan `TIME STAMP INPUT`:
    - opsi 1: `month` + `year`
    - opsi 2: `period` format `yyyy-MM` atau `MM-yyyy`

Contoh POST (list):

```json
{
  "action": "read_database",
  "authorization": "Bearer <token>"
}
```

Contoh POST (bulanan):

```json
{
  "action": "read_database",
  "authorization": "Bearer <admin_token>",
  "month": 3,
  "year": 2026
}
```

Contoh POST (bulanan via `id`):

```json
{
  "action": "read_database",
  "authorization": "Bearer <admin_token>",
  "id": "2026-03"
}
```

### 4) `update`

- Method: `POST`
- Auth: wajib
- Role: `admin`, `kasir` (kasir terbatas data miliknya)
- Field wajib: `id`
- Efek:
  - update `Rincian`
  - sinkron patch ke `Database` (hanya kolom terkait, tidak overwrite full row)

Contoh:

```json
{
  "action": "update",
  "authorization": "Bearer <token>",
  "id": "Minggu, 2026 Maret 01 12.48.78",
  "data": {
    "GELAS LAKU": 110
  }
}
```

### 5) `logout`

- Method: `POST`
- Auth: wajib
- Efek: session di-revoke

```json
{
  "action": "logout",
  "authorization": "Bearer <token>"
}
```

## Aturan Bisnis Utama

- Kasir hanya boleh 1 laporan per hari.
- Login ulang di hari yang sama akan mewarisi referensi laporan hari itu di session baru.
- `UANG KELUAR` hanya untuk admin (kasir tidak boleh isi > 0).
- Input kosong (`""`) dianggap tidak mengubah field.
- Data pada sheet `Sessions` dibersihkan otomatis via trigger Apps Script setiap 7 hari jam 01:00.
- Jalankan fungsi `setupSessionCleanupTrigger_()` sekali (manual dari editor Apps Script) setelah deploy/update script.
- Retensi data dan jadwal bisa diatur lewat `APP_CONFIG.SESSION_RETENTION_DAYS`, `APP_CONFIG.SESSION_CLEANUP_INTERVAL_DAYS`, `APP_CONFIG.SESSION_CLEANUP_HOUR`.
- Beberapa field dihitung otomatis, termasuk:
  - `STOK AWAL GELAS` (dari laporan terakhir `ARUS DANA` sama)
  - `STOK AKHIR GELAS`
  - `TOTAL NOTA` (`GELAS LAKU * 3000`)
  - `UNAG/UANG MASUK` (total denominasi)

## Frontend Quick Start

Contoh helper `fetch`:

```js
const API_URL = "https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec";

async function apiRequest(body, token) {
  const payload = {
    ...body,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json.data;
}
```

Contoh login + read:

```js
const loginData = await apiRequest({
  action: "login",
  email: "admin@contoh.com",
  password: "rahasia",
});

const token = loginData.token;

const listRincian = await apiRequest({ action: "read" }, token);
const listDatabase = await apiRequest({ action: "read_database" }, token);
```

## Error Handling Frontend

Gunakan pola:

1. Cek HTTP/network error.
2. Parse JSON.
3. Cek `success === true`.
4. Tampilkan `message` saat gagal.

Error umum:

- `Missing Bearer token`
- `Session not found or revoked`
- `Token expired`
- `Forbidden action for kasir`
- `Field 'id' is required`
- `Data not found`

## Deploy

1. `clasp login`
2. `clasp push`
3. Deploy Web App di Apps Script
4. Pakai URL deploy sebagai API URL frontend

Pastikan `.claspignore` sudah meng-include file berikut:

- `Code.js`
- `Config.js`
- `Auth.js`
- `DatabaseService.js`
- `CalculationService.js`
- `CommonUtils.js`
- `SheetUtils.js`
- `appsscript.json`
