import type { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/taskService';
import type { ApiResponse } from '../types/index';
import type { CreateTaskInput, UpdateTaskInput } from '../validators/taskValidator';
import { TaskStatus } from '@prisma/client';

// ─────────────────────────────────────────────────────────────
// POST /api/tasks
// ─────────────────────────────────────────────────────────────

export async function createTask(
  req: Request<Record<string, never>, ApiResponse, CreateTaskInput>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const task = await taskService.createAndAnalyzeTask(req.body);
    res.status(201).json({
      success: true,
      message: 'Task created and AI analysis complete',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/tasks
// ─────────────────────────────────────────────────────────────

export async function getTasks(
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit, status, search } = req.query as Record<string, string | undefined>;

    const result = await taskService.listTasks(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      },
      {
        status: status as TaskStatus | undefined,
        search,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: result.tasks,
      meta: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/tasks/:id
// ─────────────────────────────────────────────────────────────

export async function getTask(
  req: Request<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Task retrieved successfully',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/tasks/:id
// ─────────────────────────────────────────────────────────────

export async function updateTask(
  req: Request<{ id: string }, ApiResponse, UpdateTaskInput>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id
// ─────────────────────────────────────────────────────────────

export async function deleteTask(
  req: Request<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    await taskService.deleteTask(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/tasks/:id/analyze
// ─────────────────────────────────────────────────────────────

export async function analyzeTask(
  req: Request<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const task = await taskService.reanalyzeTask(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Task re-analyzed successfully',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/tasks/reprioritize
// ─────────────────────────────────────────────────────────────

export async function reprioritizeTasks(
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const updatedTasks = await taskService.reprioritizeActiveTasks();
    res.status(200).json({
      success: true,
      message: 'Tasks reprioritized successfully',
      data: updatedTasks,
    });
  } catch (err) {
    next(err);
  }
}
