---
name: balance-and-expense-logic
description: Domain rules for Billio expenses, splits, payments (settlements) and balances, including rounding and sign conventions. Use before modifying or debugging anything in expenseService, balanceService, paymentService, statsService, or the SQL aggregates in expenseRepository/paymentRepository.
---

# Expenses, splits, payments and balances

Files: `lib/services/expenseService.ts`, `lib/services/balanceService.ts`, `lib/services/paymentService.ts`, aggregates in `lib/repositories/expenseRepository.ts` and `paymentRepository.ts`.

## Invariants (never break these)

1. All money is an **integer number of cents**. Amounts must be `Number.isInteger(x) && x > 0`. Never use floats for stored amounts.
2. For each expense, the shares computed by the split sum **exactly** to the expense amount (before the payer's own share is dropped).
3. Within one currency, the sum of all participants' `netBalanceCents` is **0**. Currencies are never mixed or converted; everything is grouped per currency.
4. Settlements produced from balances, when all paid, bring every participant to 0.

## How an expense becomes debt

- `paidByParticipantId` fronts the money. Each share is stored as an `expense_splits` row `{ participantId (debtor), owedToParticipantId = payer, amount }`.
- **The payer's own share is not stored** (`share.participantId !== paidByParticipantId` is filtered out; zero shares are dropped too).
- Split modes (`SplitInput`):
  - `equal`: all participants of the group (every status, including `left` and `invited`, since `getParticipantsByGroupId` doesn't filter by status).
  - `selected`: equal among the unique `participantIds` given.
  - `percentage`: `{ participantId, percentage }[]`, no duplicates, no negatives, sum within 0.0001 of 100.
- Rounding:
  - Equal/selected: `base = floor(amount / n)`, `remainder = amount % n`; the **first `remainder` participants in list order (`created_at ASC`) get +1 cent**.
  - Percentage: floor each `amount * pct / 100`, then give the leftover cents one each to the largest fractional parts (stable order on ties).
- `viewer` role cannot create expenses. Create and update both resolve splits; `createExpense` and `resolveExpenseSplits` currently contain duplicated split logic, so change both together or consolidate deliberately.

### Worked example (matches `tests/integration/balance-flow.test.ts`)

Expense 1235 cents EUR, equal split among Owner, Member, Unlinked (in creation order), paid by Member.

- base = 411, remainder = 2 → shares: Owner 412, Member 412, Unlinked 411.
- Member's own share is dropped. Splits stored: Owner owes Member 412; Unlinked owes Member 411.
- Totals: `totalSpent` = 1235 (Member), lent = 823 (Member), borrowed = 412 (Owner) + 411 (Unlinked).
- Net: Member +823 (creditor), Owner −412, Unlinked −411 (debtors). Sum = 0.

Percentage example: 1001 cents, 50/50 between A and B → raw 500.5 each, floors 500+500, 1 cent left → first by fraction (ties keep input order) gets 501.

## Balances

`netBalanceCents = totalLentCents − totalBorrowedCents + paymentsSent − paymentsReceived`

- `totalLent` = sum of splits where the person is `owed_to`; `totalBorrowed` = sum of splits where they are the debtor.
- A payment `{ from, to, amount }` is a settlement: **sender's net goes up** (debt reduced), **receiver's net goes down**.
- `position`: `> 0` creditor, `< 0` debtor, `0` settled.
- `settlements`: greedy min-transfers (`min-transfers-greedy-v1`): largest creditor vs. largest debtor, ties broken by `participantId.localeCompare`. Output must stay deterministic; the algorithm name is part of the API response and `docs/api-contract-v1.md`.

## Payments

- Validate: ids present, `from !== to`, `amountCents` positive integer, caller is a member of the group, both participants belong to the group. Currency is trimmed and upper-cased.
- Pagination uses an opaque base64url cursor `createdAt|id`; keep it stable.

## Before you change anything here

1. Write or extend an integration test with odd amounts and assert the invariants above.
2. Check both create and update paths in `expenseService.ts`, and `statsService.ts` if category totals are affected.
3. If response shapes change, update `docs/api-contract-v1.md` and the frontend types in `frontend-services/`.
4. Ask the user before changing rounding or sign conventions; existing data was computed with these rules.
