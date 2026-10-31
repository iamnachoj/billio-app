---
name: add-ui-feature
description: Build or change UI in Billio (components, modals, forms, hooks, pages) following the project's layering and React Compiler lint rules. Use when the user asks for a new screen, modal, form, or change to existing frontend behaviour.
---

# Add a UI feature

Read `docs/frontend-architecture.md` if unsure where code belongs.

## Layering

```
app/ page (server, small)  →  components/<domain>/Feature.tsx  →  hooks/useFeature.ts  →  frontend-services/*.service.ts  →  /api
```

- **Pages** in `app/` stay small: fetch/compose and render a domain component.
- **Components** live in `components/<domain>/` (`groups`, `dashboard`, `auth`, `invites`, `layout`). Mostly presentational; mark `'use client'` only when needed.
- **Hooks** in `components/<domain>/hooks/` own state, validation and submit handlers. Pattern (see `useCreateGroup.ts`): `loading`, `error` strings, `handleSubmit`; on `!response.success` set `error` to `response.error.message`; on success call `onSuccess?.()` and `router.refresh()`.
- **Never call `fetch` in a component or hook.** Add or reuse a function in `frontend-services/`. If the endpoint is new, use the `add-api-endpoint` skill first.
- Frontend services return `{ success, data } | { success: false, error }`; always branch on `result.success`.

## UI primitives

Reuse `components/ui/` before writing new markup: `Button` (`variant`: primary/secondary/danger), `Input`, `Modal` (`open`, `onClose`, `title`, `size`: sm/md/lg), `Alert`, `EditButton`. Styling is Tailwind 4 with the existing teal/slate palette. Modal-based features: follow `GroupSettingsModal.tsx` / `InviteLinkModal.tsx`.

## React Compiler lint rules (these fail `npm run lint`)

- Don't call `setState` synchronously in a `useEffect` body. Instead:
  - Derive values during render (`const category = manual ? picked : suggest(title)`), don't mirror them into state.
  - For "reset on close", reset in the close handler, not in an effect.
  - For loading flags of fetch effects, derive them from a request key (`loadedKey !== currentKey`) and set state only inside the async callback (see `GroupTotalsModal.tsx`).
- Avoid manual `useMemo`/`useCallback` unless needed; the compiler flags memoization whose dependencies don't match the inferred ones.
- Escape apostrophes in JSX text (`&apos;`).
- Use `next/image` instead of `<img>`.

## Checklist

1. Decide domain folder; reuse existing components/hooks where possible.
2. Add/extend the frontend service, hook, then component.
3. Handle loading, error and empty states; show errors with `Alert` or the surrounding pattern.
4. Money in the UI: API amounts are integer cents; convert only at the display/input edge.
5. Check the result in the browser if the change is visual (`npm run dev`).
6. `npm run verify`.

Note: unit tests only cover `lib/**/*.test.ts`; there is no component test setup. Put testable logic in `lib/` or pure helper functions.
