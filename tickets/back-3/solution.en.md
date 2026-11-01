# Solution: only the official statuses and priorities are saved

**Root cause.** `isOneOf` in `server/src/routes/tickets.ts` was changed to compare ignoring case, so `"closed"` passes the check. `parseChanges` then saves `input.status` exactly as it arrived. The validation and the saved value no longer agree: the check accepts `closed`, the database stores `closed`, and every part of the app that expects `Closed` breaks.

## Step by step

1. **Reproduce it with the API.** `PATCH /api/tickets/3` with `{"status":"closed"}` answers `200`, and `GET /api/tickets/3` shows `"status": "closed"`.
2. **Make the check exact again.** `isOneOf` goes back to `values.includes(value)`. The API contract in the README lists the exact values, and the team conventions say not to change the API. A request with `"closed"` now gets `400`, like any other invalid value.
3. **Add a regression test.** The reference adds `server/src/validation.test.ts`: after a `PATCH` with `"closed"` or `"low"`, the saved value is still one of the official ones, and the response is either `400` or the official spelling.

(Saving the official value that matched, for example `Closed` for `closed`, also passes the checks. The reference keeps the API strict, so clients learn about their mistake.)

Then run `npm test`, repeat the `curl` request, and move the card to **In QA**.
