'use client';

import React from 'react';
import { SelectionConfig, TeamRecord } from '@/types';
import { RadarChart } from './RadarChart';
import {
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Pin,
  Ban,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Code2,
  FileText,
  Link2,
  Globe,
} from 'lucide-react';

interface TeamModalProps {
  team: TeamRecord | null;
  config: SelectionConfig;
  onClose: () => void;
  onUpdateManualStatus: (
    teamId: string,
    status: 'pinned' | 'excluded' | 'waitlisted' | 'normal',
    note?: string
  ) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  team,
  config,
  onClose,
  onUpdateManualStatus,
}) => {
  if (!team) return null;

  const isShortlisted =
    team.computed.manualStatus === 'pinned' ||
    (team.computed.rank <= config.shortlistCount &&
      team.computed.isEligible &&
      team.computed.manualStatus !== 'excluded');

  const displayName = config.anonymizeMode ? `Team [ID: ${team.id.slice(0, 8)}]` : team.teamName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                team.computed.manualStatus === 'pinned'
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : team.computed.manualStatus === 'excluded'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : isShortlisted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : !team.computed.isEligible
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {team.computed.manualStatus === 'pinned'
                ? '📌 PINNED TO SHORTLIST'
                : team.computed.manualStatus === 'excluded'
                ? '❌ EXCLUDED'
                : isShortlisted
                ? `✓ SHORTLISTED (#${team.computed.rank})`
                : !team.computed.isEligible
                ? '✕ DISQUALIFIED'
                : `WAITLIST (#${team.computed.rank})`}
            </span>
            <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
            <span className="text-xs text-slate-400">({team.members.length} members)</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Top Score & Explainability Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-700">
                  {team.computed.finalScore}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ 100 Final Weighted Score</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500">Technical Depth ({config.weights.technicalDepth}%):</span>
                  <div className="font-bold text-slate-800">{team.computed.technicalDepthScore} / 100</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500">Project Exp ({config.weights.projectExperience}%):</span>
                  <div className="font-bold text-slate-800">{team.computed.projectExperienceScore} / 100</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500">Complementarity ({config.weights.skillComplementarity}%):</span>
                  <div className="font-bold text-slate-800">{team.computed.skillComplementarityScore} / 100</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500">Data Completeness ({config.weights.dataCompleteness}%):</span>
                  <div className="font-bold text-slate-800">{team.computed.dataCompletenessScore} / 100</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 pt-1">
                <strong>Why this rank:</strong>{' '}
                {team.computed.isEligible
                  ? `Ranked #${team.computed.rank} using ${config.aggregationStrategy} strategy. Covers disciplines: [${team.computed.coveredRoles.join(', ') || 'General'}].`
                  : `Disqualified by hard eligibility filter: ${team.computed.failedFilters.map((f) => f.reason).join(' ')}`}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-semibold text-slate-500 mb-1">Role Coverage Radar</div>
              {/* Aggregate role coverage */}
              <RadarChart
                coverage={{
                  frontend: Math.max(...team.members.map((m) => m.rawSignals.roleDistribution.frontend)),
                  backend: Math.max(...team.members.map((m) => m.rawSignals.roleDistribution.backend)),
                  ai_ml: Math.max(...team.members.map((m) => m.rawSignals.roleDistribution.ai_ml)),
                  mobile: Math.max(...team.members.map((m) => m.rawSignals.roleDistribution.mobile)),
                  design: Math.max(...team.members.map((m) => m.rawSignals.roleDistribution.design)),
                  devops: Math.max(...team.members.map((m) => m.rawSignals.roleDistribution.devops)),
                  general: 0,
                }}
                size={180}
              />
            </div>
          </div>

          {/* Hard Filters Verification */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Hard Eligibility Gates Audit
            </h3>
            <div className="space-y-1.5">
              {team.computed.failedFilters.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{f.filterName}:</span> {f.reason}
                  </div>
                </div>
              ))}
              {team.computed.passedFilters.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/60 p-2 rounded border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">{f.filterName}:</span> {f.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anti-Cheat & Missing Data Notices */}
          {(team.computed.antiCheatFlags.length > 0 || team.computed.missingDataWarnings.length > 0) && (
            <div className="space-y-2">
              {team.computed.antiCheatFlags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Anti-Cheat Notice:</strong> {flag}
                  </div>
                </div>
              ))}
              {team.computed.missingDataWarnings.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{warning} (Not dropped, but noted for transparent review).</span>
                </div>
              ))}
            </div>
          )}

          {/* Member Profiles Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Team Member Profiles & Verified Proof of Work ({team.members.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {team.members.map((member, i) => {
                const memberName = config.anonymizeMode ? `Member ${i + 1}` : member.name;
                const memberEmail = config.anonymizeMode ? `[Hidden]` : member.email;

                return (
                  <div key={member.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800">{memberName}</div>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                        {Math.round(member.rawSignals.completenessRatio * 100)}% Complete
                      </span>
                    </div>

                    {memberEmail && (
                      <div className="text-[11px] text-slate-500 truncate">{memberEmail}</div>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {member.githubUrl && (
                        <a
                          href={member.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>{member.rawSignals.githubUsername || 'GitHub'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {member.portfolioUrl && (
                        <a
                          href={member.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-600 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Portfolio</span>
                        </a>
                      )}
                      {member.linkedinUrl && (
                        <a
                          href={member.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-sky-600 hover:underline"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {member.resumeUrl && (
                        <a
                          href={member.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-purple-600 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </a>
                      )}
                    </div>

                    {/* GitHub verified stats if available */}
                    {member.rawSignals.githubMetrics && (
                      <div className="bg-white p-2 rounded border border-slate-200 text-[11px] space-y-0.5 text-slate-600">
                        <div className="flex justify-between">
                          <span>Original Repos:</span>
                          <strong className="text-slate-800">
                            {member.rawSignals.githubMetrics.originalRepos} ({member.rawSignals.githubMetrics.forkedRepos} forks)
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Stars:</span>
                          <strong className="text-slate-800">{member.rawSignals.githubMetrics.totalStars} ★</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Annual Commits:</span>
                          <strong className="text-slate-800">
                            ~{member.rawSignals.githubMetrics.estimatedContributions}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Detected Skills */}
                    {member.rawSignals.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {member.rawSignals.skills.map((s) => (
                          <span
                            key={s}
                            className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer (Manual Overrides) */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            Manual Override Controls:
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateManualStatus(team.id, 'pinned')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                team.computed.manualStatus === 'pinned'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Pin to Shortlist</span>
            </button>

            <button
              onClick={() => onUpdateManualStatus(team.id, 'excluded')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                team.computed.manualStatus === 'excluded'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Exclude / Drop</span>
            </button>

            <button
              onClick={() => onUpdateManualStatus(team.id, 'waitlisted')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                team.computed.manualStatus === 'waitlisted'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Force Waitlist</span>
            </button>

            {team.computed.manualStatus && team.computed.manualStatus !== 'normal' && (
              <button
                onClick={() => onUpdateManualStatus(team.id, 'normal')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-200 transition-colors"
                title="Reset to automated ranking"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
