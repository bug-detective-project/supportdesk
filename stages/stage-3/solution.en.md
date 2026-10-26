# Solution: priority changes are saved

**Root cause.** The details form keeps the priority in a field called `priorityLevel` (`TicketFormValues`). `toTicketPatch` in `client/src/api/tickets.ts` copies that name straight into the request body, so the client sends `{ "priorityLevel": "High" }`. The API expects `{ "priority": "High" }` (see the README). The server ignores unknown fields, finds nothing to change, and answers `200` with the unchanged ticket. The UI trusts the 200 and shows the new value until the page is reloaded.

## Step by step

1. **Confirm it in the Network tab.** The PATCH payload contains `priorityLevel`, and the response still has the old `priority`.
2. **Map the form field to the API field.** In `toTicketPatch`, change the priority entry to
   `...(values.priorityLevel !== undefined && { priority: values.priorityLevel }),`
   This is the one place where form values become the API body, so the fix belongs there. The server and the API contract stay unchanged (a team convention).
3. **Add a regression test.** The reference adds `client/src/pages/TicketDetails.priority.test.tsx`: it selects **High** and checks that the PATCH request body is exactly `{ priority: 'High' }`.

Then run `npm test`, change a priority in the browser, reload the page, and move the card to **In QA**.
