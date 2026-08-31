## API Contract (v1)

This document freezes the current backend contract for frontend integration.

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

- `401` unauthenticated
- `403` authenticated but not allowed
- `404` resource does not exist
- `409` business conflict

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
