import { readdir, readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import './env.js';
import { checkDatabase, databaseOptions } from './database.js';

const migrations = new URL('../../../database/migrations/', import.meta.url);

async function migrate() {
  const options = databaseOptions();
  if (!options) throw new Error('Set DB_USER and your connection settings in backend/.env first.');
  const db = await mysql.createConnection({ ...options, multipleStatements: true });
  try {
    const server = await checkDatabase(db);
    console.log(`Connected to ${server.databaseName} on ${server.engine} ${server.version}.`);
    const [[lock]] = await db.execute("SELECT GET_LOCK('feelcraft_schema_migrations', 10) AS acquired");
    if (lock.acquired !== 1) throw new Error('Could not acquire the database migration lock.');
    await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(160) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    for (const name of (await readdir(migrations)).filter(file => /^\d+_[\w]+\.sql$/.test(file)).sort()) {
      const [existing] = await db.execute('SELECT name FROM schema_migrations WHERE name = ?', [name]);
      if (existing.length) continue;
      await db.query(await readFile(new URL(name, migrations), 'utf8'));
      await db.execute('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
      console.log(`Applied ${name}`);
    }
    console.log('FeelCraft database migrations are current.');
  } finally {
    await db.end();
  }
}

migrate().catch(error => {
  console.error(`Migration failed: ${error.code || error.message}`);
  process.exitCode = 1;
});
