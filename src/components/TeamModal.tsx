'use client';

import React, { useState, useEffect } from 'react';
import { SelectionConfig, TeamRecord, MemberProfile, TeamManualOverrides } from '@/types';
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
  Edit3,
  Save,
  RefreshCw,
  Zap,
  Plus,
  Trash2,
  Sliders,
  Check,
} from 'lucide-react';
import { LinkedinIcon } from './LinkedinIcon';
import { syncSingleMemberSignals, syncEntireTeamSignals } from '@/engine/individualSync';

interface TeamModalProps {
  team: TeamRecord | null;
  config: SelectionConfig;
  onClose: () => void;
  onUpdateManualStatus: (
    teamId: string,
    status: 'pinned' | 'excluded' | 'waitlisted' | 'normal',
    note?: string
  ) => void;
  onUpdateTeam?: (updatedTeam: TeamRecord) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  team,
  config,
  onClose,
  onUpdateManualStatus,
  onUpdateTeam,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTeam, setEditedTeam] = useState<TeamRecord | null>(team);
  const [syncingMemberId, setSyncingMemberId] = useState<string | null>(null);
  const [isSyncingTeam, setIsSyncingTeam] = useState(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const [newSkillInput, setNewSkillInput] = useState<{ [memberId: string]: string }>({});

  useEffect(() => {
    setEditedTeam(team);
    setIsEditing(false);
    setSyncNotification(null);
  }, [team?.id]);

  if (!team || !editedTeam) return null;

  const currentTeam = isEditing ? editedTeam : team;

  const isShortlisted =
    currentTeam.computed.manualStatus === 'pinned' ||
    (currentTeam.computed.rank <= config.shortlistCount &&
      currentTeam.computed.isEligible &&
      currentTeam.computed.manualStatus !== 'excluded');

  const displayName = config.anonymizeMode
    ? `Team [ID: ${currentTeam.id.slice(0, 8)}]`
    : currentTeam.teamName;

  const showNotification = (msg: string) => {
    setSyncNotification(msg);
    setTimeout(() => {
      setSyncNotification(null);
    }, 4500);
  };

  // 1. Single Member Live Sync
  const handleSyncMember = async (memberIndex: number) => {
    const targetMember = editedTeam.members[memberIndex];
    if (!targetMember) return;

    setSyncingMemberId(targetMember.id);
    try {
      const res = await syncSingleMemberSignals(targetMember, targetMember.name);
      const updatedMembers = [...editedTeam.members];
      updatedMembers[memberIndex] = res.updatedMember;

      const updatedTeamRecord: TeamRecord = {
        ...editedTeam,
        members: updatedMembers,
      };

      setEditedTeam(updatedTeamRecord);
      if (onUpdateTeam) {
        onUpdateTeam(updatedTeamRecord);
      }
      showNotification(`✓ Synced live signals for ${targetMember.name}: ${res.details.join(' • ')}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      showNotification(`⚠️ Sync error: ${msg}`);
    } finally {
      setSyncingMemberId(null);
    }
  };

  // 2. Entire Team Live Sync
  const handleSyncTeam = async () => {
    setIsSyncingTeam(true);
    try {
      const res = await syncEntireTeamSignals(editedTeam);
      setEditedTeam(res.updatedTeam);
      if (onUpdateTeam) {
        onUpdateTeam(res.updatedTeam);
      }
      showNotification(`✓ ${res.summary}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      showNotification(`⚠️ Team sync error: ${msg}`);
    } finally {
      setIsSyncingTeam(false);
    }
  };

  // 3. Save All Overrides & Signals
  const handleSaveAll = () => {
    if (!onUpdateTeam) return;
    onUpdateTeam(editedTeam);
    setIsEditing(false);
    showNotification('✓ Applied manual overrides and re-scored team!');
  };

  // 4. Reset Overrides
  const handleResetOverrides = () => {
    const cleaned: TeamRecord = {
      ...editedTeam,
      manualOverrides: undefined,
    };
    setEditedTeam(cleaned);
    if (onUpdateTeam) {
      onUpdateTeam(cleaned);
    }
    showNotification('✓ Reverted to automated system decisions.');
  };

  // Helper to update specific manualOverride field
  const updateOverrideField = <K extends keyof TeamManualOverrides>(
    key: K,
    val: TeamManualOverrides[K]
  ) => {
    setEditedTeam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        manualOverrides: {
          ...(prev.manualOverrides || {}),
          [key]: val,
        },
      };
    });
  };

  // Helper to update gate override
  const updateGateOverride = (gateName: string, state: 'auto' | 'pass' | 'fail') => {
    setEditedTeam((prev) => {
      if (!prev) return prev;
      const currentGateOverrides = { ...(prev.manualOverrides?.gateOverrides || {}) };

      if (state === 'auto') {
        delete currentGateOverrides[gateName];
      } else {
        currentGateOverrides[gateName] = state === 'pass';
      }

      return {
        ...prev,
        manualOverrides: {
          ...(prev.manualOverrides || {}),
          gateOverrides: currentGateOverrides,
        },
      };
    });
  };

  // Helper to update member field
  const updateMember = (memberIdx: number, updates: Partial<MemberProfile>) => {
    setEditedTeam((prev) => {
      if (!prev) return prev;
      const updatedMembers = [...prev.members];
      updatedMembers[memberIdx] = {
        ...updatedMembers[memberIdx],
        ...updates,
      };
      return {
        ...prev,
        members: updatedMembers,
      };
    });
  };

  // Helper to add skill to member
  const handleAddSkill = (memberIdx: number, skillName: string) => {
    const cleanSkill = skillName.trim();
    if (!cleanSkill) return;
    const member = editedTeam.members[memberIdx];
    if (!member) return;

    const existingSkills = member.rawSignals.skills || [];
    if (!existingSkills.includes(cleanSkill)) {
      updateMember(memberIdx, {
        rawSignals: {
          ...member.rawSignals,
          skills: [...existingSkills, cleanSkill],
        },
      });
    }

    setNewSkillInput((prev) => ({ ...prev, [member.id]: '' }));
  };

  // Helper to remove skill from member
  const handleRemoveSkill = (memberIdx: number, skillName: string) => {
    const member = editedTeam.members[memberIdx];
    if (!member) return;
    updateMember(memberIdx, {
      rawSignals: {
        ...member.rawSignals,
        skills: (member.rawSignals.skills || []).filter((s) => s !== skillName),
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-950 rounded-2xl max-w-4xl w-full shadow-[0_0_60px_rgba(0,0,0,0.9)] border border-cyan-500/40 overflow-hidden max-h-[94vh] flex flex-col my-auto font-mono text-xs text-zinc-300 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-black/70 border-b border-cyan-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                currentTeam.computed.manualStatus === 'pinned'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : currentTeam.computed.manualStatus === 'excluded'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : isShortlisted
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : !currentTeam.computed.isEligible
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {currentTeam.computed.manualStatus === 'pinned'
                ? '📌 PINNED'
                : currentTeam.computed.manualStatus === 'excluded'
                ? '✕ EXCLUDED'
                : isShortlisted
                ? `✓ SHORTLIST (#${currentTeam.computed.rank})`
                : !currentTeam.computed.isEligible
                ? '✕ DISQUALIFIED'
                : `WAITLIST (#${currentTeam.computed.rank})`}
            </span>

            {currentTeam.computed.hasManualOverrides && (
              <span
                title="This team has custom manual overrides applied by the organizer"
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>OVERRIDDEN</span>
              </span>
            )}

            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-1.5">
              <span>{displayName}</span>
              <span className="text-xs text-zinc-500 font-normal">
                ({currentTeam.members.length} members)
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Entire Team */}
            <button
              onClick={handleSyncTeam}
              disabled={isSyncingTeam}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 hover:border-cyan-400 transition-colors flex items-center gap-1.5 font-bold cursor-pointer disabled:opacity-50 text-[11px]"
              title="Sync live GitHub, LinkedIn and Resume signals for all members in this team"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingTeam ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncingTeam ? 'Syncing Team...' : 'Sync Team'}
              </span>
            </button>

            {/* Toggle Edit & Manual Override Mode */}
            {onUpdateTeam && (
              <button
                onClick={() => setIsEditing((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-zinc-900 text-zinc-300 hover:text-cyan-300 border border-zinc-700 hover:border-cyan-400'
                }`}
                title="Toggle manual override mode to edit decisions, scores, and candidate signals"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Editing Mode' : 'Edit & Override'}</span>
              </button>
            )}

            {isEditing && (
              <button
                onClick={handleSaveAll}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-[11px] flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                title="Save manual overrides & re-score team immediately"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Close Scorecard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Sync Notification Banner */}
        {syncNotification && (
          <div className="px-5 py-2 bg-cyan-950/80 border-b border-cyan-800/80 text-cyan-300 text-xs font-mono flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{syncNotification}</span>
            </div>
            <button
              onClick={() => setSyncNotification(null)}
              className="text-cyan-400 hover:text-cyan-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto cyber-scrollbar space-y-6 text-zinc-300">
          {/* ========================================================================= */}
          {/* EDIT & OVERRIDE CONTROLS (Rendered when isEditing is true) */}
          {/* ========================================================================= */}
          {isEditing && (
            <div className="bg-zinc-900/80 border border-amber-500/40 rounded-xl p-4 sm:p-5 space-y-5 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Master Decisions & Score Overrides
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetOverrides}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Remove custom score & gate overrides for this team"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Overrides</span>
                  </button>
                </div>
              </div>

              {/* 1. Master Team Name & Eligibility Decision */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 font-bold block">Team Name:</label>
                  <input
                    type="text"
                    value={editedTeam.teamName}
                    onChange={(e) =>
                      setEditedTeam((prev) => (prev ? { ...prev, teamName: e.target.value } : prev))
                    }
                    className="w-full px-3 py-1.5 bg-black/80 border border-zinc-700 focus:border-cyan-400 rounded text-zinc-100 font-bold text-xs outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 font-bold block">
                    Master Eligibility Override:
                  </label>
                  <div className="flex items-center bg-black/80 border border-zinc-700 rounded-lg p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => updateOverrideField('isEligibleOverride', undefined)}
                      className={`flex-1 py-1 rounded transition-colors cursor-pointer ${
                        editedTeam.manualOverrides?.isEligibleOverride === undefined
                          ? 'bg-zinc-800 text-cyan-300 font-bold'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Auto (Gates)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOverrideField('isEligibleOverride', true)}
                      className={`flex-1 py-1 rounded transition-colors cursor-pointer ${
                        editedTeam.manualOverrides?.isEligibleOverride === true
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-zinc-500 hover:text-emerald-300'
                      }`}
                    >
                      Force Eligible
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOverrideField('isEligibleOverride', false)}
                      className={`flex-1 py-1 rounded transition-colors cursor-pointer ${
                        editedTeam.manualOverrides?.isEligibleOverride === false
                          ? 'bg-rose-600 text-white font-bold'
                          : 'text-zinc-500 hover:text-rose-300'
                      }`}
                    >
                      Force Disqualified
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Hard Eligibility Gates Individual Overrides */}
              <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Individual Hard Gate Decisions (Pass/Fail Overrides):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    'Team Size Restriction',
                    'Mandatory GitHub Profile (≥1 Member)',
                    'Mandatory GitHub Profile (All Members)',
                    'Minimum GitHub Contributions',
                    'Resume or Portfolio Requirement',
                    'Skill Breadth Minimum',
                    'Compulsory Female Participation',
                  ].map((gate) => {
                    const gateOverrides = editedTeam.manualOverrides?.gateOverrides || {};
                    const overrideVal = gateOverrides[gate];
                    const autoFailed = currentTeam.computed.failedFilters.some(
                      (f) => f.filterName === gate
                    );

                    return (
                      <div
                        key={gate}
                        className="bg-black/60 p-2.5 rounded-lg border border-zinc-800 space-y-1.5 text-[11px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200 truncate max-w-[170px]" title={gate}>
                            {gate}
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              autoFailed ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                            }`}
                          >
                            Auto: {autoFailed ? 'FAIL' : 'PASS'}
                          </span>
                        </div>

                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => updateGateOverride(gate, 'auto')}
                            className={`flex-1 py-0.5 rounded transition-colors cursor-pointer ${
                              overrideVal === undefined
                                ? 'bg-zinc-700 text-white font-bold'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            Auto
                          </button>
                          <button
                            type="button"
                            onClick={() => updateGateOverride(gate, 'pass')}
                            className={`flex-1 py-0.5 rounded transition-colors cursor-pointer ${
                              overrideVal === true
                                ? 'bg-emerald-500 text-black font-bold'
                                : 'text-zinc-500 hover:text-emerald-300'
                            }`}
                          >
                            Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => updateGateOverride(gate, 'fail')}
                            className={`flex-1 py-0.5 rounded transition-colors cursor-pointer ${
                              overrideVal === false
                                ? 'bg-rose-600 text-white font-bold'
                                : 'text-zinc-500 hover:text-rose-300'
                            }`}
                          >
                            Fail
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Dimension Score Overrides */}
              <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Scoring Dimension Overrides (0 - 100):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                  <div className="bg-black/60 p-2 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block truncate">Tech Depth:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder={String(currentTeam.computed.technicalDepthScore)}
                      value={editedTeam.manualOverrides?.technicalDepthScore ?? ''}
                      onChange={(e) =>
                        updateOverrideField(
                          'technicalDepthScore',
                          e.target.value === '' ? undefined : parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 text-cyan-300 font-bold px-2 py-1 rounded text-center outline-none mt-1"
                    />
                  </div>

                  <div className="bg-black/60 p-2 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block truncate">Project Exp:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder={String(currentTeam.computed.projectExperienceScore)}
                      value={editedTeam.manualOverrides?.projectExperienceScore ?? ''}
                      onChange={(e) =>
                        updateOverrideField(
                          'projectExperienceScore',
                          e.target.value === '' ? undefined : parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 text-cyan-300 font-bold px-2 py-1 rounded text-center outline-none mt-1"
                    />
                  </div>

                  <div className="bg-black/60 p-2 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block truncate">Synergy / Roles:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder={String(currentTeam.computed.skillComplementarityScore)}
                      value={editedTeam.manualOverrides?.skillComplementarityScore ?? ''}
                      onChange={(e) =>
                        updateOverrideField(
                          'skillComplementarityScore',
                          e.target.value === '' ? undefined : parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 text-cyan-300 font-bold px-2 py-1 rounded text-center outline-none mt-1"
                    />
                  </div>

                  <div className="bg-black/60 p-2 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block truncate">Completeness:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder={String(currentTeam.computed.dataCompletenessScore)}
                      value={editedTeam.manualOverrides?.dataCompletenessScore ?? ''}
                      onChange={(e) =>
                        updateOverrideField(
                          'dataCompletenessScore',
                          e.target.value === '' ? undefined : parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 text-cyan-300 font-bold px-2 py-1 rounded text-center outline-none mt-1"
                    />
                  </div>

                  <div className="bg-black/60 p-2 rounded-lg border border-cyan-800/80">
                    <span className="text-[10px] text-cyan-400 block font-bold truncate">Direct Final Score:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder={String(currentTeam.computed.finalScore)}
                      value={editedTeam.manualOverrides?.finalScore ?? ''}
                      onChange={(e) =>
                        updateOverrideField(
                          'finalScore',
                          e.target.value === '' ? undefined : parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-cyan-950/80 border border-cyan-500 text-cyan-300 font-black px-2 py-1 rounded text-center outline-none mt-1 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Anti-Cheat Forgive / Dismiss */}
              {currentTeam.computed.antiCheatFlags.length > 0 && (
                <div className="pt-1 flex items-center justify-between bg-amber-950/30 border border-amber-900/60 p-2.5 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>This team is flagged by the anti-cheat engine. Dismiss penalty?</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-300">
                    <input
                      type="checkbox"
                      checked={Boolean(editedTeam.manualOverrides?.antiCheatDismissed)}
                      onChange={(e) => updateOverrideField('antiCheatDismissed', e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>Forgive & Dismiss Flags</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STANDARD SCORECARD & EXPLAINABILITY (Always accessible) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center bg-black/50 p-4 rounded-xl border border-cyan-900/40">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-cyan-400 neon-glow-cyan font-mono">
                  {currentTeam.computed.finalScore}
                </span>
                <span className="text-xs text-zinc-500 font-medium">/ 100 Final Incursion Score</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">
                    Technical Depth ({config.weights.technicalDepth}%):
                  </span>
                  <div className="font-bold text-cyan-300 mt-0.5">
                    {currentTeam.computed.technicalDepthScore} / 100
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">
                    Project Exp ({config.weights.projectExperience}%):
                  </span>
                  <div className="font-bold text-cyan-300 mt-0.5">
                    {currentTeam.computed.projectExperienceScore} / 100
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">
                    Complementarity ({config.weights.skillComplementarity}%):
                  </span>
                  <div className="font-bold text-cyan-300 mt-0.5">
                    {currentTeam.computed.skillComplementarityScore} / 100
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">
                    Data Completeness ({config.weights.dataCompleteness}%):
                  </span>
                  <div className="font-bold text-cyan-300 mt-0.5">
                    {currentTeam.computed.dataCompletenessScore} / 100
                  </div>
                </div>
                {currentTeam.computed.linkedinScore !== undefined && (
                  <div className="bg-blue-950/20 p-2.5 rounded-lg border border-blue-900/60 col-span-2">
                    <span className="text-blue-400 block flex items-center gap-1 font-mono text-[11px]">
                      <LinkedinIcon className="w-3 h-3 text-blue-400" />
                      LinkedIn Professional Signal:
                    </span>
                    <div className="font-bold text-blue-300 mt-0.5">
                      {currentTeam.computed.linkedinScore} / 100
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-zinc-400 pt-1 font-sans">
                <strong className="text-zinc-300 font-mono">Why this rank:</strong>{' '}
                {currentTeam.computed.isEligible
                  ? `Ranked #${currentTeam.computed.rank} using ${config.aggregationStrategy} model. Covers disciplines: [${
                      currentTeam.computed.coveredRoles.join(', ') || 'General'
                    }].`
                  : `Disqualified by hard eligibility filter: ${currentTeam.computed.failedFilters
                      .map((f) => f.reason)
                      .join(' ')}`}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                Role Coverage Radar
              </div>
              <RadarChart
                coverage={{
                  frontend: Math.max(
                    ...currentTeam.members.map((m) => m.rawSignals.roleDistribution.frontend)
                  ),
                  backend: Math.max(
                    ...currentTeam.members.map((m) => m.rawSignals.roleDistribution.backend)
                  ),
                  ai_ml: Math.max(
                    ...currentTeam.members.map((m) => m.rawSignals.roleDistribution.ai_ml)
                  ),
                  mobile: Math.max(
                    ...currentTeam.members.map((m) => m.rawSignals.roleDistribution.mobile)
                  ),
                  design: Math.max(
                    ...currentTeam.members.map((m) => m.rawSignals.roleDistribution.design)
                  ),
                  devops: Math.max(
                    ...currentTeam.members.map((m) => m.rawSignals.roleDistribution.devops)
                  ),
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
              {currentTeam.computed.failedFilters.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/30 p-2 rounded border border-rose-900/60"
                >
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{f.filterName}:</span> {f.reason}
                  </div>
                </div>
              ))}
              {currentTeam.computed.passedFilters.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/20 p-2 rounded border border-emerald-900/50"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">{f.filterName}:</span> {f.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Profiles Breakdown & Signal Editors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Team Member Profiles & Live Signals ({currentTeam.members.length})
              </h3>
              {isEditing && (
                <span className="text-[10px] text-amber-400 font-normal">
                  (Editing member details & live fetched metrics)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentTeam.members.map((member, i) => {
                const isSyncingThis = syncingMemberId === member.id;

                if (isEditing) {
                  // --- MEMBER EDIT CARD ---
                  return (
                    <div
                      key={member.id}
                      className="p-3.5 bg-black/70 border border-zinc-700/80 rounded-xl space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                          <span>Member #{i + 1}</span>
                          {member.isFemale && (
                            <span className="text-[9px] bg-pink-950 text-pink-300 border border-pink-800 px-1 py-0.2 rounded font-bold">
                              ♀ Female
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSyncMember(i)}
                          disabled={isSyncingThis}
                          className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[10px] flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
                          title="Sync live GitHub, LinkedIn and Resume signals for this member only"
                        >
                          <RefreshCw
                            className={`w-3 h-3 text-cyan-400 ${isSyncingThis ? 'animate-spin' : ''}`}
                          />
                          <span>{isSyncingThis ? 'Syncing...' : 'Sync Member'}</span>
                        </button>
                      </div>

                      {/* Name & Email */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block font-medium">Name:</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => updateMember(i, { name: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-zinc-200 outline-none text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block font-medium">Email:</label>
                          <input
                            type="email"
                            value={member.email || ''}
                            onChange={(e) => updateMember(i, { email: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-zinc-200 outline-none text-[11px]"
                          />
                        </div>
                      </div>

                      {/* Mobile / Phone & College & Academic Year */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block font-medium">Mobile / Phone:</label>
                          <input
                            type="text"
                            value={member.phone || ''}
                            onChange={(e) => updateMember(i, { phone: e.target.value })}
                            placeholder="+1 555-0199 / 9876543210"
                            className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-zinc-200 outline-none text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block font-medium">College / Institute:</label>
                          <input
                            type="text"
                            value={member.college || ''}
                            onChange={(e) => updateMember(i, { college: e.target.value })}
                            placeholder="e.g. Stanford / IIT Bombay"
                            className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-zinc-200 outline-none text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block font-medium">Year of Study / Grad:</label>
                          <input
                            type="text"
                            value={member.gradYear || ''}
                            onChange={(e) => updateMember(i, { gradYear: e.target.value })}
                            placeholder="e.g. 3rd Year / 2026"
                            className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-zinc-200 outline-none text-[11px]"
                          />
                        </div>
                      </div>

                      {/* Gender Selector */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-medium">Gender Representation:</span>
                        <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded p-0.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => updateMember(i, { isFemale: true, gender: 'female' })}
                            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                              member.isFemale
                                ? 'bg-pink-600 text-white font-bold'
                                : 'text-zinc-400 hover:text-pink-300'
                            }`}
                          >
                            ♀ Female
                          </button>
                          <button
                            type="button"
                            onClick={() => updateMember(i, { isFemale: false, gender: 'male' })}
                            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                              member.gender === 'male' && !member.isFemale
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-zinc-400 hover:text-blue-300'
                            }`}
                          >
                            ♂ Male
                          </button>
                          <button
                            type="button"
                            onClick={() => updateMember(i, { isFemale: false, gender: 'unspecified' })}
                            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                              !member.isFemale && member.gender !== 'male'
                                ? 'bg-zinc-700 text-white font-bold'
                                : 'text-zinc-400'
                            }`}
                          >
                            Other
                          </button>
                        </div>
                      </div>

                      {/* GitHub URL & Fetched Metrics */}
                      <div className="space-y-1.5 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                        <label className="text-[10px] text-cyan-400 font-bold block flex items-center gap-1">
                          <Code2 className="w-3 h-3 text-cyan-400" />
                          <span>GitHub URL / Handle:</span>
                        </label>
                        <input
                          type="text"
                          value={member.githubUrl || member.rawSignals.githubUsername || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateMember(i, {
                              githubUrl: val,
                              rawSignals: { ...member.rawSignals, githubUsername: val },
                            });
                          }}
                          placeholder="https://github.com/username"
                          className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-cyan-300 outline-none text-[11px]"
                        />

                        {/* Editable Fetched GitHub Stats */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                          <div>
                            <span className="text-zinc-500 block">Commits:</span>
                            <input
                              type="number"
                              value={member.rawSignals.githubMetrics?.estimatedContributions || 0}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0;
                                updateMember(i, {
                                  rawSignals: {
                                    ...member.rawSignals,
                                    githubMetrics: {
                                      ...(member.rawSignals.githubMetrics || {
                                        username: member.rawSignals.githubUsername || '',
                                        publicRepos: 0,
                                        originalRepos: 0,
                                        forkedRepos: 0,
                                        totalStars: 0,
                                        estimatedContributions: count,
                                        topLanguages: [],
                                        isSuspicious: false,
                                      }),
                                      estimatedContributions: count,
                                    },
                                  },
                                });
                              }}
                              className="w-full bg-black border border-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded text-center"
                            />
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Stars:</span>
                            <input
                              type="number"
                              value={member.rawSignals.githubMetrics?.totalStars || 0}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0;
                                updateMember(i, {
                                  rawSignals: {
                                    ...member.rawSignals,
                                    githubMetrics: {
                                      ...(member.rawSignals.githubMetrics || {
                                        username: member.rawSignals.githubUsername || '',
                                        publicRepos: 0,
                                        originalRepos: 0,
                                        forkedRepos: 0,
                                        totalStars: count,
                                        estimatedContributions: 0,
                                        topLanguages: [],
                                        isSuspicious: false,
                                      }),
                                      totalStars: count,
                                    },
                                  },
                                });
                              }}
                              className="w-full bg-black border border-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded text-center"
                            />
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Repos:</span>
                            <input
                              type="number"
                              value={member.rawSignals.githubMetrics?.originalRepos || 0}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0;
                                updateMember(i, {
                                  rawSignals: {
                                    ...member.rawSignals,
                                    githubMetrics: {
                                      ...(member.rawSignals.githubMetrics || {
                                        username: member.rawSignals.githubUsername || '',
                                        publicRepos: count,
                                        originalRepos: count,
                                        forkedRepos: 0,
                                        totalStars: 0,
                                        estimatedContributions: 0,
                                        topLanguages: [],
                                        isSuspicious: false,
                                      }),
                                      originalRepos: count,
                                    },
                                  },
                                });
                              }}
                              className="w-full bg-black border border-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded text-center"
                            />
                          </div>
                        </div>
                      </div>

                      {/* LinkedIn URL & Signals */}
                      <div className="space-y-1.5 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                        <label className="text-[10px] text-blue-400 font-bold block flex items-center gap-1">
                          <LinkedinIcon className="w-3 h-3 text-blue-400" />
                          <span>LinkedIn Profile URL:</span>
                        </label>
                        <input
                          type="text"
                          value={member.linkedinUrl || ''}
                          onChange={(e) => updateMember(i, { linkedinUrl: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-blue-300 outline-none text-[11px]"
                        />

                        <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                          <div>
                            <span className="text-zinc-500 block">Seniority:</span>
                            <select
                              value={member.rawSignals.linkedinMetrics?.seniorityLevel || 'unknown'}
                              onChange={(e) => {
                                const level = e.target.value as any;
                                updateMember(i, {
                                  rawSignals: {
                                    ...member.rawSignals,
                                    linkedinMetrics: {
                                      ...(member.rawSignals.linkedinMetrics || {
                                        seniorityLevel: level,
                                        has500PlusConnections: false,
                                        isCustomVanitySlug: false,
                                        crossMatchesGithub: false,
                                        extractedSkills: [],
                                        verifiedScore: 25,
                                      }),
                                      seniorityLevel: level,
                                    },
                                  },
                                });
                              }}
                              className="w-full bg-black border border-zinc-700 text-zinc-300 px-1 py-0.5 rounded"
                            >
                              <option value="student">Student</option>
                              <option value="junior">Junior</option>
                              <option value="mid">Mid-Level</option>
                              <option value="senior">Senior</option>
                              <option value="founder">Founder / Lead</option>
                              <option value="unknown">Unknown</option>
                            </select>
                          </div>
                          <div className="flex items-center pt-3">
                            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-[10px]">
                              <input
                                type="checkbox"
                                checked={Boolean(member.rawSignals.linkedinMetrics?.has500PlusConnections)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  updateMember(i, {
                                    rawSignals: {
                                      ...member.rawSignals,
                                      linkedinMetrics: {
                                        ...(member.rawSignals.linkedinMetrics || {
                                          seniorityLevel: 'unknown',
                                          has500PlusConnections: checked,
                                          isCustomVanitySlug: false,
                                          crossMatchesGithub: false,
                                          extractedSkills: [],
                                          verifiedScore: 25,
                                        }),
                                        has500PlusConnections: checked,
                                      },
                                    },
                                  });
                                }}
                                className="rounded accent-emerald-500"
                              />
                              <span>500+ Connections</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Resume & Portfolio URLs */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="text-zinc-400 block font-medium">Resume Cloud Link:</label>
                          <input
                            type="text"
                            value={member.resumeUrl || ''}
                            onChange={(e) => updateMember(i, { resumeUrl: e.target.value })}
                            placeholder="https://drive.google.com/..."
                            className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-purple-300 outline-none text-[10px]"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 block font-medium">Portfolio / Site:</label>
                          <input
                            type="text"
                            value={member.portfolioUrl || ''}
                            onChange={(e) => updateMember(i, { portfolioUrl: e.target.value })}
                            placeholder="https://mysite.dev"
                            className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-emerald-300 outline-none text-[10px]"
                          />
                        </div>
                      </div>

                      {/* Skills Tags Editor */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] text-zinc-400 font-bold block">
                          Verified Skills ({member.rawSignals.skills.length}):
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {member.rawSignals.skills.map((s) => (
                            <span
                              key={s}
                              className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] px-1.5 py-0.2 rounded font-medium flex items-center gap-1"
                            >
                              <span>{s}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(i, s)}
                                className="text-cyan-500 hover:text-rose-400 cursor-pointer font-bold"
                                title={`Remove ${s}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add Skill Input */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={newSkillInput[member.id] || ''}
                            onChange={(e) =>
                              setNewSkillInput((prev) => ({ ...prev, [member.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkill(i, newSkillInput[member.id] || '');
                              }
                            }}
                            placeholder="Add skill (e.g. Next.js, PyTorch)..."
                            className="flex-1 bg-black border border-zinc-700 px-2 py-0.5 rounded text-zinc-200 text-[10px] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSkill(i, newSkillInput[member.id] || '')}
                            className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 rounded text-[10px] font-bold cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // --- MEMBER VIEW CARD (Standard) ---
                const memberName = config.anonymizeMode ? `Member ${i + 1}` : member.name;
                const memberEmail = config.anonymizeMode ? `[Hidden]` : member.email;

                return (
                  <div
                    key={member.id}
                    className="p-3.5 bg-black/40 border border-zinc-800/80 rounded-xl space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100">{memberName}</span>
                        {member.isFemale && (
                          <span className="text-[10px] bg-pink-950/80 text-pink-300 border border-pink-800/80 px-1.5 py-0.2 rounded font-bold font-mono">
                            ♀ Female
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSyncMember(i)}
                          disabled={isSyncingThis}
                          className="px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 text-[10px] flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
                          title="Sync live GitHub, LinkedIn and Resume signals for this member only"
                        >
                          <RefreshCw
                            className={`w-3 h-3 text-cyan-400 ${isSyncingThis ? 'animate-spin' : ''}`}
                          />
                          <span>{isSyncingThis ? 'Syncing...' : 'Sync'}</span>
                        </button>
                        <span className="text-[10px] bg-zinc-900 border border-zinc-700 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                          {Math.round(member.rawSignals.completenessRatio * 100)}% Complete
                        </span>
                      </div>
                    </div>

                    {/* Contact & Academic Profile: Email, Mobile, College, Year of Study */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-zinc-400">
                      {memberEmail && (
                        <span className="text-zinc-300 flex items-center gap-1">
                          <span className="text-zinc-500">✉</span>
                          <span>{memberEmail}</span>
                        </span>
                      )}
                      {member.phone && (
                        <a
                          href={`tel:${member.phone.replace(/[^0-9+]/g, '')}`}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors"
                          title="Call / Contact participant"
                        >
                          <span>📞</span>
                          <span>{member.phone}</span>
                        </a>
                      )}
                      {member.college && (
                        <span className="text-cyan-300 flex items-center gap-1 font-medium">
                          <span>🏛️</span>
                          <span className="truncate max-w-[200px]" title={member.college}>{member.college}</span>
                        </span>
                      )}
                      {member.gradYear && (
                        <span className="bg-zinc-900 border border-zinc-700/80 text-zinc-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                          🎓 {member.gradYear}
                        </span>
                      )}
                    </div>

                    {/* Member Custom Fields (e.g. Branch, T-Shirt, Roll No, Custom survey questions) */}
                    {member.customFields && Object.keys(member.customFields).length > 0 && (
                      <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/80 space-y-1 text-[10px]">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider block">
                          Form Responses & Metadata:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(member.customFields).map(([k, v]) => (
                            <span
                              key={k}
                              className="bg-zinc-950 border border-zinc-700/60 px-2 py-0.5 rounded text-zinc-300 font-mono"
                            >
                              <strong className="text-zinc-400">{k}:</strong> {v}
                            </span>
                          ))}
                        </div>
                      </div>
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
                            {member.rawSignals.githubMetrics.originalRepos} (
                            {member.rawSignals.githubMetrics.forkedRepos} forks)
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Stars:</span>
                          <strong className="text-cyan-400">
                            {member.rawSignals.githubMetrics.totalStars} ★
                          </strong>
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

                    {/* Extracted Work Experiences & Internships */}
                    {member.rawSignals.workExperiences && member.rawSignals.workExperiences.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-zinc-800/60">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          💼 Work & Research Experience:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {member.rawSignals.workExperiences.map((exp, idx) => (
                            <div
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-mono ${
                                exp.isSpamOrSuspicious
                                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                                  : exp.isResearchInternship
                                  ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300 font-semibold'
                                  : exp.isTier1Company
                                  ? 'bg-amber-950/80 border-amber-700 text-amber-300 font-semibold'
                                  : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                              }`}
                              title={exp.suspiciousReason || `${exp.title} at ${exp.organization}`}
                            >
                              {exp.isResearchInternship && <span>🏛️</span>}
                              {exp.isTier1Company && <span>🏢</span>}
                              {exp.isSpamOrSuspicious && <span>⚠️</span>}
                              <span>{exp.organization}</span>
                              <span className="text-[9px] opacity-75">({exp.title})</span>
                              {exp.isSpamOrSuspicious && (
                                <span className="text-[8px] bg-rose-900 text-rose-200 px-1 rounded uppercase font-bold">
                                  Unverified / Spam
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* College Clubs & Extracurricular Leadership */}
                    {member.rawSignals.clubActivities && member.rawSignals.clubActivities.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-zinc-800/60">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          🎯 Clubs & Extracurricular:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {member.rawSignals.clubActivities.map((club, idx) => (
                            <div
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-mono ${
                                club.isHighImpactLead
                                  ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300 font-bold'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                              }`}
                            >
                              <span>{club.isHighImpactLead ? '👑' : '👥'}</span>
                              <span>{club.clubName}</span>
                              <span className="text-[9px] opacity-75">[{club.role}]</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched Organizer Custom Keywords */}
                    {member.rawSignals.matchedCustomKeywords && member.rawSignals.matchedCustomKeywords.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-emerald-950/60">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                          🏷️ Matched Organizer Keywords:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {member.rawSignals.matchedCustomKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1"
                            >
                              <span>✓</span>
                              <span>{kw}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 4. Complete Registration Form Raw Fields & Custom Survey Questions */}
            {currentTeam.rawRowData && Object.keys(currentTeam.rawRowData).length > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Complete Form Submission & Custom Fields ({Object.keys(currentTeam.rawRowData).length} Columns)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">100% Volatile Data Preserved</span>
                </div>
                
                <div className="bg-black/60 border border-zinc-800 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {Object.entries(currentTeam.rawRowData).map(([colName, cellVal]) => {
                      if (!cellVal || cellVal.trim().length === 0) return null;
                      return (
                        <div
                          key={colName}
                          className="bg-zinc-950 border border-zinc-800/80 p-2 rounded-lg space-y-0.5"
                        >
                          <span className="text-[10px] text-zinc-400 font-bold block truncate" title={colName}>
                            {colName}
                          </span>
                          <span className="text-zinc-200 font-mono text-[11px] block break-words">
                            {cellVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer (Manual Overrides & Quick Actions) */}
        <div className="px-5 py-3.5 bg-black/70 border-t border-cyan-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 uppercase flex items-center gap-2">
            <span>Manual Status:</span>
            {currentTeam.computed.hasManualOverrides && (
              <span className="text-amber-400 font-bold lowercase">
                (overrides active)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onUpdateManualStatus(currentTeam.id, 'pinned')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                currentTeam.computed.manualStatus === 'pinned'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-purple-400 hover:text-purple-300'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Pin to Shortlist</span>
            </button>

            <button
              onClick={() => onUpdateManualStatus(currentTeam.id, 'excluded')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                currentTeam.computed.manualStatus === 'excluded'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-rose-400 hover:text-rose-300'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Exclude / Drop</span>
            </button>

            <button
              onClick={() => onUpdateManualStatus(currentTeam.id, 'waitlisted')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                currentTeam.computed.manualStatus === 'waitlisted'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-amber-400 hover:text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Force Waitlist</span>
            </button>

            {currentTeam.computed.manualStatus && currentTeam.computed.manualStatus !== 'normal' && (
              <button
                onClick={() => onUpdateManualStatus(currentTeam.id, 'normal')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Reset to automated ranking"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Status</span>
              </button>
            )}

            {isEditing && (
              <button
                onClick={handleSaveAll}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black rounded-lg text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Overrides</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
