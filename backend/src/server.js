import { createApp } from './app.js';
import { readConfig } from './config/env.js';
import { checkDatabase, createDatabase } from './config/database.js';

const config = readConfig();
let database = createDatabase();
if (database) {
  try {
    const server = await checkDatabase(database);
    console.log(`Connected to ${server.databaseName} on ${server.engine} ${server.version}.`);
  } catch (error) {
    console.warn(`Database unavailable: ${error.code || error.message}`);
    await database.end();
    database = null;
  }
}
const server = createApp(config, database).listen(config.port, config.host);

server.on('listening', () => {
  console.log(`FeelCraft API listening at http://${config.host}:${config.port}/api/health`);
  if (!database) console.log('Database unavailable. The frontend will offer local drafts.');
  else if (!config.jwtSecret) console.log('JWT_ACCESS_SECRET is unconfigured. Account access is disabled.');
});

server.on('error', (error) => {
  console.error(`Unable to start FeelCraft API: ${error.message}`);
  process.exitCode = 1;
});
