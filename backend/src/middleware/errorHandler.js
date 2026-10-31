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

  // Handle Prisma Known Request Errors
  if (err?.code === 'P2002') {
    const target = err.meta?.target ? ` on field: ${Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target}` : '';
    return res.status(409).json({
      error: `A record with this information already exists${target}`,
      details: err.meta,
    });
  }

  if (err?.code === 'P2003') {
    return res.status(400).json({
      error: 'Related record was not found or foreign key constraint failed',
      details: err.meta,
    });
  }

  console.error(err);
  return res.status(500).json({
    error: err.message || 'Internal server error',
  });
}
