import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useGetEmergencyStatus,
  useToggleEmergencyMode,
} from '../../hooks/usePlanner';

interface HeaderProps {
  onNewTask: () => void;
}

export default function Header({ onNewTask }: HeaderProps) {
  const { toggleTheme, isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  // Queries & Mutations
  const { data: alerts = [] } = useGetNotifications();
  const { data: emergency } = useGetEmergencyStatus();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const toggleEmergency = useToggleEmergencyMode();

  const unreadAlerts = alerts.filter((a) => !a.read);
  const isEmergency = emergency?.isEmergency ?? false;

  const handleToggleEmergency = () => {
    toggleEmergency.mutate(!isEmergency);
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Glass effect */}
      <div className="bg-bg-primary/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3"
            >
              {/* Logo mark */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-guardian-500 to-guardian-700 flex items-center justify-center shadow-lg shadow-guardian-500/30 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-none">
                  Deadline Guardian
                </h1>
                <p className="text-xs text-text-muted font-medium mt-0.5">AI Productivity</p>
              </div>
            </motion.div>

            {/* Right actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3"
            >
              {/* Emergency mode toggle button */}
              <button
                onClick={handleToggleEmergency}
                disabled={toggleEmergency.isPending}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm ${
                  isEmergency
                    ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-text-secondary hover:text-text-primary'
                }`}
              >
                {isEmergency && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
                )}
                {toggleEmergency.isPending ? 'Syncing...' : isEmergency ? '🚨 Emergency Mode Active' : '⚠ Trigger Emergency'}
              </button>

              {/* Notifications Dropdown Bell Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/8 transition-all relative ${
                    showNotifications ? 'bg-white/8 text-text-primary' : ''
                  }`}
                  aria-label="Toggle notifications panel"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  {unreadAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-guardian-500 text-white text-[9px] font-black font-mono rounded-full flex items-center justify-center border border-bg-primary">
                      {unreadAlerts.length}
                    </span>
                  )}
                </button>

                {/* Notifications Drawer Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <>
                      {/* Click outside overlay */}
                      <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2.5 w-80 bg-bg-card border border-white/10 rounded-2xl shadow-xl z-40 overflow-hidden"
                      >
                        <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest text-text-primary">System Alerts</span>
                          {unreadAlerts.length > 0 && (
                            <button
                              onClick={() => markAllRead.mutate()}
                              className="text-[10px] text-guardian-400 hover:text-guardian-300 font-semibold"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                          {alerts.map((alert) => (
                            <div
                              key={alert.id}
                              onClick={() => !alert.read && markRead.mutate(alert.id)}
                              className={`p-3 text-xs leading-relaxed transition-all cursor-pointer ${
                                alert.read ? 'text-text-muted hover:bg-white/[0.01]' : 'text-text-secondary bg-guardian-500/[0.02] hover:bg-guardian-500/[0.04]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1 font-bold">
                                <span>{alert.type.replace('_', ' ')}</span>
                                {!alert.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-guardian-400" />
                                )}
                              </div>
                              <p className="font-medium text-text-primary/95">{alert.message}</p>
                              <span className="text-[9px] text-text-muted block mt-1.5">
                                {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                          {alerts.length === 0 && (
                            <div className="p-8 text-center text-text-muted text-xs">
                              No notifications or alerts.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/8 transition-all duration-200"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* New Task button */}
              <button
                id="new-task-btn"
                onClick={onNewTask}
                className="flex items-center gap-2 h-9 px-4 bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-guardian-500/25 hover:shadow-guardian-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="hidden sm:inline">New Task</span>
                <span className="sm:hidden">New</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
}
