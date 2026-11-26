import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { readConfig } from './config/env.js';
import { handleError, notFound } from './middleware/errors.js';
import { catalogRepository } from './repositories/catalog.js';
import { designRepository } from './repositories/designs.js';
import { userRepository } from './repositories/users.js';
import { authService } from './services/auth.js';
import { api } from './routes/api.js';
import { studioRoutes } from './routes/studio.js';
import { failure } from './utils/response.js';
import { publicationRepository } from './repositories/publications.js';
import { publicationService } from './services/publications.js';
import { publicationRoutes } from './routes/publications.js';

export function createApp(config = readConfig(), db = null, repositories = {}) {
  const { clientOrigin, jwtSecret, secureCookies } = config;
  const clientOrigins = new Set([clientOrigin, config.publicAppUrl].filter(Boolean));
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: (origin, callback) => callback(null, clientOrigins.has(origin)), credentials: true }));
  app.use('/api', rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => failure(res, 429, 'Too many requests. Try again in a minute.'),
  }));
  const catalog = repositories.catalog ?? (db && catalogRepository(db));
  const designs = repositories.designs ?? (db && designRepository(db));
  const users = repositories.users ?? (db && userRepository(db));
  const auth = users && designs && jwtSecret ? authService(users, { jwtSecret, secureCookies }) : null;
  const publications = db && auth ? publicationService(publicationRepository(db), {
    jwtSecret, publicAppUrl: config.publicAppUrl ?? clientOrigin,
  }) : null;
  app.use('/api', publicationRoutes(publications, auth));
  app.use('/api', studioRoutes({ catalog, auth, designs, clientOrigins }));
  app.use(express.json({ limit: '128kb' }));
  app.use('/api', api);
  app.use(notFound);
  app.use(handleError);
  return app;
}
