import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi, requestsOf } from '../test/mockApi.ts';
import { renderApp } from '../test/renderApp.tsx';

describe('TicketList', () => {
  it('renders every ticket with its status, priority and assignee', async () => {
    mockApi();
    renderApp('/');

    const row = await screen.findByTestId('ticket-row-1');
    expect(within(row).getByText('Login page times out')).toBeInTheDocument();
    expect(within(row).getByText('Open')).toBeInTheDocument();
    expect(within(row).getByText('High')).toBeInTheDocument();
    expect(within(row).getByText('Maya Chen')).toBeInTheDocument();
    expect(within(screen.getByTestId('ticket-list')).getAllByRole('row')).toHaveLength(6);
  });

  it('shows "Unassigned" for tickets without an assignee', async () => {
    mockApi();
    renderApp('/tickets');

    const row = await screen.findByTestId('ticket-row-4');
    expect(within(row).getByText('Unassigned')).toBeInTheDocument();
  });

  it('keeps the search term in the URL and fetches matching tickets', async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    renderApp('/');
    await screen.findByTestId('ticket-row-1');

    await user.type(screen.getByTestId('search-input'), 'login');

    expect(screen.getByTestId('location')).toHaveTextContent('/?search=login');
    await waitFor(() => expect(screen.queryByTestId('ticket-row-2')).not.toBeInTheDocument());
    expect(screen.getByTestId('ticket-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-row-5')).toBeInTheDocument();
    expect(requestsOf(fetchMock).at(-1)).toMatchObject({ path: '/api/tickets', search: '?search=login' });
  });

  it('reads the initial search term from the URL', async () => {
    mockApi();
    renderApp('/tickets?search=password');

    expect(await screen.findByTestId('ticket-row-3')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toHaveValue('password');
    expect(screen.queryByTestId('ticket-row-1')).not.toBeInTheDocument();
  });

  it('opens the ticket details with the current search', async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp('/tickets?search=login');

    await user.click(await screen.findByTestId('ticket-row-5'));

    expect(screen.getByTestId('location')).toHaveTextContent('/tickets/5?search=login');
  });
});
