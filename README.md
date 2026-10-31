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
