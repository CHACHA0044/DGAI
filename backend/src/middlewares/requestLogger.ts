import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const STATUS_COLORS: Record<number, string> = {
  2: '\x1b[32m', // green
  3: '\x1b[36m', // cyan
  4: '\x1b[33m', // yellow
  5: '\x1b[31m', // red
};

function getColor(status: number): string {
  return STATUS_COLORS[Math.floor(status / 100)] ?? '\x1b[37m';
}

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (env.NODE_ENV === 'production') {
    next();
    return;
  }

  const start = Date.now();
  const { method, path: reqPath } = req;

  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = getColor(res.statusCode);
    const queryStr =
      Object.keys(req.query).length > 0
        ? ` ${DIM}${JSON.stringify(req.query)}${RESET}`
        : '';

    console.log(
      `${color}${method.padEnd(6)}${RESET} ${reqPath}${queryStr} ${color}${res.statusCode}${RESET} ${DIM}${ms}ms${RESET}`
    );
  });

  next();
}
