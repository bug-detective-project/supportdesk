# Code review: SD-252, % and _ are searched literally

Good catch on a bug that only shows up with "unusual" input. Here is the reference approach, so you can compare it with yours.

## Why the bug happened

- `LIKE` is a small pattern language: `%` and `_` are wildcards. The user's text was dropped into the pattern as is, so their characters became wildcards too.
- Escaping needs two parts: the escaped text **and** an `ESCAPE` clause telling SQLite which character escapes. Removing either one breaks it.
- Most searches have no `%` or `_`, so the bug hid behind the common case.

## Why the reference fix is right

- The term is escaped right where the pattern is built, so every caller of `listTickets` gets it.
- The term is still passed as a parameter. Escaping for `LIKE` and protecting against SQL injection are two different problems: the parameter handles the second one.
- The regression test pins the edge cases (`%`, `_`, and both inside real titles), not just a normal search.

## Compare with your fix

- Did you escape `\` too? Without it, a search for `\` followed by `%` would turn the escape off again.
- Did you filter in JavaScript after loading every ticket? It works, but it moves the search out of the database and loads the whole table on each request.

## Watch for next time

- Any time user text goes into a pattern (`LIKE`, a regular expression, a glob), ask which characters are special there.
- Test search with the characters people really type: `%`, `_`, quotes, accents, spaces.
