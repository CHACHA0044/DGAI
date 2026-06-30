import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, PriorityBadge } from '../../components/ui/Badge';
import AIInsightPanel from './AIInsightPanel';
import {
  formatDeadline,
  formatDeadlineDate,
  formatHours,
  isOverdue,
  getPriorityCardBorder,
  truncate,
} from '../../utils/formatters';
import {
  DIFFICULTY_CONFIG,
  STATUS_CONFIG,
} from '../../constants';
import type { Task, Subtask } from '../../types';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onReanalyze: (id: string) => void;
  index: number;
  rank?: number;
}

function getPriorityLabelStyles(label: string | null) {
  if (!label) return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
  const l = label.toLowerCase();
  if (l === 'critical') return { color: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/40' };
  if (l === 'high') return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
  if (l === 'medium') return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
  return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
}

export default function TaskCard({ task, onDelete, onReanalyze, index, rank }: TaskCardProps) {
  const [showInsights, setShowInsights] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const borderColor = getPriorityCardBorder(task.aiPriority);
  const isAnalyzing = task.status === 'ANALYZING';
  const deadlineOverdue = isOverdue(task.deadline);

  const difficultyCfg = task.difficulty ? DIFFICULTY_CONFIG[task.difficulty] : null;
  const statusCfg = STATUS_CONFIG[task.status];
  const dynPriorityCfg = getPriorityLabelStyles(task.priorityLabel);

  // Dynamic Risk Badge configurations
  let riskBadge = { label: 'Safe Risk', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  if (task.riskScore !== null) {
    if (task.riskScore >= 75) {
      riskBadge = { label: 'Critical Risk', color: 'text-red-400 font-extrabold', bg: 'bg-red-500/15', border: 'border-red-500/35' };
    } else if (task.riskScore >= 40) {
      riskBadge = { label: 'Warning Risk', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    }
  }

  const subtasks = task.subtasks as Subtask[] | null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      layout
      className={`relative bg-bg-card border border-white/8 border-l-4 ${borderColor} rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 group ${
        task.riskScore !== null && task.riskScore >= 75 ? 'ring-1 ring-red-500/30' : ''
      }`}
    >
      {/* Analyzing overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-bg-card/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <motion.div
              className="w-8 h-8 border-2 border-guardian-500/30 border-t-guardian-500 rounded-full mx-auto mb-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-xs text-guardian-400 font-medium">AI Analyzing…</p>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-white transition-colors flex items-center gap-2">
              {rank !== undefined && (
                <span className="flex-shrink-0 text-[10px] font-mono font-black bg-guardian-500/10 text-guardian-400 border border-guardian-500/25 px-1.5 py-0.5 rounded">
                  #{rank}
                </span>
              )}
              {task.title}
            </h3>
          </div>
          <PriorityBadge priority={task.aiPriority} />
        </div>

        {/* ── Badges ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.priorityScore !== null && (
            <Badge color={dynPriorityCfg.color} bg={dynPriorityCfg.bg} border={dynPriorityCfg.border}>
              🔥 Priority {task.priorityScore} ({task.priorityLabel})
            </Badge>
          )}
          {task.riskScore !== null && (
            <Badge color={riskBadge.color} bg={riskBadge.bg} border={riskBadge.border} dot={task.riskScore >= 40}>
              {riskBadge.label}
            </Badge>
          )}
          {difficultyCfg && (
            <Badge color={difficultyCfg.color} bg={difficultyCfg.bg} border={difficultyCfg.border}>
              {difficultyCfg.label}
            </Badge>
          )}
          {!task.isAnalyzed && (
            <Badge color={statusCfg.color} bg={statusCfg.bg} border="border-transparent">
              {statusCfg.label}
            </Badge>
          )}
        </div>

        {/* ── Description ─────────────────────────────────── */}
        {task.description && (
          <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-2">
            {truncate(task.description, 150)}
          </p>
        )}

        {/* ── Dynamic Risk Indicators ─────────────────────── */}
        {task.riskScore !== null && (
          <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
            <span className={task.completionProb !== null && task.completionProb >= 0.7 ? 'text-emerald-400' : 'text-orange-400'}>
              Done Prob: {task.completionProb !== null ? Math.round(task.completionProb * 100) : 0}%
            </span>
            <span className={task.missProbability !== null && task.missProbability >= 0.4 ? 'text-red-400' : 'text-text-muted'}>
              Miss Prob: {task.missProbability !== null ? Math.round(task.missProbability * 100) : 0}%
            </span>
            {task.timeDeficit !== null && (
              <span className={task.timeDeficit < 0 ? 'text-red-400' : 'text-text-muted'}>
                Deficit: {task.timeDeficit}h
              </span>
            )}
          </div>
        )}

        {/* ── Priority Reasoning Justification ─────────────── */}
        {task.priorityScore !== null && task.priorityReason && (
          <div className="mb-3 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-text-secondary leading-relaxed italic">
            💡 {task.priorityReason}
            {task.confidence !== null && (
              <span className="block mt-1 text-[10px] text-text-muted not-italic font-medium">
                AI prioritization confidence: {Math.round(task.confidence * 100)}%
              </span>
            )}
          </div>
        )}

        {/* ── Recovery Plan Drawer ────────────────────────── */}
        {task.recoveryPlan && (
          <div className="mb-3">
            <button
              onClick={() => setShowRecovery(v => !v)}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                showRecovery
                  ? 'bg-guardian-500/10 border-guardian-500/35 text-guardian-300'
                  : 'bg-white/[0.02] border-white/5 text-text-secondary hover:text-text-primary hover:border-white/10'
              }`}
            >
              <span className="flex items-center gap-1.5">📋 Show Recovery Plan</span>
              <span>{showRecovery ? '▲' : '▼'}</span>
            </button>
            
            <AnimatePresence>
              {showRecovery && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-1.5 p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2 text-xs"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Suggested Action</span>
                    <p className="text-text-primary font-medium mt-0.5">{task.recoveryPlan.suggestedReschedule}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Tasks to Defer</span>
                    <p className="text-text-secondary font-mono text-[11px] mt-0.5">
                      {task.recoveryPlan.tasksToDefer.join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Productivity Advice</span>
                    <ul className="list-disc list-inside space-y-1 text-text-secondary mt-1">
                      {task.recoveryPlan.productivityRecommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── AI Estimated Completion ─────────────────────── */}
        {task.estimatedCompletion && (
          <p className="text-xs text-guardian-400/80 mb-3 font-medium">
            ⏱ AI estimate: {task.estimatedCompletion}
          </p>
        )}

        {/* ── Tags ────────────────────────────────────────── */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {task.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-white/5 text-text-muted rounded-md border border-white/8 font-medium"
              >
                #{tag}
              </span>
            ))}
            {task.tags.length > 4 && (
              <span className="text-xs text-text-muted">+{task.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* ── Meta Row ────────────────────────────────────── */}
        <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
          {task.deadline && (
            <span
              className={`flex items-center gap-1.5 font-medium ${
                deadlineOverdue ? 'text-red-400' : 'text-text-secondary'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDeadlineDate(task.deadline)}
              <span className={deadlineOverdue ? 'text-red-400/70' : 'text-text-muted'}>
                ({formatDeadline(task.deadline)})
              </span>
            </span>
          )}
          {task.estimatedHours && (
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatHours(task.estimatedHours)}
            </span>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
          {/* AI Insights toggle */}
          {task.isAnalyzed ? (
            <button
              onClick={() => setShowInsights((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-guardian-400 hover:text-guardian-300 font-medium transition-colors"
              aria-expanded={showInsights}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${showInsights ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
              {showInsights ? 'Hide' : 'Show'} AI Insights
              {subtasks && subtasks.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-guardian-500/20 text-guardian-400 rounded-md font-mono">
                  {subtasks.length}
                </span>
              )}
            </button>
          ) : task.analysisError ? (
            <span className="text-xs text-red-400/80">Analysis failed</span>
          ) : (
            <span className="text-xs text-text-muted">Draft</span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Re-analyze */}
            {task.isAnalyzed && (
              <button
                onClick={() => onReanalyze(task.id)}
                title="Re-analyze with AI"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-guardian-400 hover:bg-guardian-500/10 transition-all duration-150"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            )}

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-red-400">Sure?</span>
                <button
                  onClick={() => onDelete(task.id)}
                  className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md transition-colors font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary rounded-md transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete task"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── AI Insights Panel ───────────────────────────── */}
        <AnimatePresence>
          {showInsights && task.isAnalyzed && (
            <AIInsightPanel
              executionPlan={task.executionPlan}
              productivityAdvice={task.productivityAdvice}
              nextImmediateStep={task.nextImmediateStep}
              potentialBlockers={task.potentialBlockers}
              dependencies={task.dependencies}
              subtasks={subtasks}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
