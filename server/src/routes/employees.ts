import { Router } from 'express';
import type { Db } from '../db.ts';
import { listEmployees } from '../repository.ts';

export function employeesRouter(db: Db): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(listEmployees(db));
  });

  return router;
}
