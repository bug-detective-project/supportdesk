# Code review: SD-257, unassigned tickets are listed again

Nice work: one word in a query was hiding real customer tickets. Here is the reference approach, so you can compare it with yours.

## Why the bug happened

- `JOIN` and `LEFT JOIN` differ only when a row has no match. Every assigned ticket had one, so most of the list looked right.
- The same query feeds the list, the details page and the response of every update, so one change broke three features at once.
- The data that disappeared is exactly the data triage needs most: new tickets nobody has picked up yet.

## Why the reference fix is right

- The join type matches the data: `assigneeId` is nullable, so the employee is optional, and an optional relation is a `LEFT JOIN`.
- It is fixed in the shared query, so the list, the details and the updates agree again.
- `toTicket` already handled `NULL` employee columns; the fix only lets those rows reach it.
- The regression test covers the three symptoms, not just the list.

## Compare with your fix

- Did you add a second query for unassigned tickets and merge the results? It works, but the order and the two code paths are easy to get wrong.
- Did you change `toTicket`? It was already correct; the rows never reached it.

## Watch for next time

- For every join, ask: can the other side be missing? If yes, it is an outer join.
- A test that checks "all rows come back" catches a whole family of filtering bugs.
