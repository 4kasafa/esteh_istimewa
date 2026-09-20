# Frontend Implementation Guide

Dokumen ini fokus ke implementasi frontend untuk konsumsi API GAS backend.

## 1) Base URL

Gunakan URL Web App hasil deploy Apps Script:

```text
https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

Simpan di env frontend:

```env
VITE_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

## 2) Format Request Dasar (POST JSON)

Semua endpoint utama dipanggil dengan `POST` dan body JSON:

```json
{
  "action": "read_database",
  "authorization": "Bearer <token>"
}
```

## 3) Helper API (JavaScript)

```js
const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest(body, token) {
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
  if (!json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json.data;
}
```

## 4) Login + Simpan Token

```js
import { apiRequest } from "./api";

export async function login(email, password) {
  const data = await apiRequest({
    action: "login",
    email,
    password,
  });

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("last_today_report", data.lastTodayReport || "");
  return data;
}
```

Catatan login role `staff`:

- Backend mengirim `lastTodayReport` berupa string dari kolom `laporan` di tab `Sessions`.
- Nilai hanya dikirim jika tanggal laporan sama dengan hari ini; jika tidak ada maka `null`.

Contoh response login staff:

```json
{
  "success": true,
  "message": "Login success",
  "data": {
    "token": "...",
    "expiresAt": "2026-03-04 23:59:59",
    "user": {
      "username": "joko",
      "nama": "Joko",
      "role": "staff"
    },
    "lastTodayReport": "TRX-20260304-cabang_01"
  }
}
```

## 5) Read Data (Rincian)

### List semua data

```js
const token = localStorage.getItem("token");
const rincianList = await apiRequest({ action: "read" }, token);
```

### Detail by ID timestamp

```js
const detail = await apiRequest(
  { action: "read", id: "Minggu, 1 Maret 2026 22.22.26" },
  token
);
```

### Filter bulanan (admin only)

```js
const dataMaret = await apiRequest(
  { action: "read", period: "2026-03" },
  token
);
```

Alternatif (tetap kompatibel pola lama via `id`):

```js
const dataMaret2 = await apiRequest(
  { action: "read", id: "2026-03" },
  token
);
```

## 6) Read Data Database

### List semua data database

```js
const token = localStorage.getItem("token");
const dbList = await apiRequest({ action: "read_database" }, token);
```

### Detail by TIME STAMP INPUT

```js
const dbDetail = await apiRequest(
  { action: "read_database", id: "Minggu, 1 Maret 2026 22.22.26" },
  token
);
```

### Filter bulanan (admin only)

```js
const dbMaret = await apiRequest(
  { action: "read_database", period: "2026-03" },
  token
);
```

Alternatif:

```js
const dbMaret2 = await apiRequest(
  { action: "read_database", month: 3, year: 2026 },
  token
);
```

## 7) Create dan Update

### Create

```js
const created = await apiRequest(
  {
    action: "create",
    data: {
      SHIFT: "Pagi",
      "ARUS DANA": "KAMPUNG SATU",
      STAFF: "Abdul",
      "GELAS MASUK": 120,
      "GELAS LAKU": 100,
      "GELAS RUSAK": 0,
    },
  },
  token
);
```

### Create (Database Direct - Admin Only)

Digunakan oleh admin untuk memasukkan data langsung ke tab `Database` tanpa melalui tab `Rincian`.

```js
const createdDb = await apiRequest(
  {
    action: "create_database",
    data: {
      "TIMESTAMP INPUT":"Minggu, 1 Maret 2026 22.22.26",
      SHIFT: "Sore",
      "ARUS DANA": "KAMPUNG DUA",
      STAFF: "Admin",
      KETERANGAN: "Input manual admin",
      "UANG KELUAR": 100000,
    },
  },
  adminToken
);
```

### Update

```js
const updated = await apiRequest(
  {
    action: "update",
    id: "Minggu, 1 Maret 2026 22.22.26",
    data: {
      "GELAS LAKU": 110,
    },
  },
  token
);
```

## 8) Logout

```js
await apiRequest({ action: "logout" }, token);
localStorage.removeItem("token");
localStorage.removeItem("user");
```

## 9) Error Handling yang Disarankan

Tangani pesan backend langsung untuk UX:

- `Missing Bearer token`
- `Session not found or revoked`
- `Token expired`
- `Forbidden action for staff`
- `Monthly filter is admin-only`
- `Data not found`

Contoh wrapper:

```js
try {
  const data = await apiRequest({ action: "read_database" }, token);
} catch (err) {
  alert(err.message);
}
```

## 10) Checklist Integrasi Frontend

1. Simpan `base URL` di env.
2. Login dan simpan `token`.
3. Selalu kirim `authorization: Bearer <token>`.
4. Gunakan `POST` + JSON body untuk semua aksi utama.
5. Gunakan filter bulanan hanya untuk user `admin`.
