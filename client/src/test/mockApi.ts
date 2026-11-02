import { vi } from 'vitest';
import type { Employee } from '../api/employees.ts';

/** A ticket as the real API returns it. */
export interface ApiTicket {
  id: number;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  assigneeId: number | null;
  assignee: Employee | null;
  createdAt: string;
  updatedAt: string;
}

export const testEmployees: Employee[] = [
  { id: 1, name: 'Maya Chen', email: 'maya.chen@supportdesk.example', active: true },
  { id: 2, name: 'Daniel Okafor', email: 'daniel.okafor@supportdesk.example', active: true },
  { id: 4, name: 'Lucas Moreau', email: 'lucas.moreau@supportdesk.example', active: false },
];

function ticket(id: number, title: string, assigneeId: number | null, overrides: Partial<ApiTicket> = {}): ApiTicket {
  return {
    id,
    title,
    description: `Description of ticket ${id}.`,
    status: 'Open',
    priority: 'Medium',
    assigneeId,
    assignee: testEmployees.find((employee) => employee.id === assigneeId) ?? null,
    createdAt: '2025-03-01T10:00:00.000Z',
    updatedAt: '2025-03-01T10:00:00.000Z',
    ...overrides,
  };
}

export function createTestTickets(): ApiTicket[] {
  return [
    ticket(1, 'Login page times out', 1, { priority: 'High' }),
    ticket(2, 'Invoice shows wrong address', 2, { status: 'In Progress' }),
    ticket(3, 'Password reset email never arrives', 2, { priority: 'High' }),
    ticket(4, 'Dark mode setting resets', null, { priority: 'Low' }),
    ticket(5, 'Cannot login with SSO', 1, { status: 'Closed' }),
  ];
}

export interface MockRequest {
  method: string;
  path: string;
  search: string;
  body: unknown;
}

export interface MockApiOptions {
  /** Return a response (or a promise of one) to override the default handling of a request. */
  respond?: (request: MockRequest) => Response | undefined | Promise<Response | undefined>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Replaces the global fetch with an in-memory version of the SupportDesk API.
 * Returns the mock so tests can inspect the requests that were made.
 */
export function mockApi(options: MockApiOptions = {}) {
  const tickets = createTestTickets();

  function handle(request: MockRequest): Response {
    const match = request.path.match(/^\/api\/tickets\/(\d+)$/);
    const found = match ? tickets.find((item) => item.id === Number(match[1])) : undefined;

    if (request.method === 'GET' && request.path === '/api/employees') {
      return json(testEmployees);
    }
    if (request.method === 'GET' && request.path === '/api/tickets') {
      const term = new URLSearchParams(request.search).get('search')?.toLowerCase() ?? '';
      return json(tickets.filter((item) => item.title.toLowerCase().includes(term)));
    }
    if (match && !found) {
      return json({ error: 'Ticket not found' }, 404);
    }
    if (request.method === 'GET' && found) {
      return json(found);
    }
    if (request.method === 'PATCH' && found) {
      const body = (request.body ?? {}) as Record<string, unknown>;
      if ('assigneeId' in body && body.assigneeId !== null) {
        const employee = testEmployees.find((item) => item.id === body.assigneeId);
        if (!employee) {
          return json({ error: 'Employee does not exist' }, 400);
        }
        if (!employee.active) {
          return json({ error: `${employee.name} is no longer active and cannot be assigned` }, 422);
        }
      }
      if ('status' in body) found.status = body.status as ApiTicket['status'];
      if ('priority' in body) found.priority = body.priority as ApiTicket['priority'];
      if ('assigneeId' in body) {
        found.assigneeId = body.assigneeId as number | null;
        found.assignee = testEmployees.find((item) => item.id === found.assigneeId) ?? null;
      }
      return json(found);
    }
    return json({ error: 'Not found' }, 404);
  }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost');
    const request: MockRequest = {
      method: (init?.method ?? 'GET').toUpperCase(),
      path: url.pathname,
      search: url.search,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    return (await options.respond?.(request)) ?? handle(request);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Requests made through the mock, in order. */
export function requestsOf(fetchMock: ReturnType<typeof mockApi>): MockRequest[] {
  return fetchMock.mock.calls.map(([input, init]) => {
    const url = new URL(String(input), 'http://localhost');
    return {
      method: (init?.method ?? 'GET').toUpperCase(),
      path: url.pathname,
      search: url.search,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
  });
}
