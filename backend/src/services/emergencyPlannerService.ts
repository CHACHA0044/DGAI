import * as taskRepo from '../repositories/taskRepository';
import { generateContent } from '../ai/geminiClient';
import { buildEmergencyPlannerPrompt } from '../prompts/planner/emergencyPlanPrompt';
import { logApiMetric } from './analyticsService';
import { createNotification, NotificationTypes } from './notificationService';
import { getSettings } from './settingsService';
import { Task } from '@prisma/client';
import { z } from 'zod';

// Global toggle for user manual activation
let manualEmergencyActive = false;

// ─────────────────────────────────────────────────────────────
// Zod Schema for Emergency Plan
// ─────────────────────────────────────────────────────────────

const emergencyPlanSchema = z.object({
  tasksToComplete: z.array(z.string()),
  tasksToPostpone: z.array(z.string()),
  tasksToCancel: z.array(z.string()),
  recoveryStrategy: z.string(),
  compressedSchedule: z.array(
    z.object({
      timeSlot: z.string(),
      activity: z.string(),
      durationMinutes: z.number().int().positive(),
    })
  ),
  breakRecommendations: z.array(z.string()),
  successProbability: z.number().min(0).max(1),
  recoveryEta: z.string(),
  confidenceScore: z.number().min(0).max(1),
  nextBestAction: z.string(),
});

export type EmergencyPlanResult = z.infer<typeof emergencyPlanSchema>;

// ─────────────────────────────────────────────────────────────
// Manual Activation Toggle Get/Set
// ─────────────────────────────────────────────────────────────

export function setManualEmergency(active: boolean) {
  manualEmergencyActive = active;
  if (active) {
    void logApiMetric('EMERGENCY_TRIGGER', 'SUCCESS', 'Manual activation by user');
    void createNotification(null, NotificationTypes.EMERGENCY_MODE, 'Emergency Mode manually activated by user.');
  }
}

export function isManualEmergencyActive() {
  return manualEmergencyActive;
}

// ─────────────────────────────────────────────────────────────
// Offline Fallback Emergency Scheduler
// ─────────────────────────────────────────────────────────────

export function generateEmergencyPlanOffline(tasks: Task[], triggerReason: string): EmergencyPlanResult {
  const sorted = [...tasks].sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));

  const tasksToComplete = sorted.slice(0, 2).map(t => t.title);
  const tasksToPostpone = sorted.slice(2, 4).map(t => t.title);
  const tasksToCancel = sorted.slice(4).map(t => t.title);

  const compressedSchedule: EmergencyPlanResult['compressedSchedule'] = [];
  
  const now = new Date();
  let currentMs = now.getTime();
  
  const formatTime = (ms: number) => {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 1st focus session
  if (sorted[0]) {
    const startStr = formatTime(currentMs);
    currentMs += 110 * 60000;
    const endStr = formatTime(currentMs);
    compressedSchedule.push({
      timeSlot: `${startStr} - ${endStr}`,
      activity: `🚀 Deep Focus Session: ${sorted[0].title}`,
      durationMinutes: 110,
    });
  }

  // Break
  const breakStart = formatTime(currentMs);
  currentMs += 15 * 60000;
  const breakEnd = formatTime(currentMs);
  compressedSchedule.push({
    timeSlot: `${breakStart} - ${breakEnd}`,
    activity: 'Stretch & Breathing Rest',
    durationMinutes: 15,
  });

  // 2nd focus session
  if (sorted[1]) {
    const startStr = formatTime(currentMs);
    currentMs += 110 * 60000;
    const endStr = formatTime(currentMs);
    compressedSchedule.push({
      timeSlot: `${startStr} - ${endStr}`,
      activity: `⚡ High-Intensity Block: ${sorted[1].title}`,
      durationMinutes: 110,
    });
  }

  return {
    tasksToComplete: tasksToComplete.length > 0 ? tasksToComplete : ['Core priority tasks'],
    tasksToPostpone,
    tasksToCancel,
    recoveryStrategy: `Emergency Mode active due to: ${triggerReason}. Focusing exclusively on top-ranked deliverables, postponing less urgent items, and running compressed 110-minute deep-focus work intervals.`,
    compressedSchedule,
    breakRecommendations: [
      'Take 5 minutes for square breathing between focus sessions.',
      'Drink 500ml water during focus breaks to maintain cognitive sharpness.',
    ],
    successProbability: 0.65,
    recoveryEta: `Today ${formatTime(currentMs)}`,
    confidenceScore: 0.8,
    nextBestAction: sorted[0] ? `Open "${sorted[0].title}" and begin the first subtask immediately.` : 'Create a priority task.',
  };
}

// ─────────────────────────────────────────────────────────────
// Core Services
// ─────────────────────────────────────────────────────────────

/** Assess workload conditions and check if Emergency Mode is triggered */
export async function checkEmergencyStatus(): Promise<{ isEmergency: boolean; reason: string }> {
  const activeTasks = await taskRepo.findActiveTasks();
  
  if (manualEmergencyActive) {
    return { isEmergency: true, reason: 'Manually activated by user' };
  }

  if (activeTasks.length === 0) {
    return { isEmergency: false, reason: '' };
  }

  // Query user settings for dynamic threshold hours
  const settings = await getSettings().catch(() => ({ emergencyThresholdHours: 2.0 }));
  const threshold = settings.emergencyThresholdHours;

  // Condition 1: High Workload - Too many pending hours (>20 hours)
  const totalPendingHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  if (totalPendingHours > 20) {
    void createNotification(null, NotificationTypes.HIGH_WORKLOAD, `High workload alert: ${totalPendingHours.toFixed(1)}h pending.`);
    return { isEmergency: true, reason: `Total pending hours limit exceeded: ${totalPendingHours.toFixed(1)} hours calculated.` };
  }

  // Condition 2: Critical task risk score (riskScore >= 80)
  const criticalTask = activeTasks.find(t => t.riskScore !== null && t.riskScore >= 80);
  if (criticalTask) {
    void createNotification(criticalTask.id, NotificationTypes.RISK_INCREASED, `Critical risk detected on: "${criticalTask.title}".`);
    return { isEmergency: true, reason: `Critical risk level (Score ${criticalTask.riskScore}) on: "${criticalTask.title}".` };
  }

  // Condition 3: Impossible schedule or threshold warning
  for (const task of activeTasks) {
    if (task.deadline) {
      const hoursToDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursToDeadline > 0) {
        if (hoursToDeadline < (task.estimatedHours ?? 0) || hoursToDeadline <= threshold) {
          void createNotification(task.id, NotificationTypes.OVERDUE, `Impossible deadline or threshold warning for: "${task.title}".`);
          return {
            isEmergency: true,
            reason: hoursToDeadline <= threshold
              ? `Task "${task.title}" deadline is within the emergency threshold buffer of ${threshold}h.`
              : `Time left (${hoursToDeadline.toFixed(1)}h) is less than estimate (${task.estimatedHours}h) on: "${task.title}".`,
          };
        }
      }
    }
  }

  return { isEmergency: false, reason: '' };
}

/** Generate Emergency Recovery Plan (AI with Fallback) */
export async function getEmergencyPlan(): Promise<EmergencyPlanResult> {
  const { isEmergency, reason } = await checkEmergencyStatus();
  const activeTasks = await taskRepo.findActiveTasks();

  if (!isEmergency || activeTasks.length === 0) {
    return {
      tasksToComplete: [],
      tasksToPostpone: [],
      tasksToCancel: [],
      recoveryStrategy: 'System is healthy. Emergency Mode is currently inactive.',
      compressedSchedule: [],
      breakRecommendations: [],
      successProbability: 1.0,
      recoveryEta: '—',
      confidenceScore: 1.0,
      nextBestAction: 'Continue with your standard planner.',
    };
  }

  try {
    const prompt = buildEmergencyPlannerPrompt(
      activeTasks.map(t => ({
        id: t.id,
        title: t.title,
        deadline: t.deadline,
        estimatedHours: t.estimatedHours,
        difficulty: t.difficulty,
        riskLevel: t.riskLevel,
        priorityScore: t.priorityScore ?? 50,
      })),
      reason
    );

    const raw = await generateContent(prompt);
    
    // Resilient cleaning of potential Gemini markdown fences (e.g. ```json ... ```)
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, '');
      cleaned = cleaned.replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned.trim());
    const validated = emergencyPlanSchema.parse(parsed);

    void logApiMetric('GEMINI_CALL', 'SUCCESS', 'Emergency Mode calculation completed via Gemini');
    return validated;
  } catch (err) {
    console.warn(
      `⚠️ [EmergencyPlannerService] Gemini calculation failed, falling back to offline planner. Error: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    void logApiMetric('OFFLINE_FALLBACK', 'SUCCESS', `Emergency Mode fallback generated due to error: ${err instanceof Error ? err.message : 'Unknown'}`);
    return generateEmergencyPlanOffline(activeTasks, reason);
  }
}
