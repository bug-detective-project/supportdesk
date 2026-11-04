import { Router } from 'express';
import type { Db } from '../db.ts';
import { findEmployee, findTicket, listTickets, updateTicket } from '../repository.ts';
import type { TicketChanges } from '../repository.ts';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../types.ts';
import type { Ticket, TicketPriority, TicketStatus } from '../types.ts';

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function parseId(value: string): number | undefined {
  return /^\d+$/.test(value) ? Number(value) : undefined;
}

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function parseChanges(db: Db, body: unknown): TicketChanges {
  const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const changes: TicketChanges = {};

  if ('status' in input) {
    if (!isOneOf<TicketStatus>(TICKET_STATUSES, input.status)) {
      throw new HttpError(400, `status must be one of: ${TICKET_STATUSES.join(', ')}`);
    }
    changes.status = input.status;
  }

  if ('priority' in input) {
    if (!isOneOf<TicketPriority>(TICKET_PRIORITIES, input.priority)) {
      throw new HttpError(400, `priority must be one of: ${TICKET_PRIORITIES.join(', ')}`);
    }
    changes.priority = input.priority;
  }

  if ('assigneeId' in input) {
    const { assigneeId } = input;
    if (assigneeId === null) {
      changes.assigneeId = null;
    } else {
      if (!Number.isInteger(assigneeId)) {
        throw new HttpError(400, 'assigneeId must be an employee id or null');
      }
      const employee = findEmployee(db, assigneeId as number);
      if (!employee) {
        throw new HttpError(400, `Employee ${assigneeId} does not exist`);
      }
      if (!employee.active) {
        throw new HttpError(422, `${employee.name} is no longer active and cannot be assigned`);
      }
      changes.assigneeId = employee.id;
    }
  }

  return changes;
}

function withoutUnchanged(ticket: Ticket, changes: TicketChanges): TicketChanges {
  return Object.fromEntries(
    Object.entries(changes).filter(([field, value]) => ticket[field as keyof TicketChanges] !== value),
  );
}

export function ticketsRouter(db: Db): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    res.json(listTickets(db, search));
  });

  router.get('/:id', (req, res) => {
    const id = parseId(req.params.id);
    const ticket = id === undefined ? undefined : findTicket(db, id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  });

  router.patch('/:id', (req, res) => {
    const id = parseId(req.params.id);
    const ticket = id === undefined ? undefined : findTicket(db, id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    let changes: TicketChanges;
    try {
      changes = parseChanges(db, req.body);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      throw error;
    }

    updateTicket(db, ticket.id, withoutUnchanged(ticket, changes));
    res.json(findTicket(db, ticket.id));
  });

  return router;
}
