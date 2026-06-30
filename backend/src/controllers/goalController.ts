import type { Request, Response, NextFunction } from 'express';
import * as goalService from '../services/goalService';

export async function createGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const goal = await goalService.createGoal(req.body);
    res.status(201).json({ success: true, message: 'Goal created successfully', data: goal });
  } catch (err) {
    next(err);
  }
}

export async function listGoals(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = req.query.status ? { status: req.query.status as any } : undefined;
    const goals = await goalService.listGoals(filter);
    res.status(200).json({ success: true, message: 'Goals retrieved successfully', data: goals });
  } catch (err) {
    next(err);
  }
}

export async function getGoalById(req: Request, res: Response, next: NextFunction) {
  try {
    const goal = await goalService.getGoalById(req.params.id);
    res.status(200).json({ success: true, message: 'Goal retrieved successfully', data: goal });
  } catch (err) {
    next(err);
  }
}

export async function updateGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const goal = await goalService.updateGoal(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Goal updated successfully', data: goal });
  } catch (err) {
    next(err);
  }
}

export async function updateGoalProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const progress = parseInt(req.body.progress as string, 10);
    const goal = await goalService.updateGoalProgress(req.params.id, progress);
    res.status(200).json({ success: true, message: 'Goal progress updated successfully', data: goal });
  } catch (err) {
    next(err);
  }
}

export async function deleteGoal(req: Request, res: Response, next: NextFunction) {
  try {
    await goalService.deleteGoal(req.params.id);
    res.status(200).json({ success: true, message: 'Goal deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getGoalsSummary(_req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await goalService.getGoalsSummary();
    res.status(200).json({ success: true, message: 'Goals summary retrieved successfully', data: summary });
  } catch (err) {
    next(err);
  }
}
