export const TICKET_STATUSES = ['Open', 'In Progress', 'Closed'] as const;
export const TICKET_PRIORITIES = ['Low', 'Medium', 'High'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export interface Employee {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

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
