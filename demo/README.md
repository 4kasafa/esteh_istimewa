# Apps Script Rincian API

Backend endpoint sederhana untuk Google Sheets tab `Rincian` dengan fitur:
- tambah data (`create`)
- lihat data (`read`)
- edit data (`update`)

`id` menggunakan nilai kolom A (`NO TRANSAKSI`), termasuk jika nilainya timestamp.

## 1) Setup

1. Buka `Config.js`.
2. Pastikan konfigurasi:
   - `SPREADSHEET_ID`: ID spreadsheet target.
   - `SHEET_NAME`: `Rincian`.
   - `HEADER_ROW`: `1`.
   - `ID_COLUMN_INDEX`: `1` (kolom A sebagai id).
3. Push ke Apps Script:
   - `clasp push`
4. Deploy sebagai Web App:
   - Execute as: `Me`
   - Who has access: sesuai kebutuhan (`Anyone` untuk demo publik)

## 2) Struktur Data

Header default mengikuti data rincian:
- `NO TRANSAKSI`, `SHIFT`, `ARUS DANA`, `KASIR`, `STOK AWAL GELAS`, `GELAS MASUK`, `GELAS LAKU`, `GELAS RUSAK`, `STOK AKHIR GELAS`, `Rp 100.000`, `Rp 75.000`, `Rp 50.000`, `Rp 20.000`, `Rp 10.000`, `Rp 5.000`, `Rp 2.000`, `Rp 1.000`, `Rp 500`, `Rp 200`, `Rp 100`, `TOTAL NOTA`, `PENGELUARAN`, `UNAG MASUK`, `ES BATU DEPO`, `ES BATU BELI`, `TEH`, `GULA`

Semua response berbentuk JSON:

```json
{
  "success": true,
  "message": "Data list",
  "data": []
}
```

## 3) Endpoint

Ganti `<WEB_APP_URL>` dengan URL deploy Web App kamu.

### Read semua data (GET)

```bash
curl "<WEB_APP_URL>?action=read"
```

### Read by id (GET)

```bash
curl "<WEB_APP_URL>?action=read&id=<ID_KOLOM_A>"
```

### Create (POST)

```bash
curl -X POST "<WEB_APP_URL>" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\":\"create\",
    \"data\":{
      \"NO TRANSAKSI\":\"2026-02-26 15:20:00\",
      \"SHIFT\":\"Pagi\",
      \"ARUS DANA\":\"SDF\",
      \"KASIR\":\"Budi\"
    }
  }"
```

Catatan:
- Jika `NO TRANSAKSI`/`id` tidak dikirim, sistem akan membuat id timestamp otomatis.

### Update (POST)

```bash
curl -X POST "<WEB_APP_URL>" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\":\"update\",
    \"id\":\"2026-02-26 15:20:00\",
    \"data\":{
      \"KASIR\":\"Budi Update\",
      \"GELAS LAKU\":\"150\"
    }
  }"
```

Catatan:
- `id` wajib saat `update`.
- `id` (kolom A) tidak dapat diubah melalui update.
- Action yang diizinkan hanya: `create`, `read`, `update`.

## 4) Clasp Ignore

File `.claspignore` sudah disiapkan agar `clasp push` tidak membawa:
- folder `data/`
- folder `example/`
- folder `ss/`
- semua file `.md`
