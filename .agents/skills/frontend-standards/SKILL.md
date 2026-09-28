---
name: frontend-standards
description: Apply this project's frontend design, architecture, accessibility, and code standards whenever writing, reviewing, or refactoring Vue UI or other frontend code in this repository. Use automatically without an explicit skill invocation.
---

# Frontend standards

Use this skill for frontend implementation, review, and refactoring in this repository. Read `AGENTS.md` and inspect the relevant existing files first. The user's current request and established project conventions take precedence over preferences in this skill. Treat the source document as design guidance, not as a requirement to add frameworks, tooling, or features.

## Product and design

- Design for restaurant staff using the POS, kitchen display, payments, and reports on tablets and smaller screens. Identify the role, task, and likely device before changing a screen.
- Reuse the existing visual language and reusable components. Add shared colors, fonts, or other theme tokens in `src/assets/main.css` with Tailwind v4 `@theme`; use the existing tokens before introducing new ones. Avoid arbitrary values where the scale works.
- Use clear hierarchy, restrained decoration, and action-specific copy. Give relevant data screens useful loading, empty, and error states; account for slow or failed requests.
- Make controls touch-friendly and responsive. Keep focus visible, use semantic elements and labels, preserve keyboard operation, and convey status with text as well as color. Use `@headlessui/vue` for complex interactions when it fits the existing code.
- Support Myanmar text when the feature or product copy requires it: use Unicode, allow wrapping and adequate line height, and check font coverage. Follow the product's established locale and currency conventions; do not assume that every screen needs translation infrastructure or MMK formatting.

## Architecture and data

- Follow the existing Vue 3, Vite, and plain JavaScript structure: route pages in `src/views/<domain>/`, reusable pieces in `src/components/common/` or `layout/`, shared state in Pinia stores, routes and guards in `src/router/`, and all HTTP calls in `src/api/`. Keep domain-specific components with their domain when that pattern exists.
- Use Vue `<script setup>`, props and emits for component boundaries, `computed` for derived values, and local state for ephemeral UI. Use Pinia when state must be shared across views. Keep components focused without imposing arbitrary line limits.
- Make the Laravel API authoritative for data, money calculations, order transitions, branch scope, validation, and permissions. Frontend role checks improve navigation only. Handle 401/403 and validation or network errors in the relevant flow.
- Use query parameters for filters or pagination when users should be able to share or revisit that state. Reuse an existing API service or store before adding another abstraction.
- Do not introduce React, Inertia, TypeScript, Zustand, Zod, Tailwind v3 configuration, or new dependencies just to follow the source document.

## Coding and verification

- Match the repo's naming, `@` alias, Prettier formatting, and Tailwind class sorting. Prefer clear names and stable keys for dynamic lists.
- Preserve form input on validation failure, show field errors in text, and prevent accidental duplicate submissions. Use `vue3-toastify` consistently with existing flows.
- Add or update behavioral tests for changed behavior in colocated `__tests__/*.spec.js` files. Test the visible result and meaningful failure paths with Vitest and Vue Test Utils.
- For code changes, run `npm run lint`, relevant `npx vitest run` tests, and `npm run build` as required by `AGENTS.md`. Lint uses `--fix`; check its diff and avoid absorbing unrelated worktree changes.
- In reviews, report concrete findings by severity with file locations. Check request fit, API boundaries, authorization behavior, accessibility, responsive states, and tests. Distinguish observed defects from suggestions.
- At completion, summarize changed files, checks run, and remaining concerns. If device, language, or network behavior was not verified, state that as a limit instead of claiming it passed.
