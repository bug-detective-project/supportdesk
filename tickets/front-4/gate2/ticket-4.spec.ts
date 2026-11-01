import { expect, test } from '@playwright/test';
import { collectPageErrors, getTicket, listEmployees, listTickets } from '../../../support/app.ts';

test.describe('Ticket 4: unassigned tickets open normally', () => {
  test('every unassigned ticket shows "Unassigned"', async ({ page, request }) => {
    const errors = collectPageErrors(page);
    const unassigned = (await listTickets(request)).filter((ticket) => ticket.assigneeId === null);
    expect(unassigned.length, 'seed has unassigned tickets').toBeGreaterThan(0);

    for (const ticket of unassigned) {
      await page.goto(`/tickets/${ticket.id}`);
      await expect(page.getByTestId('ticket-details'), `ticket ${ticket.id} is shown`).toBeVisible();
      await expect(page.getByTestId('ticket-id')).toHaveText(String(ticket.id));
      await expect(page.getByTestId('assignee-name')).toHaveText('Unassigned');
      expect(errors, `page errors on ticket ${ticket.id}`).toEqual([]);
    }
  });

  test('unassigning a ticket keeps the page working', async ({ page, request }) => {
    const errors = collectPageErrors(page);
    const ticket = (await listTickets(request)).find((item) => item.assigneeId !== null)!;

    await page.goto(`/tickets/${ticket.id}`);
    await expect(page.getByTestId('assignee-name')).toHaveText(ticket.assignee!.name);

    await page.getByTestId('assignee-select').selectOption('');
    await expect(page.getByTestId('feedback-success')).toBeVisible();
    await expect(page.getByTestId('ticket-details')).toBeVisible();
    await expect(page.getByTestId('assignee-name')).toHaveText('Unassigned');
    expect(errors).toEqual([]);

    await page.reload();
    await expect(page.getByTestId('ticket-details')).toBeVisible();
    await expect(page.getByTestId('assignee-name')).toHaveText('Unassigned');
    expect((await getTicket(request, ticket.id)).assigneeId).toBeNull();
    expect(errors).toEqual([]);
  });

  test('assigned tickets still show their assignee', async ({ page, request }) => {
    const errors = collectPageErrors(page);
    const employees = await listEmployees(request);
    const assigned = (await listTickets(request)).filter((ticket) => ticket.assigneeId !== null);

    for (const ticket of assigned) {
      const assignee = employees.find((employee) => employee.id === ticket.assigneeId)!;
      await page.goto(`/tickets/${ticket.id}`);
      await expect(page.getByTestId('ticket-id')).toHaveText(String(ticket.id));
      await expect(page.getByTestId('assignee-name')).toHaveText(assignee.name);
    }
    expect(errors).toEqual([]);
  });
});
