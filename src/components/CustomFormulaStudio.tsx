'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SelectionConfig, TeamRecord } from '@/types';
import { validateExpression } from '@/utils/mathEvaluator';
import { runFullShortlistingEngine } from '@/engine/scoring';
import {
  Code2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Calculator,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Trash2,
  BookmarkCheck,
  Check,
  Layers,
  ArrowRight,
  FolderOpen,
  Plus,
} from 'lucide-react';

export interface SavedFormulaItem {
  id: string;
  name: string;
  formula: string;
  desc?: string;
  isDefault?: boolean;
  createdAt: string;
}

const FORMULAS_STORAGE_KEY = 'incursion_saved_custom_formulas_v2';

const BUILTIN_PRESETS: SavedFormulaItem[] = [
  {
    id: 'preset-balanced',
    name: 'Balanced Core V1',
    formula: '0.40 * tech + 0.30 * exp + 0.20 * synergy + 0.10 * completeness',
    desc: 'Solid distributed weighting across all 4 candidate dimensions.',
    isDefault: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'preset-pedigree',
    name: 'LinkedIn Pedigree Weighted',
    formula: '0.35 * tech + 0.25 * exp + 0.20 * linkedin + 0.20 * synergy',
    desc: 'Factors verified professional seniority and company pedigree into the scoring matrix.',
    isDefault: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'preset-hackathon',
    name: 'Hackathon Champions Bias',
    formula: '0.50 * exp + 0.30 * tech + 0.20 * synergy + wins * 4',
    desc: 'Aggressively boosts teams with verified hackathon wins and battle-tested project experience.',
    isDefault: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'preset-solo',
    name: 'Solo Prodigy Equalizer',
    formula: '(tech * 0.55 + exp * 0.45) * (team_size == 1 ? 1.15 : 1.0)',
    desc: 'Grants an automatic 15% synergy boost to solo hackers who do all the work alone.',
    isDefault: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'preset-velocity',
    name: 'Logarithmic Velocity Scaling',
    formula: '0.45 * tech + 0.35 * exp + 0.20 * synergy + log10(commits + 1) * 3',
    desc: 'Applies diminishing returns to commit volume using logarithmic scaling.',
    isDefault: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'preset-merit-cap',
    name: 'Merit Capped Index',
    formula: 'min(100, 0.40 * tech + 0.35 * exp + 0.25 * synergy + (stars >= 10 ? 5 : 0))',
    desc: 'Capped at 100 max with a +5 bonus for having at least 10 open-source GitHub stars.',
    isDefault: true,
    createdAt: '2026-01-01',
  },
];

// Realistic fallback sample teams with rich data for instant sandbox scoring when no file is uploaded
const MOCK_SAMPLE_TEAMS: TeamRecord[] = [
  {
    id: 'mock-1',
    teamName: 'Team HyperDrive',
    rawRowData: {},
    members: [
      {
        id: 'mock-m1',
        name: 'Alex Chen',
        githubUrl: 'https://github.com/alexchen',
        linkedinUrl: 'https://linkedin.com/in/alexchen',
        rawSignals: {
          skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Tailwind', 'Go'],
          roleDistribution: { frontend: 0.4, backend: 0.6, ai_ml: 0, mobile: 0, design: 0, devops: 0, general: 0 },
          hackathonExperienceCount: 2,
          hasResume: true,
          hasGithub: true,
          hasLinkedin: true,
          hasPortfolio: true,
          completenessRatio: 1.0,
          githubUsername: 'alexchen',
          githubMetrics: {
            username: 'alexchen',
            publicRepos: 18,
            originalRepos: 15,
            forkedRepos: 3,
            totalStars: 22,
            estimatedContributions: 380,
            topLanguages: ['TypeScript', 'Go'],
            isSuspicious: false,
          },
          linkedinMetrics: {
            username: 'alexchen',
            seniorityLevel: 'senior',
            has500PlusConnections: true,
            isCustomVanitySlug: true,
            crossMatchesGithub: true,
            extractedSkills: ['TypeScript', 'PostgreSQL'],
            verifiedScore: 85,
          },
        },
      },
      {
        id: 'mock-m2',
        name: 'Sarah Kim',
        githubUrl: 'https://github.com/sarahkim',
        linkedinUrl: 'https://linkedin.com/in/sarahkim',
        rawSignals: {
          skills: ['Python', 'PyTorch', 'FastAPI', 'Docker'],
          roleDistribution: { frontend: 0, backend: 0.2, ai_ml: 0.8, mobile: 0, design: 0, devops: 0, general: 0 },
          hackathonExperienceCount: 3,
          hasResume: true,
          hasGithub: true,
          hasLinkedin: true,
          hasPortfolio: true,
          completenessRatio: 1.0,
          githubUsername: 'sarahkim',
          githubMetrics: {
            username: 'sarahkim',
            publicRepos: 12,
            originalRepos: 10,
            forkedRepos: 2,
            totalStars: 14,
            estimatedContributions: 210,
            topLanguages: ['Python'],
            isSuspicious: false,
          },
          linkedinMetrics: {
            username: 'sarahkim',
            seniorityLevel: 'mid',
            has500PlusConnections: true,
            isCustomVanitySlug: true,
            crossMatchesGithub: true,
            extractedSkills: ['PyTorch', 'Python'],
            verifiedScore: 75,
          },
        },
      },
    ],
    computed: {
      isEligible: true,
      failedFilters: [],
      passedFilters: [],
      technicalDepthScore: 88,
      projectExperienceScore: 84,
      skillComplementarityScore: 90,
      dataCompletenessScore: 100,
      finalScore: 86.8,
      rank: 1,
      coveredRoles: ['backend', 'ai_ml'],
      missingRoles: ['design'],
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
        id: 'mock-m3',
        name: 'Jordan Bell',
        githubUrl: 'https://github.com/jbell',
        rawSignals: {
          skills: ['Rust', 'Solana', 'React', 'C++'],
          roleDistribution: { frontend: 0.3, backend: 0.7, ai_ml: 0, mobile: 0, design: 0, devops: 0, general: 0 },
          hackathonExperienceCount: 1,
          hasResume: true,
          hasGithub: true,
          hasLinkedin: false,
          hasPortfolio: true,
          completenessRatio: 0.85,
          githubUsername: 'jbell',
          githubMetrics: {
            username: 'jbell',
            publicRepos: 24,
            originalRepos: 20,
            forkedRepos: 4,
            totalStars: 35,
            estimatedContributions: 520,
            topLanguages: ['Rust', 'C++'],
            isSuspicious: false,
          },
        },
      },
    ],
    computed: {
      isEligible: true,
      failedFilters: [],
      passedFilters: [],
      technicalDepthScore: 94,
      projectExperienceScore: 72,
      skillComplementarityScore: 65,
      dataCompletenessScore: 85,
      finalScore: 79.5,
      rank: 2,
      coveredRoles: ['backend'],
      missingRoles: ['ai_ml', 'design'],
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
        id: 'mock-m4',
        name: 'Maya Patel',
        githubUrl: 'https://github.com/mayap',
        rawSignals: {
          skills: ['React', 'CSS', 'Figma', 'UI/UX'],
          roleDistribution: { frontend: 0.5, backend: 0, ai_ml: 0, mobile: 0, design: 0.5, devops: 0, general: 0 },
          hackathonExperienceCount: 2,
          hasResume: true,
          hasGithub: true,
          hasLinkedin: true,
          hasPortfolio: true,
          completenessRatio: 0.95,
          githubUsername: 'mayap',
          githubMetrics: {
            username: 'mayap',
            publicRepos: 10,
            originalRepos: 8,
            forkedRepos: 2,
            totalStars: 8,
            estimatedContributions: 190,
            topLanguages: ['TypeScript', 'JavaScript'],
            isSuspicious: false,
          },
        },
      },
      {
        id: 'mock-m5',
        name: 'Leo Rossi',
        githubUrl: 'https://github.com/leor',
        rawSignals: {
          skills: ['Go', 'Docker', 'Kubernetes', 'Node.js'],
          roleDistribution: { frontend: 0, backend: 0.7, ai_ml: 0, mobile: 0, design: 0, devops: 0.3, general: 0 },
          hackathonExperienceCount: 1,
          hasResume: true,
          hasGithub: true,
          hasLinkedin: false,
          hasPortfolio: true,
          completenessRatio: 0.9,
          githubUsername: 'leor',
          githubMetrics: {
            username: 'leor',
            publicRepos: 15,
            originalRepos: 12,
            forkedRepos: 3,
            totalStars: 16,
            estimatedContributions: 340,
            topLanguages: ['Go'],
            isSuspicious: false,
          },
        },
      },
    ],
    computed: {
      isEligible: true,
      failedFilters: [],
      passedFilters: [],
      technicalDepthScore: 78,
      projectExperienceScore: 80,
      skillComplementarityScore: 92,
      dataCompletenessScore: 92,
      finalScore: 82.1,
      rank: 3,
      coveredRoles: ['frontend', 'backend', 'design'],
      missingRoles: ['ai_ml'],
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
        id: 'mock-m6',
        name: 'Devin Vance',
        githubUrl: 'https://github.com/devv',
        rawSignals: {
          skills: ['C++', 'Reverse Engineering', 'Assembly', 'Python'],
          roleDistribution: { frontend: 0, backend: 0.8, ai_ml: 0, mobile: 0, design: 0, devops: 0.2, general: 0 },
          hackathonExperienceCount: 0,
          hasResume: true,
          hasGithub: true,
          hasLinkedin: false,
          hasPortfolio: false,
          completenessRatio: 0.75,
          githubUsername: 'devv',
          githubMetrics: {
            username: 'devv',
            publicRepos: 8,
            originalRepos: 7,
            forkedRepos: 1,
            totalStars: 5,
            estimatedContributions: 140,
            topLanguages: ['C++'],
            isSuspicious: false,
          },
        },
      },
    ],
    computed: {
      isEligible: true,
      failedFilters: [],
      passedFilters: [],
      technicalDepthScore: 82,
      projectExperienceScore: 60,
      skillComplementarityScore: 68,
      dataCompletenessScore: 75,
      finalScore: 71.5,
      rank: 4,
      coveredRoles: ['backend'],
      missingRoles: ['frontend', 'ai_ml', 'design'],
      missingDataWarnings: [],
      antiCheatFlags: [],
    },
  },
];

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

  // Saved formula library state
  const [savedFormulas, setSavedFormulas] = useState<SavedFormulaItem[]>(BUILTIN_PRESETS);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [newSaveName, setNewSaveName] = useState<string>('');
  const [newSaveDesc, setNewSaveDesc] = useState<string>('');
  const [previewLimit, setPreviewLimit] = useState<number>(6);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Load saved custom formulas from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FORMULAS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge custom user presets with builtin presets
          const userFormulas = parsed.filter((f) => !f.isDefault);
          setSavedFormulas([...userFormulas, ...BUILTIN_PRESETS]);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage when formulas change
  const persistFormulas = (updatedList: SavedFormulaItem[]) => {
    setSavedFormulas(updatedList);
    try {
      localStorage.setItem(FORMULAS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }
  };

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
    { name: 'linkedin', label: 'LinkedIn Score', desc: 'Normalized profile score from seniority, pedigree & connections (0-100)' },
    { name: 'linkedin_seniority', label: 'Seniority Points', desc: 'Points awarded for Founder/Senior/Lead level (0-30)' },
    { name: 'linkedin_connections', label: '500+ Connections', desc: '1 if candidate has 500+ network milestone, else 0' },
    { name: 'linkedin_verified', label: 'LinkedIn Verified', desc: 'Ratio of team members with verified LinkedIn links (0-1)' },
    { name: 'commits', label: 'GitHub Commits', desc: 'Total estimated annual commits volume' },
    { name: 'stars', label: 'Repo Stars', desc: 'Total GitHub original repository stars' },
    { name: 'wins', label: 'Hackathon Wins', desc: 'Verified hackathon placements & trophies count' },
    { name: 'team_size', label: 'Team Size', desc: 'Number of members registered on the team' },
    { name: 'skills', label: 'Skills Count', desc: 'Count of unique verified candidate technologies' },
    { name: 'work_exp', label: 'Work Experience', desc: 'Points earned from verified company internships and jobs' },
    { name: 'research_intern', label: 'Research Internships', desc: 'Count of verified research roles in IIT/NIT/IIIT' },
    { name: 'tier1_company', label: 'Tier-1 Companies', desc: 'Count of FAANG/Unicorn experiences' },
    { name: 'acm_score', label: 'ACM Platform Score', desc: 'Official ACM score fetched from acmnitsurat.in' },
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

  // Master switch toggle
  const handleToggle = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    if (!nextState) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
    onUpdateConfig({
      ...config,
      customFormulaEnabled: nextState,
      customFormulaExpression: expression.trim(),
      customFormulaName: formulaName.trim() || 'Custom Scoring Model',
    });
    showToast(nextState ? 'Custom Formula activated on live shortlist!' : 'Switched back to standard scoring.');
  };

  // Explicit Apply to Live Shortlist button
  const handleApplyToLive = () => {
    setIsEnabled(true);
    setIsExpanded(true);
    onUpdateConfig({
      ...config,
      customFormulaEnabled: true,
      customFormulaExpression: expression.trim(),
      customFormulaName: formulaName.trim() || 'Custom Scoring Model',
    });
    showToast('Custom formula activated & applied to live leaderboard!');
  };

  // Save current formula into user's persistent library
  const handleSaveFormulaToLibrary = () => {
    const name = newSaveName.trim() || formulaName.trim() || 'Custom Formula';
    const newEntry: SavedFormulaItem = {
      id: `user-formula-${Date.now()}`,
      name,
      formula: expression.trim(),
      desc: newSaveDesc.trim() || 'User-defined scoring formula',
      isDefault: false,
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newEntry, ...savedFormulas.filter((f) => f.id !== newEntry.id)];
    persistFormulas(updated);
    setFormulaName(name);
    setIsSaveModalOpen(false);
    setNewSaveName('');
    setNewSaveDesc('');
    showToast(`Saved "${name}" to your Custom Formula Library!`);
  };

  // Load a saved formula into the editor
  const handleLoadFormula = (item: SavedFormulaItem) => {
    setExpression(item.formula);
    setFormulaName(item.name);
    showToast(`Loaded "${item.name}" into editor.`);
  };

  // Load AND immediately apply to live leaderboard
  const handleLoadAndApply = (item: SavedFormulaItem) => {
    setExpression(item.formula);
    setFormulaName(item.name);
    setIsEnabled(true);
    setIsExpanded(true);
    onUpdateConfig({
      ...config,
      customFormulaEnabled: true,
      customFormulaExpression: item.formula,
      customFormulaName: item.name,
    });
    showToast(`Activated "${item.name}" on live shortlist!`);
  };

  // Delete a user-saved formula
  const handleDeleteFormula = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this formula from your saved library?')) {
      const updated = savedFormulas.filter((f) => f.id !== id);
      persistFormulas(updated);
      showToast('Formula deleted from library.');
    }
  };

  // --- LIVE SANDBOX PREVIEW ENGINE ---
  // Select which cohort to preview: Real active cohort (if uploaded) or realistic sample candidates
  const previewCohort = useMemo(() => {
    if (teams && teams.length > 0) {
      return teams.slice(0, previewLimit);
    }
    return MOCK_SAMPLE_TEAMS.slice(0, previewLimit);
  }, [teams, previewLimit]);

  // 1. Run engine WITHOUT custom formula to get real, non-zero standard baseline scores
  const standardBaselineTeams = useMemo(() => {
    if (previewCohort.length === 0) return [];
    return runFullShortlistingEngine(previewCohort, {
      ...config,
      customFormulaEnabled: false,
    });
  }, [previewCohort, config]);

  // 2. Run engine WITH the user's custom formula to get real custom evaluated scores
  const customEvaluatedTeams = useMemo(() => {
    if (previewCohort.length === 0) return [];
    if (!validation.valid || !expression.trim()) {
      return standardBaselineTeams;
    }
    return runFullShortlistingEngine(previewCohort, {
      ...config,
      customFormulaEnabled: true,
      customFormulaExpression: expression.trim(),
    });
  }, [previewCohort, config, expression, validation.valid, standardBaselineTeams]);

  // Compact collapsed bar when custom formula is OFF and not expanded
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
              Standard scoring active. Turn ON to author, test, and save arbitrary scoring equations.
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
            onClick={handleToggle}
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

      {/* Floating Action Notice Toast */}
      {toastNotice && (
        <div className="absolute top-4 right-4 z-30 bg-black/95 border border-cyan-400 text-cyan-300 text-xs px-3.5 py-2 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 font-mono animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}

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
              Write arbitrary math equations using candidate signals. Overrides standard linear weights.
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
            <span className={`text-xs font-bold ${isEnabled ? 'text-cyan-300' : 'text-zinc-500'}`}>
              {isEnabled ? 'CUSTOM FORMULA: ACTIVE' : 'CUSTOM FORMULA: OFF'}
            </span>
            <button
              type="button"
              onClick={handleToggle}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                isEnabled ? 'bg-cyan-500 shadow-[0_0_15px_#22d3ee]' : 'bg-zinc-800'
              }`}
              title={isEnabled ? 'Click to disable custom formula' : 'Click to enable custom formula'}
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

      {/* Formula Naming, Action Bar & Save to Library */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formula Name */}
        <div className="lg:col-span-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-300 block">Formula Name / Title:</label>
            <button
              type="button"
              onClick={() => {
                setNewSaveName(formulaName);
                setIsSaveModalOpen(true);
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
              title="Save current expression into your formula bank for future use"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save to Library</span>
            </button>
          </div>
          <input
            type="text"
            value={formulaName}
            onChange={(e) => setFormulaName(e.target.value)}
            placeholder="e.g. SIH 2026 Finals Bias Formula"
            className="w-full bg-black/70 border border-zinc-800 focus:border-cyan-400 px-3 py-2 rounded-lg text-cyan-300 font-mono text-xs outline-none transition-colors"
          />
        </div>

        {/* Quick Presets & Saved Bank Shortcuts */}
        <div className="lg:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-300 block">
              Saved Formula Library ({savedFormulas.length}):
            </label>
            <span className="text-[10px] text-zinc-500 font-sans">
              Click preset to load into editor
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto pr-1">
            {savedFormulas.map((preset) => {
              const isCurrent = expression.trim() === preset.formula.trim();
              return (
                <div
                  key={preset.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
                    isCurrent
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-zinc-900/90 hover:bg-cyan-950/40 text-zinc-300 hover:text-cyan-300 border-zinc-800 hover:border-cyan-500/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleLoadFormula(preset)}
                    className="cursor-pointer font-medium hover:underline text-left truncate max-w-[170px]"
                    title={`${preset.desc || preset.name}\nFormula: ${preset.formula}`}
                  >
                    {!preset.isDefault ? '💾 ' : '⚡ '}
                    {preset.name}
                  </button>

                  {!preset.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFormula(preset.id, e)}
                      className="text-zinc-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer ml-1"
                      title="Delete saved formula"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inline Save Formula Modal / Drawer */}
      {isSaveModalOpen && (
        <div className="bg-black/90 border border-cyan-500/60 rounded-xl p-4 space-y-3 animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
              <BookmarkPlus className="w-4 h-4 text-cyan-400" />
              <span>SAVE FORMULA TO REUSABLE BANK</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
            >
              ✕ Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-zinc-400 block font-bold text-[11px]">Formula Title:</label>
              <input
                type="text"
                value={newSaveName}
                onChange={(e) => setNewSaveName(e.target.value)}
                placeholder="e.g. Web3 Speed & Stars Index"
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-400 px-3 py-1.5 rounded-lg text-cyan-300 text-xs font-mono outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 block font-bold text-[11px]">Notes / Purpose (Optional):</label>
              <input
                type="text"
                value={newSaveDesc}
                onChange={(e) => setNewSaveDesc(e.target.value)}
                placeholder="e.g. Tailored for SIH hackathon team selection"
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-400 px-3 py-1.5 rounded-lg text-zinc-300 text-xs font-mono outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500 truncate max-w-[300px]">
              Expression: <code className="text-cyan-400">{expression}</code>
            </span>
            <button
              type="button"
              onClick={handleSaveFormulaToLibrary}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Formula</span>
            </button>
          </div>
        </div>
      )}

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
          onClick={handleApplyToLive}
          disabled={!validation.valid}
          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            validation.valid
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_#22d3ee] hover:bg-cyan-400'
              : 'bg-zinc-900 text-zinc-600 border border-zinc-900 cursor-not-allowed opacity-50'
          }`}
          title="Activate this custom formula and apply it immediately to the candidate leaderboard"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          <span>Apply to Live Shortlist</span>
        </button>
      </div>

      {/* Live Sandbox Preview Table */}
      <div className="space-y-2.5 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-zinc-200 uppercase tracking-wider">
              Live Sandbox Preview {teams.length > 0 ? `(${teams.length} Teams Cohort)` : '(Sample Applicants)'}
            </h3>
            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
              REAL-TIME SIMULATION
            </span>
          </div>

          {/* Cohort preview count limit switch */}
          {teams.length > 4 && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-zinc-500">Preview:</span>
              {[4, 8, teams.length].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPreviewLimit(count)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    previewLimit === count
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {count === teams.length ? `All (${teams.length})` : `${count} Teams`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-black/60 text-xs font-mono shadow-inner">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase bg-zinc-950/80">
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-2 text-center">Size</th>
                <th className="py-2.5 px-2 text-right">Tech</th>
                <th className="py-2.5 px-2 text-right">Exp</th>
                <th className="py-2.5 px-2 text-right">Synergy</th>
                <th className="py-2.5 px-2 text-right">Completeness</th>
                <th className="py-2.5 px-3 text-right">Default Score</th>
                <th className="py-2.5 px-3 text-right text-cyan-400 font-bold">Custom Formula</th>
                <th className="py-2.5 px-3 text-center">Impact Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {standardBaselineTeams.map((standardTeam, idx) => {
                const customTeam = customEvaluatedTeams[idx] || standardTeam;

                const tech = standardTeam.computed.technicalDepthScore;
                const exp = standardTeam.computed.projectExperienceScore;
                const synergy = standardTeam.computed.skillComplementarityScore;
                const completeness = standardTeam.computed.dataCompletenessScore;
                const defaultScore = standardTeam.computed.finalScore;
                const customScore = customTeam.computed.finalScore;

                const delta = Number((customScore - defaultScore).toFixed(2));

                return (
                  <tr key={standardTeam.id || idx} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-zinc-200 truncate max-w-[160px]">
                      {standardTeam.teamName}
                    </td>
                    <td className="py-2.5 px-2 text-center text-zinc-400">
                      {standardTeam.members.length}
                    </td>
                    <td className="py-2.5 px-2 text-right text-zinc-400 font-mono">{tech}</td>
                    <td className="py-2.5 px-2 text-right text-zinc-400 font-mono">{exp}</td>
                    <td className="py-2.5 px-2 text-right text-zinc-400 font-mono">{synergy}</td>
                    <td className="py-2.5 px-2 text-right text-zinc-400 font-mono">{completeness}%</td>
                    <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">
                      {defaultScore.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-300 font-bold font-mono">
                      {customScore.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {delta > 0 ? (
                        <span className="text-emerald-400 font-bold text-[11px]">+{delta.toFixed(2)}</span>
                      ) : delta < 0 ? (
                        <span className="text-rose-400 font-bold text-[11px]">{delta.toFixed(2)}</span>
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
        <p className="text-[10px] text-zinc-500 font-sans italic">
          * Sandbox simulation updates instantaneously as you type or change variables. Click &ldquo;Apply to Live Shortlist&rdquo; to push this scoring equation to the main candidate leaderboard.
        </p>
      </div>
    </div>
  );
};
