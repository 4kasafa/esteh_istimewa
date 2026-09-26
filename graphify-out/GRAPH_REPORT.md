# Graph Report - estehh  (2026-09-26)

## Corpus Check
- 88 files · ~95,763 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 540 nodes · 907 edges · 49 communities (47 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd3a9be4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- reports.js
- OnlineStatusBadge.jsx
- useDashboardData.js
- scripts
- dashboard.js
- Postman Unit Test - Gas Backend API
- formatters.js
- devDependencies
- Frontend Implementation Guide
- Frontend Implementation Guide
- SheetRepository.js
- appsscript.json
- Development Conventions
- Development Conventions
- Urutan Pekerjaan
- Config.js
- TransactionService.js
- AuthService.js
- Gas Backend API (Google Apps Script) - Es Teh Istimewa
- Repository Guidelines (Frontend Focus)
- Code.js
- Es teh Lay Frontend
- MasterService.js
- Setup.js
- generate-icons.mjs
- DashboardPage.jsx
- 10) Negative Test `read_master` pakai token staff (harus gagal)
- 10a) Negative Test `setup_rekap` pakai token staff (harus gagal)
- 10b) Endpoint administratif GET hanya untuk admin
- 11) Negative Test `create` tanpa token
- 12) Test Endpoint `logout` (admin)
- 13) Negative Test token revoked (setelah logout)
- 3) Test Endpoint `login` (admin)
- 4) Test Endpoint `login` (staff)
- 5) Test Endpoint `create` (admin)
- 6) Test Endpoint `read` list (admin)
- 7) Test Endpoint `read` detail by `id`
- 8) Test Endpoint `update` (admin)
- 9) Test Endpoint `read_database` (admin only)
- 9a) Test Endpoint `read` bulanan by `NO TRANSAKSI` (admin only)
- 9b) Test Endpoint `read_database` bulanan by `TIME STAMP INPUT` (admin only)

## God Nodes (most connected - your core abstractions)
1. `toCurrency()` - 20 edges
2. `Postman Unit Test - Gas Backend API` - 20 edges
3. `parseLooseNumber()` - 14 edges
4. `useDashboardData()` - 13 edges
5. `mapApiErrorMessage()` - 12 edges
6. `getOrCreateMonthlySpreadsheet_()` - 12 edges
7. `getTodayDateString()` - 11 edges
8. `sanitizeReportRows()` - 11 edges
9. `Frontend Implementation Guide` - 11 edges
10. `Frontend Implementation Guide` - 11 edges

## Surprising Connections (you probably didn't know these)
- `KasKeluarPanel()` --calls--> `mapApiErrorMessage()`  [EXTRACTED]
  frontend/src/components/dashboard/KasKeluarPanel.jsx → frontend/src/utils/errors.js
- `KasKeluarPanel()` --calls--> `toCurrency()`  [EXTRACTED]
  frontend/src/components/dashboard/KasKeluarPanel.jsx → frontend/src/utils/formatters.js
- `OmsetCard()` --calls--> `toCurrency()`  [EXTRACTED]
  frontend/src/components/dashboard/OverviewPanel.jsx → frontend/src/utils/formatters.js
- `DepositCard()` --calls--> `toCurrency()`  [EXTRACTED]
  frontend/src/components/dashboard/OverviewPanel.jsx → frontend/src/utils/formatters.js
- `MiniChips()` --calls--> `toCurrency()`  [EXTRACTED]
  frontend/src/components/dashboard/OverviewPanel.jsx → frontend/src/utils/formatters.js

## Import Cycles
- None detected.

## Communities (49 total, 2 thin omitted)

### Community 0 - "reports.js"
Cohesion: 0.10
Nodes (34): getDefaultFilter(), PAGE_SIZE_OPTIONS, ReportPanel(), ReportTable(), SmartRowMobile(), TRANSACTION_COLUMNS, TransactionTable(), formatTimestamp() (+26 more)

### Community 1 - "OnlineStatusBadge.jsx"
Cohesion: 0.43
Nodes (3): getSnapshot(), OnlineStatusBadge(), subscribe()

### Community 2 - "useDashboardData.js"
Cohesion: 0.12
Nodes (24): App(), createDefaultGasMock(), mockSuccess(), loadStoredUser(), useAuthSession(), DEFAULT_MASTER, extractSisaPatch(), patchYesterdayStock() (+16 more)

### Community 3 - "scripts"
Cohesion: 0.08
Nodes (23): dependencies, lucide-react, react, react-dom, tailwindcss, @tailwindcss/vite, name, private (+15 more)

### Community 4 - "dashboard.js"
Cohesion: 0.13
Nodes (30): buildSegments(), DonutChart(), buildPoints(), LineChart(), CompactTransactionTable(), DepositCard(), MiniChips(), OmsetCard() (+22 more)

### Community 5 - "Postman Unit Test - Gas Backend API"
Cohesion: 0.33
Nodes (5): 15) Test Akses Staff (Tahap 2), 1) Persiapan, 2) Struktur Collection, Catatan, Postman Unit Test - Gas Backend API

### Community 6 - "formatters.js"
Cohesion: 0.14
Nodes (21): Alert(), CustomSelect(), cursorPosForDigits(), RupiahInput(), buildEmptyExpense(), KasKeluarPanel(), PemasukanPanel(), defaultProps (+13 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (33): eslint, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js (+25 more)

### Community 8 - "Frontend Implementation Guide"
Cohesion: 0.10
Nodes (20): 10) Checklist Integrasi Frontend, 1) Base URL, 2) Format Request Dasar (POST JSON), 3) Helper API (JavaScript), 4) Login + Simpan Token, 5) Read Data (Rincian), 6) Read Data Database, 7) Create dan Update (+12 more)

### Community 9 - "Frontend Implementation Guide"
Cohesion: 0.10
Nodes (19): 10) Checklist Integrasi Frontend, 1) Base URL, 2) Format Request Dasar (POST JSON), 3) Helper API (JavaScript), 4) Login + Simpan Token, 5) Read Data (Rincian), 6) Read Data Database, 7) Create dan Update (+11 more)

### Community 10 - "SheetRepository.js"
Cohesion: 0.14
Nodes (37): appendRowsBatch_(), appendTableRow_(), applyMasterDataValidations_(), applyOptimalColumnWidths_(), buildRowLookup_(), COLUMN_WIDTH_MAP, columnIndexToLetter_(), ensureMonthlyTabsExist_() (+29 more)

### Community 11 - "appsscript.json"
Cohesion: 0.17
Nodes (11): dependencies, exceptionLogging, oauthScopes, runtimeVersion, timeZone, webapp, access, executeAs (+3 more)

### Community 12 - "Development Conventions"
Cohesion: 0.14
Nodes (13): API Integration, Architecture, Building and Running, Component Design, Development Conventions, Environment Setup, Error Handling, GEMINI.md - Es Teh Lay Frontend (+5 more)

### Community 13 - "Development Conventions"
Cohesion: 0.17
Nodes (11): Architecture, Authentication & Roles, Building and Running, Coding Style, Database Schema (Sheets), Deployment Commands, Development Conventions, Gas Backend API (Google Apps Script) (+3 more)

### Community 15 - "Urutan Pekerjaan"
Cohesion: 0.18
Nodes (10): 1. Kunci endpoint GET yang bersifat administratif, 2. Tegakkan akses laporan staff berdasarkan nama dan tanggal hari ini, 3. Hilangkan bottleneck pembacaan laporan, 4. Hilangkan pembacaan Spreadsheet dan payload yang duplikat saat dashboard dimuat, 5. Validasi rilis, Aturan Eksekusi Agent, Log Hambatan, Log Penyelesaian (+2 more)

### Community 18 - "TransactionService.js"
Cohesion: 0.31
Nodes (5): buildReportRows_(), getPreviousPeriod_(), handleDashboardInit_(), handleGetInitialFormData_(), handleReadReports_()

### Community 19 - "AuthService.js"
Cohesion: 0.36
Nodes (8): getCachedSession_(), getSessionCache_(), getSessionProperties_(), handleLogin_(), handleLogout_(), putSessionCache_(), removeSessionCache_(), requireAuthSession_()

### Community 20 - "Gas Backend API (Google Apps Script) - Es Teh Istimewa"
Cohesion: 0.33
Nodes (5): 1. Arsitektur Google Drive & Google Sheets, 2. Struktur Modul Backend, 3. Rumus & Logika Finansial, 4. Daftar Endpoint API (POST JSON), Gas Backend API (Google Apps Script) - Es Teh Istimewa

### Community 21 - "Repository Guidelines (Frontend Focus)"
Cohesion: 0.40
Nodes (4): Commands (Run in `frontend/`), Conventions & Quirks, Project Structure (`frontend/`), Repository Guidelines (Frontend Focus)

### Community 24 - "Es teh Lay Frontend"
Cohesion: 0.40
Nodes (4): Es teh Lay Frontend, Scripts, Setup, Struktur Folder

### Community 32 - "MasterService.js"
Cohesion: 0.29
Nodes (9): handleCreateManyMaster_(), handleUpdateMaster_(), masterIdPrefix_(), masterNameKey_(), normalizeBulkMasterItem_(), onEdit(), revokeUserSessions_(), syncBahanBakuToTipePengeluaran_() (+1 more)

### Community 36 - "Setup.js"
Cohesion: 0.28
Nodes (3): applyMasterDataValidations_(), resetAndCleanAllSheets(), setupMasterSpreadsheet()

### Community 43 - "generate-icons.mjs"
Cohesion: 0.20
Nodes (9): __dirname, iconsDir, publicDir, sizes, svgBuffer, svgPath, ref_fs, ref_path (+1 more)

### Community 44 - "DashboardPage.jsx"
Cohesion: 0.06
Nodes (31): ConfirmDialog(), Skeleton(), SkeletonCard(), SkeletonText(), AddBahanModal(), POPULAR_UNITS, AddCabangModal(), AddKaryawanModal() (+23 more)

### Community 46 - "10) Negative Test `read_master` pakai token staff (harus gagal)"
Cohesion: 0.67
Nodes (3): 10) Negative Test `read_master` pakai token staff (harus gagal), Request, Tests

### Community 47 - "10a) Negative Test `setup_rekap` pakai token staff (harus gagal)"
Cohesion: 0.67
Nodes (3): 10a) Negative Test `setup_rekap` pakai token staff (harus gagal), Request, Tests

### Community 48 - "10b) Endpoint administratif GET hanya untuk admin"
Cohesion: 0.67
Nodes (3): 10b) Endpoint administratif GET hanya untuk admin, Tanpa token dan token staff, Token admin

### Community 49 - "11) Negative Test `create` tanpa token"
Cohesion: 0.67
Nodes (3): 11) Negative Test `create` tanpa token, Request, Tests

### Community 50 - "12) Test Endpoint `logout` (admin)"
Cohesion: 0.67
Nodes (3): 12) Test Endpoint `logout` (admin), Request, Tests

### Community 51 - "13) Negative Test token revoked (setelah logout)"
Cohesion: 0.67
Nodes (3): 13) Negative Test token revoked (setelah logout), Request, Tests

### Community 52 - "3) Test Endpoint `login` (admin)"
Cohesion: 0.67
Nodes (3): 3) Test Endpoint `login` (admin), Request, Tests (tab `Tests`)

### Community 53 - "4) Test Endpoint `login` (staff)"
Cohesion: 0.67
Nodes (3): 4) Test Endpoint `login` (staff), Request, Tests

### Community 54 - "5) Test Endpoint `create` (admin)"
Cohesion: 0.67
Nodes (3): 5) Test Endpoint `create` (admin), Request, Tests

### Community 55 - "6) Test Endpoint `read` list (admin)"
Cohesion: 0.67
Nodes (3): 6) Test Endpoint `read` list (admin), Request, Tests

### Community 56 - "7) Test Endpoint `read` detail by `id`"
Cohesion: 0.67
Nodes (3): 7) Test Endpoint `read` detail by `id`, Request, Tests

### Community 57 - "8) Test Endpoint `update` (admin)"
Cohesion: 0.67
Nodes (3): 8) Test Endpoint `update` (admin), Request, Tests

### Community 58 - "9) Test Endpoint `read_database` (admin only)"
Cohesion: 0.67
Nodes (3): 9) Test Endpoint `read_database` (admin only), Request, Tests

### Community 59 - "9a) Test Endpoint `read` bulanan by `NO TRANSAKSI` (admin only)"
Cohesion: 0.67
Nodes (3): 9a) Test Endpoint `read` bulanan by `NO TRANSAKSI` (admin only), Request, Tests

### Community 60 - "9b) Test Endpoint `read_database` bulanan by `TIME STAMP INPUT` (admin only)"
Cohesion: 0.67
Nodes (3): 9b) Test Endpoint `read_database` bulanan by `TIME STAMP INPUT` (admin only), Request, Tests

## Knowledge Gaps
- **171 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+166 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Postman Unit Test - Gas Backend API` connect `Postman Unit Test - Gas Backend API` to `10) Negative Test `read_master` pakai token staff (harus gagal)`, `10a) Negative Test `setup_rekap` pakai token staff (harus gagal)`, `10b) Endpoint administratif GET hanya untuk admin`, `11) Negative Test `create` tanpa token`, `12) Test Endpoint `logout` (admin)`, `13) Negative Test token revoked (setelah logout)`, `3) Test Endpoint `login` (admin)`, `4) Test Endpoint `login` (staff)`, `5) Test Endpoint `create` (admin)`, `6) Test Endpoint `read` list (admin)`, `7) Test Endpoint `read` detail by `id``, `8) Test Endpoint `update` (admin)`, `9) Test Endpoint `read_database` (admin only)`, `9a) Test Endpoint `read` bulanan by `NO TRANSAKSI` (admin only)`, `9b) Test Endpoint `read_database` bulanan by `TIME STAMP INPUT` (admin only)`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `mapApiErrorMessage()` connect `useDashboardData.js` to `formatters.js`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _171 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reports.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10099573257467995 - nodes in this community are weakly interconnected._
- **Should `useDashboardData.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._