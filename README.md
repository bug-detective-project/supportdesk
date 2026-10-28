# SupportDesk

A small customer support app: a ticket list with search, and a ticket details screen where agents change status, priority and assignee.

- **client/**: React + TypeScript + Vite (port 5173)
- **server/**: Node.js + Express + TypeScript + SQLite via `better-sqlite3` (port 3001)

## Requirements

- Node.js 26 (see `.nvmrc`), or
- VS Code with the Dev Containers extension: choose **Reopen in Container** and everything is installed for you.

## Setup

```sh
npm install
npm run db:reset
npm run dev
```

Open http://localhost:5173. The client proxies `/api` to the server.

## Scripts

Run from the repository root:

| Script             | What it does                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `npm install`      | Installs both workspaces.                                                                                        |
| `npm run dev`      | Starts the server and the client together.                                                                       |
| `npm test`         | Runs all project tests (Vitest, server and client).                                                              |
| `npm run db:reset` | Recreates the database from the seed data.                                                                       |
| `npm run build`    | Type-checks and builds the client and the server.                                                                |
| `npm run lint`     | Checks the code with ESLint (`npm run lint:fix` fixes what it can).                                              |
| `npm run format`   | Formats the non-TypeScript files (JSON, CSS, Markdown, HTML) with Prettier (`npm run format:check` only checks). |

## Lint and formatting

- **ESLint** (`eslint.config.js`) checks and formats the TypeScript and JavaScript files: the recommended rules of ESLint and typescript-eslint, the React rules (`@eslint-react`, `react-hooks`, `react-refresh`) and the code style (`@stylistic`: two spaces, single quotes, trailing commas). Semicolons are not checked.
- **Prettier** (`.prettierrc.json`) formats every other file. `.prettierignore` leaves the TypeScript and JavaScript files to ESLint.
- **VS Code** formats on save (`.vscode/settings.json`): ESLint fixes TS/JS files, Prettier formats the rest. Install the recommended extensions when VS Code asks (ESLint and Prettier); the dev container installs them for you.

## Configuration

| Variable        | Default                      | Used by                            |
| --------------- | ---------------------------- | ---------------------------------- |
| `PORT`          | `3001`                       | server                             |
| `DATABASE_PATH` | `server/data/supportdesk.db` | server, `db:reset`                 |
| `CLIENT_PORT`   | `5173`                       | client (`vite` and `vite preview`) |
| `API_URL`       | `http://localhost:3001`      | client proxy target for `/api`     |

The database is created and seeded automatically the first time the server starts.

## API

| Method | Route                  | Notes                                                                                     |
| ------ | ---------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/api/tickets?search=` | Tickets ordered by id. `search` filters by title (case-insensitive, partial).             |
| GET    | `/api/tickets/:id`     | One ticket, or 404.                                                                       |
| PATCH  | `/api/tickets/:id`     | Any of `status`, `priority`, `assigneeId` (`null` unassigns). Unknown fields are ignored. |
| GET    | `/api/employees`       | All employees, including `active`.                                                        |

Tickets include their `assignee` (`{ id, name, email, active }`, or `null` when unassigned).

## Team conventions

- **Do not remove or rename `data-testid` attributes.** Other teams' automated checks rely on them.
- **Do not change API routes or response shapes.**
- **Do not change the seed data.**
- Keep `npm test` and `npm run lint` green, and add a test when you fix a bug.

Stable `data-testid` attributes:

| Screen                    | `data-testid`                                                          |
| ------------------------- | ---------------------------------------------------------------------- |
| Ticket list               | `ticket-list`, `search-input`, `ticket-row-<id>`                       |
| Ticket details            | `ticket-details`, `ticket-id`, `ticket-title`, `ticket-description`    |
| Ticket details controls   | `status-select`, `priority-select`, `assignee-select`, `assignee-name` |
| Ticket details navigation | `prev-button`, `next-button`, `back-link`                              |
| Feedback messages         | `feedback-success`, `feedback-error`                                   |
