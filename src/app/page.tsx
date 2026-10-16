'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ColumnMappingConfig, SelectionConfig, TeamRecord } from '@/types';
import { DEFAULT_CONFIG } from '@/presets/defaultPresets';
import { parseCSVString, parseRawDataToTeams, parseExcelArrayBuffer } from '@/engine/parser';
import { runFullShortlistingEngine } from '@/engine/scoring';
import { exportShortlistToCSV, exportShortlistWithConfigJSON } from '@/utils/exportUtils';
import { parseLocalPdfFile, matchResumeToCandidate } from '@/engine/resumeParser';

import { Navbar } from '@/components/Navbar';
import { UploadZone } from '@/components/UploadZone';
import { ConfigPanel } from '@/components/ConfigPanel';
import { TeamsTable } from '@/components/TeamsTable';
import { TeamModal } from '@/components/TeamModal';
import { ColumnMapperModal } from '@/components/ColumnMapperModal';
import { PairwiseCompareModal } from '@/components/PairwiseCompareModal';
import { SensitivityModal } from '@/components/SensitivityModal';
import { GitHubSyncModal } from '@/components/GitHubSyncModal';
import { ResumeSyncModal } from '@/components/ResumeSyncModal';
import { ParallelSyncModal } from '@/components/ParallelSyncModal';
import { ScoringHistoryModal } from '@/components/ScoringHistoryModal';
import {
  BookmarkPlus,
  History,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  Trash2,
  LayoutDashboard,
  Zap,
  FileText,
} from 'lucide-react';
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
    scoringHistory,
    saveScoringSnapshot,
    clearCohort,
  } = useApp();

  // Modals & UI state
  const [selectedTeam, setSelectedTeam] = useState<TeamRecord | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('dashboard');
  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [isSensitivityOpen, setIsSensitivityOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isGitHubSyncOpen, setIsGitHubSyncOpen] = useState(false);
  const [isResumeSyncOpen, setIsResumeSyncOpen] = useState(false);
  const [isParallelSyncOpen, setIsParallelSyncOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
  const [compareTeamAId, setCompareTeamAId] = useState<string | undefined>();
  const [compareTeamBId, setCompareTeamBId] = useState<string | undefined>();

  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const enrichWithPdfs = async (teams: TeamRecord[], pdfFiles: File[]): Promise<TeamRecord[]> => {
    let updated = [...teams];
    const candidateList = updated.flatMap((t) =>
      t.members.map((m) => ({ memberId: m.id, name: m.name, email: m.email }))
    );

    for (const pdf of pdfFiles) {
      try {
        const parsedPdf = await parseLocalPdfFile(pdf);
        const matchedId = matchResumeToCandidate(pdf.name, parsedPdf.snippet || '', candidateList);
        if (matchedId && parsedPdf.success) {
          updated = updated.map((team) => ({
            ...team,
            members: team.members.map((member) => {
              if (member.id === matchedId) {
                return {
                  ...member,
                  rawSignals: {
                    ...member.rawSignals,
                    skills: Array.from(new Set([...member.rawSignals.skills, ...parsedPdf.skills])),
                    hackathonExperienceCount: Math.max(
                      member.rawSignals.hackathonExperienceCount || 0,
                      parsedPdf.hackathonMentionCount
                    ),
                    hasResume: true,
                  },
                };
              }
              return member;
            }),
          }));
        }
      } catch {
        // Ignore corrupt local pdf
      }
    }
    return updated;
  };

  const handleFileUpload = (file: File, pdfFiles?: File[]) => {
    // Check if Excel spreadsheet (.xlsx, .xls)
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const arrayReader = new FileReader();
      arrayReader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          try {
            const res = parseExcelArrayBuffer(buffer);
            setRawHeaders(res.headers);
            setRawRows(res.rawRows);
            setColumnMapping(res.detectedMapping);
            let initialTeams = res.teams;

            if (pdfFiles && pdfFiles.length > 0 && initialTeams.length > 0) {
              initialTeams = await enrichWithPdfs(initialTeams, pdfFiles);
            }

            setBaseTeams(initialTeams);
            saveScoringSnapshot(`Intake: ${file.name.replace(/\.[^/.]+$/, '')}`, undefined, initialTeams);
            setCurrentView('dashboard');
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to parse Excel file.';
            alert(msg);
          }
        }
      };
      arrayReader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (content) {
        let initialTeams: TeamRecord[] = [];
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
              initialTeams = res.teams;
            }
          } catch {
            alert('Failed to parse JSON file.');
            return;
          }
        } else {
          // CSV / TSV
          const res = parseCSVString(content);
          setRawHeaders(res.headers);
          setRawRows(res.rawRows);
          setColumnMapping(res.detectedMapping);
          initialTeams = res.teams;
        }

        // If local PDF resumes were included in the folder upload, parse them in-memory
        if (pdfFiles && pdfFiles.length > 0 && initialTeams.length > 0) {
          initialTeams = await enrichWithPdfs(initialTeams, pdfFiles);
        }

        setBaseTeams(initialTeams);
        saveScoringSnapshot(`Intake: ${file.name.replace(/\.[^/.]+$/, '')}`, undefined, initialTeams);
        setCurrentView('dashboard');
      }
    };
    reader.readAsText(file);
  };

  const handleGoogleSheetSubmit = async (url: string) => {
    try {
      const res = await fetch('/api/fetch-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch Google Sheet');
      }

      const parsedRes = parseCSVString(data.csvContent);
      setRawHeaders(parsedRes.headers);
      setRawRows(parsedRes.rawRows);
      setColumnMapping(parsedRes.detectedMapping);
      setBaseTeams(parsedRes.teams);
      saveScoringSnapshot('Intake: Google Sheet', undefined, parsedRes.teams);
      setCurrentView('dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error importing Google Sheet';
      alert(msg);
      throw err;
    }
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
        onOpenResumeSync={() => setIsResumeSyncOpen(true)}
        onOpenParallelSync={() => setIsParallelSyncOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onExportCSV={() => exportShortlistToCSV(rankedTeams, config, config.shortlistCount)}
        onExportJSON={() => exportShortlistWithConfigJSON(rankedTeams, config, config.shortlistCount)}
        hasData={baseTeams.length > 0}
        onGoHome={() => setCurrentView('home')}
        onGoDashboard={() => setCurrentView('dashboard')}
        currentView={baseTeams.length === 0 ? 'home' : currentView}
      />

      {/* Main Workspace / Dashboard - Fits right on the first page! */}
      <main ref={dashboardRef} className="flex-1 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {baseTeams.length === 0 || currentView === 'home' ? (
          <div className="space-y-4">
            {baseTeams.length > 0 && (
              <div className="bg-zinc-950/80 border border-cyan-500/40 p-3.5 sm:p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-100 flex items-center gap-2">
                      <span>Active Cohort Loaded:</span>
                      <span className="text-cyan-400 font-black">{baseTeams.length} Registered Teams</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      You can select a folder or drop a new dataset below, or return directly to your scoring leaderboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/formulas"
                    className="px-3.5 py-2 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 hover:border-cyan-400 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                    title="Open Formula & Algorithm Studio"
                  >
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Formulae Page</span>
                  </Link>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-black font-black rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Return to Leaderboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Clear currently loaded cohort and start fresh?')) {
                        clearCohort();
                        setCurrentView('home');
                      }
                    }}
                    className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Clear current candidate data"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Cohort</span>
                  </button>
                </div>
              </div>
            )}
            <UploadZone
              onFileUpload={(file, pdfFiles) => {
                handleFileUpload(file, pdfFiles);
                setCurrentView('dashboard');
              }}
              onGoogleSheetSubmit={handleGoogleSheetSubmit}
            />
          </div>
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
              <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-cyan-950/80 shadow-md backdrop-blur-md flex flex-col justify-between">
                <div>
                  <span className="text-zinc-500 block uppercase">SCORING ALGO:</span>
                  <div className="text-xs font-bold text-cyan-300 truncate mt-1">
                    {config.customFormulaEnabled ? config.customFormulaName || 'Custom Formula' : 'Balanced Mean'}
                  </div>
                </div>
                <Link
                  href="/formulas"
                  className="mt-1 text-[10px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 font-bold"
                  title="Configure multipliers & custom mathematical formulas"
                >
                  <span>Formulae Page</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-cyan-950/80 shadow-md backdrop-blur-md">
                <span className="text-zinc-500 block uppercase">REVIEW MODE:</span>
                <div className="text-xs font-bold text-purple-400 mt-1.5">
                  {config.anonymizeMode ? '🕶️ Blind (Anonymized)' : '👁️ Standard'}
                </div>
              </div>
            </div>

            {/* Scoring Run Snapshot & History Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/70 border border-cyan-950/80 p-3 rounded-xl backdrop-blur-md text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-200 font-bold block">Scoring History & Audit Vault</span>
                  <span className="text-[10px] text-zinc-400 font-sans">
                    {scoringHistory.length > 0
                      ? `${scoringHistory.length} previous scoring run${scoringHistory.length > 1 ? 's' : ''} saved in audit history`
                      : 'No saved runs yet. Snapshot and name your current scoring configuration anytime.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {/* Resume Intelligence & Sync Button */}
                <button
                  onClick={() => setIsResumeSyncOpen(true)}
                  className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 font-bold rounded-lg border border-cyan-800 hover:border-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Scan & Parse Candidate Google Drive & PDF Resumes"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Resume Sync</span>
                </button>

                {/* Parallel Deep Scan Button (Dual-stream Concurrent GitHub + Resume Auditor) */}
                <button
                  onClick={() => setIsParallelSyncOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-950/70 to-cyan-950/70 hover:from-blue-900/90 hover:to-cyan-900/90 text-cyan-200 font-bold rounded-lg border border-cyan-400/60 hover:border-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  title="Run Live GitHub Velocity & Cloud Resume Parsing Concurrently in Parallel"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Parallel Deep Scan</span>
                </button>

                {/* Formulae Studio Button */}
                <Link
                  href="/formulas"
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium rounded-lg border border-zinc-800 hover:border-cyan-500/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Open Formula & Algorithm Studio"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Formulae Studio</span>
                </Link>

                {/* Toggle Filter Sidebar Button */}
                <button
                  onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium rounded-lg border border-zinc-800 hover:border-cyan-500/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={isConfigCollapsed ? 'Show Filters Sidebar' : 'Hide Filters Sidebar to Expand Leaderboard'}
                >
                  {isConfigCollapsed ? (
                    <>
                      <PanelLeftOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Show Filters</span>
                    </>
                  ) : (
                    <>
                      <PanelLeftClose className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Hide Filters</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const customName = prompt(
                      'Enter a name for this scoring run snapshot:',
                      `Run #${scoringHistory.length + 1} (${config.presetName} - Top ${config.shortlistCount})`
                    );
                    if (customName !== null) {
                      saveScoringSnapshot(customName);
                      setIsHistoryOpen(true);
                    }
                  }}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  title="Save and name the current scoring run"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>📸 Save Scoring Run</span>
                </button>

                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium rounded-lg border border-zinc-800 hover:border-cyan-500/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Open Scoring Run History Modal"
                >
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>History Vault ({scoringHistory.length})</span>
                </button>
              </div>
            </div>

            {/* Split View: Config Panel (3 cols) & Cyber Leaderboard (9 cols or full 12 cols when collapsed) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Tunable Configuration Panel (3 cols on XL) */}
              {!isConfigCollapsed && (
                <div className="lg:col-span-4 xl:col-span-3 sticky top-18 space-y-4">
                  <ConfigPanel
                    config={config}
                    onChange={setConfig}
                    totalTeamsCount={baseTeams.length}
                  />
                </div>
              )}

              {/* Right Column: Incursion Cyber Leaderboard (9 cols on XL, 12 cols when collapsed) */}
              <div className={`${isConfigCollapsed ? 'col-span-12' : 'lg:col-span-8 xl:col-span-9'} space-y-4`}>
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

      {/* Resume Intelligence & Cloud Drive Parser Modal */}
      {isResumeSyncOpen && (
        <ResumeSyncModal
          teams={baseTeams}
          onUpdateTeamsWithParsedResumes={setBaseTeams}
          onClose={() => setIsResumeSyncOpen(false)}
        />
      )}

      {/* Parallel Deep Scan Modal (Concurrent GitHub & Resume Scoring) */}
      {isParallelSyncOpen && (
        <ParallelSyncModal
          teams={baseTeams}
          onApplyEnrichedTeams={(updated) => {
            setBaseTeams(updated);
            saveScoringSnapshot('Enriched: Parallel GitHub & Resume Scan', undefined, updated);
          }}
          onClose={() => setIsParallelSyncOpen(false)}
        />
      )}

      {/* Scoring History & Audit Vault Modal */}
      {isHistoryOpen && (
        <ScoringHistoryModal
          onClose={() => setIsHistoryOpen(false)}
          hasActiveCohort={baseTeams.length > 0}
        />
      )}
    </div>
  );
}
