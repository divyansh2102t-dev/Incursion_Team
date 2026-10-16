'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColumnMappingConfig, ScoringHistoryEntry, SelectionConfig, TeamRecord } from '@/types';
import { DEFAULT_CONFIG, DEFAULT_FORMULA_COEFFICIENTS } from '@/presets/defaultPresets';
import { runFullShortlistingEngine } from '@/engine/scoring';

interface AppContextType {
  config: SelectionConfig;
  updateConfig: (newConfig: SelectionConfig) => void;
  previousConfig: SelectionConfig | null;
  revertToPreviousConfig: () => boolean;
  resetToDefaultFormulas: () => void;
  baseTeams: TeamRecord[];
  setBaseTeams: React.Dispatch<React.SetStateAction<TeamRecord[]>>;
  rawHeaders: string[];
  setRawHeaders: React.Dispatch<React.SetStateAction<string[]>>;
  rawRows: Record<string, string>[];
  setRawRows: React.Dispatch<React.SetStateAction<Record<string, string>[]>>;
  columnMapping: ColumnMappingConfig | null;
  setColumnMapping: React.Dispatch<React.SetStateAction<ColumnMappingConfig | null>>;
  scoringHistory: ScoringHistoryEntry[];
  saveScoringSnapshot: (
    name?: string,
    notes?: string,
    teamsOverride?: TeamRecord[],
    configOverride?: SelectionConfig
  ) => ScoringHistoryEntry | null;
  renameHistoryEntry: (id: string, newName: string) => void;
  deleteHistoryEntry: (id: string) => void;
  clearAllHistory: () => void;
  restoreHistoryEntry: (id: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CONFIG_STORAGE_KEY = 'incursion_selection_config_v2';
const TEAMS_STORAGE_KEY = 'incursion_base_teams_v2';
const SCORING_HISTORY_KEY = 'incursion_scoring_history_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<SelectionConfig>(DEFAULT_CONFIG);
  const [previousConfig, setPreviousConfig] = useState<SelectionConfig | null>(null);
  const [baseTeams, setBaseTeams] = useState<TeamRecord[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig | null>(null);
  const [scoringHistory, setScoringHistory] = useState<ScoringHistoryEntry[]>([]);

  // Load config, teams, and scoring history from localStorage on initial mount
  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        setConfigState({
          ...DEFAULT_CONFIG,
          ...parsed,
          formulaCoefficients: {
            ...DEFAULT_FORMULA_COEFFICIENTS,
            ...(parsed.formulaCoefficients || {}),
          },
        });
      }
      const storedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (storedTeams) {
        setBaseTeams(JSON.parse(storedTeams));
      }
      const storedHistory = localStorage.getItem(SCORING_HISTORY_KEY);
      if (storedHistory) {
        setScoringHistory(JSON.parse(storedHistory));
      }
    } catch {
      // ignore
    }
  }, []);

  const updateConfig = (newConfig: SelectionConfig) => {
    setPreviousConfig(config); // Save for undo/revert
    setConfigState(newConfig);
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  const revertToPreviousConfig = (): boolean => {
    if (!previousConfig) return false;
    const toRestore = previousConfig;
    setPreviousConfig(config);
    setConfigState(toRestore);
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(toRestore));
    } catch {
      // ignore
    }
    return true;
  };

  const resetToDefaultFormulas = () => {
    setPreviousConfig(config);
    const updated: SelectionConfig = {
      ...config,
      formulaCoefficients: { ...DEFAULT_FORMULA_COEFFICIENTS },
    };
    setConfigState(updated);
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Sync teams to localStorage when modified
  useEffect(() => {
    if (baseTeams.length > 0) {
      try {
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(baseTeams));
      } catch {
        // quota exceeded or private mode
      }
    }
  }, [baseTeams]);

  // Scoring History Operations
  const saveScoringSnapshot = (
    name?: string,
    notes?: string,
    teamsOverride?: TeamRecord[],
    configOverride?: SelectionConfig
  ): ScoringHistoryEntry | null => {
    const teams = teamsOverride || baseTeams;
    const cfg = configOverride || config;
    if (!teams || teams.length === 0) return null;

    const ranked = runFullShortlistingEngine(teams, cfg);
    const shortlistedCount = ranked.filter(
      (t) =>
        t.computed.manualStatus === 'pinned' ||
        (t.computed.rank <= cfg.shortlistCount &&
          t.computed.isEligible &&
          t.computed.manualStatus !== 'excluded')
    ).length;

    const scores = ranked.map((t) => t.computed.finalScore);
    const avgScore =
      scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
        : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const disqualified = ranked.filter((t) => !t.computed.isEligible).length;
    const pinned = ranked.filter((t) => t.computed.manualStatus === 'pinned').length;
    const excluded = ranked.filter((t) => t.computed.manualStatus === 'excluded').length;

    const runNumber = scoringHistory.length + 1;
    const defaultName = `Run #${runNumber}: ${cfg.presetName} (Top ${cfg.shortlistCount})`;

    // Create lightweight snapshot of teams (omit heavy raw text blobs to prevent localStorage quota issues)
    const compactTeams: TeamRecord[] = teams.map((t) => ({
      id: t.id,
      teamName: t.teamName,
      members: t.members,
      rawRowData: {},
      computed: t.computed,
    }));

    const newEntry: ScoringHistoryEntry = {
      id: 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      name: name && name.trim().length > 0 ? name.trim() : defaultName,
      notes: notes?.trim() || undefined,
      totalTeams: teams.length,
      shortlistTarget: cfg.shortlistCount,
      shortlistedCount,
      averageScore: avgScore,
      highestScore: maxScore,
      disqualifiedCount: disqualified,
      pinnedCount: pinned,
      excludedCount: excluded,
      configSnapshot: JSON.parse(JSON.stringify(cfg)),
      topTeamsSnapshot: ranked.slice(0, Math.min(30, ranked.length)).map((t) => ({
        rank: t.computed.rank,
        teamName: t.teamName,
        teamSize: t.members.length,
        finalScore: t.computed.finalScore,
        isEligible: t.computed.isEligible,
        status:
          t.computed.manualStatus === 'pinned'
            ? 'pinned'
            : t.computed.manualStatus === 'excluded'
            ? 'excluded'
            : !t.computed.isEligible
            ? 'rejected'
            : t.computed.rank <= cfg.shortlistCount
            ? 'shortlisted'
            : 'waitlist',
        scoreBreakdown: {
          technicalDepth: t.computed.technicalDepthScore,
          projectExperience: t.computed.projectExperienceScore,
          skillComplementarity: t.computed.skillComplementarityScore,
          dataCompleteness: t.computed.dataCompletenessScore,
        },
      })),
      baseTeamsSnapshot: compactTeams,
    };

    const updated = [newEntry, ...scoringHistory].slice(0, 30); // Keep last 30 runs
    setScoringHistory(updated);
    try {
      localStorage.setItem(SCORING_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // quota safeguard
    }
    return newEntry;
  };

  const renameHistoryEntry = (id: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = scoringHistory.map((item) =>
      item.id === id ? { ...item, name: newName.trim() } : item
    );
    setScoringHistory(updated);
    try {
      localStorage.setItem(SCORING_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const deleteHistoryEntry = (id: string) => {
    const updated = scoringHistory.filter((item) => item.id !== id);
    setScoringHistory(updated);
    try {
      localStorage.setItem(SCORING_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllHistory = () => {
    setScoringHistory([]);
    try {
      localStorage.removeItem(SCORING_HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  const restoreHistoryEntry = (id: string): boolean => {
    const entry = scoringHistory.find((item) => item.id === id);
    if (!entry) return false;
    setPreviousConfig(config);
    setConfigState(entry.configSnapshot);
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(entry.configSnapshot));
    } catch {
      // ignore
    }

    if (entry.baseTeamsSnapshot && entry.baseTeamsSnapshot.length > 0) {
      setBaseTeams(entry.baseTeamsSnapshot);
      try {
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(entry.baseTeamsSnapshot));
      } catch {
        // ignore
      }
    }
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        config,
        updateConfig,
        previousConfig,
        revertToPreviousConfig,
        resetToDefaultFormulas,
        baseTeams,
        setBaseTeams,
        rawHeaders,
        setRawHeaders,
        rawRows,
        setRawRows,
        columnMapping,
        setColumnMapping,
        scoringHistory,
        saveScoringSnapshot,
        renameHistoryEntry,
        deleteHistoryEntry,
        clearAllHistory,
        restoreHistoryEntry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
