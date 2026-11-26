import { success } from '../utils/response.js';

export function health(_req, res) {
  res.set('Cache-Control', 'no-store');
  return success(res, 'FeelCraft API is running', { status: 'ok' });
}
