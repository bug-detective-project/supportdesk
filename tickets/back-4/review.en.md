# Code review: SD-270, the search term is a parameter, never SQL

Important fix: what looked like a crash on a name with an apostrophe was a security hole. Here is the reference approach, so you can compare it with yours.

## Why the bug happened

- The query was assembled as text, with the user's input in the middle of it. The database cannot tell where the query ends and the data begins.
- `escapeLike` made it look safe, but it only escapes `LIKE` wildcards, not quotes. Escaping for one purpose does not protect against another.
- The crash on `O'Brien` was the visible symptom; the silent one is that `' OR '1'='1` runs a different query.

## Why the reference fix is right

- Prepared statements with parameters are the standard defense: the SQL and the values travel separately, so no input can change the query.
- It matches the rest of the file: every other query in `repository.ts` already uses `?` and parameters.
- It keeps the `LIKE` escaping, so `%` and `_` are still searched as plain characters.
- The regression test checks both the error and the injection.

## Compare with your fix

- Did you escape or remove the apostrophes instead? It fixes `O'Brien` but leaves other ways in; and removing characters changes what users search for.
- Did you keep `escapeLike`? Without it, `%` and `_` would turn into wildcards again.

## Watch for next time

- Never build SQL with string concatenation or template strings that include input. Use parameters, always.
- When a quote breaks something, treat it as a security bug until proven otherwise.
