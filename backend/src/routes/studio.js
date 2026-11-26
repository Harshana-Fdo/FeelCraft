import { Router, json } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController, designController } from '../controllers/studio.js';
import { failure, success } from '../utils/response.js';

export function studioRoutes({ catalog, auth, designs, clientOrigins }) {
  const router = Router();
  const unavailable = (_req, res) => failure(res, 503, 'Database-backed features are unavailable.');
  router.get('/categories', catalog ? async (_req, res) => success(res, 'Categories', await catalog.categories()) : unavailable);
  router.get('/categories/:slug', catalog ? async (req, res) => {
    const category = (await catalog.categories()).find(item => item.slug === req.params.slug);
    return category ? success(res, 'Category', category) : failure(res, 404, 'Category not found.');
  } : unavailable);
  router.get('/templates', catalog ? async (_req, res) => success(res, 'Templates', await catalog.templates()) : unavailable);
  router.get('/templates/category/:slug', catalog ? async (req, res) => {
    const templates = (await catalog.templates()).filter(template => template.category === req.params.slug);
    return success(res, 'Templates', templates);
  } : unavailable);
  router.get('/templates/:slug', catalog ? async (req, res) => {
    const [template] = await catalog.templates(req.params.slug);
    return template ? success(res, 'Template', template) : failure(res, 404, 'Template not found.');
  } : unavailable);

  if (!auth) {
    router.use(['/auth', '/designs'], unavailable);
    return router;
  }

  const endpoints = authController(auth);
  const session = Router();
  session.use((req, res, next) => {
    const origin = req.get('Origin');
    if (!clientOrigins.has(origin) && (origin || req.get('Sec-Fetch-Site') === 'cross-site')) {
      return failure(res, 403, 'Request origin is not allowed.');
    }
    res.set('Cache-Control', 'no-store');
    return next();
  });
  const loginLimit = rateLimit({
    windowMs: 15 * 60_000, limit: 16, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_req, res) => failure(res, 429, 'Too many attempts. Try again later.'),
  });
  session.use(json({ limit: '16kb' }));
  session.post('/register', loginLimit, endpoints.register);
  session.post('/login', loginLimit, endpoints.login);
  session.post('/refresh', endpoints.refresh);
  session.post('/logout', endpoints.logout);
  session.patch('/profile', endpoints.profile);
  router.use('/auth', session);

  const drafts = Router();
  drafts.use((req, res, next) => {
    req.owner = auth.verify(req.get('Authorization'));
    if (!req.owner) return failure(res, 401, 'Sign in to access your drafts.');
    res.set('Cache-Control', 'no-store');
    return next();
  });
  drafts.use(json({ limit: '4mb' }));
  const actions = designController(designs, catalog);
  drafts.route('/').get(actions.list).post(actions.create);
  drafts.route('/:id').get(actions.get).put(actions.save).delete(actions.remove);
  drafts.post('/:id/duplicate', actions.duplicate);
  router.use('/designs', drafts);
  return router;
}
