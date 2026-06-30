import { prisma } from '../config/database';
import { TaskStatus, InsightType } from '@prisma/client';
import { generateContent } from '../ai/geminiClient';
import { getAnalyticsSummary } from './analyticsService';

export interface UserInsightResult {
  id: string;
  type: string;
  title: string;
  content: string;
  data: any;
  generatedAt: Date;
}

/** Computes and generates weekly/monthly productivity insights (AI with fallback) */
export async function generateProductivityInsights(): Promise<UserInsightResult[]> {
  const [tasks, habits] = await Promise.all([
    prisma.task.findMany(),
    prisma.habit.findMany(),
  ]);

  const summary = await getAnalyticsSummary();

  // 1. Analyze best work times
  // Map hour of day completed
  const completionHours = tasks
    .filter(t => t.status === TaskStatus.COMPLETED && t.updatedAt)
    .map(t => new Date(t.updatedAt).getHours());

  let morningCompletions = 0; // 5 AM - 12 PM
  let afternoonCompletions = 0; // 12 PM - 5 PM
  let eveningCompletions = 0; // 5 PM - 12 AM

  completionHours.forEach(h => {
    if (h >= 5 && h < 12) morningCompletions++;
    else if (h >= 12 && h < 17) afternoonCompletions++;
    else eveningCompletions++;
  });

  let bestPeriod = 'Mornings';
  let bestCount = morningCompletions;
  if (afternoonCompletions > bestCount) {
    bestPeriod = 'Afternoons';
    bestCount = afternoonCompletions;
  }
  if (eveningCompletions > bestCount) {
    bestPeriod = 'Evenings';
  }

  // 2. Delay patterns & Postponements
  // Calculate day-of-week failures (e.g. Friday delay stats)
  const completedLate = tasks.filter(t => t.status === TaskStatus.COMPLETED && t.deadline && new Date(t.updatedAt) > new Date(t.deadline));
  let fridayDelays = 0;
  completedLate.forEach(t => {
    if (t.deadline && new Date(t.deadline).getDay() === 5) { // 5 = Friday
      fridayDelays++;
    }
  });

  // 3. Focus score: base it on completion rates, streaks, and focus hours
  const dailyHabits = habits.filter(h => h.frequency === 'DAILY');
  const streakBonus = habits.reduce((sum, h) => sum + h.streakCount, 0) * 2;
  const habitCompletionRate = dailyHabits.length > 0 ? (dailyHabits.filter(h => h.completedToday).length / dailyHabits.length) * 100 : 80;
  const focusScore = Math.min(100, Math.max(30, Math.round((summary.priorityAccuracy * 0.4) + (habitCompletionRate * 0.4) + Math.min(20, streakBonus))));

  // Prepare input bundle for AI Analysis
  const metricsData = {
    bestWorkingPeriod: bestPeriod,
    completionDistribution: {
      morning: morningCompletions,
      afternoon: afternoonCompletions,
      evening: eveningCompletions,
    },
    fridayMissedDeadlines: fridayDelays,
    averageCompletionHours: summary.avgCompletionTimeHours,
    averageDelayHours: summary.avgDelayHours,
    healthIndex: summary.healthScore,
    geminiSuccessRate: summary.geminiSuccessRate,
    focusScore,
    recoverySuccessRate: summary.recoverySuccessRate,
    totalCompletedTasks: summary.completedTasks,
  };

  const insightTypes = [
    {
      type: InsightType.PRODUCTIVITY_PATTERN,
      title: 'Peak Productivity Pattern',
      prompt: `Analyze these user metrics and provide a 2-sentence tip identifying when they work best and how to align tasks.
Best working period: ${bestPeriod} (Completion counts: Morning: ${morningCompletions}, Afternoon: ${afternoonCompletions}, Evening: ${eveningCompletions})`,
      fallback: `Peak activity occurs during ${bestPeriod}. Schedule high-complexity deep-work tasks in this window, and delegate routine administrative duties outside of it.`
    },
    {
      type: InsightType.DELAY_ANALYSIS,
      title: 'Deadline Friction Points',
      prompt: `Analyze this metric and provide a 2-sentence actionable correction:
- Average delay time on tasks: ${summary.avgDelayHours} hours.
- Deadlines missed/delayed on Fridays: ${fridayDelays} tasks.`,
      fallback: fridayDelays > 0 
        ? `Task delay analysis shows a Friday completion drop-off (${fridayDelays} delayed items). Avoid scheduling critical deadlines on Friday afternoons; target Thursday instead.`
        : `Average task delay is currently ${summary.avgDelayHours}h. Consider adding 15% time buffers to estimated task hours during initial task generation.`
    },
    {
      type: InsightType.FOCUS_SCORE,
      title: 'Daily Flow & Focus Rating',
      prompt: `Generate a 2-sentence motivational coaching assessment for this focus rating:
- Flow Score: ${focusScore}/100.
- Daily habit completion rate: ${habitCompletionRate.toFixed(1)}%.`,
      fallback: `Your current Flow and Focus score is ${focusScore}/100. Consistent habit checks are maintaining high baseline momentum. Maintain block schedules to elevate focus efficiency.`
    }
  ];

  const generatedInsights: UserInsightResult[] = [];

  for (const item of insightTypes) {
    let content = '';
    try {
      const prompt = `You are an expert AI productivity auditor. Respond with a concise 2-sentence assessment of this productivity metric. No markdown, no JSON, keep it professional and direct.
Data:
${item.prompt}`;

      const aiResponse = await generateContent(prompt);
      content = aiResponse.trim().slice(0, 300);
    } catch {
      content = item.fallback;
    }

    // Save insight to DB
    const insight = await prisma.userInsight.create({
      data: {
        type: item.type,
        title: item.title,
        content,
        data: metricsData,
      },
    });

    generatedInsights.push({
      id: insight.id,
      type: insight.type,
      title: insight.title,
      content: insight.content,
      data: insight.data,
      generatedAt: insight.generatedAt,
    });
  }

  return generatedInsights;
}

/** Fetch latest insights */
export async function getLatestInsights() {
  const existing = await prisma.userInsight.findMany({
    orderBy: { generatedAt: 'desc' },
    take: 6,
  });

  if (existing.length > 0) {
    return existing;
  }

  // Generate new if none exist yet
  return generateProductivityInsights();
}
