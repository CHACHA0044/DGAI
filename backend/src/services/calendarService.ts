import { prisma } from '../config/database';
import { CalendarEventType } from '@prisma/client';
import { AppError } from '../types/index';
import { getSettings } from './settingsService';

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  startAt: string; // ISO String
  endAt: string; // ISO String
  taskId?: string;
  habitId?: string;
  type?: 'TASK_BLOCK' | 'HABIT_BLOCK' | 'MEETING' | 'FREE_TIME' | 'BUFFER' | 'BREAK';
  isBlocked?: boolean;
  color?: string;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  type?: 'TASK_BLOCK' | 'HABIT_BLOCK' | 'MEETING' | 'FREE_TIME' | 'BUFFER' | 'BREAK';
  isBlocked?: boolean;
  color?: string;
}

/** Check if two time ranges overlap */
export async function detectConflicts(start: Date, end: Date, ignoreEventId?: string): Promise<any[]> {
  const overlaps = await prisma.calendarEvent.findMany({
    where: {
      id: ignoreEventId ? { not: ignoreEventId } : undefined,
      AND: [
        { startAt: { lt: end } },
        { endAt: { gt: start } },
      ],
    },
  });
  return overlaps;
}

/** Get list of calendar events within date range */
export async function listCalendarEvents(startStr?: string, endStr?: string) {
  return prisma.calendarEvent.findMany({
    where: {
      ...(startStr && { startAt: { gte: new Date(startStr) } }),
      ...(endStr && { endAt: { lte: new Date(endStr) } }),
    },
    orderBy: { startAt: 'asc' },
  });
}

/** Create a new event block */
export async function createCalendarEvent(input: CreateCalendarEventInput) {
  const start = new Date(input.startAt);
  const end = new Date(input.endAt);

  if (start >= end) {
    throw new AppError('Start time must be before end time', 400);
  }

  // Detect conflicts if the block is a meeting or blocked time
  if (input.isBlocked) {
    const conflicts = await detectConflicts(start, end);
    if (conflicts.length > 0) {
      // We still allow it, but we flag it or store details in description
      console.warn(`[CalendarService] Conflict detected for "${input.title}": overlapping with ${conflicts.map(c => c.title).join(', ')}`);
    }
  }

  return prisma.calendarEvent.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim(),
      startAt: start,
      endAt: end,
      taskId: input.taskId,
      habitId: input.habitId,
      type: (input.type as CalendarEventType) ?? CalendarEventType.TASK_BLOCK,
      isBlocked: input.isBlocked ?? false,
      color: input.color,
      source: 'INTERNAL',
    },
  });
}

/** Update an event */
export async function updateCalendarEvent(id: string, input: UpdateCalendarEventInput) {
  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Event '${id}' not found`, 404);

  const start = input.startAt ? new Date(input.startAt) : existing.startAt;
  const end = input.endAt ? new Date(input.endAt) : existing.endAt;

  if (start >= end) {
    throw new AppError('Start time must be before end time', 400);
  }

  if (input.isBlocked) {
    const conflicts = await detectConflicts(start, end, id);
    if (conflicts.length > 0) {
      console.warn(`[CalendarService] Conflict detected for "${input.title || existing.title}": overlapping with ${conflicts.map(c => c.title).join(', ')}`);
    }
  }

  return prisma.calendarEvent.update({
    where: { id },
    data: {
      title: input.title?.trim(),
      description: input.description?.trim(),
      startAt: start,
      endAt: end,
      type: input.type ? (input.type as CalendarEventType) : undefined,
      isBlocked: input.isBlocked,
      color: input.color,
    },
  });
}

/** Delete an event */
export async function deleteCalendarEvent(id: string) {
  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Event '${id}' not found`, 404);
  return prisma.calendarEvent.delete({ where: { id } });
}

/** Detect free work windows during workday (9 AM - 6 PM or custom settings) */
export async function findFreeSlots(dateStr: string, minDurationMinutes = 30) {
  const settings = await getSettings();
  const date = new Date(dateStr);
  
  // Set boundary to workday limits
  const dayStart = new Date(date);
  dayStart.setHours(settings.workStartHour, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(settings.workEndHour, 0, 0, 0);

  // Fetch all calendar events of the day
  const events = await prisma.calendarEvent.findMany({
    where: {
      startAt: { gte: dayStart },
      endAt: { lte: dayEnd },
    },
    orderBy: { startAt: 'asc' },
  });

  const freeSlots: { start: string; end: string; durationMinutes: number }[] = [];
  let currentTime = dayStart.getTime();

  for (const event of events) {
    const eventStart = new Date(event.startAt).getTime();
    const eventEnd = new Date(event.endAt).getTime();

    if (eventStart > currentTime) {
      const diffMin = Math.round((eventStart - currentTime) / (1000 * 60));
      if (diffMin >= minDurationMinutes) {
        freeSlots.push({
          start: new Date(currentTime).toISOString(),
          end: new Date(eventStart).toISOString(),
          durationMinutes: diffMin,
        });
      }
    }
    currentTime = Math.max(currentTime, eventEnd);
  }

  if (dayEnd.getTime() > currentTime) {
    const diffMin = Math.round((dayEnd.getTime() - currentTime) / (1000 * 60));
    if (diffMin >= minDurationMinutes) {
      freeSlots.push({
        start: new Date(currentTime).toISOString(),
        end: dayEnd.toISOString(),
        durationMinutes: diffMin,
      });
    }
  }

  return freeSlots;
}

/** Synchronize today's Daily Plan schedule into the calendar */
export async function syncPlannerToCalendar(scheduleItems: any[]) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Clear previous auto-synced blocks of today to avoid duplication
  const startOfDay = new Date(todayStr);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(todayStr);
  endOfDay.setHours(23, 59, 59, 999);

  await prisma.calendarEvent.deleteMany({
    where: {
      source: 'PLANNER_SYNC',
      startAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  const createdEvents = [];

  for (const item of scheduleItems) {
    if (!item.timeSlot || !item.taskTitle) continue;

    // Parse format "09:00 AM - 11:30 AM" or similar
    const [startPart, endPart] = item.timeSlot.split(' - ');
    if (!startPart || !endPart) continue;

    const parseTimePart = (timeStr: string): Date => {
      const d = new Date(todayStr);
      const [time, ampm] = timeStr.trim().split(' ');
      let [hStr, mStr] = time.split(':');
      let hour = parseInt(hStr, 10);
      const min = parseInt(mStr, 10);

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      
      d.setHours(hour, min, 0, 0);
      return d;
    };

    try {
      const startAt = parseTimePart(startPart);
      const endAt = parseTimePart(endPart);

      let mappedType: CalendarEventType = CalendarEventType.TASK_BLOCK;
      if (item.activityType === 'BREAK') mappedType = CalendarEventType.BREAK;
      else if (item.activityType === 'ADMINISTRATIVE') mappedType = CalendarEventType.BUFFER;

      const event = await prisma.calendarEvent.create({
        data: {
          title: item.taskTitle,
          description: `Auto-synchronized block from Daily Planner. Activity type: ${item.activityType}`,
          startAt,
          endAt,
          taskId: item.taskId,
          type: mappedType,
          isBlocked: mappedType === CalendarEventType.TASK_BLOCK,
          source: 'PLANNER_SYNC',
        },
      });
      createdEvents.push(event);
    } catch (err) {
      console.error('[CalendarSync] Failed parsing schedule timeslot:', item.timeSlot, err);
    }
  }

  return createdEvents;
}
