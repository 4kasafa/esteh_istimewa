mari buat satu menu lagi yaitu kas keluar!
menu dan halaman ini hanya bisa dilihat oleh admin

halaman terbagi menadi 2 mode, mode view(default) dan input

saat mode view berisi list data dari read_database, tapi hanya mengambil data dengan ARUS DANA "Setoran Bank BRI" saja
data difilter hanya menampilkan bulan ini saja melihat dari id/TIMESTAMP INPUT
berikan filter untuk menampilkan bulan yang dipilih contoh: FEB/MAR/JUN/ dst..

tambahkan tombol tambah untuk input kas keluar yang saat dipencet akan masuk mode input.

saatmode input ada tombol arrow back untuk kembali ke mode view
mode input halaman berisi input: 
1. tgl yang akan menjadi data TIMESTAMP INPUT dengan format contoh "Minggu, 1 Maret 2026 22.22.26"
2. arus dana yang akan menjadi data "ARUS DANA", berupa dropdown berisi data dari BRANCH_OPTIONS dari constants/forms.js
3. shift brupa dropdown juga berisi data dari SHIFT_OPTIONS sourc nya sama
4. Kasir sama dropdown juga data KASIR_OPTIONS
5. nominal
6. keterangan

lalu tombol submit simpan kas keluar
data akan dikirim dengan api yang ada seperti ini
```json 
{
    "action": "create_database",
    "authorization": "Bearer {{token}}",
    "data":{
        "TIMESTAMP INPUT": "Minggu, 1 Maret 2026 22.22.26",
        "SHIFT": "Pagi",
        "ARUS DANA": "tes",
        "KASIR": "tes",
        "KETERANGAN": "TES",
        "UANG KELUAR": 1000
    }
}
```

jika sukses akan ada alert sukses dari element yang sudah ada, lalu kembali kemode view dengan data baru yang sudah kelihatan üada list.


berikan code yang baik dengan metode metode dan menyesuaikan codebase dan data yang ada.
jangan merusak atau mengganggu halaman lain. dan mengganggu fungsi yang sudah ada.
buatkan tampilan style yang baik simple modern dan menyesuaikan halaman dan tampilan website
buatkan layout yang baik dan responsive, harus responsive size dan juga layout.

jika ada yang kurang jelas silahkan tanyakan dulu baru eksekusi.