'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (showReconnected && !isOffline) {
    return (
      <aside
        aria-label="Network Status"
        className="w-full bg-emerald-950/95 border-b border-emerald-500/60 text-emerald-200 px-4 py-2 font-mono text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md sticky top-0 z-[9999] animate-fade-in"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-bold">Back Online! Connection restored.</span>
      </aside>
    );
  }

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Offline Warning"
      className="w-full bg-gradient-to-r from-amber-950/95 via-rose-950/95 to-amber-950/95 border-b border-amber-500/70 text-amber-100 px-4 py-2.5 font-mono text-xs flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_30px_rgba(245,158,11,0.3)] backdrop-blur-xl sticky top-0 z-[9999] animate-fade-in"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-amber-900/80 border border-amber-500/60 flex items-center justify-center shrink-0">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-extrabold text-amber-200 tracking-wide uppercase text-[11px] sm:text-xs">
            You&apos;re Offline! Some features will not work
          </span>
          <span className="hidden md:inline text-amber-400/60">•</span>
          <span className="text-[11px] text-amber-300/80 font-sans font-normal">
            (Live GitHub API inspection, Google Sheets, &amp; remote URL sync require internet)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-600/50 text-[10px] text-amber-200 font-bold uppercase tracking-wider">
          Local Engine Operational
        </span>
      </div>
    </aside>
  );
};
