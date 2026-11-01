# SD-231: Assigning a ticket says "updated" but nothing was saved

| Field | Value |
| --- | --- |
| Project | SupportDesk (SD) |
| Issue type | Bug |
| Status | To Do |
| Priority | High |
| Reporter | Marcus Bell (Support operations manager) |
| Assignee | Unassigned |
| Affects version | 1.2 |
| Component | Ticket details |
| Labels | `customer-impact`, `assignment` |
| Sprint | SD Sprint 43 |
| Created | 2026-10-19 14:02 |

## Description

There are two problems with the assignee dropdown on the ticket details screen.

**1. People who left the company are still in the list.** Lucas left the support team last month, but his name still shows up when we choose who to assign a ticket to.

**2. The app says the assignment worked when it did not.** If I pick Lucas, I get the green success message and his name appears on the ticket. But when I refresh the page, the ticket is back with the person it had before. Nobody is notified, and the ticket sits there with nobody working on it, because everyone believes it was reassigned.

We only found out because a customer complained that nobody answered for three days.

## Steps to reproduce

1. Open ticket #3.
2. Open the assignee dropdown.
3. Select Lucas Moreau.
4. Refresh the page.

## Expected result

Lucas Moreau is not in the assignee dropdown. If an assignment cannot be saved, the screen says so.

## Actual result

Lucas Moreau is in the dropdown. After selecting him, a success message appears and the ticket shows Lucas as the assignee. After a refresh, the ticket is assigned to the previous person again.

## Acceptance criteria

- [ ] Only people who currently work on the team can be selected as assignees.
- [ ] If an assignment cannot be saved for any reason, the screen shows an error message instead of a success message, and the ticket keeps showing the person it was assigned to before.
- [ ] Assigning a ticket to a current team member still works and is still there after a refresh.

## Environment

- SupportDesk 1.2
- Chrome 141 on Windows 11

## Activity

**Marcus Bell** · 2026-10-19 14:10
> Customer escalation linked to this one. Please treat it as a priority for this sprint.
