import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../test/mockApi.ts';
import { renderApp } from '../test/renderApp.tsx';

describe('TicketDetails navigation', () => {
  it('loads the ticket again when Next and Previous change the id', async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp('/tickets/1');
    expect(await screen.findByTestId('ticket-title')).toHaveTextContent('Login page times out');

    await user.click(screen.getByTestId('next-button'));

    expect(await screen.findByText('Invoice shows wrong address')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-id')).toHaveTextContent('2');
    expect(screen.getByTestId('location')).toHaveTextContent('/tickets/2');

    await user.click(screen.getByTestId('prev-button'));

    expect(await screen.findByText('Login page times out')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-id')).toHaveTextContent('1');
  });

  it('ignores a slow response for a ticket that is no longer selected', async () => {
    let releaseTicket2 = () => {};
    const ticket2Held = new Promise<void>((resolve) => {
      releaseTicket2 = resolve;
    });
    mockApi({
      respond: async (request) => {
        if (request.method === 'GET' && request.path === '/api/tickets/2') {
          await ticket2Held;
        }
        return undefined;
      },
    });
    const user = userEvent.setup();
    renderApp('/tickets/1');
    await screen.findByText('Login page times out');

    await user.click(screen.getByTestId('next-button'));
    await user.click(screen.getByTestId('next-button'));
    expect(await screen.findByText('Password reset email never arrives')).toBeInTheDocument();

    await act(async () => {
      releaseTicket2();
      await ticket2Held;
    });

    expect(screen.getByTestId('ticket-id')).toHaveTextContent('3');
    expect(screen.getByTestId('ticket-title')).toHaveTextContent('Password reset email never arrives');
  });
});
