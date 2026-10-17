'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AggregationStrategy,
  MissingDataPolicy,
  SelectionConfig,
  ScoringWeightsToggles,
  WorkExperienceConfig,
  CustomKeywordWeight,
} from '@/types';
import { DEFAULT_WORK_EXPERIENCE_CONFIG } from '@/presets/defaultPresets';
import {
  Sliders,
  Shield,
  Award,
  HelpCircle,
  Layers,
  FileSpreadsheet,
  Zap,
  ArrowRight,
  PanelLeftClose,
  BookmarkPlus,
  Briefcase,
  GraduationCap,
  Building2,
  AlertTriangle,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ConfigPanelProps {
  config: SelectionConfig;
  onChange: (updated: SelectionConfig) => void;
  totalTeamsCount: number;
  onHideFilters?: () => void;
  onSaveRun?: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  totalTeamsCount,
  onHideFilters,
  onSaveRun,
}) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [newWeight, setNewWeight] = useState(10);
  const [showWorkDetails, setShowWorkDetails] = useState(true);
  const [showKeywordDetails, setShowKeywordDetails] = useState(true);

  const updateWeight = (key: keyof SelectionConfig['weights'], value: number) => {
    onChange({
      ...config,
      weights: {
        ...config.weights,
        [key]: value,
      },
    });
  };

  const toggleWeight = (key: keyof ScoringWeightsToggles) => {
    const current = config.weightsEnabled?.[key] !== false;
    onChange({
      ...config,
      weightsEnabled: {
        ...(config.weightsEnabled || {
          technicalDepth: true,
          projectExperience: true,
          skillComplementarity: true,
          dataCompleteness: true,
        }),
        [key]: !current,
      },
    });
  };

  const updateWorkConfig = (updates: Partial<WorkExperienceConfig>) => {
    onChange({
      ...config,
      workExperienceConfig: {
        ...(config.workExperienceConfig || DEFAULT_WORK_EXPERIENCE_CONFIG),
        ...updates,
      },
    });
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    const existing = config.customKeywords || [];
    if (existing.some((k) => k.keyword.toLowerCase() === trimmed.toLowerCase())) {
      alert('This keyword is already configured in the list.');
      return;
    }
    const newEntry: CustomKeywordWeight = {
      id: `kw-${Date.now()}`,
      keyword: trimmed,
      weight: newWeight,
      enabled: true,
    };
    onChange({
      ...config,
      customKeywords: [...existing, newEntry],
    });
    setNewKeyword('');
  };

  const handleToggleKeyword = (id: string) => {
    const existing = config.customKeywords || [];
    onChange({
      ...config,
      customKeywords: existing.map((k) =>
        k.id === id ? { ...k, enabled: k.enabled === false ? true : false } : k
      ),
    });
  };

  const handleRemoveKeyword = (id: string) => {
    const existing = config.customKeywords || [];
    onChange({
      ...config,
      customKeywords: existing.filter((k) => k.id !== id),
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
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-bold">
              BALANCED DEFAULT
            </span>
            {onHideFilters && (
              <button
                onClick={onHideFilters}
                className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/50 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Hide Filters Sidebar to Expand Leaderboard"
              >
                <PanelLeftClose className="w-3 h-3 text-cyan-400" />
                <span>Hide</span>
              </button>
            )}
          </div>
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
          <div className="flex items-center gap-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              Scoring Dimensions (Weights)
            </h3>
            <span className="text-[9px] text-zinc-500 font-normal">
              (Use toggles to turn off/on dimensions)
            </span>
          </div>
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
        {(() => {
          const isTechEnabled = config.weightsEnabled?.technicalDepth !== false;
          return (
            <div className={`space-y-1 p-2 rounded-lg transition-colors ${isTechEnabled ? 'bg-black/30' : 'bg-zinc-950/40 border border-zinc-900/60'}`}>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleWeight('technicalDepth')}
                    className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      isTechEnabled ? 'bg-cyan-500' : 'bg-zinc-800'
                    }`}
                    title={isTechEnabled ? 'Turn OFF Technical Depth from scoring' : 'Turn ON Technical Depth for scoring'}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${
                        isTechEnabled ? 'translate-x-3 bg-black' : 'translate-x-0 bg-zinc-400'
                      }`}
                    />
                  </button>
                  <span className={isTechEnabled ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                    💻 Technical Depth (GitHub repos, commits)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isTechEnabled ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-900 text-zinc-500 rounded border border-zinc-800">
                      OFF (0%)
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={!isTechEnabled}
                value={isTechEnabled ? config.weights.technicalDepth : 0}
                onChange={(e) => updateWeight('technicalDepth', parseInt(e.target.value) || 0)}
                className={`w-full accent-cyan-400 cursor-pointer ${!isTechEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
          );
        })()}

        {/* 2. Project Experience */}
        {(() => {
          const isExpEnabled = config.weightsEnabled?.projectExperience !== false;
          return (
            <div className={`space-y-1 p-2 rounded-lg transition-colors ${isExpEnabled ? 'bg-black/30' : 'bg-zinc-950/40 border border-zinc-900/60'}`}>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleWeight('projectExperience')}
                    className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      isExpEnabled ? 'bg-cyan-500' : 'bg-zinc-800'
                    }`}
                    title={isExpEnabled ? 'Turn OFF Project Experience from scoring' : 'Turn ON Project Experience for scoring'}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${
                        isExpEnabled ? 'translate-x-3 bg-black' : 'translate-x-0 bg-zinc-400'
                      }`}
                    />
                  </button>
                  <span className={isExpEnabled ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                    🏆 Projects & Hackathon Accolades
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isExpEnabled ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-900 text-zinc-500 rounded border border-zinc-800">
                      OFF (0%)
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={!isExpEnabled}
                value={isExpEnabled ? config.weights.projectExperience : 0}
                onChange={(e) => updateWeight('projectExperience', parseInt(e.target.value) || 0)}
                className={`w-full accent-cyan-400 cursor-pointer ${!isExpEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
          );
        })()}

        {/* 3. Skill Complementarity */}
        {(() => {
          const isCompEnabled = config.weightsEnabled?.skillComplementarity !== false;
          return (
            <div className={`space-y-1 p-2 rounded-lg transition-colors ${isCompEnabled ? 'bg-black/30' : 'bg-zinc-950/40 border border-zinc-900/60'}`}>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleWeight('skillComplementarity')}
                    className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      isCompEnabled ? 'bg-cyan-500' : 'bg-zinc-800'
                    }`}
                    title={isCompEnabled ? 'Turn OFF Role Complementarity from scoring' : 'Turn ON Role Complementarity for scoring'}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${
                        isCompEnabled ? 'translate-x-3 bg-black' : 'translate-x-0 bg-zinc-400'
                      }`}
                    />
                  </button>
                  <span className={isCompEnabled ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                    🧩 Role Complementarity (Frontend + Backend + AI)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isCompEnabled ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-900 text-zinc-500 rounded border border-zinc-800">
                      OFF (0%)
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={!isCompEnabled}
                value={isCompEnabled ? config.weights.skillComplementarity : 0}
                onChange={(e) => updateWeight('skillComplementarity', parseInt(e.target.value) || 0)}
                className={`w-full accent-cyan-400 cursor-pointer ${!isCompEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
          );
        })()}

        {/* 4. Data Completeness */}
        {(() => {
          const isDataEnabled = config.weightsEnabled?.dataCompleteness !== false;
          return (
            <div className={`space-y-1 p-2 rounded-lg transition-colors ${isDataEnabled ? 'bg-black/30' : 'bg-zinc-950/40 border border-zinc-900/60'}`}>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleWeight('dataCompleteness')}
                    className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      isDataEnabled ? 'bg-cyan-500' : 'bg-zinc-800'
                    }`}
                    title={isDataEnabled ? 'Turn OFF Profile Completeness from scoring' : 'Turn ON Profile Completeness for scoring'}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${
                        isDataEnabled ? 'translate-x-3 bg-black' : 'translate-x-0 bg-zinc-400'
                      }`}
                    />
                  </button>
                  <span className={isDataEnabled ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                    📋 Profile Completeness & Evidence
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isDataEnabled ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-900 text-zinc-500 rounded border border-zinc-800">
                      OFF (0%)
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={!isDataEnabled}
                value={isDataEnabled ? config.weights.dataCompleteness : 0}
                onChange={(e) => updateWeight('dataCompleteness', parseInt(e.target.value) || 0)}
                className={`w-full accent-cyan-400 cursor-pointer ${!isDataEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
          );
        })()}
      </div>

      {/* --- Work & Research Experience Scoring Section --- */}
      {(() => {
        const wCfg = config.workExperienceConfig || DEFAULT_WORK_EXPERIENCE_CONFIG;
        const isMasterWorkOn = wCfg.enabled !== false;

        return (
          <div className="bg-black/50 border border-indigo-900/40 rounded-xl p-3.5 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Work & Research Experience
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-sans">
                    Score internships in IIT/NIT/IIIT, Tier-1 companies & clubs
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateWorkConfig({ enabled: !isMasterWorkOn })}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                    isMasterWorkOn ? 'bg-indigo-500' : 'bg-zinc-800'
                  }`}
                  title={isMasterWorkOn ? 'Disable Work Experience scoring' : 'Enable Work Experience scoring'}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform ${
                      isMasterWorkOn ? 'translate-x-3.5 bg-black' : 'translate-x-0 bg-zinc-500'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setShowWorkDetails(!showWorkDetails)}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5"
                  title="Expand or collapse work experience options"
                >
                  {showWorkDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {isMasterWorkOn && showWorkDetails && (
              <div className="space-y-3 pt-2 border-t border-indigo-950/70 text-xs">
                {/* 1. Research Internships in IIT / NIT / IIIT */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateWorkConfig({
                          researchInternshipEnabled: !(wCfg.researchInternshipEnabled !== false),
                        })
                      }
                      className={`w-6 h-3.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                        wCfg.researchInternshipEnabled !== false ? 'bg-indigo-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-transform ${
                          wCfg.researchInternshipEnabled !== false ? 'translate-x-2.5 bg-black' : 'translate-x-0 bg-zinc-500'
                        }`}
                      />
                    </button>
                    <span className={wCfg.researchInternshipEnabled !== false ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                      🏛️ Research in NIT / IIT / IIIT / Top Labs
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={wCfg.researchInternshipEnabled === false}
                      value={wCfg.researchInternshipBonus}
                      onChange={(e) =>
                        updateWorkConfig({
                          researchInternshipBonus: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-12 px-1 py-0.5 bg-black/80 border border-zinc-700 text-indigo-300 font-bold text-center rounded text-xs outline-none disabled:opacity-40"
                    />
                    <span className="text-[10px] text-zinc-500">pts</span>
                  </div>
                </div>

                {/* 2. Tier-1 Global Companies */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateWorkConfig({
                          tier1CompanyEnabled: !(wCfg.tier1CompanyEnabled !== false),
                        })
                      }
                      className={`w-6 h-3.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                        wCfg.tier1CompanyEnabled !== false ? 'bg-indigo-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-transform ${
                          wCfg.tier1CompanyEnabled !== false ? 'translate-x-2.5 bg-black' : 'translate-x-0 bg-zinc-500'
                        }`}
                      />
                    </button>
                    <span className={wCfg.tier1CompanyEnabled !== false ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                      🏢 Tier-1 Tech Titans (FAANG / OpenAI / Nvidia)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={wCfg.tier1CompanyEnabled === false}
                      value={wCfg.tier1CompanyBonus}
                      onChange={(e) =>
                        updateWorkConfig({
                          tier1CompanyBonus: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-12 px-1 py-0.5 bg-black/80 border border-zinc-700 text-indigo-300 font-bold text-center rounded text-xs outline-none disabled:opacity-40"
                    />
                    <span className="text-[10px] text-zinc-500">pts</span>
                  </div>
                </div>

                {/* 3. College Clubs & Leadership */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateWorkConfig({
                          clubLeadershipEnabled: !(wCfg.clubLeadershipEnabled !== false),
                        })
                      }
                      className={`w-6 h-3.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                        wCfg.clubLeadershipEnabled !== false ? 'bg-indigo-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-transform ${
                          wCfg.clubLeadershipEnabled !== false ? 'translate-x-2.5 bg-black' : 'translate-x-0 bg-zinc-500'
                        }`}
                      />
                    </button>
                    <span className={wCfg.clubLeadershipEnabled !== false ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                      🎯 Club Leads (GDSC / IEEE / ACM / E-Cell)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={wCfg.clubLeadershipEnabled === false}
                      value={wCfg.clubLeadershipBonus}
                      onChange={(e) =>
                        updateWorkConfig({
                          clubLeadershipBonus: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-12 px-1 py-0.5 bg-black/80 border border-zinc-700 text-indigo-300 font-bold text-center rounded text-xs outline-none disabled:opacity-40"
                    />
                    <span className="text-[10px] text-zinc-500">pts</span>
                  </div>
                </div>

                {/* 4. General Verified Work Experience */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateWorkConfig({
                          baseWorkExpEnabled: !(wCfg.baseWorkExpEnabled !== false),
                        })
                      }
                      className={`w-6 h-3.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                        wCfg.baseWorkExpEnabled !== false ? 'bg-indigo-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-transform ${
                          wCfg.baseWorkExpEnabled !== false ? 'translate-x-2.5 bg-black' : 'translate-x-0 bg-zinc-500'
                        }`}
                      />
                    </button>
                    <span className={wCfg.baseWorkExpEnabled !== false ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                      💼 General Verified Work Experience
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={wCfg.baseWorkExpEnabled === false}
                      value={wCfg.baseWorkExpPoints}
                      onChange={(e) =>
                        updateWorkConfig({
                          baseWorkExpPoints: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-12 px-1 py-0.5 bg-black/80 border border-zinc-700 text-indigo-300 font-bold text-center rounded text-xs outline-none disabled:opacity-40"
                    />
                    <span className="text-[10px] text-zinc-500">pts</span>
                  </div>
                </div>

                {/* 5. Spam / Fake Experience Anti-Cheat Filter */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateWorkConfig({
                          penalizeSpam: !(wCfg.penalizeSpam !== false),
                        })
                      }
                      className={`w-6 h-3.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                        wCfg.penalizeSpam !== false ? 'bg-amber-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-transform ${
                          wCfg.penalizeSpam !== false ? 'translate-x-2.5 bg-black' : 'translate-x-0 bg-zinc-500'
                        }`}
                      />
                    </button>
                    <span className="text-zinc-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Detect & Discount Spam Experiences</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400/80">
                    {wCfg.penalizeSpam !== false ? 'Auto-discount & Flag' : 'Ignored'}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* --- Custom Keyword Weights Section (Case-Insensitive) --- */}
      {(() => {
        const isKeywordsOn = config.workExperienceConfig?.customKeywordsEnabled !== false;
        const keywords = config.customKeywords || [];

        return (
          <div className="bg-black/50 border border-emerald-900/40 rounded-xl p-3.5 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Custom Keyword Point Weights
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-sans">
                    Award explicit bonus points for organizer keywords (case-insensitive)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateWorkConfig({
                      customKeywordsEnabled: !isKeywordsOn,
                    })
                  }
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                    isKeywordsOn ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                  title={isKeywordsOn ? 'Disable Custom Keyword weights' : 'Enable Custom Keyword weights'}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform ${
                      isKeywordsOn ? 'translate-x-3.5 bg-black' : 'translate-x-0 bg-zinc-500'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setShowKeywordDetails(!showKeywordDetails)}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5"
                  title="Expand or collapse keywords"
                >
                  {showKeywordDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {isKeywordsOn && showKeywordDetails && (
              <div className="space-y-3 pt-2 border-t border-emerald-950/70 text-xs">
                {/* Add Keyword Form */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Keyword (e.g. Kubernetes, Rust, Solana, PyTorch)"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddKeyword();
                    }}
                    className="flex-1 px-2.5 py-1 bg-black/80 border border-zinc-700 focus:border-emerald-400 text-zinc-200 placeholder-zinc-500 rounded text-xs outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(parseInt(e.target.value) || 0)}
                      className="w-12 px-1 py-1 bg-black/80 border border-zinc-700 focus:border-emerald-400 text-emerald-400 font-bold text-center rounded text-xs outline-none"
                      title="Points awarded if keyword found"
                    />
                    <span className="text-[10px] text-zinc-500">pts</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 rounded flex items-center gap-1 font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Add</span>
                  </button>
                </div>

                {/* List of Keywords */}
                {keywords.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic">
                    No custom keywords added yet. Add keywords above to scan across Resumes, GitHub, LinkedIn & form responses.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {keywords.map((kw) => {
                      const isKwActive = kw.enabled !== false;
                      return (
                        <div
                          key={kw.id}
                          className={`flex items-center justify-between p-1.5 rounded-lg border transition-colors ${
                            isKwActive
                              ? 'bg-emerald-950/30 border-emerald-900/60 text-zinc-200'
                              : 'bg-zinc-950/40 border-zinc-900 text-zinc-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleKeyword(kw.id)}
                              className={`w-5 h-3 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                                isKwActive ? 'bg-emerald-500' : 'bg-zinc-800'
                              }`}
                              title={isKwActive ? 'Turn off this keyword' : 'Turn on this keyword'}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full transition-transform ${
                                  isKwActive ? 'translate-x-2 bg-black' : 'translate-x-0 bg-zinc-500'
                                }`}
                              />
                            </button>
                            <span className={`font-semibold ${isKwActive ? 'text-emerald-300' : 'line-through text-zinc-600'}`}>
                              {kw.keyword}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              isKwActive ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                            }`}>
                              +{kw.weight} pts
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(kw.id)}
                              className="text-zinc-600 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                              title="Delete keyword"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="text-[10px] text-zinc-500">
                  Scanned across Resume PDFs, GitHub bio/repos, LinkedIn headline/skills, and candidate form inputs.
                </div>
              </div>
            )}
          </div>
        );
      })()}

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

          {/* Compulsory Female Participation Gate (SIH / Diversity Rule) */}
          <div className="bg-black/40 p-2.5 rounded-lg border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={Boolean(config.filters.requireFemaleMember)}
                  onChange={(e) => updateFilter('requireFemaleMember', e.target.checked)}
                  className="rounded accent-pink-500"
                />
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span>Compulsory Female Participation</span>
                  <span className="text-[9px] bg-pink-950/80 text-pink-300 border border-pink-800/80 px-1.5 py-0.2 rounded font-mono font-bold">
                    ♀ SIH / Diversity
                  </span>
                </span>
              </label>

              {config.filters.requireFemaleMember && (
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded-md px-2 py-0.5 text-[10px] font-mono">
                  <span className="text-zinc-400">Min:</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={config.filters.minFemaleCount || 1}
                    onChange={(e) => updateFilter('minFemaleCount', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 px-1 py-0.2 bg-black border border-zinc-700 text-pink-300 font-bold rounded text-center outline-none"
                    title="Minimum required female members per team"
                  />
                  <span className="text-zinc-400">Female</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 pl-5">
              {config.filters.requireFemaleMember
                ? `Strict Gate: Teams without at least ${config.filters.minFemaleCount || 1} verified female participant(s) are disqualified from shortlisting.`
                : 'Optional: No female participation restriction applied.'}
            </p>
          </div>
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

      {/* Save Scoring Run Snapshot Button */}
      {onSaveRun && (
        <button
          onClick={onSaveRun}
          className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          title="Save and snapshot current scoring configuration into audit vault"
        >
          <BookmarkPlus className="w-4 h-4" />
          <span>Save Scoring Run Snapshot</span>
        </button>
      )}
    </div>
  );
};
