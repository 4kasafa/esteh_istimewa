Mari rombak halaman Kasmasuk!
features:
hlaman bisa dual fungsi, jika diakses dari menu sidebar atau tombol "tambah laporan" dari halaman laporan akan menampilkan input kas masuk, jika diakses dari tombol edit pada table data di halaman laporan, akan menampilkan edit kas masuk dengan data template dari data yang dipilih yang sudah tertera pada input.

jika admin yang akses bisa input kapan saja, jika kasir yang akses saat sudah ada   lastTodayReport akan menampilkan mode edit kas masuk dengan data yang sudah tertera pada input dari data yang ada.

Buat input group:
a. tanggal otomatis dengan format "Hari, 5(tgl saat  input) Bulan(nama bulan saat input contoh Maret) 2026(tahun saat input) 22.04.47(timestamp)"  lable pada data input = NO TRANSAKSI, 
shift dengan opsi: pagi/siang/sore/malam label pada data input = SHIFT,
Cabang Dengan opsi: SDF/SELUMIT/KAMPUNG SATU/KAMPUNG BUGIS/SEBENGKOK/JUWATA,  lable pada data input = ARUS DANA,
Kasir(otomatis dari nama user) label = KASIR.

b. gelas terjual label = GELAS LAKU,
gelas masuk lable = GELAS MASUK,
dan gelas rusak = GELAS RUSAK.

c. es depo lable = ES BATU DEPO, 
es beli lable = ES BATU BELI,
teh lable = TEH,
gula lable = GULA.

d. pengeluaran lable = PENGELUARAN,
keterangan label = KETERANGAN.

e. grup input denominasi dengan card sendiri dan menampilkan input dengan lable denom dari rp 100.000 sampai rp 100, dengan susunan per row seperti ini "denominasi x input jumlah = hasil", dan dibawah ada total  penjumlahan seluruh hasil.

stelah submit mengirim data sesuai seperti pada file FRONTEND_IMPLEMENTATION.md dengan lable data yang sesuai

buatkan code yang robust scallable jelas,  lengkap dengan style yang konsisten menyesuaikan website dan juga super responsive untuk semua device terutama mobil, sesuaikan layout untuk semua media 

jika ada yang kurang jelas dari prompt ini sillahkan tanyakan dulu baru exekusi