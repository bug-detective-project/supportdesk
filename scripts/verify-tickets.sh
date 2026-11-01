#!/usr/bin/env bash
# Runs the QA CLI on every ticket branch, before and after its reference.patch,
# and prints the verification matrix. Expected for every ticket:
#   buggy: Gate 1 passes, Gate 2 fails   fixed: Gate 1 passes, Gate 2 passes
#
# Run from the qa worktree. Usage: scripts/verify-tickets.sh [ticket ids...]   (default: all)
set -uo pipefail

qa=$(git rev-parse --show-toplevel)
tmp=$(mktemp -d)

# shellcheck source=tickets.sh
source "$(dirname "$0")/tickets.sh"
queue=($(ticket_ids "$qa")) || exit 2
if [[ $# -gt 0 ]]; then ids=("$@"); else ids=("${queue[@]}"); fi

cleanup() {
  for id in "${ids[@]}"; do
    git -C "$qa" worktree remove --force "$tmp/$id" 2>/dev/null || true
  done
  rm -rf "$tmp"
}
trap cleanup EXIT

# Prints "<gate1> <gate2>" (pass/fail/not run/timeout) from a QA JSON result.
gates() {
  node -e '
    const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const g1 = r.gate === 1 ? (r.status === "timeout" ? "timeout" : "fail") : "pass";
    const g2 = r.gate === 1 ? "not-run" : r.status === "passed" ? "pass" : r.status === "timeout" ? "timeout" : "fail";
    console.log(g1, g2);
  ' "$1"
}

# The ticket's position in the queue (front first, then back), as the QA CLI expects.
position() {
  local i
  for i in "${!queue[@]}"; do
    [[ ${queue[$i]} == "$1" ]] && { echo $((i + 1)); return; }
  done
  echo "Unknown ticket: $1" >&2
  exit 2
}

rows=()
for id in "${ids[@]}"; do
  n=$(position "$id")
  wt="$tmp/$id"
  git -C "$qa" worktree add --quiet --detach "$wt" "$id"
  run_qa() {
    (cd "$qa" && npm run --silent qa -- --ticket "$n" --package "tickets/$id" --workspace "$wt" --json "$1" >"$2" 2>&1)
  }

  run_qa "$tmp/buggy-$id.json" "$tmp/buggy-$id.log"
  read -r b1 b2 < <(gates "$tmp/buggy-$id.json")

  if git -C "$wt" apply "$qa/tickets/$id/reference.patch"; then
    run_qa "$tmp/fixed-$id.json" "$tmp/fixed-$id.log"
    read -r f1 f2 < <(gates "$tmp/fixed-$id.json")
  else
    f1="patch-failed"; f2="patch-failed"
  fi

  ok="OK"
  [[ "$b1 $b2 $f1 $f2" == "pass fail pass pass" ]] || ok="UNEXPECTED"
  rows+=("| $id | $b1 | $b2 | $f1 | $f2 | $ok |")
  echo "$id: buggy=($b1, $b2) fixed=($f1, $f2) $ok" >&2
  if [[ $ok != OK ]]; then
    echo "--- buggy log"; cat "$tmp/buggy-$id.log"; echo "--- fixed log"; cat "$tmp/fixed-$id.log" 2>/dev/null
  fi >&2
done

echo
echo "| Ticket | Gate 1 on buggy ticket | Gate 2 on buggy ticket | Gate 1 after reference.patch | Gate 2 after reference.patch | Result |"
echo "| --- | --- | --- | --- | --- | --- |"
printf '%s\n' "${rows[@]}"
