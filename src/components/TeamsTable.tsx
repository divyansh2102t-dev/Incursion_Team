'use client';

import React, { useState } from 'react';
import { SelectionConfig, TeamRecord } from '@/types';
import {
  Search,
  Eye,
  ArrowRightLeft,
  Pin,
  AlertTriangle,
  FileQuestion,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Award,
  Terminal,
  Code2,
  Sliders,
} from 'lucide-react';

interface TeamsTableProps {
  teams: TeamRecord[];
  config: SelectionConfig;
  onSelectTeam: (team: TeamRecord) => void;
  onCompareTeams: (teamAId: string, teamBId?: string) => void;
  onOpenGitHubSync?: () => void;
}

export const TeamsTable: React.FC<TeamsTableProps> = ({
  teams,
  config,
  onSelectTeam,
  onCompareTeams,
  onOpenGitHubSync,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'OVERALL' | 'GITHUB' | 'ROLES' | 'ACCOLADES' | 'SHORTLIST' | 'DISQUALIFIED'>('OVERALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('ALL');

  // Format current live sync time
  const now = new Date();
  const formattedSyncTime = `${now.toLocaleDateString()}, ${now.toLocaleTimeString()}`;

  const filteredTeams = teams.filter((t) => {
    // Search query
    const matchName = config.anonymizeMode
      ? t.id.toLowerCase().includes(searchQuery.toLowerCase())
      : t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.members.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchName) return false;

    // Team size filter
    if (selectedSizeFilter !== 'ALL') {
      const targetSize = parseInt(selectedSizeFilter, 10);
      if (t.members.length !== targetSize) return false;
    }

    // Category Tabs filter
    const isShortlisted =
      t.computed.manualStatus === 'pinned' ||
      (t.computed.rank <= config.shortlistCount && t.computed.isEligible && t.computed.manualStatus !== 'excluded');

    if (activeTab === 'SHORTLIST') return isShortlisted;
    if (activeTab === 'DISQUALIFIED') return !t.computed.isEligible || t.computed.manualStatus === 'excluded';
    if (activeTab === 'GITHUB') return t.members.some((m) => m.githubUrl || m.rawSignals.githubMetrics);
    if (activeTab === 'ACCOLADES') return t.computed.projectExperienceScore > 30;
    if (activeTab === 'ROLES') return t.computed.coveredRoles.length >= 2;

    return true;
  });

  // Pagination
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredTeams.length / pageSize) || 1;
  const paginatedTeams =
    pageSize === 0
      ? filteredTeams
      : filteredTeams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-zinc-950/80 border border-cyan-950/80 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-sans backdrop-blur-xl">
      {/* 1. Cyber Leaderboard Header (Replicating Image 2) */}
      <div className="p-4 sm:p-6 border-b border-cyan-950/60 bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
              <h2 className="text-xl sm:text-2xl font-black text-cyan-400 tracking-tight neon-glow-cyan uppercase">
                INCURSION LEADERBOARD
              </h2>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 tracking-wider mt-0.5">
              DETERMINISTIC RANKINGS & CANDIDATE CODE METRICS
            </p>
          </div>

          <div className="text-right font-mono text-[11px]">
            <span className="text-zinc-500">LAST SYNCED: </span>
            <span className="text-cyan-400 font-bold">{formattedSyncTime}</span>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto mt-4 border-b border-zinc-800/80 text-xs font-mono">
          {[
            { id: 'OVERALL', label: 'OVERALL' },
            { id: 'GITHUB', label: 'GITHUB CODE' },
            { id: 'ROLES', label: 'SKILL SYNERGY' },
            { id: 'ACCOLADES', label: 'HACKATHON WINS' },
            { id: 'SHORTLIST', label: `SHORTLIST (${config.shortlistCount})` },
            { id: 'DISQUALIFIED', label: 'DISQUALIFIED' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`pb-2.5 px-2 transition-all font-bold whitespace-nowrap cursor-pointer relative ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Search and Filter Bar Controls */}
      <div className="p-3.5 sm:p-4 bg-zinc-950/60 border-b border-cyan-950/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Search Bar with '/' hotkey badge */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={config.anonymizeMode ? "Search by Team ID..." : "Search by team name or member..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 bg-black/60 border border-zinc-800 focus:border-cyan-400 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-400">
            /
          </span>
        </div>

        {/* Filter Pills: Team Sizes & View Modes */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Team Size filter pill */}
          <select
            value={selectedSizeFilter}
            onChange={(e) => setSelectedSizeFilter(e.target.value)}
            className="px-3 py-1.5 bg-black/60 border border-zinc-800 text-zinc-300 rounded-lg focus:border-cyan-400 outline-none cursor-pointer"
          >
            <option value="ALL">All Team Sizes</option>
            <option value="1">Solo (1 Member)</option>
            <option value="2">Duo (2 Members)</option>
            <option value="3">Trio (3 Members)</option>
            <option value="4">Quad (4 Members)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/60 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'cards' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Table or Cards */}
      {viewMode === 'cards' ? (
        /* Mobile Card View with Cyber theme */
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {paginatedTeams.map((team) => {
            const isShortlistCandidate =
              team.computed.manualStatus === 'pinned' ||
              (team.computed.rank <= config.shortlistCount &&
                team.computed.isEligible &&
                team.computed.manualStatus !== 'excluded');

            const teamDisplayName = config.anonymizeMode
              ? `Team [${team.id.slice(0, 8)}]`
              : team.teamName;

            return (
              <div
                key={team.id}
                className={`p-4 rounded-xl border transition-all text-xs space-y-3 bg-black/40 ${
                  !team.computed.isEligible
                    ? 'border-rose-900/60 bg-rose-950/10'
                    : isShortlistCandidate
                    ? 'border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center font-mono font-bold text-cyan-400">
                      {team.computed.rank}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-100 text-sm">{teamDisplayName}</h4>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {team.members.length} members • {team.computed.coveredRoles.join(', ') || 'General'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-cyan-400 neon-glow-cyan block">
                      {team.computed.finalScore}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {isShortlistCandidate ? 'SHORTLIST' : 'WAITLIST'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                  <div>
                    <span className="text-zinc-500 block">TECH</span>
                    <strong className="text-zinc-200">{team.computed.technicalDepthScore}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">EXP</span>
                    <strong className="text-zinc-200">{team.computed.projectExperienceScore}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">ROLES</span>
                    <strong className="text-zinc-200">{team.computed.skillComplementarityScore}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">DATA</span>
                    <strong className="text-zinc-200">{team.computed.dataCompletenessScore}%</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 font-mono">
                  <span className="text-[10px] text-zinc-500">
                    {team.computed.isEligible ? 'ELIGIBLE' : 'GATE FAILED'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectTeam(team)}
                      className="px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800/80 text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() => onCompareTeams(team.id)}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
                      title="Compare"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Cyberpunk Table View (Replicating Image 2 Table) */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-black/80 border-b border-cyan-950/60 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-2 text-center w-10">#</th>
                <th className="py-3 px-3">TEAM / CANDIDATES</th>
                <th className="py-3 px-2 text-center w-12">SIZE</th>
                <th className="py-3 px-2.5 text-right">TECH</th>
                <th className="py-3 px-2.5 text-right">EXP</th>
                <th className="py-3 px-2.5 text-right">ROLES</th>
                <th className="py-3 px-3 text-right text-cyan-300">SCORE</th>
                <th className="py-3 px-2.5 text-center">STATUS</th>
                <th className="py-3 px-3 text-center sticky right-0 z-20 bg-black/95 border-l border-cyan-950/80 shadow-[-8px_0_12px_rgba(0,0,0,0.7)] w-48">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {paginatedTeams.map((team, idx) => {
                const isShortlistCandidate =
                  team.computed.manualStatus === 'pinned' ||
                  (team.computed.rank <= config.shortlistCount &&
                    team.computed.isEligible &&
                    team.computed.manualStatus !== 'excluded');

                const isCutoffPoint =
                  activeTab === 'OVERALL' &&
                  team.computed.rank === config.shortlistCount &&
                  idx < paginatedTeams.length - 1;

                const teamDisplayName = config.anonymizeMode
                  ? `Team [${team.id.slice(0, 8)}]`
                  : team.teamName;

                return (
                  <React.Fragment key={team.id}>
                    <tr
                      className={`transition-colors group hover:bg-cyan-950/20 hover:border-l-2 hover:border-cyan-400 ${
                        !team.computed.isEligible
                          ? 'bg-rose-950/10 text-zinc-500'
                          : isShortlistCandidate
                          ? 'bg-cyan-950/10'
                          : 'bg-transparent'
                      }`}
                    >
                      {/* Rank with Gold / Silver / Bronze style */}
                      <td className="py-2.5 px-2 text-center font-bold">
                        {team.computed.manualStatus === 'pinned' ? (
                          <span className="inline-flex items-center text-purple-400 font-extrabold">
                            <Pin className="w-3.5 h-3.5 mr-0.5 fill-purple-400" />
                            {team.computed.rank}
                          </span>
                        ) : team.computed.manualStatus === 'excluded' ? (
                          <span className="text-rose-500 font-medium">✕</span>
                        ) : team.computed.rank === 1 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/60 font-black shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                            1
                          </span>
                        ) : team.computed.rank === 2 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-500/60 font-black">
                            2
                          </span>
                        ) : team.computed.rank === 3 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-700/60 font-black">
                            3
                          </span>
                        ) : (
                          <span className="text-zinc-500">{team.computed.rank}</span>
                        )}
                      </td>

                      {/* Team Name & Roles (Logo box removed as requested) */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                          <span className="truncate max-w-[220px] font-semibold">{teamDisplayName}</span>
                          {team.computed.antiCheatFlags.length > 0 && (
                            <span title="Flagged for suspicious commits or forks" className="inline-flex items-center">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[240px]">
                          {team.computed.coveredRoles.join(', ') || 'General / Unspecified'}
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-2.5 px-2 text-center text-zinc-400 font-medium">
                        {team.members.length}
                      </td>

                      {/* Tech Score */}
                      <td className="py-2.5 px-2.5 text-right font-medium text-zinc-300">
                        {team.computed.technicalDepthScore}
                      </td>

                      {/* Experience */}
                      <td className="py-2.5 px-2.5 text-right font-medium text-zinc-300">
                        {team.computed.projectExperienceScore}
                      </td>

                      {/* Roles */}
                      <td className="py-2.5 px-2.5 text-right font-medium text-zinc-300">
                        {team.computed.skillComplementarityScore}
                      </td>

                      {/* Final Composite Incursion Score (Glowing Cyan) */}
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-base font-black text-cyan-400 neon-glow-cyan font-mono">
                          {team.computed.finalScore}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-2.5 text-center">
                        {team.computed.manualStatus === 'pinned' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                            PINNED
                          </span>
                        ) : !team.computed.isEligible ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            DISQUALIFIED
                          </span>
                        ) : isShortlistCandidate ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                            SHORTLIST
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                            WAITLIST
                          </span>
                        )}
                      </td>

                      {/* Action buttons (Sticky right-0 so Scorecard and Compare are always visible) */}
                      <td className="py-2.5 px-3 text-center sticky right-0 z-10 bg-zinc-950/95 group-hover:bg-[#071c2a] border-l border-cyan-950/80 shadow-[-8px_0_12px_rgba(0,0,0,0.7)]">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => onSelectTeam(team)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-cyan-500 hover:text-black rounded text-[11px] font-bold text-zinc-200 hover:text-black border border-zinc-800 hover:border-cyan-400 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Open Candidate Scorecard Drilldown"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400 group-hover:text-black" />
                            <span>Scorecard</span>
                          </button>
                          <button
                            onClick={() => onCompareTeams(team.id)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 rounded text-[11px] font-medium border border-zinc-800 hover:border-cyan-500/50 transition-all flex items-center gap-1 cursor-pointer"
                            title="Compare Head-to-Head against another team"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                            <span>Compare</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Visual Cutoff Line (Laser separator) */}
                    {isCutoffPoint && (
                      <tr className="bg-gradient-to-r from-cyan-950 via-cyan-900 to-cyan-950">
                        <td colSpan={9} className="py-1 px-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                            <span className="h-px bg-cyan-500/50 flex-1" />
                            <span>▲ TOP {config.shortlistCount} SHORTLIST CUTOFF GATE ▲</span>
                            <span className="h-px bg-cyan-500/50 flex-1" />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Pagination Footer */}
      <div className="p-3.5 sm:p-4 bg-black/60 border-t border-cyan-950/60 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-zinc-400">
        <div>
          Showing {paginatedTeams.length} of {filteredTeams.length} teams
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 rounded cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 rounded cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
