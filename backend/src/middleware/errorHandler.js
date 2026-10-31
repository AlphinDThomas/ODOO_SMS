import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details ?? null,
    });
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues?.[0];
    const fieldName = firstIssue?.path?.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.');
    const errorMessage = firstIssue
      ? (fieldName ? `${fieldName}: ${firstIssue.message}` : firstIssue.message)
      : 'Validation failed';

    return res.status(400).json({
      error: errorMessage,
      details: err.flatten(),
    });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
