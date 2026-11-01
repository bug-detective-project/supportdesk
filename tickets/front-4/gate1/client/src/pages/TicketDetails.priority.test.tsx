import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi, requestsOf } from '../test/mockApi.ts';
import { renderApp } from '../test/renderApp.tsx';

describe('TicketDetails priority', () => {
  it('sends the new priority to the API', async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    renderApp('/tickets/2');
    await screen.findByTestId('ticket-details');

    await user.selectOptions(screen.getByTestId('priority-select'), 'High');

    expect(await screen.findByTestId('feedback-success')).toBeInTheDocument();
    const patch = requestsOf(fetchMock).find((request) => request.method === 'PATCH');
    expect(patch).toEqual(expect.objectContaining({ path: '/api/tickets/2', body: { priority: 'High' } }));
  });
});
