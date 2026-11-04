import { DEFAULT_DATABASE_PATH } from './db.ts';

export const port = Number(process.env.PORT ?? 3001);
export const databasePath = process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH;
