import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../test/mockApi.ts';
import { renderApp } from '../test/renderApp.tsx';

describe('TicketDetails assignment', () => {
  it('only offers active employees', async () => {
    mockApi();
    renderApp('/tickets/3');

    const select = await screen.findByTestId('assignee-select');
    await within(select).findByRole('option', { name: 'Maya Chen' });

    const options = within(select).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Unassigned', 'Maya Chen', 'Daniel Okafor']);
  });

  it('shows an error and keeps the previous assignee when the assignment fails', async () => {
    mockApi({
      respond: (request) =>
        request.method === 'PATCH'
          ? new Response(JSON.stringify({ error: 'Maya Chen cannot be assigned' }), { status: 422 })
          : undefined,
    });
    const user = userEvent.setup();
    renderApp('/tickets/3');
    const select = await screen.findByTestId('assignee-select');
    await within(select).findByRole('option', { name: 'Maya Chen' });

    await user.selectOptions(select, '1');

    expect(await screen.findByTestId('feedback-error')).toBeInTheDocument();
    expect(screen.queryByTestId('feedback-success')).not.toBeInTheDocument();
    expect(screen.getByTestId('assignee-select')).toHaveValue('2');
    expect(screen.getByTestId('assignee-name')).toHaveTextContent('Daniel Okafor');
  });
});
