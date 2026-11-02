import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { fetchTickets } from '../api/tickets.ts';
import type { Ticket } from '../api/tickets.ts';
import { AssigneeName } from '../components/AssigneeName.tsx';
import { withSearch } from '../searchParams.ts';

const SEARCH_DEBOUNCE_MS = 250;

export function TicketList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchTickets(search, controller.signal);
        setTickets(results);
        setError(null);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load tickets');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search]);

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSearchParams(value ? { search: value } : {}, { replace: true });
  }

  function openTicket(id: number) {
    navigate(withSearch(`/tickets/${id}`, search));
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Tickets</h1>
        <input
          type="search"
          className="search-input"
          placeholder="Search by title…"
          aria-label="Search tickets by title"
          value={search}
          onChange={handleSearchChange}
          data-testid="search-input"
        />
      </header>

      {error && (
        <p className="feedback feedback-error" role="alert">
          {error}
        </p>
      )}

      <table className="ticket-table" data-testid="ticket-list" aria-busy={loading}>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Title</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="ticket-row"
              tabIndex={0}
              onClick={() => openTicket(ticket.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  openTicket(ticket.id);
                }
              }}
              data-testid={`ticket-row-${ticket.id}`}
            >
              <td>{ticket.id}</td>
              <td>{ticket.title}</td>
              <td>
                <span className={`badge status-${ticket.status.replace(' ', '-').toLowerCase()}`}>
                  {ticket.status}
                </span>
              </td>
              <td>
                <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                  {ticket.priority}
                </span>
              </td>
              <td>
                <AssigneeName assignee={ticket.assignee} />
              </td>
            </tr>
          ))}
          {!loading && tickets.length === 0 && (
            <tr>
              <td colSpan={5} className="empty">
                No tickets match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
