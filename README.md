# SupportDesk QA suite (authoring only)

This is the `qa` branch of the SupportDesk repository: the QA suite and the game content. It shares no history with `main` (the app) and is never part of a ticket branch. Check it out next to the app as a worktree:

```sh
git clone git@github.com:bug-detective-project/supportdesk.git
git -C supportdesk worktree add ../supportdesk-qa qa
```

**This branch is the publication.** The desktop app downloads it whole: the tickets, this QA CLI (it builds the QA image with it), `review.json` and the story. `manifest.json` (written by `npx bd publish`) lists every ticket with its branch, commit, tag and SHA-256 digests; the desktop app downloads this branch and checks every file against it. There are no GitHub Releases, and `qa` is protected: it changes only through a pull request whose checks (`bd validate` and `bd verify`) pass.

```
supportdesk-qa/
  package.json           bugDetective.project: { id, name, difficulty, stack } of the project
  .npmrc                 the catalog's dependency rules for this package (no URL dependencies, versions at least 7 days old)
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
  .github/workflows/publication.yml   the pull request checks and the qa-v<version> tag (the catalog's project.yml,
                         pinned by commit hash to the version package.json depends on; bd validate checks it)
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

1. **Isolate:** copies the workspace to a temp directory (without `node_modules`, `.git`, `dist`, `qa/` and `*.db` files) and runs `npm ci --ignore-scripts` there, then `npm rebuild` only for the packages that the workspace's `package.json` lists in `allowScripts` (`better-sqlite3`): no dependency runs a script the project did not allow. A lockfile that resolves a package outside `https://registry.npmjs.org/` is refused before anything is installed. The player's files, database and processes are never touched.
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

The authoring tools come from [`bug-detective-project/catalog`](https://github.com/bug-detective-project/catalog) (`bd`, a dev dependency, so `npx bd` works here; its README has the details). Work on a branch of `qa`, never on `qa` itself:

1. `git switch -c publish/<X.Y.Z>`.
2. After changing the app on `main`: update `tickets/<id>/gate1/` support files if needed, and regenerate `bug.patch` / `reference.patch` if they no longer apply.
3. Rebuild the ticket branches and verify:

```sh
npx bd build       # regenerates every gate1/ and one orphan branch per tickets/<id>/ (commit the gate1/ changes)
npx bd verify      # expected: buggy (pass, fail), fixed (pass, pass)
```

4. `npx bd publish --version <X.Y.Z>`: writes `manifest.json`, tags new ticket commits (`<id>-v<X.Y.Z>`), commits, pushes the ticket branches, the tags and your branch, and prints the pull request link. It never pushes `qa`.
5. Open the pull request into `qa`. Its checks run `bd validate` and `bd verify`; the merge reaches players the next time they take a ticket and is tagged `qa-v<X.Y.Z>`.

Each ticket branch is `main` + its `bug.patch` + its Jira card (`TICKET.en.md`, `TICKET.pt.md`). Its project tests are exactly `gate1/`, which `bd build` writes: the test files of `main` plus the regression test of every **other** ticket (the new test file its `reference.patch` adds). Commit the regenerated `gate1/` folders. A bug must therefore not break any test of `main`: move such a test into the ticket's regression test instead.

## Gate 2 rules

- Black-box only: `data-testid` selectors and API requests. No source code, CSS or DOM structure, and no visible text as a selector (except asserting the literal "Unassigned").
- Every run uses a fresh seed. Tests read expected values from the API instead of hard-coding them.
- Each test checks observable behavior, so any valid fix passes.
