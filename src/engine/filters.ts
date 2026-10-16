import { HardFilterConfig, HardFilterResult, MemberProfile } from '@/types';
import { AggregatedSignals } from './normalization';

export function evaluateHardFilters(
  members: MemberProfile[],
  aggregated: AggregatedSignals,
  filters: HardFilterConfig
): {
  isEligible: boolean;
  passedFilters: HardFilterResult[];
  failedFilters: HardFilterResult[];
} {
  const passedFilters: HardFilterResult[] = [];
  const failedFilters: HardFilterResult[] = [];

  // 1. Team Size Filter
  const size = members.length;
  if (size < filters.minTeamSize || size > filters.maxTeamSize) {
    failedFilters.push({
      filterName: 'Team Size Restriction',
      passed: false,
      reason: `Team has ${size} member(s), but allowed range is ${filters.minTeamSize} to ${filters.maxTeamSize}.`,
    });
  } else {
    passedFilters.push({
      filterName: 'Team Size Restriction',
      passed: true,
      reason: `Team size (${size}) satisfies allowed range (${filters.minTeamSize} to ${filters.maxTeamSize}).`,
    });
  }

  // 2. Mandatory GitHub Profile (At least 1 member vs All participants)
  const ghReq = filters.githubRequirement || (filters.requireAtLeastOneGithub ? 'AT_LEAST_ONE' : 'NONE');
  if (ghReq === 'ALL_MEMBERS') {
    const missingMembers = members.filter(
      (m) => !Boolean(m.githubUrl || m.rawSignals.githubUsername)
    );
    if (missingMembers.length > 0) {
      failedFilters.push({
        filterName: 'Mandatory GitHub Profile (All Members)',
        passed: false,
        reason: `${missingMembers.length} member(s) (${missingMembers.map((m) => m.name || 'Member').join(', ')}) lack a verifiable GitHub profile link. All participants must provide GitHub.`,
      });
    } else {
      passedFilters.push({
        filterName: 'Mandatory GitHub Profile (All Members)',
        passed: true,
        reason: `All ${members.length} team participant(s) provided a verified GitHub profile.`,
      });
    }
  } else if (ghReq === 'AT_LEAST_ONE') {
    const hasAnyGithub = members.some(
      (m) => Boolean(m.githubUrl || m.rawSignals.githubUsername)
    );
    if (!hasAnyGithub) {
      failedFilters.push({
        filterName: 'Mandatory GitHub Profile (≥1 Member)',
        passed: false,
        reason: 'No team member submitted a verifiable GitHub profile link.',
      });
    } else {
      passedFilters.push({
        filterName: 'Mandatory GitHub Profile (≥1 Member)',
        passed: true,
        reason: 'At least one member provided a GitHub profile.',
      });
    }
  }

  // 3. Minimum GitHub contributions threshold
  if (filters.minGithubContributionsOverall > 0) {
    if (aggregated.maxGithubContributions < filters.minGithubContributionsOverall) {
      failedFilters.push({
        filterName: 'Minimum GitHub Contributions',
        passed: false,
        reason: `Highest member GitHub contributions estimate is ${aggregated.maxGithubContributions}, which is below required ${filters.minGithubContributionsOverall}.`,
      });
    } else {
      passedFilters.push({
        filterName: 'Minimum GitHub Contributions',
        passed: true,
        reason: `Top contributor has ${aggregated.maxGithubContributions} contributions (meets required ${filters.minGithubContributionsOverall}).`,
      });
    }
  }

  // 4. Require at least one Resume or Portfolio
  if (filters.requireAtLeastOneResumeOrPortfolio) {
    const hasResumeOrPort = members.some(
      (m) => Boolean(m.resumeUrl || m.portfolioUrl || m.rawSignals.hasResume || m.rawSignals.hasPortfolio)
    );
    if (!hasResumeOrPort) {
      failedFilters.push({
        filterName: 'Resume or Portfolio Requirement',
        passed: false,
        reason: 'No member submitted a resume or project portfolio link.',
      });
    } else {
      passedFilters.push({
        filterName: 'Resume or Portfolio Requirement',
        passed: true,
        reason: 'Team provided verified resume or portfolio link(s).',
      });
    }
  }

  // 5. Minimum distinct skills
  if (filters.minTotalSkillsCount > 0) {
    const count = aggregated.totalUniqueSkills.length;
    if (count < filters.minTotalSkillsCount) {
      failedFilters.push({
        filterName: 'Skill Breadth Minimum',
        passed: false,
        reason: `Team possesses ${count} identified skills, but threshold requires at least ${filters.minTotalSkillsCount}.`,
      });
    } else {
      passedFilters.push({
        filterName: 'Skill Breadth Minimum',
        passed: true,
        reason: `Team demonstrated ${count} distinct technical skills (meets threshold of ${filters.minTotalSkillsCount}).`,
      });
    }
  }

  return {
    isEligible: failedFilters.length === 0,
    passedFilters,
    failedFilters,
  };
}
