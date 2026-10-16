'use client';

import React, { useState, useMemo } from 'react';
import { ColumnMappingConfig, SelectionConfig, TeamRecord } from '@/types';
import { DEFAULT_CONFIG } from '@/presets/defaultPresets';
import { parseCSVString, parseRawDataToTeams } from '@/engine/parser';
import { runFullShortlistingEngine } from '@/engine/scoring';
import { exportShortlistToCSV, exportShortlistWithConfigJSON } from '@/utils/exportUtils';

import { Navbar } from '@/components/Navbar';
import { UploadZone } from '@/components/UploadZone';
import { ConfigPanel } from '@/components/ConfigPanel';
import { TeamsTable } from '@/components/TeamsTable';
import { TeamModal } from '@/components/TeamModal';
import { ColumnMapperModal } from '@/components/ColumnMapperModal';
import { PairwiseCompareModal } from '@/components/PairwiseCompareModal';
import { SensitivityModal } from '@/components/SensitivityModal';
import { GitHubSyncModal } from '@/components/GitHubSyncModal';

export default function Home() {
  const [config, setConfig] = useState<SelectionConfig>(DEFAULT_CONFIG);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig | null>(null);
  const [baseTeams, setBaseTeams] = useState<TeamRecord[]>([]);

  // Modals state
  const [selectedTeam, setSelectedTeam] = useState<TeamRecord | null>(null);
  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [isSensitivityOpen, setIsSensitivityOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isGitHubSyncOpen, setIsGitHubSyncOpen] = useState(false);
  const [compareTeamAId, setCompareTeamAId] = useState<string | undefined>();
  const [compareTeamBId, setCompareTeamBId] = useState<string | undefined>();

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        if (file.name.endsWith('.json')) {
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              // Convert JSON array to rows
              const headers = Object.keys(parsed[0] || {});
              const res = parseCSVString(
                [headers.join(','), ...parsed.map((obj) => Object.values(obj).join(','))].join('\n')
              );
              setRawHeaders(res.headers);
              setRawRows(res.rawRows);
              setColumnMapping(res.detectedMapping);
              setBaseTeams(res.teams);
            }
          } catch (err) {
            alert('Failed to parse JSON file.');
          }
        } else {
          // CSV / TSV
          const res = parseCSVString(content);
          setRawHeaders(res.headers);
          setRawRows(res.rawRows);
          setColumnMapping(res.detectedMapping);
          setBaseTeams(res.teams);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSaveMapping = (updatedMapping: ColumnMappingConfig) => {
    setColumnMapping(updatedMapping);
    if (rawRows.length > 0) {
      const remappedTeams = parseRawDataToTeams(rawRows, updatedMapping);
      setBaseTeams(remappedTeams);
    }
    setIsMapperOpen(false);
  };

  const handleUpdateManualStatus = (
    teamId: string,
    status: 'pinned' | 'excluded' | 'waitlisted' | 'normal',
    note?: string
  ) => {
    setBaseTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            computed: {
              ...t.computed,
              manualStatus: status,
              manualNote: note,
            },
          };
        }
        return t;
      })
    );
    // Also update selectedTeam state if open
    setSelectedTeam((prev) =>
      prev && prev.id === teamId
        ? {
            ...prev,
            computed: {
              ...prev.computed,
              manualStatus: status,
              manualNote: note,
            },
          }
        : prev
    );
  };

  // Instant reactive scoring & re-ranking!
  const rankedTeams = useMemo(() => {
    if (baseTeams.length === 0) return [];
    return runFullShortlistingEngine(baseTeams, config);
  }, [baseTeams, config]);

  const shortlistedCount = useMemo(() => {
    return rankedTeams.filter(
      (t) =>
        t.computed.manualStatus === 'pinned' ||
        (t.computed.rank <= config.shortlistCount &&
          t.computed.isEligible &&
          t.computed.manualStatus !== 'excluded')
    ).length;
  }, [rankedTeams, config.shortlistCount]);

  const handleLaunchCompare = (teamAId?: string, teamBId?: string) => {
    setCompareTeamAId(teamAId);
    setCompareTeamBId(teamBId);
    setIsCompareOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800">
      {/* Navbar */}
      <Navbar
        config={config}
        onUpdateConfig={setConfig}
        onFileUpload={handleFileUpload}
        onOpenMapper={() => setIsMapperOpen(true)}
        onOpenSensitivity={() => setIsSensitivityOpen(true)}
        onOpenCompare={() => handleLaunchCompare()}
        onOpenGitHubSync={() => setIsGitHubSyncOpen(true)}
        onExportCSV={() => exportShortlistToCSV(rankedTeams, config, config.shortlistCount)}
        onExportJSON={() => exportShortlistWithConfigJSON(rankedTeams, config, config.shortlistCount)}
        hasData={baseTeams.length > 0}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {baseTeams.length === 0 ? (
          <UploadZone onFileUpload={handleFileUpload} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Tunable Configuration Panel (4 cols) */}
            <div className="lg:col-span-4 sticky top-18 space-y-4">
              <ConfigPanel
                config={config}
                onChange={setConfig}
                totalTeamsCount={baseTeams.length}
              />
            </div>

            {/* Right Column: Ranked Shortlist Table (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Stat bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500">Total Registered:</span>
                  <div className="text-xl font-bold text-slate-800">{baseTeams.length} Teams</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500">Shortlisted:</span>
                  <div className="text-xl font-bold text-emerald-600">
                    {shortlistedCount} <span className="text-xs text-slate-400 font-normal">/ {config.shortlistCount} target</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500">Active Philosophy:</span>
                  <div className="text-xs font-bold text-blue-700 truncate mt-1">
                    {config.presetName}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-500">Review Mode:</span>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {config.anonymizeMode ? '🕶️ Blind (Anonymized)' : '👁️ Standard'}
                  </div>
                </div>
              </div>

              {/* Table */}
              <TeamsTable
                teams={rankedTeams}
                config={config}
                onSelectTeam={setSelectedTeam}
                onCompareTeams={(teamAId) => handleLaunchCompare(teamAId)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Team Drilldown Modal */}
      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          config={config}
          onClose={() => setSelectedTeam(null)}
          onUpdateManualStatus={handleUpdateManualStatus}
        />
      )}

      {/* Column Mapper Modal */}
      {isMapperOpen && columnMapping && (
        <ColumnMapperModal
          headers={rawHeaders}
          currentMapping={columnMapping}
          onSave={handleSaveMapping}
          onClose={() => setIsMapperOpen(false)}
        />
      )}

      {/* Pairwise Comparison Modal */}
      {isCompareOpen && (
        <PairwiseCompareModal
          teams={rankedTeams}
          config={config}
          initialTeamAId={compareTeamAId}
          initialTeamBId={compareTeamBId}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* Sensitivity Analysis Modal */}
      {isSensitivityOpen && (
        <SensitivityModal
          teams={rankedTeams}
          config={config}
          onClose={() => setIsSensitivityOpen(false)}
        />
      )}

      {/* GitHub Multi-Token & Sync Modal */}
      {isGitHubSyncOpen && (
        <GitHubSyncModal
          teams={baseTeams}
          onUpdateTeamsWithLiveStats={setBaseTeams}
          onClose={() => setIsGitHubSyncOpen(false)}
        />
      )}
    </div>
  );
}
