import rateLimit from 'express-rate-limit';
import { AppError } from '../types/index';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────
// General API rate limiter
// Applies to all /api/* routes
// ─────────────────────────────────────────────────────────────

export const generalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,   // Default: 15 minutes
  max: env.RATE_LIMIT_MAX_REQUESTS,     // Default: 100 requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'Too many requests from this IP. Please try again later.',
        429
      )
    );
  },
});

// ─────────────────────────────────────────────────────────────
// AI endpoint rate limiter
// Stricter — applied to POST /tasks and POST /tasks/:id/analyze
// ─────────────────────────────────────────────────────────────

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,               // 1 minute window
  max: env.AI_RATE_LIMIT_MAX,        // Default: 20 AI calls / minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'AI analysis rate limit exceeded. Please wait a moment before retrying.',
        429
      )
    );
  },
});
