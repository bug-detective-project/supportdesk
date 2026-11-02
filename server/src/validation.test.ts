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

const STATUSES = ['Open', 'In Progress', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High'];

describe('status and priority keep their exact values', () => {
  it('never saves a status in another capitalization', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ status: 'closed' });
    const saved = (await request(app).get('/api/tickets/3')).body;

    expect(STATUSES).toContain(saved.status);
    if (response.status === 200) {
      expect(response.body.status).toBe('Closed');
    } else {
      expect(response.status).toBe(400);
    }
  });

  it('never saves a priority in another capitalization', async () => {
    const response = await request(app).patch('/api/tickets/3').send({ priority: 'low' });
    const saved = (await request(app).get('/api/tickets/3')).body;

    expect(PRIORITIES).toContain(saved.priority);
    if (response.status === 200) {
      expect(response.body.priority).toBe('Low');
    } else {
      expect(response.status).toBe(400);
    }
  });
});
