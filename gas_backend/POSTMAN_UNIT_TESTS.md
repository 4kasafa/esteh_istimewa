# Postman Unit Test - Gas Backend API

Dokumen ini berisi langkah uji endpoint satu per satu di Postman dengan assertion di tab `Tests`.

## 1) Persiapan

1. Buka Postman dan buat `Environment` baru, misal: `Gas Backend Local`.
2. Tambahkan variable berikut:
   - `base_url` = URL web app GAS, contoh `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`
   - `admin_email`
   - `admin_password`
   - `staff_email`
   - `staff_password`
   - `admin_token` (kosongkan dulu)
   - `staff_token` (kosongkan dulu)
   - `created_id` (kosongkan dulu)
3. Pastikan tab master di Master Spreadsheet sudah sesuai kebutuhan di README.

## 2) Struktur Collection

1. Buat Collection baru: `Gas Backend API Tests`.
2. Aktifkan environment `Gas Backend Local`.
3. Setiap request gunakan header:
   - `Content-Type: application/json`

## 3) Test Endpoint `login` (admin)

### Request

- Method: `POST`
- URL: `{{base_url}}`
- Body (raw JSON):

```json
{
  "action": "login",
  "email": "{{admin_email}}",
  "password": "{{admin_password}}"
}
```

### Tests (tab `Tests`)

```javascript
pm.test("Status code 200", function () {
  pm.response.to.have.status(200);
});

const res = pm.response.json();
pm.test("Login success true", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(res.data).to.have.property("token");
});

pm.environment.set("admin_token", res.data.token);
```

## 4) Test Endpoint `login` (staff)

### Request

- Method: `POST`
- URL: `{{base_url}}`
- Body:

```json
{
  "action": "login",
  "username": "{{staff_email}}",
  "password": "{{staff_password}}"
}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Staff login success", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(res.data.user.role).to.eql("staff");
});

pm.environment.set("staff_token", res.data.token);
```

## 5) Test Endpoint `create` (admin)

### Request

- Method: `POST`
- URL: `{{base_url}}`
- Body:

```json
{
  "action": "create",
  "authorization": "Bearer {{admin_token}}",
  "data": {
    "SHIFT": "Pagi",
    "ARUS DANA": "KAMPUNG SATU",
    "STAFF": "Abdul",
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

### Tests

```javascript
const res = pm.response.json();
pm.test("Create success", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(res.message).to.eql("Data created");
});

// Simpan ID transaksi untuk test berikutnya
pm.environment.set("created_id", res.data["NO TRANSAKSI"] || res.data["TIME STAMP INPUT"] || "");
```

## 6) Test Endpoint `read` list (admin)

### Request

- Method: `GET`
- URL:

```text
{{base_url}}?action=read&authorization=Bearer%20{{admin_token}}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Read list success", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(Array.isArray(res.data)).to.eql(true);
});
```

## 7) Test Endpoint `read` detail by `id`

### Request

- Method: `GET`
- URL:

```text
{{base_url}}?action=read&id={{created_id}}&authorization=Bearer%20{{admin_token}}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Read detail found", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(res.data).to.not.eql(null);
});
```

## 8) Test Endpoint `update` (admin)

### Request

- Method: `POST`
- URL: `{{base_url}}`
- Body:

```json
{
  "action": "update",
  "authorization": "Bearer {{admin_token}}",
  "id": "{{created_id}}",
  "data": {
    "GELAS LAKU": 110
  }
}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Update success", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(res.message).to.eql("Data updated");
  pm.expect(Number(res.data["GELAS LAKU"])).to.eql(110);
});
```

## 9) Test Endpoint `read_database` (admin only)

### Request

- Method: `GET`
- URL:

```text
{{base_url}}?action=read_database&authorization=Bearer%20{{admin_token}}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Read database success", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(Array.isArray(res.data)).to.eql(true);
});
```

## 9a) Test Endpoint `read` bulanan by `NO TRANSAKSI` (admin only)

### Request

- Method: `GET`
- URL:

```text
{{base_url}}?action=read&period=2026-03&authorization=Bearer%20{{admin_token}}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Read monthly success", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(Array.isArray(res.data)).to.eql(true);
});
```

## 9b) Test Endpoint `read_database` bulanan by `TIME STAMP INPUT` (admin only)

### Request

- Method: `GET`
- URL:

```text
{{base_url}}?action=read_database&month=3&year=2026&authorization=Bearer%20{{admin_token}}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Read database monthly success", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(Array.isArray(res.data)).to.eql(true);
});
```

## 10) Negative Test `read_master` pakai token staff (harus gagal)

### Request

- Method: `GET`
- URL:

```text
{{base_url}}?action=read_master&authorization=Bearer%20{{staff_token}}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Staff forbidden read_master", function () {
  pm.expect(res.success).to.eql(false);
  pm.expect(res.message).to.include("Forbidden");
});
```

## 10a) Negative Test `setup_rekap` pakai token staff (harus gagal)

### Request

- Method: `GET`
- URL:

```text
{{base_url}}?action=setup_rekap&period=2026-03&authorization=Bearer%20{{staff_token}}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Staff forbidden setup_rekap", function () {
  pm.expect(res.success).to.eql(false);
  pm.expect(res.message).to.include("Forbidden");
});
```

## 11) Negative Test `create` tanpa token

### Request

- Method: `POST`
- URL: `{{base_url}}`
- Body:

```json
{
  "action": "create",
  "data": {
    "SHIFT": "Pagi",
    "ARUS DANA": "KAMPUNG SATU",
    "STAFF": "Abdul"
  }
}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Missing token rejected", function () {
  pm.expect(res.success).to.eql(false);
  pm.expect(res.message).to.include("Missing Bearer token");
});
```

## 12) Test Endpoint `logout` (admin)

### Request

- Method: `POST`
- URL: `{{base_url}}`
- Body:

```json
{
  "action": "logout",
  "authorization": "Bearer {{admin_token}}"
}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Logout success", function () {
  pm.expect(res.success).to.eql(true);
  pm.expect(res.message).to.eql("Logout success");
});
```

## 13) Negative Test token revoked (setelah logout)

### Request

- Method: `GET`
- URL:

```text
{{base_url}}?action=read&authorization=Bearer%20{{admin_token}}
```

### Tests

```javascript
const res = pm.response.json();
pm.test("Revoked token rejected", function () {
  pm.expect(res.success).to.eql(false);
  pm.expect(res.message).to.satisfy(function (msg) {
    return msg.includes("Session not found or revoked") || msg.includes("Token expired");
  });
});
```

## 14) Opsional - Jalankan otomatis via Collection Runner

1. Urutkan request sesuai nomor 3 sampai 13.
2. Buka `Runner`.
3. Pilih collection `Gas Backend API Tests`.
4. Pilih environment `Gas Backend Local`.
5. Klik `Run`.
6. Pastikan semua assertion `PASS`.

## Catatan

- Jika ID tidak tersimpan saat `create`, cek nama kolom ID di sheet `Rincian` (default: `NO TRANSAKSI`).
- Endpoint mendukung GET/POST untuk `read` dan `read_database`, tapi untuk konsistensi test disarankan format seperti dokumen ini.
- Jika `login` gagal, validasi data pada sheet `User` (`Email`, `Sandi`, `Role`, `Nama`).
