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

describe('tickets without an assignee', () => {
  it('returns all tickets ordered by id, assigned or not', async () => {
    const response = await request(app).get('/api/tickets');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(15);
    expect(response.body.map((ticket: { id: number }) => ticket.id)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );
    expect(response.body.some((ticket: { assigneeId: number | null }) => ticket.assigneeId === null)).toBe(true);
  });

  it('opens an unassigned ticket by id', async () => {
    const list = await request(app).get('/api/tickets');
    const unassigned = list.body.find((ticket: { assigneeId: number | null }) => ticket.assigneeId === null);

    const response = await request(app).get(`/api/tickets/${unassigned.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: unassigned.id, assigneeId: null, assignee: null });
  });

  it('unassigns with null', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ assigneeId: null });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ assigneeId: null, assignee: null });
  });
});
