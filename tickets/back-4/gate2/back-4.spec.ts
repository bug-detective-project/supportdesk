import { expect, test } from '@playwright/test';
import { listTickets } from '../../../support/app.ts';

test.describe('Ticket back-4: the search term is never SQL', () => {
  for (const term of ["O'Brien", "D'Angelo", "'"]) {
    test(`searching "${term}" works like any other search`, async ({ request }) => {
      const response = await request.get('/api/tickets', { params: { search: term } });

      expect(response.status()).toBe(200);
      const found: { title: string }[] = await response.json();
      expect(found.every((ticket) => ticket.title.includes(term))).toBe(true);
    });
  }

  test('SQL typed in the search box only finds titles that contain it', async ({ request }) => {
    const all = await listTickets(request);
    for (const term of ["' OR '1'='1", "%' OR 1=1 --"]) {
      const response = await request.get('/api/tickets', { params: { search: term } });

      expect(response.status()).toBe(200);
      const found: { title: string }[] = await response.json();
      expect(found.length).toBeLessThan(all.length);
      expect(found.every((ticket) => ticket.title.includes(term))).toBe(true);
    }
  });

  test('% and _ are still searched as plain characters', async ({ request }) => {
    const all = await listTickets(request);
    const expected = all.filter((ticket) => ticket.title.includes('%')).map((ticket) => ticket.id);

    expect((await listTickets(request, '%')).map((ticket) => ticket.id)).toEqual(expected);
  });
});
