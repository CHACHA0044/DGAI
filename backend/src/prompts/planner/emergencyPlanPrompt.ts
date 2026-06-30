/**
 * Emergency Plan Prompt Template — Version 1.0.0
 * 
 * Generates prompt for Gemini to calculate compressed emergency schedules and recovery paths.
 */

import { sanitizeInput, formatDate } from '../shared/promptUtils';

export interface EmergencyTaskInput {
  id: string;
  title: string;
  deadline?: Date | string | null;
  estimatedHours?: number | null;
  difficulty?: string | null;
  riskLevel?: string | null;
  priorityScore?: number | null;
}

export function buildEmergencyPlannerPrompt(
  tasks: EmergencyTaskInput[],
  triggerReason: string
): string {
  const tasksFormatted = tasks.map((t) => {
    const title = sanitizeInput(t.title, 100);
    const deadline = formatDate(t.deadline);
    const est = t.estimatedHours ? `${t.estimatedHours}h` : 'Not specified';
    const score = t.priorityScore ?? 'Unscored';

    return `- ID: ${t.id}
  Title: ${title}
  Deadline: ${deadline}
  Hours: ${est}
  Difficulty: ${t.difficulty ?? 'Not analyzed'}
  Priority Score: ${score}`;
  }).join('\n\n');

  return `You are an Emergency Response System for project management. 
An EMERGENCY MODE has been triggered in the user's workload for the following reason:
"${triggerReason}"

ACTIVE WORKLOAD TO ASSESS:
${tasksFormatted}

You must create a highly compressed recovery schedule for today (starting at 9:00 AM, up to 10 hours if needed for critical tasks).
Follow these guidelines:
1. Identify "Tasks to Immediately Complete": Choose the top 1-2 most critical and high-priority tasks.
2. Identify "Tasks to Postpone": Defer lower priority or non-urgent tasks.
3. Identify "Tasks to Cancel": Select tasks that can be discarded or skipped to save the schedule.
4. Compress the work schedule: Recommend slightly longer deep work sessions (up to 110 minutes) and specific, high-efficiency recovery strategies.
5. Estimate a realistic Success Probability (0.0 to 1.0) and Recovery ETA (e.g., "Tomorrow 2:00 PM").
6. Provide a "Next Best Action" (the single first thing the user should start doing right now).

Return ONLY a valid JSON object matching this structure:
{
  "tasksToComplete": ["<task_id or title>", ...],
  "tasksToPostpone": ["<task_id or title>", ...],
  "tasksToCancel": ["<task_id or title>", ...],
  "recoveryStrategy": "<detailed 2-3 sentence recovery strategy statement>",
  "compressedSchedule": [
    {
      "timeSlot": "09:00 AM - 10:50 AM",
      "activity": "<Deep Work on MIT Title>",
      "durationMinutes": 110
    }
  ],
  "breakRecommendations": ["<brief high-density break description, e.g. 5-min breathing>", ...],
  "successProbability": <float between 0.0 and 1.0>,
  "recoveryEta": "<string, e.g. Wednesday 3:00 PM>",
  "confidenceScore": <float between 0.0 and 1.0>,
  "nextBestAction": "<clear, actionable next instruction, max 100 chars>"
}

Constraints:
- Return ONLY the JSON object. Do not include markdown code fences or conversational prefix/suffix text.
- All values must be in English.`;
}
