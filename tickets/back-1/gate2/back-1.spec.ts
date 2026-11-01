import { expect, test } from '@playwright/test';
import { listTickets } from '../../../support/app.ts';

test.describe('Ticket back-1: % and _ are searched as plain characters', () => {
  for (const term of ['%', '_', '100%', 'report_final']) {
    test(`searching "${term}" only returns the titles that contain it`, async ({ request }) => {
      const all = await listTickets(request);
      const expected = all.filter((ticket) => ticket.title.toLowerCase().includes(term.toLowerCase())).map((ticket) => ticket.id);

      const found = await listTickets(request, term);
      expect(found.map((ticket) => ticket.id)).toEqual(expected);
    });
  }

  test('other searches stay partial and case-insensitive', async ({ request }) => {
    const all = await listTickets(request);
    const word = all[0].title.split(' ')[0];
    const expected = all.filter((ticket) => ticket.title.toLowerCase().includes(word.toLowerCase())).map((ticket) => ticket.id);

    expect((await listTickets(request, word.toUpperCase())).map((ticket) => ticket.id)).toEqual(expected);
  });
});
