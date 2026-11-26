import { createHash, randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const cookie = 'feelcraft_refresh';
const days = 7 * 24 * 60 * 60 * 1000;
const invalidHash = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.6hbFcbhz4Zp1jVUcmi0Xs6r3JyQSvlm';
const hash = token => createHash('sha256').update(token).digest();
const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });

export function authService(users, { jwtSecret, secureCookies }) {
  const options = { httpOnly: true, secure: secureCookies, sameSite: 'strict', path: '/api/auth' };
  const tokenOptions = { issuer: 'feelcraft', audience: 'feelcraft-studio', algorithm: 'HS256' };

  function session(res, user, token) {
    res.cookie(cookie, token, { ...options, maxAge: days });
    const accessToken = jwt.sign({ role: user.role }, jwtSecret, { ...tokenOptions, subject: user.id, expiresIn: '15m' });
    return { user: publicUser(user), accessToken };
  }

  async function issue(res, user) {
    const token = randomBytes(32).toString('hex');
    await users.issue(hash(token), user.id, new Date(Date.now() + days));
    return session(res, user, token);
  }

  function refreshToken(req) {
    return /(?:^|;\s*)feelcraft_refresh=([a-f0-9]{64})(?=;|$)/.exec(req.headers.cookie || '')?.[1];
  }

  return {
    rename: (id, name) => users.rename(id, name),
    async register(res, { name, email, password }) {
      const user = { id: randomUUID(), name, email, role: 'user' };
      await users.create(user, await bcrypt.hash(password, 12));
      return issue(res, user);
    },
    async login(res, { email, password }) {
      const user = await users.find(email);
      const matches = await bcrypt.compare(password, user?.password_hash ?? invalidHash);
      return user && matches ? issue(res, user) : null;
    },
    async refresh(req, res) {
      const previous = refreshToken(req);
      if (!previous) return null;
      const next = randomBytes(32).toString('hex');
      const user = await users.rotate(hash(previous), hash(next), new Date(Date.now() + days));
      return user ? session(res, user, next) : null;
    },
    async logout(req, res) {
      const token = refreshToken(req);
      if (token) await users.revoke(hash(token));
      res.clearCookie(cookie, options);
    },
    verify(header) {
      try {
        const token = /^Bearer (\S+)$/.exec(header || '')?.[1];
        return jwt.verify(token, jwtSecret, {
          issuer: tokenOptions.issuer, audience: tokenOptions.audience, algorithms: ['HS256'],
        }).sub;
      } catch {
        return null;
      }
    },
  };
}
