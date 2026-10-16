'use client';

import React from 'react';
import Link from 'next/link';
import { AggregationStrategy, MissingDataPolicy, SelectionConfig } from '@/types';
import { Sliders, Shield, Award, HelpCircle, Layers, FileSpreadsheet, Zap, ArrowRight } from 'lucide-react';

interface ConfigPanelProps {
  config: SelectionConfig;
  onChange: (updated: SelectionConfig) => void;
  totalTeamsCount: number;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  totalTeamsCount,
}) => {
  const updateWeight = (key: keyof SelectionConfig['weights'], value: number) => {
    onChange({
      ...config,
      weights: {
        ...config.weights,
        [key]: value,
      },
    });
  };

  const updateFilter = <K extends keyof SelectionConfig['filters']>(
    key: K,
    value: SelectionConfig['filters'][K]
  ) => {
    onChange({
      ...config,
      filters: {
        ...config.filters,
        [key]: value,
      },
    });
  };

  return (
    <div className="bg-zinc-950/85 border border-cyan-950/80 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-5 space-y-6 font-mono text-zinc-300 backdrop-blur-xl">
      {/* Header & Direct Formula Studio Gateway */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Scoring Model
            </h2>
          </div>
          <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-bold">
            BALANCED DEFAULT
          </span>
        </div>

        <Link
          href="/formulas"
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-950/70 to-blue-950/50 hover:from-cyan-900/90 hover:to-blue-900/70 border border-cyan-500/40 hover:border-cyan-400 transition-all flex items-center justify-between text-xs font-bold text-cyan-300 group shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          title="Open Formula & Algorithm Studio"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-zinc-100 block group-hover:text-cyan-200">Formula Studio & Custom Math</span>
              <span className="text-[10px] text-zinc-400 font-sans block font-normal">
                Tune multipliers or write custom equations
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
            <span>/formulas</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      <hr className="border-cyan-950/60" />

      {/* Top X Cutoff Selector (With Manual Number Typing + Auto-Updating Slider) */}
      <div className="bg-black/50 border border-cyan-900/40 p-3.5 rounded-xl space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-zinc-200">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Shortlist Cutoff (Top X):</span>
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="1"
              max={Math.max(5, totalTeamsCount || 500)}
              value={config.shortlistCount}
              onChange={(e) =>
                onChange({
                  ...config,
                  shortlistCount: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
              className="w-16 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
              title="Type exact cutoff number to auto-set the bar"
            />
            <span className="text-[10px] text-zinc-500">/ {totalTeamsCount} teams</span>
          </div>
        </div>
        <input
          type="range"
          min="1"
          max={Math.max(5, totalTeamsCount || 50)}
          value={config.shortlistCount}
          onChange={(e) => onChange({ ...config, shortlistCount: parseInt(e.target.value) || 1 })}
          className="w-full accent-cyan-400 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-zinc-500">
          <span>Top 1</span>
          <span>Top {Math.round(totalTeamsCount / 2) || 25}</span>
          <span>Top {totalTeamsCount || 50}</span>
        </div>
      </div>

      {/* Multi-Criteria Scoring Weights (With Manual Number Input + Auto-Updating Sliders) */}
      <div className="space-y-3.5 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Scoring Dimensions (Weights)
          </h3>
          <Link
            href="/formulas"
            className="text-[10px] text-zinc-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            title="Configure underlying formulas & algorithms"
          >
            <span>Formula Studio</span>
            <ArrowRight className="w-2.5 h-2.5 text-cyan-400" />
          </Link>
        </div>

        {/* 1. Technical Depth */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-300">
            <span>💻 Technical Depth (GitHub repos, commits)</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={config.weights.technicalDepth}
                onChange={(e) =>
                  updateWeight(
                    'technicalDepth',
                    Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                title="Type exact weight to auto-set the bar"
              />
              <span className="text-zinc-500 text-xs font-bold">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.weights.technicalDepth}
            onChange={(e) => updateWeight('technicalDepth', parseInt(e.target.value) || 0)}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* 2. Project Experience */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-300">
            <span>🏆 Projects & Hackathon Accolades</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={config.weights.projectExperience}
                onChange={(e) =>
                  updateWeight(
                    'projectExperience',
                    Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                title="Type exact weight to auto-set the bar"
              />
              <span className="text-zinc-500 text-xs font-bold">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.weights.projectExperience}
            onChange={(e) => updateWeight('projectExperience', parseInt(e.target.value) || 0)}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* 3. Skill Complementarity */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-300">
            <span>🧩 Role Complementarity (Frontend + Backend + AI)</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={config.weights.skillComplementarity}
                onChange={(e) =>
                  updateWeight(
                    'skillComplementarity',
                    Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                title="Type exact weight to auto-set the bar"
              />
              <span className="text-zinc-500 text-xs font-bold">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.weights.skillComplementarity}
            onChange={(e) => updateWeight('skillComplementarity', parseInt(e.target.value) || 0)}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* 4. Data Completeness */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-300">
            <span>📋 Profile Completeness & Evidence</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={config.weights.dataCompleteness}
                onChange={(e) =>
                  updateWeight(
                    'dataCompleteness',
                    Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                className="w-14 px-1.5 py-0.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 text-cyan-400 font-bold text-center rounded font-mono text-xs outline-none"
                title="Type exact weight to auto-set the bar"
              />
              <span className="text-zinc-500 text-xs font-bold">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.weights.dataCompleteness}
            onChange={(e) => updateWeight('dataCompleteness', parseInt(e.target.value) || 0)}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      <hr className="border-cyan-950/60" />

      {/* Team Size Normalization Model */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Normalization Model
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            {
              id: 'MAX_SKILL' as AggregationStrategy,
              title: 'Max-Skill',
              desc: 'Highest skill in domain sets score. Solo hackers equalized.',
            },
            {
              id: 'DIMINISHING_RETURNS' as AggregationStrategy,
              title: 'Diminishing',
              desc: 'Lead 100%, 2nd 66%, 3rd 44%. Balanced synergy.',
            },
            {
              id: 'BALANCED_MEAN' as AggregationStrategy,
              title: 'Balanced',
              desc: 'Average score with modest group bonus.',
            },
          ].map((item) => (
            <label
              key={item.id}
              onClick={() => onChange({ ...config, aggregationStrategy: item.id })}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                config.aggregationStrategy === item.id
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-black/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-bold mb-0.5 text-xs">{item.title}</div>
              <div className="text-[10px] text-zinc-400 leading-snug">{item.desc}</div>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-cyan-950/60" />

      {/* Hard Eligibility Gates */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Eligibility Gates (Pass/Fail)
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500">STRICT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Allowed Team Size */}
          <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800 space-y-1">
            <span className="text-zinc-400 text-[11px]">Allowed Team Size:</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min="1"
                max="10"
                value={config.filters.minTeamSize}
                onChange={(e) => updateFilter('minTeamSize', parseInt(e.target.value) || 1)}
                className="w-12 px-2 py-1 bg-zinc-900 border border-zinc-700 text-cyan-300 rounded text-center"
              />
              <span className="text-zinc-500">to</span>
              <input
                type="number"
                min="1"
                max="10"
                value={config.filters.maxTeamSize}
                onChange={(e) => updateFilter('maxTeamSize', parseInt(e.target.value) || 4)}
                className="w-12 px-2 py-1 bg-zinc-900 border border-zinc-700 text-cyan-300 rounded text-center"
              />
            </div>
          </div>

          {/* Min Commits */}
          <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800 space-y-1">
            <span className="text-zinc-400 text-[11px]">Min GitHub Commits:</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min="0"
                max="500"
                step="10"
                value={config.filters.minGithubContributionsOverall}
                onChange={(e) =>
                  updateFilter('minGithubContributionsOverall', parseInt(e.target.value) || 0)
                }
                className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-700 text-cyan-300 rounded text-center"
              />
              <span className="text-zinc-500 text-[11px]">commits</span>
            </div>
          </div>
        </div>

        {/* Toggles & Mandatory GitHub Scope */}
        <div className="space-y-2.5 pt-1 text-[11px]">
          {/* Mandatory GitHub with Scope Selection */}
          <div className="bg-black/40 p-2.5 rounded-lg border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={
                    Boolean(config.filters.githubRequirement && config.filters.githubRequirement !== 'NONE') ||
                    Boolean(config.filters.requireAtLeastOneGithub)
                  }
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const nextMode = checked
                      ? (config.filters.githubRequirement === 'ALL_MEMBERS' ? 'ALL_MEMBERS' : 'AT_LEAST_ONE')
                      : 'NONE';
                    onChange({
                      ...config,
                      filters: {
                        ...config.filters,
                        githubRequirement: nextMode,
                        requireAtLeastOneGithub: checked,
                      },
                    });
                  }}
                  className="rounded accent-cyan-400"
                />
                <span className="font-semibold text-zinc-200">Mandatory GitHub</span>
              </label>

              {/* Scope Switcher: >=1 Member vs All Participants */}
              {((config.filters.githubRequirement && config.filters.githubRequirement !== 'NONE') ||
                config.filters.requireAtLeastOneGithub) && (
                <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-md p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      onChange({
                        ...config,
                        filters: {
                          ...config.filters,
                          githubRequirement: 'AT_LEAST_ONE',
                          requireAtLeastOneGithub: true,
                        },
                      });
                    }}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      config.filters.githubRequirement !== 'ALL_MEMBERS'
                        ? 'bg-cyan-500 text-black font-bold shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="At least one team member must have a GitHub profile"
                  >
                    ≥1 Member
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({
                        ...config,
                        filters: {
                          ...config.filters,
                          githubRequirement: 'ALL_MEMBERS',
                          requireAtLeastOneGithub: true,
                        },
                      });
                    }}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      config.filters.githubRequirement === 'ALL_MEMBERS'
                        ? 'bg-cyan-500 text-black font-bold shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="All participants in the team must have a verified GitHub profile"
                  >
                    All Participants (100%)
                  </button>
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 pl-5">
              {config.filters.githubRequirement === 'ALL_MEMBERS'
                ? 'Strict: Every single registered member in the team must provide a verified GitHub profile.'
                : ((config.filters.githubRequirement && config.filters.githubRequirement !== 'NONE') || config.filters.requireAtLeastOneGithub)
                ? 'Standard: At least one teammate must provide a verified GitHub profile.'
                : 'Optional: No GitHub profile check required.'}
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-zinc-300 bg-black/40 p-2.5 rounded-lg border border-zinc-800/80">
            <input
              type="checkbox"
              checked={config.filters.requireAtLeastOneResumeOrPortfolio}
              onChange={(e) => updateFilter('requireAtLeastOneResumeOrPortfolio', e.target.checked)}
              className="rounded accent-cyan-400"
            />
            <span>Mandatory Resume or Portfolio link</span>
          </label>
        </div>
      </div>

      <hr className="border-cyan-950/60" />

      {/* Missing Data Policy */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Missing Data Policy
          </h3>
        </div>
        <select
          value={config.missingDataPolicy}
          onChange={(e) => onChange({ ...config, missingDataPolicy: e.target.value as MissingDataPolicy })}
          className="w-full bg-black/60 border border-zinc-800 focus:border-cyan-400 px-3 py-2 rounded-lg text-zinc-300 font-mono text-xs"
        >
          <option value="NEUTRAL">
            Neutral / No Penalty (Flag warning, score on available signals)
          </option>
          <option value="PENALTY_10">
            Soft Penalty (10% discount on final score if completeness &lt; 70%)
          </option>
          <option value="PENALTY_25">
            Strict Penalty (25% discount on final score if completeness &lt; 70%)
          </option>
        </select>
      </div>
    </div>
  );
};
