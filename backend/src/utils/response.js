export function success(res, message, data) {
  return res.json({ success: true, message, data });
}

export function failure(res, status, message) {
  return res.status(status).json({ success: false, message, errors: [] });
}
