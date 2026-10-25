#!/usr/bin/env bash
# Runs the QA CLI on every stage branch, before and after its reference.patch,
# and prints the verification matrix. Expected for every stage:
#   buggy: Gate 1 passes, Gate 2 fails   fixed: Gate 1 passes, Gate 2 passes
#
# Usage: qa/scripts/verify-stages.sh [stage numbers...]   (default: 1 2 3 4)
set -uo pipefail

repo=$(git rev-parse --show-toplevel)
qa="$repo/qa"
tmp=$(mktemp -d)
stages=("${@:-1 2 3 4}")
stages=(${stages[*]})

cleanup() {
  for n in "${stages[@]}"; do
    git -C "$repo" worktree remove --force "$tmp/stage-$n" 2>/dev/null || true
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

rows=()
for n in "${stages[@]}"; do
  wt="$tmp/stage-$n"
  git -C "$repo" worktree add --quiet --detach "$wt" "stage-$n"

  (cd "$qa" && npm run --silent qa -- --ticket "$n" --workspace "$wt" --json "$tmp/buggy-$n.json" >"$tmp/buggy-$n.log" 2>&1)
  read -r b1 b2 < <(gates "$tmp/buggy-$n.json")

  if git -C "$wt" apply "$qa/stages/stage-$n/reference.patch"; then
    (cd "$qa" && npm run --silent qa -- --ticket "$n" --workspace "$wt" --json "$tmp/fixed-$n.json" >"$tmp/fixed-$n.log" 2>&1)
    read -r f1 f2 < <(gates "$tmp/fixed-$n.json")
  else
    f1="patch-failed"; f2="patch-failed"
  fi

  ok="OK"
  [[ "$b1 $b2 $f1 $f2" == "pass fail pass pass" ]] || ok="UNEXPECTED"
  rows+=("| $n | $b1 | $b2 | $f1 | $f2 | $ok |")
  echo "stage-$n: buggy=($b1, $b2) fixed=($f1, $f2) $ok" >&2
  if [[ $ok != OK ]]; then
    echo "--- buggy log"; cat "$tmp/buggy-$n.log"; echo "--- fixed log"; cat "$tmp/fixed-$n.log" 2>/dev/null
  fi >&2
done

echo
echo "| Stage | Gate 1 on buggy stage | Gate 2 on buggy stage | Gate 1 after reference.patch | Gate 2 after reference.patch | Result |"
echo "| --- | --- | --- | --- | --- | --- |"
printf '%s\n' "${rows[@]}"
