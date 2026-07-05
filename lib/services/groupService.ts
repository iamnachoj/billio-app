import {
  addMemberToGroup,
  createGroup as createGroupInRepository,
  createGroupParticipant as createGroupParticipantInRepository,
  deleteGroupParticipant as deleteGroupParticipantInRepository,
  getGroupParticipantById,
  getGroupParticipantsByGroupId,
  getGroupById,
  getGroupsByUserId,
  getParticipantByGroupAndUserId,
  linkParticipantToUser as linkParticipantToUserInRepository,
  removeMemberFromGroup,
  updateGroupParticipant as updateGroupParticipantInRepository,
} from '@/lib/repositories/groupRepository';

export type GroupServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

type CreateGroupInput = {
  name: string;
  description?: string;
  createdBy: string;
  creatorName: string;
};

export async function createGroup({
  name,
  description,
  createdBy,
  creatorName,
}: CreateGroupInput): Promise<GroupServiceResult<{ group: unknown }>> {
  if (!name?.trim()) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Name is required',
        status: 400,
      },
    };
  }

  if (!createdBy) {
    return {
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status: 401,
      },
    };
  }

  const group = await createGroupInRepository({
    name: name.trim(),
    description: description?.trim(),
    createdBy,
  });

  await addMemberToGroup(group.id, createdBy, creatorName);

  return {
    ok: true,
    data: { group },
  };
}

export async function getGroupsForUser(userId: string): Promise<GroupServiceResult<{ groups: unknown[] }>> {
  if (!userId) {
    return {
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status: 401,
      },
    };
  }

  const groups = await getGroupsByUserId(userId);

  return {
    ok: true,
    data: { groups },
  };
}

export async function leaveGroup({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}): Promise<GroupServiceResult<{ success: true }>> {
  if (!groupId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID and user ID are required',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
          status: 404,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  await removeMemberFromGroup(groupId, userId);

  return {
    ok: true,
    data: { success: true },
  };
}

async function ensureGroupAdmin(groupId: string, userId: string): Promise<GroupServiceResult<{ participant: unknown }>> {
  const membership = await getParticipantByGroupAndUserId(groupId, userId);

  if (!membership) {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin privileges required',
        status: 403,
      },
    };
  }

  return {
    ok: true,
    data: { participant: membership },
  };
}

export async function getParticipantsForGroup(groupId: string, userId: string): Promise<GroupServiceResult<{ participants: unknown[] }>> {
  if (!groupId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID and user ID are required',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  const participants = await getGroupParticipantsByGroupId(groupId);

  return {
    ok: true,
    data: { participants },
  };
}

export async function addParticipantToGroup({
  groupId,
  displayName,
  userId,
  role = 'member',
  status = 'active',
  createdBy,
}: {
  groupId: string;
  displayName: string;
  userId?: string;
  role?: 'owner' | 'admin' | 'member' | 'viewer';
  status?: 'active' | 'invited' | 'left';
  createdBy?: string;
}): Promise<GroupServiceResult<{ participant: unknown }>> {
  if (!groupId || !displayName?.trim()) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID and display name are required',
        status: 400,
      },
    };
  }

  const adminResult = await ensureGroupAdmin(groupId, createdBy ?? '');
  if (!adminResult.ok) {
    return adminResult;
  }

  const participant = await createGroupParticipantInRepository({
    groupId,
    displayName: displayName.trim(),
    userId,
    role,
    status,
    createdBy,
  });

  return {
    ok: true,
    data: { participant },
  };
}

export async function updateParticipant({
  participantId,
  userId,
  displayName,
  role,
  status,
}: {
  participantId: string;
  userId: string;
  displayName?: string;
  role?: 'owner' | 'admin' | 'member' | 'viewer';
  status?: 'active' | 'invited' | 'left';
}): Promise<GroupServiceResult<{ success: true }>> {
  if (!participantId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Participant ID and user ID are required',
        status: 400,
      },
    };
  }

  const participant = await getGroupParticipantById(participantId);
  if (!participant) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Participant not found',
        status: 404,
      },
    };
  }

  const adminResult = await ensureGroupAdmin(participant.groupId, userId);
  if (!adminResult.ok) {
    return adminResult;
  }

  await updateGroupParticipantInRepository(participantId, {
    displayName: displayName?.trim(),
    role,
    status,
  });

  return {
    ok: true,
    data: { success: true },
  };
}

export async function deleteParticipant({
  participantId,
  userId,
}: {
  participantId: string;
  userId: string;
}): Promise<GroupServiceResult<{ success: true }>> {
  if (!participantId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Participant ID and user ID are required',
        status: 400,
      },
    };
  }

  const participant = await getGroupParticipantById(participantId);
  if (!participant) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Participant not found',
        status: 404,
      },
    };
  }

  const adminResult = await ensureGroupAdmin(participant.groupId, userId);
  if (!adminResult.ok) {
    return adminResult;
  }

  await deleteGroupParticipantInRepository(participantId);

  return {
    ok: true,
    data: { success: true },
  };
}

export async function linkParticipantToUser({
  participantId,
  userId,
}: {
  participantId: string;
  userId: string;
}): Promise<GroupServiceResult<{ success: true }>> {
  if (!participantId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Participant ID and user ID are required',
        status: 400,
      },
    };
  }

  await linkParticipantToUserInRepository({ participantId, userId });

  return {
    ok: true,
    data: { success: true },
  };
}
