import mysql from 'mysql2/promise';

export function databaseOptions(env = process.env) {
  if (env.DB_DISABLED === 'true' || !env.DB_USER) return null;
  return {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    database: env.DB_NAME || 'feelcraft_db',
    user: env.DB_USER,
    password: env.DB_PASSWORD ?? '',
    charset: 'utf8mb4',
    timezone: 'Z',
    connectTimeout: 4000,
    connectionLimit: 8,
    queueLimit: 24,
    ...(env.DB_TLS === 'true' && { ssl: { rejectUnauthorized: true } }),
  };
}

export function createDatabase(env = process.env) {
  const options = databaseOptions(env);
  return options ? mysql.createPool(options) : null;
}

export async function checkDatabase(db) {
  const [[server]] = await db.query('SELECT VERSION() AS version, DATABASE() AS databaseName');
  const maria = /mariadb/i.test(server.version);
  const match = /^(\d+)\.(\d+)(?:\.\d+)?/.exec(server.version.replace(/^5\.5\.5-/, ''));
  const major = Number(match?.[1]);
  const minor = Number(match?.[2]);
  const supported = maria ? major > 10 || (major === 10 && minor >= 4) : major >= 8;
  if (!supported) throw new Error('Configure MariaDB 10.4+ or MySQL 8+ in backend/.env.');
  return { engine: maria ? 'MariaDB' : 'MySQL', version: match[0], databaseName: server.databaseName };
}
