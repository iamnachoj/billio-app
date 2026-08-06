import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db/db';
import { cleanupEmptyGroups } from '../groupRepository';

vi.mock('@/lib/db/db', () => ({
  db: {
    execute: vi.fn(),
    batch: vi.fn(),
  },
}));

describe('groupRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cleans up groups that have no linked users', async () => {
    vi.mocked(db.batch).mockResolvedValue([] as never);

    await cleanupEmptyGroups();

    expect(db.batch).toHaveBeenCalledTimes(1);

    const [batchStatements, mode] = vi.mocked(db.batch).mock.calls[0] ?? [];
    expect(mode).toBe('write');

    const sqlCalls = (batchStatements as Array<{ sql?: string }>).map(
      (statement) => statement.sql ?? ''
    );

    expect(sqlCalls).toHaveLength(5);

    expect(
      sqlCalls.some((sql) => sql.includes('DELETE FROM expense_splits'))
    ).toBe(true);
    expect(sqlCalls.some((sql) => sql.includes('DELETE FROM expenses'))).toBe(
      true
    );
    expect(
      sqlCalls.some((sql) => sql.includes('DELETE FROM group_invites'))
    ).toBe(true);
    expect(
      sqlCalls.some((sql) => sql.includes('DELETE FROM group_participants'))
    ).toBe(true);
    expect(sqlCalls.some((sql) => sql.includes('DELETE FROM groups'))).toBe(
      true
    );

    expect(
      sqlCalls.every((sql) =>
        sql.includes('COUNT(CASE WHEN gp.user_id IS NOT NULL THEN 1 END) = 0')
      )
    ).toBe(true);
  });
});
