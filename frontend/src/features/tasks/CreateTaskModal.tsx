import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/ui/Modal';
import AnalyzingAnimation from './AnalyzingAnimation';
import { parseTags } from '../../utils/formatters';
import type { CreateTaskData } from '../../types';

// ─────────────────────────────────────────────────────────────
// Form schema
// ─────────────────────────────────────────────────────────────

const schema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  deadline: z.string().optional(),
  estimatedHours: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? parseFloat(v) : undefined))
    .refine((v) => v === undefined || (v > 0 && v <= 10000), {
      message: 'Must be a positive number',
    }),
  tags: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskData) => Promise<void>;
  isAnalyzing: boolean;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  isAnalyzing,
}: CreateTaskModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const isBusy = isSubmitting || isAnalyzing;

  const handleClose = () => {
    if (isBusy) return;
    reset();
    onClose();
  };

  const onFormSubmit = async (values: FormValues) => {
    const payload: CreateTaskData = {
      title: values.title,
      ...(values.description && { description: values.description }),
      ...(values.deadline && { deadline: new Date(values.deadline).toISOString() }),
      ...(values.estimatedHours !== undefined && { estimatedHours: values.estimatedHours }),
      tags: values.tags ? parseTags(values.tags) : [],
    };

    await onSubmit(payload);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isBusy ? undefined : 'New Task'}
      maxWidth="max-w-lg"
    >
      {isBusy ? (
        <AnalyzingAnimation />
      ) : (
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="px-6 pb-6 pt-4 space-y-5"
          noValidate
        >
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-text-secondary mb-1.5">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              placeholder="e.g. Launch marketing campaign"
              {...register('title')}
              className="w-full h-10 px-3.5 bg-bg-elevated border border-white/10 hover:border-white/20 focus:border-guardian-500/60 focus:ring-1 focus:ring-guardian-500/30 rounded-xl text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200"
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="block text-sm font-medium text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              id="task-desc"
              placeholder="What needs to be done? More context = better AI analysis."
              rows={3}
              {...register('description')}
              className="w-full px-3.5 py-2.5 bg-bg-elevated border border-white/10 hover:border-white/20 focus:border-guardian-500/60 focus:ring-1 focus:ring-guardian-500/30 rounded-xl text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 resize-none"
            />
          </div>

          {/* Deadline + Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-deadline" className="block text-sm font-medium text-text-secondary mb-1.5">
                Deadline
              </label>
              <input
                id="task-deadline"
                type="datetime-local"
                {...register('deadline')}
                className="w-full h-10 px-3.5 bg-bg-elevated border border-white/10 hover:border-white/20 focus:border-guardian-500/60 focus:ring-1 focus:ring-guardian-500/30 rounded-xl text-sm text-text-primary outline-none transition-all duration-200 [color-scheme:dark]"
              />
            </div>
            <div>
              <label htmlFor="task-hours" className="block text-sm font-medium text-text-secondary mb-1.5">
                Est. Hours
              </label>
              <input
                id="task-hours"
                type="number"
                placeholder="e.g. 4"
                min="0.25"
                step="0.25"
                {...register('estimatedHours')}
                className="w-full h-10 px-3.5 bg-bg-elevated border border-white/10 hover:border-white/20 focus:border-guardian-500/60 focus:ring-1 focus:ring-guardian-500/30 rounded-xl text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200"
              />
              {errors.estimatedHours && (
                <p className="mt-1 text-xs text-red-400">{errors.estimatedHours.message}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="task-tags" className="block text-sm font-medium text-text-secondary mb-1.5">
              Tags
              <span className="text-text-muted font-normal ml-1">(comma separated)</span>
            </label>
            <input
              id="task-tags"
              type="text"
              placeholder="work, q1-2025, design"
              {...register('tags')}
              className="w-full h-10 px-3.5 bg-bg-elevated border border-white/10 hover:border-white/20 focus:border-guardian-500/60 focus:ring-1 focus:ring-guardian-500/30 rounded-xl text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200"
            />
          </div>

          {/* AI hint */}
          <div className="bg-guardian-500/8 border border-guardian-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-guardian-400 mt-0.5 flex-shrink-0">🤖</span>
            <p className="text-xs text-guardian-400/80 leading-relaxed">
              Gemini AI will instantly analyze this task and generate priority, subtasks, execution plan, risk assessment, and productivity advice.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-11 text-sm font-medium text-text-secondary bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/8"
            >
              Cancel
            </button>
            <button
              id="analyze-task-btn"
              type="submit"
              disabled={isBusy}
              className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 rounded-xl transition-all duration-200 shadow-lg shadow-guardian-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Analyze Task
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
