'use client';

import Modal from '@/components/ui/Modal';
import { GroupBalances } from '@/lib/services/balanceService';

type GroupTotalsModalProps = {
  open: boolean;
  onClose: () => void;
  balances: GroupBalances;
  selectedCurrency: string;
  participantNameById: Map<string, string>;
};

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export default function GroupTotalsModal({
  open,
  onClose,
  balances,
  selectedCurrency,
  participantNameById,
}: GroupTotalsModalProps) {
  const currencySummary =
    balances.currencies.find(
      (currency) => currency.currency === selectedCurrency
    ) ?? balances.currencies[0];

  if (!currencySummary) {
    return (
      <Modal open={open} onClose={onClose} title="Totals" size="lg">
        <p className="text-sm text-slate-600">No totals yet for this group.</p>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Totals" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
              Total spent
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatMoney(
                currencySummary.totals.totalSpentCents,
                currencySummary.currency
              )}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
              Total lent
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatMoney(
                currencySummary.totals.totalLentCents,
                currencySummary.currency
              )}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
              Total borrowed
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatMoney(
                currencySummary.totals.totalBorrowedCents,
                currencySummary.currency
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Participant balances
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-2 py-2 font-semibold">Participant</th>
                  <th className="px-2 py-2 font-semibold">Spent</th>
                  <th className="px-2 py-2 font-semibold">Lent</th>
                  <th className="px-2 py-2 font-semibold">Borrowed</th>
                  <th className="px-2 py-2 font-semibold text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currencySummary.participantBalances.map((balance) => {
                  const participantName =
                    participantNameById.get(balance.participantId) ??
                    'Unknown participant';

                  return (
                    <tr key={balance.participantId}>
                      <td className="px-2 py-2 text-slate-900">
                        {participantName}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {formatMoney(
                          balance.totalSpentCents,
                          currencySummary.currency
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {formatMoney(
                          balance.totalLentCents,
                          currencySummary.currency
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {formatMoney(
                          balance.totalBorrowedCents,
                          currencySummary.currency
                        )}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-semibold ${
                          balance.netBalanceCents > 0
                            ? 'text-emerald-700'
                            : balance.netBalanceCents < 0
                              ? 'text-rose-700'
                              : 'text-slate-900'
                        }`}
                      >
                        {formatMoney(
                          balance.netBalanceCents,
                          currencySummary.currency
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Who owes whom
          </h3>
          {currencySummary.settlements.length === 0 ? (
            <p className="text-sm text-slate-600">Everyone is settled.</p>
          ) : (
            <ul className="space-y-2">
              {currencySummary.settlements.map((settlement, index) => {
                const fromName =
                  participantNameById.get(settlement.fromParticipantId) ??
                  'Unknown participant';
                const toName =
                  participantNameById.get(settlement.toParticipantId) ??
                  'Unknown participant';

                return (
                  <li
                    key={`${settlement.fromParticipantId}-${settlement.toParticipantId}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800"
                  >
                    <span className="font-medium">{fromName}</span> owes{' '}
                    <span className="font-medium">{toName}</span>{' '}
                    <span className="font-semibold">
                      {formatMoney(
                        settlement.amountCents,
                        currencySummary.currency
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
