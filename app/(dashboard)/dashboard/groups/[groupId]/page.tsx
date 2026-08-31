import GroupPage from '@/components/groups/GroupPage';

import { getCurrentUser } from '@/lib/services/authService';
import {
  getGroupDetails,
  type GroupDetailsResult,
} from '@/lib/services/groupDetailsService';

type Props = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { groupId } = await params;

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const groupDetails: GroupDetailsResult = await getGroupDetails(
    groupId,
    user.id
  );

  if (!groupDetails.ok) {
    return <div>Group not found.</div>;
  }

  return (
    <GroupPage
      user={user}
      group={groupDetails.data.group}
      participants={groupDetails.data.participants}
      expenses={groupDetails.data.expenses}
      expensesNextCursor={groupDetails.data.expensesNextCursor}
      expensesTotalCount={groupDetails.data.expensesTotalCount}
      balances={groupDetails.data.balances}
    />
  );
}
