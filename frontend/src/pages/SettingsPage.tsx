import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import { useGetSettings, useUpdateSettings } from '../hooks/useSettings';
import { useToast } from '../contexts/ToastContext';
import type { UserSettings } from '../types';

function SettingRow({ label, subtitle, children }: { label: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-white/5 last:border-0">
      <div className="min-w-0">
        <span className="text-xs font-bold text-text-primary block">{label}</span>
        {subtitle && <span className="text-[11px] text-text-muted mt-0.5 block leading-relaxed">{subtitle}</span>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const toast = useToast();

  const [form, setForm] = useState<Partial<UserSettings>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        workStartHour: form.workStartHour,
        workEndHour: form.workEndHour,
        breakDurationMinutes: form.breakDurationMinutes,
        focusIntervalMinutes: form.focusIntervalMinutes,
        emergencyThresholdHours: form.emergencyThresholdHours,
        notificationsEnabled: form.notificationsEnabled,
        theme: form.theme,
      });
      toast.success('Settings saved', 'Your preferences have been updated.');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Header onNewTask={() => {}} />
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Settings & Preferences</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Configure work schedule, focus intervals, and notification behaviours.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-60"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {isLoading ? (
          <div className="card p-8 h-96 animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Work Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h3 className="text-[10px] font-black uppercase tracking-widest text-guardian-400 mb-4">Work Schedule</h3>

              <SettingRow
                label="Work Start Hour"
                subtitle="Hour of day your productive work begins (24h format)"
              >
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={form.workStartHour ?? 9}
                  onChange={(e) => update('workStartHour', Number(e.target.value))}
                  className="w-20 form-input text-center font-mono"
                />
              </SettingRow>

              <SettingRow
                label="Work End Hour"
                subtitle="Hour of day your productive work ends (24h format)"
              >
                <input
                  type="number"
                  min={13}
                  max={23}
                  value={form.workEndHour ?? 18}
                  onChange={(e) => update('workEndHour', Number(e.target.value))}
                  className="w-20 form-input text-center font-mono"
                />
              </SettingRow>

              <SettingRow
                label="Break Duration"
                subtitle="Default break length in minutes between focus blocks"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={form.breakDurationMinutes ?? 15}
                    onChange={(e) => update('breakDurationMinutes', Number(e.target.value))}
                    className="w-20 form-input text-center font-mono"
                  />
                  <span className="text-xs text-text-muted">min</span>
                </div>
              </SettingRow>

              <SettingRow
                label="Focus Block Length"
                subtitle="Duration of each Pomodoro-style deep focus session"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={15}
                    max={120}
                    value={form.focusIntervalMinutes ?? 50}
                    onChange={(e) => update('focusIntervalMinutes', Number(e.target.value))}
                    className="w-20 form-input text-center font-mono"
                  />
                  <span className="text-xs text-text-muted">min</span>
                </div>
              </SettingRow>
            </motion.div>

            {/* AI & Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">AI & Alerts</h3>

              <SettingRow
                label="Emergency Threshold"
                subtitle="Hours before deadline when Emergency Mode auto-triggers"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0.5}
                    max={24}
                    step={0.5}
                    value={form.emergencyThresholdHours ?? 2}
                    onChange={(e) => update('emergencyThresholdHours', Number(e.target.value))}
                    className="w-20 form-input text-center font-mono"
                  />
                  <span className="text-xs text-text-muted">hr</span>
                </div>
              </SettingRow>

              <SettingRow
                label="Notifications"
                subtitle="Enable system alerts and deadline warning notifications"
              >
                <button
                  onClick={() => update('notificationsEnabled', !form.notificationsEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    form.notificationsEnabled ? 'bg-guardian-500' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      form.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </SettingRow>

              <SettingRow
                label="Theme"
                subtitle="Visual appearance mode for the dashboard interface"
              >
                <select
                  value={form.theme ?? 'DARK'}
                  onChange={(e) => update('theme', e.target.value as any)}
                  className="form-input w-28"
                >
                  <option value="DARK">Dark</option>
                  <option value="LIGHT">Light</option>
                  <option value="SYSTEM">System</option>
                </select>
              </SettingRow>
            </motion.div>

            {/* Info card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 card p-6 bg-guardian-500/[0.02] border-guardian-500/10"
            >
              <h3 className="text-[10px] font-black uppercase tracking-widest text-guardian-400 mb-2">About</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-text-secondary">
                <div>
                  <span className="font-bold text-text-primary block mb-1">Deadline Guardian AI</span>
                  <span className="text-[11px] text-text-muted leading-relaxed">
                    AI-powered productivity companion that prevents missed deadlines through dynamic prioritization,
                    emergency detection, and habit reinforcement.
                  </span>
                </div>
                <div>
                  <span className="font-bold text-text-primary block mb-1">AI Engine</span>
                  <span className="text-[11px] text-text-muted leading-relaxed">
                    Powered by Google Gemini (@google/genai). All AI-powered features include offline fallback
                    engines based on proven heuristics.
                  </span>
                </div>
                <div>
                  <span className="font-bold text-text-primary block mb-1">Architecture</span>
                  <span className="text-[11px] text-text-muted leading-relaxed">
                    React + TypeScript frontend · Express + Prisma backend · Supabase PostgreSQL ·
                    TanStack Query · Framer Motion animations.
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </Layout>
    </>
  );
}
