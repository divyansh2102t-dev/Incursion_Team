import { AggregationStrategy, FormulaCoefficients, MemberProfile, RoleCategory } from '@/types';

export interface AggregatedSignals {
  avgGithubContributions: number;
  maxGithubContributions: number;
  totalGithubStars: number;
  totalUniqueSkills: string[];
  roleCoverage: Record<RoleCategory, number>; // 0 to 1 coverage
  coveredRoleCount: number;
  completenessAverage: number;
  totalHackathonCount: number;
  explanation: string;
}

/**
 * Combines individual member signals into team-level metrics based on the chosen aggregation strategy.
 */
export function aggregateTeamSignals(
  members: MemberProfile[],
  strategy: AggregationStrategy,
  coefficients?: FormulaCoefficients
): AggregatedSignals {
  if (members.length === 0) {
    return {
      avgGithubContributions: 0,
      maxGithubContributions: 0,
      totalGithubStars: 0,
      totalUniqueSkills: [],
      roleCoverage: { frontend: 0, backend: 0, ai_ml: 0, mobile: 0, design: 0, devops: 0, general: 0 },
      coveredRoleCount: 0,
      completenessAverage: 0,
      totalHackathonCount: 0,
      explanation: 'Empty team.',
    };
  }

  const allSkills = new Set<string>();
  const contributionsList: number[] = [];
  const starsList: number[] = [];
  const completenessList: number[] = [];
  let totalHackathons = 0;

  const roleMax: Record<RoleCategory, number> = {
    frontend: 0,
    backend: 0,
    ai_ml: 0,
    mobile: 0,
    design: 0,
    devops: 0,
    general: 0,
  };

  for (const m of members) {
    // Skills
    m.rawSignals.skills.forEach((s) => allSkills.add(s));

    // GitHub
    const contribs = m.rawSignals.githubMetrics?.estimatedContributions || 0;
    const stars = m.rawSignals.githubMetrics?.totalStars || 0;
    contributionsList.push(contribs);
    starsList.push(stars);

    // Completeness
    completenessList.push(m.rawSignals.completenessRatio);

    // Hackathon history
    totalHackathons += m.rawSignals.hackathonExperienceCount || 0;

    // Roles
    for (const [r, val] of Object.entries(m.rawSignals.roleDistribution) as [RoleCategory, number][]) {
      roleMax[r] = Math.max(roleMax[r], val);
    }
  }

  contributionsList.sort((a, b) => b - a);
  starsList.sort((a, b) => b - a);

  const maxContrib = contributionsList[0] || 0;
  const avgContrib = Math.round(contributionsList.reduce((a, b) => a + b, 0) / members.length);
  const totalStars = starsList.reduce((a, b) => a + b, 0);
  const avgCompleteness = Number(
    (completenessList.reduce((a, b) => a + b, 0) / members.length).toFixed(2)
  );

  // Compute effective contributions according to strategy & dynamic formula coefficients
  const dimBase = coefficients?.diminishingReturnsBase ?? 1.5;
  const meanBonus = coefficients?.balancedMeanBonusPerMember ?? 0.08;
  const meanCap = coefficients?.balancedMeanMaxCap ?? 1.40;

  let effectiveContrib: number;
  let explanation = '';

  if (strategy === 'MAX_SKILL') {
    effectiveContrib = maxContrib;
    explanation = `Max-Skill Normalization: Evaluation driven by strongest member's contribution (${maxContrib} contribs). Solo and smaller teams compete on equal footing with top talent.`;
  } else if (strategy === 'DIMINISHING_RETURNS') {
    // Dynamic diminishing returns base
    let sum = 0;
    contributionsList.forEach((val, idx) => {
      sum += val / Math.pow(dimBase, idx);
    });
    effectiveContrib = Math.round(sum);
    explanation = `Diminishing Returns Normalization: Base ${dimBase.toFixed(1)} dampening per member. Balances group synergy without overwhelming solo prodigies.`;
  } else {
    // BALANCED_MEAN (dynamic synergy boost and cap)
    const synergyMultiplier = Math.min(meanCap, 1 + (members.length - 1) * meanBonus);
    effectiveContrib = Math.round(avgContrib * synergyMultiplier);
    explanation = `Balanced Mean Normalization: Average member contribution with capped synergy boost (+${Math.round((synergyMultiplier - 1) * 100)}%).`;
  }

  // Count distinct covered core roles (frontend, backend, ai_ml, design, devops, mobile)
  const coveredRoles = Object.entries(roleMax).filter(
    ([role, val]) => role !== 'general' && val >= 0.2
  );

  return {
    avgGithubContributions: effectiveContrib,
    maxGithubContributions: maxContrib,
    totalGithubStars: totalStars,
    totalUniqueSkills: Array.from(allSkills),
    roleCoverage: roleMax,
    coveredRoleCount: coveredRoles.length,
    completenessAverage: avgCompleteness,
    totalHackathonCount: totalHackathons,
    explanation,
  };
}
