import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import Layout from '../components/layout/Layout';
import TaskList from '../features/tasks/TaskList';
import { useTasks, useCreateTask, useDeleteTask, useAnalyzeTask } from '../hooks/useTasks';
import {
  useGetPlan,
  useGeneratePlan,
  useReprioritize,
  useGetEmergencyStatus,
  useGetEmergencyPlan,
  useGetAnalytics,
} from '../hooks/usePlanner';
import { useGetGoalsSummary } from '../hooks/useGoals';
import { useGetHabitsSummary, useCompleteHabit } from '../hooks/useHabits';
import { useToast } from '../contexts/ToastContext';
import type { CreateTaskData } from '../types';

const CreateTaskModal = lazy(() => import('../features/tasks/CreateTaskModal'));

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Core task queries
  const { data, isLoading, isError, error, refetch } = useTasks({ limit: 50 });
  const tasks = data?.data ?? [];

  // Phase 2/3 queries
  const { data: plan, isLoading: isLoadingPlan } = useGetPlan();
  const { data: emergencyStatus } = useGetEmergencyStatus();
  const { data: emergencyPlan } = useGetEmergencyPlan();
  const { data: analytics } = useGetAnalytics();

  // Phase 4 queries
  const { data: goalsSummary } = useGetGoalsSummary();
  const { data: habitsSummary } = useGetHabitsSummary();
  const completeHabit = useCompleteHabit();

  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const analyzeTask = useAnalyzeTask();
  const generatePlan = useGeneratePlan();
  const reprioritize = useReprioritize();
  const toast = useToast();

  const isEmergency = emergencyStatus?.isEmergency ?? false;

  // Prioritization rank mappings
  const activeTasksSorted = [...tasks]
    .filter((t) => t.status === 'ACTIVE' || t.status === 'IN_PROGRESS')
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));

  const rankMap = new Map<string, number>();
  activeTasksSorted.forEach((t, idx) => {
    rankMap.set(t.id, idx + 1);
  });

  // Workload Analyzer computations
  const totalRemainingHours = activeTasksSorted.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  
  // Calculate today's workload based on today's planner schedule duration
  const todayPlannerHours = plan?.schedule
    ? plan.schedule.reduce((sum, item) => {
        if (item.activityType === 'BREAK' || item.activityType === 'ADMINISTRATIVE') return sum;
        // Search task matching title to get hours or allocate standard durations
        const matchingTask = tasks.find((t) => t.title === item.taskTitle);
        return sum + (matchingTask?.estimatedHours ?? 1);
      }, 0)
    : 0;

  // Weekly hours (deadlines within next 7 days)
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const weeklyWorkloadHours = activeTasksSorted
    .filter((t) => t.deadline && new Date(t.deadline).getTime() - Date.now() < oneWeekMs)
    .reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);

  const isOverbooked = todayPlannerHours > 8 || weeklyWorkloadHours > 40;
  const isBurnoutWarning = totalRemainingHours > 25 || todayPlannerHours > 10;


  // ── Handlers ──────────────────────────────────────────────

  const handleCreateTask = async (formData: CreateTaskData) => {
    setIsAnalyzing(true);
    try {
      await createTask.mutateAsync(formData);
      setIsModalOpen(false);
      toast.success('Task analyzed!', 'Companion AI has generated plan risk assessments.');
    } catch (err) {
      toast.error('Analysis failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleReanalyzeTask = async (id: string) => {
    try {
      toast.info('Re-analyzing…', 'Gemini AI is updating the analysis.');
      await analyzeTask.mutateAsync(id);
      toast.success('Re-analysis complete!');
    } catch (err) {
      toast.error('Re-analysis failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleForcePrioritize = async () => {
    try {
      toast.info('Optimizing…', 'Calculating relative priorities and risk values...');
      await reprioritize.mutateAsync();
      toast.success('Optimization complete!');
    } catch (err) {
      toast.error('Optimization failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <>
      <Header onNewTask={() => setIsModalOpen(true)} />

      <Layout>
        {/* ── Hero Section ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-1 leading-tight">
            Your{' '}
            <span className="bg-gradient-to-r from-guardian-400 via-guardian-300 to-accent-cyan bg-clip-text text-transparent">
              AI Productivity
            </span>{' '}
            Companion
          </h2>
          <p className="text-text-secondary max-w-lg text-xs font-medium">
            Active deadline prevention, relative dynamic prioritization scoring, and recovery planner schedules.
          </p>
        </motion.div>

        {/* ── Error State ───────────────────────────────── */}
        {isError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6 flex items-center gap-4">
            <span className="text-2xl">⚠</span>
            <div className="flex-1">
              <p className="font-semibold text-red-400 text-sm">Failed to load tasks</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                {error?.message ?? 'Network error'}
              </p>
            </div>
            <button
              onClick={() => void refetch()}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Page Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Column (Emergency Banner + Planner + Tasks Board) */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Emergency Mode Recovery Plan Widget [NEW] */}
            {isEmergency && emergencyPlan && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 bg-red-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl font-mono">
                  🚨 Emergency active
                </div>
                
                <h3 className="text-base font-black text-red-400 flex items-center gap-2 mb-2">
                  <span>⚡</span> Emergency Recovery Strategy
                </h3>

                <p className="text-xs text-text-primary mb-4 leading-relaxed font-semibold">
                  {emergencyPlan.recoveryStrategy}
                </p>

                {/* Top Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-red-400/70 block">Next Best Action</span>
                    <p className="text-xs font-black text-white mt-1 leading-snug">
                      👉 {emergencyPlan.nextBestAction}
                    </p>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-red-400/70 block">Recovery Status</span>
                    <p className="text-xs font-semibold text-white mt-1 flex justify-between">
                      <span>ETA: {emergencyPlan.recoveryEta}</span>
                      <span className="text-red-400 font-mono">Odds: {Math.round(emergencyPlan.successProbability * 100)}%</span>
                    </p>
                  </div>
                </div>

                {/* Task Segments */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                  <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5">
                    <span className="font-bold text-text-primary block mb-1.5">🔥 Complete First</span>
                    <ul className="space-y-1 list-disc list-inside text-text-secondary font-medium">
                      {emergencyPlan.tasksToComplete.map((t, i) => <li key={i} className="truncate">{t}</li>)}
                      {emergencyPlan.tasksToComplete.length === 0 && <li>None</li>}
                    </ul>
                  </div>
                  <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5">
                    <span className="font-bold text-orange-400 block mb-1.5">💤 Postpone</span>
                    <ul className="space-y-1 list-disc list-inside text-text-muted">
                      {emergencyPlan.tasksToPostpone.map((t, i) => <li key={i} className="truncate">{t}</li>)}
                      {emergencyPlan.tasksToPostpone.length === 0 && <li>None</li>}
                    </ul>
                  </div>
                  <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5">
                    <span className="font-bold text-text-muted block mb-1.5">❌ Skip/Cancel</span>
                    <ul className="space-y-1 list-disc list-inside text-text-muted line-through">
                      {emergencyPlan.tasksToCancel.map((t, i) => <li key={i} className="truncate">{t}</li>)}
                      {emergencyPlan.tasksToCancel.length === 0 && <li>None</li>}
                    </ul>
                  </div>
                </div>

                {/* Compressed Schedule Items */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block mb-2 font-mono">Compressed Emergency Work Blocks</span>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {emergencyPlan.compressedSchedule.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-red-950/10 border border-red-500/10 rounded-xl text-xs font-semibold text-text-primary">
                        <span>{item.timeSlot} — {item.activity}</span>
                        <span className="text-[10px] font-mono font-bold text-red-400">{item.durationMinutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Today's Plan */}
            {isLoadingPlan ? (
              <div className="card p-6 h-48 flex items-center justify-center animate-pulse">
                <span className="text-xs text-text-muted">Loading today's schedule planner...</span>
              </div>
            ) : plan ? (
              <div className="card p-6 relative overflow-hidden">
                
                {/* Reprioritizing/Generating loader overlay */}
                {(plan.isStale || reprioritize.isPending || generatePlan.isPending) && (
                  <div className="absolute top-0 left-0 right-0 bg-guardian-500/15 border-b border-guardian-500/30 px-4 py-2 flex items-center justify-between text-xs text-guardian-300 backdrop-blur-md z-20">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-guardian-400 animate-ping" />
                      AI is optimizing your schedule...
                    </span>
                    <span className="font-mono opacity-80 text-[10px]">Processing</span>
                  </div>
                )}

                {/* Banner indicator */}
                {plan.isFallback ? (
                  <div className="mb-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-4 py-2.5 text-xs font-medium">
                    <span>⚡</span>
                    <span>Using Smart Offline Planner (Gemini service restricted or offline)</span>
                  </div>
                ) : (
                  <div className="mb-4 flex items-center gap-2 bg-guardian-500/10 border border-guardian-500/20 text-guardian-300 rounded-xl px-4 py-2.5 text-xs font-medium">
                    <span>✨</span>
                    <span>Generated using Gemini AI Planner</span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-5 pt-1">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Today's Schedule</h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Workday starts at 9:00 AM • Target Finish: {plan.expectedFinishTime}
                    </p>
                  </div>
                  <button
                    onClick={() => generatePlan.mutate()}
                    disabled={generatePlan.isPending}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium rounded-xl transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {generatePlan.isPending ? 'Planning...' : 'Regenerate Plan'}
                  </button>
                </div>

                {/* Top insights summary widget */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Most Important Task</span>
                    <span className="text-xs font-bold text-text-primary mt-1 block truncate" title={plan.mostImportantTask}>
                      🎯 {plan.mostImportantTask}
                    </span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Suggested Focus</span>
                    <span className="text-xs font-bold text-text-primary mt-1 block truncate">
                      ⏱ {plan.recommendedFocusSession}
                    </span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Expected Finish</span>
                    <span className="text-xs font-bold text-text-primary mt-1 block truncate">
                      🏁 {plan.expectedFinishTime}
                    </span>
                  </div>
                </div>

                {/* Schedule list */}
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {plan.schedule.map((item, idx) => {
                    let badgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                    if (item.activityType === 'BREAK') {
                      badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    } else if (item.activityType === 'QUICK_WIN') {
                      badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                    } else if (item.activityType === 'ADMINISTRATIVE') {
                      badgeColor = 'text-slate-400 bg-slate-500/10 border-slate-500/20';
                    }

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-text-secondary flex-shrink-0 w-24">
                            {item.timeSlot}
                          </span>
                          <span className="text-xs text-text-primary font-medium truncate" title={item.taskTitle}>
                            {item.taskTitle}
                          </span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                          {item.activityType.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                  {plan.schedule.length === 0 && (
                    <div className="text-center py-6 text-xs text-text-muted">
                      No scheduled work blocks. Create tasks to build today's plan.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* 3. Task List */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-text-secondary mb-4">
                Active Task List
              </h3>
              <TaskList
                tasks={tasks}
                isLoading={isLoading}
                onDelete={handleDeleteTask}
                onReanalyze={handleReanalyzeTask}
                rankMap={rankMap}
              />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">

            {/* A. Priority Leaderboard */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">
                    Priority Board
                  </h3>
                  <p className="text-[10px] text-text-muted mt-0.5">Top active tasks ranked by dynamic priority</p>
                </div>
                <button
                  onClick={handleForcePrioritize}
                  disabled={reprioritize.isPending}
                  className="text-xs text-guardian-400 hover:text-guardian-300 font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {reprioritize.isPending ? 'Syncing...' : 'Optimize'}
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activeTasksSorted.slice(0, 5).map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-guardian-400 bg-guardian-500/10 px-1.5 py-0.5 rounded border border-guardian-500/15">
                        #{idx + 1}
                      </span>
                      <span className="text-xs text-text-primary font-medium truncate" title={t.title}>
                        {t.title}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-text-secondary bg-white/5 border border-white/10 px-2 py-0.5 rounded flex-shrink-0">
                      {t.priorityScore ?? '—'}
                    </span>
                  </div>
                ))}
                {activeTasksSorted.length === 0 && (
                  <div className="text-center py-4 text-xs text-text-muted">
                    No active tasks to rank.
                  </div>
                )}
              </div>
            </div>

            {/* B. Workload Analyzer Widget [NEW] */}
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Workload Diagnostics</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Real-time scheduling loads analyzer</p>
              </div>

              {/* Burnout Warning indicator */}
              {isBurnoutWarning && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs font-bold text-red-400 animate-pulse flex items-center gap-2">
                  <span>🔥</span>
                  <span>BURNOUT RISK DETECTED (&gt;25h remaining)</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                {/* Today workload */}
                <div>
                  <div className="flex justify-between text-text-secondary font-medium mb-1">
                    <span>Today's Workload</span>
                    <span className={todayPlannerHours > 8 ? 'text-red-400 font-bold' : 'text-text-primary'}>
                      {todayPlannerHours.toFixed(1)}h / 8.0h
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${todayPlannerHours > 8 ? 'bg-red-400 shadow-lg shadow-red-500/20' : 'bg-guardian-500'}`}
                      style={{ width: `${Math.min(100, (todayPlannerHours / 8) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Total remaining */}
                <div>
                  <div className="flex justify-between text-text-secondary font-medium mb-1">
                    <span>Backlog Total Volume</span>
                    <span className="text-text-primary">{totalRemainingHours.toFixed(1)}h</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (totalRemainingHours / 30) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Overbooked indicators */}
                <div className="flex gap-2 text-[10px] font-black font-mono">
                  {isOverbooked ? (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/15">OVERBOOKED</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">BALANCED</span>
                  )}
                  {isBurnoutWarning && (
                    <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/15">HIGH STRESS</span>
                  )}
                </div>
              </div>
            </div>

            {/* C. Analytics Summary & Health [NEW] */}
            {analytics && (
              <div className="card p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">System Health</h3>
                  <p className="text-[10px] text-text-muted mt-0.5">Planner execution quality and diagnostics</p>
                </div>

                {/* Health Score Gauge */}
                <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                  <div className="relative w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-mono font-black text-guardian-400">{analytics.healthScore}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-text-secondary block">Overall Score</span>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-snug">
                      Calculated from completion velocities, overdue ratios, and cache diagnostic runs.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5">
                    <span className="text-[9px] uppercase font-bold text-text-muted block">Completed</span>
                    <span className="font-mono text-xs font-black text-text-primary block mt-1">{analytics.completedTasks}</span>
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5">
                    <span className="text-[9px] uppercase font-bold text-text-muted block">Overdue Alerts</span>
                    <span className={`font-mono text-xs font-black block mt-1 ${analytics.overdueTasks > 0 ? 'text-red-400' : 'text-text-secondary'}`}>
                      {analytics.overdueTasks}
                    </span>
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5">
                    <span className="text-[9px] uppercase font-bold text-text-muted block">Avg Delay</span>
                    <span className="font-mono text-xs font-black text-text-primary block mt-1">{analytics.avgDelayHours}h</span>
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5">
                    <span className="text-[9px] uppercase font-bold text-text-muted block">API Diagnostic</span>
                    <span className="font-mono text-xs font-black text-guardian-400 block mt-1">{analytics.geminiSuccessRate}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* D. Risk Heat Map [NEW] */}
            {activeTasksSorted.filter((t) => t.riskScore !== null && t.riskScore >= 40).length > 0 && (
              <div className="card p-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Risk Alerts</h3>
                  <p className="text-[10px] text-text-muted mt-0.5">Tasks currently flagging scheduling deficits</p>
                </div>
                <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                  {activeTasksSorted
                    .filter((t) => t.riskScore !== null && t.riskScore >= 40)
                    .map((t) => (
                      <div key={t.id} className="p-2.5 bg-red-500/[0.02] border border-red-500/15 rounded-xl flex items-center justify-between text-xs font-medium">
                        <span className="truncate text-text-primary" title={t.title}>{t.title}</span>
                        <span className={`font-mono font-black text-[9px] px-1.5 py-0.5 rounded ${
                          t.riskScore !== null && t.riskScore >= 75 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          Score {t.riskScore}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* E. Goals Summary Panel [NEW] */}
            {goalsSummary && (goalsSummary.active > 0 || goalsSummary.completed > 0) && (
              <div className="card p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Linked Milestones</h3>
                  <p className="text-[10px] text-text-muted mt-0.5">Progress indicators for active target horizons</p>
                </div>
                <div className="space-y-3 pt-1">
                  {goalsSummary.topGoals.map((g) => (
                    <div key={g.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="truncate text-text-primary max-w-[130px]" title={g.title}>{g.title}</span>
                        <span className="text-text-muted font-mono">{g.progress}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-guardian-500 rounded-full transition-all duration-300"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between text-[10px] text-text-muted border-t border-white/5 pt-3">
                    <span>Active: <span className="text-text-secondary font-bold">{goalsSummary.active}</span></span>
                    <span>Completed: <span className="text-emerald-400 font-bold">{goalsSummary.completed}</span></span>
                  </div>
                </div>
              </div>
            )}

            {/* F. Habits Streak Panel [NEW] */}
            {habitsSummary && habitsSummary.totalHabits > 0 && (
              <div className="card p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Routine Streaks</h3>
                    <p className="text-[10px] text-text-muted mt-0.5">Consistency rates of repeating behaviors</p>
                  </div>
                  {habitsSummary.topStreak > 0 && (
                    <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      🔥 {habitsSummary.topStreak}d
                    </span>
                  )}
                </div>
                <div className="space-y-2.5 pt-1">
                  {habitsSummary.habits.slice(0, 3).map((h) => (
                    <div key={h.id} className="flex justify-between items-center bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 p-2 rounded-xl text-xs font-medium">
                      <div className="min-w-0 pr-2">
                        <span className="truncate block text-text-primary" title={h.name}>{h.name}</span>
                        <span className="text-[9px] text-text-muted">Streak: {h.streakCount} days</span>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await completeHabit.mutateAsync(h.id);
                            toast.success('Habit logged!');
                          } catch {
                            toast.error('Failed to log habit');
                          }
                        }}
                        disabled={h.completedToday || completeHabit.isPending}
                        className={`h-7 px-2.5 rounded-lg font-bold text-[10px] transition-all flex-shrink-0 ${
                          h.completedToday
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10 text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {h.completedToday ? '✓ Done' : 'Complete'}
                      </button>
                    </div>
                  ))}
                  <div className="text-[10px] text-text-muted border-t border-white/5 pt-3 text-center">
                    Daily Routine Rate: <span className="text-text-secondary font-bold">{habitsSummary.completionRate}%</span> completed
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* ── FAB ───────────────────────────────────────── */}
        {!isLoading && tasks.length > 0 && (
          <motion.button
            id="fab-new-task"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-guardian-500 to-guardian-700 rounded-2xl flex items-center justify-center shadow-xl shadow-guardian-500/40 hover:shadow-guardian-500/60 transition-shadow z-30"
            aria-label="Create new task"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </motion.button>
        )}
      </Layout>

      {/* ── Create Task Modal ─────────────────────────── */}
      <Suspense fallback={null}>
        <CreateTaskModal
          isOpen={isModalOpen}
          onClose={() => !isAnalyzing && setIsModalOpen(false)}
          onSubmit={handleCreateTask}
          isAnalyzing={isAnalyzing}
        />
      </Suspense>
    </>
  );
}
