# Frontend Architecture

## Introduction

The Billio frontend is built using **Next.js App Router** and follows a **domain-driven component architecture**.

The main goal is to keep the application:

- Easy to understand
- Easy to scale
- Easy to maintain
- Easy for multiple developers to work on simultaneously

Rather than organizing the code by technical concerns only, the project is primarily organized around **business domains** (authentication, groups, expenses, balances, etc.).

---

# High-Level Architecture

```
src
│
├── app
├── components
├── hooks
├── frontend-services
├── lib
└── styles
```

Every folder has a single responsibility.

---

# app/

The `app` directory is **not** where most of the UI lives.

Instead, it defines the application's routing structure using the Next.js App Router.

Each folder represents a route.

Example:

```
app/
    page.tsx
    login/
        page.tsx
    groups/
        page.tsx
```

becomes

```
/
/login
/groups
```

Pages should remain as small as possible.

Their job is mainly to:

- fetch data
- compose components
- connect the route to the UI

Example:

```tsx
export default async function GroupsPage() {
  const groups = await getGroups();

  return <GroupList groups={groups} />;
}
```

Notice that almost all of the UI lives inside reusable components.

---

# layouts

Next.js layouts allow sharing UI across multiple pages.

For example:

```
groups/
    layout.tsx

    page.tsx

    [groupId]/
        page.tsx
```

Every page under `/groups` automatically receives the same layout.

Typical responsibilities include:

- navigation
- sidebar
- user information
- breadcrumbs
- providers

The root `layout.tsx` should only contain global concerns such as:

- fonts
- metadata
- theme provider
- toast provider
- global CSS

---

# components/

Almost all visual logic should live inside `components`.

Components are grouped by business domain.

```
components/
    auth/
    groups/
    expenses/
    balances/
    layout/
    ui/
```

This keeps related code together.

Instead of having hundreds of unrelated components inside a single folder, developers immediately know where to look.

---

## ui/

Contains reusable presentational components.

Examples:

```
Button
Input
Card
Modal
Spinner
Avatar
Badge
```

These components should contain **no business logic**.

They are intended to become the project's small Design System.

---

## auth/

Authentication-related components.

Examples:

```
LoginForm
RegisterForm
ForgotPasswordForm
ResetPasswordForm
```

---

## groups/

Everything related to groups.

Examples:

```
GroupCard
GroupList
CreateGroupModal
DeleteGroupModal
```

---

## expenses/

Expense-related UI.

Examples:

```
ExpenseCard
ExpenseDetails
ExpenseForm
SplitEditor
```

---

## balances/

Responsible for displaying balances and settlements.

Examples:

```
BalanceCard
SettlementList
```

---

## layout/

Reusable layout components.

Examples:

```
Navbar
Sidebar
Footer
```

---

# hooks/

Global reusable hooks.

Only hooks that are useful across the entire application belong here.

Examples:

```
useDebounce
useClickOutside
useMediaQuery
```

Hooks that are tightly coupled to a specific component should live next to that component.

Example:

```
components/
    expenses/
        ExpenseForm.tsx
        useExpenseForm.ts
```

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
