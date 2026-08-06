'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import { ExpenseDetailsData } from '@/frontend-services/expenses.service';

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
  onExpenseUpdated?: (payload: {
    previous: ExpenseDetailsData;
    next: ExpenseDetailsData;
  }) => void;
  onExpenseDeleted?: (details: ExpenseDetailsData) => void;
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
              {model.isDeleteConfirmOpen ? (
                <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-900">
                    Delete this expense?
                  </p>
                  <p className="text-sm text-rose-700">
                    This permanently removes the expense and its splits. It will
                    disappear from history and stop counting in balances.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={model.cancelDeleteConfirm}
                      disabled={model.isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={model.confirmDeleteExpense}
                      loading={model.isDeleting}
                    >
                      Delete expense
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-row justify-end gap-2">
                {props.canEdit ? (
                  <>
                    {!model.isDeleteConfirmOpen ? (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={model.openDeleteConfirm}
                          className="cursor-pointer rounded-xl border border-rose-200 bg-transparent px-4 py-3 font-semibold text-rose-700 transition-colors duration-200 hover:bg-rose-50"
                        >
                          Delete expense
                        </button>
                      </div>
                    ) : null}
                    <div className="flex justify-end">
                      <Button type="button" onClick={model.startEditing}>
                        Edit expense
                      </Button>
                    </div>
                  </>
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
