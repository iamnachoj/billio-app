# Domain Model and Money Rules

This document describes how Billio currently stores and calculates expenses,
splits, balances, and settlement suggestions. Keep it aligned with
`lib/services/expenseService.ts`, `lib/services/balanceService.ts`,
`lib/services/paymentService.ts`, and their repository aggregates.

## Core entities

- **User** (`lib/models/user.ts`): an authenticated account.
- **Group** (`lib/models/group.ts`): a shared-expense space.
- **Group participant** (`lib/models/groupParticipant.ts`): a person in a
  particular group. A participant can be unlinked from an account. Role is
  `owner`, `admin`, `member`, or `viewer`; status is `active`, `invited`, or
  `left`.
- **Expense** (`lib/models/expense.ts`): one amount paid by a participant, in
  one group and one currency.
- **Expense split** (`lib/models/expenseSplit.ts`): an amount one participant
  owes another participant for an expense. The debtor is `participantId`; the
  creditor is `owedToParticipantId`.
- **Payment** (`lib/models/payment.ts`): a settlement transfer from one
  participant to another in a group and currency.

Expense and payment amounts are integer cents. Currency values are kept as
separate buckets; Billio does not apply exchange rates.

## Split calculation

The `split` configuration accepted by expense creation and updates has three
modes:

- **Equal:** divide the amount among participants whose status is `active`.
- **Selected:** divide the amount equally among the supplied, unique
  participant IDs.
- **Percentage:** apply each supplied percentage. IDs must be unique,
  percentages must be non-negative and their sum must be within `0.0001` of
  `100`.

The shared split resolver validates participant membership and calculates the
shares. `createExpense` and `updateExpenseForGroup` both use it.

### Integer-cent rounding

For equal and selected splits with amount `A` and `n` participants:

```text
base      = floor(A / n)
remainder = A % n
```

Each participant starts with `base` cents. The first `remainder` participants
in the input order receive one extra cent. Equal split order comes from the
repository's `created_at ASC` ordering; selected split order follows the
provided IDs after duplicate removal.

For a percentage split, the service computes each exact share, takes its floor,
then distributes the remaining cents to the largest fractional remainders.
Ties retain input order. This ensures the computed shares total exactly the
expense amount.

The payer's own share is implicit and is not stored as a debt row. Zero-value
shares are also omitted. Every persisted split points to the payer as
`owedToParticipantId`.

### Worked example: equal split

Three active participants split `1235` cents in EUR; the payer is the second
participant, and the participants are ordered A, B, C:

```text
base = floor(1235 / 3) = 411
remainder = 2
shares = A: 412, B: 412, C: 411
```

B paid. B's own 412-cent share is implicit; persisted debts are A → B for 412
cents and C → B for 411 cents. The stored debts total 823 cents; including
B's implicit 412 cents recovers the original 1235-cent expense.

### Current status-validation note

Equal splits explicitly include active participants only. The current resolver
validates selected and percentage split IDs against participants in the group,
but does not currently filter those modes by participant status. Likewise, the
resolver checks that the payer belongs to the group, not that the payer is
active. This differs from the intended active-participant wording in the API
contract and should be resolved deliberately before changing those semantics.

## Balance calculation

For each participant and currency:

```text
netBalanceCents =
  totalLentCents
  - totalBorrowedCents
  + paymentsSentCents
  - paymentsReceivedCents
```

- A participant lends the total of split rows where they are
  `owedToParticipantId`.
- A participant borrows the total of split rows where they are the debtor
  (`participantId`).
- Spending totals are attributed to the participant who paid the expense.
- A recorded payment raises the sender's net balance and lowers the
  receiver's net balance: it pays down an outstanding debt.

Interpret `position` from the sign of the net balance:

- Positive: **creditor**; the participant is owed money.
- Negative: **debtor**; the participant owes money.
- Zero: **settled**; recorded expenses and payments leave no net amount owed in
  this currency.

“Settled” describes the calculated balance, not whether an external cash
transfer has been independently verified.

### Invariants

For each currency:

1. Split shares, including the payer's implicit share, sum to the expense
   amount.
2. The sum of participant net balances is zero.
3. Payments never net across currencies.
4. Applying all suggested settlements to the current net balances brings every
   participant to zero.

These are exercised by the integration tests in
`tests/integration/balance-flow.test.ts`.

## Settlement suggestions

`balanceService.ts` matches the largest creditor with the largest debtor,
transferring the smaller outstanding amount and repeating until one side is
settled. Ties are resolved by participant ID to make the output deterministic.
The response identifies the algorithm as `min-transfers-greedy-v1`.

The suggestions are a deterministic way to settle the current balances. Do not
change the algorithm or its tie-breaking behavior without updating its tests
and the API contract.
