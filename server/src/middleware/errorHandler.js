import logger from '../utils/logger.js';
import env from '../config/env.js';

/**
 * Centralized error handler. Never leaks stack traces or input in production.
 */
export function errorHandler(err, req, res, _next) {
  logger.error({ err: { message: err.message, stack: env.NODE_ENV === 'development' ? err.stack : undefined }, url: req.url, method: req.method }, 'Unhandled error');

  const statusCode = err.statusCode || 500;
  const response = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again.'
        : err.message || 'Internal server error',
    },
  };

  res.status(statusCode).json(response);
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
