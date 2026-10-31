## API Contract (v1)

This document freezes the current backend contract for frontend integration.

The generated route and request-schema inventory at the end of this document
is derived from route handlers and their Zod schemas. Run `npm run api:contract`
after changing either; `npm run verify` fails if the generated section is stale.

### 1. Shared Conventions

Success envelope:

```json
{
  "success": true,
  "data": {}
}
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message"
  }
}
```

Typical error statuses:

- `400` invalid request shape or business input
- `401` unauthenticated
- `403` authenticated but not allowed
- `404` resource does not exist
- `409` business conflict

JSON request bodies and query strings are validated at the route boundary with
Zod schemas in `lib/api/request-validation.ts`. Invalid JSON or values that do
not match the endpoint's schema return HTTP `400` with code `INVALID_INPUT` in
the standard error envelope. Service-level validation remains responsible for
permissions and domain rules.

### 2. Authentication

`POST /api/auth/register`

Request:

```json
{
  "name": "Ana",
  "email": "ana@example.com",
  "password": "secret123"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "Ana",
    "email": "ana@example.com"
  }
}
```

`POST /api/auth/login`

Request:

```json
{
  "email": "ana@example.com",
  "password": "secret123"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "Ana",
    "email": "ana@example.com"
  }
}
```

Cookie side effect:

- sets HTTP-only cookie `token`
- `sameSite: "lax"`
- `path: "/"`
- `maxAge: 7 days`
- `secure: true` in production

`POST /api/auth/logout`

Response `200`:

```json
{
  "success": true,
  "data": {
    "loggedOut": true
  }
}
```

Cookie side effect:

- clears the `token` cookie immediately

`POST /api/auth/forgot-password`

Request:

```json
{
  "email": "ana@example.com"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "sent": true
  }
}
```

`POST /api/auth/reset-password`

Request:

```json
{
  "token": "password-reset-token",
  "password": "newSecret123"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "reset": true
  }
}
```

### 3. Current User

`GET /api/me`

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "Ana",
    "email": "ana@example.com"
  }
}
```

`PATCH /api/me`

Request:

```json
{
  "email": "ana-new@example.com",
  "name": "Ana New",
  "password": "currentPassword"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "Ana New",
    "email": "ana-new@example.com"
  }
}
```

Notes:

- `password` is required by the current implementation to authorize profile updates
- at least one of `email` or `name` must be provided

`DELETE /api/me`

Response `200`:

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

### 4. Groups

`POST /api/groups`

Request:

```json
{
  "name": "Trip to Lisbon",
  "description": "Weekend with friends"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "group-id",
    "name": "Trip to Lisbon",
    "description": "Weekend with friends",
    "createdAt": "2026-07-25T10:00:00.000Z",
    "updatedAt": "2026-07-25T10:00:00.000Z",
    "createdBy": "user-id"
  }
}
```

`GET /api/groups`

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "group-id",
      "name": "Trip to Lisbon",
      "description": "Weekend with friends",
      "createdAt": "2026-07-25T10:00:00.000Z",
      "updatedAt": "2026-07-25T10:00:00.000Z",
      "createdBy": "user-id"
    }
  ]
}
```

`DELETE /api/groups`

Request:

```json
{
  "groupId": "group-id"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

### 5. Participants

`GET /api/groups/[groupId]/participants`

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "participant-id",
      "groupId": "group-id",
      "displayName": "Ana",
      "userId": "user-id",
      "role": "owner",
      "status": "active",
      "joinedAt": "2026-07-25T10:00:00.000Z",
      "createdAt": "2026-07-25T10:00:00.000Z",
      "updatedAt": "2026-07-25T10:00:00.000Z"
    }
  ]
}
```

`POST /api/groups/[groupId]/participants`

Request:

```json
{
  "displayName": "Carlos",
  "userId": "optional-user-id",
  "role": "member",
  "status": "active"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "participant-id",
    "groupId": "group-id",
    "displayName": "Carlos",
    "userId": "optional-user-id",
    "role": "member",
    "status": "active",
    "joinedAt": "2026-07-25T10:00:00.000Z",
    "createdAt": "2026-07-25T10:00:00.000Z",
    "updatedAt": "2026-07-25T10:00:00.000Z"
  }
}
```

`PATCH /api/groups/[groupId]/participants/[participantId]`

Request (all fields optional):

```json
{
  "displayName": "Carlos Updated",
  "role": "viewer",
  "status": "left"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

`DELETE /api/groups/[groupId]/participants/[participantId]`

Response `200`:

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

### 6. Expenses

`POST /api/groups/[groupId]/expenses`

Request:

```json
{
  "title": "Dinner",
  "description": "Optional text",
  "category": "food",
  "amount": 1235,
  "currency": "EUR",
  "paidByParticipantId": "participant-id-that-paid",
  "split": {
    "mode": "equal"
  }
}
```

`split.mode` accepted values:

- `equal`
- `selected` with `participantIds: string[]`
- `percentage` with `shares: [{ participantId, percentage }]` summing to `100`

All split modes can include any participant in the group, regardless of
participant status. Equal splits include every group participant; the payer's
share is implicit and is not included in the persisted debt rows.

Response `201`:

```json
{
  "success": true,
  "data": {
    "expense": {
      "id": "expense-id",
      "title": "Dinner",
      "description": "Optional text",
      "category": "food",
      "amount": 1235,
      "currency": "EUR",
      "groupId": "group-id",
      "createdAt": "2026-07-25T10:00:00.000Z",
      "updatedAt": "2026-07-25T10:00:00.000Z",
      "paidByParticipantId": "participant-id-that-paid",
      "createdByParticipantId": "participant-id-that-created"
    },
    "splits": [
      {
        "id": "split-id",
        "expenseId": "expense-id",
        "participantId": "participant-id-that-owes",
        "amount": 412,
        "owedToParticipantId": "participant-id-that-paid",
        "createdAt": "2026-07-25T10:00:00.000Z",
        "updatedAt": "2026-07-25T10:00:00.000Z"
      }
    ]
  }
}
```

`GET /api/groups/[groupId]/expenses`

Cursor-paginated. Query params (all optional):

- `limit` — page size, integer 1-100, default 20
- `cursor` — opaque string from the previous page's `nextCursor`
- `category` — one of the expense categories (e.g. `food`)
- `dateFrom` / `dateTo` — ISO date strings, inclusive bounds on `createdAt`
- `minAmountCents` / `maxAmountCents` — integer bounds on `amount`

Response `200`:

```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "expense-id",
        "title": "Dinner",
        "description": "Optional text",
        "category": "food",
        "amount": 1235,
        "currency": "EUR",
        "groupId": "group-id",
        "createdAt": "2026-07-25T10:00:00.000Z",
        "updatedAt": "2026-07-25T10:00:00.000Z",
        "paidByParticipantId": "participant-id-that-paid",
        "createdByParticipantId": "participant-id-that-created"
      }
    ],
    "nextCursor": "b3Blbmm...or null when this is the last page"
  }
}
```

`GET /api/groups/[groupId]/expenses/[expenseId]`

Response `200`:

```json
{
  "success": true,
  "data": {
    "expense": {
      "id": "expense-id",
      "title": "Dinner",
      "description": "Optional text",
      "category": "food",
      "amount": 1235,
      "currency": "EUR",
      "groupId": "group-id",
      "createdAt": "2026-07-25T10:00:00.000Z",
      "updatedAt": "2026-07-25T10:00:00.000Z",
      "paidByParticipantId": "participant-id-that-paid",
      "createdByParticipantId": "participant-id-that-created"
    },
    "splits": []
  }
}
```

`PATCH /api/groups/[groupId]/expenses/[expenseId]`

Request supports partial updates:

```json
{
  "title": "Dinner Updated",
  "category": "restaurant"
}
```

If `amount` or `paidByParticipantId` changes, `split` is required:

```json
{
  "amount": 2000,
  "split": {
    "mode": "equal"
  }
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "expense": {
      "id": "expense-id"
    },
    "splits": []
  }
}
```

`DELETE /api/groups/[groupId]/expenses/[expenseId]`

Response `200`:

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

### 6.1 Payments (settlements)

`POST /api/groups/[groupId]/payments`

Records that one participant paid another to settle a debt. Payments are not expenses: they don't appear in category stats or "total spent", they only offset balances. `amountCents` is trusted as sent by the client (typically the exact amount from a suggested settlement) — the server only validates it's a positive integer and that both participants belong to the group.

Request:

```json
{
  "fromParticipantId": "participant-id-that-paid",
  "toParticipantId": "participant-id-that-received",
  "amountCents": 1000,
  "currency": "EUR"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "payment-id",
    "groupId": "group-id",
    "fromParticipantId": "participant-id-that-paid",
    "toParticipantId": "participant-id-that-received",
    "amount": 1000,
    "currency": "EUR",
    "createdByParticipantId": "participant-id-of-current-user",
    "createdAt": "2026-07-25T10:00:00.000Z"
  }
}
```

`GET /api/groups/[groupId]/payments`

Cursor-paginated payment history. Query params (all optional):

- `currency` — filter to a single currency
- `limit` — page size, integer 1-50, default 5
- `cursor` — opaque string from the previous page's `nextCursor`

Response `200`:

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "payment-id",
        "groupId": "group-id",
        "fromParticipantId": "participant-id-that-paid",
        "toParticipantId": "participant-id-that-received",
        "amount": 1000,
        "currency": "EUR",
        "createdByParticipantId": "participant-id-of-current-user",
        "createdAt": "2026-07-25T10:00:00.000Z"
      }
    ],
    "nextCursor": "b3Blbmm...or null when this is the last page"
  }
}
```

`DELETE /api/groups/[groupId]/payments/[paymentId]`

Undoes a settlement payment (any group member can undo any payment). Response `200`:

```json
{
  "success": true,
  "data": { "deleted": true }
}
```

### 7. Balances

`GET /api/groups/[groupId]/balances`

Response `200`:

```json
{
  "success": true,
  "data": {
    "groupId": "group-id",
    "calculatedAt": "2026-07-25T10:00:00.000Z",
    "myParticipantId": "participant-id-of-current-user",
    "participants": [
      {
        "id": "participant-id",
        "displayName": "Ana",
        "userId": "user-id-or-null",
        "role": "owner",
        "status": "active"
      }
    ],
    "currencies": [
      {
        "currency": "EUR",
        "totals": {
          "totalSpentCents": 1235,
          "totalLentCents": 823,
          "totalBorrowedCents": 823
        },
        "participantBalances": [
          {
            "participantId": "participant-id",
            "totalSpentCents": 0,
            "totalLentCents": 0,
            "totalBorrowedCents": 412,
            "netBalanceCents": -412,
            "position": "debtor"
          }
        ],
        "settlements": [
          {
            "fromParticipantId": "participant-id-debtor",
            "toParticipantId": "participant-id-creditor",
            "amountCents": 412
          }
        ],
        "meta": {
          "algorithm": "min-transfers-greedy-v1",
          "minimalTransfersCount": 1
        }
      }
    ]
  }
}
```

### 7.1 Category stats

`GET /api/groups/[groupId]/stats/categories`

Query params:

- `currency` — required, e.g. `EUR`
- `dateFrom` / `dateTo` — optional ISO date strings, inclusive bounds; omit both for all-time

Response `200`:

```json
{
  "success": true,
  "data": {
    "currency": "EUR",
    "periodStart": "2026-07-01T00:00:00.000Z",
    "periodEnd": null,
    "totalSpentCents": 5000,
    "categories": [
      {
        "category": "groceries",
        "totalCents": 3000,
        "expenseCount": 4,
        "percentageOfTotal": 60
      }
    ],
    "topCategory": {
      "category": "groceries",
      "totalCents": 3000,
      "expenseCount": 4,
      "percentageOfTotal": 60
    }
  }
}
```

### 8. Invites

`POST /api/groups/[groupId]/invites`

Request (optional email lock):

```json
{
  "email": "friend@example.com"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "invite-id",
    "groupId": "group-id",
    "token": "invite-token",
    "email": "friend@example.com",
    "status": "pending",
    "expiresAt": "2026-07-25T10:00:00.000Z",
    "createdBy": "user-id",
    "createdAt": "2026-07-25T10:00:00.000Z",
    "updatedAt": "2026-07-25T10:00:00.000Z"
  }
}
```

`GET /api/invites/[token]`

Response `200`:

```json
{
  "success": true,
  "data": {
    "invite": {
      "id": "invite-id",
      "groupId": "group-id",
      "token": "invite-token",
      "email": "friend@example.com",
      "status": "pending",
      "expiresAt": "2026-07-25T10:00:00.000Z",
      "createdBy": "user-id",
      "createdAt": "2026-07-25T10:00:00.000Z",
      "updatedAt": "2026-07-25T10:00:00.000Z"
    },
    "group": {
      "id": "group-id",
      "name": "Trip to Lisbon",
      "description": "Weekend with friends"
    },
    "claimableParticipants": [
      {
        "id": "participant-id",
        "displayName": "Ana",
        "role": "member",
        "status": "active"
      }
    ]
  }
}
```

`POST /api/invites/[token]`

Request option A (claim existing participant):

```json
{
  "participantId": "participant-id"
}
```

Request option B (create participant while accepting):

```json
{
  "displayName": "Carlos"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "accepted": true
  }
}
```

Notes:

- the invite is reusable until expiration unless it is marked revoked/expired
- if `email` is set, the signed-in user must match that email
- `participantId` and `displayName` are mutually exclusive; one of them is required
- when a participant is claimed, it is set active and linked to the user when needed

<!-- API-CONTRACT-GENERATED:START -->
## Generated route and request-schema inventory

Generated from `app/api/**/route.ts` handlers and the Zod schemas they use.
Run `npm run api:contract` after changing routes or request schemas;
`npm run api:contract:check` verifies this section and runs as part of
`npm run verify`. Response examples and endpoint behavior remain documented
manually above. Zod refinements may enforce additional runtime rules not
expressible in JSON Schema.

| Method | Route | JSON body schema | Query schema |
| --- | --- | --- | --- |
| POST | `/api/auth/forgot-password` | `forgotPasswordBodySchema` | — |
| POST | `/api/auth/login` | `loginBodySchema` | — |
| POST | `/api/auth/logout` | — | — |
| POST | `/api/auth/register` | `registerBodySchema` | — |
| POST | `/api/auth/reset-password` | `resetPasswordBodySchema` | — |
| DELETE | `/api/groups` | `leaveGroupBodySchema` | — |
| GET | `/api/groups` | — | — |
| POST | `/api/groups` | `createGroupBodySchema` | — |
| PATCH | `/api/groups/[groupId]` | `updateGroupBodySchema` | — |
| GET | `/api/groups/[groupId]/balances` | — | — |
| GET | `/api/groups/[groupId]/expenses` | — | `expenseListQuerySchema` |
| POST | `/api/groups/[groupId]/expenses` | `createExpenseBodySchema` | — |
| DELETE | `/api/groups/[groupId]/expenses/[expenseId]` | — | — |
| GET | `/api/groups/[groupId]/expenses/[expenseId]` | — | — |
| PATCH | `/api/groups/[groupId]/expenses/[expenseId]` | `updateExpenseBodySchema` | — |
| POST | `/api/groups/[groupId]/invites` | `createInviteBodySchema` | — |
| GET | `/api/groups/[groupId]/participants` | — | — |
| POST | `/api/groups/[groupId]/participants` | `addParticipantBodySchema` | — |
| DELETE | `/api/groups/[groupId]/participants/[participantId]` | — | — |
| PATCH | `/api/groups/[groupId]/participants/[participantId]` | `updateParticipantBodySchema` | — |
| GET | `/api/groups/[groupId]/payments` | — | `paymentListQuerySchema` |
| POST | `/api/groups/[groupId]/payments` | `createPaymentBodySchema` | — |
| DELETE | `/api/groups/[groupId]/payments/[paymentId]` | — | — |
| GET | `/api/groups/[groupId]/stats/categories` | — | `categoryStatsQuerySchema` |
| GET | `/api/invites/[token]` | — | — |
| POST | `/api/invites/[token]` | `acceptInviteBodySchema` | — |
| DELETE | `/api/me` | — | — |
| GET | `/api/me` | — | — |
| PATCH | `/api/me` | `updateUserBodySchema` | — |
| DELETE | `/api/me/push-subscription` | `deletePushSubscriptionBodySchema` | — |
| POST | `/api/me/push-subscription` | `pushSubscriptionBodySchema` | — |

<details>
<summary><code>acceptInviteBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "participantId": {
      "type": "string",
      "minLength": 1
    },
    "displayName": {
      "type": "string",
      "minLength": 1
    }
  },
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>addParticipantBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "displayName": {
      "type": "string",
      "minLength": 1
    },
    "userId": {
      "type": "string",
      "minLength": 1
    },
    "role": {
      "type": "string",
      "enum": [
        "owner",
        "admin",
        "member",
        "viewer"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "active",
        "invited",
        "left"
      ]
    }
  },
  "required": [
    "displayName"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>categoryStatsQuerySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "currency": {
      "type": "string",
      "minLength": 1
    },
    "dateFrom": {
      "type": "string"
    },
    "dateTo": {
      "type": "string"
    }
  },
  "required": [
    "currency"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>createExpenseBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "minLength": 1
    },
    "amount": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "currency": {
      "type": "string",
      "minLength": 1
    },
    "paidByParticipantId": {
      "type": "string",
      "minLength": 1
    },
    "split": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "const": "equal"
            }
          },
          "required": [
            "mode"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "const": "selected"
            },
            "participantIds": {
              "type": "array",
              "items": {
                "type": "string",
                "minLength": 1
              }
            }
          },
          "required": [
            "mode",
            "participantIds"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "const": "percentage"
            },
            "shares": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "participantId": {
                    "type": "string",
                    "minLength": 1
                  },
                  "percentage": {
                    "type": "number"
                  }
                },
                "required": [
                  "participantId",
                  "percentage"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "mode",
            "shares"
          ],
          "additionalProperties": false
        }
      ]
    }
  },
  "required": [
    "title",
    "category",
    "amount",
    "currency",
    "paidByParticipantId",
    "split"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>createGroupBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>createInviteBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
    }
  },
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>createPaymentBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "fromParticipantId": {
      "type": "string",
      "minLength": 1
    },
    "toParticipantId": {
      "type": "string",
      "minLength": 1
    },
    "amountCents": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "currency": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "fromParticipantId",
    "toParticipantId",
    "amountCents",
    "currency"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>deletePushSubscriptionBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "endpoint": {
      "type": "string",
      "format": "uri"
    }
  },
  "required": [
    "endpoint"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>expenseListQuerySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "cursor": {
      "type": "string"
    },
    "category": {
      "type": "string"
    },
    "dateFrom": {
      "type": "string"
    },
    "dateTo": {
      "type": "string"
    },
    "minAmountCents": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "maxAmountCents": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "search": {
      "type": "string"
    }
  },
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>forgotPasswordBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
    }
  },
  "required": [
    "email"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>leaveGroupBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "groupId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "groupId"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>loginBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
    },
    "password": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "email",
    "password"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>paymentListQuerySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "currency": {
      "type": "string"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50
    },
    "cursor": {
      "type": "string"
    }
  },
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>pushSubscriptionBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "endpoint": {
      "type": "string",
      "format": "uri"
    },
    "keys": {
      "type": "object",
      "properties": {
        "p256dh": {
          "type": "string",
          "minLength": 1
        },
        "auth": {
          "type": "string",
          "minLength": 1
        }
      },
      "required": [
        "p256dh",
        "auth"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "endpoint",
    "keys"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>registerBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "email": {
      "type": "string",
      "format": "email",
      "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
    },
    "password": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "name",
    "email",
    "password"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>resetPasswordBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "token": {
      "type": "string",
      "minLength": 1
    },
    "password": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "token",
    "password"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>updateExpenseBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": "string"
    },
    "amount": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "currency": {
      "type": "string",
      "minLength": 1
    },
    "paidByParticipantId": {
      "type": "string",
      "minLength": 1
    },
    "category": {
      "type": "string",
      "minLength": 1
    },
    "split": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "const": "equal"
            }
          },
          "required": [
            "mode"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "const": "selected"
            },
            "participantIds": {
              "type": "array",
              "items": {
                "type": "string",
                "minLength": 1
              }
            }
          },
          "required": [
            "mode",
            "participantIds"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "const": "percentage"
            },
            "shares": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "participantId": {
                    "type": "string",
                    "minLength": 1
                  },
                  "percentage": {
                    "type": "number"
                  }
                },
                "required": [
                  "participantId",
                  "percentage"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "mode",
            "shares"
          ],
          "additionalProperties": false
        }
      ]
    }
  },
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>updateGroupBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>updateParticipantBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "displayName": {
      "type": "string",
      "minLength": 1
    },
    "role": {
      "type": "string",
      "enum": [
        "owner",
        "admin",
        "member",
        "viewer"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "active",
        "invited",
        "left"
      ]
    }
  },
  "additionalProperties": false
}
```

</details>
<details>
<summary><code>updateUserBodySchema</code></summary>

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "password": {
      "type": "string"
    }
  },
  "additionalProperties": false
}
```

</details>
<!-- API-CONTRACT-GENERATED:END -->
