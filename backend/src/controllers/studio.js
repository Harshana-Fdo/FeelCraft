import { randomUUID } from 'node:crypto';
import { failure, success } from '../utils/response.js';
import { uuid, validateDraft } from '../validators/design.js';

function credentials(body, registration) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = body?.password;
  if ((registration && (!name || name.length > 80)) || email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' ||
    password.length < 8 || Buffer.byteLength(password) > 72) return null;
  return { name, email, password };
}

export function authController(auth) {
  return {
    async profile(req, res) {
      const owner = auth.verify(req.get('Authorization'));
      if (!owner) return failure(res, 401, 'Sign in to update your profile.');
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      if (!name || name.length > 80) return failure(res, 400, 'Enter a name of 1 to 80 characters.');
      const user = await auth.rename(owner, name);
      return user ? success(res, 'Profile saved', user) : failure(res, 401, 'Account unavailable.');
    },
    async register(req, res) {
      const input = credentials(req.body, true);
      if (!input) return failure(res, 400, 'Enter a name, a valid email and a password of 8 characters to 72 UTF-8 bytes.');
      try {
        const data = await auth.register(res, input);
        return success(res.status(201), 'Account created', data);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return failure(res, 409, 'An account already uses this email.');
        throw error;
      }
    },
    async login(req, res) {
      const input = credentials(req.body, false);
      const data = input && await auth.login(res, input);
      return data ? success(res, 'Signed in', data) : failure(res, 401, 'Email or password is incorrect.');
    },
    async refresh(req, res) {
      const data = await auth.refresh(req, res);
      return data ? success(res, 'Session refreshed', data) : failure(res, 401, 'Sign in to continue.');
    },
    async logout(req, res) {
      await auth.logout(req, res);
      return success(res, 'Signed out', null);
    },
  };
}

export function designController(designs, catalog) {
  const missing = res => failure(res, 404, 'Draft not found.');
  const invalid = res => failure(res, 400, 'The draft contains an invalid layer, background or setting.');

  return {
    async list(req, res) {
      return success(res, 'Your drafts', await designs.list(req.owner));
    },
    async get(req, res) {
      const draft = uuid(req.params.id) && await designs.get(req.owner, req.params.id);
      return draft ? success(res, 'Draft loaded', draft) : missing(res);
    },
    async create(req, res) {
      if (!validateDraft(req.body)) return invalid(res);
      const { title, templateSlug, document } = req.body;
      if (templateSlug && !(await catalog.templates(templateSlug)).length) return failure(res, 404, 'Template not found.');
      const draft = await designs.create(req.owner, { id: randomUUID(), title: title.trim(), templateSlug: templateSlug || null, document });
      return success(res.status(201), 'Draft created', draft);
    },
    async save(req, res) {
      if (!uuid(req.params.id)) return missing(res);
      if (!validateDraft(req.body, true)) return invalid(res);
      const result = await designs.update(req.owner, req.params.id, { ...req.body, title: req.body.title.trim() });
      if (result?.conflict) return failure(res, 409, 'This draft changed in another session. Reopen it before editing further.');
      return result ? success(res, 'Draft saved', result) : missing(res);
    },
    async duplicate(req, res) {
      const original = uuid(req.params.id) && await designs.get(req.owner, req.params.id);
      if (!original) return missing(res);
      const draft = await designs.create(req.owner, { ...original, id: randomUUID(), title: original.title.slice(0, 93) + ' (copy)' });
      return success(res.status(201), 'Draft duplicated', draft);
    },
    async remove(req, res) {
      const removed = uuid(req.params.id) && await designs.remove(req.owner, req.params.id);
      return removed ? success(res, 'Draft deleted', null) : missing(res);
    },
  };
}
