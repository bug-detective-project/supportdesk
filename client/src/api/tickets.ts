import type { Employee } from './employees.ts';

export const TICKET_STATUSES = ['Open', 'In Progress', 'Closed'] as const;
export const TICKET_PRIORITIES = ['Low', 'Medium', 'High'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: number | null;
  assignee: Employee | null;
  createdAt: string;
  updatedAt: string;
}

/** Values as they come from the details form controls. */
export interface TicketFormValues {
  status?: TicketStatus;
  priorityLevel?: TicketPriority;
  /** Employee id as a string, or an empty string for "Unassigned". */
  assignee?: string;
}

export class TicketNotFoundError extends Error {}

export async function fetchTickets(search = '', signal?: AbortSignal): Promise<Ticket[]> {
  const query = search ? `?${new URLSearchParams({ search })}` : '';
  const response = await fetch(`/api/tickets${query}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load tickets (${response.status})`);
  }
  return response.json();
}

export async function fetchTicket(id: number, signal?: AbortSignal): Promise<Ticket> {
  const response = await fetch(`/api/tickets/${id}`, { signal });
  if (response.status === 404) {
    throw new TicketNotFoundError(`Ticket ${id} not found`);
  }
  if (!response.ok) {
    throw new Error(`Failed to load ticket ${id} (${response.status})`);
  }
  return response.json();
}

/** Maps form values to the body expected by PATCH /api/tickets/:id. */
export function toTicketPatch(values: TicketFormValues) {
  return {
    ...(values.status !== undefined && { status: values.status }),
    ...(values.priorityLevel !== undefined && { priorityLevel: values.priorityLevel }),
    ...(values.assignee !== undefined && {
      assigneeId: values.assignee === '' ? null : Number(values.assignee),
    }),
  };
}

export function updateTicket(id: number, values: TicketFormValues): Promise<Response> {
  return fetch(`/api/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toTicketPatch(values)),
  });
}

export async function readErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const body = await response.json();
    return typeof body?.error === 'string' ? body.error : undefined;
  } catch {
    return undefined;
  }
}
