import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Create Task
// ─────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must not exceed 200 characters')
      .trim(),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters')
      .trim()
      .optional(),
    deadline: z
      .string()
      .datetime({ message: 'Invalid deadline — use ISO 8601 format' })
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),
    estimatedHours: z
      .number()
      .positive('Estimated hours must be a positive number')
      .max(10000, 'Estimated hours value is unrealistically large')
      .optional(),
    tags: z
      .array(z.string().max(50, 'Each tag must not exceed 50 characters').trim())
      .max(10, 'Maximum 10 tags allowed')
      .default([])
      .optional(),
  }),
});

// ─────────────────────────────────────────────────────────────
// Update Task
// ─────────────────────────────────────────────────────────────

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid task ID format'),
  }),
  body: z.object({
    title: z.string().min(3).max(200).trim().optional(),
    description: z.string().max(2000).trim().optional(),
    deadline: z
      .string()
      .datetime()
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),
    estimatedHours: z.number().positive().max(10000).optional(),
    tags: z
      .array(z.string().max(50).trim())
      .max(10)
      .optional(),
    status: z
      .enum(['DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'])
      .optional(),
  }),
});

// ─────────────────────────────────────────────────────────────
// Task ID Param
// ─────────────────────────────────────────────────────────────

export const taskIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid task ID format'),
  }),
});

// ─────────────────────────────────────────────────────────────
// List Query
// ─────────────────────────────────────────────────────────────

export const taskListQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? Math.min(50, Math.max(1, parseInt(v, 10))) : 10)),
    status: z
      .enum(['DRAFT', 'ANALYZING', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'])
      .optional(),
    search: z.string().max(100).trim().optional(),
  }),
});

// ── Inferred Types ─────────────────────────────────────────────

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
export type TaskListQuery = z.infer<typeof taskListQuerySchema>['query'];
