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

  it('uses the participant table when cleaning up empty groups', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      rowsAffected: 0,
    } as never);

    await cleanupEmptyGroups();

    expect(db.execute).toHaveBeenCalledTimes(1);

    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('group_participants'),
      }),
    );

    expect(db.execute).not.toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('group_members'),
      }),
    );
  });
});