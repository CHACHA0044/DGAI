/**
 * Daily Planner Prompt Template — Version 1.0.0
 * 
 * Generates the prompt for Gemini to construct a daily plan from active tasks.
 */

import { sanitizeInput, formatDate } from '../shared/promptUtils';

export interface PlannerTaskInput {
  id: string;
  title: string;
  description?: string | null;
  deadline?: Date | string | null;
  estimatedHours?: number | null;
  difficulty?: string | null;
  riskLevel?: string | null;
  priorityScore?: number | null;
  priorityLabel?: string | null;
  tags?: string[];
  dependencies?: string[] | null;
}

export function buildDailyPlannerPrompt(tasks: PlannerTaskInput[]): string {
  const tasksFormatted = tasks.map((t) => {
    const title = sanitizeInput(t.title, 100);
    const desc = t.description ? sanitizeInput(t.description, 150) : 'None';
    const deadline = formatDate(t.deadline);
    const est = t.estimatedHours ? `${t.estimatedHours}h` : 'Not specified';
    const score = t.priorityScore ?? 'Unscored';
    const label = t.priorityLabel ?? 'Unscored';

    return `- ID: ${t.id}
  Title: ${title}
  Description: ${desc}
  Deadline: ${deadline}
  Estimated Hours: ${est}
  Dynamic Priority: ${score} (${label})`;
  }).join('\n\n');

  return `You are a cognitive workflow optimizer and scheduling assistant. 
Review the active tasks below and generate today's schedule for an 8-hour workday starting at 9:00 AM.

ACTIVE TASKS:
${tasksFormatted}

You must construct a structured JSON plan for today. Assume today is ${new Date().toISOString().split('T')[0]}.
Follow these rules:
1. Schedule deep work blocks (max 90-120 minutes each) for the highest priority tasks.
2. Schedule quick wins (tasks with low estimated hours or easy difficulty) in slots where energy is medium (e.g. after lunch or late afternoon).
3. Schedule explicit 15-minute breaks after deep work blocks or every 2 hours.
4. If tasks exceed the 8-hour limit, recommend specific tasks to postpone.
5. Identify the single Most Important Task (MIT) for today.
6. Provide a recommended focus session format (e.g. Pomodoro 50/10).

Return ONLY a valid JSON object matching this structure:
{
  "schedule": [
    {
      "timeSlot": "09:00 AM - 10:30 AM",
      "taskTitle": "<Task Title or Break name>",
      "taskId": "<task_id or null if break/custom block>",
      "activityType": "<one of: DEEP_WORK, QUICK_WIN, BREAK, ADMINISTRATIVE>"
    }
  ],
  "suggestedOrder": ["<task_id>", ...],
  "recommendedBreaks": ["<short description of break, e.g. 15-min walk>", ...],
  "expectedFinishTime": "05:00 PM",
  "tasksToPostpone": ["<task_id or title>", ...],
  "mostImportantTask": "<task_id or title>",
  "recommendedFocusSession": "<e.g. Pomodoro 50/10>",
  "quickWins": ["<task_id or title>", ...],
  "highEffortWork": ["<task_id or title>", ...],
  "deepWorkBlocks": ["<description of deep work blocks>", ...]
}

Constraints:
- Return ONLY the JSON object. Do not include markdown code blocks or explanations outside the JSON.
- All titles/descriptions in English.`;
}
