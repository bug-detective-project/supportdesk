# SD-238: Priority changes are lost after refreshing

| Field | Value |
| --- | --- |
| Project | SupportDesk (SD) |
| Issue type | Bug |
| Status | To Do |
| Priority | Medium |
| Reporter | Elena Duarte (Customer support supervisor) |
| Assignee | Unassigned |
| Affects version | 1.3 |
| Component | Ticket details |
| Labels | `data-loss`, `triage` |
| Sprint | SD Sprint 43 |
| Created | 2026-10-21 10:37 |

## Description

When I change the priority of a ticket, the screen shows the new priority and the green success message. Everything looks fine. But if I refresh the page, or someone else opens the same ticket, the old priority is back.

This is causing urgent tickets to stay at the bottom of the queue. Changing the status still seems to work. There are no error messages anywhere.

## Steps to reproduce

1. Open ticket #2 (priority **Medium**).
2. Change the priority to **High**.
3. Refresh the page.

The same happens with every priority value.

## Expected result

The ticket shows **High** after the refresh, and the ticket list shows **High** too.

## Actual result

Before the refresh, the screen shows **High** and a success message. After the refresh, the priority is **Medium** again, and the ticket list also shows **Medium**.

## Acceptance criteria

- [ ] After I change the priority and see the success message, the new priority is still there after a refresh.
- [ ] The ticket list and everyone else who opens the ticket see the new priority.
- [ ] Changing the priority does not change any other field of the ticket.

## Environment

- SupportDesk 1.3
- Firefox 144 on Ubuntu 24.04, Chrome 141 on macOS

## Activity

**Elena Duarte** · 2026-10-21 10:45
> We are re-checking priorities by hand every morning until this is fixed.
