# Architecture Decisions

## ADR-001: API-only Laravel backend

Decision:
Laravel is used exclusively as a JSON API.

Reason:
The frontend is a separate Vue application.

Consequence:
Do not create Blade views or session-based authentication.

---

## ADR-002: Sanctum personal access tokens

Decision:
Authentication uses Sanctum bearer tokens.

Reason:
The Vue frontend communicates with the API independently.

Consequence:
API requests use Authorization: Bearer <token>.

---

## ADR-003: Branch-scoped data

Decision:
Non-admin users operate within their assigned branch.

Reason:
The restaurant operates multiple branches.

Consequence:
Queries and mutations must enforce branch ownership.
