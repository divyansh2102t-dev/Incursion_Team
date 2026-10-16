'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { FormulaCoefficients } from '@/types';
import {
  ArrowLeft,
  RotateCcw,
  Undo2,
  Sliders,
  Code2,
  FileText,
  ShieldAlert,
  Layers,
  Sparkles,
  Download,
  Upload,
  Check,
  Zap,
} from 'lucide-react';
import { triggerDownload } from '@/utils/exportUtils';

export default function FormulasPage() {
  const {
    config,
    updateConfig,
    previousConfig,
    revertToPreviousConfig,
    resetToDefaultFormulas,
  } = useApp();

  const [notification, setNotification] = useState<string | null>(null);

  const coef = config.formulaCoefficients;

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateCoef = (key: keyof FormulaCoefficients, value: number) => {
    updateConfig({
      ...config,
      formulaCoefficients: {
        ...config.formulaCoefficients,
        [key]: value,
      },
    });
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all formula coefficients to default?')) {
      resetToDefaultFormulas();
      showNotice('All formula parameters reset to factory defaults.');
    }
  };

  const handleRevert = () => {
    const success = revertToPreviousConfig();
    if (success) {
      showNotice('Reverted to previous configuration.');
    } else {
      showNotice('No previous configuration found.');
    }
  };

  const handleExportFormulas = () => {
    const json = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        presetName: config.presetName,
        formulaCoefficients: config.formulaCoefficients,
        weights: config.weights,
        filters: config.filters,
        aggregationStrategy: config.aggregationStrategy,
      },
      null,
      2
    );
    triggerDownload('hackathon_scoring_formula_config.json', json, 'application/json');
    showNotice('Formulas JSON configuration downloaded.');
  };

  const handleImportFormulas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.formulaCoefficients) {
          updateConfig({
            ...config,
            formulaCoefficients: {
              ...config.formulaCoefficients,
              ...parsed.formulaCoefficients,
            },
          });
          showNotice('Formulas successfully imported and applied!');
        } else {
          alert('Invalid formula configuration file.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col font-sans text-zinc-100 bg-cyber-grid selection:bg-cyan-500 selection:text-black">
      {/* Top Cyber Header */}
      <header className="bg-black/80 backdrop-blur-xl border-b border-cyan-950/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 hover:border-cyan-500/50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Back to Shortlist</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-cyan-400 tracking-tight uppercase neon-glow-cyan">
                  Formula & Algorithm Studio
                </h1>
                <span className="text-[9px] font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                  TUNABLE MATH
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Customize exact mathematical coefficients and normalizers
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Revert to previous */}
            <button
              onClick={handleRevert}
              disabled={!previousConfig}
              className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                previousConfig
                  ? 'bg-zinc-900/80 text-zinc-200 border-zinc-700 hover:border-cyan-400'
                  : 'bg-zinc-950 text-zinc-600 border-zinc-900 cursor-not-allowed opacity-50'
              }`}
              title="Undo last change and restore previous config"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Revert Config</span>
            </button>

            {/* Reset to defaults */}
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-medium rounded-lg border border-rose-800/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset Defaults</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportFormulas}
              className="px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Download Formulas JSON Configuration"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            {/* Import JSON */}
            <label className="px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFormulas}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 bg-black/90 border border-cyan-500 text-cyan-300 text-xs px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 font-mono">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Navigation Tabs between Pages */}
        <div className="flex items-center gap-3 border-b border-cyan-950/60 pb-3 text-xs font-mono">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg font-bold text-zinc-400 hover:text-cyan-300 hover:bg-zinc-900 transition-colors"
          >
            📊 CANDIDATE LEADERBOARD
          </Link>
          <span className="px-4 py-2 rounded-lg font-bold bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            ⚙️ ALGORITHMIC FORMULA STUDIO
          </span>
        </div>

        {/* Introduction Banner */}
        <div className="bg-black/50 border border-cyan-900/60 rounded-2xl p-4 sm:p-5 text-xs text-zinc-300 font-mono space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-sm flex items-center gap-2 text-cyan-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="uppercase">Unopinionated Scoring: You Control Every Formula & Coefficient</span>
          </div>
          <p className="text-zinc-400 leading-relaxed text-[11px] font-sans">
            No two hackathons are alike. Rather than forcing hardcoded numbers, every coefficient below is
            completely tunable in real-time. Adjust the sliders, and the formulas update immediately on your shortlist.
          </p>
        </div>

        {/* Formulas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Resume & Project Experience Formula */}
          <div className="bg-zinc-950/85 border border-cyan-950/80 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-5 space-y-5 font-mono text-zinc-300 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-cyan-950/60">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Resume & Experience Scoring Formula
                </h2>
                <p className="text-[10px] text-zinc-500">
                  Calculates applicant experience from hackathon wins, skills, and portfolio verifiability
                </p>
              </div>
            </div>

            {/* Live Formula Display Box */}
            <div className="bg-black/60 border border-indigo-900/40 rounded-xl p-3.5 font-mono text-[11px] space-y-1">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Live Mathematical Formula</div>
              <div className="font-semibold text-indigo-300">
                Score = min({coef.hackathonMaxPoints}, Wins × {coef.hackathonPointsPerWin}) + min({coef.skillMaxPoints}, Skills × {coef.skillPointsPerMatch}) + {coef.verifiableLinksBonusPoints} [if portfolio provided]
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 text-xs">
              {/* Points per Hackathon Win */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Points per Hackathon Win / Placement:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={coef.hackathonPointsPerWin}
                      onChange={(e) => updateCoef('hackathonPointsPerWin', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-indigo-400 text-indigo-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact points to auto-set the slider"
                    />
                    <span className="font-bold text-indigo-400 text-[11px]">pts</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={coef.hackathonPointsPerWin}
                  onChange={(e) => updateCoef('hackathonPointsPerWin', parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>

              {/* Hackathon Points Cap */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Maximum Hackathon Points Cap:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="150"
                      value={coef.hackathonMaxPoints}
                      onChange={(e) => updateCoef('hackathonMaxPoints', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-indigo-400 text-indigo-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact points to auto-set the slider"
                    />
                    <span className="font-bold text-indigo-400 text-[11px]">pts</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={coef.hackathonMaxPoints}
                  onChange={(e) => updateCoef('hackathonMaxPoints', parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>

              {/* Points per Technical Skill */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Points per Identified Technical Skill:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="25"
                      value={coef.skillPointsPerMatch}
                      onChange={(e) => updateCoef('skillPointsPerMatch', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-indigo-400 text-indigo-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact points to auto-set the slider"
                    />
                    <span className="font-bold text-indigo-400 text-[11px]">pts</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={coef.skillPointsPerMatch}
                  onChange={(e) => updateCoef('skillPointsPerMatch', parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>

              {/* Skill Points Cap */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Maximum Technical Skills Cap:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={coef.skillMaxPoints}
                      onChange={(e) => updateCoef('skillMaxPoints', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-indigo-400 text-indigo-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact points to auto-set the slider"
                    />
                    <span className="font-bold text-indigo-400 text-[11px]">pts</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={coef.skillMaxPoints}
                  onChange={(e) => updateCoef('skillMaxPoints', parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>

              {/* Verifiable Link Bonus */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Verifiable Portfolio / Live Project Bonus:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={coef.verifiableLinksBonusPoints}
                      onChange={(e) => updateCoef('verifiableLinksBonusPoints', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-indigo-400 text-indigo-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact points to auto-set the slider"
                    />
                    <span className="font-bold text-indigo-400 text-[11px]">pts</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={coef.verifiableLinksBonusPoints}
                  onChange={(e) => updateCoef('verifiableLinksBonusPoints', parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 2: GitHub Code Depth Formula */}
          <div className="bg-zinc-950/85 border border-cyan-950/80 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-5 space-y-5 font-mono text-zinc-300 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-cyan-950/60">
              <Code2 className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  GitHub & Technical Depth Formula
                </h2>
                <p className="text-[10px] text-zinc-500">
                  Normalizes commit volume, original repository stars, and language diversity
                </p>
              </div>
            </div>

            {/* Live Formula Display Box */}
            <div className="bg-black/60 border border-cyan-900/40 rounded-xl p-3.5 font-mono text-[11px] space-y-1">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Live Mathematical Formula</div>
              <div className="font-semibold text-cyan-300">
                Score = min({coef.githubContribMaxPoints}, (Commits / {coef.githubContribDivisor}) × {coef.githubContribMaxPoints}) + min({coef.githubStarsMaxPoints}, (Stars / {coef.githubStarsDivisor}) × {coef.githubStarsMaxPoints}) + min({coef.githubSkillBreadthMaxPoints}, (Langs / {coef.githubSkillDivisor}) × {coef.githubSkillBreadthMaxPoints})
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 text-xs">
              {/* Contrib Max Points */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Commit Contribution Max Points:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="150"
                      value={coef.githubContribMaxPoints}
                      onChange={(e) => updateCoef('githubContribMaxPoints', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact points to auto-set the slider"
                    />
                    <span className="font-bold text-cyan-400 text-[11px]">pts</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  step="5"
                  value={coef.githubContribMaxPoints}
                  onChange={(e) => updateCoef('githubContribMaxPoints', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Contrib Target Divisor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Annual Commit Target (Benchmark Divisor):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="10"
                      max="2000"
                      step="10"
                      value={coef.githubContribDivisor}
                      onChange={(e) => updateCoef('githubContribDivisor', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact commits benchmark to auto-set the slider"
                    />
                    <span className="font-bold text-cyan-400 text-[11px]">commits</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="25"
                  value={coef.githubContribDivisor}
                  onChange={(e) => updateCoef('githubContribDivisor', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Stars Max Points */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Repository Stars Max Points:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={coef.githubStarsMaxPoints}
                      onChange={(e) => updateCoef('githubStarsMaxPoints', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact points to auto-set the slider"
                    />
                    <span className="font-bold text-cyan-400 text-[11px]">pts</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  step="5"
                  value={coef.githubStarsMaxPoints}
                  onChange={(e) => updateCoef('githubStarsMaxPoints', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Stars Divisor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Star Benchmark Target (Benchmark Divisor):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={coef.githubStarsDivisor}
                      onChange={(e) => updateCoef('githubStarsDivisor', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact stars benchmark to auto-set the slider"
                    />
                    <span className="font-bold text-cyan-400 text-[11px]">stars</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={coef.githubStarsDivisor}
                  onChange={(e) => updateCoef('githubStarsDivisor', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Language Breadth Max Points */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Language Diversity Max Points:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={coef.githubSkillBreadthMaxPoints}
                      onChange={(e) => updateCoef('githubSkillBreadthMaxPoints', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact points to auto-set the slider"
                    />
                    <span className="font-bold text-cyan-400 text-[11px]">pts</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={coef.githubSkillBreadthMaxPoints}
                  onChange={(e) => updateCoef('githubSkillBreadthMaxPoints', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Language Benchmark Divisor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Language Count Benchmark (Divisor):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={coef.githubSkillDivisor}
                      onChange={(e) => updateCoef('githubSkillDivisor', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type exact language benchmark to auto-set the slider"
                    />
                    <span className="font-bold text-cyan-400 text-[11px]">langs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={coef.githubSkillDivisor}
                  onChange={(e) => updateCoef('githubSkillDivisor', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Anti-Cheat & Suspicious Profile Penalty */}
          <div className="bg-zinc-950/85 border border-cyan-950/80 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-5 space-y-5 font-mono text-zinc-300 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-cyan-950/60">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Anti-Cheat & Fork-Padding Penalty
                </h2>
                <p className="text-[10px] text-zinc-500">
                  Score multiplier applied to profiles detected with 100% forked repos or padded accounts
                </p>
              </div>
            </div>

            {/* Live Formula Display Box */}
            <div className="bg-black/60 border border-amber-900/40 rounded-xl p-3.5 font-mono text-[11px] space-y-1">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Penalty Formula</div>
              <div className="font-semibold text-amber-300">
                Score_Adjusted = Score_Raw × {coef.suspiciousAccountDiscount.toFixed(2)} ({Math.round((1 - coef.suspiciousAccountDiscount) * 100)}% deduction)
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Retained Score Multiplier:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="10"
                      max="100"
                      step="5"
                      value={Math.round(coef.suspiciousAccountDiscount * 100)}
                      onChange={(e) =>
                        updateCoef(
                          'suspiciousAccountDiscount',
                          Math.min(1, Math.max(0.1, (parseInt(e.target.value) || 10) / 100))
                        )
                      }
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-amber-400 text-amber-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type retained score percentage to auto-set the slider"
                    />
                    <span className="font-bold text-amber-400 text-[11px]">%</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      (-{Math.round((1 - coef.suspiciousAccountDiscount) * 100)}% deduction)
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.95"
                  step="0.05"
                  value={coef.suspiciousAccountDiscount}
                  onChange={(e) => updateCoef('suspiciousAccountDiscount', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                Applies when an applicant has high repository counts but 100% of them are forks with 0 original commits.
              </p>
            </div>
          </div>

          {/* Card 4: Team-Size Normalization Model Curves */}
          <div className="bg-zinc-950/85 border border-cyan-950/80 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-5 space-y-5 font-mono text-zinc-300 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-cyan-950/60">
              <Layers className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Team-Size Normalization Curves
                </h2>
                <p className="text-[10px] text-zinc-500">
                  Mathematical parameters governing solo hackers vs multi-member group synergy
                </p>
              </div>
            </div>

            {/* Live Formula Display Box */}
            <div className="bg-black/60 border border-emerald-900/40 rounded-xl p-3.5 font-mono text-[11px] space-y-1">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Normalization Equations</div>
              <div className="text-emerald-300 font-semibold space-y-0.5">
                <div>Diminishing: Sum(Rank_i / {coef.diminishingReturnsBase.toFixed(1)}^(i-1))</div>
                <div>Balanced Mean: Avg × min({coef.balancedMeanMaxCap.toFixed(2)}, 1 + (N - 1) × {coef.balancedMeanBonusPerMember})</div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Diminishing Returns Base */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Diminishing Returns Exponential Base:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1.0"
                      max="4.0"
                      step="0.1"
                      value={coef.diminishingReturnsBase}
                      onChange={(e) =>
                        updateCoef(
                          'diminishingReturnsBase',
                          Math.max(1.0, parseFloat(e.target.value) || 1.0)
                        )
                      }
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-emerald-400 text-emerald-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type base factor to auto-set the slider"
                    />
                    <span className="font-bold text-emerald-400 text-[11px]">x</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={coef.diminishingReturnsBase}
                  onChange={(e) => updateCoef('diminishingReturnsBase', parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 font-sans block">
                  Lead hacker counts 100%, 2nd member counts {(100 / coef.diminishingReturnsBase).toFixed(0)}%, 3rd member counts {(100 / Math.pow(coef.diminishingReturnsBase, 2)).toFixed(0)}%.
                </span>
              </div>

              {/* Balanced Mean Synergy Bonus */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Balanced Mean Synergy Boost / Member:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      step="1"
                      value={Math.round(coef.balancedMeanBonusPerMember * 100)}
                      onChange={(e) =>
                        updateCoef(
                          'balancedMeanBonusPerMember',
                          Math.max(0.01, (parseInt(e.target.value) || 1) / 100)
                        )
                      }
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-emerald-400 text-emerald-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type bonus % to auto-set the slider"
                    />
                    <span className="font-bold text-emerald-400 text-[11px]">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.15"
                  step="0.01"
                  value={coef.balancedMeanBonusPerMember}
                  onChange={(e) => updateCoef('balancedMeanBonusPerMember', parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Balanced Mean Max Cap */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Maximum Total Synergy Multiplier Cap:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={coef.balancedMeanMaxCap}
                      onChange={(e) =>
                        updateCoef(
                          'balancedMeanMaxCap',
                          Math.max(1.0, parseFloat(e.target.value) || 1.0)
                        )
                      }
                      className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-emerald-400 text-emerald-400 font-bold text-center rounded font-mono text-xs outline-none"
                      title="Type multiplier cap to auto-set the slider"
                    />
                    <span className="font-bold text-emerald-400 text-[11px]">x</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1.10"
                  max="1.80"
                  step="0.05"
                  value={coef.balancedMeanMaxCap}
                  onChange={(e) => updateCoef('balancedMeanMaxCap', parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
