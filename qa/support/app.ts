import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

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
  status: string;
  priority: string;
  assigneeId: number | null;
  assignee: Employee | null;
}

export async function getTicket(request: APIRequestContext, id: number): Promise<Ticket> {
  const response = await request.get(`/api/tickets/${id}`);
  expect(response.status(), `GET /api/tickets/${id}`).toBe(200);
  return response.json();
}

export async function listTickets(request: APIRequestContext, search = ''): Promise<Ticket[]> {
  const response = await request.get('/api/tickets', { params: search ? { search } : {} });
  expect(response.status(), 'GET /api/tickets').toBe(200);
  return response.json();
}

export async function listEmployees(request: APIRequestContext): Promise<Employee[]> {
  const response = await request.get('/api/employees');
  expect(response.status(), 'GET /api/employees').toBe(200);
  return response.json();
}

/** Asserts that the details screen shows the given ticket. */
export async function expectShowsTicket(page: Page, ticket: Ticket): Promise<void> {
  await expect(page.getByTestId('ticket-id')).toHaveText(String(ticket.id));
  await expect(page.getByTestId('ticket-title')).toHaveText(ticket.title);
  await expect(page.getByTestId('ticket-description')).toHaveText(ticket.description);
}

/** The ticket id in the current details URL. */
export function ticketIdFromUrl(page: Page): number {
  const match = new URL(page.url()).pathname.match(/^\/tickets\/(\d+)$/);
  expect(match, `details URL, got ${page.url()}`).not.toBeNull();
  return Number(match![1]);
}

/** Collects uncaught page errors (for example a TypeError that blanks the page). */
export function collectPageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
}

/** Waits until the browser has rendered at least two more frames. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}
