# SD-214: Ticket details don't change when I use Previous and Next

| Field | Value |
| --- | --- |
| Project | SupportDesk (SD) |
| Issue type | Bug |
| Status | To Do |
| Priority | High |
| Reporter | Hannah Brooks (Support team lead) |
| Assignee | Unassigned |
| Affects version | 1.1 |
| Component | Ticket details |
| Labels | `customer-impact`, `navigation` |
| Sprint | SD Sprint 42 |
| Created | 2026-10-12 09:14 |

## Description

When I open a ticket and use the **Previous** or **Next** buttons to move through the list, the address bar changes to the new ticket, but the screen keeps showing the ticket I opened first. The title, the description and the dropdowns all stay the same.

My agents went through a whole queue this morning thinking they were reading different tickets. One of them changed the status of the wrong ticket because of this.

## Steps to reproduce

1. Open the ticket list.
2. Click ticket #3.
3. Click **Next**.
4. Look at the address bar: it says ticket 4. Look at the page: it still shows ticket #3.
5. Click **Previous** or **Next** a few more times.
6. Refresh the browser.

It also happens when the list is filtered by a search.

## Expected result

The page shows the ticket in the address bar after every **Previous** or **Next** click.

## Actual result

The page keeps showing the first ticket I opened until I refresh the browser. After a refresh, the correct ticket shows up.

## Acceptance criteria

- [ ] **Previous** and **Next** show the previous or next ticket in the list, with its own title, description, status, priority and assignee.
- [ ] **Previous** and **Next** respect the current search.
- [ ] What is on screen always matches the ticket in the address bar, even after several quick clicks in a row.

## Environment

- SupportDesk 1.1
- Chrome 141 on Windows 11, Safari 19 on macOS

## Activity

**Hannah Brooks** · 2026-10-12 09:20
> Happening to the whole team, on every browser we use. Refreshing after every click is our workaround for now.
