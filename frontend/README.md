# Es teh Lay Frontend

Dashboard frontend untuk integrasi Google Apps Script backend (`gas_backend`) dengan fitur:

- Login admin/staff
- Overview KPI + chart
- List data `read` dan `read_database`
- Input laporan (`create`)
- Update data (`update`)
- Responsive sidebar layout

## Setup

1. Install dependencies:

```bash
npm install
```

2. Isi env:

```env
VITE_GAS_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

3. Jalankan development:

```bash
npm run dev
```

## Struktur Folder

```text
src/
  components/
    common/
    dashboard/
    forms/
    layout/
  constants/
  pages/
  hooks/
  services/
  utils/
  App.jsx
  index.css
```

## Scripts

- `npm run dev`: run local dev server
- `npm run lint`: run eslint
- `npm run build`: build production bundle
- `npm run test`: run unit + smoke tests once
- `npm run test:watch`: run tests in watch mode
