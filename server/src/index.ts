import { createApp } from './app.ts';
import { databasePath, port } from './config.ts';
import { isEmpty, openDatabase, seedDatabase } from './db.ts';

const db = openDatabase(databasePath);
if (isEmpty(db)) {
  seedDatabase(db);
}

const app = createApp(db);

app.listen(port, () => {
  console.log(`SupportDesk API listening on http://localhost:${port}`);
});
