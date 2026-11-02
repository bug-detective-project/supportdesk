# SD-257: Unassigned tickets disappear from the list

| Field | Value |
| --- | --- |
| Project | SupportDesk (SD) |
| Issue type | Bug |
| Status | To Do |
| Priority | High |
| Reporter | Marcus Bell (Support operations manager) |
| Track | Back-end |
| Affects version | 1.6 |
| Component | Ticket list (API) |
| Labels | `customer-impact`, `triage`, `api` |
| Sprint | SD Sprint 45 |
| Created | 04/11/2026 08:05 |

## Description

New tickets arrive without an assignee, and our morning triage starts from exactly those. Since yesterday's release they are not in the ticket list at all. The list only shows tickets that already have someone assigned.

It gets worse: if an agent sets a ticket back to **Unassigned**, the ticket vanishes from the list, and opening its link shows "Ticket not found". Nobody can find it again.

## Steps to reproduce

1. Open the ticket list and count the tickets.
2. Open any assigned ticket and change the assignee to **Unassigned**.
3. Go back to the list, then open the ticket's link again.

## Expected result

The list shows every ticket, with or without an assignee. An unassigned ticket opens normally and shows "Unassigned".

## Actual result

The list skips every ticket without an assignee. Unassigning a ticket succeeds, but the ticket then disappears from the list and its page says "Ticket not found".

## Acceptance criteria

- [ ] `GET /api/tickets` returns every ticket, assigned or not, still ordered by id.
- [ ] `GET /api/tickets/:id` returns an unassigned ticket with `assigneeId: null` and `assignee: null`.
- [ ] Unassigning a ticket returns it with `assignee: null`.

## Environment

- SupportDesk 1.6 (API)
- All browsers; also with `curl`

## Activity

**Marcus Bell** · 04/11/2026 08:12
> Three new customer tickets sat unseen for a night because of this. Please treat it as urgent.
