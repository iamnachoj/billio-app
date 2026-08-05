'use client';

import { Expense } from '@/lib/models/expense';
import { Group } from '@/lib/models/group';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import { GroupBalances } from '@/lib/services/balanceService';

import ExpenseList from '@/components/groups/Expenses/ExpenseList';
import AddExpenseModal from '@/components/groups/AddExpenseModal';
import GroupHeader from '@/components/groups/GroupHeader';
import GroupParticipantsModal from '@/components/groups/GroupParticipantsModal';
import LeaveGroupConfirmModal from '@/components/groups/LeaveGroupConfirmModal';
import GroupSettingsModal from './GroupSettingsModal';
import { useGroup } from './hooks/useGroup';
import ExpenseDetailsModal from './Expenses/ExpenseDetailsModal';

export type GroupPageUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  avatarUrl?: string;
};

export type GroupPageProps = {
  user: GroupPageUser;
  group: Group;
  participants: GroupParticipant[];
  expenses: Expense[];
  balances: GroupBalances;
};

export default function GroupPage(props: GroupPageProps) {
  const group = useGroup(props);

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-8 space-y-8">
      <GroupHeader
        groupName={group.groupName}
        description={group.groupDescription}
        participantsCount={group.participants.length}
        expensesCount={group.expenses.length}
        selectedCurrency={group.selectedCurrency}
        summaryLabel={group.summaryLabel}
        myNetBalanceCents={group.myNetBalanceCents}
        onOpenParticipantsModal={group.openParticipantsModal}
        onOpenSettingsModal={group.openSettingsModal}
      />

      <ExpenseList
        expenses={group.expensesSorted}
        participantNameById={group.participantNameById}
        onOpenAddExpenseModal={group.openAddExpenseModal}
        onOpenExpenseDetailsModal={group.openExpenseDetailsModal}
        canCreateExpense={group.canCreateExpense}
      />

      <GroupParticipantsModal
        open={group.isParticipantsModalOpen}
        onClose={group.closeParticipantsModal}
        participants={group.participants}
        currentUserId={group.user.id}
        canAddParticipants={group.canEditGroupName}
        isAddingParticipant={group.isAddingParticipant}
        addParticipantError={group.addParticipantError}
        newParticipantNameDraft={group.newParticipantNameDraft}
        setNewParticipantNameDraft={group.setNewParticipantNameDraft}
        newParticipantRoleDraft={group.newParticipantRoleDraft}
        setNewParticipantRoleDraft={group.setNewParticipantRoleDraft}
        onAddParticipant={group.addParticipantFromParticipantsModal}
      />

      <GroupSettingsModal
        open={group.isSettingsModalOpen}
        onClose={group.closeSettingsModal}
        onSubmit={group.submitSettings}
        isSaving={group.isSavingSettings}
        isLeavingGroup={group.isLeavingGroup}
        error={group.settingsError}
        canEditGroupName={group.canEditGroupName}
        canLeaveGroup={group.canLeaveGroup}
        groupNameDraft={group.groupNameDraft}
        setGroupNameDraft={group.setGroupNameDraft}
        groupDescriptionDraft={group.groupDescriptionDraft}
        setGroupDescriptionDraft={group.setGroupDescriptionDraft}
        currencyDraft={group.settingsCurrencyDraft}
        setCurrencyDraft={group.setSettingsCurrencyDraft}
        currencies={group.availableCurrencies}
        onRequestLeaveGroup={group.requestLeaveGroup}
      />

      <LeaveGroupConfirmModal
        open={group.isLeaveConfirmModalOpen}
        onClose={group.cancelLeaveGroup}
        onConfirm={group.confirmLeaveGroup}
        isLeavingGroup={group.isLeavingGroup}
        groupName={group.groupName}
      />

      <AddExpenseModal
        open={group.isAddExpenseModalOpen}
        onClose={group.closeAddExpenseModal}
        groupId={group.group.id}
        participants={group.participants}
        currencies={group.availableCurrencies}
        defaultCurrency={group.selectedCurrency}
      />

      <ExpenseDetailsModal
        open={group.isExpenseDetailsModalOpen}
        onClose={group.closeExpenseDetailsModal}
        groupId={group.group.id}
        expenseId={group.selectedExpenseId}
        participants={group.participants}
        currencies={group.availableCurrencies}
        canEdit={group.canCreateExpense}
      />
    </main>
  );
}
