# Billio Project Guide

This guide covers the project's structure and core concepts. For details that
change with implementation, use the linked documents as the source of truth.

## Architecture

Billio uses a layered Next.js App Router application:

```text
Browser
  -> app/ page and components/
  -> frontend-services/ HTTP wrappers
  -> app/api/ route handlers
  -> lib/services/ business logic
  -> lib/repositories/ database access
  -> lib/db/
```

- Route handlers receive HTTP requests, authenticate users, call services, and
  return the standard API response envelope. They should not contain SQL or
  business rules.
- Services implement business rules and coordinate repositories.
- Repositories own SQL and database access.
- Models in `lib/models/` describe domain objects; `lib/mappers/` adapt database
  rows to application shapes.
- Components are grouped by feature in `components/`. UI primitives live in
  `components/ui/`.
- Frontend API calls are wrapped in `frontend-services/`, keeping HTTP details
  out of rendering components.

See [Frontend Architecture](./frontend-architecture.md) for UI and layering
conventions and [AGENTS.md](../AGENTS.md) for repository-specific instructions.

## Domain concepts

An authenticated **user** is an account. A **group participant** is a person in
a group and may exist without a linked account. Expenses and their splits
reference participants, not only registered users. This allows a group to
record expenses for guests before they sign up.

Participants have a role (`owner`, `admin`, `member`, or `viewer`) and a status
(`active`, `invited`, or `left`). A viewer is read-only. Leaving a group keeps
the participant record so historical expenses preserve the original identity.

Groups may contain multiple currencies. Billio calculates totals and balances
separately for each currency; it does not convert between currencies. See
[Domain Model and Money Rules](./domain.md) for how expense splits, payments,
rounding and settlement suggestions work.

## API

The route handlers live under `app/api/`. The versioned contract, including
request and response examples, is in [API Contract v1](./api-contract-v1.md).
Update that document whenever an endpoint's path, request, response, or error
codes change.

### Request validation with Zod

[Zod](https://zod.dev/) is a TypeScript-friendly runtime validation library.
TypeScript checks code while building; Zod checks untrusted HTTP data at
runtime. Billio defines request-body and query-string schemas in
`lib/api/request-validation.ts`. Route handlers pass incoming data through
`readJsonBody` or `readSearchParams` before calling a service. A successful
parse returns typed, schema-approved data; a failure returns the standard
`INVALID_INPUT` API error with a useful field-level message. Keep business
rules in services: route schemas validate input shape and basic types, while
services validate permissions and domain constraints.

## Invites and temporary records

Group owners and admins can create invite links. An invite can optionally be
tied to an email. A logged-in recipient can accept by claiming an existing
participant or creating a new participant. Invites are reusable until
expiration by default. A participant already linked to another user cannot be
claimed.

Password reset tokens are deleted after use; stale reset and invite records are
cleaned opportunistically by their respective flows.

## Development and contribution

Use the scripts in `package.json` for local development and checks. Integration
tests run against a separate local database; read
[Integration Testing](./integration-testing.md) before running them or changing
database setup. Run `npm run verify` before considering a code change complete.

For code placement and project-specific conventions, read [AGENTS.md](../AGENTS.md).
