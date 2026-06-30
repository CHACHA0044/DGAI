import { prisma } from '../config/database';
import { GoalStatus, GoalType } from '@prisma/client';
import { generateContent } from '../ai/geminiClient';
import { AppError } from '../types/index';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CreateGoalInput {
  title: string;
  description?: string;
  type?: 'SHORT_TERM' | 'LONG_TERM';
  targetDate?: string; // ISO string
  linkedTaskIds?: string[];
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  type?: 'SHORT_TERM' | 'LONG_TERM';
  status?: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
  targetDate?: string;
  progress?: number;
  linkedTaskIds?: string[];
}

// ─────────────────────────────────────────────────────────────
// AI Goal Estimation (with offline fallback)
// ─────────────────────────────────────────────────────────────

async function estimateGoalCompletion(title: string, description: string | undefined, targetDate: Date | null, progress: number): Promise<string> {
  const fallback = () => {
    if (!targetDate) return 'No target date set — track progress to estimate completion.';
    const daysLeft = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (progress >= 100) return 'Goal achieved!';
    if (daysLeft <= 0) return 'Target date has passed — review and update your goal.';
    const rateNeeded = (100 - progress) / daysLeft;
    if (rateNeeded < 2) return `On track — need ~${rateNeeded.toFixed(1)}% progress per day to meet target.`;
    if (rateNeeded < 5) return `Moderate pace needed — ${rateNeeded.toFixed(1)}% per day. Consider breaking into subtasks.`;
    return `Accelerated effort required — ${rateNeeded.toFixed(1)}% per day. Consider extending the target date.`;
  };

  try {
    const prompt = `You are an AI goal coach. Given this goal, provide a 1-2 sentence completion estimation.
Goal: "${title}"
${description ? `Description: "${description}"` : ''}
Progress: ${progress}%
${targetDate ? `Target Date: ${targetDate.toDateString()}` : 'No target date'}

Respond with only a concise, motivating assessment of likelihood to complete this goal. No JSON.`;

    const result = await generateContent(prompt);
    return result.trim().slice(0, 300);
  } catch {
    return fallback();
  }
}

// ─────────────────────────────────────────────────────────────
// CRUD Operations
// ─────────────────────────────────────────────────────────────

export async function createGoal(input: CreateGoalInput) {
  const goal = await prisma.goal.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim(),
      type: (input.type as GoalType) ?? GoalType.SHORT_TERM,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      linkedTaskIds: input.linkedTaskIds ?? [],
      progress: 0,
    },
  });

  // Generate AI estimation async — fire and forget
  void generateGoalEstimation(goal.id, goal.title, goal.description, goal.targetDate, goal.progress);

  return goal;
}

async function generateGoalEstimation(id: string, title: string, description: string | null, targetDate: Date | null, progress: number) {
  try {
    const estimation = await estimateGoalCompletion(title, description ?? undefined, targetDate, progress);
    await prisma.goal.update({ where: { id }, data: { aiEstimation: estimation } });
  } catch {
    // Non-critical — estimation is optional
  }
}

export async function listGoals(filter?: { status?: GoalStatus }) {
  return prisma.goal.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getGoalById(id: string) {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) throw new AppError(`Goal '${id}' not found`, 404);
  return goal;
}

export async function updateGoal(id: string, input: UpdateGoalInput) {
  await getGoalById(id); // Throws 404 if missing

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() }),
      ...(input.type && { type: input.type as GoalType }),
      ...(input.status && { status: input.status as GoalStatus }),
      ...(input.targetDate !== undefined && { targetDate: input.targetDate ? new Date(input.targetDate) : null }),
      ...(input.progress !== undefined && { progress: Math.min(100, Math.max(0, input.progress)) }),
      ...(input.linkedTaskIds !== undefined && { linkedTaskIds: input.linkedTaskIds }),
    },
  });

  // Refresh AI estimation if progress changed
  if (input.progress !== undefined) {
    void generateGoalEstimation(id, updated.title, updated.description, updated.targetDate, updated.progress);
  }

  return updated;
}

export async function updateGoalProgress(id: string, progress: number) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  const goal = await getGoalById(id);

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      progress: clamped,
      status: clamped >= 100 ? GoalStatus.COMPLETED : goal.status,
    },
  });

  void generateGoalEstimation(id, updated.title, updated.description, updated.targetDate, clamped);
  return updated;
}

export async function deleteGoal(id: string) {
  await getGoalById(id);
  return prisma.goal.delete({ where: { id } });
}

/** Summary stats for dashboard panel */
export async function getGoalsSummary() {
  const [active, completed, total] = await Promise.all([
    prisma.goal.count({ where: { status: GoalStatus.ACTIVE } }),
    prisma.goal.count({ where: { status: GoalStatus.COMPLETED } }),
    prisma.goal.count(),
  ]);

  const topGoals = await prisma.goal.findMany({
    where: { status: GoalStatus.ACTIVE },
    orderBy: { progress: 'desc' },
    take: 3,
    select: { id: true, title: true, progress: true, type: true, targetDate: true },
  });

  return { active, completed, total, topGoals };
}
