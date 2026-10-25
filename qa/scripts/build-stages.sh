#!/usr/bin/env bash
# Rebuilds the stage-1 ... stage-4 branches from main.
#
# Each stage branch is a single orphan commit ("SupportDesk release 1.N") containing:
#   - the app from main, without qa/
#   - the stage's bug (qa/stages/stage-N/bug.patch)
#   - the stage's project tests (qa/stages/stage-N/gate1/), which include the
#     regression tests for every earlier bug
#   - the stage's Jira card at the root, as TICKET.en.md and TICKET.pt.md
#
# Usage: qa/scripts/build-stages.sh [base-ref]   (default: main)
set -euo pipefail

repo=$(git rev-parse --show-toplevel)
qa="$repo/qa"
base=${1:-main}
tmp=$(mktemp -d)
worktree="$tmp/stage"

cleanup() {
  git -C "$repo" worktree remove --force "$worktree" 2>/dev/null || true
  rm -rf "$tmp"
}
trap cleanup EXIT

for n in 1 2 3 4; do
  stage="$qa/stages/stage-$n"
  git -C "$repo" worktree add --quiet --detach "$worktree" "$base"
  git -C "$worktree" checkout --quiet --orphan "build-stage-$n"

  git -C "$worktree" rm -r --quiet --cached qa
  rm -rf "$worktree/qa"
  git -C "$worktree" apply "$stage/bug.patch"

  find "$worktree" -path "$worktree/.git" -prune -o -type f \
    \( -name '*.test.*' -o -name '*.spec.*' \) -print -exec rm {} +
  cp -R "$stage/gate1/." "$worktree/"
  cp "$stage/ticket.en.md" "$worktree/TICKET.en.md"
  cp "$stage/ticket.pt.md" "$worktree/TICKET.pt.md"

  git -C "$worktree" add -A
  git -C "$worktree" commit --quiet -m "SupportDesk release 1.$n"
  git -C "$repo" branch --force "stage-$n" "$(git -C "$worktree" rev-parse HEAD)"

  git -C "$worktree" checkout --quiet --detach
  git -C "$repo" branch --quiet -D "build-stage-$n"
  git -C "$repo" worktree remove --force "$worktree"
  echo "stage-$n: $(git -C "$repo" log -1 --format='%h %s' "stage-$n")"
done
