import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import { useGetGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../hooks/useGoals';
import { useToast } from '../contexts/ToastContext';

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'SHORT_TERM' | 'LONG_TERM'>('SHORT_TERM');
  const [targetDate, setTargetDate] = useState('');

  const { data: goals = [], isLoading } = useGetGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const toast = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createGoal.mutateAsync({
        title,
        description: description || undefined,
        type,
        targetDate: targetDate || undefined,
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setType('SHORT_TERM');
      setTargetDate('');
      toast.success('Goal created successfully', 'AI is estimating completion likelihood.');
    } catch (err) {
      toast.error('Failed to create goal');
    }
  };

  const handleProgressChange = async (id: string, currentProgress: number, change: number) => {
    const nextProgress = Math.min(100, Math.max(0, currentProgress + change));
    try {
      await updateGoal.mutateAsync({
        id,
        data: { progress: nextProgress },
      });
    } catch {
      toast.error('Failed to update progress');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal.mutateAsync(id);
      toast.success('Goal deleted');
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  return (
    <>
      <Header onNewTask={() => {}} />
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Goals & Milestones</h2>
            <p className="text-xs text-text-secondary mt-0.5">Define long-term horizons and short-term achievements.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-semibold rounded-xl transition-all duration-200"
          >
            Create Goal
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-6 h-36 animate-pulse" />
            <div className="card p-6 h-36 animate-pulse" />
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            title="No goals defined"
            description="Create your first goal to link active tasks and get AI feasibility estimations."
            action={
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-xl text-text-primary transition-all"
              >
                Get Started
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                className="card p-6 flex flex-col justify-between hover:border-white/15 transition-all duration-200"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-text-primary text-sm truncate">{goal.title}</h3>
                    <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                      goal.type === 'LONG_TERM'
                        ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                        : 'text-violet-400 bg-violet-500/10 border-violet-500/20'
                    }`}>
                      {goal.type.replace('_', ' ')}
                    </span>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mb-4">
                    <ProgressBar progress={goal.progress} showPercentage color={goal.progress >= 75 ? 'emerald' : 'guardian'} />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-text-muted">Target: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'No date'}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleProgressChange(goal.id, goal.progress, -10)}
                          disabled={goal.progress <= 0}
                          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-text-secondary disabled:opacity-30 transition-all"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleProgressChange(goal.id, goal.progress, 10)}
                          disabled={goal.progress >= 100}
                          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-text-secondary disabled:opacity-30 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI advice */}
                <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                  {goal.aiEstimation ? (
                    <p className="text-[11px] text-guardian-400 italic bg-guardian-500/[0.02] border border-guardian-500/10 rounded-xl p-2.5 leading-relaxed">
                      💡 {goal.aiEstimation}
                    </p>
                  ) : (
                    <p className="text-[10px] text-text-muted italic">Generating AI Estimation...</p>
                  )}

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-text-muted">Status: <span className="font-bold text-text-secondary">{goal.status}</span></span>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-400 hover:text-red-300 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-bg-card border border-white/10 rounded-2xl p-6 relative z-10"
              >
                <h3 className="text-base font-black text-text-primary mb-4 uppercase tracking-wider">Create New Goal</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Goal Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Finish Phase 4 Production Specs"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Description</label>
                    <textarea
                      placeholder="Goal scope or milestone checkpoints..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-bg-elevated border border-white/10 hover:border-white/20 focus:border-guardian-500/60 focus:ring-1 focus:ring-guardian-500/30 rounded-xl text-sm text-text-primary outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="form-input"
                      >
                        <option value="SHORT_TERM">Short Term</option>
                        <option value="LONG_TERM">Long Term</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Target Date</label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-text-secondary transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createGoal.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      {createGoal.isPending ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Layout>
    </>
  );
}
