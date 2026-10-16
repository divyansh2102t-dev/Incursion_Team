import { RoleCategory, SelectionConfig, TeamComputedMetrics, TeamRecord } from '@/types';
import { runGlobalAntiCheatAudit } from './antiCheat';
import { evaluateHardFilters } from './filters';
import { aggregateTeamSignals } from './normalization';
import { DEFAULT_FORMULA_COEFFICIENTS } from '@/presets/defaultPresets';

export function runFullShortlistingEngine(
  teams: TeamRecord[],
  config: SelectionConfig
): TeamRecord[] {
  // Step 1: Run Anti-Cheat Cross-Team Audit
  const antiCheatMap = runGlobalAntiCheatAudit(teams);
  const coef = config.formulaCoefficients || DEFAULT_FORMULA_COEFFICIENTS;

  // Step 2: Compute individual metrics per team
  const computedTeams: TeamRecord[] = teams.map((team) => {
    const aggregated = aggregateTeamSignals(team.members, config.aggregationStrategy, coef);
    const filterAudit = evaluateHardFilters(team.members, aggregated, config.filters);
    const antiCheatFlags = antiCheatMap.get(team.id) || [];

    // --- Dimension 1: Technical Depth (0 - 100) ---
    const contribNorm = Math.min(
      coef.githubContribMaxPoints,
      (aggregated.avgGithubContributions / (coef.githubContribDivisor || 1)) * coef.githubContribMaxPoints
    );
    const starsNorm = Math.min(
      coef.githubStarsMaxPoints,
      (aggregated.totalGithubStars / (coef.githubStarsDivisor || 1)) * coef.githubStarsMaxPoints
    );
    const skillsCountNorm = Math.min(
      coef.githubSkillBreadthMaxPoints,
      (aggregated.totalUniqueSkills.length / (coef.githubSkillDivisor || 1)) * coef.githubSkillBreadthMaxPoints
    );
    let rawTechnicalScore = Math.round(contribNorm + starsNorm + skillsCountNorm);

    // Apply anti-cheat penalty if forked/suspicious
    if (antiCheatFlags.some((f) => f.includes('Suspicious') || f.includes('forked'))) {
      rawTechnicalScore = Math.round(rawTechnicalScore * coef.suspiciousAccountDiscount);
    }

    // --- Dimension 2: Project Experience & Achievements (0 - 100) ---
    const hackathonScore = Math.min(
      coef.hackathonMaxPoints,
      aggregated.totalHackathonCount * coef.hackathonPointsPerWin
    );
    const skillsScore = Math.min(
      coef.skillMaxPoints,
      aggregated.totalUniqueSkills.length * coef.skillPointsPerMatch
    );
    const hasProofBonus =
      aggregated.totalGithubStars > 0 || team.members.some((m) => m.rawSignals.hasPortfolio);
    const proofBonus = hasProofBonus ? coef.verifiableLinksBonusPoints : 0;
    const rawExperienceScore = Math.min(100, Math.round(hackathonScore + skillsScore + proofBonus));

    // --- Dimension 3: Skill Complementarity & Diversity (0 - 100) ---
    // Full coverage across 4 key roles (frontend, backend, ai_ml, design) yields 100
    const coveredRolesList: RoleCategory[] = [];
    const missingRolesList: RoleCategory[] = [];
    const coreRoles: RoleCategory[] = ['frontend', 'backend', 'ai_ml', 'design'];

    for (const role of coreRoles) {
      if (aggregated.roleCoverage[role] >= 0.18) {
        coveredRolesList.push(role);
      } else {
        missingRolesList.push(role);
      }
    }
    const rawComplementarityScore = Math.min(100, Math.round((coveredRolesList.length / coreRoles.length) * 100));

    // --- Dimension 4: Data Completeness (0 - 100) ---
    const rawCompletenessScore = Math.round(aggregated.completenessAverage * 100);

    // Missing Data Warnings
    const missingDataWarnings: string[] = [];
    team.members.forEach((m, idx) => {
      const missingParts: string[] = [];
      if (!m.githubUrl && !m.rawSignals.githubUsername) missingParts.push('GitHub');
      if (!m.resumeUrl && !m.rawSignals.hasResume) missingParts.push('Resume');
      if (!m.linkedinUrl) missingParts.push('LinkedIn');
      if (!m.portfolioUrl) missingParts.push('Portfolio');

      if (missingParts.length > 0) {
        missingDataWarnings.push(
          `Member ${idx + 1} (${m.name || 'Unnamed'}): Missing ${missingParts.join(', ')}`
        );
      }
    });

    // Apply Missing Data Policy
    let policyMultiplier = 1.0;
    if (config.missingDataPolicy === 'PENALTY_10' && rawCompletenessScore < 70) {
      policyMultiplier = 0.9;
    } else if (config.missingDataPolicy === 'PENALTY_25' && rawCompletenessScore < 70) {
      policyMultiplier = 0.75;
    }

    // Calculate total weighted score
    const totalWeights =
      config.weights.technicalDepth +
      config.weights.projectExperience +
      config.weights.skillComplementarity +
      config.weights.dataCompleteness;

    const safeTotalWeights = totalWeights > 0 ? totalWeights : 100;

    const weightedScoreRaw =
      (rawTechnicalScore * config.weights.technicalDepth +
        rawExperienceScore * config.weights.projectExperience +
        rawComplementarityScore * config.weights.skillComplementarity +
        rawCompletenessScore * config.weights.dataCompleteness) /
      safeTotalWeights;

    const finalScore = Number((weightedScoreRaw * policyMultiplier).toFixed(2));

    const computedMetrics: TeamComputedMetrics = {
      isEligible: filterAudit.isEligible,
      passedFilters: filterAudit.passedFilters,
      failedFilters: filterAudit.failedFilters,
      technicalDepthScore: rawTechnicalScore,
      projectExperienceScore: rawExperienceScore,
      skillComplementarityScore: rawComplementarityScore,
      dataCompletenessScore: rawCompletenessScore,
      finalScore,
      rank: 0, // Assigned in step 3
      coveredRoles: coveredRolesList,
      missingRoles: missingRolesList,
      missingDataWarnings,
      antiCheatFlags,
      manualStatus: team.computed?.manualStatus || 'normal',
      manualNote: team.computed?.manualNote,
    };

    return {
      ...team,
      computed: computedMetrics,
    };
  });

  // Step 3: Sort & Rank Teams (Handling manual overrides, eligibility, score & tiebreakers)
  computedTeams.sort((a, b) => {
    // 1. Manual status: 'pinned' always on top, 'excluded' always at the bottom
    const statusScore = (t: TeamRecord) => {
      if (t.computed.manualStatus === 'pinned') return 3;
      if (t.computed.manualStatus === 'excluded') return -2;
      if (!t.computed.isEligible) return -1;
      return 1;
    };
    const statusA = statusScore(a);
    const statusB = statusScore(b);
    if (statusA !== statusB) return statusB - statusA;

    // 2. Final weighted score comparison
    const scoreDiff = b.computed.finalScore - a.computed.finalScore;
    if (Math.abs(scoreDiff) > 0.001) {
      return scoreDiff;
    }

    // 3. Deterministic Tie-Breakers
    for (const tieBreaker of config.tieBreakers.order) {
      if (tieBreaker === 'diversity') {
        const diff = b.computed.skillComplementarityScore - a.computed.skillComplementarityScore;
        if (diff !== 0) return diff;
      } else if (tieBreaker === 'githubContributions') {
        const diff = b.computed.technicalDepthScore - a.computed.technicalDepthScore;
        if (diff !== 0) return diff;
      } else if (tieBreaker === 'completeness') {
        const diff = b.computed.dataCompletenessScore - a.computed.dataCompletenessScore;
        if (diff !== 0) return diff;
      } else if (tieBreaker === 'earliestSubmission') {
        const timeA = new Date(a.submissionTimestamp || 0).getTime();
        const timeB = new Date(b.submissionTimestamp || 0).getTime();
        if (timeA !== timeB) return timeA - timeB;
      }
    }

    return a.teamName.localeCompare(b.teamName);
  });

  // Assign 1-indexed ranks
  return computedTeams.map((team, index) => ({
    ...team,
    computed: {
      ...team.computed,
      rank: index + 1,
    },
  }));
}
