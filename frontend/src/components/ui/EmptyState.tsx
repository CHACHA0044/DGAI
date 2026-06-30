import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] ${className}`}>
      {icon ? (
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary mb-4">
          {icon}
        </div>
      ) : (
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>
        </div>
      )}

      <h4 className="text-sm font-bold text-text-primary mb-1">
        {title}
      </h4>
      <p className="text-xs text-text-secondary max-w-sm mb-5 leading-relaxed">
        {description}
      </p>

      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
