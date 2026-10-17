// Core types for Hackathon Team Recruitment Automation Tool

export type RoleCategory = 'frontend' | 'backend' | 'ai_ml' | 'mobile' | 'design' | 'devops' | 'general';

export interface WorkExperienceItem {
  title: string;
  organization: string;
  duration?: string;
  isResearchInternship: boolean; // NIT / IIT / IIIT / IISc / BITS / MIT / Stanford etc.
  isTier1Company: boolean;       // FAANG, Nvidia, OpenAI, Stripe, Uber, top unicorns
  isSpamOrSuspicious: boolean;   // Paid training, unverified solo placeholder founder
  suspiciousReason?: string;
}

export interface ClubActivityItem {
  role: string;
  clubName: string;
  isHighImpactLead: boolean;     // Lead, President, Chairperson, Core Lead, Hackathon Organizer
}

export interface ScoringWeightsToggles {
  technicalDepth?: boolean;
  projectExperience?: boolean;
  skillComplementarity?: boolean;
  dataCompleteness?: boolean;
}

export interface CustomKeywordWeight {
  id: string;
  keyword: string;
  weight: number; // bonus or penalty points assigned if found
  enabled?: boolean; // individual keyword toggle
}

export type AcmDataPriority = 'ACM_OVERWRITE' | 'PRESERVE_INPUT';
export type AcmScoringMode = 'DEFAULT_ACM_SCORE' | 'CUSTOM_FORMULA';

export interface AcmStudentProfile {
  uid?: string;
  rollNumber: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  branch: string;
  currentYear: number;
  graduationBatch: number;
  profileImageUrl?: string;
  slug?: string;
  acm: {
    score: number;
    overallRank: number;
    branchRank: number;
    yearRank: number;
    platformRanks?: {
      leetcode?: number;
      codeforces?: number;
      codechef?: number;
      github?: number;
    };
    lastCalculated?: string;
  };
  leetcode?: {
    username: string;
    rating: number;
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    contestCount: number;
    globalRank: number;
  };
  codeforces?: {
    handle: string;
    currentRating: number;
    maxRating: number;
    currentRank: string;
    maxRank: string;
    problemsSolved: number;
    contestCount: number;
  };
  codechef?: {
    username: string;
    currentRating: number;
    highestRating: number;
    stars: number;
    contestCount: number;
    globalRank: number;
  };
  github?: {
    username: string;
    totalCommits: number;
    publicRepos: number;
    followers: number;
    starsReceived: number;
    pullRequests: number;
    issues: number;
  };
}

export interface AcmEventConfig {
  enabled: boolean;                      // "ACM Only Event" toggle
  dataPriority: AcmDataPriority;         // Whether to override with ACM data or preserve input/calculated data
  scoringMode: AcmScoringMode;           // Official acm.score vs Formula Studio
  acmWeight: number;                     // Weight % (e.g. 35%) when blending with Overall Score
  autoEnrichProfiles: boolean;           // Auto-fill LeetCode, Codeforces, CodeChef, GitHub handles
  minAcmScoreRequired?: number;          // Hard gate threshold (default 0, e.g. >= 20)
  requireAllMembersAcm?: boolean;        // Hard gate: all members must be verified on ACM NIT Surat
  lastSyncTimestamp?: string;
  cachedProfilesCount?: number;
}

export interface WorkExperienceConfig {
  enabled: boolean;
  baseWorkExpEnabled?: boolean;
  baseWorkExpPoints: number;        // Points for any verified work experience (default 10)
  tier1CompanyEnabled?: boolean;
  tier1CompanyBonus: number;        // Points bonus for FAANG / Tier 1 (default 20)
  researchInternshipEnabled?: boolean;
  researchInternshipBonus: number;  // Points bonus for IIT / NIT / IIIT / Top Lab research (default 25)
  clubLeadershipEnabled?: boolean;
  clubLeadershipBonus: number;      // Points bonus for GDSC/IEEE/ACM Lead / Hackathon Chair (default 15)
  clubMemberBonus: number;          // Points bonus for general club member (default 5)
  penalizeSpam: boolean;            // Whether to nullify / penalize spam experiences (default true)
  spamPenaltyDiscount: number;      // Multiplier discount if spam detected, e.g. 0.5 (or 0)
  maxTotalExperiencePoints: number; // Cap on total experience points, e.g. 50
  customKeywordsEnabled?: boolean;  // Master toggle for custom keywords
}

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
    isHeuristicFallback?: boolean;
    fallbackHash?: number;
    syncStatus?: 'live_verified' | 'fallback_hash' | 'rate_limited';
  };
  experienceYears?: number;
  hackathonExperienceCount: number;
  workExperiences?: WorkExperienceItem[];
  clubActivities?: ClubActivityItem[];
  matchedCustomKeywords?: string[];
  hasResume: boolean;
  hasGithub: boolean;
  hasLinkedin: boolean;
  linkedinUsername?: string;
  linkedinMetrics?: {
    username?: string;
    headline?: string;
    company?: string;
    seniorityLevel: 'senior' | 'mid' | 'junior' | 'founder' | 'student' | 'unknown';
    has500PlusConnections: boolean;
    isCustomVanitySlug: boolean;
    crossMatchesGithub: boolean;
    extractedSkills: string[];
    verifiedScore: number;
  };
  hasPortfolio: boolean;
  completenessRatio: number; // 0 to 1
  rawTextSummary?: string;
}

export interface MemberProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  college?: string;
  gradYear?: string;
  gender?: 'female' | 'male' | 'non_binary' | 'other' | 'unspecified';
  isFemale?: boolean;
  rollNumber?: string;
  acmProfile?: AcmStudentProfile;
  isAcmMatched?: boolean;
  acmDataSource?: 'acm_website' | 'input_form' | 'hybrid';
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  roleOrBio?: string;
  customFields?: Record<string, string>;
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
  linkedinScore?: number; // 0 to 100
  
  // Total weighted score
  finalScore: number;
  rank: number;
  customScoreApplied?: boolean;

  // ACM NIT Surat Chapter metrics
  acmScore?: number;
  acmRank?: number;
  acmMatchedCount?: number;
  acmSourceNotice?: string;
  cfRating?: number;
  leetcodeRating?: number;
  codechefStars?: number;

  // Analysis & Flags
  coveredRoles: RoleCategory[];
  missingRoles: RoleCategory[];
  missingDataWarnings: string[];
  antiCheatFlags: string[];
  
  // Manual status override
  manualStatus?: 'pinned' | 'excluded' | 'waitlisted' | 'normal';
  manualNote?: string;
  hasManualOverrides?: boolean;
}

export interface TeamManualOverrides {
  isEligibleOverride?: boolean; // Force eligible (true) or force disqualified (false)
  eligibilityOverrideReason?: string;
  gateOverrides?: Record<string, boolean>; // Overrides per individual hard gate
  technicalDepthScore?: number;
  projectExperienceScore?: number;
  skillComplementarityScore?: number;
  dataCompletenessScore?: number;
  finalScore?: number;
  antiCheatDismissed?: boolean;
  notes?: string;
}

export interface TeamRecord {
  id: string;
  teamName: string;
  submissionTimestamp?: string;
  members: MemberProfile[];
  rawRowData: Record<string, string>;
  computed: TeamComputedMetrics;
  manualOverrides?: TeamManualOverrides;
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
  requireFemaleMember?: boolean; // Compulsory female participation (e.g. SIH / diversity rules)
  minFemaleCount?: number;        // Minimum required female participants (default 1)
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

  // LinkedIn profile formula parameters (100% in user's hands)
  linkedinSeniorityMaxPoints: number;      // default 30
  linkedinPedigreeMaxPoints: number;       // default 25
  linkedinConnections500Points: number;    // default 20
  linkedinVanitySlugPoints: number;        // default 15
  linkedinGithubMatchPoints: number;       // default 10

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
  weightsEnabled?: ScoringWeightsToggles;
  filters: HardFilterConfig;
  aggregationStrategy: AggregationStrategy;
  missingDataPolicy: MissingDataPolicy;
  tieBreakers: TieBreakerConfig;
  anonymizeMode: boolean; // Blind review mode
  formulaCoefficients: FormulaCoefficients;
  customFormulaEnabled?: boolean;
  customFormulaExpression?: string;
  customFormulaName?: string;
  customKeywords?: CustomKeywordWeight[];
  workExperienceConfig?: WorkExperienceConfig;
  acmEventConfig?: AcmEventConfig;
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
    phoneCol?: string;
    collegeCol?: string;
    gradYearCol?: string;
    genderCol?: string;
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

