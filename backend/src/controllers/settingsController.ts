import type { Request, Response, NextFunction } from 'express';
import * as settingsService from '../services/settingsService';

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getSettings();
    res.status(200).json({ success: true, message: 'Settings retrieved successfully', data: settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.updateSettings(req.body);
    res.status(200).json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (err) {
    next(err);
  }
}
