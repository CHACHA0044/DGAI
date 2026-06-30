import type { Request, Response, NextFunction } from 'express';
import * as coachService from '../services/coachService';

export async function getCoachingAdvice(_req: Request, res: Response, next: NextFunction) {
  try {
    const advice = await coachService.getPersonalizedCoachingAdvice();
    res.status(200).json({ success: true, message: 'Coaching advice generated successfully', data: advice });
  } catch (err) {
    next(err);
  }
}
