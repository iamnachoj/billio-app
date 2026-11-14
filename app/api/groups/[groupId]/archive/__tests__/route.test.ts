import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrentUser } from '@/lib/services/authService';
import { archiveGroup } from '@/lib/services/groupService';
import { PATCH } from '../route';

vi.mock('@/lib/services/authService', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/services/groupService', () => ({ archiveGroup: vi.fn() }));

const params = { params: Promise.resolve({ groupId: 'group-1' }) };
const user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> = {
  id: 'user-1',
  name: 'User',
  email: 'user@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
  locale: 'en',
};
const request = (body: string) =>
  new Request('http://localhost/api/groups/group-1/archive', {
    method: 'PATCH',
    body,
  });

describe('PATCH group archive', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('requires authentication', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const response = await PATCH(request('{"archived":true}'), params);
    expect(response.status).toBe(401);
    expect(archiveGroup).not.toHaveBeenCalled();
  });

  it('rejects invalid archive status and malformed JSON', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    for (const body of ['{}', '{"archived":"true"}', '{']) {
      const response = await PATCH(request(body), params);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        success: false,
        error: { code: 'INVALID_INPUT' },
      });
    }
    expect(archiveGroup).not.toHaveBeenCalled();
  });

  it('returns the updated group in the standard envelope', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    const group = {
      id: 'group-1',
      name: 'Trip',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      archivedAt: new Date('2024-01-02'),
    };
    vi.mocked(archiveGroup).mockResolvedValue({ ok: true, data: { group } });
    const response = await PATCH(request('{"archived":true}'), params);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { id: 'group-1', archivedAt: '2024-01-02T00:00:00.000Z' },
    });
    expect(archiveGroup).toHaveBeenCalledWith({
      groupId: 'group-1',
      userId: 'user-1',
      archived: true,
    });
  });

  it('preserves settlement conflicts', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    vi.mocked(archiveGroup).mockResolvedValue({
      ok: false,
      error: { code: 'GROUP_NOT_SETTLED', message: 'Not settled', status: 409 },
    });
    const response = await PATCH(request('{"archived":true}'), params);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      success: false,
      error: { code: 'GROUP_NOT_SETTLED' },
    });
  });
});
