import { failure } from '../utils/response.js';

export function notFound(_req, res) {
  return failure(res, 404, 'Route not found');
}

export function handleError(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return failure(res, 400, 'Invalid JSON');
  if (error.type === 'entity.too.large') return failure(res, 413, 'Request body too large');
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE'].includes(error.code)) {
    return failure(res, 503, 'The database is unavailable. Check the connection and migrations.');
  }

  console.error('Unexpected request error', { name: error.name });
  return failure(res, 500, 'An unexpected error occurred');
}
