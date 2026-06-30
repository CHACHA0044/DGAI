import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/index';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────────────

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    // Known, operational error
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // Unknown / programming error — log full details server-side
    console.error('[Unhandled Error]', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });

    if (env.NODE_ENV === 'development') {
      message = err.message;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// ─────────────────────────────────────────────────────────────
// 404 handler (placed after all routes)
// ─────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}
