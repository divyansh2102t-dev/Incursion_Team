// Core types for Hackathon Team Recruitment Automation Tool

export type RoleCategory = 'frontend' | 'backend' | 'ai_ml' | 'mobile' | 'design' | 'devops' | 'general';

export interface ExtractedSignals {
  skills: string[];
  roleDistribution: Record<RoleCategory, number>; // 0 to 1
  githubUsername?: string;
  githubMetrics?: {
    username?: string;
    publicRepos: number;
    originalRepos: number;
    forkedRepos: number;
    totalStars: number;
    estimatedContributions: number;
    topLanguages: string[];
    isSuspicious: boolean;
    suspiciousReason?: string;
    avatarUrl?: string;
  };
  experienceYears?: number;
  hackathonExperienceCount: number;
  hasResume: boolean;
  hasGithub: boolean;
  hasLinkedin: boolean;
  hasPortfolio: boolean;
  completenessRatio: number; // 0 to 1
  rawTextSummary?: string;
}

export interface MemberProfile {
  id: string;
  name: string;
  email?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  roleOrBio?: string;
  rawSignals: ExtractedSignals;
}

export interface HardFilterResult {
  passed: boolean;
  filterName: string;
  reason: string;
}

export interface TeamComputedMetrics {
  isEligible: boolean;
  failedFilters: HardFilterResult[];
  passedFilters: HardFilterResult[];
  
  // Normalized dimension scores (0 - 100)
  technicalDepthScore: number;
  projectExperienceScore: number;
  skillComplementarityScore: number;
  dataCompletenessScore: number;
  
  // Total weighted score
  finalScore: number;
  rank: number;
  customScoreApplied?: boolean;

  // Analysis & Flags
  coveredRoles: RoleCategory[];
  missingRoles: RoleCategory[];
  missingDataWarnings: string[];
  antiCheatFlags: string[];
  
  // Manual status override
  manualStatus?: 'pinned' | 'excluded' | 'waitlisted' | 'normal';
  manualNote?: string;
}

export interface TeamRecord {
  id: string;
  teamName: string;
  submissionTimestamp?: string;
  members: MemberProfile[];
  rawRowData: Record<string, string>;
  computed: TeamComputedMetrics;
}

export type AggregationStrategy = 'MAX_SKILL' | 'DIMINISHING_RETURNS' | 'BALANCED_MEAN';
export type MissingDataPolicy = 'NEUTRAL' | 'PENALTY_10' | 'PENALTY_25';

export type GithubRequirementMode = 'NONE' | 'AT_LEAST_ONE' | 'ALL_MEMBERS';

export interface HardFilterConfig {
  minTeamSize: number;
  maxTeamSize: number;
  requireAtLeastOneGithub: boolean;
  githubRequirement?: GithubRequirementMode;
  minGithubContributionsOverall: number;
  requireAtLeastOneResumeOrPortfolio: boolean;
  minTotalSkillsCount: number;
}

export interface ScoringWeights {
  technicalDepth: number;          // 0 to 100
  projectExperience: number;       // 0 to 100
  skillComplementarity: number;    // 0 to 100
  dataCompleteness: number;        // 0 to 100
}

export interface TieBreakerConfig {
  order: Array<'diversity' | 'githubContributions' | 'completeness' | 'earliestSubmission'>;
}

export interface FormulaCoefficients {
  // Resume & Experience formula parameters
  hackathonPointsPerWin: number;       // default 25
  hackathonMaxPoints: number;          // default 50
  skillPointsPerMatch: number;         // default 4
  skillMaxPoints: number;              // default 30
  verifiableLinksBonusPoints: number;  // default 20

  // GitHub & Technical depth formula parameters
  githubContribMaxPoints: number;      // default 60
  githubContribDivisor: number;        // default 250
  githubStarsMaxPoints: number;        // default 20
  githubStarsDivisor: number;          // default 15
  githubSkillBreadthMaxPoints: number; // default 20
  githubSkillDivisor: number;          // default 10

  // Anti-cheat penalty factor
  suspiciousAccountDiscount: number;   // default 0.70 (30% discount)

  // Team Normalization parameters
  diminishingReturnsBase: number;      // default 1.5
  balancedMeanBonusPerMember: number;  // default 0.08
  balancedMeanMaxCap: number;          // default 1.40
}

export interface SelectionConfig {
  presetName: string;
  shortlistCount: number; // Top X
  weights: ScoringWeights;
  filters: HardFilterConfig;
  aggregationStrategy: AggregationStrategy;
  missingDataPolicy: MissingDataPolicy;
  tieBreakers: TieBreakerConfig;
  anonymizeMode: boolean; // Blind review mode
  formulaCoefficients: FormulaCoefficients;
  customFormulaEnabled?: boolean;
  customFormulaExpression?: string;
  customFormulaName?: string;
}

export interface ColumnMappingConfig {
  teamNameCol: string;
  submissionTimeCol?: string;
  memberCountType: 'single_row_multiple_members' | 'delimited_or_stacked';
  maxMembersDetected: number;
  memberColumns: Array<{
    memberIndex: number; // 1, 2, 3...
    nameCol?: string;
    emailCol?: string;
    githubCol?: string;
    linkedinCol?: string;
    portfolioCol?: string;
    resumeCol?: string;
    roleOrBioCol?: string;
  }>;
}

export interface ShortlistRunExport {
  exportedAt: string;
  totalTeams: number;
  shortlistTarget: number;
  shortlistedCount: number;
  config: SelectionConfig;
  teams: Array<{
    rank: number;
    teamName: string;
    teamSize: number;
    finalScore: number;
    isEligible: boolean;
    status: 'shortlisted' | 'waitlist' | 'rejected' | 'pinned' | 'excluded';
    scoreBreakdown: {
      technicalDepth: number;
      projectExperience: number;
      skillComplementarity: number;
      dataCompleteness: number;
    };
    explanation: string;
    warnings: string[];
    members: Array<{
      name: string;
      github?: string;
      skills: string[];
    }>;
  }>;
}

export interface ScoringHistoryEntry {
  id: string;
  timestamp: string;
  name: string;
  notes?: string;
  totalTeams: number;
  shortlistTarget: number;
  shortlistedCount: number;
  averageScore: number;
  highestScore: number;
  disqualifiedCount: number;
  pinnedCount: number;
  excludedCount: number;
  configSnapshot: SelectionConfig;
  topTeamsSnapshot: Array<{
    rank: number;
    teamName: string;
    teamSize: number;
    finalScore: number;
    isEligible: boolean;
    status: 'shortlisted' | 'waitlist' | 'rejected' | 'pinned' | 'excluded';
    scoreBreakdown: {
      technicalDepth: number;
      projectExperience: number;
      skillComplementarity: number;
      dataCompleteness: number;
    };
  }>;
  baseTeamsSnapshot?: TeamRecord[];
}

