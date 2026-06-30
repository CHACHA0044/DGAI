import type { Request, Response, NextFunction } from 'express';
import * as calendarService from '../services/calendarService';

export async function createCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await calendarService.createCalendarEvent(req.body);
    res.status(201).json({ success: true, message: 'Calendar event created successfully', data: event });
  } catch (err) {
    next(err);
  }
}

export async function listCalendarEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const start = req.query.start ? (req.query.start as string) : undefined;
    const end = req.query.end ? (req.query.end as string) : undefined;
    const events = await calendarService.listCalendarEvents(start, end);
    res.status(200).json({ success: true, message: 'Calendar events retrieved successfully', data: events });
  } catch (err) {
    next(err);
  }
}

export async function updateCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await calendarService.updateCalendarEvent(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Calendar event updated successfully', data: event });
  } catch (err) {
    next(err);
  }
}

export async function deleteCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    await calendarService.deleteCalendarEvent(req.params.id);
    res.status(200).json({ success: true, message: 'Calendar event deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function findFreeSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const dateStr = req.query.date ? (req.query.date as string) : new Date().toISOString().split('T')[0];
    const minDur = req.query.minDuration ? parseInt(req.query.minDuration as string, 10) : 30;
    const slots = await calendarService.findFreeSlots(dateStr, minDur);
    res.status(200).json({ success: true, message: 'Free slots calculated successfully', data: slots });
  } catch (err) {
    next(err);
  }
}

export async function checkConflicts(req: Request, res: Response, next: NextFunction) {
  try {
    const start = new Date(req.query.start as string);
    const end = new Date(req.query.end as string);
    const conflicts = await calendarService.detectConflicts(start, end);
    res.status(200).json({ success: true, message: 'Conflicts checked successfully', data: conflicts });
  } catch (err) {
    next(err);
  }
}

export async function syncPlanner(req: Request, res: Response, next: NextFunction) {
  try {
    const items = req.body.schedule ?? [];
    const events = await calendarService.syncPlannerToCalendar(items);
    res.status(200).json({ success: true, message: 'Daily plan schedule synced to calendar successfully', data: events });
  } catch (err) {
    next(err);
  }
}
