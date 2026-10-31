# AGENTS.md

Billio: a group expense-splitting app (groups, participants, expenses, payments, balances, invites, push notifications).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · libsql/SQLite (Turso in prod) · Vitest · ESLint + Prettier.

Next 16 uses `proxy.ts` (not `middleware.ts`) for route protection. Path alias: `@/` = repo root.

## Commands

| Task                                      | Command                              |
| ----------------------------------------- | ------------------------------------ |
| Dev server                                | `npm run dev`                        |
| **Full check (do this before finishing)** | `npm run verify`                     |
| Lint / typecheck                          | `npm run lint` / `npm run typecheck` |
| Unit tests                                | `npm test`                           |
| Integration tests                         | `npm run test:integration`           |
| Format                                    | `npm run format`                     |
| Create/migrate DB schema                  | `npm run db:init`                    |

`verify` = lint + typecheck + unit + integration. It must pass with zero errors and warnings. Run a single unit test file with `npx vitest run -c vitest.unit.config.ts <path>`.

## Architecture

Backend request flow: `app/api/**/route.ts` → `lib/services/` → `lib/repositories/` → DB.

- **Route handlers stay thin.** They authenticate (`getCurrentUser()`), validate JSON bodies and query strings with schemas and helpers in `lib/api/request-validation.ts`, call services, and map results to responses. No business logic or SQL. Read the Zod overview in [docs/project-guide.md](docs/project-guide.md#request-validation-with-zod) when changing request validation.
- **Services** (`lib/services/`) hold all business rules and return a result object: `{ ok: true, data }` or `{ ok: false, error: { code, message, status } }`. They never throw for expected failures.
- **Repositories** (`lib/repositories/`) are the only code that imports `lib/db/db`. One file per entity; raw SQL; map rows via `lib/mappers/` into `lib/models/` types.
- **API responses** always go through `successResponse` / `errorResponse` in `lib/api/response.ts`. Envelope: `{ success, data }` or `{ success: false, error: { code, message } }`. Routes wrap the body in try/catch and return `INTERNAL_ERROR` / 500.
- **Frontend**: components never call `fetch` directly. They use `frontend-services/*.service.ts`, usually through hooks in `components/<domain>/hooks/`. Frontend services return the parsed API envelope; check `result.success`.
- **Components** are organised by domain (`components/groups`, `dashboard`, `auth`, ...). Shared primitives live in `components/ui/`; reuse them before creating new ones. Keep pages in `app/` small.

## Conventions

- Unit tests: `__tests__/` folder next to the code (`lib/services/__tests__`, `lib/repositories/__tests__`, `components/ui/__tests__`). The unit config discovers `*.test.*` and `*.spec.*` files across the repo (except integration tests). Service tests mock repositories with `vi.mock`.
- Integration tests: `tests/integration/*.test.ts`. They run against a local `file:` SQLite DB and delete all rows between tests. Use them for flows that cross services and repositories.
- New behaviour in services needs a unit test; new cross-feature flows or SQL need an integration test.
- Error codes are `UPPER_SNAKE_CASE`. Statuses: 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict.
- Prettier is enforced: single quotes, semicolons, 2 spaces, 80 columns.
- Lint is strict. React Compiler rules apply: don't call `setState` synchronously in an effect, and derive values during render instead of mirroring them into state.
- Schema changes are made in `lib/db/init-db.ts` and must be idempotent (`CREATE TABLE IF NOT EXISTS`, `PRAGMA table_info` checks before `ALTER`). Existing databases must keep working.

## Boundaries

- Never read, print, edit, or commit `.env*` or `*.db` files (`local.db`, `integration.db`).
- Never point integration tests at a non-`file:` database.
- Ask before adding dependencies, changing the DB schema, or changing auth/JWT/cookie behaviour.
- Any change to an API route's path, request, response, or error codes must update [docs/api-contract-v1.md](docs/api-contract-v1.md) in the same change.
- Don't make unrelated refactors or reformat files you aren't changing.

## Skills

Task recipes live in `.github/skills/<name>/SKILL.md`. Read the matching one before starting:

- `add-api-endpoint`: new or changed endpoint, end to end.
- `add-db-migration`: any schema change in `lib/db/init-db.ts`.
- `add-ui-feature`: components, hooks, modals, pages.
- `write-tests`: unit vs. integration tests and their setup.
- `balance-and-expense-logic`: expenses, splits, payments, balances, rounding. **Read before touching any of it.**
- `review-checklist`: reviewing a diff or finishing a feature.

## Docs index

| File                                                           | Read it when                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [docs/api-contract-v1.md](docs/api-contract-v1.md)             | Adding or changing any API endpoint, or consuming one from the frontend.           |
| [docs/frontend-architecture.md](docs/frontend-architecture.md) | Adding pages, components, hooks or frontend services; deciding where code belongs. |
| [docs/integration-testing.md](docs/integration-testing.md)     | Writing or debugging integration tests, or touching DB environments.               |
| [docs/domain.md](docs/domain.md)                               | Changing expenses, splits, payments, balances, currencies, or rounding.            |
| [docs/project-guide.md](docs/project-guide.md)                 | Understanding the architecture and core product concepts.                          |
| [README.md](README.md)                                         | Project overview and local setup.                                                  |

Before finishing any task: run `npm run verify`.
