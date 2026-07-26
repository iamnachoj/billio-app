export async function getGroups() {
  const response = await fetch('/api/groups', {
    credentials: 'include',
  });

  return response.json();
}
