import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import ToastContainer from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Spinner from './components/ui/Spinner';

// Lazy-loaded pages for code splitting
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const GoalsPage    = lazy(() => import('./pages/GoalsPage'));
const HabitsPage   = lazy(() => import('./pages/HabitsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const CoachPage    = lazy(() => import('./pages/CoachPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// ── Query Client ────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Page loading fallback ───────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-3" />
        <p className="text-sm text-text-muted">Loading…</p>
      </div>
    </div>
  );
}

// ── Toast Bridge (needs context) ───────────────────────────

function ToastBridge() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}

// ── Root App ───────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/"          element={<Dashboard />} />
                  <Route path="/goals"     element={<GoalsPage />} />
                  <Route path="/habits"    element={<HabitsPage />} />
                  <Route path="/calendar"  element={<CalendarPage />} />
                  <Route path="/insights"  element={<InsightsPage />} />
                  <Route path="/coach"     element={<CoachPage />} />
                  <Route path="/settings"  element={<SettingsPage />} />
                  <Route path="*"          element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <ToastBridge />
          </ToastProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
