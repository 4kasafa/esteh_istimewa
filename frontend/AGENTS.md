# Repository Guidelines (Frontend Focus)

## Project Structure (`frontend/`)
- `src/components/`: UI building blocks (`common/`, `dashboard/`, `forms/`, `layout/`)
- `src/pages/`: Route-level screens (`LoginPage`, `DashboardPage`)
- `src/hooks/`: Reusable state/data hooks (`useAuthSession`, `useDashboardData`)
- `src/services/`: API integration (Google Apps Script client)
- `src/utils/`: Pure helpers/mappers with colocated tests (`*.test.js`)

## Commands (Run in `frontend/`)
- `npm run dev`: Dev server
- `npm run build`: Production build (`dist/`)
- `npm run lint`: ESLint check (`eslint.config.js`)
- `npm run test`: Vitest run once
- `npm run test:watch`: Vitest watch mode

## Conventions & Quirks
- React function components, `PascalCase` filenames, 2-space indentation.
- Setup `.env` from `.env.example` with `VITE_GAS_API_URL`.
- Tests use Vitest + Testing Library + `jsdom`. Stub fetch globally (`vi.stubGlobal("fetch", ...)`).
- API client (`gasApi.js`) sends `Content-Type: text/plain;charset=utf-8` (GAS requirement), uses `authorization: Bearer <token>` in body.
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js`).