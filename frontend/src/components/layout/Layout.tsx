import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-guardian-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-accent-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-guardian-500/5 rounded-full blur-3xl" />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 relative z-10">
        {/* Sidebar Nav */}
        <Sidebar />

        {/* Content area */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
