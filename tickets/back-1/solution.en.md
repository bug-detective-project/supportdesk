# Solution: % and _ are searched literally

**Root cause.** `listTickets` in `server/src/repository.ts` builds the `LIKE` pattern as `%${term}%` without escaping the term, and the query has no `ESCAPE` clause. In SQL, `%` matches any sequence and `_` any single character, so a search for `%` becomes `%%%` and matches every title.

## Step by step

1. **Confirm it in the API.** `GET /api/tickets?search=%25` returns every ticket; the client only shows what the API sends.
2. **Escape the user's text.** Add a helper that puts a backslash before `\`, `%` and `_`:
   `value.replace(/[\\%_]/g, (char) => \`\\${char}\`)`
3. **Tell SQLite which escape character you used.** The query becomes
   `WHERE t.title LIKE ? ESCAPE '\' ORDER BY t.id` with `` `%${escapeLike(term)}%` `` as the parameter. The term stays a parameter: never put it in the SQL text.
4. **Add a regression test.** The reference adds `server/src/search.test.ts`: `%`, `t_f`, `100%` and `report_final` each find only the titles that contain them.

Then run `npm test`, search for `%` and `_` in the app, and move the card to **In QA**.
