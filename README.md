# Billio

Billio helps groups track shared expenses and understand who owes whom. It is
built with Next.js, React, TypeScript, and libSQL/SQLite.

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app requires a `DATABASE_URL` and the other environment values used by the
application. Keep local secrets in an ignored `.env.local` file; never commit
environment files or database files. Integration tests use a separate local
database. See [Integration Testing](./docs/integration-testing.md) before
running them.

For existing databases, the approved `users.locale` migration is applied when
a user is registered or a language preference is saved. The database account
must have permission to alter the users table. You can also apply migrations
explicitly with `npm run db:init` before deploying.

Group owners and admins can archive a group from its settings once every
participant's balance is settled in every currency. Archiving applies to
everyone and keeps the group read-only; an owner or admin can restore it from
the same settings. Use **Show archived** on the dashboard to find it again.
Existing databases must be migrated with `npm run db:init` before using group
archiving.

## Common commands

```bash
npm run dev              # Start the development server
npm run verify           # Lint, typecheck, unit tests, integration tests
npm run db:init          # Initialize or update the database schema
```

## Project documentation

- [Project guide](./docs/project-guide.md) — architecture and core concepts.
- [Domain model and money rules](./docs/domain.md) — splits, currencies,
  rounding, balances, and settlement suggestions.
- [Frontend architecture](./docs/frontend-architecture.md) — UI structure and
  frontend layering.
- [API contract v1](./docs/api-contract-v1.md) — endpoint requests and
  responses.
- [Integration testing](./docs/integration-testing.md) — test database setup
  and commands.
- [Agent instructions](./AGENTS.md) — conventions, boundaries, and task skills.
