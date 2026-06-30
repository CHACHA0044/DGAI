import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../types/index';

/**
 * Middleware factory that validates req.body / req.query / req.params
 * against a Zod schema shaped as { body?, query?, params? }.
 *
 * On success it mutates the request with the parsed (and transformed) values.
 * On failure it forwards a 400 AppError to the error handler.
 */
export function validateRequest(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const messages = result.error.errors
        .map((e) => {
          // Strip the top-level "body"/"query"/"params" from the path for cleaner messages
          const path = e.path.slice(1).join('.');
          return path ? `${path}: ${e.message}` : e.message;
        })
        .join('; ');

      next(new AppError(`Validation failed: ${messages}`, 400));
      return;
    }

    const data = result.data as { body?: unknown; query?: unknown; params?: unknown };

    if (data.body !== undefined) req.body = data.body;
    if (data.params !== undefined) req.params = data.params as Record<string, string>;
    // Note: query is intentionally not mutated to avoid Express internal type conflicts

    next();
  };
}
