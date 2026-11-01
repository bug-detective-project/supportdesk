#!/usr/bin/env bash
# Rebuilds one branch per ticket folder (tickets/<track>-<order>/) from main.
#
# First it regenerates every tickets/<id>/gate1/ (commit the result): the test files of main (any
# *.test.* / *.spec.* file and everything under a test/ folder) plus the regression test of every
# OTHER ticket, taken from that ticket's reference.patch, where it must be a new file. The player
# can take the tickets in any order, so Gate 1 always covers every other ticket.
#
# Then each ticket branch is a single orphan commit ("<Project> release <id>") containing:
#   - the app from main
#   - the ticket's bug (tickets/<id>/bug.patch)
#   - the ticket's project tests (tickets/<id>/gate1/)
#   - the ticket's Jira card at the root, as TICKET.en.md and TICKET.pt.md
#
# Run from the qa worktree. Usage: scripts/build-tickets.sh [base-ref]   (default: main)
set -euo pipefail

qa=$(git rev-parse --show-toplevel)
base=${1:-main}
project=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).bugDetective.project.name)' "$qa/package.json")
tmp=$(mktemp -d)
worktree="$tmp/ticket"

cleanup() {
  git -C "$qa" worktree remove --force "$worktree" 2>/dev/null || true
  rm -rf "$tmp"
}
trap cleanup EXIT

# shellcheck source=tickets.sh
source "$(dirname "$0")/tickets.sh"

ids=$(ticket_ids "$qa")

# The new test files a reference.patch adds (its regression test), written under a folder.
regression_tests() {
  local patch=$1 into=$2 scratch
  scratch=$(mktemp -d)
  # Outside any repository, git apply works on plain files: only the new test files are written.
  (cd "$scratch" && git apply --include='*.test.*' --include='*.spec.*' "$patch")
  cp -R "$scratch/." "$into/"
  rm -rf "$scratch"
}

for id in $ids; do
  gate1="$qa/tickets/$id/gate1"
  rm -rf "$gate1"
  mkdir -p "$gate1"
  git -C "$qa" ls-tree -r --name-only "$base" | grep -E '(\.test\.|\.spec\.)|(^|/)test/' | while IFS= read -r file; do
    mkdir -p "$gate1/$(dirname "$file")"
    git -C "$qa" show "$base:$file" > "$gate1/$file"
  done
  for other in $ids; do
    [[ $other == "$id" ]] || regression_tests "$qa/tickets/$other/reference.patch" "$gate1"
  done
  echo "$id: gate1 = tests of $base + the regression tests of the other tickets"
done

for id in $ids; do
  ticket="$qa/tickets/$id"
  git -C "$qa" worktree add --quiet --detach "$worktree" "$base"
  git -C "$worktree" checkout --quiet --orphan "build-$id"

  git -C "$worktree" apply "$ticket/bug.patch"

  find "$worktree" -path "$worktree/.git" -prune -o -type f \
    \( -name '*.test.*' -o -name '*.spec.*' \) -print -exec rm {} +
  cp -R "$ticket/gate1/." "$worktree/"
  cp "$ticket/ticket.en.md" "$worktree/TICKET.en.md"
  cp "$ticket/ticket.pt.md" "$worktree/TICKET.pt.md"

  git -C "$worktree" add -A
  git -C "$worktree" commit --quiet -m "$project release $id"
  git -C "$qa" branch --force "$id" "$(git -C "$worktree" rev-parse HEAD)"

  git -C "$worktree" checkout --quiet --detach
  git -C "$qa" branch --quiet -D "build-$id"
  git -C "$qa" worktree remove --force "$worktree"
  echo "$id: $(git -C "$qa" log -1 --format='%h %s' "$id")"
done
