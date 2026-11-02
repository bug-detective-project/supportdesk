import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { fetchEmployees } from '../api/employees.ts';
import type { Employee } from '../api/employees.ts';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TicketNotFoundError,
  fetchTicket,
  fetchTickets,
  readErrorMessage,
  updateTicket,
} from '../api/tickets.ts';
import type { Ticket, TicketFormValues, TicketPriority, TicketStatus } from '../api/tickets.ts';
import { AssigneeName } from '../components/AssigneeName.tsx';
import { withSearch } from '../searchParams.ts';

const STATUS_ICONS: Record<TicketStatus, string> = {
  'Closed': '●',
  'In Progress': '●',
  'Open': '●',
};

const PRIORITY_ICONS: Record<TicketPriority, string> = {
  High: '●',
  Low: '●',
  Medium: '●',
};

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

export function TicketDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [resultIds, setResultIds] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let ignore = false;
    setFeedback(null);
    setLoadError(null);

    fetchTicket(Number(id))
      .then((loaded) => {
        if (!ignore) {
          setTicket(loaded);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setTicket(null);
          setLoadError(
            error instanceof TicketNotFoundError ? 'Ticket not found.' : 'Failed to load the ticket.',
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    fetchEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTickets(search, controller.signal)
      .then((results) => setResultIds(results.map((result) => result.id)))
      .catch(() => {
        if (!controller.signal.aborted) {
          setResultIds([]);
        }
      });
    return () => controller.abort();
  }, [search]);

  const activeEmployees = employees.filter((employee) => employee.active);
  const position = resultIds.indexOf(Number(id));
  const previousId = position > 0 ? resultIds[position - 1] : undefined;
  const nextId = position >= 0 && position < resultIds.length - 1 ? resultIds[position + 1] : undefined;

  function goTo(ticketId: number | undefined) {
    if (ticketId !== undefined) {
      navigate(withSearch(`/tickets/${ticketId}`, search));
    }
  }

  async function saveField(values: TicketFormValues, changes: Partial<Ticket>, label: string) {
    if (!ticket) {
      return;
    }
    const ticketId = ticket.id;
    setFeedback(null);
    try {
      const response = await updateTicket(ticketId, values);
      if (!response.ok) {
        const reason = await readErrorMessage(response);
        setFeedback({ type: 'error', message: reason ?? `Could not update the ${label}.` });
        return;
      }
      setTicket((current) => (current?.id === ticketId ? { ...current, ...changes } : current));
      setFeedback({ type: 'success', message: `The ${label} was updated.` });
    } catch {
      setFeedback({ type: 'error', message: `Could not update the ${label}. Check your connection.` });
    }
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const status = event.target.value as TicketStatus;
    void saveField({ status }, { status }, 'status');
  }

  function handlePriorityChange(event: ChangeEvent<HTMLSelectElement>) {
    const priority = event.target.value as TicketPriority;
    void saveField({ priorityLevel: priority }, { priority }, 'priority');
  }

  async function handleAssigneeChange(event: ChangeEvent<HTMLSelectElement>) {
    if (!ticket) {
      return;
    }
    const ticketId = ticket.id;
    setFeedback(null);
    try {
      const response = await updateTicket(ticketId, { assignee: event.target.value });
      if (!response.ok) {
        const reason = await readErrorMessage(response);
        setFeedback({ type: 'error', message: reason ?? 'Could not update the assignee.' });
        return;
      }
      const updated: Ticket = await response.json();
      setTicket((current) =>
        current?.id === ticketId
          ? { ...current, assigneeId: updated.assigneeId, assignee: updated.assignee }
          : current,
      );
      setFeedback({ type: 'success', message: 'The assignee was updated.' });
    } catch {
      setFeedback({ type: 'error', message: 'Could not update the assignee. Check your connection.' });
    }
  }

  const backLink = (
    <Link className="back-link" to={withSearch('/tickets', search)} data-testid="back-link">
      <span className="back-arrow" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </span>
      <span>Back to list</span>
    </Link>
  );

  if (loadError) {
    return (
      <main className="page">
        <nav className="details-nav">{backLink}</nav>
        <div className="card state-card error-state">
          <div className="state-icon" aria-hidden="true">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="feedback feedback-error" role="alert">
            {loadError}
          </p>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="page">
        <nav className="details-nav">{backLink}</nav>
        <div className="card state-card loading-state">
          <div className="spinner" aria-hidden="true" />
          <p className="loading">Loading ticket…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <nav className="details-nav">
        {backLink}
        <div className="pager">
          {position >= 0 && (
            <span className="pager-status" aria-live="polite">
              {position + 1} of {resultIds.length}
            </span>
          )}
          <div className="pager-buttons">
            <button
              type="button"
              className="btn-pager"
              onClick={() => goTo(previousId)}
              disabled={previousId === undefined}
              data-testid="prev-button"
              aria-label="Previous ticket"
            >
              ← Previous
            </button>
            <button
              type="button"
              className="btn-pager"
              onClick={() => goTo(nextId)}
              disabled={nextId === undefined}
              data-testid="next-button"
              aria-label="Next ticket"
            >
              Next →
            </button>
          </div>
        </div>
      </nav>

      {feedback?.type === 'success' && (
        <div className="feedback-banner">
          <p className="feedback feedback-success" role="status" data-testid="feedback-success">
            <svg
              className="feedback-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{feedback.message}</span>
          </p>
        </div>
      )}

      {feedback?.type === 'error' && (
        <div className="feedback-banner">
          <p className="feedback feedback-error" role="alert" data-testid="feedback-error">
            <svg
              className="feedback-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{feedback.message}</span>
          </p>
        </div>
      )}

      <article className="ticket-details" data-testid="ticket-details">
        <div className="ticket-layout">
          <div className="ticket-main-panel">
            <header className="ticket-header">
              <div className="ticket-header-top">
                <p className="ticket-number">
                  Ticket #<span data-testid="ticket-id">{ticket.id}</span>
                </p>
                <div className="ticket-header-tags">
                  <span className={`badge status-${ticket.status.replace(' ', '-').toLowerCase()}`}>
                    <span className="badge-indicator-dot" aria-hidden="true" />
                    {ticket.status}
                  </span>
                  <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                    <span className="badge-indicator-dot" aria-hidden="true" />
                    {ticket.priority}
                  </span>
                </div>
              </div>
              <h1 data-testid="ticket-title">{ticket.title}</h1>
            </header>

            <section className="ticket-description-box">
              <h2 className="section-label">Description</h2>
              <p className="description" data-testid="ticket-description">
                {ticket.description}
              </p>
            </section>
          </div>

          <aside className="ticket-sidebar-panel">
            <div className="sidebar-card">
              <h2 className="sidebar-heading">Ticket Properties</h2>
              <dl className="fields">
                <div className="field">
                  <dt>
                    <label htmlFor="status">Status</label>
                  </dt>
                  <dd>
                    <div className="select-container">
                      <select
                        id="status"
                        className={`badge-select status-${ticket.status.replace(' ', '-').toLowerCase()}`}
                        value={ticket.status}
                        onChange={handleStatusChange}
                        data-testid="status-select"
                      >
                        {TICKET_STATUSES.map((status) => (
                          <option
                            key={status}
                            value={status}
                            className={`opt-status opt-status-${status.replace(' ', '-').toLowerCase()}`}
                          >
                            {STATUS_ICONS[status]} {status}
                          </option>
                        ))}
                      </select>
                      <span className="select-chevron" aria-hidden="true">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>
                  </dd>
                </div>

                <div className="field">
                  <dt>
                    <label htmlFor="priority">Priority</label>
                  </dt>
                  <dd>
                    <div className="select-container">
                      <select
                        id="priority"
                        className={`badge-select priority-${ticket.priority.toLowerCase()}`}
                        value={ticket.priority}
                        onChange={handlePriorityChange}
                        data-testid="priority-select"
                      >
                        {TICKET_PRIORITIES.map((priority) => (
                          <option
                            key={priority}
                            value={priority}
                            className={`opt-priority opt-priority-${priority.toLowerCase()}`}
                          >
                            {PRIORITY_ICONS[priority]} {priority}
                          </option>
                        ))}
                      </select>
                      <span className="select-chevron" aria-hidden="true">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>
                  </dd>
                </div>

                <div className="field">
                  <dt>
                    <label htmlFor="assignee">Assignee</label>
                  </dt>
                  <dd>
                    <span className="sr-only" data-testid="assignee-name">
                      <AssigneeName assignee={ticket.assignee} />
                    </span>
                    <div className="select-container">
                      <select
                        id="assignee"
                        value={ticket.assigneeId ?? ''}
                        onChange={handleAssigneeChange}
                        data-testid="assignee-select"
                        aria-label="Assign to team member"
                      >
                        <option value="">Unassigned</option>
                        {activeEmployees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                      <span className="select-chevron" aria-hidden="true">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
