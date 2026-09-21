---
name: frontend-design
description: >-
  Panduan desain frontend untuk proyek Es Teh Lay. Gunakan skill ini saat membuat
  atau memodifikasi komponen UI, halaman, atau layout baru. Mencakup sistem warna,
  tipografi, spacing, komponen Tailwind CSS v4, pola Lucide React icon, dan konvensi
  desain konsisten untuk tampilan dashboard admin dan staff.
  Aktifkan saat: membuat komponen baru, merancang layout halaman, memilih warna/spacing,
  membangun form, tabel, kartu, modal, atau elemen UI lainnya.
---

# Frontend Design Skill — Es Teh Lay

Skill ini mendefinisikan standar visual dan pola desain untuk frontend **Es Teh Lay Dashboard**.
Selalu referensikan panduan ini saat membuat atau mengubah komponen UI.

---

## 1. Identitas Visual

### Palet Warna Utama

| Nama         | Kelas Tailwind        | Hex (approx)  | Penggunaan                              |
| ------------ | --------------------- | ------------- | --------------------------------------- |
| Brand Teal   | `text-teal-600`       | `#0d9488`     | Tombol utama, aksen, highlight aktif    |
| Brand Light  | `bg-teal-50`          | `#f0fdfa`     | Background card/section ringan          |
| Danger       | `text-red-500`        | `#ef4444`     | Error, hapus, warning kritis            |
| Success      | `text-green-600`      | `#16a34a`     | Status sukses, konfirmasi               |
| Warning      | `text-amber-500`      | `#f59e0b`     | Peringatan, status pending              |
| Neutral Dark | `text-gray-800`       | `#1f2937`     | Teks utama/judul                        |
| Neutral Mid  | `text-gray-500`       | `#6b7280`     | Teks sekunder, placeholder, label       |
| Neutral Light| `bg-gray-50`          | `#f9fafb`     | Background halaman                      |

### Tipografi

```
Judul halaman  : text-2xl font-bold text-gray-800
Judul section  : text-lg font-semibold text-gray-700
Sub-judul      : text-base font-medium text-gray-700
Body/konten    : text-sm text-gray-600
Label form     : text-sm font-medium text-gray-700
Teks kecil     : text-xs text-gray-500
```

---

## 2. Layout & Spacing

### Sistem Grid Responsif

Proyek menggunakan viewport mode detection di `DashboardPage.jsx`:
- **mobile** (`< 768px`): layout single column, nav bottom/drawer
- **tablet** (`768px – 1023px`): sidebar tersembunyi, konten melebar
- **desktop** (`≥ 1024px`): sidebar tetap (fixed), konten utama dengan margin kiri

```jsx
// Contoh container utama
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {/* konten */}
  </div>
</div>
```

### Spacing Standar

```
Padding card     : p-4 (mobile) / p-6 (desktop)
Gap antar card   : gap-4 (mobile) / gap-6 (desktop)
Margin section   : mb-6
Padding tombol   : px-4 py-2 (normal) / px-3 py-1.5 (kecil)
```

---

## 3. Komponen UI

### Button

```jsx
// Primary
<button className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  <Icon size={16} />
  Label Tombol
</button>

// Secondary/Outline
<button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
  <Icon size={16} />
  Label Tombol
</button>

// Danger
<button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
  <Trash2 size={16} />
  Hapus
</button>
```

### Card / Panel

```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">Judul Kartu</h2>
  {/* konten */}
</div>
```

### Input Form

```jsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Label Field
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-gray-400"
    placeholder="Contoh..."
  />
  {/* Error state */}
  <p className="text-xs text-red-500">Pesan error di sini</p>
</div>
```

### Select / Dropdown

```jsx
<select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
  <option value="">Pilih opsi...</option>
</select>
```

### Tabel Data

```jsx
<div className="overflow-x-auto rounded-xl border border-gray-200">
  <table className="w-full text-sm">
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Kolom
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-gray-700">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Badge / Status

```jsx
// Aktif
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
  Aktif
</span>

// Non-Aktif
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
  Non Aktif
</span>

// Pending/Warning
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
  Pending
</span>
```

### Alert / Notifikasi

```jsx
// Success
<div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
  <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
  <p className="text-sm text-green-700">Pesan sukses.</p>
</div>

// Error
<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
  <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
  <p className="text-sm text-red-600">Pesan error.</p>
</div>

// Info
<div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-lg">
  <Info size={18} className="text-teal-600 mt-0.5 shrink-0" />
  <p className="text-sm text-teal-700">Pesan info.</p>
</div>
```

### Modal / Dialog

```jsx
// Overlay + modal container
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/50" onClick={onClose} />
  
  {/* Modal Panel */}
  <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800">Judul Modal</h2>
      <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <X size={20} />
      </button>
    </div>
    
    {/* Body */}
    <div className="p-6 space-y-4">
      {/* konten */}
    </div>
    
    {/* Footer */}
    <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
      <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        Batal
      </button>
      <button className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
        Simpan
      </button>
    </div>
  </div>
</div>
```

### Loading State

```jsx
// Skeleton loader untuk card
<div className="animate-pulse space-y-3">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>

// Spinner inline
<div className="flex items-center gap-2 text-sm text-gray-500">
  <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
  Memuat...
</div>
```

### Empty State

```jsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
    <InboxIcon size={24} className="text-gray-400" />
  </div>
  <h3 className="text-sm font-medium text-gray-700 mb-1">Tidak ada data</h3>
  <p className="text-xs text-gray-400">Belum ada data yang tersedia saat ini.</p>
</div>
```

---

## 4. KPI / Statistik Card (Admin Dashboard)

```jsx
<div className="bg-white rounded-xl border border-gray-200 p-5">
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-medium text-gray-600">Omset Hari Ini</span>
    <div className="p-2 bg-teal-50 rounded-lg">
      <TrendingUp size={18} className="text-teal-600" />
    </div>
  </div>
  <p className="text-2xl font-bold text-gray-800">Rp 1.250.000</p>
  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
    <ArrowUpRight size={12} />
    +12% dari kemarin
  </p>
</div>
```

---

## 5. Ikon (Lucide React)

**Wajib gunakan `lucide-react`.** Ukuran standar:

| Konteks            | Size  |
| ------------------ | ----- |
| Tombol inline      | 16    |
| Navigasi sidebar   | 20    |
| KPI / header card  | 18–20 |
| Empty state        | 24    |
| Hero / ilustrasi   | 32–40 |

```jsx
import { Plus, Trash2, Edit, Search, ChevronDown, X, AlertCircle, CheckCircle } from 'lucide-react';
```

---

## 6. Aturan Desain

1. **Konsistensi radius**: gunakan `rounded-lg` (8px) untuk input/tombol, `rounded-xl` (12px) untuk card, `rounded-2xl` (16px) untuk modal.
2. **Shadow ringan**: pakai `shadow-sm` untuk card biasa, `shadow-xl` untuk modal/overlay.
3. **Transisi**: selalu tambahkan `transition-colors` atau `transition-all duration-150` pada elemen interaktif.
4. **Aksesibilitas**: tambahkan `aria-label` pada tombol icon-only, gunakan `focus:ring-2 focus:ring-teal-500` untuk fokus yang jelas.
5. **Mobile-first**: mulai styling dari ukuran kecil, gunakan prefix `sm:`, `md:`, `lg:` untuk breakpoint lebih besar.
6. **Tailwind v4**: jangan gunakan `tailwind.config.js` — konfigurasi custom lewat `@theme` dalam CSS jika perlu. Tidak ada `@apply` untuk utility classes baru.
7. **Bahasa UI**: gunakan Bahasa Indonesia untuk label, placeholder, dan pesan di UI.

---

## 7. Referensi File

- Layout utama: [`DashboardPage.jsx`](file:///d:/Desktop/projects/estehh/frontend/src/pages/DashboardPage.jsx)
- Komponen common: [`frontend/src/components/common/`](file:///d:/Desktop/projects/estehh/frontend/src/components/common/)
- Komponen dashboard: [`frontend/src/components/dashboard/`](file:///d:/Desktop/projects/estehh/frontend/src/components/dashboard/)
- Komponen form: [`frontend/src/components/forms/`](file:///d:/Desktop/projects/estehh/frontend/src/components/forms/)
