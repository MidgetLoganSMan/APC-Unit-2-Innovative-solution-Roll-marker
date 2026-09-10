export default function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
// Determine the status code to send based on the error object
  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({ error: err.message || 'Internal server error' });
}
