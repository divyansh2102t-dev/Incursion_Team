'use client';

import React, { useState, useMemo, useRef } from 'react';
import { SelectionConfig, TeamRecord } from '@/types';
import { validateExpression, evaluateCustomFormula, MathScope } from '@/utils/mathEvaluator';
import {
  Code2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
  Play,
  Calculator,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CustomFormulaStudioProps {
  config: SelectionConfig;
  onUpdateConfig: (updated: SelectionConfig) => void;
  teams: TeamRecord[];
}

export const CustomFormulaStudio: React.FC<CustomFormulaStudioProps> = ({
  config,
  onUpdateConfig,
  teams,
}) => {
  const [expression, setExpression] = useState<string>(
    config.customFormulaExpression || '0.45 * tech + 0.35 * exp + 0.20 * synergy'
  );
  const [formulaName, setFormulaName] = useState<string>(
    config.customFormulaName || 'Custom Scoring Model V1'
  );
  const [isEnabled, setIsEnabled] = useState<boolean>(
    Boolean(config.customFormulaEnabled)
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(
    Boolean(config.customFormulaEnabled)
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Validate the current formula in real-time
  const validation = useMemo(() => {
    return validateExpression(expression);
  }, [expression]);

  // Available variable chips for quick click-to-insert
  const availableVariables = [
    { name: 'tech', label: 'Technical Depth', desc: 'Normalized GitHub code & output score (0-100)' },
    { name: 'exp', label: 'Project Experience', desc: 'Hackathon accolades, skills & proof-of-work (0-100)' },
    { name: 'synergy', label: 'Role Synergy', desc: 'Frontend + Backend + AI + Design coverage (0-100)' },
    { name: 'completeness', label: 'Profile Completeness', desc: 'Ratio of provided profile links & resumes (0-100)' },
    { name: 'commits', label: 'GitHub Commits', desc: 'Total estimated annual commits volume' },
    { name: 'stars', label: 'Repo Stars', desc: 'Total GitHub original repository stars' },
    { name: 'wins', label: 'Hackathon Wins', desc: 'Verified hackathon placements & trophies count' },
    { name: 'team_size', label: 'Team Size', desc: 'Number of members registered on the team' },
    { name: 'skills', label: 'Skills Count', desc: 'Count of unique verified candidate technologies' },
  ];

  // Common math function chips
  const mathFunctions = [
    { fn: 'min(a, b)', snippet: 'min(', label: 'min' },
    { fn: 'max(a, b)', snippet: 'max(', label: 'max' },
    { fn: 'log10(x)', snippet: 'log10(', label: 'log10' },
    { fn: 'sqrt(x)', snippet: 'sqrt(', label: 'sqrt' },
    { fn: 'clamp(val, min, max)', snippet: 'clamp(', label: 'clamp' },
    { fn: 'round(x)', snippet: 'round(', label: 'round' },
  ];

  // Quick preset templates
  const presets = [
    {
      title: 'Balanced Generalist',
      name: 'Balanced Core V1',
      formula: '0.40 * tech + 0.30 * exp + 0.20 * synergy + 0.10 * completeness',
      desc: 'Solid distributed weighting across all 4 candidate dimensions.',
    },
    {
      title: 'Hackathon Heavyweight',
      name: 'Hackathon Champions Bias',
      formula: '0.50 * exp + 0.30 * tech + 0.20 * synergy + wins * 4',
      desc: 'Aggressively boosts teams with verified hackathon wins and battle-tested project experience.',
    },
    {
      title: 'Solo Hacker Alpha Equalizer',
      name: 'Solo Prodigy Equalizer',
      formula: '(tech * 0.55 + exp * 0.45) * (team_size == 1 ? 1.15 : 1.0)',
      desc: 'Grants an automatic 15% synergy boost to solo hackers who do all the work alone.',
    },
    {
      title: 'Non-Linear Code Velocity',
      name: 'Logarithmic Velocity Scaling',
      formula: '0.45 * tech + 0.35 * exp + 0.20 * synergy + log10(commits + 1) * 3',
      desc: 'Applies diminishing returns to commit volume using logarithmic scaling.',
    },
    {
      title: 'Strict Merit Cap',
      name: 'Merit Capped Index',
      formula: 'min(100, 0.40 * tech + 0.35 * exp + 0.25 * synergy + (stars >= 10 ? 5 : 0))',
      desc: 'Capped at 100 max with a +5 bonus for having at least 10 open-source GitHub stars.',
    },
  ];

  // Insert variable or function snippet into the formula textarea
  const insertText = (snippet: string) => {
    if (!textareaRef.current) {
      setExpression((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + snippet);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;

    const needsPreSpace = start > 0 && !/[\s(+\-*/=><?,]/.test(current[start - 1]);
    const insertStr = (needsPreSpace ? ' ' : '') + snippet;

    const nextVal = current.substring(0, start) + insertStr + current.substring(end);
    setExpression(nextVal);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + insertStr.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  // Save changes to App Context
  const handleApply = (newEnabled = isEnabled) => {
    onUpdateConfig({
      ...config,
      customFormulaEnabled: newEnabled,
      customFormulaExpression: expression.trim(),
      customFormulaName: formulaName.trim() || 'Custom Scoring Model',
    });
  };

  const handleToggle = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    if (!nextState) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
    handleApply(nextState);
  };

  const sampleTeams: TeamRecord[] = useMemo(() => {
    if (teams && teams.length > 0) {
      return teams.slice(0, 4);
    }
    return [
      {
        id: 'mock-1',
        teamName: 'Team HyperDrive',
        rawRowData: {},
        members: [
          {
            name: 'Alex Chen',
            role: 'Full Stack',
            skills: ['Next.js', 'PostgreSQL', 'TypeScript', 'Tailwind'],
            github: 'alexchen',
            roleNormalized: 'backend',
            rawSignals: {
              githubCommits: 320,
              githubOriginalStars: 15,
              hackathonAccoladesCount: 1,
              profileCompletenessRatio: 1,
              totalSkillsCount: 4,
            },
          },
          {
            name: 'Sarah Kim',
            role: 'AI / ML',
            skills: ['Python', 'PyTorch', 'FastAPI'],
            github: 'sarahkim',
            roleNormalized: 'ai',
            rawSignals: {
              githubCommits: 180,
              githubOriginalStars: 8,
              hackathonAccoladesCount: 2,
              profileCompletenessRatio: 1,
              totalSkillsCount: 3,
            },
          },
        ],
        computed: {
          isEligible: true,
          failedFilters: [],
          passedFilters: [],
          technicalDepthScore: 92,
          projectExperienceScore: 88,
          skillComplementarityScore: 90,
          dataCompletenessScore: 100,
          finalScore: 89.8,
          rank: 1,
          coveredRoles: ['backend', 'ai'],
          missingRoles: [],
          missingDataWarnings: [],
          antiCheatFlags: [],
        },
      },
      {
        id: 'mock-2',
        teamName: 'Vector Solos',
        rawRowData: {},
        members: [
          {
            name: 'Jordan Bell',
            role: 'Full Stack',
            skills: ['Rust', 'Solana', 'React'],
            github: 'jbell',
            roleNormalized: 'fullstack',
            rawSignals: {
              githubCommits: 450,
              githubOriginalStars: 25,
              hackathonAccoladesCount: 1,
              profileCompletenessRatio: 0.95,
              totalSkillsCount: 3,
            },
          },
        ],
        computed: {
          isEligible: true,
          failedFilters: [],
          passedFilters: [],
          technicalDepthScore: 84,
          projectExperienceScore: 78,
          skillComplementarityScore: 65,
          dataCompletenessScore: 95,
          finalScore: 77.2,
          rank: 3,
          coveredRoles: ['fullstack'],
          missingRoles: ['ai'],
          missingDataWarnings: [],
          antiCheatFlags: [],
        },
      },
      {
        id: 'mock-3',
        teamName: 'Quantum Hackers',
        rawRowData: {},
        members: [
          {
            name: 'Maya Patel',
            role: 'Frontend',
            skills: ['React', 'CSS', 'Figma'],
            github: 'mayap',
            roleNormalized: 'frontend',
            rawSignals: {
              githubCommits: 210,
              githubOriginalStars: 6,
              hackathonAccoladesCount: 1,
              profileCompletenessRatio: 0.9,
              totalSkillsCount: 3,
            },
          },
          {
            name: 'Leo Rossi',
            role: 'Backend',
            skills: ['Go', 'Docker', 'Kubernetes'],
            github: 'leor',
            roleNormalized: 'backend',
            rawSignals: {
              githubCommits: 390,
              githubOriginalStars: 14,
              hackathonAccoladesCount: 2,
              profileCompletenessRatio: 1,
              totalSkillsCount: 3,
            },
          },
        ],
        computed: {
          isEligible: true,
          failedFilters: [],
          passedFilters: [],
          technicalDepthScore: 76,
          projectExperienceScore: 82,
          skillComplementarityScore: 94,
          dataCompletenessScore: 90,
          finalScore: 81.6,
          rank: 2,
          coveredRoles: ['frontend', 'backend'],
          missingRoles: [],
          missingDataWarnings: [],
          antiCheatFlags: [],
        },
      },
      {
        id: 'mock-4',
        teamName: 'Zero Day Labs',
        rawRowData: {},
        members: [
          {
            name: 'Devin Vance',
            role: 'Security',
            skills: ['C++', 'Reverse Engineering', 'Assembly'],
            github: 'devv',
            roleNormalized: 'backend',
            rawSignals: {
              githubCommits: 140,
              githubOriginalStars: 4,
              hackathonAccoladesCount: 0,
              profileCompletenessRatio: 0.85,
              totalSkillsCount: 3,
            },
          },
        ],
        computed: {
          isEligible: true,
          failedFilters: [],
          passedFilters: [],
          technicalDepthScore: 88,
          projectExperienceScore: 70,
          skillComplementarityScore: 72,
          dataCompletenessScore: 85,
          finalScore: 78.4,
          rank: 4,
          coveredRoles: ['backend'],
          missingRoles: [],
          missingDataWarnings: [],
          antiCheatFlags: [],
        },
      },
    ] as unknown as TeamRecord[];
  }, [teams]);

  // Compact collapsed bar when custom formula is OFF
  if (!isEnabled && !isExpanded) {
    return (
      <div className="bg-zinc-950/80 border border-cyan-950/70 hover:border-cyan-500/40 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md backdrop-blur-md transition-all">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-200">Custom Mathematical Formula Studio</span>
              <span className="text-[9px] font-bold bg-zinc-900 text-zinc-500 border border-zinc-800 px-1.5 py-0.2 rounded uppercase">
                CUSTOM FORMULA: OFF
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
              Standard scoring active. Turn ON to author and test arbitrary scoring equations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 font-medium rounded-lg border border-zinc-800 hover:border-cyan-500/40 transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <span>Open Studio</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              const next = true;
              setIsEnabled(next);
              setIsExpanded(true);
              handleApply(next);
            }}
            className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 font-bold rounded-lg border border-cyan-800 hover:border-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
          >
            <span>Turn ON</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/90 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] p-5 sm:p-6 space-y-6 font-mono text-zinc-300 backdrop-blur-xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-950/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-zinc-100 tracking-tight uppercase neon-glow-cyan">
                Custom Mathematical Formula Studio
              </h2>
              <span className="text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                EXPRESSION ENGINE
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Write arbitrary math equations using cohort signals. Overrides standard linear weights.
            </p>
          </div>
        </div>

        {/* Right Header Controls: Collapse & Switch */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] rounded-lg border border-zinc-800 flex items-center gap-1 transition-colors cursor-pointer"
            title="Collapse to compact bar"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Collapse</span>
          </button>

          {/* Enable / Disable Master Switch */}
          <div className="flex items-center gap-3 bg-black/60 border border-cyan-900/60 p-2 rounded-xl">
            <span className="text-xs font-bold text-zinc-300">
              {isEnabled ? 'CUSTOM FORMULA: ACTIVE' : 'CUSTOM FORMULA: OFF'}
            </span>
            <button
              type="button"
              onClick={handleToggle}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                isEnabled ? 'bg-cyan-500 shadow-[0_0_15px_#22d3ee]' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Formula Naming & Preset Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formula Name */}
        <div className="lg:col-span-1 space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 block">Formula Name / Version:</label>
          <input
            type="text"
            value={formulaName}
            onChange={(e) => setFormulaName(e.target.value)}
            onBlur={() => handleApply()}
            placeholder="e.g. SIH Hackathon Cutoff Formula"
            className="w-full bg-black/70 border border-zinc-800 focus:border-cyan-400 px-3 py-2 rounded-lg text-cyan-300 font-mono text-xs outline-none transition-colors"
          />
        </div>

        {/* Quick Presets Picker */}
        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 block">Load Preset Template:</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setExpression(preset.formula);
                  setFormulaName(preset.name);
                  onUpdateConfig({
                    ...config,
                    customFormulaEnabled: isEnabled,
                    customFormulaExpression: preset.formula,
                    customFormulaName: preset.name,
                  });
                }}
                className="px-2.5 py-1 bg-zinc-900/90 hover:bg-cyan-950/60 text-zinc-300 hover:text-cyan-300 text-[11px] rounded-lg border border-zinc-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                title={`${preset.desc}\nFormula: ${preset.formula}`}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Clickable Chips Container */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mathematical Expression:</span>
          </label>
          <span className="text-[11px] text-zinc-500 font-sans">
            Supports +, -, *, /, %, ^, ternary (a ? b : c), min(), max(), log10()
          </span>
        </div>

        {/* Expression Textarea with glow effect */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={3}
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onBlur={() => handleApply()}
            placeholder="e.g. 0.45 * tech + 0.35 * exp + 0.20 * synergy + min(10, commits / 50)"
            className="w-full bg-black/85 border border-cyan-950/90 focus:border-cyan-400 p-3.5 rounded-xl font-mono text-sm text-cyan-300 placeholder-zinc-600 focus:outline-none transition-colors shadow-inner"
          />
        </div>

        {/* Variable Insertion Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-zinc-400 font-bold block">
            Click to Insert Candidate Variables:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {availableVariables.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => insertText(v.name)}
                className="px-2 py-1 bg-cyan-950/40 hover:bg-cyan-900/70 border border-cyan-800/60 hover:border-cyan-400 text-cyan-300 rounded text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                title={`${v.label}: ${v.desc}`}
              >
                <span className="font-bold text-cyan-400">+</span>
                <span>{v.name}</span>
              </button>
            ))}

            <span className="text-zinc-600 mx-1">|</span>

            {/* Math Functions */}
            {mathFunctions.map((fn) => (
              <button
                key={fn.label}
                type="button"
                onClick={() => insertText(fn.snippet)}
                className="px-2 py-1 bg-indigo-950/40 hover:bg-indigo-900/70 border border-indigo-800/60 hover:border-indigo-400 text-indigo-300 rounded text-[11px] font-mono transition-colors cursor-pointer"
                title={`Insert function: ${fn.fn}`}
              >
                {fn.label}()
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Syntax & Validator Status Card */}
      <div
        className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-colors ${
          validation.valid
            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : 'bg-rose-950/30 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
        }`}
      >
        <div className="flex items-center gap-2">
          {validation.valid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <div>
            <span className="font-bold block">
              {validation.valid ? 'VALID MATHEMATICAL EXPRESSION' : 'SYNTAX ERROR IN FORMULA'}
            </span>
            <span className="text-[11px] opacity-80 font-sans">
              {validation.valid
                ? `Benchmark Test Evaluation: ${validation.sampleResult} pts (tech=85, exp=75, synergy=90, wins=2, team_size=4)`
                : validation.error}
            </span>
          </div>
        </div>

        {/* Apply & Save Button */}
        <button
          type="button"
          onClick={() => handleApply()}
          disabled={!validation.valid}
          className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            validation.valid
              ? isEnabled
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_#22d3ee] hover:bg-cyan-400'
                : 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-cyan-400'
              : 'bg-zinc-900 text-zinc-600 border border-zinc-900 cursor-not-allowed opacity-50'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Apply to Live Shortlist</span>
        </button>
      </div>

      {/* Live Sandbox Preview Table */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-zinc-200 uppercase tracking-wider">
              Live Sandbox Preview {teams.length > 0 ? `(${teams.length} Teams Cohort)` : '(Sample Applicants)'}
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500">
            Real-time simulation: Standard vs Custom Formula
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-black/60 text-xs font-mono">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase bg-zinc-950/60">
                <th className="py-2 px-3">Team</th>
                <th className="py-2 px-2 text-center">Size</th>
                <th className="py-2 px-2 text-right">Tech</th>
                <th className="py-2 px-2 text-right">Exp</th>
                <th className="py-2 px-2 text-right">Synergy</th>
                <th className="py-2 px-3 text-right">Default Score</th>
                <th className="py-2 px-3 text-right text-cyan-400 font-bold">Custom Formula</th>
                <th className="py-2 px-3 text-center">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {sampleTeams.map((team, idx) => {
                const tech = team.computed.technicalDepthScore;
                const exp = team.computed.projectExperienceScore;
                const synergy = team.computed.skillComplementarityScore;
                const completeness = team.computed.dataCompletenessScore;
                const defaultScore = team.computed.finalScore;

                const scope: MathScope = {
                  tech,
                  exp,
                  synergy,
                  roles: synergy,
                  completeness,
                  commits: 200,
                  stars: 12,
                  wins: 1,
                  hackathon_wins: 1,
                  team_size: team.members.length,
                  size: team.members.length,
                  skills: 6,
                  skills_count: 6,
                };

                const customScore = validation.valid
                  ? evaluateCustomFormula(expression, scope, defaultScore)
                  : defaultScore;

                const delta = Number((customScore - defaultScore).toFixed(2));

                return (
                  <tr key={team.id || idx} className="hover:bg-zinc-900/40">
                    <td className="py-2.5 px-3 font-semibold text-zinc-200 truncate max-w-[160px]">
                      {team.teamName}
                    </td>
                    <td className="py-2.5 px-2 text-center text-zinc-400">
                      {team.members.length}
                    </td>
                    <td className="py-2.5 px-2 text-right text-zinc-400">{tech}</td>
                    <td className="py-2.5 px-2 text-right text-zinc-400">{exp}</td>
                    <td className="py-2.5 px-2 text-right text-zinc-400">{synergy}</td>
                    <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">
                      {defaultScore.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-300 font-bold font-mono">
                      {customScore.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {delta > 0 ? (
                        <span className="text-emerald-400 font-bold text-[11px]">+{delta}</span>
                      ) : delta < 0 ? (
                        <span className="text-rose-400 font-bold text-[11px]">{delta}</span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
