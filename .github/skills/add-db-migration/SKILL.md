---
name: add-db-migration
description: Change the Billio database schema (new table, column, index, or table rebuild) in lib/db/init-db.ts safely for existing local, integration and production databases. Use when a feature needs persisted data that doesn't exist yet.
---

# Add a database migration

**Ask the user before changing the schema** (AGENTS.md). There is no migration framework: `initDB()` in `lib/db/init-db.ts` runs on every `npm run db:init`, in integration test setup, and on import of that file. Everything in it must be idempotent and safe on a database that already has data.

## Rules

- New table: `CREATE TABLE IF NOT EXISTS ...`. Add indexes with `CREATE INDEX IF NOT EXISTS ...`.
- New column on an existing table: inspect first, then alter.
  ```ts
  const info = await db.execute('PRAGMA table_info(expenses);');
  const columns = (info.rows as Record<string, unknown>[]).map((r) =>
    String(r.name)
  );
  if (!columns.includes('new_column')) {
    await db.execute('ALTER TABLE expenses ADD COLUMN new_column TEXT;');
  }
  ```
  SQLite `ADD COLUMN` cannot add `NOT NULL` without a default; use a nullable column or provide `DEFAULT`.
- Changing or dropping a column, or changing constraints: rebuild the table (`<name>_new`, copy rows with `INSERT ... SELECT`, `DROP`, `ALTER TABLE ... RENAME TO`), guarded by a `PRAGMA table_info` check so it runs once. Follow the existing rebuilds for `group_invites`, `expenses` and `expense_splits` in the same file. Start with `DROP TABLE IF EXISTS <name>_new`.
- Column naming: `snake_case`; ids are `TEXT`; money is `INTEGER` cents; timestamps are ISO `TEXT`.
- Never write destructive migrations (dropping data) without explicit user approval.

## Checklist

1. Edit `lib/db/init-db.ts` following the rules above.
2. Update the model in `lib/models/` and the row mapping in the repository (or `lib/mappers/`). Update every `SELECT`/`INSERT` that must include the new column.
3. If the table is new, add it to the `TABLES` array in `tests/integration/setup.ts` (children before parents) so rows are cleaned between tests. Note that `payments` and `push_subscriptions` are currently not in that list.
4. Verify on a database that already has the old schema, not just a fresh one: run `npm run test:integration` twice (the second run reuses the existing `integration.db`). Never open or modify `local.db` or `.env*` yourself; tell the user to run `npm run db:init` for their dev database, and note that production (Turso) needs the same script run by them.
5. Update `docs/api-contract-v1.md` if the API shape changed.
6. Run `npm run verify`.
