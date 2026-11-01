# Solution: details follow Previous and Next

**Root cause.** In `client/src/pages/TicketDetails.tsx`, the effect that loads the ticket has an empty dependency array (`[]`). React runs it once, when the component mounts. Previous and Next only change the `:id` route parameter, so React Router keeps the same component mounted, the effect never runs again, and the screen keeps the first ticket.

## Step by step

1. **Run the effect again when the id changes.** Change the dependency array from `[]` to `[id]`. The effect reads `id`, so React must know about it.
2. **Ignore stale responses.** With fast clicks, the request for ticket 4 can finish after the request for ticket 5. Declare `let ignore = false;` inside the effect, return a cleanup function that sets `ignore = true`, and only call `setTicket` / `setLoadError` when `ignore` is still `false`. React runs the cleanup of the previous effect before the next one, so only the latest request can update the screen.
3. **Reset per-ticket state.** At the start of the effect, clear `feedback` and `loadError`, so a success message or a "not found" error from the previous ticket does not stay on screen. On error, also clear `ticket`.
4. **Add a regression test.** The reference adds `client/src/pages/TicketDetails.navigation.test.tsx`: one test clicks Next and Previous and checks the title and id; another holds the response for ticket 2, clicks Next twice and checks that ticket 3 stays on screen after ticket 2 finally arrives.

Then run `npm test`, try it in the browser, and move the card to **In QA**.
