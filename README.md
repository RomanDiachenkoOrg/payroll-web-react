# Acme Payroll - web client (React)

Single page web client for the Acme payroll / HR system: employees, weekly timesheets, monthly
pay runs, payslips, departments, a payroll cost report and administration (tax rates, users,
audit log).

The repository also contains a small mock REST API (`mock-server/`, Express + JSON files) so the
client can be run and demoed without the real backend. `npm run dev` starts both.

## Tech stack

- React 18 + TypeScript 5
- Vite 5 (dev server with `/api` proxy, production build)
- Redux Toolkit 2 with RTK Query for all server data (cache tags, invalidation)
- React Router 6
- React Hook Form + Zod (`@hookform/resolvers`) for forms and validation
- Vitest + Testing Library (jsdom) for unit and component tests
- Mock API: Node.js + Express 4, data persisted to JSON files

## Prerequisites

- Node.js 18.18+ (20 or 22 recommended)
- npm 9+

## Running

```bash
npm install
npm run dev
```

- Web client: <http://localhost:5173/>
- Mock API: <http://localhost:4000/api> (proxied by Vite under `/api`)

On first start the mock API copies `mock-server/seed/*.json` into `mock-server/data/`; every change
made in the UI is written there. `npm run reset-data` deletes it so the next start uses the seed
again. The API port can be changed with `API_PORT=4100 npm run dev`.

Other scripts:

| Script              | What it does |
|---------------------|--------------|
| `npm run build`     | Type check (`tsc -b`) and production build into `dist/` |
| `npm run preview`   | Serve the production build (start `npm run dev:api` too for data) |
| `npm run typecheck` | TypeScript only |
| `npm test`          | Run the Vitest suite once |
| `npm run test:watch`| Vitest in watch mode |

## Demo accounts

Password for every account: `Passw0rd!`

| Email                | Role | Access |
|----------------------|------|--------|
| `admin@acme.test`    | Admin | Everything |
| `manager@acme.test`  | Manager (Engineering) | Engineering employees, approves / rejects their timesheets, pay runs (read-only), reports |
| `employee@acme.test` | Employee | Own profile and payslips, own timesheets |

## Screens / routes

| Route | Screen |
|-------|--------|
| `/login` | Sign in (validation, wrong password message) |
| `/` | Dashboard: headcount, last payroll, pending timesheets, next pay date, cost by department chart |
| `/employees` | Search, department / status filters, sortable columns, pagination, deactivate with confirmation |
| `/employees/new`, `/employees/:id/edit` | Employee form (required fields, email format, unique email, salary > 0, hire date not in the future, deductions) |
| `/employees/:id`, `/me` | Profile, salary history with "Add raise", payslips |
| `/timesheets` | List with status filter; submit, approve, reject with reason |
| `/timesheets/new`, `/timesheets/:id` | Weekly timesheet (Mon-Sun, 0-24 h/day, live total and overtime) |
| `/payruns` | Pay runs, create a run for a period |
| `/payruns/:id` | Lines, calculate / recalculate, approve, mark as paid (locked), CSV export |
| `/payslips/:id` | Payslip breakdown, print view, CSV download |
| `/departments` | Departments CRUD (a department with active employees cannot be deleted) |
| `/reports` | Payroll cost by department for a month range, CSV export |
| `/settings/rates`, `/settings/users`, `/settings/audit` | Tax brackets and contribution rates, users, audit log with filters |

The menu only shows what the signed-in role may use; the mock API enforces the same rules.

### Payroll rules (implemented in `mock-server/payroll.js`)

- Salaried: gross = annual salary / 12
- Hourly: rate x regular hours + 1.5 x rate x overtime hours (above 40 per week, approved timesheets)
- Income tax on monthly gross: 0% to 1,000, 15% from 1,000 to 4,000, 25% above (editable in Settings)
- Social contribution 5%, pension 3% when enrolled, plus fixed per-employee deductions
- Net = gross - tax - social - pension - other, rounded half-up to cents (USD)

## Project structure

```
src/
  main.tsx, App.tsx       entry point and routes
  app/                    store, typed hooks, toast slice
  api/                    RTK Query API slice + endpoints per area, shared types
  components/             layout, modal, confirm dialog, pagination, small UI pieces
  features/
    auth/                 login page, auth slice, route guard
    dashboard/ employees/ timesheets/ payruns/ payslips/ departments/ reports/ settings/
  lib/                    zod schemas, formatting, dates, CSV, permissions, list filtering
  test/                   test setup and render helpers
mock-server/
  index.js, app.js        Express app (`/api/...`)
  routes/                 REST endpoints
  payroll.js              pay calculation
  store.js                JSON file storage
  seed/                   demo data (25 employees, 5 departments, pay runs, timesheets, audit log)
  build-seed.js           regenerates the seed files
```

## Tests

```bash
npm test
```

Unit tests cover the zod schemas, formatting / date / CSV helpers, list filtering and permissions;
component tests render the login page, the pagination control and the departments page against a
stubbed `fetch`. CI (`.github/workflows/ci.yml`) runs type check, tests and the production build.
