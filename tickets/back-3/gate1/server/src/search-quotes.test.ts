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

describe('search: quotes are plain characters', () => {
  it('searches for O\'Brien without an error', async () => {
    const response = await request(app).get('/api/tickets').query({ search: 'O\'Brien' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('does not run SQL typed into the search box', async () => {
    const response = await request(app).get('/api/tickets').query({ search: '\' OR \'1\'=\'1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
