# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` holds the full conventions, product rules and AI working rules; `CONTEXT.md` and `docs/ROADMAP.md` hold domain context and phases. Read them before non-trivial work. Key points are summarized here.

## Commands

```sh
npm run dev                          # vite dev server
npm run build                        # production build
npx vitest run                       # all tests once (npm run test:unit is watch mode)
npx vitest run src/api/__tests__/tables.spec.js   # single test file
npm run lint                         # oxlint then eslint, both with --fix (mutates files)
npm run format                       # prettier on src/
```

Requires Node `^22.18.0 || >=24.12.0`. Plain JS: there is no typecheck. Before finishing a feature, `npm run lint`, the relevant tests and `npm run build` must pass.

## Architecture

Frontend-only Vue 3 (`<script setup>`) + Vite SPA. A separate Laravel API is the security authority; frontend role checks are UX only, and 401/403 must be handled gracefully.

- **API layer (`src/api/`)**: the only place that talks to the backend. Each file exports plain async functions returning `response.data`, built on the shared axios instance in `src/api/client.js`. It reads `VITE_API_BASE_URL` (`.env`; the Laragon host is spelled `restaurnat-management-system.test`, intentionally) and attaches the bearer token from localStorage `auth_token`. There is no global 401 interceptor. Updates with file uploads use FormData sent as POST with `_method=PATCH`.
- **Auth (`src/stores/auth.js`)**: Pinia options store persisting `user` and `token` in localStorage (`auth_token`, `auth_user`). `user.roles` is an array of strings (`admin`, `manager`, `cashier`, `kitchen`); non-admins are scoped to their own branch.
- **Routing (`src/router/index.js`)**: all authenticated pages are lazy-loaded children of `/dashboard` (parent has `meta.requiresAuth`), each with `meta.roles`. A global `beforeEach` enforces auth, guest-only and role checks. `AppSidebar.vue` keeps a separate role-filtered `menuItems` array linked by route name, so a new page needs both a route and a sidebar entry.
- **Views (`src/views/<domain>/`)**: use local refs and an `async load*()` with a `requestId` counter to drop stale responses, plus a `disposed` flag. Admin views expose a branch selector (paginated `getBranches`); other roles never send `branch_id`. Follow `src/views/tables/TablesView.vue` as the model. Errors go through per-domain helpers (e.g. `components/tables/tableErrors.js`) and `vue3-toastify`.
- **Styling**: Tailwind v4, CSS-first (`src/assets/main.css`, `@theme` tokens such as `primary-*`); there is no `tailwind.config.js`. Prettier: no semicolons, single quotes, 100 columns.
- **Tests**: colocated `__tests__/*.spec.js` (vitest + jsdom + `@vue/test-utils`). API tests mock `@/api/client`; view tests mock the `@/api/*` modules and `vue3-toastify`.

## Domain rules

Order flow is Pending → Preparing → Ready → Completed; payment is only allowed on Ready orders and frees the table. Total = Σ(variant price × qty) + branch tax + branch service charge, computed by the backend, so don't reimplement backend business logic in the frontend.
