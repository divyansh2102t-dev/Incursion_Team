'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  Code2,
  Terminal,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number>(7);
  const redirectedRef = useRef<boolean>(false);

  const handleGoBack = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGoBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Compute progress percentage from 7s down to 0s
  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / 7) * 100));

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-zinc-100 bg-cyber-grid selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-xl mx-auto bg-black/85 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_60px_rgba(6,182,212,0.18)] backdrop-blur-2xl relative z-10 text-center font-mono">
        {/* Top Header Badge */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            <img src="/icon.svg" alt="Incursion Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-black tracking-widest text-zinc-300 uppercase">
            INCURSION
          </span>
          <span className="text-[9px] font-bold bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800">
            TRACK 3
          </span>
        </div>

        {/* Big Glitch 404 Headline */}
        <div className="space-y-1">
          <div className="text-6xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 neon-glow-cyan">
            404
          </div>
          <div className="text-xs sm:text-sm font-bold text-cyan-400 tracking-wider uppercase flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 inline" />
            <span>SIGNAL TERMINATED // ROUTE_NOT_FOUND</span>
          </div>
        </div>

        {/* Telemetry Diagnostics Terminal Box */}
        <div className="bg-black/90 border border-zinc-800 rounded-xl p-3.5 text-left text-[11px] space-y-1 text-zinc-400 shadow-inner">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-1 mb-1.5 font-bold">
            <span className="flex items-center gap-1 text-zinc-400">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>ROUTING_TELEMETRY.SYS</span>
            </span>
            <span className="text-rose-400">ERR_NULL_COORDINATES</span>
          </div>
          <p className="font-mono text-zinc-300">
            <span className="text-cyan-400 font-bold">&gt; STATUS:</span> Requested URL coordinates do not exist in Incursion routing table.
          </p>
          <p className="font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">&gt; RESOLVER:</span> Automated quantum redirect to previous page initiated.
          </p>
        </div>

        {/* 7-Second Animated Countdown Module */}
        <div className="bg-cyan-950/20 border border-cyan-900/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Automated Navigation Back:</span>
            </span>
            <span className="text-cyan-300 text-sm font-black tracking-widest font-mono">
              0{secondsLeft}s
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 ease-linear shadow-[0_0_8px_#22d3ee]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[10px] text-zinc-500">
            Redirecting to your previous terminal in <span className="text-cyan-300 font-bold">{secondsLeft}</span> second{secondsLeft === 1 ? '' : 's'}...
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleGoBack}
            className="w-full sm:w-auto px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="Return immediately to the previous page"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Go Back Now</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-cyan-300 text-xs font-bold rounded-xl border border-zinc-800 hover:border-cyan-500/50 transition-colors flex items-center justify-center gap-1.5"
            title="Return to Incursion Candidate Leaderboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Leaderboard</span>
          </Link>

          <Link
            href="/formulas"
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-cyan-300 text-xs font-bold rounded-xl border border-zinc-800 hover:border-cyan-500/50 transition-colors flex items-center justify-center gap-1.5"
            title="Open Formula & Algorithm Studio"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Formulas</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
