import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import { useGetCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent, useGetFreeSlots } from '../hooks/useCalendar';
import { useGetPlan } from '../hooks/usePlanner';
import { useToast } from '../contexts/ToastContext';

export default function CalendarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [type, setType] = useState<'TASK_BLOCK' | 'HABIT_BLOCK' | 'MEETING' | 'FREE_TIME' | 'BUFFER' | 'BREAK'>('TASK_BLOCK');

  const todayStr = new Date().toISOString().split('T')[0];
  const { data: events = [], isLoading } = useGetCalendarEvents();
  const { data: freeSlots = [] } = useGetFreeSlots(todayStr, 30);
  const { data: plan } = useGetPlan();
  
  const createEvent = useCreateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const toast = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startAt || !endAt) return;

    try {
      await createEvent.mutateAsync({
        title,
        description: description || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        type,
        isBlocked,
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setStartAt('');
      setEndAt('');
      setIsBlocked(false);
      setType('TASK_BLOCK');
      toast.success('Calendar event created successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete event');
    }
  };

  // Group events by time of day
  const sortedEvents = [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));

  return (
    <>
      <Header onNewTask={() => {}} />
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Calendar & Block Scheduler</h2>
            <p className="text-xs text-text-secondary mt-0.5">Visualize time blocks, manage meeting overheads, and allocate focus windows.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Add Time Block
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar blocks list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary">Today's Schedule Blocks</h3>
            
            {isLoading ? (
              <div className="card p-6 h-36 animate-pulse" />
            ) : sortedEvents.length === 0 ? (
              <EmptyState
                title="Calendar is empty"
                description="Create time blocks manually, or view daily planner items auto-synced into your day."
                action={
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-xl text-text-primary transition-all"
                  >
                    Block Time
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {sortedEvents.map((event) => {
                  let badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                  if (event.type === 'MEETING') badgeColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
                  else if (event.type === 'BREAK') badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                  else if (event.type === 'BUFFER') badgeColor = 'text-slate-400 bg-slate-500/10 border-slate-500/20';

                  const start = new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const end = new Date(event.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <motion.div
                      key={event.id}
                      layout
                      className={`card p-4 flex items-center justify-between border-l-4 ${
                        event.isBlocked ? 'border-l-guardian-500' : 'border-l-white/10'
                      } hover:border-white/15 transition-all`}
                    >
                      <div className="min-w-0 pr-4">
                        <span className="text-[10px] font-mono font-bold text-text-muted block">{start} - {end}</span>
                        <h4 className="font-bold text-text-primary text-xs truncate mt-0.5">{event.title}</h4>
                        {event.description && <p className="text-[11px] text-text-secondary truncate mt-0.5">{event.description}</p>}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}>
                          {event.type.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar recommendations */}
          <div className="space-y-6">
            {/* Free slots */}
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Available Work Slots</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Calculated free time slots during your defined workday</p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {freeSlots.map((slot, i) => {
                  const start = new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const end = new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={i} className="p-3 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-xs font-medium">
                      <span className="text-text-primary font-mono">{start} - {end}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{slot.durationMinutes}m Free</span>
                    </div>
                  );
                })}
                {freeSlots.length === 0 && (
                  <div className="text-center py-4 text-xs text-text-muted">
                    No free slots. Calendar is fully booked.
                  </div>
                )}
              </div>
            </div>

            {/* Sync plan info */}
            {plan && (
              <div className="card p-6 bg-guardian-500/[0.01] border-guardian-500/10 text-center">
                <span className="text-xl">📅</span>
                <h4 className="text-xs font-bold text-text-primary mt-2">Daily Planner Synchronization</h4>
                <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed">
                  Your daily planner and calendar schedule blocks are synchronized automatically upon prioritization recalculations.
                </p>
              </div>
            )}
          </div>
        </div>

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
                <h3 className="text-base font-black text-text-primary mb-4 uppercase tracking-wider">Create Calendar Block</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Block Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sync with product team"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Description</label>
                    <textarea
                      placeholder="Meeting link, context notes or checklist agenda..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-bg-elevated border border-white/10 hover:border-white/20 focus:border-guardian-500/60 focus:ring-1 focus:ring-guardian-500/30 rounded-xl text-sm text-text-primary outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Start Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">End Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Block Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="form-input"
                      >
                        <option value="TASK_BLOCK">Task Block</option>
                        <option value="HABIT_BLOCK">Habit Block</option>
                        <option value="MEETING">Meeting</option>
                        <option value="BREAK">Break</option>
                        <option value="BUFFER">Buffer</option>
                      </select>
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 select-none h-10 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isBlocked}
                          onChange={(e) => setIsBlocked(e.target.checked)}
                          className="rounded border-white/10 bg-bg-elevated text-guardian-500 focus:ring-1 focus:ring-guardian-500/50"
                        />
                        <span className="text-[11px] font-bold text-text-secondary uppercase">Lock Time Slot</span>
                      </label>
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
                      disabled={createEvent.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      {createEvent.isPending ? 'Blocking...' : 'Block Time'}
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
