'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

import GroupCategoryStats from '@/components/groups/GroupCategoryStats';
import GroupPaymentHistory from '@/components/groups/GroupPaymentHistory';
import { formatMoney } from '@/components/groups/groupTotalsUtils';
import Modal from '@/components/ui/Modal';
import { GroupBalances } from '@/lib/services/balanceService';
import { createPayment } from '@/frontend-services/payments.service';
import { useApiError } from '@/i18n/errors';

type GroupTotalsModalProps = {
  open: boolean;
  onClose: () => void;
  groupId: string;
  balances: GroupBalances;
  selectedCurrency: string;
  participantNameById: Map<string, string>;
};

export default function GroupTotalsModal({
  open,
  onClose,
  groupId,
  balances,
  selectedCurrency,
  participantNameById,
}: GroupTotalsModalProps) {
  const t = useTranslations('GROUPS');
  const locale = useLocale();
  const apiError = useApiError();
  const currencySummary =
    balances.currencies.find(
      (currency) => currency.currency === selectedCurrency
    ) ?? balances.currencies[0];

  const router = useRouter();
  const [settlingKey, setSettlingKey] = useState<string | null>(null);
  const [settleError, setSettleError] = useState('');

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  async function handleSettle(settlement: {
    fromParticipantId: string;
    toParticipantId: string;
    amountCents: number;
  }) {
    if (!currencySummary) {
      return;
    }

    const key = `${settlement.fromParticipantId}-${settlement.toParticipantId}`;
    setSettlingKey(key);
    setSettleError('');

    const result = await createPayment(groupId, {
      fromParticipantId: settlement.fromParticipantId,
      toParticipantId: settlement.toParticipantId,
      amountCents: settlement.amountCents,
      currency: currencySummary.currency,
    });

    setSettlingKey(null);

    if (!result.success) {
      setSettleError(apiError(result.error));
      return;
    }

    setHistoryRefreshKey((key) => key + 1);
    router.refresh();
  }

  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [monthOffset, setMonthOffset] = useState(0);

  if (!currencySummary) {
    return (
      <Modal open={open} onClose={onClose} title={t('TOTALS.TITLE')} size="lg">
        <p className="text-sm text-slate-600">{t('TOTALS.EMPTY')}</p>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={t('TOTALS.TITLE')} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
              {t('TOTALS.TOTAL_SPENT')}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatMoney(
                currencySummary.totals.totalSpentCents,
                currencySummary.currency,
                locale
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {t('TOTALS.PARTICIPANT_BALANCES')}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-2 py-2 font-semibold">
                    {t('TOTALS.PARTICIPANT')}
                  </th>
                  <th className="px-2 py-2 font-semibold">
                    {t('TOTALS.SPENT')}
                  </th>
                  <th className="px-2 py-2 font-semibold">
                    {t('TOTALS.LENT')}
                  </th>
                  <th className="px-2 py-2 font-semibold">
                    {t('TOTALS.BORROWED')}
                  </th>
                  <th className="px-2 py-2 font-semibold text-right">
                    {t('TOTALS.NET')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currencySummary.participantBalances.map((balance) => {
                  const participantName =
                    participantNameById.get(balance.participantId) ??
                    t('PAYMENTS.UNKNOWN_PARTICIPANT');

                  return (
                    <tr key={balance.participantId}>
                      <td className="px-2 py-2 text-slate-900">
                        {participantName}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {formatMoney(
                          balance.totalSpentCents,
                          currencySummary.currency,
                          locale
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {formatMoney(
                          balance.totalLentCents,
                          currencySummary.currency,
                          locale
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {formatMoney(
                          balance.totalBorrowedCents,
                          currencySummary.currency,
                          locale
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
                          currencySummary.currency,
                          locale
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
            {t('TOTALS.WHO_OWES_WHOM')}
          </h3>
          {settleError ? (
            <p className="text-sm text-rose-700">{settleError}</p>
          ) : null}
          {currencySummary.settlements.length === 0 ? (
            <p className="text-sm text-slate-600">
              {t('TOTALS.EVERYONE_SETTLED')}
            </p>
          ) : (
            <ul className="space-y-2">
              {currencySummary.settlements.map((settlement, index) => {
                const fromName =
                  participantNameById.get(settlement.fromParticipantId) ??
                  t('PAYMENTS.UNKNOWN_PARTICIPANT');
                const toName =
                  participantNameById.get(settlement.toParticipantId) ??
                  t('PAYMENTS.UNKNOWN_PARTICIPANT');
                const key = `${settlement.fromParticipantId}-${settlement.toParticipantId}`;
                const isSettling = settlingKey === key;

                return (
                  <li
                    key={`${key}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800"
                  >
                    <p>
                      {t('TOTALS.OWES', {
                        fromName,
                        toName,
                        amount: formatMoney(
                          settlement.amountCents,
                          currencySummary.currency,
                          locale
                        ),
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSettle(settlement)}
                      disabled={isSettling}
                      className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSettling ? t('TOTALS.SAVING') : t('TOTALS.MARK_PAID')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <GroupPaymentHistory
          groupId={groupId}
          currency={currencySummary.currency}
          participantNameById={participantNameById}
          refreshKey={historyRefreshKey}
        />

        <GroupCategoryStats
          groupId={groupId}
          currency={currencySummary.currency}
          period={period}
          monthOffset={monthOffset}
          onSelectMonth={() => setPeriod('month')}
          onSelectAll={() => setPeriod('all')}
          onChangeMonth={(direction) => {
            setMonthOffset((offset) => Math.min(0, offset + direction));
            setPeriod('month');
          }}
        />
      </div>
    </Modal>
  );
}
