# SD-245: Some tickets open as a blank white page

| Field | Value |
| --- | --- |
| Project | SupportDesk (SD) |
| Issue type | Bug |
| Status | To Do |
| Priority | Critical |
| Reporter | Hannah Brooks (Support team lead) |
| Assignee | Unassigned |
| Affects version | 1.4 |
| Component | Ticket details |
| Labels | `blocker`, `regression` |
| Sprint | SD Sprint 44 |
| Created | 2026-10-24 08:51 |

## Description

Since the latest release, some tickets cannot be opened at all. When I click them in the list, the whole page turns white: no ticket, no buttons, no menu. The only way out is the browser's back button.

Other tickets open normally. It looks like the broken ones are the new tickets that nobody has picked up yet, which are exactly the ones we need to triage.

It also happens on a ticket that was working: if I set its assignee to **Unassigned**, the page goes blank right away.

## Steps to reproduce

1. Open the ticket list.
2. Click ticket #4.
3. Go back and click ticket #3.
4. On ticket #3, set the assignee to **Unassigned**.

## Expected result

Ticket #4 opens normally and shows **Unassigned** as the assignee. Setting ticket #3 to **Unassigned** keeps the page working.

## Actual result

Ticket #4 opens as a blank page. Ticket #3 opens normally, but the page goes blank as soon as it is set to **Unassigned**.

## Acceptance criteria

- [ ] Every ticket opens normally.
- [ ] Tickets without an assignee show **Unassigned** as the assignee.
- [ ] Setting a ticket to **Unassigned** keeps the page working.
- [ ] Tickets with an assignee keep showing that person's name.

## Environment

- SupportDesk 1.4
- Chrome 141 on Windows 11, Edge 141 on Windows 11

## Activity

**Hannah Brooks** · 2026-10-24 08:58
> New tickets are piling up because nobody can open them. Blocking triage for the whole team.
