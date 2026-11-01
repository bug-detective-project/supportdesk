# Code review: SD-238, priority changes are saved

Well traced: this is the kind of bug where every layer reports success. Here is the reference approach, so you can compare it with yours.

## Why the bug happened

- The form and the API use different vocabularies: `priorityLevel` in the UI, `priority` on the wire. That is normal, and `toTicketPatch` exists to translate between them. It translated `status` and `assignee`, but passed `priorityLevel` through unchanged.
- The server is lenient: it ignores fields it does not know, so the request was valid, changed nothing, and returned 200.
- The UI updated its state from what it **sent**, not from what the server **returned**, so the screen looked right until a reload.

Three reasonable decisions combined into silent data loss.

## Why the reference fix is right

- It fixes the mapping in the one function responsible for it, so every caller benefits.
- It keeps the API contract and the server untouched, as the team conventions require; other clients and the hidden checks rely on them.
- The regression test asserts the request body itself, which is the contract between the two sides. A UI-only test would have passed even with the bug.

## Compare with your fix

- Did you change the client mapping, or make the server accept `priorityLevel`? Accepting an alias on the server would also persist the value, but it changes the API for everyone and hides the client mistake.
- Did you consider updating the screen from the server response, like the assignment handler does since ticket 2? It would have made this bug visible immediately.

## Watch for next time

- "200 OK" only means the server did not complain. Check that the response contains what you changed.
- When a value disappears between layers, inspect the payload at each boundary: form state, request body, server parsing, database.
- Shared types between client and server, or a strict server that rejects unknown fields, turn this kind of mismatch into an immediate error.
