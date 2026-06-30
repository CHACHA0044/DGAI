import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatMinutes } from '../../utils/formatters';
import type { Subtask } from '../../types';

interface AIInsightPanelProps {
  executionPlan: string | null;
  productivityAdvice: string | null;
  nextImmediateStep: string | null;
  potentialBlockers: string[] | null;
  dependencies: string[] | null;
  subtasks: Subtask[] | null;
}

export default function AIInsightPanel({
  executionPlan,
  productivityAdvice,
  nextImmediateStep,
  potentialBlockers,
  dependencies,
  subtasks,
}: AIInsightPanelProps) {
  // Local subtask completion state (Phase 1 — not persisted)
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggleSubtask = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sortedSubtasks = subtasks
    ? [...subtasks].sort((a, b) => a.order - b.order)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="pt-4 border-t border-white/5 space-y-4">

        {/* Next Immediate Step */}
        {nextImmediateStep && (
          <div className="bg-guardian-500/8 border border-guardian-500/20 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-guardian-400 text-xs">⚡</span>
              <span className="text-xs font-semibold text-guardian-400 uppercase tracking-wide">Next Step</span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">{nextImmediateStep}</p>
          </div>
        )}

        {/* Subtasks */}
        {sortedSubtasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Subtasks
              </span>
              <span className="text-xs text-text-muted">
                {completed.size}/{sortedSubtasks.length} done
              </span>
            </div>
            <div className="space-y-2">
              {sortedSubtasks.map((st) => {
                const isDone = completed.has(st.id);
                return (
                  <button
                    key={st.id}
                    onClick={() => toggleSubtask(st.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/4 transition-colors text-left group"
                    aria-pressed={isDone}
                  >
                    {/* Checkbox */}
                    <span
                      className={`flex-shrink-0 w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-white/20 group-hover:border-white/40'
                      }`}
                    >
                      {isDone && (
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </span>

                    <span
                      className={`flex-1 text-sm transition-colors ${
                        isDone ? 'line-through text-text-muted' : 'text-text-primary'
                      }`}
                    >
                      {st.title}
                    </span>

                    <span className="text-xs text-text-muted font-mono">
                      {formatMinutes(st.estimatedMinutes)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Execution Plan */}
        {executionPlan && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">📋</span>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Execution Plan
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed bg-white/3 rounded-xl p-3.5">
              {executionPlan}
            </p>
          </div>
        )}

        {/* Productivity Advice */}
        {productivityAdvice && (
          <div className="bg-accent-cyan/5 border border-accent-cyan/15 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs">💡</span>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
                Productivity Tip
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{productivityAdvice}</p>
          </div>
        )}

        {/* Potential Blockers */}
        {potentialBlockers && potentialBlockers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">🚧</span>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Potential Blockers
              </span>
            </div>
            <ul className="space-y-1.5">
              {potentialBlockers.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="text-orange-400/70 mt-0.5 flex-shrink-0">•</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dependencies */}
        {dependencies && dependencies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">🔗</span>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Dependencies
              </span>
            </div>
            <ul className="space-y-1.5">
              {dependencies.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="text-blue-400/70 mt-0.5 flex-shrink-0">→</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
