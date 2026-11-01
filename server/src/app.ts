import express from 'express';
import type { ErrorRequestHandler, Express } from 'express';
import type { Db } from './db.ts';
import { employeesRouter } from './routes/employees.ts';
import { ticketsRouter } from './routes/tickets.ts';

export function createApp(db: Db): Express {
  const app = express();

  app.use(express.json());
  app.use('/api/tickets', ticketsRouter(db));
  app.use('/api/employees', employeesRouter(db));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(handleErrors);

  return app;
}

const handleErrors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'Request body must be valid JSON' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
};
