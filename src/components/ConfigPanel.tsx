'use client';

import React from 'react';
import { AggregationStrategy, MissingDataPolicy, SelectionConfig } from '@/types';
import { PRESETS } from '@/presets/defaultPresets';
import { Sliders, Shield, Award, HelpCircle, Layers, FileSpreadsheet } from 'lucide-react';

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
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-6">
      {/* Header & Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Selection Philosophy & Weights</h2>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Live Re-ranking
          </span>
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(PRESETS).map(([key, preset]) => {
            const isSelected = config.presetName === preset.presetName;
            return (
              <button
                key={key}
                onClick={() => handlePresetSelect(key)}
                className={`text-xs px-2.5 py-2 rounded-lg text-left transition-all border font-medium ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="truncate">{preset.presetName}</div>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Top X Cutoff Selector */}
      <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg space-y-2">
        <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            Shortlist Target (Top X Cutoff):
          </span>
          <span className="text-base font-bold text-blue-600">
            {config.shortlistCount} <span className="text-xs font-normal text-slate-500">of {totalTeamsCount} teams</span>
          </span>
        </div>
        <input
          type="range"
          min="1"
          max={Math.max(5, totalTeamsCount || 50)}
          value={config.shortlistCount}
          onChange={(e) => onChange({ ...config, shortlistCount: parseInt(e.target.value) || 1 })}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Top 1</span>
          <span>Top {Math.round(totalTeamsCount / 2) || 25}</span>
          <span>Top {totalTeamsCount || 50}</span>
        </div>
      </div>

      {/* Multi-Criteria Scoring Weights */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Scoring Dimensions (Weights)
          </h3>
          <span className="text-[11px] text-slate-400">0 - 100% Relative Priority</span>
        </div>

        {/* 1. Technical Depth */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>💻 Technical Depth & Code Output (GitHub, repos, commits)</span>
            <span className="font-bold text-blue-600">{config.weights.technicalDepth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.weights.technicalDepth}
            onChange={(e) => updateWeight('technicalDepth', parseInt(e.target.value) || 0)}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* 2. Project Experience */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>🏆 Projects & Hackathon Achievements</span>
            <span className="font-bold text-blue-600">{config.weights.projectExperience}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.weights.projectExperience}
            onChange={(e) => updateWeight('projectExperience', parseInt(e.target.value) || 0)}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* 3. Skill Complementarity */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>🧩 Skill Complementarity (Frontend + Backend + AI + Design)</span>
            <span className="font-bold text-blue-600">{config.weights.skillComplementarity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.weights.skillComplementarity}
            onChange={(e) => updateWeight('skillComplementarity', parseInt(e.target.value) || 0)}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* 4. Data Completeness */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>📋 Profile Completeness & Verifiability</span>
            <span className="font-bold text-blue-600">{config.weights.dataCompleteness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.weights.dataCompleteness}
            onChange={(e) => updateWeight('dataCompleteness', parseInt(e.target.value) || 0)}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Team Size Normalization Strategy */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Team-Size Normalization Model
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {[
            {
              id: 'MAX_SKILL' as AggregationStrategy,
              title: 'Max-Skill',
              desc: 'Best member in domain represents team. Solo hackers equalized.',
            },
            {
              id: 'DIMINISHING_RETURNS' as AggregationStrategy,
              title: 'Diminishing Returns',
              desc: 'Lead counts 100%, 2nd 66%, 3rd 44%. Balanced synergy.',
            },
            {
              id: 'BALANCED_MEAN' as AggregationStrategy,
              title: 'Balanced Mean',
              desc: 'Average score across members with modest group bonus.',
            },
          ].map((item) => (
            <label
              key={item.id}
              onClick={() => onChange({ ...config, aggregationStrategy: item.id })}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                config.aggregationStrategy === item.id
                  ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold mb-0.5">{item.title}</div>
              <div className="text-[11px] text-slate-500 leading-snug">{item.desc}</div>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Hard Eligibility Gates (Pass/Fail) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hard Eligibility Filters (Pass/Fail Gates)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Strict Criteria</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Min/Max Size */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
            <span className="font-medium text-slate-700">Allowed Team Size:</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min="1"
                max="10"
                value={config.filters.minTeamSize}
                onChange={(e) => updateFilter('minTeamSize', parseInt(e.target.value) || 1)}
                className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center"
              />
              <span className="text-slate-400">to</span>
              <input
                type="number"
                min="1"
                max="10"
                value={config.filters.maxTeamSize}
                onChange={(e) => updateFilter('maxTeamSize', parseInt(e.target.value) || 4)}
                className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center"
              />
              <span className="text-slate-500">members</span>
            </div>
          </div>

          {/* Min GitHub Contributions */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
            <span className="font-medium text-slate-700">Min. Top Contributor GitHub Commits:</span>
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
                className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-center"
              />
              <span className="text-slate-500">commits</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={config.filters.requireAtLeastOneGithub}
              onChange={(e) => updateFilter('requireAtLeastOneGithub', e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>Mandatory GitHub profile (at least 1 member must have GitHub)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={config.filters.requireAtLeastOneResumeOrPortfolio}
              onChange={(e) => updateFilter('requireAtLeastOneResumeOrPortfolio', e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>Mandatory Resume or Portfolio link</span>
          </label>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Missing Data Policy */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Missing Data Policy (Never silently dropped)
          </h3>
        </div>
        <select
          value={config.missingDataPolicy}
          onChange={(e) => onChange({ ...config, missingDataPolicy: e.target.value as MissingDataPolicy })}
          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-700 font-medium"
        >
          <option value="NEUTRAL">
            Neutral / No Score Penalty (Score on available signals + flag warning)
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
