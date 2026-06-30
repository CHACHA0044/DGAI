import type { RiskLevel, DifficultyLevel, TaskStatus } from '../types';

// ─────────────────────────────────────────────────────────────
// Query keys for TanStack Query cache management
// ─────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  TASKS: ['tasks'] as const,
  TASK: (id: string) => ['tasks', id] as const,
  PLAN: ['planner'] as const,
} as const;

// ─────────────────────────────────────────────────────────────
// Priority display config (1–10)
// ─────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  number,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  1:  { label: 'Minimal',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  2:  { label: 'Minimal',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  3:  { label: 'Low',      color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30',   glow: 'shadow-green-500/20'   },
  4:  { label: 'Low',      color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30',   glow: 'shadow-green-500/20'   },
  5:  { label: 'Moderate', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    glow: 'shadow-blue-500/20'    },
  6:  { label: 'Moderate', color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  glow: 'shadow-violet-500/20'  },
  7:  { label: 'High',     color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  glow: 'shadow-orange-500/20'  },
  8:  { label: 'High',     color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   glow: 'shadow-amber-500/20'   },
  9:  { label: 'Critical', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     glow: 'shadow-red-500/20'     },
  10: { label: 'Critical', color: 'text-red-300',     bg: 'bg-red-500/20',     border: 'border-red-400/50',     glow: 'shadow-red-500/40'     },
};

export const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  LOW:      { label: 'Low Risk',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  MEDIUM:   { label: 'Medium Risk',   color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30'  },
  HIGH:     { label: 'High Risk',     color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30'  },
  CRITICAL: { label: 'Critical Risk', color: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/40'     },
};

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; color: string; bg: string; border: string }> = {
  EASY:   { label: 'Easy',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  MEDIUM: { label: 'Medium', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30'    },
  HARD:   { label: 'Hard',   color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30'  },
  EXPERT: { label: 'Expert', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30'     },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  DRAFT:       { label: 'Draft',       color: 'text-slate-400',  bg: 'bg-slate-500/10'  },
  ANALYZING:   { label: 'Analyzing…',  color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ACTIVE:      { label: 'Active',      color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  IN_PROGRESS: { label: 'In Progress', color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
  COMPLETED:   { label: 'Completed',   color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
  ARCHIVED:    { label: 'Archived',    color: 'text-slate-400',  bg: 'bg-slate-500/10'  },
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 12,
} as const;
