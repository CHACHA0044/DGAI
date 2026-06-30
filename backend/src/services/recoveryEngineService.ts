export interface RecoveryPlan {
  suggestedReschedule: string;
  alternativeOrder: string[];
  tasksToDefer: string[];
  productivityRecommendations: string[];
}

/** Generate a structured recovery plan offline for Warning/Critical tasks */
export function generateRecoveryPlanOffline(
  task: { id: string; title: string; priorityScore?: number | null },
  activeTasks: { id: string; title: string; priorityScore?: number | null }[]
): RecoveryPlan {
  // alternativeOrder: prioritize this task first, then list others by priority descending
  const othersSorted = activeTasks
    .filter(t => t.id !== task.id)
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
  
  const alternativeOrder = [task.id, ...othersSorted.map(t => t.id)];

  // tasksToDefer: tasks that have lower priority score than this task
  const currentPriority = task.priorityScore ?? 50;
  const tasksToDefer = othersSorted
    .filter(t => (t.priorityScore ?? 0) < currentPriority)
    .slice(0, 3)
    .map(t => t.title);

  return {
    suggestedReschedule: `Reschedule to start immediately. Block out the next available calendar slot and flag as critical.`,
    alternativeOrder,
    tasksToDefer: tasksToDefer.length > 0 ? tasksToDefer : ['Lower-priority minor tasks'],
    productivityRecommendations: [
      `Set up a Pomodoro 50/10 Focus Block specifically for "${task.title}".`,
      `Disable WhatsApp, Slack, and email notifications for the next 2 hours.`,
      `Decompose "${task.title}" subtasks into quick-wins to build execution momentum.`,
    ],
  };
}
