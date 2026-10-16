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
      <div className="grid grid-cols-3 py-2.5 px-3 border-b border-zinc-800/80 text-xs items-center hover:bg-cyan-950/20 transition-colors">
        <div className={`font-semibold flex items-center gap-1.5 ${isAWinner ? 'text-cyan-400 font-bold' : 'text-zinc-500'}`}>
          {isAWinner && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
          <span>{valA}</span>
        </div>

        <div className="text-center font-medium text-zinc-400 uppercase tracking-wider text-[10px]">
          {label}
        </div>

        <div className={`text-right font-semibold flex items-center justify-end gap-1.5 ${isBWinner ? 'text-cyan-400 font-bold' : 'text-zinc-500'}`}>
          <span>{valB}</span>
          {isBWinner && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
          {isTie && <Minus className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-950 rounded-2xl max-w-4xl w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-cyan-950/80 overflow-hidden max-h-[92vh] flex flex-col my-auto font-mono text-xs text-zinc-300">
        {/* Header */}
        <div className="px-6 py-4 bg-black/60 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black text-cyan-400 tracking-tight uppercase neon-glow-cyan">
              Pairwise Head-to-Head Comparison HUD
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Selectors */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Team A Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Select Team A:</label>
              <select
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
                className="w-full bg-black/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-200 focus:border-cyan-400 outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.computed.rank} - {config.anonymizeMode ? `Team ${t.id.slice(0, 8)}` : t.teamName} ({t.computed.finalScore} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Team B Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Select Team B:</label>
              <select
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                className="w-full bg-black/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-200 focus:border-cyan-400 outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.computed.rank} - {config.anonymizeMode ? `Team ${t.id.slice(0, 8)}` : t.teamName} ({t.computed.finalScore} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {teamA && teamB ? (
            <div className="space-y-6">
              {/* Score Comparison Banner */}
              <div className="grid grid-cols-2 gap-4 bg-black/50 p-4 rounded-xl border border-cyan-900/40">
                <div className="text-center space-y-1 border-r border-zinc-800 pr-2">
                  <div className="text-xs font-semibold text-zinc-400">
                    {config.anonymizeMode ? `Team ${teamA.id.slice(0, 8)}` : teamA.teamName}
                  </div>
                  <div className="text-3xl font-black text-cyan-400 neon-glow-cyan">
                    {teamA.computed.finalScore}
                  </div>
                  <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700 text-zinc-300">
                    Rank #{teamA.computed.rank}
                  </span>
                </div>

                <div className="text-center space-y-1 pl-2">
                  <div className="text-xs font-semibold text-zinc-400">
                    {config.anonymizeMode ? `Team ${teamB.id.slice(0, 8)}` : teamB.teamName}
                  </div>
                  <div className="text-3xl font-black text-cyan-400 neon-glow-cyan">
                    {teamB.computed.finalScore}
                  </div>
                  <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700 text-zinc-300">
                    Rank #{teamB.computed.rank}
                  </span>
                </div>
              </div>

              {/* Dimension Comparison Table */}
              <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-black/40">
                <div className="bg-black/60 px-3 py-2 text-xs font-bold text-zinc-400 border-b border-zinc-800 grid grid-cols-3 uppercase tracking-wider text-[10px]">
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
                <div className="flex flex-col items-center bg-black/40 p-3 rounded-xl border border-zinc-800/80">
                  <div className="text-xs font-bold text-zinc-300 mb-2">
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

                <div className="flex flex-col items-center bg-black/40 p-3 rounded-xl border border-zinc-800/80">
                  <div className="text-xs font-bold text-zinc-300 mb-2">
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
              <div className="bg-cyan-950/30 border border-cyan-500/40 p-3.5 rounded-xl text-xs text-cyan-300 flex items-start gap-2.5">
                <Trophy className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    Head-to-Head Verdict:{' '}
                    {teamA.computed.finalScore > teamB.computed.finalScore
                      ? `${config.anonymizeMode ? 'Team A' : teamA.teamName} has the competitive advantage (+${(teamA.computed.finalScore - teamB.computed.finalScore).toFixed(1)} pts)`
                      : teamB.computed.finalScore > teamA.computed.finalScore
                      ? `${config.anonymizeMode ? 'Team B' : teamB.teamName} has the competitive advantage (+${(teamB.computed.finalScore - teamA.computed.finalScore).toFixed(1)} pts)`
                      : 'Exact Tie under current criteria weights'}
                  </div>
                  <div className="text-zinc-400 text-[11px] mt-0.5 font-sans">
                    {teamA.computed.finalScore > teamB.computed.finalScore
                      ? `Team A outperforms in ${teamA.computed.technicalDepthScore > teamB.computed.technicalDepthScore ? 'Technical Output' : 'Skill Breadth'} under the '${config.presetName}' philosophy.`
                      : `Team B outperforms in ${teamB.computed.technicalDepthScore > teamA.computed.technicalDepthScore ? 'Technical Output' : 'Skill Breadth'} under the '${config.presetName}' philosophy.`}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-500">Select two valid teams to compare.</div>
          )}
        </div>
      </div>
    </div>
  );
};
