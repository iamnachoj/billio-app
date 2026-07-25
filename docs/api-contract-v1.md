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

### 2. Groups

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

### 3. Participants

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

### 4. Expenses

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

Response `200`:

```json
{
  "success": true,
  "data": [
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
  ]
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

### 5. Balances

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

### 6. Invites

`POST /api/groups/[groupId]/invites`

Request (optional email lock):

```json
{
  "email": "friend@example.com"
}
```

`GET /api/invites/[token]`

Response `200`:

```json
{
  "success": true,
  "data": {
    "token": "invite-token",
    "groupId": "group-id"
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
