import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <div className={`card p-5 hover:border-white/15 transition-colors duration-200 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary block mb-1">
            {title}
          </span>
          <span className="text-2xl font-bold font-mono text-text-primary tracking-tight leading-none">
            {value}
          </span>
        </div>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-1.5 mt-3 text-[11px] font-medium leading-none">
          {trend && (
            <span
              className={`font-mono font-bold ${
                trend.isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && <span className="text-text-muted">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
