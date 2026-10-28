import { rmSync } from 'node:fs';
import { databasePath } from '../config.ts';
import { openDatabase, seedDatabase } from '../db.ts';

for (const suffix of ['', '-journal', '-wal', '-shm']) {
  rmSync(databasePath + suffix, { force: true });
}

const db = openDatabase(databasePath);
seedDatabase(db);
db.close();

console.log(`Database reset: ${databasePath}`);
