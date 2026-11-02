# Code review: SD-245, unassigned tickets open again

This was the hardest of the four: no server error, no stack trace in the terminal, just a white page. Getting from that to one line of code is real debugging work. Here is the reference approach, so you can compare it with yours.

## Why the bug happened

- The data was always correct: unassigned tickets have `assignee: null` since the first release, and the `AssigneeName` component and the ticket list handle it.
- A later change added the assignee to the ticket header and read the name directly, written and tested against an assigned ticket. It was a **regression**: working behavior broke because of a new feature.
- The `Ticket` type said `assignee: Employee`, which did not match the API. TypeScript checks your code against your types, not against reality, so a wrong type silently turns off the safety net.
- In React, an exception during rendering removes the whole tree unless an error boundary catches it, so a small rendering mistake becomes a blank screen.

## Why the reference fix is right

- Fixing the type first makes the compiler find every unsafe access, now and in the future.
- Rendering an explicit unassigned branch (the `?` avatar and **Unassigned**) matches the ticket list, so the same person looks the same on both screens.
- Assigned tickets keep their avatar and name in the header, so the new feature is preserved, not reverted.
- The regression tests cover both entry points: opening an unassigned ticket and unassigning an open one.

## Compare with your fix

- Did you fix the type, or only add `?.` at the crash site? Optional chaining (`ticket.assignee?.name`) stops the crash, but renders an empty name and leaves the incorrect type for the next person.
- Did you reuse `AssigneeName` and the list's avatar? That is a good instinct: one component for one concept.
- An error boundary around the page would be a useful extra, but it would show an error message instead of the ticket, so it does not replace the fix.

## Watch for next time

- A blank React page means "read the Console first".
- Types for API data must describe what the API really returns, including `null`.
- Seed or test data should include the edge cases (unassigned, empty, inactive), so new features meet them early.
