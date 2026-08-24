# AGENTS.md

Vue 3 + Vite SPA for a Restaurant Management System MVP (POS, KDS, payments, reports).
Frontend only — talks to a separate backend over HTTP. All API code lives in `src/api/`.

## Product context (what we're building)

- 4 roles: **Admin, Manager, Cashier, Kitchen**; every user belongs to one branch.
- Manager/Cashier see only their assigned branch; Admin manages branches/staff/reports.
- Order flow: Pending → Preparing → Ready → Completed. Payment allowed only on Ready orders; payment completes the order and frees its table.
- Money math: subtotal = Σ(variant price × qty); total = subtotal + tax (per-branch rate) + service charge (per-branch).
- Kitchen Display auto-refreshes, sorted oldest-first, shows pending/preparing orders with item notes.
- Dashboard/sales reports: today's sales, order count, active orders, top 5 items, date-range + branch filters, CSV/Excel export.
- Responsive (tablet-friendly), role-gated routes/actions everywhere.

## Commands

```sh
npm run dev         # vite dev server
npm run build       # production build
npm run test:unit   # vitest (watch mode); CI-style once: npx vitest run
npx vitest run src/components/__tests__/HelloWorld.spec.js  # single test file
npm run lint        # oxlint THEN eslint, both with --fix
npm run format      # prettier, only formats src/
```

- Requires Node `^22.18.0 || >=24.12.0`.
- `lint` mutates files (`--fix`). Run it before finishing work; there is no separate typecheck (plain JS, `jsconfig.json` only).

## Conventions & gotchas

- Path alias: `@` → `src/`.
- **Tailwind CSS v4** — CSS-first config via `@import 'tailwindcss'` in `src/assets/main.css`; there is NO `tailwind.config.js`. Add theme extensions with `@theme` in CSS.
- Prettier: no semicolons, single quotes, 100 print width, Tailwind class sorting (`prettier-plugin-tailwindcss`).
- ESLint flat config disables rules already covered by oxlint (`eslint-plugin-oxlint`) — don't re-add them.
- Tests: colocated `__tests__/` folders, `*.spec.js`, jsdom environment; `e2e/` is excluded from vitest.
- Toast notifications use `vue3-toastify`.

## Structure / where things go

```
src/
  api/          # ALL backend calls (axios instances/services) — never call fetch/axios directly in components or stores' actions without going through here
  components/
    common/     # reusable UI pieces
    layout/     # app shells, nav, sidebars
  views/        # route pages (grouped by domain, e.g. views/auth/)
    auth/       # current WIP: login/forgot-password flows
  stores/       # pinia stores
  router/       # vue-router; add role guards here when wiring auth
```

Current state: fresh scaffold on branch `feature/authentication` — router routes are placeholders, most folders are empty.

## Dependencies

Runtime:

| Package | Purpose |
| --- | --- |
| `vue` | UI framework |
| `vue-router` | routing |
| `pinia` | state management |
| `axios` | HTTP client |
| `tailwindcss` + `@tailwindcss/vite` | styling (v4) |
| `@headlessui/vue` | accessible unstyled components (modals, menus) |
| `@heroicons/vue` | icon set |
| `vue3-toastify` | toast notifications |
| `chart.js` + `vue-chartjs` | dashboard charts |

Dev tooling: `vite`, `@vitejs/plugin-vue`, `vite-plugin-vue-devtools`, `vitest` + `@vue/test-utils` + `jsdom`, `oxlint`, `eslint` (+ `eslint-plugin-vue`, `@vitest/eslint-plugin`, `globals`, `@eslint/js`), `prettier` (+ `prettier-plugin-tailwindcss`, `eslint-config-prettier`), `npm-run-all2` (powers `run-s` in lint script).
