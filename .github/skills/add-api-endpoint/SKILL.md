---
name: add-api-endpoint
description: Add or change a backend API endpoint in Billio end to end (repository, service, route handler, frontend service, tests, API contract doc). Use when the user asks for a new endpoint, a new field in a request/response, or a new server-side capability the UI needs.
---

# Add an API endpoint

Work bottom-up and finish each layer before the next. Reference implementation: payments (`lib/repositories/paymentRepository.ts`, `lib/services/paymentService.ts`, `app/api/groups/[groupId]/payments/route.ts`, `frontend-services/payments.service.ts`).

## Checklist

1. **Schema first, if needed.** If new tables or columns are required, stop and follow the `add-db-migration` skill (and ask the user, per AGENTS.md).
2. **Model** in `lib/models/<entity>.ts`. Money is an integer in cents (`amount`); dates are `Date`.
3. **Repository** in `lib/repositories/<entity>Repository.ts`.
   - Only place allowed to import `@/lib/db/db`. Use `db.execute({ sql, args })` with `?` placeholders. Never concatenate input into SQL.
   - Map rows to model types (`row.x as string`, `Number(...)` for aggregates, `new Date(...)`).
   - Generate ids with `randomUUID()` and ISO timestamps for `created_at`.
4. **Service** in `lib/services/<entity>Service.ts`.
   - Return `{ ok: true, data } | { ok: false, error: { code, message, status } }`. Do not throw for expected failures.
   - Order of checks: input validation (`INVALID_INPUT` 400) → membership (`getParticipantByGroupAndUserId`; if none, `NOT_FOUND` 404 when the group doesn't exist, otherwise `FORBIDDEN` 403) → role checks (`viewer` cannot write) → business rules → repository call.
   - Validate that every participant id referenced belongs to the group.
5. **Route** in `app/api/.../route.ts`. Keep it thin:
   ```ts
   const currentUser = await getCurrentUser();
   if (!currentUser) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
   const { groupId } = await params; // params is a Promise in Next 16
   const body = await req.json();
   const result = await someService({ groupId, userId: currentUser.id, ...body fields });
   if (!result.ok) return errorResponse(result.error.code, result.error.message, result.error.status);
   return successResponse(result.data, 201 /* for creates */);
   ```
   Wrap everything in try/catch that logs and returns `errorResponse('INTERNAL_ERROR', 'Something went wrong', 500)`. Pick fields from `body` explicitly (`body?.x`); do not spread the body into the service.
6. **Frontend service** in `frontend-services/<domain>.service.ts`: `fetch` with `credentials: 'include'`, JSON headers, and return `parseApiResult<T>(response)` (exported from `expenses.service.ts`). Export the request/response types here.
7. **Tests** (see the `write-tests` skill): unit tests for the service with mocked repositories (success, each error code, permission cases), plus an integration test if the endpoint changes balances, splits, or crosses several repositories.
8. **Docs**: update the matching section of `docs/api-contract-v1.md` (path, request, response, error codes) in the same change.
9. Run `npm run verify`.

## Common mistakes

- Putting validation or SQL in the route handler.
- Returning raw `NextResponse.json` instead of `successResponse` / `errorResponse`.
- Forgetting the membership/role check, so non-members can read or write a group's data.
- Forgetting `await params`.
- Leaving the API contract out of date.
