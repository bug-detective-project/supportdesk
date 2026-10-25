import { expect, test } from '@playwright/test';
import { expectShowsTicket, getTicket, listTickets, settle, ticketIdFromUrl } from '../../../support/app.ts';

test.describe('Ticket 1: details follow Previous and Next', () => {
  test('Next shows the next ticket', async ({ page, request }) => {
    await page.goto('/tickets/3');
    await expectShowsTicket(page, await getTicket(request, 3));

    await page.getByTestId('next-button').click();

    await expect(page).toHaveURL(/\/tickets\/4(\?|$)/);
    await expectShowsTicket(page, await getTicket(request, 4));
  });

  test('Previous shows the previous ticket', async ({ page, request }) => {
    await page.goto('/tickets/3');
    await page.getByTestId('next-button').click();
    await expectShowsTicket(page, await getTicket(request, 4));

    await page.getByTestId('prev-button').click();

    await expect(page).toHaveURL(/\/tickets\/3(\?|$)/);
    await expectShowsTicket(page, await getTicket(request, 3));
  });

  test('Previous and Next follow the search results', async ({ page, request }) => {
    const results = await listTickets(request, 'login');
    expect(results.length, 'seed tickets matching "login"').toBeGreaterThanOrEqual(2);
    const [first, second] = results;

    await page.goto(`/tickets/${first.id}?search=login`);
    await expectShowsTicket(page, first);

    await page.getByTestId('next-button').click();
    await expect(page).toHaveURL(new RegExp(`/tickets/${second.id}\\?search=login$`));
    await expectShowsTicket(page, second);

    await page.getByTestId('prev-button').click();
    await expect(page).toHaveURL(new RegExp(`/tickets/${first.id}\\?search=login$`));
    await expectShowsTicket(page, first);
  });

  test('fast double clicks end on the ticket in the URL', async ({ page, request }) => {
    await page.goto('/tickets/3');
    await expectShowsTicket(page, await getTicket(request, 3));

    await page.getByTestId('next-button').dblclick();
    await expect(page).not.toHaveURL(/\/tickets\/3(\?|$)/);
    await expectShowsTicket(page, await getTicket(request, ticketIdFromUrl(page)));

    const urlBeforePrevious = page.url();
    await page.getByTestId('prev-button').dblclick();
    await expect(page).not.toHaveURL(urlBeforePrevious);
    await expectShowsTicket(page, await getTicket(request, ticketIdFromUrl(page)));
  });

  test('a slow response for an earlier ticket does not replace the current one', async ({ page, request }) => {
    let releaseTicket4 = () => {};
    const ticket4Held = new Promise<void>((resolve) => {
      releaseTicket4 = resolve;
    });
    await page.route(
      (url) => url.pathname === '/api/tickets/4',
      async (route) => {
        await ticket4Held;
        await route.continue();
      },
    );

    await page.goto('/tickets/3');
    await expectShowsTicket(page, await getTicket(request, 3));

    await page.getByTestId('next-button').click();
    await expect(page).toHaveURL(/\/tickets\/4(\?|$)/);
    await page.getByTestId('next-button').click();
    await expect(page).toHaveURL(/\/tickets\/5(\?|$)/);
    const ticket5 = await getTicket(request, 5);
    await expectShowsTicket(page, ticket5);

    const ticket4Response = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/tickets/4');
    releaseTicket4();
    await (await ticket4Response).finished();
    await settle(page);

    await expectShowsTicket(page, ticket5);
  });
});
