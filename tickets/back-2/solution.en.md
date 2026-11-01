# Solution: unassigned tickets are listed again

**Root cause.** `selectTickets` in `server/src/repository.ts` joins the employees table with `JOIN employees e ON e.id = t.assigneeId`. A plain `JOIN` is an `INNER JOIN`: it only keeps rows that have a match on both sides. A ticket with `assigneeId` null has no matching employee, so the list skips it, `findTicket` returns nothing (404), and unassigning a ticket makes it disappear.

## Step by step

1. **Find the pattern.** Compare `GET /api/tickets` with the ids 1 to 15: every missing ticket has `assigneeId: null`.
2. **Keep the tickets without a match.** Change the join to `LEFT JOIN employees e ON e.id = t.assigneeId`. A `LEFT JOIN` keeps every ticket and fills the employee columns with `NULL` when there is no assignee; `toTicket` already turns that into `assignee: null`.
3. **Add a regression test.** The reference adds `server/src/unassigned.test.ts`: the list has all 15 tickets including unassigned ones, an unassigned ticket opens by id, and unassigning returns `assignee: null`.

Then run `npm test`, unassign a ticket in the app, check that it is still in the list, and move the card to **In QA**.
