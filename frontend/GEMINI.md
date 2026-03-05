# GEMINI.md - Es Teh Lay Frontend

## Project Overview
This is the frontend for the **Es Teh Lay** dashboard, a management and reporting tool for beverage outlet operations. It is a React 19 application built with Vite and Tailwind CSS 4. The application integrates with a Google Apps Script (GAS) backend for data persistence and business logic.

### Key Technologies
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **State Management**: Custom React Hooks (`useAuthSession`, `useDashboardData`)
- **Testing**: Vitest + React Testing Library
- **API**: Custom `gasRequest` utility communicating with Google Apps Script via POST JSON.

### Architecture
- `src/components/`: Modular UI components categorized by function (common, dashboard, forms, layout).
- `src/hooks/`: Business logic and state management separated from UI.
- `src/pages/`: Top-level page components (`LoginPage`, `DashboardPage`).
- `src/services/`: API communication layer (`gasApi.js`).
- `src/utils/`: Pure helper functions for formatting, error handling, and data processing.
- `src/constants/`: Configuration for menus and forms.

## Building and Running

### Environment Setup
Create a `.env` file in the root directory:
```env
VITE_GAS_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

### Key Commands
- `npm install`: Install project dependencies.
- `npm run dev`: Start the local development server.
- `npm run build`: Create a production bundle in the `dist/` directory.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Run ESLint to check for code quality issues.
- `npm run test`: Execute unit and smoke tests using Vitest.
- `npm run test:watch`: Run tests in interactive watch mode.

## Development Conventions

### API Integration
- All primary API calls are handled via `src/services/gasApi.js`.
- Requests use the `POST` method with a JSON body containing an `action` field.
- Authentication is handled via a `Bearer` token in the `authorization` field of the JSON body.

### Component Design
- **Responsive Layout**: Managed in `DashboardPage.jsx` using a viewport mode system (mobile, tablet, desktop).
- **Styling**: Uses Tailwind CSS 4. Avoid adding large custom CSS files; prefer utility classes.
- **Icons**: Always use `lucide-react` icons.

### User Roles
- **Admin**: Full access to KPI charts, database list, and monthly filtering.
- **Kasir (Cashier)**: Restricted access to inputting daily reports and viewing their own transaction history.

### Testing
- Smoke tests are located alongside components (e.g., `App.smoke.test.jsx`).
- Utility tests are located in `src/utils/*.test.js`.
- Ensure new features or bug fixes include corresponding tests in Vitest.

### Error Handling
- Use `mapApiErrorMessage` from `src/utils/errors.js` to provide user-friendly error messages from backend responses.
- Runtime errors are caught at the top level in `App.jsx` and displayed via a fallback UI.
