import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  className?: string;
  color?: 'guardian' | 'emerald' | 'orange' | 'cyan' | 'red';
  showPercentage?: boolean;
}

export default function ProgressBar({
  progress,
  className = '',
  color = 'guardian',
  showPercentage = false,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round(progress)));

  const colorMap = {
    guardian: 'bg-guardian-500 shadow-guardian-500/20',
    emerald: 'bg-emerald-500 shadow-emerald-500/20',
    orange: 'bg-orange-500 shadow-orange-500/20',
    cyan: 'bg-cyan-500 shadow-cyan-500/20',
    red: 'bg-red-500 shadow-red-500/20',
  };

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
          <span>Progress</span>
          <span className="text-text-primary">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
        <motion.div
          className={`h-full rounded-full transition-all duration-300 shadow-sm ${colorMap[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
