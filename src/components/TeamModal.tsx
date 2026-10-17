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
import { LinkedinIcon } from './LinkedinIcon';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-950 rounded-2xl max-w-4xl w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-cyan-950/80 overflow-hidden max-h-[92vh] flex flex-col my-auto font-mono text-xs text-zinc-300">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-black/60 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                team.computed.manualStatus === 'pinned'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : team.computed.manualStatus === 'excluded'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : isShortlisted
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : !team.computed.isEligible
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {team.computed.manualStatus === 'pinned'
                ? '📌 PINNED'
                : team.computed.manualStatus === 'excluded'
                ? '✕ EXCLUDED'
                : isShortlisted
                ? `✓ SHORTLIST (#${team.computed.rank})`
                : !team.computed.isEligible
                ? '✕ DISQUALIFIED'
                : `WAITLIST (#${team.computed.rank})`}
            </span>
            <h2 className="text-lg font-bold text-zinc-100">{displayName}</h2>
            <span className="text-xs text-zinc-500">({team.members.length} members)</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-zinc-300">
          {/* Top Score & Explainability Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center bg-black/50 p-4 rounded-xl border border-cyan-900/40">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-cyan-400 neon-glow-cyan font-mono">
                  {team.computed.finalScore}
                </span>
                <span className="text-xs text-zinc-500 font-medium">/ 100 Final Incursion Score</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">Technical Depth ({config.weights.technicalDepth}%):</span>
                  <div className="font-bold text-cyan-300 mt-0.5">{team.computed.technicalDepthScore} / 100</div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">Project Exp ({config.weights.projectExperience}%):</span>
                  <div className="font-bold text-cyan-300 mt-0.5">{team.computed.projectExperienceScore} / 100</div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">Complementarity ({config.weights.skillComplementarity}%):</span>
                  <div className="font-bold text-cyan-300 mt-0.5">{team.computed.skillComplementarityScore} / 100</div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">Data Completeness ({config.weights.dataCompleteness}%):</span>
                  <div className="font-bold text-cyan-300 mt-0.5">{team.computed.dataCompletenessScore} / 100</div>
                </div>
                {team.computed.linkedinScore !== undefined && (
                  <div className="bg-blue-950/20 p-2.5 rounded-lg border border-blue-900/60 col-span-2">
                    <span className="text-blue-400 block flex items-center gap-1 font-mono text-[11px]">
                      <LinkedinIcon className="w-3 h-3 text-blue-400" />
                      LinkedIn Professional Signal:
                    </span>
                    <div className="font-bold text-blue-300 mt-0.5">{team.computed.linkedinScore} / 100</div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-zinc-400 pt-1 font-sans">
                <strong className="text-zinc-300 font-mono">Why this rank:</strong>{' '}
                {team.computed.isEligible
                  ? `Ranked #${team.computed.rank} using ${config.aggregationStrategy} model. Covers disciplines: [${team.computed.coveredRoles.join(', ') || 'General'}].`
                  : `Disqualified by hard eligibility filter: ${team.computed.failedFilters.map((f) => f.reason).join(' ')}`}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                Role Coverage Radar
              </div>
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
          <div className="border border-zinc-800/80 rounded-xl p-4 space-y-2 bg-black/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Hard Eligibility Gates Audit
            </h3>
            <div className="space-y-1.5">
              {team.computed.failedFilters.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/30 p-2 rounded border border-rose-900/60">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{f.filterName}:</span> {f.reason}
                  </div>
                </div>
              ))}
              {team.computed.passedFilters.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/20 p-2 rounded border border-emerald-900/50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
                <div key={idx} className="flex items-start gap-2 bg-amber-950/30 border border-amber-900/60 p-2.5 rounded-lg text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Anti-Cheat Notice:</strong> {flag}
                  </div>
                </div>
              ))}
              {team.computed.missingDataWarnings.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-black/50 border border-zinc-800 p-2 rounded-lg text-xs text-zinc-400">
                  <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  <span>{warning} (Not dropped, but noted for transparent review).</span>
                </div>
              ))}
            </div>
          )}

          {/* Member Profiles Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Team Member Profiles & Verified Proof of Work ({team.members.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {team.members.map((member, i) => {
                const memberName = config.anonymizeMode ? `Member ${i + 1}` : member.name;
                const memberEmail = config.anonymizeMode ? `[Hidden]` : member.email;

                return (
                  <div key={member.id} className="p-3 bg-black/40 border border-zinc-800/80 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-zinc-100">{memberName}</div>
                      <span className="text-[10px] bg-zinc-900 border border-zinc-700 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                        {Math.round(member.rawSignals.completenessRatio * 100)}% Complete
                      </span>
                    </div>

                    {memberEmail && (
                      <div className="text-[11px] text-zinc-500 truncate">{memberEmail}</div>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {member.githubUrl && (
                        <a
                          href={member.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
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
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
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
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
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
                          className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </a>
                      )}
                    </div>

                    {/* GitHub verified stats if available */}
                    {member.rawSignals.githubMetrics && (
                      <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800 text-[11px] space-y-0.5 text-zinc-400">
                        <div className="flex justify-between">
                          <span>Original Repos:</span>
                          <strong className="text-zinc-200">
                            {member.rawSignals.githubMetrics.originalRepos} ({member.rawSignals.githubMetrics.forkedRepos} forks)
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Stars:</span>
                          <strong className="text-cyan-400">{member.rawSignals.githubMetrics.totalStars} ★</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Annual Commits:</span>
                          <strong className="text-blue-400">
                            ~{member.rawSignals.githubMetrics.estimatedContributions}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* LinkedIn verified stats if available */}
                    {member.rawSignals.linkedinMetrics && (
                      <div className="bg-blue-950/20 p-2 rounded border border-blue-900/50 text-[11px] space-y-1 text-zinc-300">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-blue-400 font-semibold truncate max-w-[170px]">
                            <LinkedinIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>@{member.rawSignals.linkedinMetrics.username}</span>
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800 text-blue-300 shrink-0">
                            {member.rawSignals.linkedinMetrics.verifiedScore} pts
                          </span>
                        </div>

                        {member.rawSignals.linkedinMetrics.headline && (
                          <div className="text-[10px] text-zinc-400 italic line-clamp-2">
                            &ldquo;{member.rawSignals.linkedinMetrics.headline}&rdquo;
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {member.rawSignals.linkedinMetrics.seniorityLevel !== 'unknown' && (
                            <span className="bg-zinc-900 border border-zinc-700 text-cyan-300 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase">
                              Level: {member.rawSignals.linkedinMetrics.seniorityLevel}
                            </span>
                          )}
                          {member.rawSignals.linkedinMetrics.has500PlusConnections && (
                            <span className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                              500+ Connections
                            </span>
                          )}
                          {member.rawSignals.linkedinMetrics.isCustomVanitySlug && (
                            <span className="bg-purple-950/80 border border-purple-800 text-purple-300 text-[9px] px-1.5 py-0.5 rounded font-mono">
                              Vanity Slug Claimed
                            </span>
                          )}
                          {member.rawSignals.linkedinMetrics.crossMatchesGithub && (
                            <span className="bg-blue-950/80 border border-blue-800 text-blue-300 text-[9px] px-1.5 py-0.5 rounded font-mono">
                              ✓ Matches GitHub
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Detected Skills */}
                    {member.rawSignals.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {member.rawSignals.skills.map((s) => (
                          <span
                            key={s}
                            className="bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[10px] px-1.5 py-0.5 rounded font-medium"
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
        <div className="px-6 py-3.5 bg-black/60 border-t border-cyan-950/60 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-zinc-500 uppercase">
            Manual Override Controls:
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateManualStatus(team.id, 'pinned')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                team.computed.manualStatus === 'pinned'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-purple-400 hover:text-purple-300'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Pin to Shortlist</span>
            </button>

            <button
              onClick={() => onUpdateManualStatus(team.id, 'excluded')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                team.computed.manualStatus === 'excluded'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-rose-400 hover:text-rose-300'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Exclude / Drop</span>
            </button>

            <button
              onClick={() => onUpdateManualStatus(team.id, 'waitlisted')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                team.computed.manualStatus === 'waitlisted'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-amber-400 hover:text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Force Waitlist</span>
            </button>

            {team.computed.manualStatus && team.computed.manualStatus !== 'normal' && (
              <button
                onClick={() => onUpdateManualStatus(team.id, 'normal')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
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
