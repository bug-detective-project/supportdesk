# SupportDesk QA suite (authoring only)

This is the `qa` branch of the SupportDesk repository: the QA suite and the game content. It shares no history with `main` (the app) and is never part of a ticket branch. Check it out next to the app as a worktree:

```sh
git clone git@github.com:bug-detective-project/supportdesk.git
git -C supportdesk worktree add ../supportdesk-qa qa
```

**This branch is the publication.** The desktop app downloads it whole: the tickets, this QA CLI (it builds the QA image with it), `review.json` and the story. `manifest.json` (written by `pnpm run publish:project` in `desktop/`) lists every ticket with its branch, commit, tag and SHA-256 digests; the desktop app downloads this branch and checks every file against it. There are no GitHub Releases.

```
supportdesk-qa/
  package.json           bugDetective.project: { id, name } of the project
  manifest.json          the published manifest (generated, never edited by hand)
  review.json            the code review configuration (paths left out of the review), optional
  story.en.json, story.pt.json   the project's story: client, project and Rafaela's messages
                         (welcome, one assignment per ticket id such as front-1, completion = the
                         project is done with the first track, trackCompletion = each later track;
                         both may use {{track}}). Assignments never mention another ticket.
  run.ts                 the QA CLI
  messages.ts            report messages (en, pt)
  playwright.config.ts   Gate 2 config (Chromium, headless, 1 worker)
  support/               Gate 2 helpers and the progress reporters
  scripts/
    build-tickets.sh     regenerates every tickets/<id>/gate1/, then rebuilds one branch per ticket folder from main
    verify-tickets.sh    runs the verification matrix
    tickets.sh           the ticket queue (sourced by both scripts)
  tickets/<id>/          one folder per ticket, named <track>-<order>: front-1, front-2, ..., back-1, ...
    ticket.en.md, ticket.pt.md   the ticket as a Jira card (its Track row says Front-end or Back-end); copied to the branch root as TICKET.en.md / TICKET.pt.md
    bug.patch            main -> the ticket branch (the bug only)
    gate1/               generated: main's tests plus every other ticket's regression test (mirrors repo paths)
    gate2/               hidden Playwright/API validation for the ticket
    reference.patch      ticket branch -> fixed, including the bug's regression test as a NEW test file
    hints.en.json, hints.pt.json         3 progressive senior-dev hints ({ "hints": [string, string, string] })
    solution.en.md, solution.pt.md       the final solution, explaining reference.patch step by step
    review.en.md, review.pt.md           the senior-dev code review shown after QA passes
```

Every file listed above is required in each ticket folder. The player picks a track for each ticket (front, back, or fullstack, which alternates), so tickets can be taken in any order: each ticket's Gate 1 covers every other ticket. The desktop app's ticket package is the folder without `bug.patch`. The queue is every `front-N` in order, then every `back-N`; the number of tickets comes from the folders.

## Setup

```sh
cd supportdesk-qa
npm install   # also installs Playwright's Chromium
```

## Running QA on a player's workspace

```sh
cd supportdesk-qa
npm run qa -- --ticket <n> --package tickets/<id> --workspace <path> [--lang en|pt] [--json out.json] [--timeout 180] [--keep] [--verbose]
              [--deps-cache <dir>] [--deps-only]
```

`--ticket` is the ticket's position in the queue (it only labels the result) and `--package` is the ticket folder.

1. **Isolate:** copies the workspace to a temp directory (without `node_modules`, `.git`, `dist`, `qa/` and `*.db` files) and runs `npm ci` there. The player's files, database and processes are never touched.
2. **Gate 1 (regression):** deletes every `*.test.*` / `*.spec.*` file in the copy, copies in the package's `gate1/`, and runs Vitest.
3. **Gate 2 (ticket validation):** builds the client with `vite build`, creates a fresh database with `npm run db:reset`, starts the server and `vite preview` on free ports, and runs the package's `gate2/` with Playwright. All processes are stopped afterward, even on failure.
4. **Timeout:** the whole run is limited to `--timeout` seconds (default 180). On timeout, everything is killed and unfinished tests are listed.

### Options for the desktop app and containers

| Option | What it does |
| --- | --- |
| `--package <dir>` | Required (except with `--deps-only`). Reads the ticket package (`gate1/`, `gate2/`) from any directory: `tickets/<id>` here, or a downloaded package mounted read-only. The workspace and the package are only read, never written. |
| `--deps-cache <dir>` | Reuses installed dependencies keyed by the SHA-256 of `package-lock.json`, the Node version and the platform, instead of running `npm ci`. After a fresh `npm ci`, the result is stored as `<key>.tar`. Lets QA run offline once the cache is warm. |
| `--deps-only` | With `--deps-cache`: copies the workspace, installs its dependencies into the cache and exits (exit code 0 on success). Used to download dependencies once, with the player's consent. |

Temporary Gate 2 folders (`.package-*/`) are created here while a run with `--package` is active and removed afterward.

The exit code is 0 only when both gates pass. `--json` writes `{ ticket, gate, status, message, tests: [{ name, status, error }], durationMs }`, where `status` is `passed`, `failed` or `timeout`, and `gate` is the gate that failed or timed out (2 when passed). `--keep` keeps the temp directory with logs for debugging.

## Authoring workflow

After changing the app on `main`:

1. Update `tickets/<id>/gate1/` if the project tests or test support files changed.
2. Regenerate `bug.patch` / `reference.patch` if they no longer apply.
3. Rebuild the ticket branches and verify:

```sh
scripts/build-tickets.sh       # recreates one orphan branch per tickets/<id>/
scripts/verify-tickets.sh      # expected: buggy (pass, fail), fixed (pass, pass)
```

4. Publish: `pnpm run publish:project --qa ../supportdesk-qa --version <X.Y.Z>` in `desktop/`, then the push command it prints (see "Publishing a project" in `desktop/README.md`).

Each ticket branch is `main` + its `bug.patch` + its Jira card (`TICKET.en.md`, `TICKET.pt.md`). Its project tests are exactly `gate1/`, which `build-tickets.sh` writes: the test files of `main` plus the regression test of every **other** ticket (the new test file its `reference.patch` adds). Commit the regenerated `gate1/` folders. A bug must therefore not break any test of `main`: move such a test into the ticket's regression test instead.

## Gate 2 rules

- Black-box only: `data-testid` selectors and API requests. No source code, CSS or DOM structure, and no visible text as a selector (except asserting the literal "Unassigned").
- Every run uses a fresh seed. Tests read expected values from the API instead of hard-coding them.
- Each test checks observable behavior, so any valid fix passes.
