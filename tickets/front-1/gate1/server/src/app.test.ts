import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.ts';
import { openDatabase, seedDatabase } from './db.ts';
import type { Db } from './db.ts';

let db: Db;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = openDatabase(':memory:');
  seedDatabase(db);
  app = createApp(db);
});

afterEach(() => {
  db.close();
});

describe('GET /api/tickets', () => {
  it('returns all tickets ordered by id', async () => {
    const response = await request(app).get('/api/tickets');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(15);
    expect(response.body.map((ticket: { id: number }) => ticket.id)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );
  });

  it('includes the assignee in each ticket', async () => {
    const response = await request(app).get('/api/tickets');
    const [first] = response.body;

    expect(first).toMatchObject({
      id: 1,
      title: 'Login page times out on mobile Safari',
      status: 'Open',
      priority: 'High',
      assigneeId: 1,
      assignee: { id: 1, name: 'Maya Chen', email: 'maya.chen@supportdesk.example', active: true },
    });
  });

  it('filters by title, case-insensitive and partial', async () => {
    const response = await request(app).get('/api/tickets').query({ search: 'LOGIN' });

    expect(response.body.map((ticket: { id: number }) => ticket.id)).toEqual([1, 6]);
  });

  it('matches % and _ literally', async () => {
    const percent = await request(app).get('/api/tickets').query({ search: '%' });
    const underscore = await request(app).get('/api/tickets').query({ search: 't_f' });

    expect(percent.body.map((ticket: { id: number }) => ticket.id)).toEqual([8]);
    expect(underscore.body.map((ticket: { id: number }) => ticket.id)).toEqual([5]);
  });

  it('returns an empty list when nothing matches', async () => {
    const response = await request(app).get('/api/tickets').query({ search: 'no such ticket' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe('GET /api/tickets/:id', () => {
  it('returns one ticket', async () => {
    const response = await request(app).get('/api/tickets/3');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 3,
      title: 'Password reset email never arrives',
      assigneeId: 3,
      assignee: { id: 3, name: 'Priya Raman' },
    });
  });

  it('returns 404 for an unknown id', async () => {
    const response = await request(app).get('/api/tickets/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Ticket not found' });
  });

  it('returns 404 for a non-numeric id', async () => {
    const response = await request(app).get('/api/tickets/abc');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});

describe('PATCH /api/tickets/:id', () => {
  it('updates the status', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ status: 'Closed' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Closed');
    expect((await request(app).get('/api/tickets/3')).body.status).toBe('Closed');
  });

  it('updates the priority', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ priority: 'Low' });

    expect(response.status).toBe(200);
    expect(response.body.priority).toBe('Low');
    expect((await request(app).get('/api/tickets/3')).body.priority).toBe('Low');
  });

  it('assigns an active employee', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ assigneeId: 5 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ assigneeId: 5, assignee: { id: 5, name: 'Sofia Alvarez' } });
  });

  it('unassigns with null', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ assigneeId: null });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ assigneeId: null, assignee: null });
  });

  it('updates updatedAt when something changes', async () => {
    const before = (await request(app).get('/api/tickets/3')).body.updatedAt;
    const response = await request(app).patch('/api/tickets/3').send({ status: 'Closed' });

    expect(response.body.updatedAt).not.toBe(before);
  });

  it('rejects an invalid status', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ status: 'Done' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('rejects an invalid priority', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ priority: 'Urgent' });

    expect(response.status).toBe(400);
    expect((await request(app).get('/api/tickets/3')).body.priority).toBe('High');
  });

  it('rejects an inactive employee with 422', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ assigneeId: 4 });

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('error');
    expect((await request(app).get('/api/tickets/3')).body.assigneeId).toBe(3);
  });

  it('rejects an unknown employee with 400', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ assigneeId: 99 });

    expect(response.status).toBe(400);
  });

  it('ignores unknown fields and returns the current ticket', async () => {
    const before = (await request(app).get('/api/tickets/3')).body;
    const response = await request(app).patch('/api/tickets/3').send({ color: 'blue' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(before);
  });

  it('returns 404 for an unknown ticket', async () => {
    const response = await request(app).patch('/api/tickets/999').send({ status: 'Closed' });

    expect(response.status).toBe(404);
  });
});

describe('GET /api/employees', () => {
  it('returns all employees with their active flag', async () => {
    const response = await request(app).get('/api/employees');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
    expect(response.body.filter((employee: { active: boolean }) => !employee.active)).toHaveLength(1);
    expect(response.body[0]).toEqual({
      id: 1,
      name: 'Maya Chen',
      email: 'maya.chen@supportdesk.example',
      active: true,
    });
  });
});
