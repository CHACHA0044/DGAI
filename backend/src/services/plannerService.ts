import * as plannerRepo from '../repositories/plannerRepository';
import * as taskRepo from '../repositories/taskRepository';
import { generateContent } from '../ai/geminiClient';
import { buildDailyPlannerPrompt } from '../prompts/planner/dailyPlannerPrompt';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Zod Response Schema for Daily Plan Verification
// ─────────────────────────────────────────────────────────────

const plannerResponseSchema = z.object({
  schedule: z.array(
    z.object({
      timeSlot: z.string(),
      taskTitle: z.string(),
      taskId: z.string().nullable(),
      activityType: z.enum(['DEEP_WORK', 'QUICK_WIN', 'BREAK', 'ADMINISTRATIVE']),
    })
  ),
  suggestedOrder: z.array(z.string()),
  recommendedBreaks: z.array(z.string()),
  expectedFinishTime: z.string(),
  tasksToPostpone: z.array(z.string()),
  mostImportantTask: z.string(),
  recommendedFocusSession: z.string(),
  quickWins: z.array(z.string()),
  highEffortWork: z.array(z.string()),
  deepWorkBlocks: z.array(z.string()),
});

type DailyPlanResult = z.infer<typeof plannerResponseSchema>;

// ─────────────────────────────────────────────────────────────
// Fallback Offline Planner Algorithm
// ─────────────────────────────────────────────────────────────

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${ampm}`;
}

export function generateFallbackPlan(tasks: any[]): DailyPlanResult {
  const sorted = [...tasks].sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));

  const schedule: DailyPlanResult['schedule'] = [];
  const suggestedOrder: string[] = [];
  const tasksToPostpone: string[] = [];
  const quickWins: string[] = [];
  const highEffortWork: string[] = [];
  const deepWorkBlocks: string[] = [];

  let currentMinutes = 9 * 60; // Start at 9:00 AM
  const maxEndMinutes = 17 * 60; // Workday ends at 5:00 PM (8 hours total)
  let continuousWorkMinutes = 0;

  for (const task of sorted) {
    const isQuick = (task.estimatedHours ?? 0) <= 2 && (task.difficulty === 'EASY' || task.difficulty === 'MEDIUM');
    const isHigh = (task.estimatedHours ?? 0) > 3 && (task.difficulty === 'HARD' || task.difficulty === 'EXPERT');

    if (isQuick) quickWins.push(task.title);
    if (isHigh) highEffortWork.push(task.title);

    // If day is full, postpone
    if (currentMinutes >= maxEndMinutes) {
      tasksToPostpone.push(task.title);
      continue;
    }

    // Determine slot duration (default to 1 hour, max 2.5 hours)
    const taskHours = task.estimatedHours ?? 1;
    const durationMinutes = Math.min(150, Math.max(30, Math.round(taskHours * 60)));

    // Insert short break after 2 hours of continuous work
    if (continuousWorkMinutes >= 120) {
      const breakStart = currentMinutes;
      const breakEnd = currentMinutes + 15;
      schedule.push({
        timeSlot: `${formatTime(breakStart)} - ${formatTime(breakEnd)}`,
        taskTitle: 'Coffee & Stretch Break',
        taskId: null,
        activityType: 'BREAK',
      });
      currentMinutes = breakEnd;
      continuousWorkMinutes = 0;
    }

    const start = currentMinutes;
    const end = Math.min(maxEndMinutes, currentMinutes + durationMinutes);

    if (start < end) {
      schedule.push({
        timeSlot: `${formatTime(start)} - ${formatTime(end)}`,
        taskTitle: task.title,
        taskId: task.id,
        activityType: isQuick ? 'QUICK_WIN' : 'DEEP_WORK',
      });

      suggestedOrder.push(task.id);
      if (task.priorityScore && task.priorityScore >= 70) {
        deepWorkBlocks.push(`Focus session on "${task.title}" (${Math.round((end - start) / 60)}h)`);
      }

      const allocatedMinutes = end - start;
      currentMinutes = end;
      continuousWorkMinutes += allocatedMinutes;
    } else {
      tasksToPostpone.push(task.title);
    }
  }

  // Ensure lunch break if workday goes past 1:00 PM
  const lunchTime = 13 * 60;
  const hasLunch = schedule.some(s => {
    const startStr = s.timeSlot.split(' - ')[0];
    return startStr.includes('1:00 PM') || startStr.includes('12:00 PM');
  });

  if (!hasLunch && currentMinutes > lunchTime) {
    schedule.push({
      timeSlot: '12:00 PM - 01:00 PM',
      taskTitle: 'Lunch Break',
      taskId: null,
      activityType: 'BREAK',
    });
  }

  const mostImportantTask = sorted[0]?.title ?? 'No active tasks';
  const expectedFinishTime = formatTime(Math.min(maxEndMinutes, currentMinutes));

  return {
    schedule,
    suggestedOrder,
    recommendedBreaks: ['15-minute screen rest', 'Hydration break after deep blocks'],
    expectedFinishTime,
    tasksToPostpone,
    mostImportantTask,
    recommendedFocusSession: 'Pomodoro 50/10 Session',
    quickWins,
    highEffortWork,
    deepWorkBlocks: deepWorkBlocks.length > 0 ? deepWorkBlocks : ['Deep focus on priority items'],
  };
}

// ─────────────────────────────────────────────────────────────
// Core Services
// ─────────────────────────────────────────────────────────────

/** Retrieve today's daily plan (cached check + generation) */
export async function getTodayPlan() {
  const todayStr = new Date().toISOString().split('T')[0];
  const plan = await plannerRepo.findPlanByDate(todayStr);

  if (plan && !plan.isStale) {
    return plan;
  }

  return generatePlan(todayStr);
}

/** Generate daily plan (AI with Fallback) */
export async function generatePlan(dateStr: string) {
  const activeTasks = await taskRepo.findActiveTasks();

  if (activeTasks.length === 0) {
    return plannerRepo.savePlan({
      date: dateStr,
      schedule: [],
      suggestedOrder: [],
      recommendedBreaks: [],
      expectedFinishTime: '—',
      tasksToPostpone: [],
      mostImportantTask: '—',
      recommendedFocusSession: '—',
      quickWins: [],
      highEffortWork: [],
      deepWorkBlocks: [],
      isFallback: true,
    });
  }

  let planData: DailyPlanResult;
  let isFallback = false;

  try {
    const prompt = buildDailyPlannerPrompt(
      activeTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        deadline: t.deadline,
        estimatedHours: t.estimatedHours,
        difficulty: t.difficulty,
        riskLevel: t.riskLevel,
        priorityScore: t.priorityScore,
        priorityLabel: t.priorityLabel,
        tags: t.tags,
        dependencies: t.dependencies as string[] | null,
      }))
    );

    const raw = await generateContent(prompt);
    const parsed = JSON.parse(raw);
    planData = plannerResponseSchema.parse(parsed);
  } catch (err) {
    console.warn(
      `⚠️ [PlannerService] Gemini planner generation failed. Falling back to offline scheduler. Error: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    planData = generateFallbackPlan(activeTasks);
    isFallback = true;
  }

  return plannerRepo.savePlan({
    date: dateStr,
    schedule: planData.schedule,
    suggestedOrder: planData.suggestedOrder,
    recommendedBreaks: planData.recommendedBreaks,
    expectedFinishTime: planData.expectedFinishTime,
    tasksToPostpone: planData.tasksToPostpone,
    mostImportantTask: planData.mostImportantTask,
    recommendedFocusSession: planData.recommendedFocusSession,
    quickWins: planData.quickWins,
    highEffortWork: planData.highEffortWork,
    deepWorkBlocks: planData.deepWorkBlocks,
    isFallback,
  });
}
