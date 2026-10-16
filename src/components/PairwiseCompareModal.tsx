'use client';

import React, { useState } from 'react';
import { SelectionConfig, TeamRecord } from '@/types';
import { X, ArrowRightLeft, Trophy, Check, Minus } from 'lucide-react';
import { RadarChart } from './RadarChart';

interface PairwiseCompareModalProps {
  teams: TeamRecord[];
  config: SelectionConfig;
  initialTeamAId?: string;
  initialTeamBId?: string;
  onClose: () => void;
}

export const PairwiseCompareModal: React.FC<PairwiseCompareModalProps> = ({
  teams,
  config,
  initialTeamAId,
  initialTeamBId,
  onClose,
}) => {
  const eligibleTeams = teams.filter((t) => t.computed.isEligible);
  const [teamAId, setTeamAId] = useState<string>(
    initialTeamAId || eligibleTeams[0]?.id || ''
  );
  const [teamBId, setTeamBId] = useState<string>(
    initialTeamBId || eligibleTeams[1]?.id || ''
  );

  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);

  const renderComparisonRow = (
    label: string,
    valA: number,
    valB: number,
    higherIsBetter = true
  ) => {
    const isAWinner = higherIsBetter ? valA > valB : valA < valB;
    const isBWinner = higherIsBetter ? valB > valA : valB < valA;
    const isTie = valA === valB;

    return (
      <div className="grid grid-cols-3 py-2.5 px-3 border-b border-slate-100 text-xs items-center hover:bg-slate-50">
        <div className={`font-semibold flex items-center gap-1.5 ${isAWinner ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
          {isAWinner && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          <span>{valA}</span>
        </div>

        <div className="text-center font-medium text-slate-500 uppercase tracking-wider text-[11px]">
          {label}
        </div>

        <div className={`text-right font-semibold flex items-center justify-end gap-1.5 ${isBWinner ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
          <span>{valB}</span>
          {isBWinner && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          {isTie && <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">
              Pairwise Head-to-Head Comparison
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Selectors */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Team A Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Select Team A:</label>
              <select
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.computed.rank} - {config.anonymizeMode ? `Team ${t.id}` : t.teamName} ({t.computed.finalScore} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Team B Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Select Team B:</label>
              <select
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.computed.rank} - {config.anonymizeMode ? `Team ${t.id}` : t.teamName} ({t.computed.finalScore} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {teamA && teamB ? (
            <div className="space-y-6">
              {/* Score Comparison Banner */}
              <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="text-center space-y-1 border-r border-indigo-100 pr-2">
                  <div className="text-xs font-semibold text-slate-500">
                    {config.anonymizeMode ? `Team ${teamA.id}` : teamA.teamName}
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-700">
                    {teamA.computed.finalScore}
                  </div>
                  <span className="text-[11px] bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                    Rank #{teamA.computed.rank}
                  </span>
                </div>

                <div className="text-center space-y-1 pl-2">
                  <div className="text-xs font-semibold text-slate-500">
                    {config.anonymizeMode ? `Team ${teamB.id}` : teamB.teamName}
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-700">
                    {teamB.computed.finalScore}
                  </div>
                  <span className="text-[11px] bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                    Rank #{teamB.computed.rank}
                  </span>
                </div>
              </div>

              {/* Dimension Comparison Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 border-b border-slate-200 grid grid-cols-3">
                  <span>{config.anonymizeMode ? 'Team A' : teamA.teamName}</span>
                  <span className="text-center">Evaluation Metric</span>
                  <span className="text-right">{config.anonymizeMode ? 'Team B' : teamB.teamName}</span>
                </div>

                {renderComparisonRow('Technical Depth (100)', teamA.computed.technicalDepthScore, teamB.computed.technicalDepthScore)}
                {renderComparisonRow('Project Experience (100)', teamA.computed.projectExperienceScore, teamB.computed.projectExperienceScore)}
                {renderComparisonRow('Skill Complementarity (100)', teamA.computed.skillComplementarityScore, teamB.computed.skillComplementarityScore)}
                {renderComparisonRow('Data Completeness (100)', teamA.computed.dataCompletenessScore, teamB.computed.dataCompletenessScore)}
                {renderComparisonRow('Team Size (Members)', teamA.members.length, teamB.members.length)}
                {renderComparisonRow(
                  'Identified Skills',
                  Array.from(new Set(teamA.members.flatMap((m) => m.rawSignals.skills))).length,
                  Array.from(new Set(teamB.members.flatMap((m) => m.rawSignals.skills))).length
                )}
              </div>

              {/* Side by Side Radars */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    {config.anonymizeMode ? 'Team A' : teamA.teamName} Coverage
                  </div>
                  <RadarChart
                    coverage={{
                      frontend: Math.max(...teamA.members.map((m) => m.rawSignals.roleDistribution.frontend)),
                      backend: Math.max(...teamA.members.map((m) => m.rawSignals.roleDistribution.backend)),
                      ai_ml: Math.max(...teamA.members.map((m) => m.rawSignals.roleDistribution.ai_ml)),
                      mobile: Math.max(...teamA.members.map((m) => m.rawSignals.roleDistribution.mobile)),
                      design: Math.max(...teamA.members.map((m) => m.rawSignals.roleDistribution.design)),
                      devops: Math.max(...teamA.members.map((m) => m.rawSignals.roleDistribution.devops)),
                      general: 0,
                    }}
                    size={160}
                  />
                </div>

                <div className="flex flex-col items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    {config.anonymizeMode ? 'Team B' : teamB.teamName} Coverage
                  </div>
                  <RadarChart
                    coverage={{
                      frontend: Math.max(...teamB.members.map((m) => m.rawSignals.roleDistribution.frontend)),
                      backend: Math.max(...teamB.members.map((m) => m.rawSignals.roleDistribution.backend)),
                      ai_ml: Math.max(...teamB.members.map((m) => m.rawSignals.roleDistribution.ai_ml)),
                      mobile: Math.max(...teamB.members.map((m) => m.rawSignals.roleDistribution.mobile)),
                      design: Math.max(...teamB.members.map((m) => m.rawSignals.roleDistribution.design)),
                      devops: Math.max(...teamB.members.map((m) => m.rawSignals.roleDistribution.devops)),
                      general: 0,
                    }}
                    size={160}
                  />
                </div>
              </div>

              {/* Head to Head Verdict */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <Trophy className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    Head-to-Head Verdict:{' '}
                    {teamA.computed.finalScore > teamB.computed.finalScore
                      ? `${config.anonymizeMode ? 'Team A' : teamA.teamName} has the competitive advantage (+${(teamA.computed.finalScore - teamB.computed.finalScore).toFixed(1)} pts)`
                      : teamB.computed.finalScore > teamA.computed.finalScore
                      ? `${config.anonymizeMode ? 'Team B' : teamB.teamName} has the competitive advantage (+${(teamB.computed.finalScore - teamA.computed.finalScore).toFixed(1)} pts)`
                      : 'Exact Tie under current criteria weights'}
                  </div>
                  <div className="text-emerald-800 text-[11px] mt-0.5">
                    {teamA.computed.finalScore > teamB.computed.finalScore
                      ? `Team A outperforms in ${teamA.computed.technicalDepthScore > teamB.computed.technicalDepthScore ? 'Technical Output' : 'Skill Breadth'} under the '${config.presetName}' philosophy.`
                      : `Team B outperforms in ${teamB.computed.technicalDepthScore > teamA.computed.technicalDepthScore ? 'Technical Output' : 'Skill Breadth'} under the '${config.presetName}' philosophy.`}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">Select two valid teams to compare.</div>
          )}
        </div>
      </div>
    </div>
  );
};
