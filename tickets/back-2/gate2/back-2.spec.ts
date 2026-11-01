import { expect, test } from '@playwright/test';
import { getTicket, listTickets } from '../../../support/app.ts';

test.describe('Ticket back-2: tickets without an assignee are listed and open', () => {
  test('the list has every ticket, in id order, with no gaps', async ({ request }) => {
    const ids = (await listTickets(request)).map((ticket) => ticket.id);

    expect(ids).toEqual(Array.from({ length: Math.max(...ids) }, (_, index) => index + 1));
  });

  test('a ticket set to Unassigned stays in the list and opens', async ({ request }) => {
    const assigned = (await listTickets(request)).find((ticket) => ticket.assigneeId !== null)!;

    const response = await request.patch(`/api/tickets/${assigned.id}`, { data: { assigneeId: null } });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ id: assigned.id, assigneeId: null, assignee: null });

    expect((await listTickets(request)).map((ticket) => ticket.id)).toContain(assigned.id);
    expect(await getTicket(request, assigned.id)).toMatchObject({ assigneeId: null, assignee: null });
  });
});
