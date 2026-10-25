import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { getTicket, listEmployees, listTickets } from '../../../support/app.ts';

async function assigneeOptions(page: Page) {
  const options = page.getByTestId('assignee-select').locator('option');
  return {
    values: await options.evaluateAll((elements) => elements.map((element) => (element as HTMLOptionElement).value)),
    labels: (await options.allTextContents()).map((label) => label.trim()),
  };
}

test.describe('Ticket 2: assignment reports failures', () => {
  test('inactive employees are not offered as assignees', async ({ page, request }) => {
    const employees = await listEmployees(request);
    const inactive = employees.filter((employee) => !employee.active);
    const active = employees.filter((employee) => employee.active);
    expect(inactive.length, 'seed has an inactive employee').toBeGreaterThan(0);

    await page.goto('/tickets/3');
    await expect(page.getByTestId('ticket-details')).toBeVisible();
    await expect(page.getByTestId('assignee-select').locator('option')).toHaveCount(active.length + 1);

    const { values, labels } = await assigneeOptions(page);
    for (const employee of inactive) {
      expect(values, `option values must not include ${employee.name}`).not.toContain(String(employee.id));
      expect(labels, `option labels must not include ${employee.name}`).not.toContain(employee.name);
    }
    for (const employee of active) {
      expect(values, `option values must include ${employee.name}`).toContain(String(employee.id));
    }
  });

  test('the server rejects an inactive employee', async ({ request }) => {
    const [inactive] = (await listEmployees(request)).filter((employee) => !employee.active);
    const response = await request.patch('/api/tickets/3', { data: { assigneeId: inactive.id } });
    expect(response.status()).toBe(422);
    expect((await getTicket(request, 3)).assigneeId).not.toBe(inactive.id);
  });

  test('a failed assignment shows an error and keeps the previous assignee', async ({ page, request }) => {
    const ticket = await getTicket(request, 3);
    expect(ticket.assignee, 'ticket 3 is assigned').not.toBeNull();
    const other = (await listEmployees(request)).find(
      (employee) => employee.active && employee.id !== ticket.assigneeId,
    )!;

    await page.route(
      (url) => url.pathname === '/api/tickets/3',
      (route) =>
        route.request().method() === 'PATCH'
          ? route.fulfill({ status: 422, json: { error: 'This employee cannot be assigned' } })
          : route.fallback(),
    );

    await page.goto('/tickets/3');
    await expect(page.getByTestId('assignee-name')).toHaveText(ticket.assignee!.name);

    const patch = page.waitForRequest((req) => req.method() === 'PATCH');
    await page.getByTestId('assignee-select').selectOption(String(other.id));
    await patch;

    await expect(page.getByTestId('feedback-error')).toBeVisible();
    await expect(page.getByTestId('feedback-success')).toHaveCount(0);
    await expect(page.getByTestId('assignee-select')).toHaveValue(String(ticket.assigneeId));
    await expect(page.getByTestId('assignee-name')).toHaveText(ticket.assignee!.name);

    await page.unrouteAll();
    await page.reload();
    await expect(page.getByTestId('assignee-name')).toHaveText(ticket.assignee!.name);
    await expect(page.getByTestId('assignee-select')).toHaveValue(String(ticket.assigneeId));
    expect((await getTicket(request, 3)).assigneeId).toBe(ticket.assigneeId);
  });

  test('a valid assignment succeeds and persists', async ({ page, request }) => {
    const ticket = (await listTickets(request)).find((item) => item.assigneeId !== null)!;
    const employee = (await listEmployees(request)).find(
      (item) => item.active && item.id !== ticket.assigneeId,
    )!;

    await page.goto(`/tickets/${ticket.id}`);
    await expect(page.getByTestId('ticket-details')).toBeVisible();
    await page.getByTestId('assignee-select').selectOption(String(employee.id));

    await expect(page.getByTestId('feedback-success')).toBeVisible();
    await expect(page.getByTestId('feedback-error')).toHaveCount(0);
    await expect(page.getByTestId('assignee-name')).toHaveText(employee.name);

    await page.reload();
    await expect(page.getByTestId('assignee-name')).toHaveText(employee.name);
    await expect(page.getByTestId('assignee-select')).toHaveValue(String(employee.id));
    expect((await getTicket(request, ticket.id)).assigneeId).toBe(employee.id);
  });
});
