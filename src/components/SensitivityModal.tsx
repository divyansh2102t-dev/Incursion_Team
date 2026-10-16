'use client';

import React, { useMemo } from 'react';
import { SelectionConfig, TeamRecord } from '@/types';
import { X, Activity, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { runFullShortlistingEngine } from '@/engine/scoring';

interface SensitivityModalProps {
  teams: TeamRecord[];
  config: SelectionConfig;
  onClose: () => void;
}

export const SensitivityModal: React.FC<SensitivityModalProps> = ({
  teams,
  config,
  onClose,
}) => {
  const analysis = useMemo(() => {
    const X = config.shortlistCount;
    const baseRanked = runFullShortlistingEngine(teams, config);
    const baseTopXSet = new Set(
      baseRanked.filter((t) => t.computed.rank <= X && t.computed.isEligible).map((t) => t.id)
    );

    // Perturbations: +/- 15% weights on each dimension
    const variations: Array<{ name: string; topXSet: Set<string> }> = [];

    const testPerturbation = (
      name: string,
      weightsMod: Partial<SelectionConfig['weights']>
    ) => {
      const perturbedConfig: SelectionConfig = {
        ...config,
        weights: {
          ...config.weights,
          ...weightsMod,
        },
      };
      const perturbed = runFullShortlistingEngine(teams, perturbedConfig);
      const topSet = new Set(
        perturbed.filter((t) => t.computed.rank <= X && t.computed.isEligible).map((t) => t.id)
      );
      variations.push({ name, topXSet: topSet });
    };

    testPerturbation('+15% Technical Weight', {
      technicalDepth: Math.min(100, config.weights.technicalDepth + 15),
    });
    testPerturbation('-15% Technical Weight', {
      technicalDepth: Math.max(0, config.weights.technicalDepth - 15),
    });
    testPerturbation('+15% Experience Weight', {
      projectExperience: Math.min(100, config.weights.projectExperience + 15),
    });
    testPerturbation('+15% Skill Diversity Weight', {
      skillComplementarity: Math.min(100, config.weights.skillComplementarity + 15),
    });

    // Track stability for each team in current Top X
    const rockSolidTeams: TeamRecord[] = [];
    const bubbleTeams: Array<{
      team: TeamRecord;
      currentRank: number;
      survivedCount: number;
      vulnerableTo: string[];
    }> = [];

    baseRanked.forEach((t) => {
      if (!t.computed.isEligible) return;

      const inBase = baseTopXSet.has(t.id);
      let inVariationsCount = 0;
      const vulnerableTo: string[] = [];

      variations.forEach((v) => {
        if (v.topXSet.has(t.id)) {
          inVariationsCount++;
        } else if (inBase) {
          vulnerableTo.push(v.name);
        }
      });

      // If team is currently in Top X
      if (inBase) {
        if (inVariationsCount === variations.length) {
          rockSolidTeams.push(t);
        } else {
          bubbleTeams.push({
            team: t,
            currentRank: t.computed.rank,
            survivedCount: inVariationsCount,
            vulnerableTo,
          });
        }
      } else {
        // Not in base Top X, but enters in some variation!
        if (inVariationsCount > 0) {
          bubbleTeams.push({
            team: t,
            currentRank: t.computed.rank,
            survivedCount: inVariationsCount,
            vulnerableTo: [`Can enter shortlist under: ${variations.filter((v) => v.topXSet.has(t.id)).map((v) => v.name).join(', ')}`],
          });
        }
      }
    });

    const stabilityPercentage = Math.round(
      (rockSolidTeams.length / Math.max(1, X)) * 100
    );

    return {
      stabilityPercentage,
      rockSolidTeams,
      bubbleTeams,
      totalVariations: variations.length,
    };
  }, [teams, config]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-950 rounded-2xl max-w-3xl w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-cyan-950/80 overflow-hidden max-h-[92vh] flex flex-col my-auto font-mono text-xs text-zinc-300">
        {/* Header */}
        <div className="px-6 py-4 bg-black/60 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black text-cyan-400 tracking-tight uppercase neon-glow-cyan">
              Shortlist Stability & Sensitivity Telemetry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Stability Metric Card */}
          <div className="bg-black/50 border border-cyan-900/40 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Shortlist Robustness Score
              </span>
              <p className="text-zinc-400 text-[11px] max-w-md font-sans">
                Measures how resilient the Top {config.shortlistCount} shortlist remains when criteria weights vary by ±15%.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-cyan-400 neon-glow-cyan font-mono">
                {analysis.stabilityPercentage}%
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase">
                {analysis.stabilityPercentage >= 80 ? 'Highly Resilient' : 'Moderate Sensitivity'}
              </span>
            </div>
          </div>

          {/* Borderline / Bubble Teams Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Borderline &quot;Bubble&quot; Teams (Sensitive to Weight Changes)</span>
            </div>

            {analysis.bubbleTeams.length > 0 ? (
              <div className="space-y-2">
                {analysis.bubbleTeams.map((item) => (
                  <div
                    key={item.team.id}
                    className="p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-zinc-200 flex items-center gap-2">
                        <span>#{item.currentRank}</span>
                        <span>{config.anonymizeMode ? `Team ${item.team.id.slice(0, 8)}` : item.team.teamName}</span>
                        <span className="text-[10px] font-normal text-zinc-500">
                          ({item.team.computed.finalScore} pts)
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-300 mt-0.5">
                        {item.vulnerableTo.join('; ')}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-amber-950 text-[10px] font-bold border border-amber-700/60 text-amber-300">
                      BORDERLINE
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 p-3 bg-black/40 rounded-lg border border-zinc-800">
                No fragile borderline teams detected! Your shortlist is exceptionally stable across all weight variations.
              </div>
            )}
          </div>

          {/* Rock-Solid Teams */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Rock-Solid Top Teams ({analysis.rockSolidTeams.length} teams)</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-sans">
              These teams qualify for the Top {config.shortlistCount} in 100% of simulated weight scenarios.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {analysis.rockSolidTeams.slice(0, 15).map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-cyan-950/20 border border-cyan-900/40 rounded text-xs flex items-center justify-between"
                >
                  <span className="font-semibold text-zinc-200 truncate">
                    #{t.computed.rank} {config.anonymizeMode ? t.id.slice(0, 8) : t.teamName}
                  </span>
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
