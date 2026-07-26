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
