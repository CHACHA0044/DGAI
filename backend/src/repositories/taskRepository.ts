import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import type { CreateTaskInput, UpdateTaskInput } from '../validators/taskValidator';
import type { AIAnalysisResult, PaginationQuery } from '../types/index';

// ─────────────────────────────────────────────────────────────
// Filters interface
// ─────────────────────────────────────────────────────────────

export interface TaskFilters {
  status?: TaskStatus;
  search?: string;
}

// ─────────────────────────────────────────────────────────────
// Write operations
// ─────────────────────────────────────────────────────────────

/** Create a new DRAFT task — no AI fields yet */
export async function createTask(data: CreateTaskInput) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      deadline: data.deadline ?? null,
      estimatedHours: data.estimatedHours ?? null,
      tags: data.tags ?? [],
      status: TaskStatus.DRAFT,
    },
  });
}

/** Overwrite status only (used to set ANALYZING before AI runs) */
export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  return prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
}

/** Merge AI analysis results into the task record */
export async function updateTaskWithAnalysis(taskId: string, analysis: AIAnalysisResult) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      aiPriority: analysis.priority,
      difficulty: analysis.difficulty,
      riskLevel: analysis.riskLevel,
      estimatedCompletion: analysis.estimatedCompletion,
      executionPlan: analysis.executionPlan,
      productivityAdvice: analysis.productivityAdvice,
      nextImmediateStep: analysis.nextImmediateStep,
      potentialBlockers: analysis.potentialBlockers as unknown as Prisma.InputJsonValue,
      dependencies: analysis.dependencies as unknown as Prisma.InputJsonValue,
      subtasks: analysis.subtasks as unknown as Prisma.InputJsonValue,
      status: TaskStatus.ACTIVE,
      isAnalyzed: true,
      analyzedAt: new Date(),
      analysisError: null,
    },
  });
}

/** Store an analysis failure reason and revert status to DRAFT */
export async function markAnalysisError(taskId: string, errorMessage: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.DRAFT,
      analysisError: errorMessage,
    },
  });
}

/** Update mutable task fields (user edits, not AI fields) */
export async function updateTask(taskId: string, data: UpdateTaskInput) {
  const { title, description, deadline, estimatedHours, tags, status } = data;

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(deadline !== undefined && { deadline }),
      ...(estimatedHours !== undefined && { estimatedHours }),
      ...(tags !== undefined && { tags }),
      ...(status !== undefined && { status: status as TaskStatus }),
    },
  });
}

/** Hard-delete a task by ID */
export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } });
}

// ─────────────────────────────────────────────────────────────
// Read operations
// ─────────────────────────────────────────────────────────────

export async function findTaskById(taskId: string) {
  return prisma.task.findUnique({ where: { id: taskId } });
}

/** Paginated task list with optional status and full-text search filters */
export async function findAllTasks(pagination: PaginationQuery, filters: TaskFilters = {}) {
  const page = Math.max(1, pagination.page ?? 1);
  const limit = Math.min(50, Math.max(1, pagination.limit ?? 10));
  const skip = (page - 1) * limit;

  const where: Prisma.TaskWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { aiPriority: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/** Get all active tasks for relative prioritization */
export async function findActiveTasks() {
  return prisma.task.findMany({
    where: {
      status: {
        in: [TaskStatus.ACTIVE, TaskStatus.IN_PROGRESS],
      },
    },
  });
}

/** Bulk update dynamic prioritization details in a transaction */
export async function updateTaskPriorities(
  updates: {
    id: string;
    priorityScore: number;
    priorityLabel: string;
    priorityReason: string;
    confidence: number;
    riskScore: number;
    riskLevel: string;
    completionProb: number;
    missProbability: number;
    timeDeficit: number;
    recoveryPlan: any;
  }[]
) {
  return prisma.$transaction(
    updates.map((u) => {
      // Map Safe, Warning, Critical to the DB RiskLevel enum LOW, HIGH, CRITICAL
      let dbRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (u.riskLevel === 'Critical') dbRisk = 'CRITICAL';
      else if (u.riskLevel === 'Warning') dbRisk = 'HIGH';

      return prisma.task.update({
        where: { id: u.id },
        data: {
          priorityScore: u.priorityScore,
          priorityLabel: u.priorityLabel,
          priorityReason: u.priorityReason,
          confidence: u.confidence,
          lastPrioritizedAt: new Date(),
          riskScore: u.riskScore,
          riskLevel: dbRisk,
          completionProb: u.completionProb,
          missProbability: u.missProbability,
          timeDeficit: u.timeDeficit,
          recoveryPlan: u.recoveryPlan ?? null,
          lastRiskAnalysisAt: new Date(),
        },
      });
    })
  );
}

