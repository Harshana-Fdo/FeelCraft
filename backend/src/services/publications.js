import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validateDraft } from '../validators/design.js';

const moods = ['love', 'anger', 'sadness', 'apology', 'secret-crush'];
const openings = ['envelope', 'unfold', 'fade'];
const effects = ['none', 'hearts', 'embers', 'rain', 'petals', 'stars', 'butterflies'];
const identities = ['named', 'signature', 'anonymous'];
const string = (value, max) => typeof value === 'string' && value.length <= max;
const read = value => typeof value === 'string' ? JSON.parse(value) : value;
const jwtOptions = { issuer: 'feelcraft', audience: 'feelcraft-recipient' };
const geometry = ['id', 'type', 'x', 'y', 'width', 'rotation', 'opacity', 'locked', 'visible'];
const layerContent = {
  text: ['content', 'fontSize', 'fontFamily', 'fill', 'align'],
  image: ['height', 'src'], shape: ['height', 'shape', 'fill'], decoration: ['height', 'asset'],
};

function publicDocument(document, signature, { openingAnimation, backgroundEffect }) {
  const { width, height, background: { type, value } } = document.canvas;
  const elements = document.elements.filter(layer => layer.visible && (layer.id !== 'signature' || signature)).map(layer => {
    const copy = Object.fromEntries([...geometry, ...layerContent[layer.type]]
      .filter(key => layer[key] !== undefined).map(key => [key, layer[key]]));
    if (layer.animation) {
      const { type, duration, delay } = layer.animation;
      copy.animation = { type, duration, delay };
    }
    if (layer.id === 'signature' && layer.type === 'text') copy.content = signature;
    return copy;
  });
  return { schemaVersion: 1, canvas: { width, height, background: { type, value } }, elements,
    experience: { openingAnimation, backgroundEffect, music: null } };
}

export const shareToken = token => typeof token === 'string' && /^[\w-]{43}$/.test(token);
export const reportReasons = ['harassment', 'threat', 'impersonation', 'other'];

export function publicationPrivacy(body) {
  const password = body?.password;
  if (password != null && (!string(password, 72) || (password !== '' && (password.trim().length < 4 || Buffer.byteLength(password) > 72)))) return null;
  const expiration = body?.expiresAt;
  if (expiration != null && (typeof expiration !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(expiration))) return null;
  const expiresAt = expiration ? new Date(expiration) : null;
  if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) return null;
  return { expiresAt, password, changeExpiry: expiration !== undefined, changePassword: password !== undefined };
}

export function publicationOptions(body) {
  const privacy = publicationPrivacy(body);
  if (!body || !privacy || !string(body.title, 100) || !body.title.trim() ||
    !string(body.recipient ?? '', 80) || !string(body.sender ?? '', 80) || !string(body.signature ?? '', 120) ||
    !moods.includes(body.category) || !openings.includes(body.openingAnimation) ||
    !effects.includes(body.backgroundEffect) || !identities.includes(body.identity) ||
    ![null, 'ambient'].includes(body.music ?? null) ||
    (body.identity === 'signature' && !body.signature?.trim())) return null;
  return {
    ...privacy, title: body.title.trim(), recipient: body.recipient?.trim() || '',
    sender: body.sender?.trim(), signature: body.signature?.trim(), identity: body.identity,
    category: body.category, openingAnimation: body.openingAnimation,
    backgroundEffect: body.backgroundEffect, music: body.music ?? null,
  };
}

export function publicationService(repository, { jwtSecret, publicAppUrl }) {
  const ownerEntry = row => ({ ...row, protected: Boolean(row.protected), url: publicAppUrl + '/m/' + row.token });
  const hashPassword = value => value ? bcrypt.hash(value, 12) : Promise.resolve(null);
  const signAccess = row => jwt.sign({ version: row.accessVersion }, jwtSecret, {
    ...jwtOptions, algorithm: 'HS256', subject: row.id, expiresIn: '15m',
  });
  function allowed(row, access) {
    if (!row.passwordHash) return true;
    try {
      const claims = jwt.verify(access, jwtSecret, { ...jwtOptions, algorithms: ['HS256'], subject: row.id });
      return claims.version === row.accessVersion;
    } catch {
      return false;
    }
  }

  return {
    async list(owner, designId) {
      return (await repository.list(owner, designId)).map(ownerEntry);
    },
    async publish(owner, designId, input) {
      const draft = await repository.loadDraft(owner, designId);
      if (!draft) return null;
      const document = read(draft.document);
      if (!validateDraft({ title: draft.title, document })) return { invalid: true };
      const signature = input.identity === 'named' ? input.sender || draft.name :
        input.identity === 'signature' ? input.signature : '';
      // Starter templates use a dedicated signature layer. Publication identity replaces it.
      const positioned = document.elements.some(layer => layer.id === 'signature' && layer.type === 'text' && layer.visible);
      const snapshot = { title: input.title, recipient: input.recipient, signature: positioned ? '' : signature,
        category: input.category, music: input.music, document: publicDocument(document, signature, input) };
      const passwordHash = await hashPassword(input.password);
      try {
        const row = await repository.insert(owner, designId, {
          id: randomUUID(), token: randomBytes(32).toString('base64url'),
          title: input.title, snapshot, passwordHash, expiresAt: input.expiresAt,
        });
        return row ? ownerEntry(row) : null;
      } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return null;
        throw error;
      }
    },
    async preview(owner, id) {
      const row = await repository.ownerSnapshot(owner, id);
      return row ? read(row.snapshot) : null;
    },
    async privacy(owner, id, input) {
      const row = await repository.privacy(owner, id, { ...input, passwordHash: await hashPassword(input.password) });
      return row ? ownerEntry(row) : null;
    },
    async close(owner, id, status) {
      const row = await repository.close(owner, id, status);
      return row ? ownerEntry(row) : null;
    },
    remove: (owner, id) => repository.remove(owner, id),
    async recipient(token, { access, password, reveal = false } = {}) {
      const row = await repository.byToken(token, reveal);
      if (!row) return { error: 'missing' };
      if (row.status !== 'active') return { error: row.status };
      if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return { error: 'expired' };
      if (password !== undefined && row.passwordHash) {
        if (!string(password, 72) || Buffer.byteLength(password) > 72 ||
          !(await bcrypt.compare(password, row.passwordHash))) return { error: 'incorrect' };
        return { message: read(row.snapshot), access: signAccess(row) };
      }
      if (!allowed(row, access)) return { error: 'locked' };
      return { row, message: reveal ? read(row.snapshot) : undefined };
    },
    view: row => repository.recordView(row),
    report: (row, reason, details) => repository.report(randomUUID(), row, reason, details),
  };
}
