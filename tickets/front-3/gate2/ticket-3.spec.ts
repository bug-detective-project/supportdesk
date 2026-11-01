import { expect, test } from '@playwright/test';
import { getTicket, listTickets } from '../../../support/app.ts';

const PRIORITIES = ['Low', 'Medium', 'High'];

test.describe('Ticket 3: priority changes are saved', () => {
  for (const priority of PRIORITIES) {
    test(`changing the priority to ${priority} persists after reload`, async ({ page, request }) => {
      const ticket = (await listTickets(request)).find((item) => item.priority !== priority)!;

      await page.goto(`/tickets/${ticket.id}`);
      await expect(page.getByTestId('priority-select')).toHaveValue(ticket.priority);

      await page.getByTestId('priority-select').selectOption(priority);
      await expect(page.getByTestId('feedback-success')).toBeVisible();
      await expect(page.getByTestId('priority-select')).toHaveValue(priority);

      await page.reload();
      await expect(page.getByTestId('ticket-details')).toBeVisible();
      await expect(page.getByTestId('priority-select')).toHaveValue(priority);
      expect((await getTicket(request, ticket.id)).priority).toBe(priority);
    });
  }

  test('changing the priority does not change other fields', async ({ page, request }) => {
    const ticket = (await listTickets(request)).find((item) => item.priority !== 'Low')!;

    await page.goto(`/tickets/${ticket.id}`);
    await page.getByTestId('priority-select').selectOption('Low');
    await expect(page.getByTestId('feedback-success')).toBeVisible();

    const saved = await getTicket(request, ticket.id);
    expect(saved).toMatchObject({ priority: 'Low', status: ticket.status, assigneeId: ticket.assigneeId });
  });
});
