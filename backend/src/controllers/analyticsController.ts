import type { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';
import type { ApiResponse } from '../types/index';

// GET /api/v1/analytics
export async function getAnalytics(
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const summary = await analyticsService.getAnalyticsSummary();
    res.status(200).json({
      success: true,
      message: 'Analytics summary retrieved successfully',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}
