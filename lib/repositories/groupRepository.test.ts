import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db/db';
import { cleanupEmptyGroups } from './groupRepository';

vi.mock('@/lib/db/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe('groupRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cleans up groups that have no linked users', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      rowsAffected: 0,
    } as never);

    await cleanupEmptyGroups();

    expect(db.execute).toHaveBeenCalledTimes(1);

    const sqlCalls = vi
      .mocked(db.execute)
      .mock.calls.map((call) => (call[0] as { sql?: string }).sql ?? '');

    expect(sqlCalls.some((sql) => sql.includes('DELETE FROM groups'))).toBe(true);
    expect(sqlCalls.every((sql) => sql.includes('group_participants'))).toBe(true);
    expect(sqlCalls.some((sql) => sql.includes('COUNT(CASE WHEN gp.user_id IS NOT NULL THEN 1 END) = 0'))).toBe(true);
  });
});