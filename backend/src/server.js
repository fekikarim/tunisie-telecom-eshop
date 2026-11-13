import { config } from './config.js';
import { openDatabase } from './db.js';
import { seedIfEmpty } from './seed.js';
import { createApp } from './app.js';

const db = openDatabase();
if (seedIfEmpty(db)) console.log('[seed] Demo data inserted into a new database');

const app = createApp(db);
app.listen(config.port, () => {
  console.log(`[api] Tunisie Telecom API listening on http://localhost:${config.port}`);
  console.log(`[db]  SQLite file: ${config.dbPath}`);
});

const shutdown = () => {
  db.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
