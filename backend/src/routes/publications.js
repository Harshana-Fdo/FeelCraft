import { Router, json } from 'express';
import { rateLimit } from 'express-rate-limit';
import { failure, success } from '../utils/response.js';
import { uuid } from '../validators/design.js';
import { publicationOptions, publicationPrivacy, reportReasons, shareToken } from '../services/publications.js';

const recipientErrors = {
  missing: [404, 'This message is unavailable.'],
  unpublished: [404, 'This message was unpublished.'],
  revoked: [410, 'This link was revoked.'],
  expired: [410, 'This link has expired.'],
  locked: [401, 'Enter the message password.'],
  incorrect: [401, 'That password is incorrect.'],
};

function limiter(windowMs, limit) {
  return rateLimit({ windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_req, res) => failure(res, 429, 'Too many requests. Please try again later.') });
}

export function publicationRoutes(publications, auth) {
  const router = Router();
  const privateRoutes = Router();
  const recipientRoutes = Router();
  const missing = res => failure(res, 404, 'Publication or design not found.');

  recipientRoutes.use((_req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer' });
    next();
  });
  if (!publications) {
    const unavailable = (_req, res) => failure(res, 503, 'Publishing is unavailable right now.');
    router.use('/publications', unavailable);
    router.use('/messages', recipientRoutes, unavailable);
    return router;
  }

  privateRoutes.use((req, res, next) => {
    req.owner = auth.verify(req.get('Authorization'));
    if (!req.owner) return failure(res, 401, 'Sign in to manage publications.');
    res.set('Cache-Control', 'no-store');
    return next();
  }, json({ limit: '16kb' }));
  privateRoutes.get('/', async (req, res) => {
    const { design } = req.query;
    if (design !== undefined && !uuid(design)) return failure(res, 400, 'Invalid design.');
    return success(res, 'Publications', await publications.list(req.owner, design));
  });
  privateRoutes.post('/', limiter(600_000, 16), async (req, res) => {
    const input = publicationOptions(req.body);
    if (!input || !uuid(req.body.designId)) return failure(res, 400, 'Check the message title, signature, password and expiration.');
    const entry = await publications.publish(req.owner, req.body.designId, input);
    if (entry?.invalid) return failure(res, 400, 'The current design cannot be published.');
    return entry ? success(res.status(201), 'Message published', entry) : missing(res);
  });
  privateRoutes.get('/:id/preview', async (req, res) => {
    const entry = uuid(req.params.id) && await publications.preview(req.owner, req.params.id);
    return entry ? success(res, 'Publication snapshot', entry) : missing(res);
  });
  privateRoutes.patch('/:id/privacy', async (req, res) => {
    if (!uuid(req.params.id)) return missing(res);
    const input = publicationPrivacy(req.body);
    if (!input || (!input.changeExpiry && !input.changePassword)) return failure(res, 400, 'Enter a valid password or future expiration.');
    const entry = await publications.privacy(req.owner, req.params.id, input);
    return entry ? success(res, 'Privacy updated', entry) : missing(res);
  });
  for (const [action, state] of [['revoke', 'revoked'], ['unpublish', 'unpublished']]) {
    privateRoutes.post('/:id/' + action, async (req, res) => {
      const entry = uuid(req.params.id) && await publications.close(req.owner, req.params.id, state);
      return entry ? success(res, 'Link closed', entry) : missing(res);
    });
  }
  privateRoutes.delete('/:id', async (req, res) => {
    const removed = uuid(req.params.id) && await publications.remove(req.owner, req.params.id);
    return removed ? success(res, 'Publication deleted', null) : missing(res);
  });

  recipientRoutes.use(json({ limit: '8kb' }));
  async function access(req, res, options, onSuccess) {
    const token = req.params.token;
    const bearer = /^Bearer (\S+)$/.exec(req.get('Authorization') || '')?.[1];
    const result = shareToken(token) ? await publications.recipient(token, { access: bearer, ...options }) : { error: 'missing' };
    if (result.error) {
      const [status, message] = recipientErrors[result.error];
      return res.status(status).json({ success: false, code: result.error, message, errors: [] });
    }
    return onSuccess(result);
  }

  recipientRoutes.get('/:token', (req, res) => access(req, res, { reveal: true },
    result => success(res, 'Message ready', { message: result.message })));
  recipientRoutes.post('/:token/unlock', limiter(900_000, 12), (req, res) => {
    if (typeof req.body?.password !== 'string') return failure(res, 400, 'Enter the message password.');
    return access(req, res, { reveal: true, password: req.body.password },
      result => success(res, 'Message unlocked', { message: result.message, access: result.access }));
  });
  recipientRoutes.post('/:token/views', (req, res) => access(req, res, {}, async ({ row }) => {
    await publications.view(row);
    return success(res, 'View recorded', null);
  }));
  recipientRoutes.post('/:token/reports', limiter(3_600_000, 10), (req, res) => {
    const { reason, details = '' } = req.body || {};
    if (!reportReasons.includes(reason) || typeof details !== 'string' || details.length > 500) return failure(res, 400, 'Choose a report reason and keep details under 500 characters.');
    return access(req, res, {}, async ({ row }) => {
      const recorded = await publications.report(row, reason, details.trim());
      return recorded ? success(res.status(201), 'Report received', null) : failure(res, 410, 'This message is no longer available.');
    });
  });

  router.use('/publications', privateRoutes);
  router.use('/messages', recipientRoutes);
  return router;
}
