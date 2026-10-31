---
name: write-tests
description: Write or fix unit and integration tests in Billio with Vitest, choosing the right level and using the existing mocking and seeding patterns. Use when adding tests for services, repositories, or cross-feature flows, or when a test fails or isn't being picked up.
---

# Write tests

## Which level?

| Change                                                                            | Test                                                                   |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Service rules, validation, permissions, error codes                               | Unit: `lib/services/__tests__/<name>.test.ts`                          |
| Repository SQL shape                                                              | Unit: `lib/repositories/__tests__/<name>.test.ts` (mock `@/lib/db/db`) |
| Balances, splits, payments, deletes/leaves, anything crossing services + real SQL | Integration: `tests/integration/*.test.ts`                             |

## Unit tests

- Config: `vitest.unit.config.ts`. It **only includes `lib/**/\*.test.ts`**. A test placed in `components/`or`app/` will silently not run.
- Pattern (see `groupService.test.ts`): `vi.mock('@/lib/repositories/xRepository', () => ({ fn: vi.fn(), ... }))` listing every function the service imports, `vi.mocked(fn).mockResolvedValue(...)`, `beforeEach(() => vi.clearAllMocks())`.
- Assert on the result object: `expect(result.ok).toBe(false)`, then code and status. Test the success path, each `INVALID_INPUT`, `NOT_FOUND`, `FORBIDDEN` branch, and that repositories are (not) called.
- Run one file: `npx vitest run -c vitest.unit.config.ts lib/services/__tests__/groupService.test.ts`.

## Integration tests

- Config: `vitest.integration.config.ts`; runs serially against a local `file:` SQLite DB (`integration.db`, defaulting if `.env.integration` is absent). `tests/integration/setup.ts` runs `initDB()` once and **deletes all rows from the listed tables before every test**. The setup throws if `DATABASE_URL` isn't a `file:` URL; never weaken this.
- Call services directly (not HTTP). Seed through services: `createGroup` → `addParticipantToGroup` → `getParticipantsForGroup`, then `createExpense`, `getGroupBalances`, etc. Copy the `seedGroup...` helpers from `balance-flow.test.ts` / `basic-guards.test.ts`.
- Narrow `result.ok` with `if (!result.ok) throw new Error(...)` before reading `result.data`.
- If you add a table, add it to `TABLES` in `setup.ts` (children before parents), otherwise data leaks between tests.
- Imports use relative paths (`../../lib/...`) in existing integration tests.
- Run: `npm run test:integration`.

## Good tests here

- Assert money invariants, not just happy values: split amounts sum to the expense amount; balances in a currency sum to 0 (see `balance-and-expense-logic`).
- Use odd amounts (e.g. 1235 cents across 3 people) to exercise remainder distribution.
- Cover permissions: non-member (403), unknown group (404), `viewer` role writes (403).

Finish with `npm run verify`.
