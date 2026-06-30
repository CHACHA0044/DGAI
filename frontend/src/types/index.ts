// ─────────────────────────────────────────────────────────────
// Frontend TypeScript types — mirrors the backend API contract
// ─────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type TaskStatus =
  | 'DRAFT'
  | 'ANALYZING'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface Subtask {
  id: string;
  title: string;
  estimatedMinutes: number;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  estimatedHours: number | null;
  tags: string[];
  status: TaskStatus;

  // AI-generated
  aiPriority: number | null;
  riskLevel: RiskLevel | null;
  difficulty: DifficultyLevel | null;
  estimatedCompletion: string | null;
  executionPlan: string | null;
  productivityAdvice: string | null;
  nextImmediateStep: string | null;
  potentialBlockers: string[] | null;
  dependencies: string[] | null;
  subtasks: Subtask[] | null;

  isAnalyzed: boolean;
  analyzedAt: string | null;
  analysisError: string | null;
  createdAt: string;
  updatedAt: string;

  // Dynamic Prioritization (Phase 2)
  priorityScore: number | null;
  priorityLabel: string | null;
  priorityReason: string | null;
  confidence: number | null;
  lastPrioritizedAt: string | null;

  // Phase 3 companion fields
  riskScore: number | null;
  completionProb: number | null;
  missProbability: number | null;
  timeDeficit: number | null;
  recoveryPlan: {
    suggestedReschedule: string;
    alternativeOrder: string[];
    tasksToDefer: string[];
    productivityRecommendations: string[];
  } | null;
  lastRiskAnalysisAt: string | null;
}

export interface PlannerItem {
  timeSlot: string;
  taskTitle: string;
  taskId: string | null;
  activityType: 'DEEP_WORK' | 'QUICK_WIN' | 'BREAK' | 'ADMINISTRATIVE';
}

export interface DailyPlan {
  id: string;
  date: string;
  schedule: PlannerItem[];
  suggestedOrder: string[];
  recommendedBreaks: string[];
  expectedFinishTime: string;
  tasksToPostpone: string[];
  mostImportantTask: string;
  recommendedFocusSession: string;
  quickWins: string[];
  highEffortWork: string[];
  deepWorkBlocks: string[];
  isFallback: boolean;
  isStale: boolean;
  generatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  deadline?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  deadline?: string;
  estimatedHours?: number;
  tags?: string[];
  status?: TaskStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: string;
}

export interface TasksResponse extends ApiResponse<Task[]> {
  meta: PaginationMeta;
}

// ── UI types ──────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Form schema types
export interface CreateTaskFormData {
  title: string;
  description: string;
  deadline: string;
  estimatedHours: string;
  tags: string;
}

// ── Phase 3 Alerts & Analytics types ─────────────────────────

export interface Notification {
  id: string;
  taskId: string | null;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  completedTasks: number;
  overdueTasks: number;
  avgCompletionTimeHours: number;
  avgDelayHours: number;
  geminiSuccessRate: number;
  offlineFallbackUsage: number;
  recoverySuccessRate: number;
  priorityAccuracy: number;
  healthScore: number;
}

export interface EmergencyPlan {
  tasksToComplete: string[];
  tasksToPostpone: string[];
  tasksToCancel: string[];
  recoveryStrategy: string;
  compressedSchedule: {
    timeSlot: string;
    activity: string;
    durationMinutes: number;
  }[];
  breakRecommendations: string[];
  successProbability: number;
  recoveryEta: string;
  confidenceScore: number;
  nextBestAction: string;
}

export interface EmergencyStatus {
  isEmergency: boolean;
  reason: string;
  isManual: boolean;
}

// ─────────────────────────────────────────────────────────────
// Phase 4: Goals, Habits, Calendar, Insights, Settings, Coach types
// ─────────────────────────────────────────────────────────────

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
export type GoalType = 'SHORT_TERM' | 'LONG_TERM';
export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type CalendarEventType = 'TASK_BLOCK' | 'HABIT_BLOCK' | 'MEETING' | 'FREE_TIME' | 'BUFFER' | 'BREAK';
export type InsightType = 'PRODUCTIVITY_PATTERN' | 'WEEKLY_SUMMARY' | 'MONTHLY_SUMMARY' | 'FOCUS_SCORE' | 'DELAY_ANALYSIS' | 'COACHING_TIP';
export type AppTheme = 'DARK' | 'LIGHT' | 'SYSTEM';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  type: GoalType;
  status: GoalStatus;
  progress: number;
  targetDate: string | null;
  linkedTaskIds: string[];
  aiEstimation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  streakCount: number;
  completedToday: boolean;
  lastCompletedAt: string | null;
  completionHistory: { date: string; completed: boolean }[];
  aiSuggestion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  taskId: string | null;
  habitId: string | null;
  type: CalendarEventType;
  source: string;
  isBlocked: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserInsight {
  id: string;
  type: InsightType;
  title: string;
  content: string;
  data: any;
  period: string | null;
  generatedAt: string;
}

export interface UserSettings {
  id: string;
  workStartHour: number;
  workEndHour: number;
  breakDurationMinutes: number;
  focusIntervalMinutes: number;
  emergencyThresholdHours: number;
  notificationsEnabled: boolean;
  theme: AppTheme;
  updatedAt: string;
}

export interface CoachingAdvice {
  motivationalQuote: string;
  advice: string;
  focusTips: string[];
  timeManagementAdvice: string;
  stressReductionTips: string[];
}

