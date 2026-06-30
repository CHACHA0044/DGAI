import type { Request, Response, NextFunction } from 'express';
import * as plannerService from '../services/plannerService';
import type { ApiResponse } from '../types/index';

// ─────────────────────────────────────────────────────────────
// GET /api/v1/planner/today
// ─────────────────────────────────────────────────────────────

export async function getTodayPlan(
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const plan = await plannerService.getTodayPlan();
    res.status(200).json({
      success: true,
      message: 'Today\'s planner retrieved successfully',
      data: plan,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/v1/planner/generate
// ─────────────────────────────────────────────────────────────

export async function generatePlan(
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const plan = await plannerService.generatePlan(todayStr);
    res.status(200).json({
      success: true,
      message: 'Plan regenerated successfully',
      data: plan,
    });
  } catch (err) {
    next(err);
  }
}
