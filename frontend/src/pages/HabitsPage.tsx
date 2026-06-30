import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import { useGetHabits, useCreateHabit, useCompleteHabit, useDeleteHabit } from '../hooks/useHabits';
import { useToast } from '../contexts/ToastContext';

export default function HabitsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');

  const { data: habits = [], isLoading } = useGetHabits();
  const createHabit = useCreateHabit();
  const completeHabit = useCompleteHabit();
  const deleteHabit = useDeleteHabit();
  const toast = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createHabit.mutateAsync({ name, description: description || undefined, frequency });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setFrequency('DAILY');
      toast.success('Habit created', 'AI suggestion will update shortly.');
    } catch {
      toast.error('Failed to create habit');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeHabit.mutateAsync(id);
      toast.success('Habit checked off!', 'Streak updated.');
    } catch {
      toast.error('Failed to log completion');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit.mutateAsync(id);
      toast.success('Habit deleted');
    } catch {
      toast.error('Failed to delete habit');
    }
  };

  return (
    <>
      <Header onNewTask={() => {}} />
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Habits & Routines</h2>
            <p className="text-xs text-text-secondary mt-0.5">Track repetitive patterns and build long-term momentum.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-semibold rounded-xl transition-all"
          >
            New Habit
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card p-6 h-36 animate-pulse" />
            <div className="card p-6 h-36 animate-pulse" />
          </div>
        ) : habits.length === 0 ? (
          <EmptyState
            title="No habits tracked"
            description="Create daily, weekly or monthly routines to build streaks and maintain discipline."
            action={
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-xl text-text-primary transition-all"
              >
                Create Habit
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <motion.div
                key={habit.id}
                layout
                className={`card p-5 flex flex-col justify-between hover:border-white/15 transition-all duration-200 ${
                  habit.completedToday ? 'border-emerald-500/30 bg-emerald-500/[0.01]' : ''
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-text-primary text-sm truncate">{habit.name}</h3>
                      <span className="text-[10px] text-text-muted capitalize">{habit.frequency.toLowerCase()} habit</span>
                    </div>
                    <span className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      🔥 {habit.streakCount}
                    </span>
                  </div>

                  {habit.description && (
                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                      {habit.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3">
                  {habit.aiSuggestion && (
                    <div className="text-[10px] text-guardian-400 bg-guardian-500/[0.02] border border-guardian-500/10 rounded-xl p-2.5 leading-relaxed">
                      💡 {habit.aiSuggestion}
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-2">
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>

                    <button
                      onClick={() => handleComplete(habit.id)}
                      disabled={habit.completedToday}
                      className={`h-8 px-4 rounded-xl text-xs font-bold transition-all ${
                        habit.completedToday
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {habit.completedToday ? '✓ Done Today' : 'Complete'}
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
                <h3 className="text-base font-black text-text-primary mb-4 uppercase tracking-wider">Create New Habit</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Habit Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Read research journals"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Description</label>
                    <textarea
                      placeholder="e.g. 15 minutes of paper reviews in the morning..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-bg-elevated border border-white/10 hover:border-white/20 focus:border-guardian-500/60 focus:ring-1 focus:ring-guardian-500/30 rounded-xl text-sm text-text-primary outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="form-input"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
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
                      disabled={createHabit.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      {createHabit.isPending ? 'Creating...' : 'Create'}
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
