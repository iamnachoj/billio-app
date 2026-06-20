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
src/
├── app/
│   ├── api/
│   ├── dashboard/
│   ├── login/
│   └── register/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── db/
│   └── repositories/
│
├── models/
│
└── components/
```

## Configuration Files

- `eslint.config.mjs` – Configuration for ESLint code quality and linting rules.
- `next.config.ts` – Next.js framework configuration.
- `postcss.config.mjs` – Configuration for PostCSS CSS processing.
- `tsconfig.json` – TypeScript compiler configuration and project settings.
- `.prettierrc` – Configuration for Prettier code formatting rules.
- `package.json` – Project metadata, scripts, and dependencies.
- `package-lock.json` – Locks dependency versions to ensure consistent installations.
- `.gitignore` – Defines which files and folders Git should ignore.

## Architectural Principles

The application follows a layered architecture.

### 1. Routes (API Layer)

Located under:

```text
src/app/api
```

Route handlers are responsible for:

- Receiving HTTP requests
- Validating incoming data
- Calling the appropriate business or repository functions
- Returning HTTP responses

Example:

```text
POST /api/auth/register
```

The route do not contain SQL queries or complex database logic.

Its responsibility is to orchestrate the request flow.

### 2. Repositories (Data Access Layer)

Located under:

```text
src/lib/repositories
```

Repositories encapsulate all database access.

Example:

```ts
findByEmail(email);
createUser(user);
findById(id);
```

Instead of writing SQL inside route handlers, routes call repository functions.

For example:

```text
Route Handler
    ↓
User Repository
    ↓
Database
```

### 3. Database Layer

Located under:

```text
src/lib/db
```

This layer is responsible for database connectivity.

Example:

```ts
export const db = createClient(...)
```

The application currently uses:

- libSQL client
- Local SQLite-compatible database during development
- Turso for production

The database layer only deals with establishing and managing connections.

### 4. Models

Located under:

```text
lib/models
```

Models define the shape of the application's domain entities.

Models act as contracts between different layers of the application.

They do not contain database queries or business logic.

### 5. API Utilities

Located under:

```text
src/lib/api
```

Contains reusable helpers related to HTTP communication.

Example:

```ts
successResponse(...)
errorResponse(...)
```

Purpose:

- Standardize API responses
- Avoid duplicated response logic
- Provide consistent error handling

Example success response:

```json
{
  "success": true,
  "data": {}
}
```

Example error response:

```json
{
  "success": false,
  "code": "EMAIL_IN_USE",
  "message": "Email already in use"
}
```

### 6. Authentication

Located under:

```text
src/lib/auth
```

Contains authentication-related utilities.

Examples:

```ts
generateToken();
verifyToken();
```

Responsibilities:

- JWT generation
- JWT validation
- Session management
- Authentication helpers

## Request Flow Example

User registration follows the following flow:

```text
Client
  ↓
POST /api/auth/register
  ↓
Validation
  ↓
User Repository
  ↓
Database
  ↓
Success/Error Response
  ↓
Client
```

Each layer has a single responsibility:

- Routes handle HTTP
- Repositories handle data access
- Models define data structures
- Auth handles authentication
- Database handles connectivity

This separation keeps the codebase scalable and easier to maintain as the project grows.

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
