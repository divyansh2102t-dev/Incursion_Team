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
} from 'lucide-react';

interface TeamsTableProps {
  teams: TeamRecord[];
  config: SelectionConfig;
  onSelectTeam: (team: TeamRecord) => void;
  onCompareTeams: (teamAId: string, teamBId?: string) => void;
}

export const TeamsTable: React.FC<TeamsTableProps> = ({
  teams,
  config,
  onSelectTeam,
  onCompareTeams,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SHORTLIST' | 'WAITLIST' | 'DISQUALIFIED'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredTeams = teams.filter((t) => {
    // Search query
    const matchName = config.anonymizeMode
      ? t.id.toLowerCase().includes(searchQuery.toLowerCase())
      : t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.members.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchName) return false;

    // Status filter
    const isShortlisted =
      t.computed.manualStatus === 'pinned' ||
      (t.computed.rank <= config.shortlistCount && t.computed.isEligible && t.computed.manualStatus !== 'excluded');

    if (statusFilter === 'SHORTLIST') return isShortlisted;
    if (statusFilter === 'WAITLIST') return !isShortlisted && t.computed.isEligible;
    if (statusFilter === 'DISQUALIFIED') return !t.computed.isEligible || t.computed.manualStatus === 'excluded';

    return true;
  });

  // Pagination
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredTeams.length / pageSize) || 1;
  const paginatedTeams =
    pageSize === 0
      ? filteredTeams
      : filteredTeams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={config.anonymizeMode ? "Search by Team ID..." : "Search teams or members..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* View Switcher & Filter Pills */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Table / Card View Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Mobile Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {[
              { id: 'ALL', label: `All (${teams.length})` },
              { id: 'SHORTLIST', label: `Shortlist (${config.shortlistCount})` },
              { id: 'WAITLIST', label: 'Waitlist' },
              { id: 'DISQUALIFIED', label: 'Disqualified' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setStatusFilter(f.id as any);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors text-[11px] ${
                  statusFilter === f.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode: Card View (Great for Mobile!) */}
      {viewMode === 'cards' ? (
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className={`p-3.5 rounded-xl border transition-all text-xs space-y-2.5 ${
                  !team.computed.isEligible
                    ? 'bg-rose-50/30 border-rose-200'
                    : isShortlistCandidate
                    ? 'bg-emerald-50/20 border-emerald-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <span className="text-slate-500 font-extrabold">#{team.computed.rank}</span>
                      <span className="truncate max-w-[180px]">{teamDisplayName}</span>
                      {team.computed.antiCheatFlags.length > 0 && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {team.members.length} members • {team.computed.coveredRoles.join(', ') || 'General'}
                    </div>
                  </div>

                  {/* Score & Status */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-blue-700">
                      {team.computed.finalScore} <span className="text-[10px] font-normal text-slate-400">pts</span>
                    </div>
                    <div>
                      {team.computed.manualStatus === 'pinned' ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          Pinned
                        </span>
                      ) : !team.computed.isEligible ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Disqualified
                        </span>
                      ) : isShortlistCandidate ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Shortlisted
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Waitlist
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini Dimension Bars */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block">Tech</span>
                    <strong className="text-slate-700">{team.computed.technicalDepthScore}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Exp</span>
                    <strong className="text-slate-700">{team.computed.projectExperienceScore}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Roles</span>
                    <strong className="text-slate-700">{team.computed.skillComplementarityScore}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Data</span>
                    <strong className="text-slate-700">{team.computed.dataCompletenessScore}%</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    {team.computed.isEligible ? 'Eligible' : 'Failed Filter'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectTeam(team)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-[11px] font-semibold text-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() => onCompareTeams(team.id)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
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
        /* View Mode: Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-14">Rank</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-2 text-center w-16">Size</th>
                <th className="py-3 px-3 text-right">Tech (35%)</th>
                <th className="py-3 px-3 text-right">Exp (30%)</th>
                <th className="py-3 px-3 text-right">Roles (25%)</th>
                <th className="py-3 px-3 text-right">Data (10%)</th>
                <th className="py-3 px-3 text-right">Score</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTeams.map((team, idx) => {
                const isShortlistCandidate =
                  team.computed.manualStatus === 'pinned' ||
                  (team.computed.rank <= config.shortlistCount &&
                    team.computed.isEligible &&
                    team.computed.manualStatus !== 'excluded');

                const isCutoffPoint =
                  statusFilter === 'ALL' &&
                  team.computed.rank === config.shortlistCount &&
                  idx < paginatedTeams.length - 1;

                const teamDisplayName = config.anonymizeMode
                  ? `Team [${team.id.slice(0, 8)}]`
                  : team.teamName;

                return (
                  <React.Fragment key={team.id}>
                    <tr
                      className={`transition-colors hover:bg-blue-50/40 ${
                        !team.computed.isEligible
                          ? 'bg-rose-50/20 text-slate-400'
                          : isShortlistCandidate
                          ? 'bg-emerald-50/15'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 text-center font-bold text-slate-600">
                        {team.computed.manualStatus === 'pinned' ? (
                          <span className="inline-flex items-center text-purple-700 font-extrabold">
                            <Pin className="w-3.5 h-3.5 mr-0.5 fill-purple-600" />
                            {team.computed.rank}
                          </span>
                        ) : team.computed.manualStatus === 'excluded' ? (
                          <span className="text-rose-500 font-medium">✕</span>
                        ) : (
                          `#${team.computed.rank}`
                        )}
                      </td>

                      {/* Team Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="truncate max-w-[200px]">{teamDisplayName}</span>
                          {team.computed.antiCheatFlags.length > 0 && (
                            <span title={team.computed.antiCheatFlags.join('; ')}>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            </span>
                          )}
                          {team.computed.missingDataWarnings.length > 0 && (
                            <span title={team.computed.missingDataWarnings.join('; ')}>
                              <FileQuestion className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                          {team.computed.coveredRoles.join(', ') || 'General / Unspecified'}
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-2 text-center text-slate-600 font-medium">
                        {team.members.length}
                      </td>

                      {/* Tech Score */}
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {team.computed.technicalDepthScore}
                      </td>

                      {/* Project Exp */}
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {team.computed.projectExperienceScore}
                      </td>

                      {/* Role Complementarity */}
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {team.computed.skillComplementarityScore}
                      </td>

                      {/* Completeness */}
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {team.computed.dataCompletenessScore}%
                      </td>

                      {/* Final Score */}
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-extrabold text-blue-700">
                          {team.computed.finalScore}
                        </span>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-3 text-center">
                        {team.computed.manualStatus === 'pinned' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Pinned
                          </span>
                        ) : !team.computed.isEligible ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 cursor-help"
                            title={team.computed.failedFilters.map((f) => f.reason).join('; ')}
                          >
                            Disqualified
                          </span>
                        ) : isShortlistCandidate ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Shortlisted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Waitlist
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectTeam(team)}
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-[11px] font-semibold text-slate-700 transition-colors flex items-center gap-1"
                            title="Inspect Scorecard"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => onCompareTeams(team.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                            title="Compare"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Top X Cutoff Line */}
                    {isCutoffPoint && (
                      <tr className="bg-amber-100/70 border-y-2 border-amber-400 select-none">
                        <td colSpan={10} className="py-2 px-4 text-center text-amber-900 font-extrabold text-xs tracking-wide">
                          ▲ TOP {config.shortlistCount} SHORTLIST CUTOFF LINE ▲ (Teams below are Waitlisted / Next in Line)
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

      {/* Pagination Bar */}
      {filteredTeams.length > 0 && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="0">Show All</option>
            </select>
            <span className="text-[11px] text-slate-400">
              Total {filteredTeams.length} teams
            </span>
          </div>

          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 border border-slate-200 rounded bg-white disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-medium px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 border border-slate-200 rounded bg-white disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {filteredTeams.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-xs">
          No teams match the current filters or search term.
        </div>
      )}
    </div>
  );
};
