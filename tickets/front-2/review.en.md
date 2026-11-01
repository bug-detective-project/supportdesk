# Code review: SD-231, assignment reports failures

Good job getting both symptoms fixed: this ticket had two causes, and QA checks each one. Here is the reference approach so you can compare it with what you did.

## Why the bug happened

- **The departed employee.** `/api/employees` returns everyone, with an `active` flag, because other screens need inactive people too (for example, to show who handled an old ticket). The dropdown used the full list without asking what it was for.
- **The false success.** `handleAssigneeChange` was written "optimistically": send the request, update the screen right away, assume it worked. The promise from `updateTicket` was never awaited, so the 422 from the server was lost. A `fetch` only rejects on network failures; HTTP errors arrive as a normal `Response` with `ok === false`, and they are easy to miss.

The server did its job: it rejected the inactive employee with a clear message. The client simply never read it.

## Why the reference fix is right

- Filtering with `employee.active` in the component keeps the API unchanged (a team convention) and matches the rule the server already enforces.
- Awaiting the request and checking `response.ok` before touching state makes the screen tell the truth. The server's own error message is shown, so the user learns **why** it failed.
- On success, the state comes from the server's response instead of a local guess, so the screen shows what was actually saved.
- The `current?.id === ticketId` check avoids writing the result into a different ticket if the user navigated away while the request was in flight (the lesson from ticket 1).
- The regression tests cover both causes independently.

## Compare with your fix

- Did you fix both causes? Hiding Lucas alone would hide the symptom in this case, but any other server rejection would still show a false success.
- Did you reuse `saveField` or write a dedicated handler? Both are fine; what matters is that every update path checks the response.
- Optimistic updates are a legitimate pattern, but they need a rollback when the server says no.

## Watch for next time

- An un-awaited promise in an event handler is a red flag. Linters can catch it (`no-floating-promises`).
- `fetch` does not throw on 4xx/5xx: always check `response.ok`.
- When the server validates something, the UI should still handle the rejection, even if it also prevents the invalid choice.
