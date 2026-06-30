import type { Request, Response, NextFunction } from 'express';
import * as emergencyPlannerService from '../services/emergencyPlannerService';
import type { ApiResponse } from '../types/index';

// GET /api/v1/emergency/status
export async function getEmergencyStatus(
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const status = await emergencyPlannerService.checkEmergencyStatus();
    res.status(200).json({
      success: true,
      message: 'Emergency status verified successfully',
      data: {
        isEmergency: status.isEmergency,
        reason: status.reason,
        isManual: emergencyPlannerService.isManualEmergencyActive(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/emergency/plan
export async function getEmergencyPlan(
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const plan = await emergencyPlannerService.getEmergencyPlan();
    res.status(200).json({
      success: true,
      message: 'Emergency recovery plan compiled successfully',
      data: plan,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/emergency/toggle
export async function toggleEmergencyMode(
  req: Request<Record<string, never>, ApiResponse, { active: boolean }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { active } = req.body;
    emergencyPlannerService.setManualEmergency(active);
    res.status(200).json({
      success: true,
      message: `Emergency Mode manually ${active ? 'activated' : 'deactivated'} successfully`,
      data: {
        active,
      },
    });
  } catch (err) {
    next(err);
  }
}
