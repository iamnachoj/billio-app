import Dashboard from '@/components/dashboard/Dashboard';

import { cookies } from 'next/headers';

import { getCurrentUser } from '@/lib/services/authService';
import { getGroupsForUser } from '@/lib/services/groupService';
import {
  applyGroupOrder,
  GROUP_ORDER_COOKIE,
  parseGroupOrder,
} from '@/lib/utils/groupOrder';

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

  const cookieStore = await cookies();
  const storedOrder = parseGroupOrder(
    cookieStore.get(GROUP_ORDER_COOKIE)?.value
  );
  const groups = applyGroupOrder(response.data.groups, storedOrder);

  return <Dashboard user={user} groups={groups} />;
}
