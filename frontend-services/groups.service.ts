export async function getGroups() {
  const response = await fetch('/api/groups', {
    credentials: 'include',
  });

  return response.json();
}

type CreateGroupInput = {
  name: string;
  description?: string;
};

export async function createGroup(body: CreateGroupInput) {
  const response = await fetch('/api/groups', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

type UpdateGroupNameInput = {
  name: string;
  description?: string;
};

export async function updateGroupName(
  groupId: string,
  body: UpdateGroupNameInput
) {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function leaveGroup(groupId: string) {
  const response = await fetch('/api/groups', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ groupId }),
  });

  return response.json();
}

type AddParticipantInput = {
  displayName: string;
  role?: 'owner' | 'admin' | 'member' | 'viewer';
  status?: 'active' | 'invited' | 'left';
  userId?: string;
};

export async function addParticipantToGroup(
  groupId: string,
  body: AddParticipantInput
) {
  const response = await fetch(`/api/groups/${groupId}/participants`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function deleteParticipantFromGroup(
  groupId: string,
  participantId: string
) {
  const response = await fetch(
    `/api/groups/${groupId}/participants/${participantId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  return response.json();
}
