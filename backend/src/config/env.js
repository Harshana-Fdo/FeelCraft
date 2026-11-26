import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export function readConfig(env = process.env) {
  const port = Number(env.PORT ?? 5000);
  const clientUrl = new URL(env.CLIENT_URL ?? 'http://localhost:5173');
  const publicUrl = new URL(env.PUBLIC_APP_URL || clientUrl.origin);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 through 65535');
  }
  if (!['http:', 'https:'].includes(clientUrl.protocol) || clientUrl.username || clientUrl.password) {
    throw new Error('CLIENT_URL must be an HTTP or HTTPS origin');
  }
  if (!['http:', 'https:'].includes(publicUrl.protocol) || publicUrl.username || publicUrl.password ||
    publicUrl.pathname !== '/' || publicUrl.search || publicUrl.hash) {
    throw new Error('PUBLIC_APP_URL must be an HTTP or HTTPS origin.');
  }

  const jwtSecret = env.JWT_ACCESS_SECRET || null;
  if (jwtSecret && Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('JWT_ACCESS_SECRET must contain at least 32 bytes.');
  }
  return { port, host: env.HOST ?? 'localhost', clientOrigin: clientUrl.origin, publicAppUrl: publicUrl.origin,
    jwtSecret, secureCookies: env.NODE_ENV === 'production' || publicUrl.protocol === 'https:' };
}
