import { AnimatePresence, motion } from 'framer-motion';
import type { Toast } from '../../types';

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const icons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colors: Record<string, { border: string; icon: string; bg: string }> = {
  success: { border: 'border-emerald-500/40', icon: 'text-emerald-400 bg-emerald-500/15', bg: 'bg-bg-card' },
  error:   { border: 'border-red-500/40',     icon: 'text-red-400 bg-red-500/15',         bg: 'bg-bg-card' },
  warning: { border: 'border-yellow-500/40',  icon: 'text-yellow-400 bg-yellow-500/15',   bg: 'bg-bg-card' },
  info:    { border: 'border-blue-500/40',    icon: 'text-blue-400 bg-blue-500/15',       bg: 'bg-bg-card' },
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const c = colors[toast.type] ?? colors.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 w-80 ${c.bg} border ${c.border} rounded-xl p-4 shadow-2xl backdrop-blur-sm`}
    >
      {/* Icon */}
      <span
        className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${c.icon}`}
      >
        {icons[toast.type]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-text-primary leading-tight">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors mt-0.5"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toast Container
// ─────────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
