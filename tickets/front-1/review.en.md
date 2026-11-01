# Code review: SD-214, details follow Previous and Next

Nice work getting this one through QA. Here is how the reference fix approaches it, so you can compare it with yours. There is often more than one good answer, and the tests only check behavior.

## Why the bug happened

The details effect was written for a page that mounts once per ticket. That was true while every ticket opened from the list. When Previous and Next were added, the route started changing **inside** a mounted component, and an effect with `[]` has no way to notice. Nothing crashes, the URL is right, and the data is wrong, which is why this kind of bug survives manual testing.

## Why the reference fix is right

- `[id]` makes the dependency explicit: the effect reads `id`, so it runs again whenever `id` changes. The `react-hooks/exhaustive-deps` lint rule flags exactly this.
- The `ignore` flag in the cleanup handles a race that `[id]` alone does not: two requests in flight, finishing in the wrong order. Without it, a slow response for an earlier ticket overwrites the current one. An `AbortController` is an equally valid choice.
- Resetting `feedback` and `loadError` keeps per-ticket UI state from leaking into the next ticket.
- The regression test reproduces both the plain navigation and the out-of-order response, so a future refactor cannot quietly bring them back.

## Compare with your fix

- Did you handle out-of-order responses, or only the dependency array?
- Some fixes add `key={id}` to force a remount. It works, but it throws away all component state and refetches the employee list on every click. That is a valid trade-off to know about.

## Watch for next time

- An effect that reads a value should usually list it as a dependency.
- When a URL parameter changes, assume the component stays mounted.
- Any fetch inside an effect needs an answer to "what if the user moves on before it finishes?".
