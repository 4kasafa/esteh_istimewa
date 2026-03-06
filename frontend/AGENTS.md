# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + React frontend. Keep code in `src/` and static public assets in `public/`.

- `src/components/`: UI building blocks (`common/`, `dashboard/`, `forms/`, `layout/`)
- `src/pages/`: route-level screens (`LoginPage`, `DashboardPage`)
- `src/hooks/`: reusable state/data hooks (`useAuthSession`, `useDashboardData`)
- `src/services/`: API integration (Google Apps Script client)
- `src/utils/`: pure helpers and mappers, with colocated tests (`*.test.js`)
- `src/test/setup.js`: shared Vitest + Testing Library setup
- `example/`: sample JSON payloads for local reference

## Build, Test, and Development Commands
Run from repository root:

- `npm install`: install dependencies
- `npm run dev`: start Vite dev server
- `npm run build`: create production build in `dist/`
- `npm run preview`: preview built app locally
- `npm run lint`: run ESLint across the project
- `npm run test`: run all Vitest tests once (CI-style)
- `npm run test:watch`: run Vitest in watch mode

## Coding Style & Naming Conventions
- Use ES modules and React function components.
- Follow existing formatting: 2-space indentation and semicolons.
- Components/pages/hooks use `PascalCase` file names (e.g., `ReportPanel.jsx`, `useAuthSession.js`).
- Utility modules use lowercase descriptive names (e.g., `formatters.js`, `dashboard.js`).
- Keep hooks in `src/hooks`, API logic in `src/services`, and avoid mixing concerns.
- Respect ESLint (`eslint.config.js`), especially `no-unused-vars` rules.

## Testing Guidelines
- Framework: Vitest + Testing Library + `jsdom`.
- Test files use `*.test.js` or `*.test.jsx`, usually next to the module under test.
- Prefer behavior-focused tests (`describe`/`it`) and mock network with `vi.stubGlobal("fetch", ...)`.
- Run `npm run test` before opening a PR; ensure smoke test coverage for critical app flows.

## Commit & Pull Request Guidelines
Current history contains a single `init` commit, so no strict convention is established yet.

- Use clear, imperative commit messages (recommended: Conventional Commits, e.g., `feat: add monthly report filter`).
- Keep commits focused and atomic.
- PRs should include: concise summary, linked issue/task, test notes (`npm run lint`, `npm run test`), and screenshots/GIFs for UI changes.

## Security & Configuration Tips
- Copy `.env.example` to `.env` and set `VITE_GAS_API_URL`.
- Never commit secrets or real production tokens.
- Validate API URL changes carefully; this app depends on Google Apps Script endpoints.
