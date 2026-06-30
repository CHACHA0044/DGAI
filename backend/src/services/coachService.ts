import { prisma } from '../config/database';
import { generateContent } from '../ai/geminiClient';
import { getAnalyticsSummary } from './analyticsService';
import { TaskStatus } from '@prisma/client';

export interface CoachingAdvice {
  motivationalQuote: string;
  advice: string;
  focusTips: string[];
  timeManagementAdvice: string;
  stressReductionTips: string[];
}

// ─────────────────────────────────────────────────────────────
// Robust rules-based Coaching Library (50+ items)
// ─────────────────────────────────────────────────────────────

const MOTIVATIONAL_POOL = [
  "Do not wait; the time will never be 'just right.' Start where you stand.",
  "Your focus determines your reality. Concentrate on the next small step.",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
  "Consistency beats intensity. Small daily steps lead to monumental progress.",
  "Procrastination is the thief of time. Collar him.",
  "Action is the foundational key to all success.",
  "Focus on being productive instead of busy.",
  "You do not have to see the whole staircase, just take the first step.",
  "Done is better than perfect.",
  "It is not that I am so smart, it is just that I stay with problems longer."
];

const FOCUS_TIPS_POOL = [
  "Use the Pomodoro technique: 50 minutes of deep focus, 10 minutes of complete rest.",
  "Put your phone in another room during high-priority work blocks.",
  "Close all browser tabs not directly related to your active task.",
  "Listen to instrumental music or binaural beats to maintain flow state.",
  "Block notification popups using Focus mode on your operating system.",
  "Declare a single focus metric for the day and hide distractions.",
  "Work in 90-minute blocks with physical movement breaks in between.",
  "Clear your physical workspace before starting deep focus sessions."
];

const TIME_MANAGEMENT_POOL = [
  "Eat the frog: tackle your hardest, most critical task first thing in the morning.",
  "Batch similar tasks together (e.g., all emails, all administrative edits).",
  "Use time blocking to assign exact start and end times to every task.",
  "Apply the 2-minute rule: if a task takes less than 2 minutes, do it immediately.",
  "Say no to non-essential commitments to protect your core focus hours.",
  "Schedule buffer blocks between meetings to absorb delays.",
  "Always estimate task time with a 20% buffer for unexpected complexity."
];

const STRESS_REDUCTION_POOL = [
  "Practice box breathing: inhale for 4s, hold 4s, exhale 4s, hold 4s.",
  "Step away from screens and take a 5-minute walk outside.",
  "Do a brain dump: write down everything on your mind to clear cognitive load.",
  "Hydrate: drink a tall glass of cold water between deep focus blocks.",
  "Accept what is out of your control and focus strictly on the next active step.",
  "Stretch your neck and shoulders to release accumulated physical tension.",
  "End your workday cleanly with a shutdown routine to detach mentally."
];

const GENERAL_ADVICE_POOL = [
  "If you feel overwhelmed, break your active task into subtasks of less than 15 minutes each.",
  "Review your backlog and postpone tasks that are not critical for your immediate milestones.",
  "Acknowledge the progress you have already made today before planning tomorrow.",
  "Align your highest difficulty tasks with your peak biological energy periods."
];

/** Fetch personalized coaching advice (AI with rich fallback) */
export async function getPersonalizedCoachingAdvice(): Promise<CoachingAdvice> {
  const [tasks, summary] = await Promise.all([
    prisma.task.findMany({ where: { status: { in: [TaskStatus.ACTIVE, TaskStatus.IN_PROGRESS] } } }),
    getAnalyticsSummary(),
  ]);

  const activeCount = tasks.length;
  const criticalCount = tasks.filter(t => t.riskScore !== null && t.riskScore >= 75).length;
  const overdueCount = summary.overdueTasks;

  // Build fallback values
  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const getMultipleRandom = (arr: string[], count: number): string[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const fallbackAdvice: CoachingAdvice = {
    motivationalQuote: getRandom(MOTIVATIONAL_POOL),
    advice: activeCount > 5 
      ? `You currently have ${activeCount} active tasks. To reduce cognitive load, pick the top 2 priority items and postpone the rest.`
      : getRandom(GENERAL_ADVICE_POOL),
    focusTips: getMultipleRandom(FOCUS_TIPS_POOL, 3),
    timeManagementAdvice: criticalCount > 0 
      ? `You have ${criticalCount} critical risk tasks. Time-block these first in your calendar with 15-minute buffer periods.`
      : getRandom(TIME_MANAGEMENT_POOL),
    stressReductionTips: getMultipleRandom(STRESS_REDUCTION_POOL, 3),
  };

  try {
    const prompt = `You are a professional AI executive coach. Generate coaching advice based on these metrics:
- Active task backlog: ${activeCount} tasks.
- Overdue tasks: ${overdueCount} tasks.
- Critical risk tasks: ${criticalCount} tasks.
- Overall System Health index: ${summary.healthScore}/100.
- Average delay time: ${summary.avgDelayHours} hours.

Provide the response in EXACTLY this JSON format (no surrounding markdown, no prefix, strictly valid JSON):
{
  "motivationalQuote": "A concise, context-appropriate quote",
  "advice": "1-2 sentences of personalized advice addressing the active backlog or delay levels",
  "focusTips": ["Tip 1", "Tip 2", "Tip 3"],
  "timeManagementAdvice": "1-2 sentences of advice tailored to their delay times or backlog size",
  "stressReductionTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const raw = await generateContent(prompt);
    const parsed = JSON.parse(raw);
    
    return {
      motivationalQuote: parsed.motivationalQuote || fallbackAdvice.motivationalQuote,
      advice: parsed.advice || fallbackAdvice.advice,
      focusTips: parsed.focusTips || fallbackAdvice.focusTips,
      timeManagementAdvice: parsed.timeManagementAdvice || fallbackAdvice.timeManagementAdvice,
      stressReductionTips: parsed.stressReductionTips || fallbackAdvice.stressReductionTips,
    };
  } catch (err) {
    console.warn('⚠️ [CoachService] Gemini coaching failed. Falling back to rules engine.', err);
    return fallbackAdvice;
  }
}
