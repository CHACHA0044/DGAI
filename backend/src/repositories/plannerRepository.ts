import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export interface SavePlanInput {
  date: string;
  schedule: Prisma.InputJsonValue;
  suggestedOrder: Prisma.InputJsonValue;
  recommendedBreaks: Prisma.InputJsonValue;
  expectedFinishTime: string;
  tasksToPostpone: Prisma.InputJsonValue;
  mostImportantTask: string;
  recommendedFocusSession: string;
  quickWins: Prisma.InputJsonValue;
  highEffortWork: Prisma.InputJsonValue;
  deepWorkBlocks: Prisma.InputJsonValue;
  isFallback: boolean;
}

/** Retrieve daily plan by YYYY-MM-DD string */
export async function findPlanByDate(dateStr: string) {
  return prisma.dailyPlan.findUnique({
    where: { date: dateStr },
  });
}

/** Save or update a daily plan */
export async function savePlan(input: SavePlanInput) {
  return prisma.dailyPlan.upsert({
    where: { date: input.date },
    create: {
      date: input.date,
      schedule: input.schedule,
      suggestedOrder: input.suggestedOrder,
      recommendedBreaks: input.recommendedBreaks,
      expectedFinishTime: input.expectedFinishTime,
      tasksToPostpone: input.tasksToPostpone,
      mostImportantTask: input.mostImportantTask,
      recommendedFocusSession: input.recommendedFocusSession,
      quickWins: input.quickWins,
      highEffortWork: input.highEffortWork,
      deepWorkBlocks: input.deepWorkBlocks,
      isFallback: input.isFallback,
      isStale: false,
    },
    update: {
      schedule: input.schedule,
      suggestedOrder: input.suggestedOrder,
      recommendedBreaks: input.recommendedBreaks,
      expectedFinishTime: input.expectedFinishTime,
      tasksToPostpone: input.tasksToPostpone,
      mostImportantTask: input.mostImportantTask,
      recommendedFocusSession: input.recommendedFocusSession,
      quickWins: input.quickWins,
      highEffortWork: input.highEffortWork,
      deepWorkBlocks: input.deepWorkBlocks,
      isFallback: input.isFallback,
      isStale: false,
    },
  });
}

/** Mark today's plan as stale */
export async function markTodayPlanStale() {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    return await prisma.dailyPlan.update({
      where: { date: todayStr },
      data: { isStale: true },
    });
  } catch {
    // If today's plan doesn't exist yet, we do not need to mark it stale
    return null;
  }
}
