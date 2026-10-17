'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TeamRecord } from '@/types';
import {
  X,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Code2,
  ExternalLink,
  Plus,
  Trash2,
  ShieldCheck,
  Check,
  Lock,
  Zap,
} from 'lucide-react';
import { checkGitHubRateLimit, fetchGitHubStats, clearGitHubUserCache, RateLimitInfo } from '@/engine/github';
import { encryptTokenString, decryptTokenString, maskToken } from '@/utils/cryptoUtils';

export interface StoredTokenItem {
  id: string;
  label: string;
  encrypted: string;
  masked: string;
  quotaRemaining?: number;
  quotaLimit?: number;
  isActive: boolean;
}

interface GitHubSyncModalProps {
  teams: TeamRecord[];
  onUpdateTeamsWithLiveStats: (
    updater: (prevTeams: TeamRecord[]) => TeamRecord[]
  ) => void;
  onClose: () => void;
}

const TOKENS_STORAGE_KEY = 'incursion_enc_tokens_list_v1';

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  teams,
  onUpdateTeamsWithLiveStats,
  onClose,
}) => {
  const [tokens, setTokens] = useState<StoredTokenItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newTokenValue, setNewTokenValue] = useState('');
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number; user: string } | null>(null);
  const [syncCompleted, setSyncCompleted] = useState<boolean>(false);
  const [unauthenticatedQuota, setUnauthenticatedQuota] = useState<RateLimitInfo | null>(null);

  // Load tokens from localStorage on mount
  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
      let list: StoredTokenItem[] = stored ? JSON.parse(stored) : [];

      // If active token exists, check quota
      if (list.length > 0) {
        setIsCheckingQuota(true);
        const updated = await Promise.all(
          list.map(async (item) => {
            const rawToken = decryptTokenString(item.encrypted);
            if (rawToken) {
              const info = await checkGitHubRateLimit(rawToken);
              return {
                ...item,
                quotaRemaining: info.remaining,
                quotaLimit: info.limit,
              };
            }
            return item;
          })
        );
        setTokens(updated);
        setIsCheckingQuota(false);
      } else {
        // Check unauthenticated quota
        const unauth = await checkGitHubRateLimit();
        setUnauthenticatedQuota(unauth);
      }
    } catch {
      // Fallback
    }
  };

  const saveTokensList = (updated: StoredTokenItem[]) => {
    setTokens(updated);
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = newTokenValue.trim();
    if (!cleanToken) return;

    const label = newLabel.trim() || `Organizer Token #${tokens.length + 1}`;
    const encrypted = encryptTokenString(cleanToken);
    const masked = maskToken(cleanToken);

    // Check rate limit for this token
    setIsCheckingQuota(true);
    const info = await checkGitHubRateLimit(cleanToken);
    setIsCheckingQuota(false);

    const isFirst = tokens.length === 0;

    const newItem: StoredTokenItem = {
      id: `tok-${Date.now()}`,
      label,
      encrypted,
      masked,
      quotaRemaining: info.remaining,
      quotaLimit: info.limit,
      isActive: isFirst, // First token active by default
    };

    saveTokensList([...tokens, newItem]);
    setNewLabel('');
    setNewTokenValue('');
    setShowAddForm(false);
  };

  const handleSetActiveToken = (id: string) => {
    const updated = tokens.map((t) => ({
      ...t,
      isActive: t.id === id,
    }));
    saveTokensList(updated);
  };

  const handleDeleteToken = (id: string) => {
    const remaining = tokens.filter((t) => t.id !== id);
    if (remaining.length > 0 && !remaining.some((t) => t.isActive)) {
      remaining[0].isActive = true;
    }
    saveTokensList(remaining);
  };

  const getActiveDecryptedToken = (): string | undefined => {
    const active = tokens.find((t) => t.isActive);
    if (active) {
      return decryptTokenString(active.encrypted);
    }
    return undefined;
  };

  // Find all unique candidate GitHub usernames across all teams
  const uniqueUsernames = useMemo(() => {
    return Array.from(
      new Set(
        teams.flatMap((t) =>
          t.members
            .map((m) => m.rawSignals.githubUsername)
            .filter((u): u is string => Boolean(u))
        )
      )
    );
  }, [teams]);

  const verifiedUsernames = useMemo(() => {
    return Array.from(
      new Set(
        teams.flatMap((t) =>
          t.members
            .filter(
              (m) =>
                m.rawSignals.githubUsername &&
                m.rawSignals.githubMetrics?.syncStatus === 'live_verified'
            )
            .map((m) => m.rawSignals.githubUsername!)
        )
      )
    );
  }, [teams]);

  const unverifiedUsernames = useMemo(() => {
    return Array.from(
      new Set(
        teams.flatMap((t) =>
          t.members
            .filter(
              (m) =>
                m.rawSignals.githubUsername &&
                m.rawSignals.githubMetrics?.syncStatus !== 'live_verified'
            )
            .map((m) => m.rawSignals.githubUsername!)
        )
      )
    );
  }, [teams]);

  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);

  const startLiveSync = async (onlyRemaining: boolean = false) => {
    setIsSyncing(true);
    setSyncCompleted(false);
    setRateLimitNotice(null);

    let currentToken = getActiveDecryptedToken();
    const targetUsernames = onlyRemaining ? unverifiedUsernames : uniqueUsernames;

    // If full sync requested, clear session cache so all handles are fresh
    if (!onlyRemaining) {
      clearGitHubUserCache();
    }

    const statsMap = new Map<string, any>();
    let processed = 0;
    let rateLimitEncountered = false;

    for (const username of targetUsernames) {
      setProgress({
        current: processed + 1,
        total: targetUsernames.length,
        user: username,
      });

      try {
        const stats = await fetchGitHubStats(username, currentToken);
        statsMap.set(username.toLowerCase(), stats);
        if (stats.syncStatus === 'rate_limited') {
          rateLimitEncountered = true;
        }
      } catch (err: any) {
        console.error('GitHub fetch error for:', username, err);
      }

      processed++;
    }

    // Update teams with live fetched stats
    onUpdateTeamsWithLiveStats((prev) =>
      prev.map((team) => {
        const updatedMembers = team.members.map((member) => {
          const ghUser = member.rawSignals.githubUsername;
          if (ghUser && statsMap.has(ghUser.toLowerCase())) {
            const liveStats = statsMap.get(ghUser.toLowerCase());
            return {
              ...member,
              rawSignals: {
                ...member.rawSignals,
                githubMetrics: liveStats,
              },
            };
          }
          return member;
        });

        return {
          ...team,
          members: updatedMembers,
        };
      })
    );

    setIsSyncing(false);
    setSyncCompleted(true);
    if (rateLimitEncountered) {
      setRateLimitNotice(
        `Rate limit reached during sync. Unreached candidates are flagged with their temporary #hash values. You can resume fetching the remaining candidates once your quota resets or by adding another PAT.`
      );
    }
    loadTokens(); // Refresh quota indicators
  };

  const activeTokenItem = tokens.find((t) => t.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-950 rounded-2xl max-w-2xl w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-cyan-950/80 overflow-hidden max-h-[92vh] flex flex-col my-auto text-xs text-zinc-300 font-mono">
        {/* Header */}
        <div className="px-6 py-4 bg-black/60 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black text-cyan-400 tracking-tight uppercase neon-glow-cyan">
              GitHub API Tokens & Live Rate Limit Vault
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
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Encryption & Multi-Account Info */}
          <div className="bg-black/50 border border-cyan-900/40 rounded-xl p-3.5 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Encrypted & Masked Local Storage</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Tokens are <strong>encrypted and masked</strong> locally in your browser. They are never exposed in cleartext, never sent to external servers, and never included in audit exports.
            </p>
          </div>

          {/* Token List & Switcher */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
                Configured Organizer Tokens ({tokens.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-cyan-400 hover:text-cyan-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Token</span>
              </button>
            </div>

            {/* List of Tokens */}
            {tokens.length > 0 ? (
              <div className="space-y-2">
                {tokens.map((tok) => (
                  <div
                    key={tok.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      tok.isActive
                        ? 'bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100">{tok.label}</span>
                        {tok.isActive && (
                          <span className="text-[9px] bg-cyan-500 text-black font-extrabold px-1.5 py-0.2 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                        <Lock className="w-3 h-3 text-zinc-500" />
                        <span>{tok.masked}</span>
                      </div>
                      {tok.quotaRemaining !== undefined && (
                        <div className="text-[10px] text-zinc-400">
                          Quota:{' '}
                          <strong className="text-cyan-400">
                            {tok.quotaRemaining} / {tok.quotaLimit} remaining
                          </strong>{' '}
                          (5,000 req/hr free pool)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!tok.isActive && (
                        <button
                          type="button"
                          onClick={() => handleSetActiveToken(tok.id)}
                          className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 hover:border-cyan-400 hover:text-cyan-300 rounded text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Use This Token
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteToken(tok.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                        title="Remove Token"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl text-center text-zinc-500 text-xs">
                No tokens added. Operating in <strong>Public Anonymous Mode (60 req/hr)</strong>.
                {unauthenticatedQuota && (
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Remaining: {unauthenticatedQuota.remaining} / {unauthenticatedQuota.limit}
                  </div>
                )}
              </div>
            )}

            {/* Add Another Token Form */}
            {showAddForm && (
              <form
                onSubmit={handleAddToken}
                className="p-4 bg-black/60 border border-cyan-900/50 rounded-xl space-y-3"
              >
                <div className="font-bold text-zinc-200 flex items-center justify-between">
                  <span>Add Free GitHub Personal Access Token (PAT)</span>
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5 font-normal"
                  >
                    <span>Generate on GitHub</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 font-medium">Token Label:</label>
                    <input
                      type="text"
                      placeholder="e.g. Primary Token or Teammate 2"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded p-1.5 text-xs focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 font-medium">Personal Access Token:</label>
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={newTokenValue}
                      onChange={(e) => setNewTokenValue(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-cyan-300 rounded p-1.5 text-xs font-mono focus:border-cyan-400 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1 text-zinc-400 hover:bg-zinc-900 rounded text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTokenValue.trim() || isCheckingQuota}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black rounded text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer"
                  >
                    {isCheckingQuota ? 'Verifying...' : 'Encrypt & Save Token'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Candidate Sync Telemetry Summary */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
              <span className="text-zinc-500 block text-[10px] uppercase">Total Handles</span>
              <span className="text-base font-black text-zinc-100">{uniqueUsernames.length}</span>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg">
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">✓ Live Verified</span>
              <span className="text-base font-black text-emerald-300">{verifiedUsernames.length}</span>
            </div>
            <div className="bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-lg">
              <span className="text-amber-400 block text-[10px] uppercase font-bold">⚠️ Unsynced (Hash)</span>
              <span className="text-base font-black text-amber-300">{unverifiedUsernames.length}</span>
            </div>
          </div>

          {unverifiedUsernames.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-800/60 p-3 rounded-lg text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {unverifiedUsernames.length} candidate(s) currently scored using temporary username hash values.
                </span>
                <span className="text-zinc-400 text-[11px] block mt-0.5">
                  To ensure 100% fair evaluation, click <strong>Fetch Remaining</strong> below once your GitHub API limit resets or after activating a PAT above.
                </span>
              </div>
            </div>
          )}

          {/* Sync Trigger Area */}
          <div className="border-t border-cyan-950/60 pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-zinc-100">
                  Enrich Candidate Data from GitHub API
                </div>
                <div className="text-[11px] text-zinc-500">
                  {verifiedUsernames.length} of {uniqueUsernames.length} candidates verified live.
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unverifiedUsernames.length > 0 && (
                  <button
                    onClick={() => startLiveSync(true)}
                    disabled={isSyncing}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black rounded-lg text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer disabled:opacity-50 transition-all"
                    title="Fetch only the remaining candidates whose stats are currently temporary hash values"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>Fetch Remaining ({unverifiedUsernames.length})</span>
                  </button>
                )}

                <button
                  onClick={() => startLiveSync(false)}
                  disabled={isSyncing || uniqueUsernames.length === 0}
                  className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isSyncing
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80'
                  }`}
                  title="Clear session cache and re-query all candidate handles from GitHub"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : unverifiedUsernames.length === 0 ? 'Re-sync All' : 'Full Sync'}</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {isSyncing && progress && (
              <div className="bg-black/60 border border-zinc-800 p-3 rounded-lg space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>
                    Fetching <strong>@{progress.user}</strong>...
                  </span>
                  <span>
                    {progress.current} of {progress.total}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-200 shadow-[0_0_10px_#22d3ee]"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success notice */}
            {syncCompleted && (
              <div className="bg-cyan-950/40 border border-cyan-500/50 p-3 rounded-lg text-cyan-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Successfully enriched candidate GitHub profiles with live repos, star stats, and languages! Shortlist re-ranked.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/60 border-t border-cyan-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
