# SD-270: Searching for "O'Brien" shows an error

| Field | Value |
| --- | --- |
| Project | SupportDesk (SD) |
| Issue type | Bug |
| Status | To Do |
| Priority | Critical |
| Reporter | Elena Duarte (Customer care supervisor) |
| Track | Back-end |
| Affects version | 1.8 |
| Component | Ticket search (API) |
| Labels | `search`, `api`, `security` |
| Sprint | SD Sprint 46 |
| Created | 09/11/2026 10:15 |

## Description

When an agent searches for a customer name with an apostrophe, like `O'Brien` or `D'Angelo`, the ticket list shows an error instead of results. Any search with a `'` fails the same way.

Priya looked at the server log and saw an SQL syntax error. She marked the ticket **Critical** and added the `security` label: if a quote can break the query, someone could write their own query in the search box.

## Steps to reproduce

1. Open the ticket list.
2. Search for `O'Brien`.

## Expected result

The search runs like any other and shows the tickets whose title contains `O'Brien` (none today), with no error.

## Actual result

The request answers `500`, the list shows an error message, and the server log has `SQLITE_ERROR: near "Brien": syntax error`.

## Acceptance criteria

- [ ] Searches containing `'` work like any other search.
- [ ] Nothing typed in the search box can change the SQL that runs: it is only ever text to look for.
- [ ] `%` and `_` are still matched as plain characters, and every other search keeps working.

## Environment

- SupportDesk 1.8 (API)
- All browsers; also with `curl "http://localhost:3001/api/tickets?search=O'Brien"`

## Activity

**Priya Raman** · 09/11/2026 10:40
> Server log: `SQLITE_ERROR: near "Brien": syntax error`. Please also check what happens with `' OR '1'='1`.
