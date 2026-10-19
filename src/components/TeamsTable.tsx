'use client';

import React, { useState, useMemo } from 'react';
import { SelectionConfig, TeamRecord } from '@/types';
import {
  Search,
  Eye,
  Pin,
  AlertTriangle,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Award,
  Code2,
  Sliders,
  BookmarkPlus,
  GitCommit,
  Star,
  Building2,
  Users,
  Trophy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { LinkedinIcon } from './LinkedinIcon';

interface TeamsTableProps {
  teams: TeamRecord[];
  config: SelectionConfig;
  onSelectTeam: (team: TeamRecord) => void;
  onCompareTeams?: (teamAId?: string, teamBId?: string) => void;
  onOpenGitHubSync?: () => void;
  onOpenFilters?: () => void;
  onSaveRun?: () => void;
}

export type TableTab = 'OVERALL' | 'GITHUB' | 'LINKEDIN' | 'ROLES' | 'ACCOLADES' | 'SHORTLIST' | 'DISQUALIFIED' | 'ACM';

interface TeamDimensionStats {
  totalCommits: number;
  totalStars: number;
  topLanguages: string[];
  githubMemberCount: number;
  githubHandles: string[];
  hasForkSuspicion: boolean;
  techScore: number;
  unverifiedGhCount: number;
  ghFallbackHashes: number[];
  isGhLiveVerified: boolean;

  linkedinScore: number;
  seniorityLevels: string[];
  has500PlusCount: number;
  linkedinMemberCount: number;
  linkedinHandles: string[];
  companies: string[];

  coveredRoles: string[];
  missingRoles: string[];
  uniqueSkills: string[];
  synergyScore: number;

  hackathonWins: number;
  researchCount: number;
  tier1CompanyCount: number;
  clubCount: number;
  hasProofOfWork: boolean;
  expScore: number;

  femaleCount: number;
  contactCount: number;
  failedGates: string[];

  acmScore: number;
  acmRank: number;
  acmMatchedCount: number;
  cfRating: number;
  leetcodeRating: number;
  codechefStars: number;
  hasAcmData: boolean;
}

function computeTeamDimensionStats(team: TeamRecord): TeamDimensionStats {
  let totalCommits = 0;
  let totalStars = 0;
  const langSet = new Set<string>();
  const ghHandleSet = new Set<string>();
  let githubMemberCount = 0;

  const linkedinScore = team.computed.linkedinScore ?? 0;
  const senioritySet = new Set<string>();
  let has500PlusCount = 0;
  let linkedinMemberCount = 0;
  const inHandleSet = new Set<string>();
  const companySet = new Set<string>();

  const skillSet = new Set<string>();
  let hackathonWins = 0;
  let researchCount = 0;
  let tier1CompanyCount = 0;
  let clubCount = 0;
  let hasProofOfWork = false;
  let femaleCount = 0;
  let contactCount = 0;

  let unverifiedGhCount = 0;
  const ghFallbackHashes: number[] = [];

  team.members.forEach((m) => {
    if (m.isFemale) femaleCount++;
    if (m.phone) contactCount++;

    // GitHub extraction
    const ghUser = m.rawSignals.githubUsername;
    const hasGhMetrics = Boolean(m.rawSignals.githubMetrics);

    if (ghUser || hasGhMetrics) {
      githubMemberCount++;
    }
    if (ghUser) {
      ghHandleSet.add(ghUser);
    }
    if (m.rawSignals.githubMetrics) {
      totalCommits += m.rawSignals.githubMetrics.estimatedContributions || 0;
      totalStars += m.rawSignals.githubMetrics.totalStars || 0;
      (m.rawSignals.githubMetrics.topLanguages || []).forEach((l) => langSet.add(l));

      if (ghUser && m.rawSignals.githubMetrics.syncStatus !== 'live_verified') {
        unverifiedGhCount++;
        if (m.rawSignals.githubMetrics.fallbackHash) {
          ghFallbackHashes.push(m.rawSignals.githubMetrics.fallbackHash);
        }
      }
    } else if (ghUser) {
      unverifiedGhCount++;
    }

    // LinkedIn extraction
    if (m.linkedinUrl || m.rawSignals.hasLinkedin || m.rawSignals.linkedinMetrics) {
      linkedinMemberCount++;
    }
    if (m.rawSignals.linkedinUsername || m.rawSignals.linkedinMetrics?.username) {
      inHandleSet.add(m.rawSignals.linkedinMetrics?.username || m.rawSignals.linkedinUsername || '');
    }
    if (m.rawSignals.linkedinMetrics) {
      const s = m.rawSignals.linkedinMetrics.seniorityLevel;
      if (s && s !== 'unknown' && s !== 'student') {
        senioritySet.add(s);
      }
      if (m.rawSignals.linkedinMetrics.has500PlusConnections) {
        has500PlusCount++;
      }
      if (m.rawSignals.linkedinMetrics.company) {
        companySet.add(m.rawSignals.linkedinMetrics.company);
      }
    }

    // Skills & roles
    (m.rawSignals.skills || []).forEach((s) => skillSet.add(s));

    // Hackathons & experience
    hackathonWins += m.rawSignals.hackathonExperienceCount || 0;
    (m.rawSignals.workExperiences || []).forEach((w) => {
      if (w.isResearchInternship) researchCount++;
      if (w.isTier1Company) tier1CompanyCount++;
      if (w.organization) companySet.add(w.organization);
    });
    clubCount += (m.rawSignals.clubActivities || []).length;
    if (m.portfolioUrl || m.rawSignals.hasPortfolio) {
      hasProofOfWork = true;
    }
  });

  const hasForkSuspicion = team.computed.antiCheatFlags.some(
    (f) => f.includes('Suspicious') || f.includes('forked')
  );

  const failedGates = team.computed.failedFilters.map((f) => f.filterName);

  return {
    totalCommits,
    totalStars,
    topLanguages: Array.from(langSet).slice(0, 4),
    githubMemberCount,
    githubHandles: Array.from(ghHandleSet).filter(Boolean),
    hasForkSuspicion,
    techScore: team.computed.technicalDepthScore,
    unverifiedGhCount,
    ghFallbackHashes,
    isGhLiveVerified: githubMemberCount > 0 && unverifiedGhCount === 0,

    linkedinScore,
    seniorityLevels: Array.from(senioritySet),
    has500PlusCount,
    linkedinMemberCount,
    linkedinHandles: Array.from(inHandleSet).filter(Boolean),
    companies: Array.from(companySet).slice(0, 3),

    coveredRoles: team.computed.coveredRoles,
    missingRoles: team.computed.missingRoles,
    uniqueSkills: Array.from(skillSet),
    synergyScore: team.computed.skillComplementarityScore,

    hackathonWins,
    researchCount,
    tier1CompanyCount,
    clubCount,
    hasProofOfWork,
    expScore: team.computed.projectExperienceScore,

    femaleCount,
    contactCount,
    failedGates,

    acmScore: team.computed.acmScore ?? 0,
    acmRank: team.computed.acmRank ?? 0,
    acmMatchedCount: team.computed.acmMatchedCount ?? 0,
    cfRating: team.computed.cfRating ?? 0,
    leetcodeRating: team.computed.leetcodeRating ?? 0,
    codechefStars: team.computed.codechefStars ?? 0,
    hasAcmData:
      (team.computed.acmMatchedCount ?? 0) > 0 ||
      (team.computed.acmScore ?? 0) > 0 ||
      team.members.some((m) => m.isAcmMatched),
  };
}

export const TeamsTable: React.FC<TeamsTableProps> = ({
  teams,
  config,
  onSelectTeam,
  onCompareTeams,
  onOpenGitHubSync,
  onOpenFilters,
  onSaveRun,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TableTab>('OVERALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('ALL');

  // Interactive sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Format current live sync time
  const now = new Date();
  const formattedSyncTime = `${now.toLocaleDateString()}, ${now.toLocaleTimeString()}`;

  // Pre-calculate dimension stats map for performance
  const statsMap = useMemo(() => {
    const map = new Map<string, TeamDimensionStats>();
    teams.forEach((t) => {
      map.set(t.id, computeTeamDimensionStats(t));
    });
    return map;
  }, [teams]);

  // Cohort-wide count of candidate handles whose GitHub stats are currently unverified (using hash fallback)
  const cohortUnverifiedGhCount = useMemo(() => {
    const unverifiedSet = new Set<string>();
    teams.forEach((t) => {
      t.members.forEach((m) => {
        const ghUser = m.rawSignals.githubUsername;
        if (ghUser && m.rawSignals.githubMetrics?.syncStatus !== 'live_verified') {
          unverifiedSet.add(ghUser.toLowerCase());
        }
      });
    });
    return unverifiedSet.size;
  }, [teams]);

  // Tab count metrics
  const tabCounts = useMemo(() => {
    let overall = 0;
    let github = 0;
    let linkedin = 0;
    let roles = 0;
    let accolades = 0;
    let shortlist = 0;
    let disqualified = 0;
    let acm = 0;

    teams.forEach((t) => {
      overall++;
      const isShortlisted =
        t.computed.manualStatus === 'pinned' ||
        (t.computed.rank <= config.shortlistCount && t.computed.isEligible && t.computed.manualStatus !== 'excluded');

      if (isShortlisted) shortlist++;
      if (!t.computed.isEligible || t.computed.manualStatus === 'excluded') disqualified++;

      const st = statsMap.get(t.id);
      if (st && (st.githubMemberCount > 0 || st.techScore > 0)) github++;
      if (st && (st.linkedinMemberCount > 0 || st.linkedinScore > 0)) linkedin++;
      if (st && st.hasAcmData) acm++;
      roles++;
      accolades++;
    });

    return { overall, github, linkedin, roles, accolades, shortlist, disqualified, acm };
  }, [teams, config.shortlistCount, statsMap]);

  // Filter teams by search, team size, and category tab
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
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

      // Tab filter
      const isShortlisted =
        t.computed.manualStatus === 'pinned' ||
        (t.computed.rank <= config.shortlistCount && t.computed.isEligible && t.computed.manualStatus !== 'excluded');

      if (activeTab === 'SHORTLIST') return isShortlisted;
      if (activeTab === 'DISQUALIFIED') return !t.computed.isEligible || t.computed.manualStatus === 'excluded';
      if (activeTab === 'ACM') {
        const st = statsMap.get(t.id);
        return Boolean(st?.hasAcmData || config.acmEventConfig?.enabled);
      }
      if (activeTab === 'GITHUB') {
        const st = statsMap.get(t.id);
        return Boolean(st && (st.githubMemberCount > 0 || st.techScore > 0));
      }
      if (activeTab === 'LINKEDIN') {
        const st = statsMap.get(t.id);
        return Boolean(st && (st.linkedinMemberCount > 0 || st.linkedinScore > 0));
      }
      if (activeTab === 'ROLES') return true;
      if (activeTab === 'ACCOLADES') return true;

      return true;
    });
  }, [teams, searchQuery, selectedSizeFilter, activeTab, config.anonymizeMode, config.shortlistCount, config.acmEventConfig?.enabled, statsMap]);

  // Sort teams based on tab or user clicked column
  const sortedTeams = useMemo(() => {
    const list = [...filteredTeams];

    return list.sort((a, b) => {
      // Manual pin always prioritizes at the very top
      if (a.computed.manualStatus === 'pinned' && b.computed.manualStatus !== 'pinned') return -1;
      if (b.computed.manualStatus === 'pinned' && a.computed.manualStatus !== 'pinned') return 1;

      const stA = statsMap.get(a.id)!;
      const stB = statsMap.get(b.id)!;

      // 1. Explicit user header sort
      if (sortField) {
        let valA = 0;
        let valB = 0;

        if (sortField === 'score') { valA = a.computed.finalScore; valB = b.computed.finalScore; }
        else if (sortField === 'tech') { valA = a.computed.technicalDepthScore; valB = b.computed.technicalDepthScore; }
        else if (sortField === 'exp') { valA = a.computed.projectExperienceScore; valB = b.computed.projectExperienceScore; }
        else if (sortField === 'roles') { valA = a.computed.skillComplementarityScore; valB = b.computed.skillComplementarityScore; }
        else if (sortField === 'size') { valA = a.members.length; valB = b.members.length; }
        else if (sortField === 'commits') { valA = stA.totalCommits; valB = stB.totalCommits; }
        else if (sortField === 'stars') { valA = stA.totalStars; valB = stB.totalStars; }
        else if (sortField === 'linkedin') { valA = stA.linkedinScore; valB = stB.linkedinScore; }
        else if (sortField === 'wins') { valA = stA.hackathonWins; valB = stB.hackathonWins; }
        else if (sortField === 'skills') { valA = stA.uniqueSkills.length; valB = stB.uniqueSkills.length; }
        else if (sortField === 'rank') { valA = a.computed.rank; valB = b.computed.rank; }
        else if (sortField === 'acm') { valA = a.computed.acmScore ?? 0; valB = b.computed.acmScore ?? 0; }
        else if (sortField === 'cf') { valA = a.computed.cfRating ?? 0; valB = b.computed.cfRating ?? 0; }
        else if (sortField === 'leetcode') { valA = a.computed.leetcodeRating ?? 0; valB = b.computed.leetcodeRating ?? 0; }

        return sortDirection === 'desc' ? valB - valA : valA - valB;
      }

      // 2. Default domain-specific sort per tab
      if (activeTab === 'ACM') {
        const acmA = a.computed.acmScore ?? 0;
        const acmB = b.computed.acmScore ?? 0;
        if (acmB !== acmA) return acmB - acmA;
        const cfA = a.computed.cfRating ?? 0;
        const cfB = b.computed.cfRating ?? 0;
        if (cfB !== cfA) return cfB - cfA;
        const lcA = a.computed.leetcodeRating ?? 0;
        const lcB = b.computed.leetcodeRating ?? 0;
        if (lcB !== lcA) return lcB - lcA;
        return a.computed.rank - b.computed.rank;
      }

      if (activeTab === 'GITHUB') {
        // Highest Technical Depth Score first
        if (b.computed.technicalDepthScore !== a.computed.technicalDepthScore) {
          return b.computed.technicalDepthScore - a.computed.technicalDepthScore;
        }
        // Then total commits
        if (stB.totalCommits !== stA.totalCommits) {
          return stB.totalCommits - stA.totalCommits;
        }
        // Then total stars
        if (stB.totalStars !== stA.totalStars) {
          return stB.totalStars - stA.totalStars;
        }
        return a.computed.rank - b.computed.rank;
      }

      if (activeTab === 'LINKEDIN') {
        // Highest LinkedIn Score first
        if (stB.linkedinScore !== stA.linkedinScore) {
          return stB.linkedinScore - stA.linkedinScore;
        }
        // Then 500+ connections count
        if (stB.has500PlusCount !== stA.has500PlusCount) {
          return stB.has500PlusCount - stA.has500PlusCount;
        }
        // Then Seniority levels count
        if (stB.seniorityLevels.length !== stA.seniorityLevels.length) {
          return stB.seniorityLevels.length - stA.seniorityLevels.length;
        }
        return b.computed.finalScore - a.computed.finalScore;
      }

      if (activeTab === 'ROLES') {
        // Highest Skill Complementarity Score first
        if (b.computed.skillComplementarityScore !== a.computed.skillComplementarityScore) {
          return b.computed.skillComplementarityScore - a.computed.skillComplementarityScore;
        }
        // Then total unique skills
        if (stB.uniqueSkills.length !== stA.uniqueSkills.length) {
          return stB.uniqueSkills.length - stA.uniqueSkills.length;
        }
        return b.computed.finalScore - a.computed.finalScore;
      }

      if (activeTab === 'ACCOLADES') {
        // Highest Project Experience Score first
        if (b.computed.projectExperienceScore !== a.computed.projectExperienceScore) {
          return b.computed.projectExperienceScore - a.computed.projectExperienceScore;
        }
        // Then Hackathon Wins
        if (stB.hackathonWins !== stA.hackathonWins) {
          return stB.hackathonWins - stA.hackathonWins;
        }
        return b.computed.finalScore - a.computed.finalScore;
      }

      // Default OVERALL / SHORTLIST / DISQUALIFIED: Natural overall rank
      return a.computed.rank - b.computed.rank;
    });
  }, [filteredTeams, activeTab, sortField, sortDirection, statsMap]);

  // Pagination
  const totalPages = pageSize === 0 ? 1 : Math.ceil(sortedTeams.length / pageSize) || 1;
  const paginatedTeams =
    pageSize === 0
      ? sortedTeams
      : sortedTeams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleHeaderSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField(null);
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-80 transition-opacity ml-1 inline" />;
    }
    return sortDirection === 'desc' ? (
      <ArrowDown className="w-3 h-3 text-cyan-400 ml-1 inline" />
    ) : (
      <ArrowUp className="w-3 h-3 text-cyan-400 ml-1 inline" />
    );
  };

  return (
    <div className="bg-zinc-950/80 border border-cyan-950/80 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-sans backdrop-blur-xl">
      {/* 1. Cyber Leaderboard Header */}
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
              {activeTab === 'OVERALL' && 'DETERMINISTIC COMPOSITE RANKINGS & SQUAD METRICS'}
              {activeTab === 'ACM' && 'ACM NIT SURAT VERIFIED TELEMETRY • LIVE CP & DEV STATS FROM ACMNITSURAT.IN'}
              {activeTab === 'GITHUB' && 'GITHUB CODE INTEL • VELOCITY, STARS & REPO INTEGRITY'}
              {activeTab === 'LINKEDIN' && 'LINKEDIN PEDIGREE • SENIORITY, 500+ NETWORKS & ENTERPRISE ROLES'}
              {activeTab === 'ROLES' && 'SKILL SYNERGY & ROLE COMPLEMENTARITY • BALANCED SQUADS'}
              {activeTab === 'ACCOLADES' && 'HACKATHON WINS, RESEARCH INTERNSHIPS & EXTRA-CURRICULARS'}
              {activeTab === 'SHORTLIST' && `OFFICIAL TOP ${config.shortlistCount} SHORTLISTED SQUADS`}
              {activeTab === 'DISQUALIFIED' && 'HARD GATE DISQUALIFICATIONS & AUDIT FAILURES'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenFilters && (
              <button
                onClick={onOpenFilters}
                className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-bold text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                title="Open Scoring Model, Weights & Filters Drawer"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Scoring Model & Filters</span>
                <span className="text-[9px] bg-cyan-900/80 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-700/60 font-mono">
                  {config.customFormulaEnabled ? 'CUSTOM' : 'BALANCED'}
                </span>
              </button>
            )}

            {onSaveRun && (
              <button
                onClick={onSaveRun}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                title="Save current scoring run snapshot to audit vault"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Run</span>
              </button>
            )}

            <div className="text-right font-mono text-[11px] hidden sm:block">
              <span className="text-zinc-500">LAST SYNCED: </span>
              <span className="text-cyan-400 font-bold" suppressHydrationWarning>{formattedSyncTime}</span>
            </div>
          </div>
        </div>

        {/* Category Navigation Tabs with dynamic count badges */}
        <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto mt-4 border-b border-zinc-800/80 text-xs font-mono">
          {[
            { id: 'OVERALL', label: 'OVERALL', count: tabCounts.overall },
            ...(config.acmEventConfig?.enabled || tabCounts.acm > 0
              ? [{ id: 'ACM' as TableTab, label: 'ACM NIT SURAT', count: tabCounts.acm }]
              : []),
            { id: 'GITHUB', label: 'GITHUB CODE', count: tabCounts.github },
            { id: 'LINKEDIN', label: 'LINKEDIN', count: tabCounts.linkedin },
            { id: 'ROLES', label: 'SKILL SYNERGY', count: tabCounts.roles },
            { id: 'ACCOLADES', label: 'HACKATHON WINS', count: tabCounts.accolades },
            { id: 'SHORTLIST', label: `SHORTLIST (${config.shortlistCount})`, count: tabCounts.shortlist },
            { id: 'DISQUALIFIED', label: 'DISQUALIFIED', count: tabCounts.disqualified },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TableTab);
                  setSortField(null); // Reset column sort to domain default
                  setCurrentPage(1);
                }}
                className={`pb-2.5 px-2.5 transition-all font-bold whitespace-nowrap cursor-pointer relative flex items-center gap-1.5 ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ACM Event Mode Live Sync & Conflict Priority Banner */}
      {config.acmEventConfig?.enabled && (
        <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/50 to-zinc-950 px-4 py-2 border-b border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              💎 ACM NIT SURAT EVENT MODE ACTIVE
            </span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-zinc-400 hidden sm:inline">
              Data fetched & verified live from{' '}
              <a
                href="https://acmnitsurat.in"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline hover:text-cyan-200"
              >
                acmnitsurat.in
              </a>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                config.acmEventConfig.dataPriority === 'ACM_OVERWRITE'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700/80'
                  : 'bg-amber-950 text-amber-300 border-amber-700/80'
              }`}
            >
              PRIORITY:{' '}
              {config.acmEventConfig.dataPriority === 'ACM_OVERWRITE'
                ? '🛡️ ACM OVERWRITES INPUT'
                : '📝 PRESERVE REGISTRATION INPUT'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-black/60 border-cyan-800 text-cyan-300">
              SCORING:{' '}
              {config.acmEventConfig.scoringMode === 'DEFAULT_ACM_SCORE'
                ? `🏆 OFFICIAL SCORE (${config.acmEventConfig.acmWeight ?? 35}%)`
                : '🧮 CUSTOM FORMULA'}
            </span>
          </div>
        </div>
      )}

      {/* GitHub Rate Limit / Temporary Hash Fallback Notice */}
      {cohortUnverifiedGhCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/80 via-zinc-950 to-zinc-950 px-4 py-2 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#f59e0b]" />
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              ⚠️ GITHUB RATE LIMIT / TEMPORARY HASH ACTIVE
            </span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-zinc-300 text-[11px]">
              {cohortUnverifiedGhCount} candidate(s) currently scored using temporary username hash values (<span className="text-amber-300 font-bold">#hash</span>) while API limit is reached.
            </span>
          </div>

          {onOpenGitHubSync && (
            <button
              onClick={onOpenGitHubSync}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/50 hover:border-amber-400 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Add a free GitHub Personal Access Token or resume sync when rate limit resets"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Fetch Remaining ({cohortUnverifiedGhCount})</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Search and Filter Bar Controls */}
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

        {/* Filter Pills & View Modes */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Team Size filter pill */}
          <select
            value={selectedSizeFilter}
            onChange={(e) => {
              setSelectedSizeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-black/60 border border-zinc-800 text-zinc-300 rounded-lg focus:border-cyan-400 outline-none cursor-pointer"
          >
            <option value="ALL">All Team Sizes</option>
            <option value="1">Solo (1 Member)</option>
            <option value="2">Duo (2 Members)</option>
            <option value="3">Trio (3 Members)</option>
            <option value="4">Quad (4 Members)</option>
            <option value="5">Squad (5 Members)</option>
            <option value="6">Full Crew (6 Members)</option>
          </select>

          {/* Reset Sort Button (If user clicked a custom header) */}
          {sortField && (
            <button
              onClick={() => {
                setSortField(null);
                setSortDirection('desc');
              }}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-600/40 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
              title="Reset to category default ranking"
            >
              <span>Reset Sort ({sortField})</span>
            </button>
          )}

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

      {/* 3. Main Content: Adaptive Category Table or Cards */}
      {viewMode === 'cards' ? (
        /* Dynamic Adaptive Card View */
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {paginatedTeams.map((team, idx) => {
            const st = statsMap.get(team.id)!;
            const isShortlistCandidate =
              team.computed.manualStatus === 'pinned' ||
              (team.computed.rank <= config.shortlistCount &&
                team.computed.isEligible &&
                team.computed.manualStatus !== 'excluded');

            const teamDisplayName = config.anonymizeMode
              ? `Team [${team.id.slice(0, 8)}]`
              : team.teamName;

            const categoryRank = (currentPage - 1) * (pageSize || 50) + idx + 1;

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
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center font-mono font-bold text-cyan-400">
                      {activeTab === 'OVERALL' ? team.computed.rank : categoryRank}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-zinc-100 text-sm">{teamDisplayName}</h4>
                        {team.computed.hasManualOverrides && (
                          <span title="Manual overrides active on this team" className="text-[9px] bg-amber-950/90 text-amber-300 border border-amber-600/80 px-1 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 fill-amber-300" />
                            Overridden
                          </span>
                        )}
                        {st.femaleCount > 0 && (
                          <span title={`${st.femaleCount} verified female participant(s)`} className="text-[9px] bg-pink-950/80 text-pink-300 border border-pink-800/80 px-1 py-0.2 rounded font-mono font-bold">
                            ♀ {st.femaleCount}F
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {team.members.length} members • Overall #{team.computed.rank}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-cyan-400 neon-glow-cyan block">
                      {activeTab === 'ACM' && (team.computed.acmScore ?? 0)}
                      {activeTab === 'GITHUB' && team.computed.technicalDepthScore}
                      {activeTab === 'LINKEDIN' && st.linkedinScore}
                      {activeTab === 'ROLES' && team.computed.skillComplementarityScore}
                      {activeTab === 'ACCOLADES' && team.computed.projectExperienceScore}
                      {(activeTab === 'OVERALL' || activeTab === 'SHORTLIST' || activeTab === 'DISQUALIFIED') && team.computed.finalScore}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {activeTab === 'ACM' && 'ACM SCORE'}
                      {activeTab === 'GITHUB' && 'TECH SCORE'}
                      {activeTab === 'LINKEDIN' && 'LINKEDIN SCORE'}
                      {activeTab === 'ROLES' && 'SYNERGY SCORE'}
                      {activeTab === 'ACCOLADES' && 'EXP SCORE'}
                      {(activeTab === 'OVERALL' || activeTab === 'SHORTLIST' || activeTab === 'DISQUALIFIED') && (isShortlistCandidate ? 'SHORTLIST' : 'WAITLIST')}
                    </span>
                  </div>
                </div>

                {/* Adaptive Middle Grid based on active Tab */}
                {activeTab === 'ACM' ? (
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono bg-zinc-900/60 p-2 rounded-lg border border-cyan-900/60">
                    <div>
                      <span className="text-zinc-500 block">ACM SCORE</span>
                      <strong className="text-cyan-300 font-bold">{team.computed.acmScore ?? 0} pts</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">LEETCODE</span>
                      <strong className="text-amber-300">{team.computed.leetcodeRating ? `${team.computed.leetcodeRating}` : 'Unrated'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">CODEFORCES</span>
                      <strong className="text-blue-300">{team.computed.cfRating ? `${team.computed.cfRating}` : 'Unrated'}</strong>
                    </div>
                  </div>
                ) : activeTab === 'GITHUB' ? (
                  <div className="space-y-1.5 font-mono">
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                      <div>
                        <span className="text-zinc-500 block">COMMITS</span>
                        <strong className="text-emerald-300">{st.totalCommits.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">STARS</span>
                        <strong className="text-amber-300">⭐ {st.totalStars}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">LANGUAGES</span>
                        <strong className="text-zinc-200 truncate block">{st.topLanguages.slice(0, 2).join(', ') || 'N/A'}</strong>
                      </div>
                    </div>
                    {st.unverifiedGhCount > 0 ? (
                      <div className="bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold flex items-center justify-between">
                        <span>⚠️ Hash Estimate: #{st.ghFallbackHashes[0] || 'TEMP'}</span>
                        <span className="text-[9px] text-amber-400/80">API Limit Fallback</span>
                      </div>
                    ) : st.githubMemberCount > 0 ? (
                      <div className="bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] text-emerald-300 font-bold flex items-center justify-center gap-1">
                        <span>✓ Live Verified GitHub Stats</span>
                      </div>
                    ) : (
                      <div className="bg-zinc-900/40 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-500 font-bold flex items-center justify-center gap-1">
                        <span>No GitHub Handles</span>
                      </div>
                    )}
                  </div>
                ) : activeTab === 'LINKEDIN' ? (
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block">SENIORITY</span>
                      <strong className="text-blue-300 capitalize">{st.seniorityLevels[0] || 'Member'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">500+ NET</span>
                      <strong className="text-emerald-300">{st.has500PlusCount > 0 ? `${st.has500PlusCount} Members` : 'Standard'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">COMPANIES</span>
                      <strong className="text-zinc-200 truncate block">{st.companies[0] || 'N/A'}</strong>
                    </div>
                  </div>
                ) : activeTab === 'ROLES' ? (
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block">COVERED</span>
                      <strong className="text-cyan-300">{st.coveredRoles.length}/4 Roles</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">MISSING</span>
                      <strong className="text-rose-300">{st.missingRoles.join(', ') || 'None (Full)'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">TOTAL TECH</span>
                      <strong className="text-zinc-200">{st.uniqueSkills.length} Skills</strong>
                    </div>
                  </div>
                ) : activeTab === 'ACCOLADES' ? (
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block">WINS</span>
                      <strong className="text-amber-300">🏆 {st.hackathonWins}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">RESEARCH</span>
                      <strong className="text-indigo-300">{st.researchCount > 0 ? `${st.researchCount} Tier-1` : 'None'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">CLUBS</span>
                      <strong className="text-zinc-200">{st.clubCount > 0 ? `${st.clubCount} Leads` : 'None'}</strong>
                    </div>
                  </div>
                ) : activeTab === 'DISQUALIFIED' ? (
                  <div className="bg-rose-950/40 p-2 rounded-lg border border-rose-900/80 text-[10px] font-mono space-y-1">
                    <span className="text-rose-400 font-bold block">FAILED HARD GATES:</span>
                    <div className="flex flex-wrap gap-1">
                      {team.computed.failedFilters.map((f) => (
                        <span key={f.filterName} className="bg-rose-900/60 text-rose-200 px-1.5 py-0.2 rounded border border-rose-700">
                          ✕ {f.filterName}: {f.reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
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
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 font-mono">
                  <span className="text-[10px] text-zinc-500">
                    {team.computed.isEligible ? 'ELIGIBLE' : 'GATE FAILED'}
                  </span>
                  <button
                    onClick={() => onSelectTeam(team)}
                    className="px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800/80 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Scorecard</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Cyberpunk Adaptive Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-black/80 border-b border-cyan-950/60 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                {/* 1. Rank # */}
                <th
                  onClick={() => handleHeaderSort('rank')}
                  className="py-3 px-2 text-center w-12 cursor-pointer hover:text-cyan-400 transition-colors select-none"
                  title="Sort by Rank"
                >
                  <span>#</span>
                  {renderSortIcon('rank')}
                </th>

                {/* 2. Team Name */}
                <th className="py-3 px-3">TEAM / CANDIDATES</th>

                {/* 3. Team Size */}
                <th
                  onClick={() => handleHeaderSort('size')}
                  className="py-3 px-2 text-center w-14 cursor-pointer hover:text-cyan-400 transition-colors select-none"
                  title="Sort by Team Size"
                >
                  <span>SIZE</span>
                  {renderSortIcon('size')}
                </th>

                {/* 4. Dynamic Middle Columns depending on activeTab */}
                {activeTab === 'ACM' ? (
                  <>
                    <th
                      onClick={() => handleHeaderSort('acm')}
                      className="py-3 px-3 text-right text-cyan-300 cursor-pointer hover:text-cyan-200 transition-colors select-none"
                      title="Sort by Official ACM Platform Score"
                    >
                      <span>ACM SCORE</span>
                      {renderSortIcon('acm')}
                    </th>
                    <th className="py-3 px-2.5 text-center">DATA SOURCE</th>
                    <th
                      onClick={() => handleHeaderSort('leetcode')}
                      className="py-3 px-2.5 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by LeetCode Rating"
                    >
                      <span>LEETCODE</span>
                      {renderSortIcon('leetcode')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('cf')}
                      className="py-3 px-2.5 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by Codeforces Rating"
                    >
                      <span>CODEFORCES</span>
                      {renderSortIcon('cf')}
                    </th>
                    <th className="py-3 px-2.5 text-center">CODECHEF</th>
                    <th
                      onClick={() => handleHeaderSort('commits')}
                      className="py-3 px-2.5 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by GitHub Commits"
                    >
                      <span>COMMITS</span>
                      {renderSortIcon('commits')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('score')}
                      className="py-3 px-3 text-right text-cyan-300 cursor-pointer hover:text-cyan-200 transition-colors select-none"
                      title="Sort by Final Composite Score"
                    >
                      <span>FINAL SCORE</span>
                      {renderSortIcon('score')}
                    </th>
                  </>
                ) : activeTab === 'GITHUB' ? (
                  <>
                    <th
                      onClick={() => handleHeaderSort('commits')}
                      className="py-3 px-2.5 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by Total Commits"
                    >
                      <span>COMMITS</span>
                      {renderSortIcon('commits')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('stars')}
                      className="py-3 px-2.5 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by Total GitHub Stars"
                    >
                      <span>STARS</span>
                      {renderSortIcon('stars')}
                    </th>
                    <th className="py-3 px-2.5 text-left">TOP LANGUAGES</th>
                    <th className="py-3 px-2.5 text-center">VERIFICATION / INTEGRITY</th>
                    <th
                      onClick={() => handleHeaderSort('tech')}
                      className="py-3 px-3 text-right text-cyan-300 cursor-pointer hover:text-cyan-200 transition-colors select-none"
                      title="Sort by Technical Depth Score"
                    >
                      <span>TECH SCORE</span>
                      {renderSortIcon('tech')}
                    </th>
                  </>
                ) : activeTab === 'LINKEDIN' ? (
                  <>
                    <th className="py-3 px-2.5 text-left">SENIORITY</th>
                    <th className="py-3 px-2.5 text-center">500+ NETWORK</th>
                    <th className="py-3 px-2.5 text-left">COMPANIES & AFFILIATIONS</th>
                    <th className="py-3 px-2.5 text-center">PROFILES</th>
                    <th
                      onClick={() => handleHeaderSort('linkedin')}
                      className="py-3 px-3 text-right text-cyan-300 cursor-pointer hover:text-cyan-200 transition-colors select-none"
                      title="Sort by LinkedIn Score"
                    >
                      <span>LINKEDIN SCORE</span>
                      {renderSortIcon('linkedin')}
                    </th>
                  </>
                ) : activeTab === 'ROLES' ? (
                  <>
                    <th className="py-3 px-2.5 text-left">COVERED SQUAD ROLES</th>
                    <th className="py-3 px-2.5 text-left">MISSING ROLES</th>
                    <th
                      onClick={() => handleHeaderSort('skills')}
                      className="py-3 px-2.5 text-center cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by Unique Skills Count"
                    >
                      <span>TOTAL TECH</span>
                      {renderSortIcon('skills')}
                    </th>
                    <th className="py-3 px-2.5 text-center">DATA COMPLETION</th>
                    <th
                      onClick={() => handleHeaderSort('roles')}
                      className="py-3 px-3 text-right text-cyan-300 cursor-pointer hover:text-cyan-200 transition-colors select-none"
                      title="Sort by Skill Complementarity Score"
                    >
                      <span>SYNERGY SCORE</span>
                      {renderSortIcon('roles')}
                    </th>
                  </>
                ) : activeTab === 'ACCOLADES' ? (
                  <>
                    <th
                      onClick={() => handleHeaderSort('wins')}
                      className="py-3 px-2.5 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by Hackathon Wins"
                    >
                      <span>HACKATHON WINS</span>
                      {renderSortIcon('wins')}
                    </th>
                    <th className="py-3 px-2.5 text-left">RESEARCH & CLUBS</th>
                    <th className="py-3 px-2.5 text-center">PROOF OF WORK</th>
                    <th className="py-3 px-2.5 text-center">KEYWORDS</th>
                    <th
                      onClick={() => handleHeaderSort('exp')}
                      className="py-3 px-3 text-right text-cyan-300 cursor-pointer hover:text-cyan-200 transition-colors select-none"
                      title="Sort by Experience Score"
                    >
                      <span>EXP SCORE</span>
                      {renderSortIcon('exp')}
                    </th>
                  </>
                ) : activeTab === 'DISQUALIFIED' ? (
                  <>
                    <th className="py-3 px-3 text-left">FAILED HARD GATES & REASONS</th>
                    <th className="py-3 px-2 text-right">TECH</th>
                    <th className="py-3 px-2 text-right">EXP</th>
                    <th className="py-3 px-2 text-right">ROLES</th>
                    <th
                      onClick={() => handleHeaderSort('score')}
                      className="py-3 px-3 text-right text-rose-300 cursor-pointer hover:text-rose-200 transition-colors select-none"
                      title="Sort by Overall Score"
                    >
                      <span>RAW SCORE</span>
                      {renderSortIcon('score')}
                    </th>
                  </>
                ) : (
                  /* OVERALL & SHORTLIST Headers */
                  <>
                    <th
                      onClick={() => handleHeaderSort('tech')}
                      className="py-3 px-2.5 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by Technical Depth Score"
                    >
                      <span>TECH</span>
                      {renderSortIcon('tech')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('exp')}
                      className="py-3 px-2.5 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by Experience & Wins Score"
                    >
                      <span>EXP</span>
                      {renderSortIcon('exp')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('roles')}
                      className="py-3 px-2.5 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
                      title="Sort by Skill Synergy / Roles Score"
                    >
                      <span>ROLES</span>
                      {renderSortIcon('roles')}
                    </th>
                    <th
                      onClick={() => handleHeaderSort('score')}
                      className="py-3 px-3 text-right text-cyan-300 cursor-pointer hover:text-cyan-200 transition-colors select-none"
                      title="Sort by Composite Final Incursion Score"
                    >
                      <span>SCORE</span>
                      {renderSortIcon('score')}
                    </th>
                  </>
                )}

                {/* Status Column */}
                <th className="py-3 px-2.5 text-center">STATUS</th>

                {/* Sticky Action Button */}
                <th className="py-3 px-3 text-center sticky right-0 z-20 bg-black/95 border-l border-cyan-950/80 shadow-[-8px_0_12px_rgba(0,0,0,0.7)] w-28">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {paginatedTeams.map((team, idx) => {
                const st = statsMap.get(team.id)!;
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

                // Rank in current view:
                const domainRank = (currentPage - 1) * (pageSize || 50) + idx + 1;

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
                          <span className="inline-flex items-center text-purple-400 font-extrabold" title="Manually Pinned by Organizer">
                            <Pin className="w-3.5 h-3.5 mr-0.5 fill-purple-400" />
                            {domainRank}
                          </span>
                        ) : team.computed.manualStatus === 'excluded' ? (
                          <span className="text-rose-500 font-medium" title="Manually Excluded">✕</span>
                        ) : domainRank === 1 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/60 font-black shadow-[0_0_8px_rgba(245,158,11,0.3)]" title="Rank #1">
                            1
                          </span>
                        ) : domainRank === 2 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-500/60 font-black" title="Rank #2">
                            2
                          </span>
                        ) : domainRank === 3 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-700/60 font-black" title="Rank #3">
                            3
                          </span>
                        ) : (
                          <span className="text-zinc-500">{domainRank}</span>
                        )}
                      </td>

                      {/* Team Name & Meta */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-zinc-100 flex items-center gap-1.5 flex-wrap">
                          <span className="truncate max-w-[200px] font-semibold">{teamDisplayName}</span>
                          {activeTab !== 'OVERALL' && (
                            <span className="text-[9px] text-zinc-500 font-mono" title={`Overall Cohort Rank: #${team.computed.rank}`}>
                              (#{team.computed.rank})
                            </span>
                          )}
                          {team.computed.hasManualOverrides && (
                            <span title="Manual overrides active on this team" className="text-[9px] bg-amber-950/90 text-amber-300 border border-amber-600/80 px-1 py-0.2 rounded font-mono font-bold shrink-0 flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 fill-amber-300" />
                              Overridden
                            </span>
                          )}
                          {st.contactCount > 0 && (
                            <span title={`${st.contactCount} direct mobile contact numbers available`} className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                              📞
                            </span>
                          )}
                          {st.hasForkSuspicion && (
                            <span title="Flagged for suspicious commits or 100% forked repos" className="inline-flex items-center">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            </span>
                          )}
                          {st.femaleCount > 0 && (
                            <span title={`${st.femaleCount} verified female participant(s)`} className="text-[9px] bg-pink-950/80 text-pink-300 border border-pink-800/80 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                              ♀ {st.femaleCount}F
                            </span>
                          )}
                        </div>

                        {/* Subtitle handles / roles */}
                        <div className="text-[11px] text-zinc-500 truncate max-w-[260px]">
                          {activeTab === 'ACM' ? (
                            (() => {
                              const rolls = team.members.map((m) => m.rollNumber || m.acmProfile?.rollNumber).filter(Boolean);
                              const branches = Array.from(new Set(team.members.map((m) => m.acmProfile?.branch).filter(Boolean)));
                              if (rolls.length > 0) {
                                return (
                                  <span className="text-cyan-400/90 font-mono">
                                    {rolls.map((r) => r?.toUpperCase()).join(', ')}
                                    {branches.length > 0 && ` • ${branches.join('/')}`}
                                  </span>
                                );
                              }
                              return 'ACM Chapter Telemetry';
                            })()
                          ) : activeTab === 'GITHUB' ? (
                            st.githubHandles.length > 0 ? (
                              <span className="text-cyan-400/90 font-mono flex flex-wrap items-center gap-1.5">
                                {st.githubHandles.map((h) => {
                                  const mem = team.members.find((m) => m.rawSignals.githubUsername === h);
                                  const isUnverified = mem?.rawSignals.githubMetrics?.syncStatus !== 'live_verified';
                                  const hashVal = mem?.rawSignals.githubMetrics?.fallbackHash;
                                  return (
                                    <span key={h} className="inline-flex items-center gap-1">
                                      <span>@{h}</span>
                                      {isUnverified && hashVal && (
                                        <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-700/80 px-1 py-0.2 rounded font-mono font-bold" title={`Temporary hash estimate #${hashVal} while GitHub API rate limit is reached`}>
                                          #{hashVal}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })}
                              </span>
                            ) : (
                              'No GitHub linked'
                            )
                          ) : activeTab === 'LINKEDIN' ? (
                            st.companies.length > 0 ? (
                              <span className="text-blue-300/90">
                                {st.companies.join(', ')}
                              </span>
                            ) : (
                              'LinkedIn active'
                            )
                          ) : (
                            (() => {
                              const colleges = Array.from(new Set(team.members.map((m) => m.college).filter(Boolean)));
                              const gradYears = Array.from(new Set(team.members.map((m) => m.gradYear).filter(Boolean)));
                              const meta = [];
                              if (colleges.length > 0) meta.push(colleges[0]);
                              if (gradYears.length > 0) meta.push(gradYears[0]);
                              const roleText = team.computed.coveredRoles.join(', ') || 'General';
                              return meta.length > 0 ? `${meta.join(' • ')} | ${roleText}` : roleText;
                            })()
                          )}
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-2.5 px-2 text-center text-zinc-400 font-medium">
                        {team.members.length}
                      </td>

                      {/* 4. Adaptive Columns Rendering by Tab */}
                      {activeTab === 'ACM' ? (
                        <>
                          {/* Official ACM Score */}
                          <td className="py-2.5 px-3 text-right font-mono">
                            <span className="text-base font-black text-cyan-400 neon-glow-cyan">
                              {team.computed.acmScore ?? 0}
                            </span>
                            {team.computed.acmRank ? (
                              <span className="text-[10px] text-zinc-500 block">
                                Rank #{team.computed.acmRank}
                              </span>
                            ) : null}
                          </td>

                          {/* Data Source Badge */}
                          <td className="py-2.5 px-2.5 text-center">
                            {team.members.some((m) => m.acmDataSource === 'acm_website') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono">
                                🛡️ ACM OVERRIDE
                              </span>
                            ) : team.members.some((m) => m.acmDataSource === 'hybrid') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                                ✨ ACM BACKFILL
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                                📝 REGISTRATION
                              </span>
                            )}
                          </td>

                          {/* LeetCode */}
                          <td className="py-2.5 px-2.5 text-right font-mono">
                            {team.computed.leetcodeRating ? (
                              <div>
                                <span className="font-bold text-amber-400">
                                  {team.computed.leetcodeRating}
                                </span>
                                {team.members.some((m) => m.acmProfile?.leetcode?.totalSolved) && (
                                  <span className="text-[10px] text-zinc-500 block">
                                    {Math.max(...team.members.map((m) => m.acmProfile?.leetcode?.totalSolved || 0))} solved
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-600 text-[10px]">Unrated</span>
                            )}
                          </td>

                          {/* Codeforces */}
                          <td className="py-2.5 px-2.5 text-right font-mono">
                            {team.computed.cfRating ? (
                              <div>
                                <span className="font-bold text-blue-400">
                                  {team.computed.cfRating}
                                </span>
                                {team.members.find((m) => m.acmProfile?.codeforces?.currentRank)?.acmProfile?.codeforces?.currentRank && (
                                  <span className="text-[10px] text-zinc-500 block capitalize">
                                    {team.members.find((m) => m.acmProfile?.codeforces?.currentRank)?.acmProfile?.codeforces?.currentRank}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-600 text-[10px]">Unrated</span>
                            )}
                          </td>

                          {/* CodeChef */}
                          <td className="py-2.5 px-2.5 text-center font-mono">
                            {team.computed.codechefStars ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-800">
                                {'★'.repeat(team.computed.codechefStars)} ({team.computed.codechefStars}★)
                              </span>
                            ) : (
                              <span className="text-zinc-600 text-[10px]">Unrated</span>
                            )}
                          </td>

                          {/* Commits */}
                          <td className="py-2.5 px-2.5 text-right font-medium text-emerald-400 font-mono">
                            {st.totalCommits.toLocaleString()}
                          </td>

                          {/* Final Score */}
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-base font-black text-cyan-400 font-mono">
                              {team.computed.finalScore}
                            </span>
                          </td>
                        </>
                      ) : activeTab === 'GITHUB' ? (
                        <>
                          {/* Commits */}
                          <td className="py-2.5 px-2.5 text-right font-medium text-emerald-400 font-mono">
                            {st.totalCommits.toLocaleString()}
                          </td>
                          {/* Stars */}
                          <td className="py-2.5 px-2.5 text-right font-medium text-amber-300 font-mono">
                            ⭐ {st.totalStars}
                          </td>
                          {/* Top Languages */}
                          <td className="py-2.5 px-2.5 text-left font-mono">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {st.topLanguages.length > 0 ? (
                                st.topLanguages.map((l) => (
                                  <span key={l} className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] px-1.5 py-0.2 rounded">
                                    {l}
                                  </span>
                                ))
                              ) : (
                                <span className="text-zinc-600 text-[10px]">None</span>
                              )}
                            </div>
                          </td>
                          {/* Verification & Fork Integrity */}
                          <td className="py-2.5 px-2.5 text-center">
                            {st.unverifiedGhCount > 0 ? (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/90 text-amber-300 border border-amber-600/80 font-mono inline-flex items-center gap-1 shadow-xs cursor-help"
                                title={`Temporary Hash Estimate (#${st.ghFallbackHashes.join(', ') || 'N/A'}). Real GitHub API was rate limited or pending sync. Click 'GitHub PAT' to fetch real data.`}
                              >
                                <span>⚠️ HASH #{st.ghFallbackHashes[0] || 'TEMP'}</span>
                              </span>
                            ) : st.hasForkSuspicion ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                                ⚠️ Suspicious
                              </span>
                            ) : st.githubMemberCount > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono">
                                ✓ Live Verified
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-zinc-500 border border-zinc-800 font-mono">
                                —
                              </span>
                            )}
                          </td>
                          {/* Tech Score */}
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-base font-black text-cyan-400 neon-glow-cyan font-mono">
                              {team.computed.technicalDepthScore}
                            </span>
                          </td>
                        </>
                      ) : activeTab === 'LINKEDIN' ? (
                        <>
                          {/* Seniority */}
                          <td className="py-2.5 px-2.5 text-left">
                            <div className="flex flex-wrap gap-1">
                              {st.seniorityLevels.length > 0 ? (
                                st.seniorityLevels.map((s) => (
                                  <span key={s} className="bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] px-1.5 py-0.2 rounded font-bold capitalize">
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-zinc-500 text-[10px]">Member</span>
                              )}
                            </div>
                          </td>
                          {/* 500+ Network */}
                          <td className="py-2.5 px-2.5 text-center">
                            {st.has500PlusCount > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                🌟 {st.has500PlusCount}x 500+
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-[10px]">Active</span>
                            )}
                          </td>
                          {/* Companies */}
                          <td className="py-2.5 px-2.5 text-left">
                            <div className="truncate max-w-[200px] text-zinc-300 text-[11px]">
                              {st.companies.length > 0 ? st.companies.join(', ') : <span className="text-zinc-600">N/A</span>}
                            </div>
                          </td>
                          {/* Profiles */}
                          <td className="py-2.5 px-2.5 text-center text-zinc-400 font-mono text-[11px]">
                            {st.linkedinMemberCount} / {team.members.length}
                          </td>
                          {/* LinkedIn Score */}
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-base font-black text-cyan-400 neon-glow-cyan font-mono">
                              {st.linkedinScore}
                            </span>
                          </td>
                        </>
                      ) : activeTab === 'ROLES' ? (
                        <>
                          {/* Covered Roles */}
                          <td className="py-2.5 px-2.5 text-left">
                            <div className="flex flex-wrap gap-1">
                              {st.coveredRoles.map((r) => (
                                <span key={r} className="bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] px-1.5 py-0.2 rounded">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          {/* Missing Roles */}
                          <td className="py-2.5 px-2.5 text-left">
                            {st.missingRoles.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {st.missingRoles.map((r) => (
                                  <span key={r} className="bg-rose-950/60 text-rose-300 border border-rose-800 text-[10px] px-1.5 py-0.2 rounded">
                                    Needs {r}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-emerald-400 font-bold text-[10px]">✓ Full Squad (4/4)</span>
                            )}
                          </td>
                          {/* Total Tech */}
                          <td className="py-2.5 px-2.5 text-center text-zinc-300 font-mono">
                            {st.uniqueSkills.length} Skills
                          </td>
                          {/* Data Completeness */}
                          <td className="py-2.5 px-2.5 text-center text-zinc-300 font-mono">
                            {team.computed.dataCompletenessScore}%
                          </td>
                          {/* Synergy Score */}
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-base font-black text-cyan-400 neon-glow-cyan font-mono">
                              {team.computed.skillComplementarityScore}
                            </span>
                          </td>
                        </>
                      ) : activeTab === 'ACCOLADES' ? (
                        <>
                          {/* Hackathon Wins */}
                          <td className="py-2.5 px-2.5 text-right font-medium text-amber-300 font-mono">
                            {st.hackathonWins > 0 ? `🏆 ${st.hackathonWins} Wins` : <span className="text-zinc-600">0</span>}
                          </td>
                          {/* Research & Clubs */}
                          <td className="py-2.5 px-2.5 text-left">
                            <div className="flex flex-wrap gap-1">
                              {st.researchCount > 0 && (
                                <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] px-1.5 py-0.2 rounded">
                                  🏛️ {st.researchCount} Research
                                </span>
                              )}
                              {st.tier1CompanyCount > 0 && (
                                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-1.5 py-0.2 rounded">
                                  🏢 {st.tier1CompanyCount} Tier-1
                                </span>
                              )}
                              {st.clubCount > 0 && (
                                <span className="bg-zinc-900 text-zinc-300 border border-zinc-700 text-[10px] px-1.5 py-0.2 rounded">
                                  🎯 {st.clubCount} Club
                                </span>
                              )}
                              {!st.researchCount && !st.tier1CompanyCount && !st.clubCount && (
                                <span className="text-zinc-600 text-[10px]">Standard</span>
                              )}
                            </div>
                          </td>
                          {/* Proof of Work */}
                          <td className="py-2.5 px-2.5 text-center">
                            {st.hasProofOfWork ? (
                              <span className="text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Portfolio
                              </span>
                            ) : (
                              <span className="text-zinc-600 text-[10px]">Resume only</span>
                            )}
                          </td>
                          {/* Keywords */}
                          <td className="py-2.5 px-2.5 text-center text-zinc-400 font-mono text-[10px]">
                            {team.members.some((m) => (m.rawSignals.matchedCustomKeywords || []).length > 0) ? (
                              <span className="text-cyan-400 font-bold">Matched</span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          {/* Exp Score */}
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-base font-black text-cyan-400 neon-glow-cyan font-mono">
                              {team.computed.projectExperienceScore}
                            </span>
                          </td>
                        </>
                      ) : activeTab === 'DISQUALIFIED' ? (
                        <>
                          {/* Disqualified Reasons */}
                          <td className="py-2.5 px-3 text-left">
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {team.computed.failedFilters.map((f) => (
                                <span key={f.filterName} className="bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                  ✕ {f.filterName}: {f.reason}
                                </span>
                              ))}
                              {team.computed.manualStatus === 'excluded' && (
                                <span className="bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                  ✕ Excluded by Organizer
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-zinc-400">
                            {team.computed.technicalDepthScore}
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-zinc-400">
                            {team.computed.projectExperienceScore}
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-zinc-400">
                            {team.computed.skillComplementarityScore}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-base font-black text-rose-400 font-mono">
                              {team.computed.finalScore}
                            </span>
                          </td>
                        </>
                      ) : (
                        /* OVERALL & SHORTLIST Data */
                        <>
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

                          {/* Final Composite Incursion Score */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-base font-black text-cyan-400 neon-glow-cyan font-mono">
                                {team.computed.finalScore}
                              </span>
                              {team.computed.customScoreApplied && (
                                <span className="text-[8px] text-cyan-300/80 font-bold uppercase tracking-tighter" title="Calculated using Custom Scoring Formula">
                                  CUSTOM MATH
                                </span>
                              )}
                            </div>
                          </td>
                        </>
                      )}

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

                      {/* Action button (Sticky right-0 for Scorecard inspection) */}
                      <td className="py-2.5 px-3 text-center sticky right-0 z-10 bg-zinc-950/95 group-hover:bg-[#071c2a] border-l border-cyan-950/80 shadow-[-8px_0_12px_rgba(0,0,0,0.7)]">
                        <div className="flex items-center justify-center whitespace-nowrap">
                          <button
                            onClick={() => onSelectTeam(team)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-cyan-500 hover:text-black rounded text-[11px] font-bold text-zinc-200 hover:text-black border border-zinc-800 hover:border-cyan-400 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Open Candidate Scorecard Drilldown"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400 group-hover:text-black" />
                            <span>Scorecard</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Visual Cutoff Line (Laser separator) on OVERALL tab */}
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

      {/* 4. Pagination Footer */}
      <div className="p-3.5 sm:p-4 bg-black/60 border-t border-cyan-950/60 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-zinc-400">
        <div>
          Showing {paginatedTeams.length} of {sortedTeams.length} teams in {activeTab} view
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
