import { getGroupById } from '@/lib/repositories/groupRepository';

export async function checkGroupWritable(groupId: string) {
  const group = await getGroupById(groupId);
  if (group?.archivedAt) {
    return {
      ok: false as const,
      error: {
        code: 'GROUP_ARCHIVED',
        message: 'Group is archived and read-only',
        status: 409,
      },
    };
  }
  return null;
}
