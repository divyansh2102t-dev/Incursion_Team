import { FormulaCoefficients, SelectionConfig } from '@/types';

export const DEFAULT_FORMULA_COEFFICIENTS: FormulaCoefficients = {
  // Resume & Hackathon Experience
  hackathonPointsPerWin: 25,
  hackathonMaxPoints: 50,
  skillPointsPerMatch: 4,
  skillMaxPoints: 30,
  verifiableLinksBonusPoints: 20,

  // GitHub & Code Output
  githubContribMaxPoints: 60,
  githubContribDivisor: 250,
  githubStarsMaxPoints: 20,
  githubStarsDivisor: 15,
  githubSkillBreadthMaxPoints: 20,
  githubSkillDivisor: 10,

  // Anti-cheat penalty factor
  suspiciousAccountDiscount: 0.70,

  // Team Normalization
  diminishingReturnsBase: 1.5,
  balancedMeanBonusPerMember: 0.08,
  balancedMeanMaxCap: 1.40,
};

export const PRESETS: Record<string, SelectionConfig> = {
  balanced: {
    presetName: 'Balanced Hackathon (Generalist)',
    shortlistCount: 25,
    weights: {
      technicalDepth: 35,
      projectExperience: 30,
      skillComplementarity: 25,
      dataCompleteness: 10,
    },
    filters: {
      minTeamSize: 1,
      maxTeamSize: 4,
      requireAtLeastOneGithub: true,
      minGithubContributionsOverall: 20,
      requireAtLeastOneResumeOrPortfolio: false,
      minTotalSkillsCount: 2,
    },
    aggregationStrategy: 'DIMINISHING_RETURNS',
    missingDataPolicy: 'NEUTRAL',
    tieBreakers: {
      order: ['diversity', 'githubContributions', 'completeness', 'earliestSubmission'],
    },
    anonymizeMode: false,
    formulaCoefficients: { ...DEFAULT_FORMULA_COEFFICIENTS },
  },

  deepTech: {
    presetName: 'Hardcore Deep Tech & Systems',
    shortlistCount: 20,
    weights: {
      technicalDepth: 55,
      projectExperience: 25,
      skillComplementarity: 15,
      dataCompleteness: 5,
    },
    filters: {
      minTeamSize: 1,
      maxTeamSize: 4,
      requireAtLeastOneGithub: true,
      minGithubContributionsOverall: 75,
      requireAtLeastOneResumeOrPortfolio: false,
      minTotalSkillsCount: 3,
    },
    aggregationStrategy: 'MAX_SKILL',
    missingDataPolicy: 'PENALTY_10',
    tieBreakers: {
      order: ['githubContributions', 'diversity', 'completeness', 'earliestSubmission'],
    },
    anonymizeMode: false,
    formulaCoefficients: {
      ...DEFAULT_FORMULA_COEFFICIENTS,
      githubContribMaxPoints: 70,
      githubContribDivisor: 300,
      githubStarsMaxPoints: 25,
    },
  },

  beginnerFriendly: {
    presetName: 'Beginner Friendly & High Potential',
    shortlistCount: 30,
    weights: {
      technicalDepth: 20,
      projectExperience: 20,
      skillComplementarity: 35,
      dataCompleteness: 25,
    },
    filters: {
      minTeamSize: 1,
      maxTeamSize: 5,
      requireAtLeastOneGithub: false,
      minGithubContributionsOverall: 0,
      requireAtLeastOneResumeOrPortfolio: false,
      minTotalSkillsCount: 1,
    },
    aggregationStrategy: 'BALANCED_MEAN',
    missingDataPolicy: 'NEUTRAL',
    tieBreakers: {
      order: ['completeness', 'diversity', 'earliestSubmission', 'githubContributions'],
    },
    anonymizeMode: false,
    formulaCoefficients: {
      ...DEFAULT_FORMULA_COEFFICIENTS,
      hackathonPointsPerWin: 15,
      skillPointsPerMatch: 6,
      verifiableLinksBonusPoints: 30,
    },
  },

  aiProduct: {
    presetName: 'AI / ML & Product Track',
    shortlistCount: 25,
    weights: {
      technicalDepth: 30,
      projectExperience: 40,
      skillComplementarity: 25,
      dataCompleteness: 5,
    },
    filters: {
      minTeamSize: 2,
      maxTeamSize: 4,
      requireAtLeastOneGithub: true,
      minGithubContributionsOverall: 30,
      requireAtLeastOneResumeOrPortfolio: true,
      minTotalSkillsCount: 3,
    },
    aggregationStrategy: 'DIMINISHING_RETURNS',
    missingDataPolicy: 'PENALTY_10',
    tieBreakers: {
      order: ['diversity', 'githubContributions', 'earliestSubmission', 'completeness'],
    },
    anonymizeMode: false,
    formulaCoefficients: {
      ...DEFAULT_FORMULA_COEFFICIENTS,
      hackathonPointsPerWin: 30,
      skillPointsPerMatch: 5,
    },
  },
};

export const DEFAULT_CONFIG: SelectionConfig = PRESETS.balanced;
