import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { useGetCoachingAdvice } from '../hooks/useCoach';
import { useQueryClient } from '@tanstack/react-query';

export default function CoachPage() {
  const { data: advice, isLoading, refetch, isFetching } = useGetCoachingAdvice();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.removeQueries({ queryKey: ['coach', 'advice'] });
    void refetch();
  };

  return (
    <>
      <Header onNewTask={() => {}} />
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">AI Productivity Coach</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Personalized advice, focus frameworks, and stress management tools.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="px-4 py-2 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-60"
          >
            {isFetching ? 'Generating...' : 'Refresh Advice'}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="card p-8 h-40 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="card p-6 h-48 animate-pulse" />
              <div className="card p-6 h-48 animate-pulse" />
              <div className="card p-6 h-48 animate-pulse" />
            </div>
          </div>
        ) : advice ? (
          <div className="space-y-6">
            {/* Hero quote */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 bg-gradient-to-br from-guardian-500/5 to-transparent border-guardian-500/20 relative overflow-hidden"
            >
              <div className="absolute top-4 right-6 text-8xl opacity-[0.04] select-none font-serif">"</div>
              <p className="text-xl font-bold text-text-primary italic leading-relaxed max-w-3xl">
                "{advice.motivationalQuote}"
              </p>
            </motion.div>

            {/* Personalized advice */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6 border-l-4 border-l-cyan-500"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block mb-2">
                Personalized Assessment
              </span>
              <p className="text-sm text-text-primary leading-relaxed">{advice.advice}</p>
            </motion.div>

            {/* 3-column tip cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Focus Tips */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-guardian-500/10 border border-guardian-500/20 flex items-center justify-center text-sm">
                    🎯
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-guardian-400">Focus Frameworks</span>
                </div>
                <ul className="space-y-3">
                  {advice.focusTips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-xs text-text-secondary leading-relaxed">
                      <span className="text-guardian-400 font-bold flex-shrink-0 mt-0.5">→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Time Management */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-sm">
                    ⏱️
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Time Strategy</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{advice.timeManagementAdvice}</p>
              </motion.div>

              {/* Stress Reduction */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="card p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm">
                    🧘
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Stress Recovery</span>
                </div>
                <ul className="space-y-3">
                  {advice.stressReductionTips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-xs text-text-secondary leading-relaxed">
                      <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <p className="text-center text-[11px] text-text-muted italic">
              Advice is personalized based on your active backlog, delay patterns, and system health score.
            </p>
          </div>
        ) : null}
      </Layout>
    </>
  );
}
