## Integration Testing Guide

This project now has a dedicated integration test suite that runs against a separate database.

### Why this exists

Unit tests mock repositories and services. Integration tests validate real behavior across:

- services
- repositories
- SQL schema/migrations
- cross-feature flows (groups, participants, expenses, balances)

### Database strategy

By default, integration tests use a local file database:

- `DATABASE_URL=file:./integration.db`
- loaded from `.env.integration`

This keeps tests isolated from development and production data.

### Files added

- `vitest.integration.config.ts` - Vitest config for integration suite
- `tests/integration/setup.ts` - initializes schema and cleans tables before each test
- `tests/integration/balance-flow.test.ts` - first real integration scenarios
- `.env.integration` - local env used by integration tests
- `env.integration.example` - sample env template

### Commands

Run only unit tests:

```bash
npm run test
```

Run only integration tests:

```bash
npm run test:integration
```

Run both:

```bash
npm run test:all
```

### Local vs Turso for integration

Recommended default: local file DB.

Pros:

- very fast
- no network flakiness
- deterministic in CI
- no risk of touching shared cloud data

Using Turso for integration can be useful for optional smoke tests, but it is not ideal as the default test backend.

If you still want cloud integration tests, create a dedicated database (for example `billio-db-integration`) and never point tests to production.

### Mental model

Think in 3 environments:

1. Development DB: used by local app + Postman during feature work
2. Integration DB: used only by `npm run test:integration`
3. Production DB: used by deployed app

Never share the integration database with production.
