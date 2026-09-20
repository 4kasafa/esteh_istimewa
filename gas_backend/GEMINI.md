# Gas Backend API (Google Apps Script)

## Project Overview
This project is a backend API built with Google Apps Script (V8) with a centralized **Master Spreadsheet + Monthly Transaction Files** architecture in Google Drive. It supports outlet operations, staff reporting, master data management, and financial summaries for the business owner.

### Main Technologies
- **Google Apps Script (V8):** Core runtime environment.
- **Google Sheets & Google Drive:** Data storage (spreadsheets).
- **clasp:** Tool for local development and deployment of Apps Script projects.
- **Authentication:** Token-based session management using CacheService (L1) with Sheets fallback.

### Architecture
The project follows a modular structure where different services handle specific tasks:
- **`Code.js`**: Router for `doGet` and `doPost` requests, managing API actions.
- **`AuthService.js`**: Handles login/logout, session token management, and role authorization (`admin`, `staff`).
- **`SheetRepository.js`**: Central I/O gateway for Master Spreadsheet and auto-generation of Monthly Files with Rekapitulasi formulas.
- **`MasterService.js`**: CRUD for master entities (User, Cabang, Bahan Baku, Tipe Pengeluaran, Sumber Pemasukan) with automatic one-way sync and onEdit auto-ID trigger.
- **`TransactionService.js`**: Handles daily staff transaction reports, itemized expense logging to `Pengeluaran` tab, and stock tracking.
- **`SummaryService.js`**: Calculates KPI aggregates (Omset, Pengeluaran, Setoran, Bahan Terpakai) for Dashboard Owner.
- **`ResponseHelper.js`**: Uniform JSON response helper (`{ success, data, message, timestamp }`), sanitization, and parsing utilities.
- **`Config.js`**: Centralized configuration for spreadsheet IDs, sheet names, timezones, and master default schemas.
- **`Setup.js`**: 1-click `setupMasterSpreadsheet()` initialization and duplicate cleanup utility.

## Building and Running
As a Google Apps Script project, it doesn't have a traditional "build" or "run" process on the local machine. Instead, it is pushed to the Google Cloud environment.

### Deployment Commands
- **Install Dependencies:** (Ensure `clasp` is installed globally)
  ```bash
  npm install -g @google/clasp
  ```
- **Login to Google Account:**
  ```bash
  clasp login
  ```
- **Push Changes to Apps Script:**
  ```bash
  clasp push
  ```
- **Open Project in Browser:**
  ```bash
  clasp open
  ```
- **Deploy Web App:** 
  Use the Google Apps Script web editor to create/update deployments and get the Web App URL.

### Testing
- **Postman Unit Tests:** Detailed test cases are documented in `POSTMAN_UNIT_TESTS.md`.
- **Manual Verification:** Use the `clasp open` command to run internal functions (e.g., `setupMasterSpreadsheet()`) or debug via the Apps Script editor.

## Development Conventions

### Coding Style
- **Internal Functions:** Private or helper functions are typically suffixed with an underscore (e.g., `sanitize_`, `requireAuthSession_`).
- **Standardized Response:** All API endpoints return a consistent JSON format:
  ```json
  {
    "success": boolean,
    "message": "string",
    "data": object|null
  }
  ```
- **Configuration-Driven:** Structural settings (headers, numeric fields) are defined in `Config.js`.

### Authentication & Roles
- **Bearer Tokens:** Requests require an `Authorization: Bearer <token>` header or a `token` field in the request body.
- **Roles:**
  - `Admin`: Full access to all endpoints, KPI summaries, and master data management.
  - `Staff`: Restricted to daily transaction input and viewing outlet reports.

### Database Schema (Sheets)
- **Master Spreadsheet (`Master_Esteh`)**:
  - `User`: Strictly 6 columns (`ID`, `NAMA / USERNAME`, `NO. TELEPON`, `PASSWORD`, `ROLE` [Admin/Staff], `STATUS` [Aktif/Non Aktif]).
  - `Cabang`: `ID_CABANG`, `NAMA_CABANG`, `ALAMAT`, `STATUS`.
  - `Bahan_Baku`: `ID_BAHAN`, `NAMA_BAHAN`, `SATUAN`.
  - `Tipe_Pengeluaran`: `ID_TIPE`, `NAMA_TIPE`.
  - `Sumber_Pemasukan`: `ID_SUMBER`, `NAMA_SUMBER`, `STATUS`.
  - `List_File_Bulanan`: Catalog of monthly file IDs.
  - `Sessions`: Active token sessions.
- **Monthly Spreadsheet (`Esteh - Laporan Bulanan YYYY-MM`)**:
  - `Transaksi`: Daily reports logged by staff.
  - `Pengeluaran`: Itemized expenses logged per transaction.
  - `Rekapitulasi`: Auto-calculated daily branch totals, expense sums, and net balance via native formulas.
  - `Log_Aplikasi`: Activity audit log.
