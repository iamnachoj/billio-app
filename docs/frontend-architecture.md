# Frontend Architecture

## Introduction

The project uses Next.js App Router and a lightweight layered frontend structure built around the actual app routes and domain features.

The overall goal is to keep the app easy to work on without over-engineering it:

- each route has a clear purpose
- business logic stays in the backend services and repository layer
- the frontend mainly composes UI and calls the API through dedicated service wrappers
- shared components remain reusable and mostly presentational

---

# High-level structure

```text
app/
├── (public)/
├── api/
├── globals.css
├── layout.tsx
├── page.tsx
components/
├── auth/
├── dashboard/
├── groups/
├── invites/
├── layout/
├── ui/
frontend-services/
├── auth.service.ts
├── expenses.service.ts
├── groups.service.ts
├── invites.service.ts
├── me.service.ts
lib/
├── api/
├── db/
├── mappers/
├── models/
├── repositories/
├── services/
├── utils/
└── ...
```

This is the actual structure of the repository today, not a generic `src` setup.

---

# app/

The `app` folder contains the routing tree and server-side route handlers for the API.

The main groups are:

- `app/(public)` for marketing/public pages such as login, reset-password and invite acceptance
- `app/api` for the backend endpoints consumed by the frontend
- `app/layout.tsx` for the root shell and global styling

Example routes in the project today:

```text
app/
  (public)/
    login/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    invites/[token]/page.tsx
  api/
    auth/login/route.ts
    auth/register/route.ts
    auth/logout/route.ts
    groups/[groupId]/invites/route.ts
    invites/[token]/route.ts
```

The App Router keeps page and route logic close to the URL structure, while the business logic remains in the `lib` layer.

---

# components/

The UI is organized by feature domain rather than by one giant flat folder.

Current domains include:

```text
components/
  auth/
  dashboard/
  groups/
  invites/
  layout/
  ui/
```

Responsibilities:

- `auth/`: login, register, password recovery forms
- `groups/`: group cards, forms and group-related screens
- `invites/`: invite preview and acceptance UI
- `layout/`: shared shell, navigation and page wrappers
- `ui/`: reusable presentational primitives such as buttons, cards and inputs

Components should stay mostly presentational; API calls and business rules live outside the component tree.

---

# frontend-services/

This folder is the frontend-facing boundary with the backend.

Its job is to wrap HTTP calls and translate them into typed results for UI code.

Examples:

```text
frontend-services/
  auth.service.ts
  groups.service.ts
  invites.service.ts
  expenses.service.ts
  me.service.ts
```

This keeps the route/page components from mixing fetch logic, headers and request formatting with rendering code.

---

# lib/

The `lib` directory is the backend/core layer of the application.

It contains:

- `api/`: shared response helpers
- `db/`: connection and initialization logic
- `models/`: domain entities such as user, group, expense, participant and invite models
- `repositories/`: SQL/data access logic
- `services/`: use cases and validation rules
- `utils/`: shared helpers such as JWT utilities

This is the place where most of the actual app logic lives.

---

# testing strategy

The project includes both unit and integration checks.

```text
tests/
  integration/
    balance-flow.test.ts
    basic-guards.test.ts
    setup.ts
```

The integration suite is intentionally separated from the main app database and uses its own test database configuration.

---

# design principles

The current architecture follows these principles:

1. route handlers stay thin
2. business rules live in services
3. repositories encapsulate persistence details
4. models represent the domain, not UI concerns
5. frontend service wrappers isolate API contracts from UI components

That separation makes the app easier to extend as more features are added.

This keeps related logic together.

---

# frontend-services/

The frontend should never call `fetch()` directly inside components.

Instead, every API interaction goes through a service.

Example:

```
frontend-services/
    auth.ts
    groups.ts
    expenses.ts
```

Instead of

```tsx
await fetch('/api/groups');
```

components should simply call

```tsx
const groups = await getGroups();
```

Benefits:

- API logic centralized
- Easier testing
- Easier refactoring
- Cleaner pages and components

---

# lib/

The `lib` folder contains shared infrastructure and backend-related logic.

Examples include:

- database
- repositories
- mappers
- shared models
- authentication utilities

This folder is primarily intended for the backend and should not contain React components.

---

# Design Philosophy

The project follows a few simple principles.

## Keep pages small

Pages should orchestrate.

Components should implement.

---

## Prefer composition

Large pages should be composed of many smaller reusable components.

Avoid large components whenever possible.

---

## Organize by business domain

Instead of

```
components/
    buttons/
    dialogs/
    forms/
```

prefer

```
components/
    auth/
    groups/
    expenses/
```

This scales much better as the application grows.

---

## Keep business logic out of UI

Business logic belongs in:

- fronend-services
- backend
- reusable hooks

Components should mainly focus on rendering.

---

## Build a small Design System

Reusable UI components should be created from day one.

Eventually every screen should be built using the same primitives:

- Button
- Card
- Input
- Modal
- Badge
- Spinner
- Avatar

This keeps the UI consistent across the entire application.

---

# Planned Application Structure

```
/
│
├── Landing page
│
├── Login
│
├── Register
│
├── Forgot password
│
├── Reset password
│
├── Groups Dashboard
│
├── Group Details
│
├── Expense Details
│
└── Profile
```

---

# Development Workflow

The recommended implementation order is:

1. Landing page
2. Authentication pages
3. UI component library
4. Dashboard
5. Group details
6. Expense details
7. Expense creation
8. Invitations
9. Profile
10. Offline support & PWA

Following this order ensures that every stage of development leaves the application in a functional state.

---

# Guiding Principle

A page should answer:

> **What should be displayed?**

A component should answer:

> **How should it be displayed?**

A service should answer:

> **Where does the data come from?**

Keeping these responsibilities separated makes the codebase easier to maintain, easier to test, and easier for new contributors to understand.
