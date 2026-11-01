import type { Db } from './db.ts';
import type { Employee, Ticket, TicketPriority, TicketStatus } from './types.ts';

interface TicketRow {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: number | null;
  createdAt: string;
  updatedAt: string;
  assigneeName: string | null;
  assigneeEmail: string | null;
  assigneeActive: number | null;
}

interface EmployeeRow {
  id: number;
  name: string;
  email: string;
  active: number;
}

export interface TicketChanges {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: number | null;
}

const selectTickets = `
  SELECT t.id, t.title, t.description, t.status, t.priority, t.assigneeId, t.createdAt, t.updatedAt,
         e.name AS assigneeName, e.email AS assigneeEmail, e.active AS assigneeActive
  FROM tickets t
  LEFT JOIN employees e ON e.id = t.assigneeId
`;

function toTicket(row: TicketRow): Ticket {
  const { assigneeName, assigneeEmail, assigneeActive, ...ticket } = row;
  return {
    ...ticket,
    assignee:
      row.assigneeId === null
        ? null
        : {
            id: row.assigneeId,
            name: assigneeName ?? '',
            email: assigneeEmail ?? '',
            active: assigneeActive === 1,
          },
  };
}

function toEmployee(row: EmployeeRow): Employee {
  return { ...row, active: row.active === 1 };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function listTickets(db: Db, search = ''): Ticket[] {
  const term = search.trim();
  const rows = term
    ? db
        .prepare(`${selectTickets} WHERE t.title LIKE ? ESCAPE '\\' ORDER BY t.id`)
        .all(`%${escapeLike(term)}%`)
    : db.prepare(`${selectTickets} ORDER BY t.id`).all();
  return (rows as TicketRow[]).map(toTicket);
}

export function findTicket(db: Db, id: number): Ticket | undefined {
  const row = db.prepare(`${selectTickets} WHERE t.id = ?`).get(id) as TicketRow | undefined;
  return row && toTicket(row);
}

export function updateTicket(db: Db, id: number, changes: TicketChanges): void {
  const entries = Object.entries(changes);
  if (entries.length === 0) {
    return;
  }
  const assignments = entries.map(([field]) => `${field} = @${field}`).join(', ');
  db.prepare(`UPDATE tickets SET ${assignments}, updatedAt = @updatedAt WHERE id = @id`).run({
    ...changes,
    updatedAt: new Date().toISOString(),
    id,
  });
}

export function listEmployees(db: Db): Employee[] {
  const rows = db.prepare('SELECT id, name, email, active FROM employees ORDER BY id').all();
  return (rows as EmployeeRow[]).map(toEmployee);
}

export function findEmployee(db: Db, id: number): Employee | undefined {
  const row = db.prepare('SELECT id, name, email, active FROM employees WHERE id = ?').get(id) as
    | EmployeeRow
    | undefined;
  return row && toEmployee(row);
}
