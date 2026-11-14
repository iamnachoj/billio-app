import { afterEach, describe, expect, it, vi } from 'vitest';

import { setGroupArchived } from '../groups.service';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setGroupArchived', () => {
  it.each([true, false])('sends archived=%s', async (archived) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'group-1',
            name: 'Group',
            createdBy: 'user-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            archivedAt: archived ? '2024-01-02T00:00:00.000Z' : null,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await setGroupArchived('group-1', archived);

    expect(fetchMock).toHaveBeenCalledWith('/api/groups/group-1/archive', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    expect(result.success).toBe(true);
  });

  it('preserves a settlement error from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'GROUP_NOT_SETTLED', message: 'Not settled' },
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );

    await expect(setGroupArchived('group-1', true)).resolves.toEqual({
      success: false,
      error: { code: 'GROUP_NOT_SETTLED', message: 'Not settled' },
    });
  });
});
