## Welcome to Billio App

Billio is a web application designed to help groups of people track shared expenses and settle balances in a simple and transparent way.

Typical use cases include:

- Trips with friends
- Flatmates sharing household expenses
- Group events
- Any situation where multiple people contribute money and need to keep track of who owes whom

The project is built with Next.js, TypeScript and libSQL, following a simple and maintainable architecture that separates business logic, database access and API concerns.

## Project Structure

```text
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts
│   │   ├── forgot-password/
│   │   │   └── route.ts
│   │   ├── reset-password/
│   │   │   └── route.ts
│   │   └── register/
│   │       └── route.ts
│   ├── groups/
│   │   ├── [groupId]/
│   │   │   └── participants/
│   │   │       ├── [participantId]/
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   └── route.ts
│   └── me/
│       └── route.ts
├── globals.css
├── layout.tsx
└── page.tsx

lib/
├── api/
│   └── response.ts
├── db/
│   ├── db.ts
│   └── init-db.ts
├── mappers/
│   └── userMapper.ts
├── models/
│   ├── expense.ts
│   ├── expenseSplit.ts
│   ├── group.ts
│   ├── groupParticipant.ts
│   └── user.ts
├── repositories/
│   └── userRepository.ts
├── services/
│   ├── authService.ts
│   └── authService.test.ts
└── utils/
    └── jwt.ts
```

## Configuration Files

- `eslint.config.mjs` – ESLint configuration.
- `next.config.ts` – Next.js framework configuration.
- `postcss.config.mjs` – PostCSS CSS processing configuration.
- `tsconfig.json` – TypeScript compiler configuration and project aliases.
- `package.json` – Project metadata, scripts, and dependencies.
- `next-env.d.ts` – Next.js TypeScript environment definitions.

## Architectural Principles

The application follows a layered architecture that keeps the codebase easy to reason about and extend.

### 1. API Routes

Located under:

```text
app/api
```

Route handlers are responsible for:

- receiving HTTP requests
- extracting request data
- calling the appropriate service
- returning a consistent HTTP response

They are intentionally thin and do not contain database queries or business rules.

Example:

```text
POST /api/auth/register
```

### 2. Services

Located under:

```text
lib/services
```

Services contain the application’s business logic.

Examples include:

- validating registration and login input
- checking whether a user already exists
- hashing and comparing passwords
- creating or verifying JWTs

This is where the main behavior of the app lives.

### 3. Repositories

Located under:

```text
lib/repositories
```

Repositories encapsulate data access and persistence logic.

They are responsible for operations such as:

- finding a user by email
- finding a user by ID
- creating a new user

They keep database-specific code out of the services and routes.

## API Endpoints

The current API surface is split by feature and keeps each handler thin.

### Authentication

- `POST /api/auth/register` - create a new account
- `POST /api/auth/login` - authenticate and receive a token
- `POST /api/auth/forgot-password` - request a password reset email
- `POST /api/auth/reset-password` - complete the password reset flow

### Current User

- `GET /api/me` - fetch the authenticated user
- `DELETE /api/me` - delete the authenticated user account

### Groups

- `POST /api/groups` - create a group
- `GET /api/groups` - list the current user’s groups
- `DELETE /api/groups` - leave a group

### Participants

- `GET /api/groups/[groupId]/participants` - list participants in a group
- `POST /api/groups` - add a participant to an existing group when the body includes `groupId` and `displayName`
- `DELETE /api/groups/[groupId]/participants/[participantId]` - delete a participant when allowed by role and expense rules

## Group Roles

The group model uses participants rather than only registered users, which makes it possible to represent people before they create an account.

- `owner` - full control of the group, including ownership and administration decisions
- `admin` - can manage participants and group membership, but is still below the owner
- `member` - a normal contributor who can participate in the group
- `viewer` - read-only access for people who should not mutate group data

In practice, the current rules are:

- only `owner` and `admin` users can add or delete participants
- `admin` and `owner` participants themselves cannot be deleted
- participants linked to expense records cannot be deleted
- placeholder participants without a linked `userId` can exist temporarily, but they do not keep an empty group alive once no real user remains

### 4. Models

Located under:

```text
lib/models
```

Models define the domain entities used by the application.

The most important distinction is between authentication users and group participants:

- `user` represents an authenticated account in the system
- `groupParticipant` represents a person inside a group, whether or not they have an account yet

That separation matters because a participant can exist before a user account exists, and expense data is now tied to participants instead of only to users.

The main models are:

- `user.ts` - the authenticated account
- `group.ts` - the group itself
- `groupParticipant.ts` - the person taking part in a group
- `expense.ts` - an expense attached to a group and linked to participants
- `expenseSplit.ts` - the participant-level breakdown of who owes what

Models act as contracts between layers and do not contain business rules.

### 5. Mappers

Located under:

```text
lib/mappers
```

Mappers translate raw database rows into the app’s domain models.

This is useful because database rows may use different naming or shapes than the TypeScript models used in the app.

Example responsibilities:

- convert database columns to camelCase properties
- shape row data into a model expected by the rest of the app

### 6. Utilities

Located under:

```text
lib/utils
```

Utilities contain shared helper functions that support multiple layers of the app.

In this project, that includes:

- JWT helpers for token generation and verification

### 7. API Response Helpers

Located under:

```text
lib/api
```

This layer provides reusable helpers for formatting API responses consistently.

It helps keep route handlers predictable and avoids duplicating response logic.

## Request Flow Example

A typical registration flow looks like this:

```text
Client
  ↓
POST /api/auth/register
  ↓
Route handler
  ↓
Auth service
  ↓
User repository
  ↓
Database
  ↓
Success or error response
  ↓
Client
```

A typical login flow is similar, but it also uses the JWT utility to create and return an authentication token.

This separation keeps responsibilities clear:

- routes handle HTTP
- services handle business rules
- repositories handle data access
- models define domain entities and the relationships between users, participants and expenses
- mappers adapt database data
- utilities provide shared helpers

## Getting Started

First, run the development server:

```bash
npm install
# then
npm run dev
```

## Working on a task

In order to contribute, there are certain steps that are to be taken:

- Checkout the board in trello: https://trello.com/b/iVXi9r68/billioapp
- Assign yourself a task, be sure to add your name and mark it as 'in progress'
- If any questions, add comments in the tasks
- Create a branch, name it feature/[number of the task] and once changes are done, send a Pull Request
- Make sure task follows the steps in the board as yo progress
