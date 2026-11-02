# Solution: unassigned tickets open again

**Root cause.** A recent change added the assignee to the ticket header in `client/src/pages/TicketDetails.tsx`, next to the status and priority tags, with an avatar of their initials. It reads `ticket.assignee.name` directly. For unassigned tickets, the API returns `"assignee": null`, so rendering throws `TypeError: Cannot read properties of null (reading 'name')`. An error thrown during rendering unmounts the whole React tree, which leaves a blank page. The `Ticket` type in `client/src/api/tickets.ts` declares `assignee: Employee` (not nullable), so the type checker could not catch it.

## Step by step

1. **Reproduce it in the Console.** Open ticket #4 and read the `TypeError` and the component in its stack trace.
2. **Make the type tell the truth.** In `client/src/api/tickets.ts`, change `assignee: Employee;` to `assignee: Employee | null;`. Now `npm run build` (or your editor) points at every place that assumes an assignee.
3. **Render both cases.** In the header, do what the ticket list already does: when `ticket.assignee` exists, show the avatar with `getInitials(ticket.assignee.name)` (class `avatar-user`); otherwise show `?` (class `avatar-unassigned`). For the name, use the `AssigneeName` component, which already shows **Unassigned** for `null`.
4. **Add regression tests.** The reference adds `client/src/pages/TicketDetails.unassigned.test.tsx`: one test opens an unassigned ticket and checks that the details render with "Unassigned"; the other unassigns a ticket and checks that the page stays visible.

Then run `npm test`, open ticket #4, unassign ticket #3, and move the card to **In QA**.
