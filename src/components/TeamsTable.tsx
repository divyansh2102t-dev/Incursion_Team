'use client';

import React, { useState } from 'react';
import { SelectionConfig, TeamRecord } from '@/types';
import {
  Search,
  Eye,
  ArrowRightLeft,
  Pin,
  Ban,
  AlertTriangle,
  FileQuestion,
  CheckCircle2,
  XCircle,
  HelpCircle,
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

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={config.anonymizeMode ? "Search by Team ID..." : "Search teams or members..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'ALL', label: `All (${teams.length})` },
            { id: 'SHORTLIST', label: `Shortlist (Top ${config.shortlistCount})` },
            { id: 'WAITLIST', label: 'Waitlist' },
            { id: 'DISQUALIFIED', label: 'Disqualified' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
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
            {filteredTeams.map((team, idx) => {
              const isShortlistCandidate =
                team.computed.manualStatus === 'pinned' ||
                (team.computed.rank <= config.shortlistCount &&
                  team.computed.isEligible &&
                  team.computed.manualStatus !== 'excluded');

              const isCutoffPoint =
                statusFilter === 'ALL' &&
                team.computed.rank === config.shortlistCount &&
                idx < filteredTeams.length - 1;

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

                    {/* Team Name & Flags */}
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
                      ) : team.computed.manualStatus === 'excluded' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Excluded
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
                          title="Inspect Scorecard & Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => onCompareTeams(team.id)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                          title="Head-to-Head Compare"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Top X Cutoff Separator Line */}
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

        {filteredTeams.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No teams match the current filters or search term.
          </div>
        )}
      </div>
    </div>
  );
};
