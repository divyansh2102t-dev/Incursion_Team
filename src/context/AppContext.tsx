'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColumnMappingConfig, SelectionConfig, TeamRecord } from '@/types';
import { DEFAULT_CONFIG, DEFAULT_FORMULA_COEFFICIENTS } from '@/presets/defaultPresets';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CONFIG_STORAGE_KEY = 'incursion_selection_config_v2';
const TEAMS_STORAGE_KEY = 'incursion_base_teams_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<SelectionConfig>(DEFAULT_CONFIG);
  const [previousConfig, setPreviousConfig] = useState<SelectionConfig | null>(null);
  const [baseTeams, setBaseTeams] = useState<TeamRecord[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig | null>(null);

  // Load config and teams from localStorage on initial mount
  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        // Ensure formulaCoefficients is merged in case older config in storage
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
