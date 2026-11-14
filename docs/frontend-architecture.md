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
├── [locale]/
│   ├── (public)/
│   ├── (dashboard)/
│   └── layout.tsx
├── api/
├── globals.css
i18n/
messages/
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

- `app/[locale]/(public)` for marketing/public pages such as login, reset-password and invite acceptance
- `app/[locale]/(dashboard)` for authenticated pages
- `app/api` for the backend endpoints consumed by the frontend
- `app/[locale]/layout.tsx` for the localized root shell and global styling

Example routes in the project today:

```text
app/
  [locale]/
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

# Internationalization

All page URLs are prefixed with a locale (`/en/...`, `/es/...` or `/fr/...`); API URLs
remain unprefixed. The proxy negotiates the locale from the `NEXT_LOCALE` cookie,
then `Accept-Language`, and finally English. Browser language tags such as
`fr-CA`, `fr-BE` and `fr-CH` resolve to the supported `fr` locale; the app does
not infer language from a user's physical location. Use navigation helpers from
`i18n/navigation.ts` so internal links retain the active locale.

Authenticated users change their saved language in dashboard settings. Public
pages offer the same selector in the footer; it changes the locale without
saving an account preference. The selector's options follow `routing.locales`.
After a language selection, browser back and forward navigation retain that
language when visiting older locale-prefixed history entries in the same tab.
Those entries reload with the selected locale; explicit links still use their
own locale.

Do not hardcode user-facing text. Add matching uppercase, domain-namespaced keys
to every supported locale under `messages/`, use `useTranslations` in client
components and `getTranslations` on the server, and translate API errors using
their stable codes. Use the active locale with `Intl` for dates and numbers.
Keep currency selection separate from the locale.

To add a locale:

1. Add it to the routing and supported server locale definitions.
2. Provide every namespace and key under `messages/<locale>/`, and register the
   messages in `i18n/messages.ts`.
3. Translate server-originated emails and push notifications and review legal
   translations professionally.
4. Run the message parity tests and `npm run verify`; exercise locale switching,
   authentication redirects, invitations, password reset and notifications.

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

## Group totals

The totals modal separates payment history and category statistics into their
own components. Category statistics can be viewed for the current month, any
previous month, or all time. Month boundaries use the viewer's local time; the
current month runs through the current instant. The other totals, balances,
settlements, and payment history remain all-time. Category results use a fixed
height, keyboard-scrollable panel so changing periods does not shift the modal.

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
