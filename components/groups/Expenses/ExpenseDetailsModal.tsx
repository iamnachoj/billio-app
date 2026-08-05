'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { GroupParticipant } from '@/lib/models/groupParticipant';

import ExpenseDetailsView from './ExpenseDetailsView';
import ExpenseEditForm from './ExpenseEditForm';
import { useExpenseDetailsModal } from './hooks/useExpenseDetailsModal';

type ExpenseDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  groupId: string;
  expenseId: string | null;
  participants: GroupParticipant[];
  currencies: string[];
  canEdit: boolean;
};

export default function ExpenseDetailsModal(props: ExpenseDetailsModalProps) {
  const model = useExpenseDetailsModal(props);

  return (
    <Modal
      open={props.open}
      onClose={model.closeModal}
      title="Expense details"
      size="lg"
    >
      {model.isFetching ? (
        <div className="py-8 text-center text-sm text-slate-500">
          Loading expense...
        </div>
      ) : null}

      {!model.isFetching && model.details ? (
        <div className="space-y-5">
          {!model.isEditing ? (
            <>
              <ExpenseDetailsView
                details={model.details}
                splitSummaryRows={model.splitSummaryRows}
                participantNameById={model.participantNameById}
              />
              <div className="flex flex-row justify-end gap-2">
                {props.canEdit ? (
                  <div className="flex justify-end">
                    <Button type="button" onClick={model.startEditing}>
                      Edit expense
                    </Button>
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={model.closeModal}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <ExpenseEditForm
              title={model.title}
              description={model.description}
              category={model.category}
              amountInput={model.amountInput}
              currency={model.currency}
              paidByParticipantId={model.paidByParticipantId}
              splitMode={model.splitMode}
              selectedParticipantIds={model.selectedParticipantIds}
              percentageByParticipantId={model.percentageByParticipantId}
              activeParticipants={model.activeParticipants}
              currencyOptions={model.currencyOptions}
              error={model.error}
              isSaving={model.isSaving}
              onSubmit={model.handleSubmit}
              onCancel={model.cancelEditing}
              setTitle={model.setTitle}
              setDescription={model.setDescription}
              setCategory={model.setCategory}
              setAmountInput={model.setAmountInput}
              setCurrency={model.setCurrency}
              setPaidByParticipantId={model.setPaidByParticipantId}
              setSplitMode={model.setSplitMode}
              toggleSelectedParticipant={model.toggleSelectedParticipant}
              updatePercentage={model.updatePercentage}
            />
          )}
        </div>
      ) : null}

      {!model.isFetching && !model.details && model.error ? (
        <div className="space-y-4">
          <p className="text-sm text-rose-700">{model.error}</p>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={model.closeModal}
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
