'use client';

import React from 'react';
import { AggregationStrategy, MissingDataPolicy, SelectionConfig } from '@/types';
import { PRESETS } from '@/presets/defaultPresets';
import { Sliders, Shield, Award, HelpCircle, Layers, FileSpreadsheet, Zap } from 'lucide-react';

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
  const handlePresetSelect = (presetKey: string) => {
    if (PRESETS[presetKey]) {
      onChange({ ...PRESETS[presetKey] });
    }
  };

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
      {/* Header & Philosophy Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Selection Philosophy
            </h2>
          </div>
          <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-bold">
            LIVE RE-RANK
          </span>
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
          {Object.entries(PRESETS).map(([key, preset]) => {
            const isSelected = config.presetName === preset.presetName;
            return (
              <button
                key={key}
                onClick={() => handlePresetSelect(key)}
                className={`px-2.5 py-2 rounded-lg text-left transition-all border font-bold cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-black/40 hover:bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="truncate text-[11px]">{preset.presetName}</div>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-cyan-950/60" />

      {/* Top X Cutoff Selector */}
      <div className="bg-black/50 border border-cyan-900/40 p-3.5 rounded-xl space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-zinc-200">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Shortlist Cutoff (Top X):</span>
          </span>
          <span className="text-sm font-black text-cyan-400 neon-glow-cyan">
            {config.shortlistCount} <span className="text-[10px] font-normal text-zinc-500">/ {totalTeamsCount} teams</span>
          </span>
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

      {/* Multi-Criteria Scoring Weights */}
      <div className="space-y-3.5 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Scoring Dimensions (Weights)
          </h3>
          <span className="text-[10px] text-zinc-500">0 - 100% Relative</span>
        </div>

        {/* 1. Technical Depth */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-300">
            <span>💻 Technical Depth (GitHub repos, commits)</span>
            <span className="font-bold text-cyan-400">{config.weights.technicalDepth}%</span>
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
          <div className="flex justify-between text-xs text-zinc-300">
            <span>🏆 Projects & Hackathon Accolades</span>
            <span className="font-bold text-cyan-400">{config.weights.projectExperience}%</span>
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
          <div className="flex justify-between text-xs text-zinc-300">
            <span>🧩 Role Complementarity (Frontend + Backend + AI)</span>
            <span className="font-bold text-cyan-400">{config.weights.skillComplementarity}%</span>
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
          <div className="flex justify-between text-xs text-zinc-300">
            <span>📋 Profile Completeness & Evidence</span>
            <span className="font-bold text-cyan-400">{config.weights.dataCompleteness}%</span>
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

        {/* Toggles */}
        <div className="space-y-2 pt-1 text-[11px]">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={config.filters.requireAtLeastOneGithub}
              onChange={(e) => updateFilter('requireAtLeastOneGithub', e.target.checked)}
              className="rounded accent-cyan-400"
            />
            <span>Mandatory GitHub (≥1 member has GitHub profile)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
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
