import crypto from 'crypto';

import {
  getGroupById,
} from '@/lib/repositories/groupRepository';
import {
  createParticipant as createParticipantInRepository,
  getParticipantByGroupAndUserId,
  getParticipantById,
  linkParticipantToUser,
  updateParticipantById,
} from '@/lib/repositories/participantRepository';
import {
  cleanupExpiredGroupInvites,
  createGroupInvite as createGroupInviteInRepository,
  getGroupInviteByToken,
} from '@/lib/repositories/groupInviteRepository';

export type InviteResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

type CreateInviteInput = {
  groupId: string;
  email?: string;
  createdBy: string;
};

async function ensureGroupAdmin(groupId: string, userId: string): Promise<InviteResult<{ participant: unknown }>> {
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

export async function createGroupInvite({
  groupId,
  email,
  createdBy,
}: CreateInviteInput): Promise<InviteResult<{ invite: unknown }>> {
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

  if (!groupId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID is required',
        status: 400,
      },
    };
  }

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

  const adminResult = await ensureGroupAdmin(groupId, createdBy);
  if (!adminResult.ok) {
    return adminResult;
  }

  await cleanupExpiredGroupInvites();

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const invite = await createGroupInviteInRepository({
    groupId,
    token,
    email: email?.trim(),
    expiresAt,
    createdBy,
  });

  return {
    ok: true,
    data: { invite },
  };
}

export async function getInviteByToken(token: string): Promise<InviteResult<{ invite: unknown }>> {
  if (!token) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Token is required',
        status: 400,
      },
    };
  }

  await cleanupExpiredGroupInvites();

  const invite = await getGroupInviteByToken(token);

  if (!invite) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Invite not found',
        status: 404,
      },
    };
  }

  if (invite.status !== 'pending' || invite.expiresAt < new Date()) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invite is no longer available',
        status: 400,
      },
    };
  }

  return {
    ok: true,
    data: { invite },
  };
}

export async function acceptInvite({
  token,
  userId,
  userEmail,
  participantId,
  displayName,
}: {
  token: string;
  userId: string;
  userEmail?: string;
  participantId?: string;
  displayName?: string;
}): Promise<InviteResult<{ accepted: true }>> {
  if (!token || !userId) {
    return {
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status: 401,
      },
    };
  }

  const inviteResult = await getInviteByToken(token);
  if (!inviteResult.ok) {
    return inviteResult;
  }

  const invite = inviteResult.data.invite as {
    id: string;
    groupId: string;
    email?: string;
  };

  if (invite.email && userEmail && invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'This invite is tied to another email address',
        status: 403,
      },
    };
  }

  if (!participantId && !displayName?.trim()) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Select an existing participant or provide a display name',
        status: 400,
      },
    };
  }

  if (participantId) {
    const participant = await getParticipantById(participantId);
    if (!participant || participant.groupId !== invite.groupId) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Participant not found',
          status: 404,
        },
      };
    }

    if (participant.userId && participant.userId !== userId) {
      return {
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Participant already belongs to another user',
          status: 403,
        },
      };
    }

    await updateParticipantById(participant.id, {
      status: 'active',
    });

    if (!participant.userId) {
      await linkParticipantToUser({
        participantId: participant.id,
        userId,
      });
    }
  } else {
    await createParticipantInRepository({
      groupId: invite.groupId,
      displayName: displayName!.trim(),
      userId,
      role: 'member',
      status: 'active',
      createdBy: userId,
    });
  }

  return {
    ok: true,
    data: { accepted: true },
  };
}
