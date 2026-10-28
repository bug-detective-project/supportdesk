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
import { withSearch } from '../searchParams.ts';

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
          setLoadError(error instanceof TicketNotFoundError ? 'Ticket not found.' : 'Failed to load the ticket.');
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
      ← Back to list
    </Link>
  );

  if (loadError) {
    return (
      <main className="page">
        {backLink}
        <p className="feedback feedback-error" role="alert">
          {loadError}
        </p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="page">
        {backLink}
        <p className="loading">Loading ticket…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <nav className="details-nav">
        {backLink}
        <div className="pager">
          <button
            type="button"
            onClick={() => goTo(previousId)}
            disabled={previousId === undefined}
            data-testid="prev-button"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => goTo(nextId)}
            disabled={nextId === undefined}
            data-testid="next-button"
          >
            Next →
          </button>
        </div>
      </nav>

      <article className="ticket-details" data-testid="ticket-details">
        <header>
          <p className="ticket-number">
            Ticket #<span data-testid="ticket-id">{ticket.id}</span>
          </p>
          <h1 data-testid="ticket-title">{ticket.title}</h1>
        </header>

        <p className="description" data-testid="ticket-description">
          {ticket.description}
        </p>

        <dl className="fields">
          <div className="field">
            <dt>
              <label htmlFor="status">Status</label>
            </dt>
            <dd>
              <select id="status" value={ticket.status} onChange={handleStatusChange} data-testid="status-select">
                {TICKET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </dd>
          </div>

          <div className="field">
            <dt>
              <label htmlFor="priority">Priority</label>
            </dt>
            <dd>
              <select
                id="priority"
                value={ticket.priority}
                onChange={handlePriorityChange}
                data-testid="priority-select"
              >
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </dd>
          </div>

          <div className="field">
            <dt>
              <label htmlFor="assignee">Assignee</label>
            </dt>
            <dd>
              <a className="assignee-name" href={`mailto:${ticket.assignee.email}`} data-testid="assignee-name">
                {ticket.assignee.name}
              </a>
              <select
                id="assignee"
                value={ticket.assigneeId ?? ''}
                onChange={handleAssigneeChange}
                data-testid="assignee-select"
              >
                <option value="">Unassigned</option>
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </dd>
          </div>
        </dl>

        {feedback?.type === 'success' && (
          <p className="feedback feedback-success" role="status" data-testid="feedback-success">
            {feedback.message}
          </p>
        )}
        {feedback?.type === 'error' && (
          <p className="feedback feedback-error" role="alert" data-testid="feedback-error">
            {feedback.message}
          </p>
        )}
      </article>
    </main>
  );
}
