/**
 * Task Prioritization & Risk Assessment Prompt Template — Version 1.1.0
 * 
 * Generates batch relative task scoring, deadline risk predictions, and recovery plans in one run.
 */

import { sanitizeInput, formatDate } from '../shared/promptUtils';

export interface PrioritizationTaskInput {
  id: string;
  title: string;
  description?: string | null;
  deadline?: Date | string | null;
  estimatedHours?: number | null;
  difficulty?: string | null;
  riskLevel?: string | null;
  tags?: string[];
  dependencies?: string[] | null;
}

export function buildTaskPrioritizationPrompt(tasks: PrioritizationTaskInput[]): string {
  const tasksFormatted = tasks.map((t) => {
    const title = sanitizeInput(t.title, 100);
    const desc = t.description ? sanitizeInput(t.description, 200) : 'None';
    const deadline = formatDate(t.deadline);
    const est = t.estimatedHours ? `${t.estimatedHours}h` : 'Not specified';
    const diff = t.difficulty ?? 'Not analyzed';
    const risk = t.riskLevel ?? 'Not analyzed';
    const tags = t.tags && t.tags.length > 0 ? t.tags.join(', ') : 'None';
    const deps = t.dependencies && t.dependencies.length > 0 ? t.dependencies.join(', ') : 'None';

    return `- ID: ${t.id}
  Title: ${title}
  Description: ${desc}
  Deadline: ${deadline}
  Estimated Hours: ${est}
  Difficulty: ${diff}
  Risk Level: ${risk}
  Tags: ${tags}
  Prerequisites/Dependencies: ${deps}`;
  }).join('\n\n');

  return `You are a project management brain and workload risk analyzer. Relatively prioritize and calculate deadline risk metrics for the active tasks below. Assume today is ${new Date().toISOString().split('T')[0]}.

For EACH task, you MUST calculate:
1. Dynamic priority score (1-100) and label (Critical, High, Medium, Low).
2. Risk score (0-100) and level (Safe, Warning, Critical). Consider deadline proximity, estimated hours vs. available time, and dependencies.
3. Completion probability (0.0 to 1.0) and Miss probability (0.0 to 1.0).
4. Time deficit in hours (negative if the hours needed exceed time left to deadline).
5. A structured recovery plan if risk is Warning/Critical, suggesting alternative execution steps.

ACTIVE TASKS:
${tasksFormatted}

Return ONLY a valid JSON object matching this structure:
{
  "tasks": [
    {
      "id": "<task_id>",
      "priorityScore": <integer 1-100>,
      "priorityLabel": "<one of: Critical, High, Medium, Low>",
      "priorityReason": "<brief justification in English, max 200 chars>",
      "confidence": <float between 0.0 and 1.0>,
      "riskScore": <integer 0-100>,
      "riskLevel": "<one of: Safe, Warning, Critical>",
      "completionProb": <float 0.0-1.0>,
      "missProbability": <float 0.0-1.0>,
      "timeDeficit": <float, e.g. -4.5 or 12.0>,
      "recoveryPlan": {
        "suggestedReschedule": "<reschedule instructions, e.g., Start today 2 PM>",
        "alternativeOrder": ["<task_id>", ...],
        "tasksToDefer": ["<task_id or title>", ...],
        "productivityRecommendations": ["<advice, e.g. Set 50/10 focus intervals>", ...]
      }
    }
  ]
}

Constraints:
- Return results for every task ID provided above.
- Make sure priority scores and risk scores are relative and spread out.
- Return ONLY the JSON object. No conversational prefix, markdown blocks, or text outside the JSON.`;
}
