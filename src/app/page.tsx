'use client';

import React, { useState, useMemo, useRef } from 'react';
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
import { useApp } from '@/context/AppContext';

export default function Home() {
  const {
    config,
    updateConfig: setConfig,
    baseTeams,
    setBaseTeams,
    rawHeaders,
    setRawHeaders,
    rawRows,
    setRawRows,
    columnMapping,
    setColumnMapping,
  } = useApp();

  // Modals state
  const [selectedTeam, setSelectedTeam] = useState<TeamRecord | null>(null);
  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [isSensitivityOpen, setIsSensitivityOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isGitHubSyncOpen, setIsGitHubSyncOpen] = useState(false);
  const [compareTeamAId, setCompareTeamAId] = useState<string | undefined>();
  const [compareTeamBId, setCompareTeamBId] = useState<string | undefined>();

  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        if (file.name.endsWith('.json')) {
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
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
    <div className="min-h-screen bg-[#030712] flex flex-col font-sans text-zinc-100 bg-cyber-grid selection:bg-cyan-500 selection:text-black">
      {/* Hidden file input for header upload button */}
      <input
        type="file"
        ref={uploadInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        accept=".csv,.tsv,.json"
        className="hidden"
      />

      {/* Cyber Navbar */}
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

      {/* Main Workspace / Dashboard - Fits right on the first page! */}
      <main ref={dashboardRef} className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {baseTeams.length === 0 ? (
          /* All-in-one first page: Unified telemetry + select file & folder right above the fold! */
          <UploadZone onFileUpload={handleFileUpload} />
        ) : (
          <div className="space-y-6">
            {/* Cyber Telemetry Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-cyan-950/80 shadow-md backdrop-blur-md">
                <span className="text-zinc-500 block uppercase">TOTAL REGISTERED:</span>
                <div className="text-xl font-black text-zinc-100 mt-0.5">{baseTeams.length} Teams</div>
              </div>
              <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-cyan-950/80 shadow-md backdrop-blur-md">
                <span className="text-zinc-500 block uppercase">SHORTLISTED TARGET:</span>
                <div className="text-xl font-black text-cyan-400 neon-glow-cyan mt-0.5">
                  {shortlistedCount} <span className="text-xs text-zinc-500 font-normal">/ {config.shortlistCount} target</span>
                </div>
              </div>
              <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-cyan-950/80 shadow-md backdrop-blur-md">
                <span className="text-zinc-500 block uppercase">ACTIVE PHILOSOPHY:</span>
                <div className="text-xs font-bold text-blue-400 truncate mt-1.5">
                  {config.presetName}
                </div>
              </div>
              <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-cyan-950/80 shadow-md backdrop-blur-md">
                <span className="text-zinc-500 block uppercase">REVIEW MODE:</span>
                <div className="text-xs font-bold text-purple-400 mt-1.5">
                  {config.anonymizeMode ? '🕶️ Blind (Anonymized)' : '👁️ Standard'}
                </div>
              </div>
            </div>

            {/* Split View: Config Panel (4 cols) & Cyber Leaderboard (8 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Tunable Configuration Panel (4 cols) */}
              <div className="lg:col-span-4 sticky top-18 space-y-4">
                <ConfigPanel
                  config={config}
                  onChange={setConfig}
                  totalTeamsCount={baseTeams.length}
                />
              </div>

              {/* Right Column: Incursion Cyber Leaderboard (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <TeamsTable
                  teams={rankedTeams}
                  config={config}
                  onSelectTeam={setSelectedTeam}
                  onCompareTeams={(teamAId) => handleLaunchCompare(teamAId)}
                  onOpenGitHubSync={() => setIsGitHubSyncOpen(true)}
                />
              </div>
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
