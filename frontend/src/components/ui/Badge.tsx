import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  bg?: string;
  border?: string;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, color = 'text-slate-400', bg = 'bg-slate-500/10', border = 'border-slate-500/30', className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color} ${bg} ${border} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
      )}
      {children}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────

interface PriorityBadgeProps {
  priority: number | null;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (priority === null) return null;

  const isHigh = priority >= 7;
  const isCritical = priority >= 9;

  const colors = isCritical
    ? 'text-red-300 bg-red-500/20 border-red-400/50'
    : isHigh
    ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
    : priority >= 5
    ? 'text-violet-400 bg-violet-500/10 border-violet-500/30'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${colors} ${isCritical ? 'animate-pulse-glow' : ''}`}
    >
      <span className="font-mono">{priority}</span>
      <span className="opacity-70">/10</span>
    </span>
  );
}
