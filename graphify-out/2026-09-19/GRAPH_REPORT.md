# Graph Report - estehh  (2026-09-19)

## Corpus Check
- 77 files · ~66,680 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 486 nodes · 670 edges · 45 communities (36 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a5cc3b44`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- reports.js
- DashboardPage.jsx
- App.jsx
- package.json
- dashboard.js
- Postman Unit Test - Gas Backend API
- What You Must Do When Invoked
- devDependencies
- Frontend Implementation Guide
- Frontend Implementation Guide
- SheetRepository.js
- appsscript.json
- Development Conventions
- Development Conventions
- Config.js
- graphify reference: extra exports and benchmark
- Repository Guidelines
- graphify reference: query, path, explain
- cabang.js
- Gas Backend API (Google Apps Script) - Es Teh Istimewa
- Es teh Lay Frontend
- TransactionService.js
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- rules/graphify.md
- extraction-spec.md
- workflows/graphify.md
- karyawan.js
- KasKeluarPanel.jsx

## God Nodes (most connected - your core abstractions)
1. `Postman Unit Test - Gas Backend API` - 19 edges
2. `toCurrency()` - 14 edges
3. `parseLooseNumber()` - 13 edges
4. `ReportPanel()` - 12 edges
5. `parseTimestamp()` - 12 edges
6. `toPeriodValue()` - 12 edges
7. `What You Must Do When Invoked` - 12 edges
8. `OverviewPanel()` - 11 edges
9. `/graphify` - 11 edges
10. `Frontend Implementation Guide` - 11 edges

## Surprising Connections (you probably didn't know these)
- `KasKeluarPanel()` --calls--> `filterRows()`  [EXTRACTED]
  frontend/src/components/dashboard/KasKeluarPanel.jsx → frontend/src/utils/dashboard.js
- `KasKeluarPanel()` --calls--> `mapApiErrorMessage()`  [EXTRACTED]
  frontend/src/components/dashboard/KasKeluarPanel.jsx → frontend/src/utils/errors.js
- `KasKeluarPanel()` --calls--> `toPeriodValue()`  [EXTRACTED]
  frontend/src/components/dashboard/KasKeluarPanel.jsx → frontend/src/utils/formatters.js
- `getDefaultFilter()` --calls--> `toPeriodValue()`  [EXTRACTED]
  frontend/src/components/dashboard/ReportPanel.jsx → frontend/src/utils/formatters.js
- `ReportTable()` --calls--> `toCurrency()`  [EXTRACTED]
  frontend/src/components/dashboard/ReportPanel.jsx → frontend/src/utils/formatters.js

## Import Cycles
- None detected.

## Communities (45 total, 9 thin omitted)

### Community 0 - "reports.js"
Cohesion: 0.09
Nodes (32): getDefaultFilter(), PAGE_SIZE_OPTIONS, ReportPanel(), ReportTable(), filterRows(), parseLooseNumber(), applyReportFilters(), buildDenominationList() (+24 more)

### Community 1 - "DashboardPage.jsx"
Cohesion: 0.08
Nodes (20): ConfirmDialog(), AddCabangModal(), AddKaryawanModal(), CabangPanel(), KaryawanPanel(), SettingPanel(), ICON_MAP, Sidebar() (+12 more)

### Community 2 - "App.jsx"
Cohesion: 0.19
Nodes (11): App(), loadStoredUser(), useAuthSession(), toRows(), useDashboardData(), frontend_src_index, gasRequest(), ERROR_MAP (+3 more)

### Community 3 - "package.json"
Cohesion: 0.09
Nodes (22): dependencies, lucide-react, react, react-dom, tailwindcss, @tailwindcss/vite, name, private (+14 more)

### Community 4 - "dashboard.js"
Cohesion: 0.13
Nodes (31): BarChart(), buildSegments(), DonutChart(), buildPoints(), LineChart(), getDefaultFilter(), OverviewPanel(), applyDashboardFilters() (+23 more)

### Community 5 - "Postman Unit Test - Gas Backend API"
Cohesion: 0.04
Nodes (47): 10) Negative Test `read_database` pakai token kasir (harus gagal), 10a) Negative Test `read` bulanan pakai token kasir (harus gagal), 11) Negative Test `create` tanpa token, 12) Test Endpoint `logout` (admin), 13) Negative Test token revoked (setelah logout), 14) Opsional - Jalankan otomatis via Collection Runner, 1) Persiapan, 2) Struktur Collection (+39 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 7 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+21 more)

### Community 8 - "Frontend Implementation Guide"
Cohesion: 0.10
Nodes (20): 10) Checklist Integrasi Frontend, 1) Base URL, 2) Format Request Dasar (POST JSON), 3) Helper API (JavaScript), 4) Login + Simpan Token, 5) Read Data (Rincian), 6) Read Data Database, 7) Create dan Update (+12 more)

### Community 9 - "Frontend Implementation Guide"
Cohesion: 0.10
Nodes (19): 10) Checklist Integrasi Frontend, 1) Base URL, 2) Format Request Dasar (POST JSON), 3) Helper API (JavaScript), 4) Login + Simpan Token, 5) Read Data (Rincian), 6) Read Data Database, 7) Create dan Update (+11 more)

### Community 10 - "SheetRepository.js"
Cohesion: 0.23
Nodes (19): appendTableRow_(), columnIndexToLetter_(), formatHeaderRange_(), getBahanHeaderPrefix_(), getFieldCaseInsensitive_(), getMasterSheet_(), getMasterSpreadsheet_(), getOrCreateMonthlySpreadsheet_() (+11 more)

### Community 11 - "appsscript.json"
Cohesion: 0.17
Nodes (11): dependencies, exceptionLogging, oauthScopes, runtimeVersion, timeZone, webapp, access, executeAs (+3 more)

### Community 12 - "Development Conventions"
Cohesion: 0.14
Nodes (13): API Integration, Architecture, Building and Running, Component Design, Development Conventions, Environment Setup, Error Handling, GEMINI.md - Es Teh Lay Frontend (+5 more)

### Community 14 - "Development Conventions"
Cohesion: 0.15
Nodes (12): Architecture, Authentication & Roles, Building and Running, Coding Style, Database Schema (Sheets), Deployment Commands, Development Conventions, Gas Backend API (Google Apps Script) (+4 more)

### Community 18 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 20 - "Repository Guidelines"
Cohesion: 0.25
Nodes (7): Build, Test, and Development Commands, Coding Style & Naming Conventions, Commit & Pull Request Guidelines, Project Structure & Module Organization, Repository Guidelines, Security & Configuration Tips, Testing Guidelines

### Community 21 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 23 - "Gas Backend API (Google Apps Script) - Es Teh Istimewa"
Cohesion: 0.33
Nodes (5): 1. Arsitektur Google Drive & Google Sheets, 2. Struktur Modul Backend, 3. Rumus & Logika Finansial, 4. Daftar Endpoint API (POST JSON), Gas Backend API (Google Apps Script) - Es Teh Istimewa

### Community 24 - "Es teh Lay Frontend"
Cohesion: 0.40
Nodes (4): Es teh Lay Frontend, Scripts, Setup, Struktur Folder

### Community 27 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 28 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 29 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 44 - "KasKeluarPanel.jsx"
Cohesion: 0.16
Nodes (15): Alert(), CustomSelect(), DataTable(), PAGE_SIZE_OPTIONS, buildEmptyForm(), extractTimestamp(), formatMonthLabel(), HIDDEN_COLUMNS (+7 more)

## Knowledge Gaps
- **203 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+198 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `parseTimestamp()` connect `KasKeluarPanel.jsx` to `reports.js`, `DashboardPage.jsx`, `dashboard.js`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _203 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reports.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0945945945945946 - nodes in this community are weakly interconnected._
- **Should `DashboardPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08143939393939394 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `dashboard.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13205128205128205 - nodes in this community are weakly interconnected._