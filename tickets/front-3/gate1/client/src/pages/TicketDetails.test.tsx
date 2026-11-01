import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi, requestsOf } from '../test/mockApi.ts';
import { renderApp } from '../test/renderApp.tsx';

describe('TicketDetails', () => {
  it('renders an assigned ticket', async () => {
    mockApi();
    renderApp('/tickets/3');

    expect(await screen.findByTestId('ticket-title')).toHaveTextContent('Password reset email never arrives');
    expect(screen.getByTestId('ticket-id')).toHaveTextContent('3');
    expect(screen.getByTestId('ticket-description')).toHaveTextContent('Description of ticket 3.');
    expect(screen.getByTestId('status-select')).toHaveValue('Open');
    expect(screen.getByTestId('priority-select')).toHaveValue('High');
    expect(screen.getByTestId('assignee-name')).toHaveTextContent('Daniel Okafor');
  });

  it('enables Previous and Next inside the results', async () => {
    mockApi();
    renderApp('/tickets/3');

    await screen.findByTestId('ticket-details');
    expect(await screen.findByTestId('prev-button')).toBeEnabled();
    expect(screen.getByTestId('next-button')).toBeEnabled();
  });

  it('disables Previous on the first result', async () => {
    mockApi();
    renderApp('/tickets/1');

    await screen.findByTestId('ticket-details');
    expect(screen.getByTestId('prev-button')).toBeDisabled();
  });

  it('links back to the list with the same search', async () => {
    mockApi();
    renderApp('/tickets/1?search=login');

    expect(await screen.findByTestId('back-link')).toHaveAttribute('href', '/tickets?search=login');
  });

  it('saves a status change and shows a success message', async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    renderApp('/tickets/3');
    await screen.findByTestId('ticket-details');

    await user.selectOptions(screen.getByTestId('status-select'), 'Closed');

    expect(await screen.findByTestId('feedback-success')).toBeInTheDocument();
    expect(screen.getByTestId('status-select')).toHaveValue('Closed');
    expect(screen.queryByTestId('feedback-error')).not.toBeInTheDocument();
    expect(requestsOf(fetchMock).find((request) => request.method === 'PATCH')).toMatchObject({
      path: '/api/tickets/3',
      body: { status: 'Closed' },
    });
  });
});
