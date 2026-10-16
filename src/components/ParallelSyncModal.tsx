'use client';

import React, { useState, useEffect } from 'react';
import { TeamRecord } from '@/types';
import {
  X,
  Zap,
  Code2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';
import { runParallelDeepScan, ParallelProgress, ParallelSyncResult } from '@/engine/parallelSync';
import { decryptTokenString } from '@/utils/cryptoUtils';

interface StoredTokenItem {
  id: string;
  label: string;
  encrypted: string;
  masked: string;
  isActive: boolean;
}

const TOKENS_STORAGE_KEY = 'incursion_enc_tokens_list_v1';

interface ParallelSyncModalProps {
  teams: TeamRecord[];
  onApplyEnrichedTeams: (updatedTeams: TeamRecord[]) => void;
  onClose: () => void;
}

export const ParallelSyncModal: React.FC<ParallelSyncModalProps> = ({
  teams,
  onApplyEnrichedTeams,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [activeToken, setActiveToken] = useState<string | undefined>();
  const [progress, setProgress] = useState<ParallelProgress>({
    github: { current: 0, total: 0, completed: false },
    resumes: { current: 0, total: 0, completed: false },
    isFinished: false,
  });
  const [result, setResult] = useState<ParallelSyncResult | null>(null);

  // Load active GitHub token from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
      if (stored) {
        const list: StoredTokenItem[] = JSON.parse(stored);
        const active = list.find((t) => t.isActive);
        if (active) {
          const raw = decryptTokenString(active.encrypted);
          if (raw) setActiveToken(raw);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Compute stats on mount
  const detectedGithubCount = new Set(
    teams.flatMap((t) =>
      t.members
        .map((m) => m.rawSignals.githubUsername)
        .filter((u): u is string => Boolean(u))
    )
  ).size;

  const detectedResumeCount = teams.reduce((acc, t) => {
    return (
      acc +
      t.members.filter((m) => {
        const u = m.resumeUrl?.trim();
        return u && (u.startsWith('http://') || u.startsWith('https://'));
      }).length
    );
  }, 0);

  const handleStartParallelScan = async () => {
    setIsRunning(true);
    setIsFinished(false);
    setResult(null);

    try {
      const res = await runParallelDeepScan(teams, {
        githubToken: activeToken,
        onProgress: (p) => {
          setProgress(p);
        },
      });

      setResult(res);
      setIsFinished(true);
    } catch (err) {
      console.error('Parallel deep scan error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyEnrichedTeams(result.updatedTeams);
      onClose();
    }
  };

  const ghPercent = progress.github.total
    ? Math.min(100, Math.round((progress.github.current / progress.github.total) * 100))
    : progress.github.completed
    ? 100
    : 0;

  const resPercent = progress.resumes.total
    ? Math.min(100, Math.round((progress.resumes.current / progress.resumes.total) * 100))
    : progress.resumes.completed
    ? 100
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-mono">
      <div className="bg-zinc-950 rounded-2xl max-w-3xl w-full shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-cyan-900/80 overflow-hidden max-h-[92vh] flex flex-col my-auto text-xs text-zinc-300">
        
        {/* Header */}
        <div className="px-5 py-4 bg-black/80 border-b border-cyan-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-cyan-400 tracking-tight uppercase flex items-center gap-2">
                <span>Parallel Deep Cohort Scanner</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 text-[10px]">
                  Dual-Stream Concurrent
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-sans">
                Evaluates live GitHub metrics & cloud resumes simultaneously without blocking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Telemetry Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/60 border border-zinc-800 p-3 rounded-xl">
              <span className="text-zinc-500 block text-[9px] uppercase">COHORT TEAMS</span>
              <span className="text-zinc-100 font-bold text-sm">{teams.length}</span>
            </div>
            <div className="bg-black/60 border border-cyan-900/50 p-3 rounded-xl">
              <span className="text-cyan-400/80 block text-[9px] uppercase">GITHUB PROFILES</span>
              <span className="text-cyan-300 font-bold text-sm">{detectedGithubCount} Handles</span>
            </div>
            <div className="bg-black/60 border border-blue-900/50 p-3 rounded-xl">
              <span className="text-blue-400/80 block text-[9px] uppercase">CLOUD RESUMES</span>
              <span className="text-blue-300 font-bold text-sm">{detectedResumeCount} Documents</span>
            </div>
            <div className="bg-black/60 border border-zinc-800 p-3 rounded-xl">
              <span className="text-zinc-500 block text-[9px] uppercase">CONCURRENCY</span>
              <span className="text-emerald-400 font-bold text-sm">2 Streams || $0 Cost</span>
            </div>
          </div>

          {/* Dual Parallel Channel Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Channel: GitHub Inspection */}
            <div className="bg-black/50 border border-cyan-950/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-zinc-100 uppercase text-xs">Stream A: GitHub Velocity</span>
                </div>
                {progress.github.completed ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                ) : isRunning ? (
                  <span className="text-[10px] text-cyan-400 animate-pulse flex items-center gap-1">
                    <RotateCw className="w-3 h-3 animate-spin" /> Scanning...
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500">Idle</span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Audited Profiles</span>
                  <span className="font-bold text-zinc-200">
                    {progress.github.current} / {progress.github.total || detectedGithubCount} ({ghPercent}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-200"
                    style={{ width: `${ghPercent}%` }}
                  />
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 truncate">
                {progress.github.activeUser ? (
                  <span className="text-cyan-300">Auditing: @{progress.github.activeUser}</span>
                ) : (
                  <span>Inspects commit frequency, stars & anti-cheat forks</span>
                )}
              </div>
            </div>

            {/* Right Channel: Resume Intelligence */}
            <div className="bg-black/50 border border-blue-950/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-zinc-100 uppercase text-xs">Stream B: Resume Parser</span>
                </div>
                {progress.resumes.completed ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                ) : isRunning ? (
                  <span className="text-[10px] text-blue-400 animate-pulse flex items-center gap-1">
                    <RotateCw className="w-3 h-3 animate-spin" /> Extracting...
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500">Idle</span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Parsed Resumes</span>
                  <span className="font-bold text-zinc-200">
                    {progress.resumes.current} / {progress.resumes.total || detectedResumeCount} ({resPercent}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="bg-blue-500 h-full transition-all duration-200"
                    style={{ width: `${resPercent}%` }}
                  />
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 truncate">
                {progress.resumes.activeCandidate ? (
                  <span className="text-blue-300">Parsing: {progress.resumes.activeCandidate}</span>
                ) : (
                  <span>Extracts tech skills, hackathon wins & links via unpdf</span>
                )}
              </div>
            </div>

          </div>

          {/* Results Summary Box (when scan completes) */}
          {result && isFinished && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Parallel Deep Scan Finished Successfully!</span>
                </div>
                <span className="text-[10px] text-zinc-400">Zero database footprint</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-black/50 p-2 rounded-lg border border-emerald-900/40">
                  <span className="text-zinc-500 block text-[9px]">GITHUB AUDITED</span>
                  <span className="text-emerald-300 font-bold">{result.stats.githubAudited} Accounts</span>
                </div>
                <div className="bg-black/50 p-2 rounded-lg border border-emerald-900/40">
                  <span className="text-zinc-500 block text-[9px]">RESUMES EXTRACTED</span>
                  <span className="text-emerald-300 font-bold">{result.stats.resumesParsed} PDFs</span>
                </div>
                <div className="bg-black/50 p-2 rounded-lg border border-emerald-900/40">
                  <span className="text-zinc-500 block text-[9px]">SKILLS DISCOVERED</span>
                  <span className="text-cyan-300 font-bold">+{result.stats.skillsDiscovered} Skills</span>
                </div>
                <div className="bg-black/50 p-2 rounded-lg border border-emerald-900/40">
                  <span className="text-zinc-500 block text-[9px]">PRIVATE LINKS</span>
                  <span className={`font-bold ${result.stats.resumesPrivate > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                    {result.stats.resumesPrivate}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Instructions note */}
          <div className="text-[11px] text-zinc-400 space-y-1 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
            <span className="font-bold text-zinc-300 block">⚡ How Parallel Scoring Operates:</span>
            <p>
              Both pipelines execute simultaneously in parallel without blocking each other. The GitHub Stream audits repositories, fork-to-original ratios, and commits. The Resume Stream connects to Google Drive and Dropbox streams via <code className="text-cyan-300">unpdf</code> to extract technical skills and competition accolades. Both datasets are automatically merged to calculate updated scores.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-black/80 border-t border-cyan-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[10px] text-zinc-500">
            {activeToken ? (
              <span className="text-cyan-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Using Authenticated GitHub Token
              </span>
            ) : (
              <span className="text-zinc-500">Using Unauthenticated Rate Limit (60 req/hr)</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isRunning}
              className="flex-1 sm:flex-none px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              Close
            </button>

            {!isFinished ? (
              <button
                type="button"
                onClick={handleStartParallelScan}
                disabled={isRunning}
                className="flex-1 sm:flex-none px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Dual Streams...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Start Parallel Deep Scan</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 sm:flex-none px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply & Re-Rank Leaderboard</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
