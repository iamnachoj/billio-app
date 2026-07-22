import {
  createGroup as createGroupInRepository,
  getGroupById,
  getGroupsByUserId,
} from '@/lib/repositories/groupRepository';
import {
  createParticipant as createParticipantInRepository,
  deleteParticipantById as deleteParticipantByIdInRepository,
  getParticipantById,
  getParticipantsByGroupId,
  getParticipantByGroupAndUserId,
  participantHasLinkedExpenses,
  linkParticipantToUser as linkParticipantToUserInRepository,
  updateParticipantById as updateParticipantByIdInRepository,
} from '@/lib/repositories/participantRepository';

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

  await createParticipantInRepository({
    groupId: group.id,
    displayName: creatorName,
    userId: createdBy,
    role: 'owner',
    status: 'active',
    createdBy,
  });

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

  await updateParticipantByIdInRepository(membership.id, {
    status: 'left',
    userId: null,
  });

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

  const participants = await getParticipantsByGroupId(groupId);

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

  const participant = await createParticipantInRepository({
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

  const participant = await getParticipantById(participantId);
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

  await updateParticipantByIdInRepository(participantId, {
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
  groupId,
  userId,
}: {
  participantId: string;
  groupId?: string;
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

  const participant = await getParticipantById(participantId);
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

  if (groupId && participant.groupId !== groupId) {
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

  if (participant.role === 'owner' || participant.role === 'admin') {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin participants cannot be deleted',
        status: 403,
      },
    };
  }

  const hasExpenses = await participantHasLinkedExpenses(participant.id);

  if (hasExpenses) {
    return {
      ok: false,
      error: {
        code: 'CONFLICT',
        message: 'Participant has linked expenses and cannot be deleted',
        status: 409,
      },
    };
  }

  await deleteParticipantByIdInRepository(participantId);

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
