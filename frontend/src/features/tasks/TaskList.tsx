import { AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';
import SkeletonCard from '../../components/ui/SkeletonCard';
import type { Task } from '../../types';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onReanalyze: (id: string) => void;
  rankMap?: Map<string, number>;
}

function EmptyState({ onNewTask }: { onNewTask?: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      {/* Illustration */}
      <div className="w-20 h-20 rounded-2xl bg-guardian-500/10 border border-guardian-500/20 flex items-center justify-center mb-6 animate-float">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-guardian-400">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-text-primary mb-2">
        No tasks yet
      </h3>
      <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-6">
        Create your first task and let Gemini AI analyze it instantly — priority, subtasks, execution plan, and more.
      </p>

      {onNewTask && (
        <button
          onClick={onNewTask}
          className="flex items-center gap-2 h-10 px-5 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-guardian-500/25"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create your first task
        </button>
      )}
    </div>
  );
}

export default function TaskList({ tasks, isLoading, onDelete, onReanalyze, rankMap }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            onDelete={onDelete}
            onReanalyze={onReanalyze}
            rank={rankMap?.get(task.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
