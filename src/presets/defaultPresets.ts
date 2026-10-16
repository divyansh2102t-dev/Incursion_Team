import { SelectionConfig } from '@/types';

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
  },
};

export const DEFAULT_CONFIG: SelectionConfig = PRESETS.balanced;
