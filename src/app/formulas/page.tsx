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
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Candidate Shortlist</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Formula & Algorithm Studio
                </h1>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  Tunable Math
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Customize the exact mathematical coefficients, multipliers, and curves that govern ranking
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Revert to previous */}
            <button
              onClick={handleRevert}
              disabled={!previousConfig}
              className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                previousConfig
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
              title="Undo last change and restore previous config"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Revert to Previous</span>
            </button>

            {/* Reset to defaults */}
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset to Defaults</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportFormulas}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-300 transition-colors flex items-center gap-1"
              title="Download Formulas JSON Configuration"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            {/* Import JSON */}
            <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
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
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Navigation Tabs between Pages */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            📊 Candidate Shortlist & Review
          </Link>
          <span className="px-4 py-2 rounded-lg font-bold bg-blue-600 text-white shadow-2xs">
            ⚙️ Algorithmic Formula Studio
          </span>
        </div>

        {/* Introduction Banner */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 text-xs text-blue-900 space-y-1">
          <div className="font-bold text-sm flex items-center gap-2 text-blue-950">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Unopinionated Scoring: You Control Every Formula & Coefficient</span>
          </div>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            No two hackathons are alike. Rather than forcing hardcoded numbers, every coefficient below is
            completely tunable in real-time. Adjust the sliders, and the formulas update immediately on your shortlist.
          </p>
        </div>

        {/* Formulas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Resume & Project Experience Formula */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Resume & Experience Scoring Formula
                </h2>
                <p className="text-[11px] text-slate-500">
                  Calculates applicant experience from hackathon wins, skills, and portfolio verifiability
                </p>
              </div>
            </div>

            {/* Live Formula Display Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[11px] text-slate-700 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Live Mathematical Formula</div>
              <div className="font-semibold text-indigo-900">
                Score = min({coef.hackathonMaxPoints}, Wins × {coef.hackathonPointsPerWin}) + min({coef.skillMaxPoints}, Skills × {coef.skillPointsPerMatch}) + {coef.verifiableLinksBonusPoints} [if portfolio provided]
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 text-xs">
              {/* Points per Hackathon Win */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Points per Hackathon Win / Placement:</span>
                  <span className="font-bold text-indigo-600">{coef.hackathonPointsPerWin} pts</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={coef.hackathonPointsPerWin}
                  onChange={(e) => updateCoef('hackathonPointsPerWin', parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Hackathon Points Cap */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Maximum Hackathon Points Cap:</span>
                  <span className="font-bold text-indigo-600">{coef.hackathonMaxPoints} pts</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={coef.hackathonMaxPoints}
                  onChange={(e) => updateCoef('hackathonMaxPoints', parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Points per Technical Skill */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Points per Identified Technical Skill:</span>
                  <span className="font-bold text-indigo-600">{coef.skillPointsPerMatch} pts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={coef.skillPointsPerMatch}
                  onChange={(e) => updateCoef('skillPointsPerMatch', parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Skill Points Cap */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Maximum Technical Skills Cap:</span>
                  <span className="font-bold text-indigo-600">{coef.skillMaxPoints} pts</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={coef.skillMaxPoints}
                  onChange={(e) => updateCoef('skillMaxPoints', parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Verifiable Link Bonus */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Verifiable Portfolio / Live Project Bonus:</span>
                  <span className="font-bold text-indigo-600">+{coef.verifiableLinksBonusPoints} pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={coef.verifiableLinksBonusPoints}
                  onChange={(e) => updateCoef('verifiableLinksBonusPoints', parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 2: GitHub Code Depth Formula */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Code2 className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  GitHub & Technical Depth Formula
                </h2>
                <p className="text-[11px] text-slate-500">
                  Normalizes commit volume, original repository stars, and language diversity
                </p>
              </div>
            </div>

            {/* Live Formula Display Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[11px] text-slate-700 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Live Mathematical Formula</div>
              <div className="font-semibold text-blue-900">
                Score = min({coef.githubContribMaxPoints}, (Commits / {coef.githubContribDivisor}) × {coef.githubContribMaxPoints}) + min({coef.githubStarsMaxPoints}, (Stars / {coef.githubStarsDivisor}) × {coef.githubStarsMaxPoints}) + min({coef.githubSkillBreadthMaxPoints}, (Langs / {coef.githubSkillDivisor}) × {coef.githubSkillBreadthMaxPoints})
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 text-xs">
              {/* Contrib Max Points */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Commit Contribution Max Points:</span>
                  <span className="font-bold text-blue-600">{coef.githubContribMaxPoints} pts</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  step="5"
                  value={coef.githubContribMaxPoints}
                  onChange={(e) => updateCoef('githubContribMaxPoints', parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Contrib Target Divisor */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Annual Commit Target (Benchmark Divisor):</span>
                  <span className="font-bold text-blue-600">{coef.githubContribDivisor} commits</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="25"
                  value={coef.githubContribDivisor}
                  onChange={(e) => updateCoef('githubContribDivisor', parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Stars Max Points */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Repository Stars Max Points:</span>
                  <span className="font-bold text-blue-600">{coef.githubStarsMaxPoints} pts</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  step="5"
                  value={coef.githubStarsMaxPoints}
                  onChange={(e) => updateCoef('githubStarsMaxPoints', parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Stars Divisor */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Star Benchmark Target (Benchmark Divisor):</span>
                  <span className="font-bold text-blue-600">{coef.githubStarsDivisor} stars</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={coef.githubStarsDivisor}
                  onChange={(e) => updateCoef('githubStarsDivisor', parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Anti-Cheat & Suspicious Profile Penalty */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Anti-Cheat & Fork-Padding Penalty
                </h2>
                <p className="text-[11px] text-slate-500">
                  Score multiplier applied to profiles detected with 100% forked repos or padded accounts
                </p>
              </div>
            </div>

            {/* Live Formula Display Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[11px] text-slate-700 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Penalty Formula</div>
              <div className="font-semibold text-amber-900">
                Score_Adjusted = Score_Raw × {coef.suspiciousAccountDiscount.toFixed(2)} ({Math.round((1 - coef.suspiciousAccountDiscount) * 100)}% deduction)
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Retained Score Multiplier (Lower = Stricter Penalty):</span>
                  <span className="font-bold text-amber-600">
                    {Math.round(coef.suspiciousAccountDiscount * 100)}% (Deduction: -{Math.round((1 - coef.suspiciousAccountDiscount) * 100)}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.95"
                  step="0.05"
                  value={coef.suspiciousAccountDiscount}
                  onChange={(e) => updateCoef('suspiciousAccountDiscount', parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Applies when an applicant has high repository counts but 100% of them are forks with 0 original commits.
              </p>
            </div>
          </div>

          {/* Card 4: Team-Size Normalization Model Curves */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Team-Size Normalization Curves
                </h2>
                <p className="text-[11px] text-slate-500">
                  Mathematical parameters governing solo hackers vs multi-member group synergy
                </p>
              </div>
            </div>

            {/* Live Formula Display Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[11px] text-slate-700 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Normalization Equations</div>
              <div className="text-emerald-900 font-semibold space-y-0.5">
                <div>Diminishing: Sum(Rank_i / {coef.diminishingReturnsBase.toFixed(1)}^(i-1))</div>
                <div>Balanced Mean: Avg × min({coef.balancedMeanMaxCap.toFixed(2)}, 1 + (N - 1) × {coef.balancedMeanBonusPerMember})</div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Diminishing Returns Base */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Diminishing Returns Exponential Base:</span>
                  <span className="font-bold text-emerald-600">{coef.diminishingReturnsBase.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={coef.diminishingReturnsBase}
                  onChange={(e) => updateCoef('diminishingReturnsBase', parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">
                  Lead hacker counts 100%, 2nd member counts {(100 / coef.diminishingReturnsBase).toFixed(0)}%, 3rd member counts {(100 / Math.pow(coef.diminishingReturnsBase, 2)).toFixed(0)}%.
                </span>
              </div>

              {/* Balanced Mean Synergy Bonus */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Balanced Mean Synergy Boost per Additional Member:</span>
                  <span className="font-bold text-emerald-600">+{Math.round(coef.balancedMeanBonusPerMember * 100)}% / member</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.15"
                  step="0.01"
                  value={coef.balancedMeanBonusPerMember}
                  onChange={(e) => updateCoef('balancedMeanBonusPerMember', parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Balanced Mean Max Cap */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Maximum Total Synergy Multiplier Cap:</span>
                  <span className="font-bold text-emerald-600">{coef.balancedMeanMaxCap.toFixed(2)}x (+{Math.round((coef.balancedMeanMaxCap - 1) * 100)}%)</span>
                </div>
                <input
                  type="range"
                  min="1.10"
                  max="1.80"
                  step="0.05"
                  value={coef.balancedMeanMaxCap}
                  onChange={(e) => updateCoef('balancedMeanMaxCap', parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
