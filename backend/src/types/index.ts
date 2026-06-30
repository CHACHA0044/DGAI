// ─────────────────────────────────────────────────────────────
// Shared TypeScript types for the Deadline Guardian backend
// ─────────────────────────────────────────────────────────────

// ── API Response Shapes ───────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ── AI Analysis ───────────────────────────────────────────────

export interface Subtask {
  id: string;
  title: string;
  estimatedMinutes: number;
  order: number;
}

export interface AIAnalysisResult {
  priority: number;                              // 1–10
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedCompletion: string;
  executionPlan: string;
  productivityAdvice: string;
  nextImmediateStep: string;
  potentialBlockers: string[];
  dependencies: string[];
  subtasks: Subtask[];
}

// ── Custom Error ──────────────────────────────────────────────

/**
 * Operational application error with an HTTP status code.
 * Distinguishes expected business errors from unexpected crashes.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
