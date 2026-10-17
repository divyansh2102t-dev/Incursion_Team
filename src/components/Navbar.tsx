'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  Download,
  Activity,
  ArrowRightLeft,
  FileSpreadsheet,
  FileCode,
  Code2,
  Sliders,
  Terminal,
  Zap,
  History,
  LayoutDashboard,
  FileText,
  BookmarkPlus,
} from 'lucide-react';
import { SelectionConfig } from '@/types';
import { useApp } from '@/context/AppContext';

interface NavbarProps {
  config: SelectionConfig;
  onUpdateConfig: (updated: SelectionConfig) => void;
  onFileUpload: (file: File) => void;
  onOpenSensitivity: () => void;
  onOpenCompare: () => void;
  onOpenGitHubSync: () => void;
  onOpenResumeSync?: () => void;
  onOpenParallelSync?: () => void;
  onOpenHistory: () => void;
  onSaveRun?: () => void;
  onOpenFilters?: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  hasData: boolean;
  onGoHome?: () => void;
  onGoDashboard?: () => void;
  currentView?: 'home' | 'dashboard';
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onUpdateConfig,
  onFileUpload,
  onOpenSensitivity,
  onOpenCompare,
  onOpenGitHubSync,
  onOpenResumeSync,
  onOpenParallelSync,
  onOpenHistory,
  onSaveRun,
  onOpenFilters,
  onExportCSV,
  onExportJSON,
  hasData,
  onGoHome,
  onGoDashboard,
  currentView = 'dashboard',
}) => {
  const { scoringHistory } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <header className="bg-black/80 backdrop-blur-xl border-b border-cyan-950/60 sticky top-0 z-40">
      <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand Pill Container (Clicking opens Home page) */}
        <div className="flex items-center gap-3">
          {onGoHome ? (
            <button
              onClick={onGoHome}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-950/80 border border-cyan-500/30 hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.15)] group cursor-pointer text-left"
              title="Open Incursion Home & Upload Terminal"
            >
              {/* Official Incursion Cyber Emblem */}
              <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
                <img
                  src="/icon.svg"
                  alt="Incursion Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wider text-zinc-100 group-hover:text-cyan-300 uppercase transition-colors">
                    INCURSION
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800/60">
                    TRACK 3
                  </span>
                </div>
                <p className="text-[9px] font-mono text-zinc-400 tracking-tight">
                  AUTONOMOUS RECRUITMENT ENGINE
                </p>
              </div>
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-950/80 border border-cyan-500/30 hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.15)] group"
              title="Open Incursion Home & Upload Terminal"
            >
              <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
                <img
                  src="/icon.svg"
                  alt="Incursion Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wider text-zinc-100 group-hover:text-cyan-300 uppercase transition-colors">
                    INCURSION
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800/60">
                    TRACK 3
                  </span>
                </div>
                <p className="text-[9px] font-mono text-zinc-400 tracking-tight">
                  AUTONOMOUS RECRUITMENT ENGINE
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Center / Right Telemetry & Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.tsv,.json"
            className="hidden"
          />

          {/* Leaderboard Button (shown when data is active) */}
          {hasData && onGoDashboard && (
            <button
              onClick={onGoDashboard}
              className={`px-3 py-1.5 font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-cyan-500/50'
              }`}
              title="Open Shortlist Leaderboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={onGoHome ? onGoHome : () => fileInputRef.current?.click()}
            className={`px-3 py-1.5 font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentView === 'home'
                ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-cyan-500/50'
            }`}
            title="Open Incursion Home Upload Terminal"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          {/* Formula Studio Link */}
          <Link
            href="/formulas"
            className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 font-bold rounded-lg border border-cyan-500/30 hover:border-cyan-400 transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            title="Open Formula & Algorithm Studio"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Formulas</span>
          </Link>

          {/* Scoring History Button */}
          <button
            onClick={onOpenHistory}
            className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-cyan-500/50 transition-colors flex items-center gap-1.5 cursor-pointer relative"
            title="Open Scoring Run History & Audit Vault"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>History</span>
            {scoringHistory.length > 0 && (
              <span className="text-[9px] font-bold bg-cyan-500 text-black px-1.5 py-0.2 rounded-full font-mono ml-0.5">
                {scoringHistory.length}
              </span>
            )}
          </button>

          {/* Quick Save Scoring Run Button in Navbar */}
          {hasData && onSaveRun && (
            <button
              onClick={onSaveRun}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              title="Save & snapshot the current scoring run into audit vault"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save Run</span>
            </button>
          )}

          {/* Scoring Model & Filters Drawer Trigger */}
          {hasData && onOpenFilters && currentView === 'dashboard' && (
            <button
              onClick={onOpenFilters}
              className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-bold rounded-lg border border-cyan-500/30 hover:border-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              title="Open Scoring Model, Weights & Filters Drawer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filters</span>
            </button>
          )}

          {hasData && (
            <>
              {/* GitHub PAT & Sync */}
              <button
                onClick={onOpenGitHubSync}
                className="px-2.5 py-1.5 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 font-medium rounded-lg border border-blue-500/30 hover:border-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Manage GitHub Tokens, Rate Limits & Live Enrichment"
              >
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">GitHub PAT</span>
              </button>

              {/* Resume Intelligence & Sync */}
              {onOpenResumeSync && (
                <button
                  onClick={onOpenResumeSync}
                  className="px-2.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 font-medium rounded-lg border border-cyan-500/30 hover:border-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Scan & Parse Candidate Google Drive & PDF Resumes"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Resume Sync</span>
                </button>
              )}

              {/* Parallel Deep Scan (GitHub + Resumes concurrently) */}
              {onOpenParallelSync && (
                <button
                  onClick={onOpenParallelSync}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-blue-950/60 to-cyan-950/60 hover:from-blue-900/80 hover:to-cyan-900/80 text-cyan-200 font-bold rounded-lg border border-cyan-400/50 hover:border-cyan-300 transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
                  title="Run Live GitHub Velocity & Cloud Resume Parsing Concurrently in Parallel"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="hidden sm:inline">Parallel Sync</span>
                </button>
              )}

              {/* Compare */}
              <button
                onClick={onOpenCompare}
                className="px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Pairwise Head-to-Head Comparison"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden md:inline">Compare</span>
              </button>

              {/* Sensitivity */}
              <button
                onClick={onOpenSensitivity}
                className="px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Sensitivity & Shortlist Robustness"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Sensitivity</span>
              </button>

              {/* Export Buttons */}
              <div className="flex items-center border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/80">
                <button
                  onClick={onExportCSV}
                  className="px-2.5 py-1.5 hover:bg-zinc-800 text-zinc-300 font-medium flex items-center gap-1 border-r border-zinc-800 transition-colors cursor-pointer"
                  title="Export Ranked Shortlist as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={onExportJSON}
                  className="px-2.5 py-1.5 hover:bg-zinc-800 text-zinc-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Export Audit Bundle with Exact Config & Teams as JSON"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>JSON</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
