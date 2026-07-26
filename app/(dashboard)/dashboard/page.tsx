import Dashboard from '@/components/dashboard/Dashboard';

import { getCurrentUser } from '@/lib/services/authService';
import { getGroupsForUser } from '@/lib/services/groupService';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
    // later redirect('/login')
  }

  const response = await getGroupsForUser(user.id);

  if (!response.ok) {
    return null;
  }

  return <Dashboard user={user} groups={response.data.groups} />;
}
