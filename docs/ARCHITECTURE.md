# Frontend Architecture

## Application flow

View
↓
Composable / Pinia store
↓
API service
↓
Axios
↓
Laravel API

## Responsibilities

### Views

Views compose pages and coordinate UI.

They should not contain large amounts of business logic.

### Components

Reusable UI components.

Examples:

- Button
- Modal
- DataTable
- OrderCard
- MenuItemCard
- StatusBadge

### Stores

Pinia stores hold shared application state.

Examples:

- auth
- user
- branch
- menu
- orders

### API

All HTTP communication lives in `src/api/`.

Components and stores must not call axios directly.

### Router

Vue Router handles navigation and frontend role/permission guards.

### Backend authority

The Laravel API remains authoritative for:

- authentication
- authorization
- branch isolation
- prices
- tax
- service charge
- order state transitions
- payment
