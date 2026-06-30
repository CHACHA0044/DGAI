import type { Request, Response, NextFunction } from 'express';
import * as habitService from '../services/habitService';

export async function createHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const habit = await habitService.createHabit(req.body);
    res.status(201).json({ success: true, message: 'Habit created successfully', data: habit });
  } catch (err) {
    next(err);
  }
}

export async function listHabits(req: Request, res: Response, next: NextFunction) {
  try {
    const freq = req.query.frequency ? (req.query.frequency as any) : undefined;
    const habits = await habitService.listHabits(freq);
    res.status(200).json({ success: true, message: 'Habits retrieved successfully', data: habits });
  } catch (err) {
    next(err);
  }
}

export async function getHabitById(req: Request, res: Response, next: NextFunction) {
  try {
    const habit = await habitService.getHabitById(req.params.id);
    res.status(200).json({ success: true, message: 'Habit retrieved successfully', data: habit });
  } catch (err) {
    next(err);
  }
}

export async function updateHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const habit = await habitService.updateHabit(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Habit updated successfully', data: habit });
  } catch (err) {
    next(err);
  }
}

export async function deleteHabit(req: Request, res: Response, next: NextFunction) {
  try {
    await habitService.deleteHabit(req.params.id);
    res.status(200).json({ success: true, message: 'Habit deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function completeHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const habit = await habitService.completeHabit(req.params.id);
    res.status(200).json({ success: true, message: 'Habit marked completed successfully', data: habit });
  } catch (err) {
    next(err);
  }
}

export async function getHabitsSummary(_req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await habitService.getHabitsSummary();
    res.status(200).json({ success: true, message: 'Habits summary retrieved successfully', data: summary });
  } catch (err) {
    next(err);
  }
}
