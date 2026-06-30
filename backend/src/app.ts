import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsOptions } from './config/cors';
import { generalRateLimiter } from './middlewares/rateLimiter';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import routes from './routes/index';

export function createApp() {
  const app = express();

  // ── Security headers (Helmet) ─────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false, // allow frontend assets
    })
  );

  // ── CORS ──────────────────────────────────────────────────
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // preflight for all routes

  // ── Body parsing (10kb limit against large payload attacks) ─
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── Request logging (dev only) ────────────────────────────
  app.use(requestLogger);

  // ── Health check ──────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Deadline Guardian API is healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
    });
  });

  // ── API routes (with general rate limiter) ─────────────────
  app.use('/api', generalRateLimiter, routes);

  // ── 404 catch-all ─────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Global error handler (must be last) ───────────────────
  app.use(errorHandler);

  return app;
}
