# Solution: the search term is a parameter, never SQL

**Root cause.** `listTickets` in `server/src/repository.ts` builds the query with a template string: `` `... WHERE t.title LIKE '%${escapeLike(term)}%' ...` ``. The user's text becomes part of the SQL. The apostrophe in `O'Brien` closes the string literal early, so SQLite reads `Brien%'` as SQL and fails (`500`). A search like `' OR '1'='1` is worse: it changes the condition and returns every ticket. That is SQL injection.

## Step by step

1. **Read the server log.** The error is `SQLITE_ERROR: near "Brien": syntax error`, which means the input reached the SQL text.
2. **Pass the term as a parameter.** Write the query with a placeholder and give the value to `.all()`:
   `.prepare(\`${selectTickets} WHERE t.title LIKE ? ESCAPE '\\' ORDER BY t.id\`).all(\`%${escapeLike(term)}%\`)`
   The database receives the SQL and the value separately, so the value can never change the query.
3. **Keep the LIKE escaping.** `escapeLike` still handles `%` and `_`; parameters do not do that for you.
4. **Add a regression test.** The reference adds `server/src/search-quotes.test.ts`: `O'Brien` answers `200` with an empty list, and `' OR '1'='1` returns no tickets.

Then run `npm test`, search for `O'Brien` in the app, and move the card to **In QA**.
