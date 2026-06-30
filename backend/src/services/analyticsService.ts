import { prisma } from '../config/database';
import { TaskStatus } from '@prisma/client';

export interface AnalyticsSummary {
  completedTasks: number;
  overdueTasks: number;
  avgCompletionTimeHours: number;
  avgDelayHours: number;
  geminiSuccessRate: number;
  offlineFallbackUsage: number;
  recoverySuccessRate: number;
  priorityAccuracy: number; // Completed critical tasks / total critical tasks
  healthScore: number; // 0-100 overall planning health index
}

/** Record a success/failure API call event for monitoring */
export async function logApiMetric(metric: string, status: 'SUCCESS' | 'FAILURE', details?: string): Promise<void> {
  try {
    await prisma.plannerMetric.create({
      data: {
        metric,
        status,
        details,
      },
    });
  } catch (err) {
    console.error('Failed to log API metric event in database:', err);
  }
}

/** Calculate complete companion analytics metrics */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [tasks, completedTasksCount] = await Promise.all([
    prisma.task.findMany(),
    prisma.task.count({ where: { status: TaskStatus.COMPLETED } }),
  ]);

  // Overdue calculation (ACTIVE/IN_PROGRESS tasks where deadline has passed)
  const overdueTasksCount = tasks.filter(t => {
    return (
      (t.status === TaskStatus.ACTIVE || t.status === TaskStatus.IN_PROGRESS) &&
      t.deadline &&
      new Date(t.deadline).getTime() < Date.now()
    );
  }).length;

  // Average Completion Time (creation to completion)
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED && t.analyzedAt);
  let totalCompletionMs = 0;
  completedTasks.forEach(t => {
    totalCompletionMs += new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
  });
  const avgCompletionTimeHours = completedTasks.length > 0 
    ? Math.round((totalCompletionMs / (1000 * 60 * 60 * completedTasks.length)) * 10) / 10 
    : 0;

  // Average Delay (time past deadline for completed tasks that finished late)
  let totalDelayMs = 0;
  let lateCompletedCount = 0;
  completedTasks.forEach(t => {
    if (t.deadline && new Date(t.updatedAt).getTime() > new Date(t.deadline).getTime()) {
      totalDelayMs += new Date(t.updatedAt).getTime() - new Date(t.deadline).getTime();
      lateCompletedCount++;
    }
  });
  const avgDelayHours = lateCompletedCount > 0
    ? Math.round((totalDelayMs / (1000 * 60 * 60 * lateCompletedCount)) * 10) / 10
    : 0;

  // Fetch API Diagnostics from database metrics
  const totalCalls = await prisma.plannerMetric.count({
    where: { metric: { in: ['GEMINI_CALL', 'GEMINI_PRIORITIZATION', 'GEMINI_PLANNER', 'GEMINI_ANALYSIS'] } }
  });
  const successCalls = await prisma.plannerMetric.count({
    where: {
      metric: { in: ['GEMINI_CALL', 'GEMINI_PRIORITIZATION', 'GEMINI_PLANNER', 'GEMINI_ANALYSIS'] },
      status: 'SUCCESS'
    }
  });
  const offlineFallbackUsage = await prisma.plannerMetric.count({
    where: { status: 'SUCCESS', metric: 'OFFLINE_FALLBACK' }
  });

  const geminiSuccessRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 100;

  // Recovery completion success (tasks that had a recoveryPlan and got completed)
  const recoveryTasks = tasks.filter(t => t.recoveryPlan !== null);
  const recoveryCompleted = recoveryTasks.filter(t => t.status === TaskStatus.COMPLETED);
  const recoverySuccessRate = recoveryTasks.length > 0
    ? Math.round((recoveryCompleted.length / recoveryTasks.length) * 100)
    : 100;

  // Priority Accuracy: Ratio of Critical Tasks that were completed
  const criticalTasks = tasks.filter(t => t.priorityLabel?.toLowerCase() === 'critical');
  const completedCritical = criticalTasks.filter(t => t.status === TaskStatus.COMPLETED);
  const priorityAccuracy = criticalTasks.length > 0
    ? Math.round((completedCritical.length / criticalTasks.length) * 100)
    : 100;

  // Health Score (Dynamic calculation based on completed tasks ratio and overdue tasks penalty)
  const totalActiveAndCompleted = tasks.filter(t => t.status !== TaskStatus.DRAFT && t.status !== TaskStatus.ARCHIVED).length;
  let healthScore = 100;
  if (totalActiveAndCompleted > 0) {
    const overduePenalty = (overdueTasksCount / totalActiveAndCompleted) * 50;
    const completionBonus = (completedTasksCount / totalActiveAndCompleted) * 20;
    const fallbackPenalty = (offlineFallbackUsage > 0 ? 10 : 0);
    healthScore = Math.min(100, Math.max(10, Math.round(100 - overduePenalty + completionBonus - fallbackPenalty)));
  }

  return {
    completedTasks: completedTasksCount,
    overdueTasks: overdueTasksCount,
    avgCompletionTimeHours,
    avgDelayHours,
    geminiSuccessRate,
    offlineFallbackUsage,
    recoverySuccessRate,
    priorityAccuracy,
    healthScore,
  };
}
