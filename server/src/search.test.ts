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

const ids = (body: { id: number }[]) => body.map((ticket) => ticket.id);

describe('search: % and _ are plain characters', () => {
  it('matches % and _ literally', async () => {
    const percent = await request(app).get('/api/tickets').query({ search: '%' });
    const underscore = await request(app).get('/api/tickets').query({ search: 't_f' });

    expect(ids(percent.body)).toEqual([8]);
    expect(ids(underscore.body)).toEqual([5]);
  });

  it('finds "100%" and "report_final" only where they appear', async () => {
    expect(ids((await request(app).get('/api/tickets').query({ search: '100%' })).body)).toEqual([8]);
    expect(ids((await request(app).get('/api/tickets').query({ search: 'report_final' })).body)).toEqual([5]);
  });
});
