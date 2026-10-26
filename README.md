# SupportDesk QA suite (authoring only)

This folder validates player fixes for the four SupportDesk tickets. It lives only on `main` and is never part of a stage branch.

```
qa/
  run.ts                 the QA CLI
  messages.ts            report messages (en, pt)
  playwright.config.ts   Gate 2 config (Chromium, headless, 1 worker)
  support/               Gate 2 helpers and the progress reporters
  scripts/
    build-stages.sh      rebuilds the stage-1..4 branches from main
    verify-stages.sh     runs the verification matrix
  stages/stage-N/
    ticket.en.md, ticket.pt.md   the ticket as a Jira card; copied to the stage root as TICKET.en.md / TICKET.pt.md
    bug.patch            main -> stage N (the bug only)
    gate1/               the stage's project tests and test support files (mirrors repo paths)
    gate2/               hidden Playwright/API validation for the ticket
    reference.patch      stage N -> fixed, including the bug's regression test
    hints.en.json, hints.pt.json         3 progressive senior-dev hints ({ "hints": [string, string, string] })
    solution.en.md, solution.pt.md       the final solution, explaining reference.patch step by step
    review.en.md, review.pt.md           the senior-dev code review shown after QA passes
```

The desktop app's stage package is this folder without `bug.patch` (see `desktop/tools/build-stage-packages.ts`).

## Setup

```sh
cd qa
npm install   # also installs Playwright's Chromium
```

## Running QA on a player's workspace

```sh
cd qa
npm run qa -- --ticket <1-4> --workspace <path> [--lang en|pt] [--json out.json] [--timeout 180] [--keep] [--verbose]
              [--package <dir>] [--deps-cache <dir>] [--deps-only]
```

1. **Isolate:** copies the workspace to a temp directory (without `node_modules`, `.git`, `dist`, `qa/` and `*.db` files) and runs `npm ci` there. The player's files, database and processes are never touched.
2. **Gate 1 (regression):** deletes every `*.test.*` / `*.spec.*` file in the copy, copies in `stages/stage-N/gate1/`, and runs Vitest.
3. **Gate 2 (ticket validation):** builds the client with `vite build`, creates a fresh database with `npm run db:reset`, starts the server and `vite preview` on free ports, and runs `stages/stage-N/gate2/` with Playwright. All processes are stopped afterward, even on failure.
4. **Timeout:** the whole run is limited to `--timeout` seconds (default 180). On timeout, everything is killed and unfinished tests are listed.

### Options for the desktop app and containers

| Option | What it does |
| --- | --- |
| `--package <dir>` | Reads the stage package (`gate1/`, `gate2/`) from any directory, for example a downloaded release asset mounted read-only. Default: `stages/stage-N/` in this folder. The workspace and the package are only read, never written. |
| `--deps-cache <dir>` | Reuses installed dependencies keyed by the SHA-256 of `package-lock.json`, the Node version and the platform, instead of running `npm ci`. After a fresh `npm ci`, the result is stored as `<key>.tar`. Lets QA run offline once the cache is warm. |
| `--deps-only` | With `--deps-cache`: copies the workspace, installs its dependencies into the cache and exits (exit code 0 on success). Used to download dependencies once, with the player's consent. |

Temporary Gate 2 folders (`.package-*/`) are created here while a run with `--package` is active and removed afterward.

The exit code is 0 only when both gates pass. `--json` writes `{ ticket, gate, status, message, tests: [{ name, status, error }], durationMs }`, where `status` is `passed`, `failed` or `timeout`, and `gate` is the gate that failed or timed out (2 when passed). `--keep` keeps the temp directory with logs for debugging.

## Authoring workflow

After changing the app on `main`:

1. Update `stages/stage-N/gate1/` if the project tests or test support files changed.
2. Regenerate `bug.patch` / `reference.patch` if they no longer apply.
3. Rebuild the stage branches and verify:

```sh
qa/scripts/build-stages.sh     # recreates stage-1..stage-4 as orphan commits
qa/scripts/verify-stages.sh    # expected: buggy (pass, fail), fixed (pass, pass)
```

Each stage is `main` + its `bug.patch` + its Jira card (`TICKET.en.md`, `TICKET.pt.md`), without `qa/`. Its project tests are exactly `gate1/`: the baseline tests plus the regression tests added by every earlier stage's `reference.patch`.

## Gate 2 rules

- Black-box only: `data-testid` selectors and API requests. No source code, CSS or DOM structure, and no visible text as a selector (except asserting the literal "Unassigned").
- Every run uses a fresh seed. Tests read expected values from the API instead of hard-coding them.
- Each test checks observable behavior, so any valid fix passes.
