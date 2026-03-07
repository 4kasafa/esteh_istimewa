# Gas Backend API (Google Apps Script)

## Project Overview
This project is a backend API built with Google Apps Script (V8) that uses Google Sheets as a database. It is designed to support a cashier system, providing features for transaction management, authentication, role-based access control, and automatic calculations.

### Main Technologies
- **Google Apps Script (V8):** Core runtime environment.
- **Google Sheets:** Data storage (spreadsheets).
- **clasp:** Tool for local development and deployment of Apps Script projects.
- **Authentication:** Token-based session management.

### Architecture
The project follows a modular structure where different services handle specific tasks:
- **`Code.js`**: Router for `doGet` and `doPost` requests, managing the core API flow.
- **`Auth.js`**: Handles login/logout, session management, and role-based permissions (`admin`, `kasir`).
- **`DatabaseService.js`**: Manages synchronization and reading from the `Database` sheet.
- **`CalculationService.js`**: Implements business logic for automatic calculations like stock (`STOK AWAL/AKHIR`) and totals (`TOTAL NOTA`, `UANG MASUK`).
- **`CommonUtils.js`**: Utility functions for sanitization, parsing, and standardized JSON responses.
- **`SheetUtils.js`**: Helpers for interacting with the Google Sheets API and header mapping.
- **`Config.js`**: Centralized configuration for spreadsheet IDs, sheet names, and column headers.

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
- **Manual Verification:** Use the `clasp open` command to run internal functions (e.g., `setupSessionCleanupTrigger_`) or debug via the Apps Script editor.

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
- **Configuration-Driven:** Most structural settings (headers, numeric fields) are defined in `Config.js`.

### Authentication & Roles
- **Bearer Tokens:** Requests require an `Authorization: Bearer <token>` header or a `token` field in the request body.
- **Roles:**
  - `admin`: Full access to all data and endpoints.
  - `kasir`: Limited to one report per day and restricted to editing their own data.

### Database Schema (Sheets)
- **`Rincian`**: Main transaction data.
- **`Database`**: Synchronized data for reporting.
- **`User`**: User credentials and roles.
- **`Sessions`**: Active and revoked tokens.

### Key Maintenance Tasks
- Run `setupSessionCleanupTrigger_()` in the Apps Script editor once after deployment to enable automatic session cleanup.
