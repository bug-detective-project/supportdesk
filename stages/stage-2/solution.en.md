# Solution: assignment reports failures

**Root cause.** Two independent problems in `client/src/pages/TicketDetails.tsx`:

1. The dropdown renders every employee from `/api/employees`, including those with `active: false`.
2. `handleAssigneeChange` calls `updateTicket(...)` without `await`, ignores the `Response`, and immediately updates the screen and shows the success message. When the server answers `422 Unprocessable Entity`, nobody is listening.

## Step by step

1. **Offer only active employees.** Compute `const activeEmployees = employees.filter((employee) => employee.active);` and render the `<option>` list from `activeEmployees`. Keep `Unassigned` as the first option.
2. **Make the handler async and wait for the server.** Declare `async function handleAssigneeChange(...)`, remember `ticket.id`, clear the feedback, and `await updateTicket(ticketId, { assignee: event.target.value })`.
3. **Check the response before changing the screen.** If `!response.ok`, read the server's reason with `readErrorMessage(response)`, show it as an error, and return without touching the ticket. The `<select>` is controlled by `ticket.assigneeId`, so it goes back to the previous assignee by itself.
4. **On success, use what the server saved.** Parse the updated ticket from the response and copy its `assigneeId` and `assignee` into state, only if the same ticket is still on screen. Then show the success message.
5. **Handle network errors.** Wrap the call in `try/catch` and show an error message when `fetch` itself fails.
6. **Add regression tests.** The reference adds `client/src/pages/TicketDetails.assignment.test.tsx`: one test checks that the dropdown lists only active employees; the other makes the mocked PATCH return 422 and checks that the error appears, the success message does not, and the previous assignee stays.

Then run `npm test`, try assigning Lucas Moreau in the browser (he should no longer be offered), and move the card to **In QA**.
