import { prisma } from '../config/database';
import { HabitFrequency } from '@prisma/client';
import { generateContent } from '../ai/geminiClient';
import { AppError } from '../types/index';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CreateHabitInput {
  name: string;
  description?: string;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface UpdateHabitInput {
  name?: string;
  description?: string;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

interface CompletionRecord {
  date: string;
  completed: boolean;
}

// ─────────────────────────────────────────────────────────────
// Streak calculation
// ─────────────────────────────────────────────────────────────

function calculateStreak(history: CompletionRecord[], frequency: HabitFrequency): number {
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  let expectedDate = new Date();

  for (const record of sorted) {
    const recordDate = record.date;
    const expected = expectedDate.toISOString().split('T')[0];

    if (recordDate === expected && record.completed) {
      streak++;
      // Step back by frequency
      if (frequency === HabitFrequency.DAILY) {
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (frequency === HabitFrequency.WEEKLY) {
        expectedDate.setDate(expectedDate.getDate() - 7);
      } else {
        expectedDate.setMonth(expectedDate.getMonth() - 1);
      }
    } else if (recordDate === today) {
      // Today not completed yet — don't break streak
      continue;
    } else {
      break;
    }
  }

  return streak;
}

// ─────────────────────────────────────────────────────────────
// AI Suggestion (with offline fallback)
// ─────────────────────────────────────────────────────────────

const OFFLINE_HABIT_TIPS: Record<string, string[]> = {
  DAILY: [
    'Start with the smallest possible version — consistency beats intensity.',
    'Pair this habit with an existing routine (habit stacking).',
    'Track completion every day to build accountability.',
    'Celebrate small wins — each day is a step forward.',
  ],
  WEEKLY: [
    'Schedule a specific day and time to ensure it happens.',
    'Review your week every Sunday to reinforce the habit.',
    'Link this habit to something you look forward to each week.',
  ],
  MONTHLY: [
    'Set a calendar reminder at the start of each month.',
    'Track your monthly completion rate — aim for 100% consistency.',
    'Reflect on the impact of this habit at the end of each month.',
  ],
};

async function generateHabitSuggestion(name: string, frequency: string): Promise<string> {
  try {
    const prompt = `Give a single, concise, actionable tip (1-2 sentences) to help someone maintain this habit successfully.
Habit: "${name}"
Frequency: ${frequency}

Respond with only the tip text. No markdown, no prefix.`;

    const result = await generateContent(prompt);
    return result.trim().slice(0, 250);
  } catch {
    const tips = OFFLINE_HABIT_TIPS[frequency] ?? OFFLINE_HABIT_TIPS.DAILY;
    return tips[Math.floor(Math.random() * tips.length)];
  }
}

// ─────────────────────────────────────────────────────────────
// CRUD Operations
// ─────────────────────────────────────────────────────────────

export async function createHabit(input: CreateHabitInput) {
  const freq = (input.frequency ?? 'DAILY') as HabitFrequency;

  const habit = await prisma.habit.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim(),
      frequency: freq,
      completionHistory: [],
    },
  });

  // Generate AI suggestion async
  void (async () => {
    try {
      const suggestion = await generateHabitSuggestion(habit.name, habit.frequency);
      await prisma.habit.update({ where: { id: habit.id }, data: { aiSuggestion: suggestion } });
    } catch { /* non-critical */ }
  })();

  return habit;
}

export async function listHabits(frequency?: HabitFrequency) {
  // Auto-reset completedToday for habits not completed today
  const today = new Date().toISOString().split('T')[0];
  const habits = await prisma.habit.findMany({
    where: frequency ? { frequency } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  // Reset completedToday if lastCompletedAt was not today
  const needsReset = habits.filter(h => {
    if (!h.lastCompletedAt) return h.completedToday;
    const lastDate = new Date(h.lastCompletedAt).toISOString().split('T')[0];
    return lastDate !== today && h.completedToday;
  });

  if (needsReset.length > 0) {
    await prisma.habit.updateMany({
      where: { id: { in: needsReset.map(h => h.id) } },
      data: { completedToday: false },
    });
    // Return updated list
    return prisma.habit.findMany({
      where: frequency ? { frequency } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  return habits;
}

export async function getHabitById(id: string) {
  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit) throw new AppError(`Habit '${id}' not found`, 404);
  return habit;
}

export async function updateHabit(id: string, input: UpdateHabitInput) {
  await getHabitById(id);
  return prisma.habit.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() }),
      ...(input.frequency && { frequency: input.frequency as HabitFrequency }),
    },
  });
}

export async function deleteHabit(id: string) {
  await getHabitById(id);
  return prisma.habit.delete({ where: { id } });
}

/** Mark habit as completed for today */
export async function completeHabit(id: string) {
  const habit = await getHabitById(id);
  const today = new Date().toISOString().split('T')[0];

  if (habit.completedToday) {
    return habit; // Already completed today — idempotent
  }

  const history = (habit.completionHistory as unknown as CompletionRecord[]) ?? [];
  // Remove any existing today entry and add completed one
  const filtered = history.filter(h => h.date !== today);
  filtered.push({ date: today, completed: true });

  const newStreak = calculateStreak(filtered, habit.frequency);

  return prisma.habit.update({
    where: { id },
    data: {
      completedToday: true,
      lastCompletedAt: new Date(),
      streakCount: newStreak,
      completionHistory: filtered as any, // Keep last 90 records
    },
  });
}

/** Get today's habit completion summary */
export async function getHabitsSummary() {
  const habits = await listHabits();
  const daily = habits.filter(h => h.frequency === HabitFrequency.DAILY);
  const completedToday = daily.filter(h => h.completedToday).length;
  const topStreak = habits.reduce((max, h) => Math.max(max, h.streakCount), 0);

  return {
    totalHabits: habits.length,
    dailyHabits: daily.length,
    completedToday,
    completionRate: daily.length > 0 ? Math.round((completedToday / daily.length) * 100) : 0,
    topStreak,
    habits: habits.slice(0, 5),
  };
}
