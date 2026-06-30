import axios from 'axios';
import type { DailyPlan, Task, ApiResponse, Notification, AnalyticsSummary, EmergencyPlan, EmergencyStatus, Goal, Habit, CalendarEvent, UserInsight, UserSettings, CoachingAdvice } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000, // 120s timeout
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as ApiResponse)?.message ??
        error.message ??
        'Network error. Please try again.';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export const plannerApi = {
  /** Fetch today's generated schedule plan (cached unless stale) */
  getTodayPlan: async (): Promise<DailyPlan> => {
    const res = await api.get<ApiResponse<DailyPlan>>('/v1/planner/today');
    return res.data.data!;
  },

  /** Force regeneration of today's schedule plan */
  generatePlan: async (): Promise<DailyPlan> => {
    const res = await api.post<ApiResponse<DailyPlan>>('/v1/planner/generate');
    return res.data.data!;
  },

  /** Manually trigger relative Dynamic Task Prioritization */
  reprioritizeTasks: async (): Promise<Task[]> => {
    const res = await api.post<ApiResponse<Task[]>>('/v1/tasks/reprioritize');
    return res.data.data!;
  },

  // ── Notifications Endpoints ──────────────────────────────

  getNotifications: async (): Promise<Notification[]> => {
    const res = await api.get<ApiResponse<Notification[]>>('/v1/notifications');
    return res.data.data!;
  },

  markNotificationRead: async (id: string): Promise<Notification> => {
    const res = await api.patch<ApiResponse<Notification>>(`/v1/notifications/${id}/read`);
    return res.data.data!;
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await api.post<ApiResponse>('/v1/notifications/read-all');
  },

  // ── Analytics Endpoints ──────────────────────────────────

  getAnalyticsSummary: async (): Promise<AnalyticsSummary> => {
    const res = await api.get<ApiResponse<AnalyticsSummary>>('/v1/analytics');
    return res.data.data!;
  },

  // ── Emergency Endpoints ──────────────────────────────────

  getEmergencyStatus: async (): Promise<EmergencyStatus> => {
    const res = await api.get<ApiResponse<EmergencyStatus>>('/v1/emergency/status');
    return res.data.data!;
  },

  getEmergencyPlan: async (): Promise<EmergencyPlan> => {
    const res = await api.get<ApiResponse<EmergencyPlan>>('/v1/emergency/plan');
    return res.data.data!;
  },

  toggleEmergencyMode: async (active: boolean): Promise<{ active: boolean }> => {
    const res = await api.post<ApiResponse<{ active: boolean }>>('/v1/emergency/toggle', { active });
    return res.data.data!;
  },

  // ── Goals Endpoints ──────────────────────────────────────
  
  getGoals: async (status?: string): Promise<Goal[]> => {
    const res = await api.get<ApiResponse<Goal[]>>('/v1/goals', { params: { status } });
    return res.data.data!;
  },

  getGoalsSummary: async (): Promise<{ active: number; completed: number; total: number; topGoals: any[] }> => {
    const res = await api.get<ApiResponse<{ active: number; completed: number; total: number; topGoals: any[] }>>('/v1/goals/summary');
    return res.data.data!;
  },

  createGoal: async (data: { title: string; description?: string; type?: string; targetDate?: string; linkedTaskIds?: string[] }): Promise<Goal> => {
    const res = await api.post<ApiResponse<Goal>>('/v1/goals', data);
    return res.data.data!;
  },

  updateGoal: async (id: string, data: { title?: string; description?: string; type?: string; status?: string; targetDate?: string; progress?: number; linkedTaskIds?: string[] }): Promise<Goal> => {
    const res = await api.put<ApiResponse<Goal>>(`/v1/goals/${id}`, data);
    return res.data.data!;
  },

  updateGoalProgress: async (id: string, progress: number): Promise<Goal> => {
    const res = await api.patch<ApiResponse<Goal>>(`/v1/goals/${id}/progress`, { progress });
    return res.data.data!;
  },

  deleteGoal: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/v1/goals/${id}`);
  },

  // ── Habits Endpoints ─────────────────────────────────────

  getHabits: async (frequency?: string): Promise<Habit[]> => {
    const res = await api.get<ApiResponse<Habit[]>>('/v1/habits', { params: { frequency } });
    return res.data.data!;
  },

  getHabitsSummary: async (): Promise<{ totalHabits: number; dailyHabits: number; completedToday: number; completionRate: number; topStreak: number; habits: Habit[] }> => {
    const res = await api.get<ApiResponse<{ totalHabits: number; dailyHabits: number; completedToday: number; completionRate: number; topStreak: number; habits: Habit[] }>>('/v1/habits/summary');
    return res.data.data!;
  },

  createHabit: async (data: { name: string; description?: string; frequency?: string }): Promise<Habit> => {
    const res = await api.post<ApiResponse<Habit>>('/v1/habits', data);
    return res.data.data!;
  },

  updateHabit: async (id: string, data: { name?: string; description?: string; frequency?: string }): Promise<Habit> => {
    const res = await api.put<ApiResponse<Habit>>(`/v1/habits/${id}`, data);
    return res.data.data!;
  },

  completeHabit: async (id: string): Promise<Habit> => {
    const res = await api.post<ApiResponse<Habit>>(`/v1/habits/${id}/complete`);
    return res.data.data!;
  },

  deleteHabit: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/v1/habits/${id}`);
  },

  // ── Calendar Endpoints ───────────────────────────────────

  getCalendarEvents: async (start?: string, end?: string): Promise<CalendarEvent[]> => {
    const res = await api.get<ApiResponse<CalendarEvent[]>>('/v1/calendar/events', { params: { start, end } });
    return res.data.data!;
  },

  createCalendarEvent: async (data: { title: string; description?: string; startAt: string; endAt: string; taskId?: string; habitId?: string; type?: string; isBlocked?: boolean; color?: string }): Promise<CalendarEvent> => {
    const res = await api.post<ApiResponse<CalendarEvent>>('/v1/calendar/events', data);
    return res.data.data!;
  },

  updateCalendarEvent: async (id: string, data: { title?: string; description?: string; startAt?: string; endAt?: string; type?: string; isBlocked?: boolean; color?: string }): Promise<CalendarEvent> => {
    const res = await api.put<ApiResponse<CalendarEvent>>(`/v1/calendar/events/${id}`, data);
    return res.data.data!;
  },

  deleteCalendarEvent: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/v1/calendar/events/${id}`);
  },

  getFreeSlots: async (date?: string, minDuration?: number): Promise<{ start: string; end: string; durationMinutes: number }[]> => {
    const res = await api.get<ApiResponse<{ start: string; end: string; durationMinutes: number }[]>>('/v1/calendar/free-slots', { params: { date, minDuration } });
    return res.data.data!;
  },

  syncPlannerToCalendar: async (schedule: any[]): Promise<CalendarEvent[]> => {
    const res = await api.post<ApiResponse<CalendarEvent[]>>('/v1/calendar/sync-planner', { schedule });
    return res.data.data!;
  },

  // ── Insights Endpoints ───────────────────────────────────

  getInsights: async (): Promise<UserInsight[]> => {
    const res = await api.get<ApiResponse<UserInsight[]>>('/v1/insights');
    return res.data.data!;
  },

  generateInsights: async (): Promise<UserInsight[]> => {
    const res = await api.post<ApiResponse<UserInsight[]>>('/v1/insights/generate');
    return res.data.data!;
  },

  // ── Coach Endpoints ──────────────────────────────────────

  getCoachingAdvice: async (): Promise<CoachingAdvice> => {
    const res = await api.get<ApiResponse<CoachingAdvice>>('/v1/coach/advice');
    return res.data.data!;
  },

  // ── Settings Endpoints ───────────────────────────────────

  getSettings: async (): Promise<UserSettings> => {
    const res = await api.get<ApiResponse<UserSettings>>('/v1/settings');
    return res.data.data!;
  },

  updateSettings: async (data: { workStartHour?: number; workEndHour?: number; breakDurationMinutes?: number; focusIntervalMinutes?: number; emergencyThresholdHours?: number; notificationsEnabled?: boolean; theme?: string }): Promise<UserSettings> => {
    const res = await api.put<ApiResponse<UserSettings>>('/v1/settings', data);
    return res.data.data!;
  },
};
