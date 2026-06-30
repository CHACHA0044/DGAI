import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import { useGetInsights, useGenerateInsights } from '../hooks/useInsights';
import { useToast } from '../contexts/ToastContext';

export default function InsightsPage() {
  const { data: insights = [], isLoading, refetch } = useGetInsights();
  const generateInsights = useGenerateInsights();
  const toast = useToast();

  const handleRecalculate = async () => {
    try {
      toast.success('Analyzing...', 'Recalculating focus scores and productivity metrics...');
      await generateInsights.mutateAsync();
      toast.success('Insights generated successfully');
      void refetch();
    } catch {
      toast.error('Failed to generate insights');
    }
  };

  // Extract metrics from latest insight data if available
  const latestData = insights[0]?.data || {
    bestWorkingPeriod: 'Mornings',
    completionDistribution: { morning: 0, afternoon: 0, evening: 0 },
    fridayMissedDeadlines: 0,
    averageCompletionHours: 0,
    averageDelayHours: 0,
    healthIndex: 100,
    geminiSuccessRate: 100,
    focusScore: 100,
    recoverySuccessRate: 100,
    totalCompletedTasks: 0,
  };

  return (
    <>
      <Header onNewTask={() => {}} />
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Audits & Smart Insights</h2>
            <p className="text-xs text-text-secondary mt-0.5">Analyze peak energy blocks, delay hotspots, and system diagnostics.</p>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={generateInsights.isPending}
            className="px-4 py-2 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-semibold rounded-xl transition-all"
          >
            {generateInsights.isPending ? 'Analyzing...' : 'Recalculate Insights'}
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card p-6 h-24 animate-pulse" />
            <div className="card p-6 h-24 animate-pulse" />
            <div className="card p-6 h-24 animate-pulse" />
          </div>
        ) : insights.length === 0 ? (
          <EmptyState
            title="No insights generated"
            description="Recalculate productivity profiles to analyze completed work schedules and build habits profiles."
            action={
              <button
                onClick={handleRecalculate}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-xl text-text-primary transition-all"
              >
                Analyze Workload
              </button>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Flow Focus Rating"
                value={`${latestData.focusScore}/100`}
                subtitle="Daily focus and routine consistency score"
                trend={{ value: 'New', isPositive: true }}
              />
              <StatCard
                title="Recovery Success"
                value={`${latestData.recoverySuccessRate}%`}
                subtitle="Rate of critical tasks completed post-recovery"
              />
              <StatCard
                title="Avg Completion Delay"
                value={`${latestData.averageDelayHours}h`}
                subtitle="Average delay hours for overdue tasks"
              />
              <StatCard
                title="Completed Tasks"
                value={latestData.totalCompletedTasks}
                subtitle="Total items archived in backlog history"
              />
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Peak distribution chart */}
              <div className="card p-6 lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Peak Energy Distribution</h3>
                  <p className="text-[10px] text-text-muted mt-0.5 font-medium">Task completions categorized by time of day</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                      <span>🌅 Mornings (5 AM - 12 PM)</span>
                      <span className="font-bold text-text-primary">{latestData.completionDistribution.morning} tasks</span>
                    </div>
                    <ProgressBar progress={latestData.completionDistribution.morning * 10} color="cyan" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                      <span>☀️ Afternoons (12 PM - 5 PM)</span>
                      <span className="font-bold text-text-primary">{latestData.completionDistribution.afternoon} tasks</span>
                    </div>
                    <ProgressBar progress={latestData.completionDistribution.afternoon * 10} color="guardian" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                      <span>🌙 Evenings (5 PM - 5 AM)</span>
                      <span className="font-bold text-text-primary">{latestData.completionDistribution.evening} tasks</span>
                    </div>
                    <ProgressBar progress={latestData.completionDistribution.evening * 10} color="orange" />
                  </div>
                </div>
              </div>

              {/* Friday warning / Delay card */}
              <div className="card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Delay Analysis</h3>
                  <p className="text-[10px] text-text-muted mt-0.5">Statistical indicators of workflow bottlenecks</p>
                </div>

                <div className="py-4 space-y-3">
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-red-400 block">Friday Missed Deadlines</span>
                    <span className="text-xl font-bold text-white mt-1 block">{latestData.fridayMissedDeadlines} Tasks</span>
                  </div>
                  
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Deadlines set for Friday afternoons carry a higher failure probability. Consider shifting major delivery boundaries to Thursdays.
                  </p>
                </div>

                <div className="text-[10px] font-mono text-text-muted border-t border-white/5 pt-3">
                  Fallbacks usage: {latestData.offlineFallbackUsage} • API Rate: {latestData.geminiSuccessRate}%
                </div>
              </div>
            </div>

            {/* Smart insights list */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary">Smart Productivity Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {insights.map((insight) => (
                  <div key={insight.id} className="card p-5 space-y-2.5">
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border text-guardian-400 bg-guardian-500/10 border-guardian-500/20 uppercase w-fit block">
                      {insight.type.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-xs text-text-primary">{insight.title}</h4>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">
                      {insight.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
