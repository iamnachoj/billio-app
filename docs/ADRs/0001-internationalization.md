# ADR 0001: Internationalization (i18n) with locale-prefixed URLs

- **Status:** Proposed
- **Date:** 2026-11-01

## Context

Billio is English-only. Strings, number/date formats and `lang="en"` are hardcoded. We want to support several languages (`en`, `es`, `fr`, ...) by putting the locale in the URL (`/en/login`, `/es/dashboard`) and detecting it from the user's preferred language.

Findings in the current codebase:

- [proxy.ts](../../proxy.ts) hardcodes `/login`, `/dashboard`, etc., has a `matcher` list, and builds `?next=` redirects. It must become locale-aware.
- About 31 hardcoded navigations (`href`, `router.push`, `redirect`) across `app/`, `components/` and `lib/`.
- `lang="en"` is hardcoded in both `app/(public)/layout.tsx` and `app/(dashboard)/layout.tsx`.
- About 9 hardcoded formatters: `Intl.NumberFormat('en-US')` and `Intl.DateTimeFormat('en-GB')` in components and `lib/services/pushService.ts`.
- Server-generated user-facing text outside the React tree:
  - `lib/services/emailService.ts`: English email and a reset link without locale.
  - `lib/services/pushService.ts`: English push text and URL `/dashboard/groups/:id`.
  - `public/sw.js`: opens `/dashboard` as a fallback.
- Services return English `message` strings in API errors. Stable `code` values already exist.
- `app/manifest.ts` and page metadata are English-only.

Next.js 16 has no built-in i18n routing. The App Router pattern is a `[locale]` segment plus negotiation in `proxy.ts`.

## Decision

Use **next-intl** (new dependency, requires approval before installing) with:

1. A `[locale]` route segment wrapping all pages (`app/[locale]/(public|dashboard)/...`).
2. Locale negotiation in `proxy.ts`. Order: `NEXT_LOCALE` cookie, then `Accept-Language`, then default `en`.
3. **Always-prefixed URLs** (`/en/login`), with no hidden default locale. This keeps links, emails and push URLs unambiguous.
4. Supported locales: `en`, `es` and `fr`. French regional browser language tags
   (for example `fr-FR`, `fr-CA`, `fr-BE` and `fr-CH`) resolve to `fr`.
5. `/api/**` stays **unprefixed** and out of the proxy matcher. Locale reaches the API via a header or request field when needed.
6. API errors keep stable `code` values. The frontend translates by code rather than displaying server `message` text.
7. Persist the user's locale in the DB (`users.locale`) so emails and push notifications can be localized without a request.

## Open questions (already answered)

- [x] Approve adding `next-intl` (AGENTS.md requires asking before adding dependencies).
- [x] Approve the schema change `users.locale` (required by AGENTS.md; needed in Step 7).
- [x] Confirm always-prefixed URLs.
- [x] Confirm the first locales: `en`, `es`.
- [x] Add French (`fr`), including browser language negotiation and translated messages.
- [x] Legal pages (`privacy-policy`, `terms-and-conditions`): professional translation, or keep English only at first?

## Implementation plan

Steps 1-3 are infrastructure. They can ship with `en` + `es` and the app should behave the same. Steps 4-8 go domain by domain, in small PRs. Run `npm run verify` at the end of every step.

### Step 0: Decisions and dependency

Resolve the open questions above and install `next-intl`.

### Step 1: Routing skeleton (no translations yet)

- Add `i18n/routing.ts` (locales, default locale) and `i18n/request.ts`.
- Move route groups under `app/[locale]/`. Use a single root layout there so `<html lang={locale}>` is dynamic (replaces the two hardcoded `lang="en"`).
- Add `generateStaticParams` and `setRequestLocale` where needed.
- Update `proxy.ts`:
  - Run locale negotiation first.
  - Strip the locale before the auth checks (`isPublicRoute`, `/dashboard`).
  - Keep `?next=` redirects locale-prefixed, and keep `resolveSafeNextPath` safe.
  - Update `matcher` to exclude `/api`, `_next`, static files, `sw.js` and the manifest.
- Tests: unit tests for the proxy path and locale logic.

### Step 2: Locale-aware navigation

- Add `i18n/navigation.ts` with the wrapped `Link`, `useRouter`, `redirect` and `usePathname`.
- Replace all hardcoded navigations (about 31).
- Verify the login flow with `?next=` does not double or lose the locale.
- Verify `/invites/:token` works when shared with and without a locale.

### Step 3: Message infrastructure

- Add `messages/en.json` and `messages/es.json`, namespaced by domain (`auth`, `dashboard`, `groups`, `invites`, `ui`, ...).
- Add type-safe message keys.
- Add a check (script or test) that every locale has the same keys as `en`.
- Convention: `useTranslations('<namespace>')` in client components, `getTranslations` on the server.

### Step 4: Translate the UI (one PR per item)

1. `components/layout` and `components/ui`
2. `components/auth`
3. `components/dashboard`
4. `components/groups` and expenses
5. `components/invites`
6. Legal pages (see open questions)

### Step 5: Formatting

- Replace hardcoded `Intl.NumberFormat('en-US')` and `Intl.DateTimeFormat('en-GB')` with locale-aware helpers.
- Currency comes from the group. Number and date formatting follow the user's locale.
- Update `lib/services/pushService.ts` formatting (see Step 7).

### Step 6: Errors and validation

- Map API error `code` values to translated messages on the frontend.
- Decide how Zod validation messages are handled: translate on the client or return codes.
- Keep `docs/api-contract-v1.md` accurate if error codes change.

### Step 7: Server-originated content (needs the `users.locale` decision)

- Add an idempotent `users.locale` column in `lib/db/init-db.ts` (`PRAGMA table_info` check before `ALTER`). Read the `add-db-migration` skill first.
- Set it at register and login from the request locale. Update `docs/api-contract-v1.md` if request or response shapes change.
- Localize the emails in `emailService.ts` and the push text in `pushService.ts`.
- Prefix locale in the reset link and in the push URL (`/{locale}/dashboard/groups/:id`).
- Make `public/sw.js` rely on the payload URL, with a locale-safe fallback.

### Step 8: Language switcher and metadata

- Language switcher that sets the `NEXT_LOCALE` cookie and, when logged in, saves to the user's profile.
- Localized `<title>`, description and `app/manifest.ts`.
- `hreflang` alternates for public pages.

### Step 9: Hardening and docs

- Redirect old unprefixed URLs and bookmarks to the negotiated locale.
- Manual and integration tests: login to dashboard with and without a cookie, invite links, password reset email links.
- Update `docs/frontend-architecture.md` and the `add-ui-feature` skill with a "no hardcoded user-facing strings" rule and the adding-a-locale checklist.
- Final `npm run verify`.

## Consequences

- **Positive:** shareable, SEO-friendly localized URLs, a single negotiation point, translated emails and push, and a clear path to add languages.
- **Negative:** large mechanical diff (route move, about 31 navigation changes, all strings), a new dependency, a schema change, and every future string must go through the message files.
- **Risks:** auth redirects and `?next=` handling in `proxy.ts`, old links, and keeping message files in sync across locales (mitigated by the key-parity check in Step 3).

## Alternatives considered

- **Hide the default locale** (`/login` for `en`): prettier URLs, but ambiguous links in emails and push and more proxy rewrite logic.
- **Cookie/header-only detection, no URL prefix:** the simplest routing, but no shareable localized URLs and worse SEO.
- **Hand-rolled i18n:** no dependency, but we would rebuild routing helpers, plural/ICU formatting and type safety.
