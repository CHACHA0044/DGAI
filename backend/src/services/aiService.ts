import { z } from 'zod';
import { generateContent } from '../ai/geminiClient';
import { buildTaskAnalysisPrompt, type TaskPromptInput } from '../prompts/taskAnalysisPrompt';
import { type AIAnalysisResult } from '../types/index';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────
// Zod schema — validates Gemini's JSON response
// ─────────────────────────────────────────────────────────────

const subtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  estimatedMinutes: z.number().int().positive(),
  order: z.number().int().positive(),
});

const aiResponseSchema = z.object({
  priority: z.number().int().min(1).max(10),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  estimatedCompletion: z.string().min(1).max(200),
  executionPlan: z.string().min(1).max(1000),
  productivityAdvice: z.string().min(1).max(500),
  nextImmediateStep: z.string().min(1).max(300),
  potentialBlockers: z.array(z.string().max(200)).min(1).max(10),
  dependencies: z.array(z.string().max(200)).max(10),
  subtasks: z.array(subtaskSchema).min(1).max(10),
});

// ─────────────────────────────────────────────────────────────
// JSON extraction helpers
// ─────────────────────────────────────────────────────────────

function extractJSON(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // continue
  }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      // continue
    }
  }

  const braceStart = raw.indexOf('{');
  const braceEnd = raw.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(raw.substring(braceStart, braceEnd + 1));
    } catch {
      // continue
    }
  }

  throw new Error('Could not extract valid JSON from AI response');
}

// ─────────────────────────────────────────────────────────────
// Fallback Generator
// ─────────────────────────────────────────────────────────────

function getFallbackAnalysis(task: TaskPromptInput): AIAnalysisResult {
  const estimatedHours = task.estimatedHours ?? 2;
  
  let priority = 5;
  if (task.deadline) {
    const msDiff = new Date(task.deadline).getTime() - Date.now();
    const daysDiff = msDiff / (1000 * 60 * 60 * 24);
    if (daysDiff < 2) priority = 9;
    else if (daysDiff < 5) priority = 7;
  }

  const difficulty = estimatedHours > 6 ? 'HARD' : estimatedHours > 3 ? 'MEDIUM' : 'EASY';
  const riskLevel = estimatedHours > 8 ? 'HIGH' : 'LOW';

  return {
    priority,
    difficulty,
    riskLevel,
    estimatedCompletion: `${estimatedHours} hours`,
    executionPlan: `Step 1: Set up work environment and read requirements.\nStep 2: Implement core logic for "${task.title}".\nStep 3: Test changes locally and verify output.`,
    productivityAdvice: "Break this task down into 45-minute focus intervals to maintain energy.",
    nextImmediateStep: "Review the initial task requirements and prepare workspace.",
    potentialBlockers: ["Unexpected technical challenges", "Unclear execution steps"],
    dependencies: [],
    subtasks: [
      { id: "sub-1", title: "Setup and preparation", estimatedMinutes: 30, order: 1 },
      { id: "sub-2", title: `Execution block for ${task.title}`, estimatedMinutes: Math.round(estimatedHours * 45), order: 2 },
      { id: "sub-3", title: "Validation and testing", estimatedMinutes: 30, order: 3 }
    ]
  };
}

// ─────────────────────────────────────────────────────────────
// Public service function
// ─────────────────────────────────────────────────────────────

/**
 * Runs AI analysis on a task.
 *
 * Falls back to offline rules-based analysis if Gemini services fail.
 */
export async function analyzeTask(task: TaskPromptInput): Promise<AIAnalysisResult> {
  const prompt = buildTaskAnalysisPrompt(task);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= env.MAX_RETRIES; attempt++) {
    try {
      const raw = await generateContent(prompt);
      const parsed = extractJSON(raw);
      const validated = aiResponseSchema.parse(parsed);

      console.log(
        `✅  AI analysis complete (attempt ${attempt}/${env.MAX_RETRIES}) — priority: ${validated.priority}`
      );

      return validated as AIAnalysisResult;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      console.warn(
        `⚠️   AI analysis attempt ${attempt}/${env.MAX_RETRIES} failed: ${lastError.message}`
      );

      if (attempt < env.MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.warn(
    `❌  AI analysis failed after ${env.MAX_RETRIES} attempts. Falling back to offline rules-based task analysis. Error: ${lastError?.message}`
  );
  
  return getFallbackAnalysis(task);
}
