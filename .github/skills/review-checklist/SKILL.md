---
name: review-checklist
description: Checklist for reviewing a Billio change (diff, branch, or PR) for auth, authorization, input validation, money handling, layering, and docs/test completeness. Use when asked to review code or before declaring a feature done.
---

# Review checklist

Start with `git diff` (or the PR diff) and `npm run verify`. Report only real problems, ordered by severity, with file and line.

## Auth and authorization

- Every new route calls `getCurrentUser()` and returns 401 when missing.
- Every service touching group data checks membership via `getParticipantByGroupAndUserId` (403 for non-members, 404 for unknown group) and enforces roles (`viewer` is read-only; check owner/admin where the rule demands it).
- Ids from the URL/body (participant, expense, payment) are verified to belong to the group in the URL, not just to exist (prevents cross-group access).
- No secrets, tokens or `passwordHash` leak in responses or logs. `proxy.ts` protects `/dashboard`; API routes do their own auth.

## Input validation

- Strings are trimmed and required fields checked; enums (categories, roles, split modes) validated against known values.
- Numbers: integers, positive where needed; no `NaN`/`Infinity`; pagination `limit` is capped.
- Body fields are picked explicitly and typed as unknown at the boundary.
- SQL uses `?` placeholders only.

## Money

- Integer cents everywhere; no float arithmetic on stored amounts.
- Splits sum to the amount; balances sum to 0 per currency; no cross-currency math. See `balance-and-expense-logic`.
- New aggregate queries `GROUP BY currency`.

## Architecture

- Route → service → repository; no SQL outside repositories, no business logic in routes, no `fetch` outside `frontend-services/`.
- Service returns `{ ok, data | error }` (no throwing for expected failures); routes use `successResponse`/`errorResponse`.
- UI follows React Compiler rules (no `setState` in effect bodies, no stale manual memoization).

## Completeness

- Unit tests for new service branches; integration test for cross-feature or balance changes.
- `docs/api-contract-v1.md` updated for any API change.
- Schema changes are idempotent in `lib/db/init-db.ts`, were approved by the user, and new tables are in the integration `TABLES` cleanup list.
- No unrelated edits, no committed `.env*`/`*.db`, no new dependency without approval.
