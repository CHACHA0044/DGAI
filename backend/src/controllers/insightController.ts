import type { Request, Response, NextFunction } from 'express';
import * as insightService from '../services/insightService';

export async function getLatestInsights(_req: Request, res: Response, next: NextFunction) {
  try {
    const insights = await insightService.getLatestInsights();
    res.status(200).json({ success: true, message: 'Insights retrieved successfully', data: insights });
  } catch (err) {
    next(err);
  }
}

export async function generateInsights(_req: Request, res: Response, next: NextFunction) {
  try {
    const insights = await insightService.generateProductivityInsights();
    res.status(200).json({ success: true, message: 'New insights generated successfully', data: insights });
  } catch (err) {
    next(err);
  }
}
