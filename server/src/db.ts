import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { employees, tickets } from './seed.ts';

export type Db = Database.Database;

export const DEFAULT_DATABASE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../data/supportdesk.db',
);

const schema = `
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Closed')),
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    assigneeId INTEGER REFERENCES employees(id),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`;

export function openDatabase(path: string): Db {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  db.exec(schema);
  return db;
}

export function seedDatabase(db: Db): void {
  const insertEmployee = db.prepare(
    'INSERT INTO employees (id, name, email, active) VALUES (@id, @name, @email, @active)',
  );
  const insertTicket = db.prepare(`
    INSERT INTO tickets (id, title, description, status, priority, assigneeId, createdAt, updatedAt)
    VALUES (@id, @title, @description, @status, @priority, @assigneeId, @createdAt, @updatedAt)
  `);

  db.transaction(() => {
    db.exec('DELETE FROM tickets; DELETE FROM employees;');
    for (const employee of employees) {
      insertEmployee.run({ ...employee, active: employee.active ? 1 : 0 });
    }
    for (const ticket of tickets) {
      insertTicket.run(ticket);
    }
  })();
}

export function isEmpty(db: Db): boolean {
  const row = db.prepare('SELECT COUNT(*) AS count FROM tickets').get() as { count: number };
  return row.count === 0;
}
