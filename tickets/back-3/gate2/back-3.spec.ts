import { expect, test } from '@playwright/test';
import { getTicket, listTickets } from '../../../support/app.ts';

const FIELDS = {
  status: ['Open', 'In Progress', 'Closed'],
  priority: ['Low', 'Medium', 'High'],
} as const;

test.describe('Ticket back-3: only the official statuses and priorities are saved', () => {
  for (const [field, values] of Object.entries(FIELDS)) {
    for (const value of values) {
      const typed = value.toLowerCase();
      test(`a ${field} sent as "${typed}" is never saved in another spelling`, async ({ request }) => {
        const ticket = (await listTickets(request)).find((item) => item[field as 'status' | 'priority'] !== value)!;

        const response = await request.patch(`/api/tickets/${ticket.id}`, { data: { [field]: typed } });
        const saved = (await getTicket(request, ticket.id))[field as 'status' | 'priority'];

        expect(values as readonly string[]).toContain(saved);
        if (response.status() === 200) {
          expect((await response.json())[field]).toBe(value);
        } else {
          expect(response.status()).toBe(400);
        }
      });
    }
  }

  test('valid values are still saved, and unknown ones still rejected', async ({ request }) => {
    const ticket = (await listTickets(request)).find((item) => item.status !== 'Closed')!;

    expect((await request.patch(`/api/tickets/${ticket.id}`, { data: { status: 'Closed' } })).status()).toBe(200);
    expect((await getTicket(request, ticket.id)).status).toBe('Closed');
    expect((await request.patch(`/api/tickets/${ticket.id}`, { data: { priority: 'Urgent' } })).status()).toBe(400);
  });
});
