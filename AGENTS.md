# AGENTS.md

Vue 3 + Vite frontend for the Restaurant Management System (POS, KDS, payments, reports). The Laravel API owns data, business rules, and security.

## Working rules

- Inspect relevant code and reuse existing components, stores, composables, and API services before adding new ones. Keep changes scoped; explain the plan before implementing non-trivial features.
- Put all HTTP calls in `src/api/`. Handle 401/403, validation, and network errors in the relevant flow. Frontend role checks guide navigation and UX; the API must enforce permissions.
- Add or update behavioral tests for changed behavior. For code changes, run `npm run lint`, relevant `npx vitest run` tests, and `npm run build`. Lint uses `--fix`, so inspect its diff afterward.
- Avoid new dependencies and changes to generated files or lockfiles unless required. Summarize changed files, checks, and remaining concerns when done.

## Project guidance

- For frontend code or reviews, read `.agents/skills/frontend-standards/SKILL.md`.
- For page design or UI/UX changes, read `.agents/skills/ui-ux-guardrails/SKILL.md`.
- For a requested code review, read `.agents/skills/code-quality-review/SKILL.md`.
- For domain terms or decisions, read `CONTEXT.md`, relevant ADRs in `docs/adr/`, and `docs/agents/domain.md`.
