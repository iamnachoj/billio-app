export type InvitePreview = {
  invite: {
    id: string;
    groupId: string;
    participantId?: string;
    token: string;
    email?: string;
    status: 'pending' | 'accepted' | 'revoked' | 'expired';
    expiresAt: string | Date;
    acceptedAt?: string | Date;
    revokedAt?: string | Date;
    createdAt: string | Date;
    updatedAt: string | Date;
    createdBy: string;
  };
  group: {
    id: string;
    name: string;
    description?: string;
  };
  claimableParticipants: Array<{
    id: string;
    displayName: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    status: 'active' | 'invited' | 'left';
  }>;
};

export type InviteApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export async function createGroupInvite(
  groupId: string,
  body?: { email?: string }
) {
  const response = await fetch(`/api/groups/${groupId}/invites`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  });

  return response.json() as Promise<
    InviteApiResult<{
      id: string;
      groupId: string;
      token: string;
      email?: string;
      expiresAt: string | Date;
      status: 'pending' | 'accepted' | 'revoked' | 'expired';
    }>
  >;
}

export async function getInvitePreview(token: string) {
  const response = await fetch(`/api/invites/${token}`, {
    method: 'GET',
    credentials: 'include',
  });

  return response.json() as Promise<InviteApiResult<InvitePreview>>;
}

export async function acceptInvite(
  token: string,
  body: { participantId?: string; displayName?: string }
) {
  const response = await fetch(`/api/invites/${token}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json() as Promise<InviteApiResult<{ accepted: true }>>;
}
