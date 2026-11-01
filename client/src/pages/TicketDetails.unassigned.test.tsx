import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../test/mockApi.ts';
import { renderApp } from '../test/renderApp.tsx';

describe('TicketDetails without an assignee', () => {
  it('renders an unassigned ticket', async () => {
    mockApi();
    renderApp('/tickets/4');

    expect(await screen.findByTestId('ticket-details')).toBeInTheDocument();
    expect(screen.getByTestId('assignee-name')).toHaveTextContent('Unassigned');
    expect(screen.getByTestId('assignee-select')).toHaveValue('');
  });

  it('keeps the details visible after unassigning a ticket', async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp('/tickets/3');
    const select = await screen.findByTestId('assignee-select');
    await within(select).findByRole('option', { name: 'Maya Chen' });

    await user.selectOptions(select, '');

    expect(await screen.findByTestId('feedback-success')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-details')).toBeInTheDocument();
    expect(screen.getByTestId('assignee-name')).toHaveTextContent('Unassigned');
  });
});
