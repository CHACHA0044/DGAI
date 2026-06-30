// ─────────────────────────────────────────────────────────────
// Task Analysis Prompt Template
// ─────────────────────────────────────────────────────────────
// Security: all user input is sanitized before being embedded
// in the prompt to prevent prompt injection attacks.
// ─────────────────────────────────────────────────────────────

/**
 * Sanitizes a string for safe embedding in an AI prompt.
 * - Strips control characters
 * - Escapes characters that could break prompt structure
 * - Enforces a maximum length
 * - Removes attempts to inject instructions
 */
function sanitizeInput(raw: string, maxLength = 500): string {
  return raw
    .replace(/[\x00-\x1F\x7F]/g, ' ')          // Remove control chars
    .replace(/[`\\]/g, '')                        // Remove backticks/backslashes
    .replace(/\bignore\b.*\binstructions\b/gi, '') // Block common injection patterns
    .replace(/\bforget\b.*\bprevious\b/gi, '')
    .replace(/\bsystem prompt\b/gi, '')
    .replace(/\byou are now\b/gi, '')
    .substring(0, maxLength)
    .trim();
}

export interface TaskPromptInput {
  title: string;
  description?: string | null;
  deadline?: Date | null;
  estimatedHours?: number | null;
  tags?: string[];
}

/**
 * Builds the structured prompt sent to Gemini for task analysis.
 *
 * Design principles:
 * 1. Demands strict JSON output — no markdown, no prose
 * 2. Provides an exact JSON schema to follow
 * 3. All user-provided values are sanitized before injection
 * 4. Response size is bounded by maxOutputTokens in the Gemini config
 */
export function buildTaskAnalysisPrompt(task: TaskPromptInput): string {
  const title = sanitizeInput(task.title, 200);
  const description = task.description
    ? sanitizeInput(task.description, 500)
    : 'Not provided';
  const deadline = task.deadline
    ? task.deadline.toISOString().split('T')[0]
    : 'Not specified';
  const estimatedHours =
    task.estimatedHours != null ? `${task.estimatedHours} hours` : 'Not specified';
  const tags =
    task.tags && task.tags.length > 0
      ? task.tags.map((t) => sanitizeInput(t, 50)).join(', ')
      : 'None';

  return `You are an expert productivity and project management AI assistant.

Analyze the task below and return ONLY a single valid JSON object.
Do NOT include markdown code fences, explanations, comments, or any text outside the JSON.

TASK:
Title: ${title}
Description: ${description}
Deadline: ${deadline}
Estimated hours: ${estimatedHours}
Tags: ${tags}

Return exactly this JSON structure (all fields required):

{
  "priority": <integer 1-10, where 10 is most urgent>,
  "difficulty": <one of: "EASY", "MEDIUM", "HARD", "EXPERT">,
  "riskLevel": <one of: "LOW", "MEDIUM", "HIGH", "CRITICAL">,
  "estimatedCompletion": <human-readable time, e.g. "3 hours 30 minutes" or "2 days">,
  "executionPlan": <concise numbered step-by-step strategy, max 400 characters>,
  "productivityAdvice": <specific, actionable advice tailored to this task, max 250 characters>,
  "nextImmediateStep": <the single first action the user should take right now, max 120 characters>,
  "potentialBlockers": [<string: blocker description, max 100 chars each>, ...],
  "dependencies": [<string: prerequisite or dependency, max 100 chars each>, ...],
  "subtasks": [
    {
      "id": <unique string like "st_1", "st_2", ...>,
      "title": <subtask title, max 80 characters>,
      "estimatedMinutes": <positive integer>,
      "order": <integer starting from 1>
    }
  ]
}

Constraints:
- priority must be an integer between 1 and 10 inclusive
- subtasks must have between 3 and 6 items
- potentialBlockers must have between 1 and 4 items
- dependencies may be an empty array []
- All text values must be in English
- Return ONLY the JSON object — absolutely no other text`;
}
