import * as taskRepo from '../repositories/taskRepository';
import * as plannerRepo from '../repositories/plannerRepository';
import { analyzeTask } from './aiService';
import { generateContent } from '../ai/geminiClient';
import { buildTaskPrioritizationPrompt } from '../prompts/prioritization/taskPrioritizationPrompt';
import { AppError, type PaginationQuery } from '../types/index';
import type { CreateTaskInput, UpdateTaskInput } from '../validators/taskValidator';
import { TaskStatus } from '@prisma/client';
import { calculateTaskRiskOffline } from './riskAnalysisService';
import { generateRecoveryPlanOffline } from './recoveryEngineService';
import { logApiMetric } from './analyticsService';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Zod response schema for task prioritization validation
// ─────────────────────────────────────────────────────────────

const prioritizationResponseSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      priorityScore: z.number().int().min(1).max(100),
      priorityLabel: z.enum(['Critical', 'High', 'Medium', 'Low']),
      priorityReason: z.string().max(300),
      confidence: z.number().min(0).max(1),
      riskScore: z.number().int().min(0).max(100),
      riskLevel: z.enum(['Safe', 'Warning', 'Critical']),
      completionProb: z.number().min(0).max(1),
      missProbability: z.number().min(0).max(1),
      timeDeficit: z.number(),
      recoveryPlan: z.object({
        suggestedReschedule: z.string(),
        alternativeOrder: z.array(z.string()),
        tasksToDefer: z.array(z.string()),
        productivityRecommendations: z.array(z.string()),
      }).nullable().optional(),
    })
  ),
});

// ─────────────────────────────────────────────────────────────
// Fallback Prioritization Engine
// ─────────────────────────────────────────────────────────────

export function calculateFallbackPriorities(tasks: any[]): any[] {
  return tasks.map((task) => {
    let score = 0;

    // 1. Deadline Proximity (Max 45 points)
    if (task.deadline) {
      const msDiff = new Date(task.deadline).getTime() - Date.now();
      const hoursDiff = msDiff / (1000 * 60 * 60);
      if (hoursDiff < 0) {
        score += 45; // Overdue
      } else if (hoursDiff <= 24) {
        score += 45; // Due within 1 day
      } else if (hoursDiff <= 72) {
        score += 30; // Due within 3 days
      } else if (hoursDiff <= 168) {
        score += 15; // Due within 7 days
      } else {
        score += 5;
      }
    } else {
      score += 10; // No deadline default
    }

    // 2. Estimated Duration (Max 15 points)
    const hrs = task.estimatedHours ?? 0;
    if (hrs >= 8) score += 15;
    else if (hrs >= 4) score += 10;
    else if (hrs >= 2) score += 5;
    else score += 2;

    // 3. Risk Level (Max 15 points)
    const risk = task.riskLevel ?? 'LOW';
    if (risk === 'CRITICAL') score += 15;
    else if (risk === 'HIGH') score += 11;
    else if (risk === 'MEDIUM') score += 6;
    else score += 3;

    // 4. Difficulty (Max 15 points)
    const diff = task.difficulty ?? 'EASY';
    if (diff === 'EXPERT') score += 15;
    else if (diff === 'HARD') score += 11;
    else if (diff === 'MEDIUM') score += 6;
    else score += 3;

    // 5. Dependencies (Max 10 points)
    const deps = task.dependencies as string[] | null;
    if (deps && deps.length > 0) {
      score += 10;
    }

    score = Math.min(100, Math.max(1, score));

    // Label mapping
    let label: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
    if (score >= 80) label = 'Critical';
    else if (score >= 60) label = 'High';
    else if (score >= 40) label = 'Medium';

    // Calculate Task Risk Offline
    const riskMetrics = calculateTaskRiskOffline(task);
    
    // Generate Recovery Plan if Warning or Critical
    let recoveryPlan: any = null;
    if (riskMetrics.riskLevel === 'Warning' || riskMetrics.riskLevel === 'Critical') {
      recoveryPlan = generateRecoveryPlanOffline(task, tasks);
    }

    return {
      id: task.id,
      priorityScore: score,
      priorityLabel: label,
      priorityReason: `Calculated offline using weighted rules (due date proximity, estimated hours: ${hrs}h, difficulty: ${diff}, risk: ${risk}).`,
      confidence: 0.5,
      riskScore: riskMetrics.riskScore,
      riskLevel: riskMetrics.riskLevel,
      completionProb: riskMetrics.completionProb,
      missProbability: riskMetrics.missProbability,
      timeDeficit: riskMetrics.timeDeficit,
      recoveryPlan,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Debounced Background Prioritization Queue
// ─────────────────────────────────────────────────────────────

class PrioritizationScheduler {
  private timeoutId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private needsCatchup = false;

  public trigger() {
    void plannerRepo.markTodayPlanStale();

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      void this.process();
    }, 5000);
  }

  private async process() {
    if (this.isProcessing) {
      this.needsCatchup = true;
      return;
    }

    this.isProcessing = true;
    this.needsCatchup = false;

    try {
      console.log('🔄 [TaskService] Executing background task reprioritization...');
      await reprioritizeActiveTasks();
      console.log('✅ [TaskService] Background reprioritization completed successfully.');
    } catch (err) {
      console.error('❌ [TaskService] Background reprioritization error:', err);
    } finally {
      this.isProcessing = false;
      if (this.needsCatchup) {
        this.trigger();
      }
    }
  }
}

const reprioritizationScheduler = new PrioritizationScheduler();

export function triggerBackgroundReprioritization() {
  reprioritizationScheduler.trigger();
}

// ─────────────────────────────────────────────────────────────
// Business Logic Functions
// ─────────────────────────────────────────────────────────────

/** Run relative Dynamic Task Prioritization (AI with Fallback) */
export async function reprioritizeActiveTasks() {
  const activeTasks = await taskRepo.findActiveTasks();
  if (activeTasks.length === 0) {
    return [];
  }

  let updates: any[];

  try {
    const prompt = buildTaskPrioritizationPrompt(
      activeTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        deadline: t.deadline,
        estimatedHours: t.estimatedHours,
        difficulty: t.difficulty,
        riskLevel: t.riskLevel,
        tags: t.tags,
        dependencies: t.dependencies as string[] | null,
      }))
    );

    const raw = await generateContent(prompt);
    const parsed = JSON.parse(raw);
    const validated = prioritizationResponseSchema.parse(parsed);

    updates = validated.tasks;
    void logApiMetric('GEMINI_PRIORITIZATION', 'SUCCESS', 'Relative prioritization & risk analysis complete');
  } catch (err) {
    console.warn(
      `⚠️ [TaskService] Gemini prioritization failed, falling back to offline planner. Error: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    void logApiMetric('OFFLINE_FALLBACK', 'SUCCESS', `Prioritization offline fallback generated: ${err instanceof Error ? err.message : 'Unknown'}`);
    updates = calculateFallbackPriorities(activeTasks);
  }

  await taskRepo.updateTaskPriorities(updates);
  return taskRepo.findActiveTasks();
}

/** Create and trigger Initial Task Analysis (Phase 1) + Reprioritizations */
export async function createAndAnalyzeTask(input: CreateTaskInput) {
  const task = await taskRepo.createTask(input);
  await taskRepo.updateTaskStatus(task.id, TaskStatus.ANALYZING);

  try {
    const analysis = await analyzeTask({
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      estimatedHours: task.estimatedHours,
      tags: task.tags,
    });

    const enriched = await taskRepo.updateTaskWithAnalysis(task.id, analysis);
    void logApiMetric('GEMINI_ANALYSIS', 'SUCCESS', 'Initial task analysis complete');
    triggerBackgroundReprioritization();
    return enriched;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'AI analysis failed — unknown error';
    await taskRepo.markAnalysisError(task.id, message);
    triggerBackgroundReprioritization();
    throw err;
  }
}

/** Read */
export async function getTaskById(taskId: string) {
  const task = await taskRepo.findTaskById(taskId);
  if (!task) {
    throw new AppError(`Task '${taskId}' not found`, 404);
  }
  return task;
}

export async function listTasks(
  pagination: PaginationQuery,
  filters: { status?: TaskStatus; search?: string }
) {
  return taskRepo.findAllTasks(pagination, filters);
}

/** Update mutable task fields */
export async function updateTask(taskId: string, data: UpdateTaskInput) {
  const existing = await taskRepo.findTaskById(taskId);
  if (!existing) {
    throw new AppError(`Task '${taskId}' not found`, 404);
  }
  const task = await taskRepo.updateTask(taskId, data);
  triggerBackgroundReprioritization();
  return task;
}

/** Hard-delete task */
export async function deleteTask(taskId: string) {
  const existing = await taskRepo.findTaskById(taskId);
  if (!existing) {
    throw new AppError(`Task '${taskId}' not found`, 404);
  }
  const result = await taskRepo.deleteTask(taskId);
  triggerBackgroundReprioritization();
  return result;
}

/** Force re-run analysis (Phase 1) */
export async function reanalyzeTask(taskId: string) {
  const task = await taskRepo.findTaskById(taskId);
  if (!task) {
    throw new AppError(`Task '${taskId}' not found`, 404);
  }

  await taskRepo.updateTaskStatus(task.id, TaskStatus.ANALYZING);

  try {
    const analysis = await analyzeTask({
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      estimatedHours: task.estimatedHours,
      tags: task.tags,
    });

    const enriched = await taskRepo.updateTaskWithAnalysis(task.id, analysis);
    triggerBackgroundReprioritization();
    return enriched;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Re-analysis failed';
    await taskRepo.markAnalysisError(task.id, message);
    triggerBackgroundReprioritization();
    throw err;
  }
}
