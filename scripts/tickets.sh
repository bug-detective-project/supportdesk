# Shared by build-tickets.sh and verify-tickets.sh (sourced, not run).

# Prints the ticket ids in queue order (front-1, front-2, ..., back-1, ...). Fails on a folder in
# tickets/ that is not <front|back>-<order> or on a gap in a track's order.
ticket_ids() {
  local qa=$1 track n name
  for name in $(ls "$qa/tickets"); do
    if [[ ! $name =~ ^(front|back)-[1-9][0-9]?$ ]]; then
      echo "tickets/$name: a ticket folder must be named front-<n> or back-<n>" >&2
      return 1
    fi
  done
  for track in front back; do
    n=1
    while [[ -d "$qa/tickets/$track-$n" ]]; do
      echo "$track-$n"
      n=$((n + 1))
    done
    if ls "$qa/tickets" | grep -qE "^$track-"; then
      if [[ $(ls "$qa/tickets" | grep -cE "^$track-") -ne $((n - 1)) ]]; then
        echo "tickets/: the $track tickets must be numbered 1, 2, 3, ... without gaps" >&2
        return 1
      fi
    fi
  done
}
