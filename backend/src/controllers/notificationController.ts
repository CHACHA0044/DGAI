import type { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService';
import type { ApiResponse } from '../types/index';

// GET /api/v1/notifications
export async function getNotifications(
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const list = await notificationService.listNotifications();
    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: list,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/notifications/:id/read
export async function markAsRead(
  req: Request<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await notificationService.markNotificationAsRead(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/notifications/read-all
export async function markAllAsRead(
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    await notificationService.markAllAsRead();
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
}
