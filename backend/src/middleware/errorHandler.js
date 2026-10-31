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
    return res.status(400).json({
      error: 'Validation failed',
      details: err.flatten(),
    });
  }

  if (err?.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with this value already exists',
      details: err.meta,
    });
  }

  console.error(err);
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error'),
  });
}
