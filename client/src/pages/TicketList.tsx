import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { fetchTickets } from '../api/tickets.ts';
import type { Ticket } from '../api/tickets.ts';
import { AssigneeName } from '../components/AssigneeName.tsx';
import { withSearch } from '../searchParams.ts';
import { getInitials } from '../utils/formatters.ts';

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

  function handleClearSearch() {
    setSearchParams({}, { replace: true });
  }

  function openTicket(id: number) {
    navigate(withSearch(`/tickets/${id}`, search));
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-info">
          <div className="page-title-group">
            <h1>Tickets</h1>
            <span className="count-pill">
              {loading ? 'Updating…' : `${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}`}
            </span>
          </div>
          <p className="page-subtitle">View, search, and manage customer service requests</p>
        </div>

        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            className="search-input"
            placeholder="Search by title…"
            aria-label="Search tickets by title"
            value={search}
            onChange={handleSearchChange}
            data-testid="search-input"
          />
          {search && (
            <button
              type="button"
              className="search-clear-button"
              onClick={handleClearSearch}
              aria-label="Clear search query"
              title="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="feedback feedback-error" role="alert">
          <svg
            className="feedback-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="table-wrapper">
        <table className="ticket-table" data-testid="ticket-list" aria-busy={loading}>
          <thead>
            <tr>
              <th scope="col" className="th-id">
                ID
              </th>
              <th scope="col" className="th-title">
                Title
              </th>
              <th scope="col" className="th-status">
                Status
              </th>
              <th scope="col" className="th-priority">
                Priority
              </th>
              <th scope="col" className="th-assignee">
                Assignee
              </th>
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
                <td className="cell-id">
                  <span className="id-tag">
                    <span className="id-hash">#</span>
                    {ticket.id}
                  </span>
                </td>
                <td className="cell-title">
                  <span className="ticket-title-text">{ticket.title}</span>
                </td>
                <td className="cell-status">
                  <span className={`badge status-${ticket.status.replace(' ', '-').toLowerCase()}`}>
                    <span className="badge-indicator-dot" aria-hidden="true" />
                    {ticket.status}
                  </span>
                </td>
                <td className="cell-priority">
                  <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                    <span className="badge-indicator-dot" aria-hidden="true" />
                    {ticket.priority}
                  </span>
                </td>
                <td className="cell-assignee">
                  <div className="assignee-cell">
                    <span
                      className={`avatar ${ticket.assignee ? 'avatar-user' : 'avatar-unassigned'}`}
                      aria-hidden="true"
                    >
                      {ticket.assignee ? getInitials(ticket.assignee.name) : '?'}
                    </span>
                    <span className="assignee-text">
                      <AssigneeName assignee={ticket.assignee} />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  <div className="empty-state">
                    <div className="empty-icon" aria-hidden="true">
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                    <p className="empty-message">No tickets match your search.</p>
                    {search && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={handleClearSearch}>
                        Clear search filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
