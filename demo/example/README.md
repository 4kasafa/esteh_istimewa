# Refactor Code Google Apps Script (Sistem Input Kas Lay)

Refactor ini memisahkan kode dari satu file tunggal (`contoh.js`) menjadi beberapa file yang lebih terorganisir untuk meningkatkan kemudahan pemeliharaan dan keterbacaan.

## Struktur File Baru

1.  **`Code.gs`**: Berisi logika server-side (Google Apps Script).
    *   Fungsi `doGet()` untuk melayani antarmuka web.
    *   Fungsi CRUD dan manipulasi Spreadsheet (`simpanData`, `getLaporanData`, dll).
    *   Fungsi pembantu untuk formatting dan border Spreadsheet.
    *   Fungsi `include()` untuk memasukkan file HTML lain ke dalam template utama.

2.  **`Index.html`**: Struktur HTML utama.
    *   Mengatur tata letak (layout) aplikasi.
    *   Memisahkan elemen UI seperti sidebar menu, form input, dan rincian uang.

3.  **`CSS.html`**: Berisi semua gaya (styling) aplikasi.
    *   Menggunakan Vanilla CSS untuk tampilan yang bersih dan responsif.
    *   Dibungkus dalam tag `<style>` untuk di-include ke `Index.html`.

4.  **`JS.html`**: Logika client-side (JavaScript).
    *   Menangani interaksi pengguna, perhitungan otomatis nominal uang, dan komunikasi dengan server (`google.script.run`).
    *   Dibungkus dalam tag `<script>` untuk di-include ke `Index.html`.

## Ringkasan Perubahan & Peningkatan

*   **Modularitas**: Kode sekarang terpisah berdasarkan fungsinya (Logika vs Tampilan vs Gaya).
*   **Keamanan & Performa**: Menggunakan `HtmlService.createTemplateFromFile` yang memungkinkan sanitasi kode dan struktur yang lebih baik.
*   **Pemeliharaan**: Memperbaiki bug kecil atau mengubah desain menjadi jauh lebih mudah karena kode tidak lagi menumpuk di satu tempat.
*   **Clean Code**: Menghapus duplikasi kode dan merampingkan beberapa fungsi server-side (seperti pembuatan nomor transaksi otomatis).

## Cara Penggunaan di Google Apps Script Editor

1.  Buat project baru di [script.google.com](https://script.google.com).
2.  Buat file dengan nama yang sesuai (`Code.gs`, `Index.html`, `CSS.html`, `JS.html`).
3.  Salin dan tempel konten dari masing-masing file hasil refactor ini.
4.  Pastikan ID Spreadsheet di `Code.gs` sudah benar.
5.  Deploy sebagai Web App.

---
*Dibuat oleh Gemini CLI*
