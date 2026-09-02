# CONTEXT

Single-context glossary for the Restaurant Management System frontend.

## Glossary

- **session token** — the auth credential returned by `POST /login` and held by the
  auth store (`src/stores/auth.js`). It authorizes subsequent API requests. Distinct
  from the `reset_token` used only during password reset.
- **reset_token** — a single-use credential returned by `POST /verify-otp` that
  authorizes exactly one `POST /reset-password`. It is kept in component memory only
  (never in the URL, `localStorage`, or `sessionStorage`) and discarded on unmount.
- **OTP** — a time-limited, single-use one-time passcode emailed to the user during the
  forgot-password flow. Six digits, entered via the segmented `OtpInput` component.
- **guest route** — a route carrying `meta.requiresGuest: true` (the entry `/` and
  `/login` and `/forgot-password` pages). Authenticated users are bounced to the
  dashboard by the router guard; only unauthenticated visitors may view them.
- **login entry link** — the public entry point (`/` → `EntryView`). It renders a
  prominent "Sign in" link to the `/login` route (plus a "Forgot password?" link) so
  unauthenticated users have a navigable way into the app. It is itself a guest route.
- **Menu Item** — a dish or product available for ordering. Identified by id, with a
  name, description, base_price, category (via category_id and category_name),
  optional image, availability flag, and optional variants. Managed via the Menu
  Management page (`/dashboard/menu-items`).
- **Variant** — a named size or option of a menu item (e.g., "Regular", "Large") with
  its own price. Items without variants use base_price as the sole price. The variants
  array is replaced wholesale on each update (no partial diff).
- **base_price** — the reference or starting price of a menu item. Displayed as
  "From $X.XX" when variants exist, or as the actual price when no variants.
- **Menu Management** — the admin CRUD page for menu items at
  `/dashboard/menu-items`. Accessible to admin and manager roles. Uses a card grid
  layout with search, category filter, and availability filter.
- **Category** — a grouping for menu items (e.g., Appetizers, Desserts). Each category
  has id, name, and display_order. Fetched via `GET /categories` for dropdowns and
  filters. Category CRUD is planned as a future addition to the Menu Management page.

## Password reset flow

Three backend endpoints drive a single, linear, in-memory multi-step view
(`/forgot-password`, `meta.requiresGuest`):

1. `POST /forgot-password` — `{ email }` → emits the OTP by email.
2. `POST /verify-otp` — `{ email, otp }` → `{ reset_token }`.
3. `POST /reset-password` — `{ reset_token, password, password_confirmation }` → resets
   the password; returns no session token (no auto-login).
