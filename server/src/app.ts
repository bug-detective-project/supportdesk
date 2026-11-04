import express from 'express';
import type { ErrorRequestHandler, Express, RequestHandler } from 'express';
import type { Db } from './db.ts';
import { employeesRouter } from './routes/employees.ts';
import { ticketsRouter } from './routes/tickets.ts';

export function createApp(db: Db): Express {
  const app = express();

  app.use(allowedHost);
  app.use(express.json());
  app.use('/api/tickets', ticketsRouter(db));
  app.use('/api/employees', employeesRouter(db));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(handleErrors);

  return app;
}

/** Hosts the API answers; the port is ignored. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * The app runs on the player's computer and only the local client talks to it: a page on the
 * internet that reaches the API through the browser sends another Host, and gets 403.
 */
const allowedHost: RequestHandler = (req, res, next) => {
  const host = req.headers.host ?? '';
  const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.replace(/:\d+$/, '');
  if (LOCAL_HOSTS.has(name.toLowerCase())) {
    next();
    return;
  }
  res.status(403).json({ error: 'Forbidden host' });
};

const handleErrors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'Request body must be valid JSON' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
};
