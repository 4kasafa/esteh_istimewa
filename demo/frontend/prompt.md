pada directori ini buatkan aplikasi frontend sederhana tapi responsive mobile first untuk testing dan demo appscript end point,
buat halaman dashboard yang menampilkan list data dari sheet lengkap dengan search dan filter, juga tombol edit disetiap list.

contoh data (untuk update):
```javaScript
{
    "action": "update",
    "id": "Kamis, 26 Februari 2026 21.52.45",
    "data": {
        "NO TRANSAKSI": "Kamis, 26 Februari 2026 21.52.45",
        "SHIFT": "Siang",
        "ARUS DANA": "SELUMIT",
        "KASIR": "Arya Ahman",
        "STOK AWAL GELAS": "17.829",
        "GELAS MASUK": "466",
        "GELAS LAKU": "119",
        "GELAS RUSAK": "1",
        "STOK AKHIR GELAS": "18.175",
        "Rp 100.000": "0",
        "Rp 75.000": "0",
        "Rp 50.000": "2",
        "Rp 20.000": "5",
        "Rp 10.000": "9",
        "Rp 5.000": "7",
        "Rp 2.000": "15",
        "Rp 1.000": "5",
        "Rp 500": "0",
        "Rp 200": "0",
        "Rp 100": "0",
        "TOTAL NOTA": "357.000",
        "PENGELUARAN": "0",
        "UNAG MASUK": "360.000",
        "ES BATU DEPO": "32",
        "ES BATU BELI": "0",
        "TEH": "1",
        "GULA": "10"
    }
}
```
buat halaman input dang berisi :
1. tgl dan timestamp (otomatis) dengan format "Kamis, 26 Februari 2026 21.52.45" yang akan masuk ke header "NO TRANSAKSI"

2. shift dengan option : PAGI/SIANG/SORE/MALAM yang akan masuk ke header "SHIFT"

3. cabang dengan opsi:
    SDF
    SELUMIT
    KAMPUNG BUGIS
    KAMPUNG SATU
    SEBENGKOK
    JUWATA
    Setoran Bank BRI
yang akan masuk ke header "ARUS DANA"

4. Kasir dengan opsi:
    Abu Arfan
    Farel
    Arief Rahman
    Imam Solihin
    Arya Ahman
    Ardi
    Irfan
    Imam Hardani
    Aliansyah
    Syamsudin
yang akan masuk ke header "KASIR"

5. stok awal gelas otomatis dengan cara cari data cabang terakhir pada list misal yang dipilih user "KAMPUNG BUGIS", maka cari data terakhir yang sesuai dan ambil "STOK AKHIR GELAS" pada blok data yang sama, yang akan masuk ke header "STOK AWAL GELAS"

6. input gelas masuk, yang akan masuk ke header "GELAS MASUK"

7. input gelas laku, yang akan masuk ke "GELAS LAKU"

8. input gelas rusak, yang akan masuk ke header "GELAS RUSAK"

9. stok akhir gelas otomatis, dengan cara stok awal gelas + gelas masuk - gelas laku - gelas rusak, yang akan masuk ke header "STOK AKHIR GELAS"

10. inpu denominasi rupiah yang akan masuk ke masing masing header dari "Rp 100.000" sampai "Rp 100"

11. total nota otomatis, dengan cara gelas laku x 3000 yang akan masuk ke header "TOTAL NOTA"

12. input pengeluaran yang akan masuk ke header "PENGELUARAN"

13. uang masuk otomatis yaitu hasil dari penjumlahan denominasi yang akan masuk ke header "UNAG MASUK"

14. input "ES BATU DEPO",
    "ES BATU BELI",
    "TEH",
    "GULA", yang akan masuk kemasing masing header

sesuaikan dengan appscript yang sudah dibuat dan berikan tampilan yang simple clean dan responsive serta fiture yang baik