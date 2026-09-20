/**
 * Script Otomatis Pembuat Google Form Review Aplikasi Es Teh Istimewa
 * 
 * CARA PAKAI:
 * 1. Buka https://script.google.com/
 * 2. Buka project Apps Script backend kamu (atau buat project baru).
 * 3. Copy-paste fungsi di bawah ini.
 * 4. Pilih fungsi `createClientReviewForm`, lalu klik "Run / Jalankan".
 * 5. Buka Google Drive kamu -> Form sudah otomatis dibuat lengkap!
 * 6. Kamu tinggal upload gambar screenshot di masing-masing section.
 */

function createClientReviewForm() {
  const form = FormApp.create('Review & Validasi Alur Aplikasi - Es Teh Istimewa');
  
  form.setDescription(
    'Halo Mas Husain,\n\n' +
    'Formulir ini dibuat untuk meninjau rancangan tampilan dan alur sistem staff & operasional "Es Teh Istimewa" yang sudah disesuaikan dari demo sebelumnya.\n\n' +
    'Setiap bagian dilengkapi tangkapan layar (screenshot) dan penjelasan singkat. Di bagian akhir ada pertanyaan konfirmasi rumus perhitungan agar sistemnya 100% pas dengan kebiasaan di outlet. (Estimasi waktu isi: ~2-3 menit).'
  );
  
  // -------------------------------------------------------------
  // BAGIAN 1: FORM STAFF (STOK CUP & SHIFT)
  // -------------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('Bagian 1: Form Input Staff (Stok Cup & Shift Buka-Tutup)')
    .setHelpText(
      '📸 [Upload Screenshot 1 di sini: Tampilan Form Staff bagian atas]\n\n' +
      'Penjelasan:\n' +
      'Tampilan ini dibuka staff lewat HP saat buka dan tutup toko.\n' +
      '• Pagi: Staff cukup cek stok cup awal (otomatis meneruskan dari sisa tutup kemarin).\n' +
      '• Pas Tutup: Staff cukup menghitung sisa cup fisik di rak/etalase dan cup rusak. Sistem otomatis menghitung berapa cup yang laku terjual.'
    );

  // -------------------------------------------------------------
  // BAGIAN 2: FORM STAFF (PENGELUARAN & HITUNG UANG LACI)
  // -------------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('Bagian 2: Pengeluaran Harian & Hitung Uang Fisik Staff')
    .setHelpText(
      '📸 [Upload Screenshot 2 di sini: Form Pengeluaran & Pecahan Uang Denominasi]\n\n' +
      'Penjelasan:\n' +
      'Pas tutup toko, staff mencatat pengeluaran operasional (beli es kristal, galon, dll).\n' +
      'Lalu staff cukup menghitung jumlah lembaran uang di laci (berapa lembar 100rb, 50rb, dst). Sistem otomatis menjumlahkan total setoran tanpa staff perlu kalkulator.'
    );

  // -------------------------------------------------------------
  // BAGIAN 3: DASHBOARD OWNER
  // -------------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('Bagian 3: Dashboard Owner (Pantau Omset & Laba)')
    .setHelpText(
      '📸 [Upload Screenshot 3 di sini: Dashboard Utama Owner & Grafik]\n\n' +
      'Penjelasan:\n' +
      'Tampilan khusus Mas Husain sebagai Owner (bisa dibuka dari HP maupun Laptop).\n' +
      'Menampilkan ringkasan omset penjualan hari ini, total pengeluaran operasional, laba bersih, total cup laku, serta grafik performa penjualan harian/bulanan.'
    );

  // -------------------------------------------------------------
  // BAGIAN 4: TABEL REKAP & LAPORAN
  // -------------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('Bagian 4: Rekap Laporan & Data Transaksi')
    .setHelpText(
      '📸 [Upload Screenshot 4 di sini: Tabel Laporan]\n\n' +
      'Penjelasan:\n' +
      'Tabel riwayat semua laporan staff dari seluruh cabang.\n' +
      'Sistem mencatat transaksi harian, setoran, pengeluaran, dan total penjualan secara transparan.'
    );

  // -------------------------------------------------------------
  // BAGIAN 5: KONFIRMASI RUMUS PERHITUNGAN
  // -------------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('Bagian 5: Konfirmasi Rumus Perhitungan Sistem')
    .setHelpText('Mohon pilih opsi yang paling sesuai dengan operasional di outlet Es Teh Istimewa saat ini:');

  form.addMultipleChoiceItem()
    .setTitle('1. Soal Harga Jual & Menu:\nBerapa harga jual teh per cup di Es Teh Istimewa? Dan bagaimana skema harganya?')
    .setChoiceValues([
      'Opsi A: Flat seragam (Otomatis: Cup Laku × Harga per Cup)',
      'Opsi B: Harganya beda-beda per varian/ukuran (Staff ketik sendiri nominal total uang penjualannya)'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('2. Soal Uang Belanja Operasional (Es Kristal, Galon, dll):\nSaat staff membayar es kristal/galon, uangnya dipotong dari mana?')
    .setChoiceValues([
      'Opsi A: Dipotong langsung dari uang laci (Uang disetor = Penjualan - Pengeluaran)',
      'Opsi B: Ada uang kas kecil (petty cash) terpisah (Staff setor utuh uang penjualan)'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('3. Soal Pergantian Shift Staff:\nBagaimana sistem laporan dan setoran antar shift di outlet?')
    .setChoiceValues([
      'Opsi A: Tiap shift bikin laporan & setor uang sendiri-sendiri saat operan shift',
      'Opsi B: Uang kas laci jalan seharian, staff cukup bikin 1 laporan gabungan saat tutup malam'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('4. Soal Bahan Baku Harian:\nSelain stok cup, apakah bahan baku fisik (es batu depo/beli, teh, gula, galon) tetap perlu dicatat jumlah pack/sak fisiknya tiap hari?')
    .setChoiceValues([
      'Opsi A: Wajib catat jumlah fisiknya tiap hari (sama persis seperti sistem demo)',
      'Opsi B: Cukup catat pengeluaran rupiahnya saja biar staff tidak repot'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('5. Soal Gaji Karyawan:\nTerkait perhitungan gaji yang kemarin sempat dibahas, bagaimana rencananya mas?')
    .setChoiceValues([
      'Opsi A: Fokus ke pembukuan staff & stok cup ini dulu biar stabil 1-2 minggu, modul gaji menyusul di tahap 2 (Rekomendasi Developer)',
      'Opsi B: Mau sekalian dibuatkan hitungan gaji harian/bulanan di rilis awal ini'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('6. Catatan tambahan, harga per cup, atau permintaan khusus dari Mas Husain:')
    .setHelpText('Misal: "Harga cup Rp 3.000 flat mas", atau catatan operasional lainnya.')
    .setRequired(false);

  // Konfigurasi Form
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);

  Logger.log('Google Form berhasil dibuat!');
  Logger.log('URL Edit Form: ' + form.getEditUrl());
  Logger.log('URL Isi Form (Untuk Klien): ' + form.getPublishedUrl());
}
