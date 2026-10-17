import { RoleCategory, SelectionConfig, TeamComputedMetrics, TeamRecord } from '@/types';
import { runGlobalAntiCheatAudit } from './antiCheat';
import { evaluateHardFilters } from './filters';
import { aggregateTeamSignals } from './normalization';
import { DEFAULT_FORMULA_COEFFICIENTS } from '@/presets/defaultPresets';
import { evaluateCustomFormula, MathScope } from '@/utils/mathEvaluator';
import { computeMemberLinkedinScore } from './linkedin';
import { evaluateTeamExperienceAndKeywords } from './experienceParser';

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

    // Evaluate Work Experiences, Tier-1 Companies, Research Internships, Clubs, and Custom Keywords
    const expEval = evaluateTeamExperienceAndKeywords(
      team.members,
      config.workExperienceConfig,
      config.customKeywords || []
    );

    const antiCheatFlags = [
      ...(antiCheatMap.get(team.id) || []),
      ...expEval.spamWarnings,
    ];

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
    const rawExperienceScore = Math.min(
      100,
      Math.round(
        hackathonScore +
          skillsScore +
          proofBonus +
          expEval.experienceScore +
          expEval.keywordScore
      )
    );

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

    // --- LinkedIn Profile Score (0 - 100) ---
    const memberLinkedinScores = team.members.map((m) =>
      computeMemberLinkedinScore(m.rawSignals, coef)
    );
    const rawLinkedinScore =
      team.members.length > 0
        ? Math.round(
            memberLinkedinScores.reduce((a, b) => a + b, 0) / team.members.length
          )
        : 0;

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

    // Calculate total weighted score respecting weightsEnabled toggles
    const techWeight = config.weightsEnabled?.technicalDepth !== false ? config.weights.technicalDepth : 0;
    const expWeight = config.weightsEnabled?.projectExperience !== false ? config.weights.projectExperience : 0;
    const compWeight = config.weightsEnabled?.skillComplementarity !== false ? config.weights.skillComplementarity : 0;
    const completenessWeight = config.weightsEnabled?.dataCompleteness !== false ? config.weights.dataCompleteness : 0;

    const totalWeights = techWeight + expWeight + compWeight + completenessWeight;
    const safeTotalWeights = totalWeights > 0 ? totalWeights : 100;

    const weightedScoreRaw =
      (rawTechnicalScore * techWeight +
        rawExperienceScore * expWeight +
        rawComplementarityScore * compWeight +
        rawCompletenessScore * completenessWeight) /
      safeTotalWeights;

    const standardScore = Number((weightedScoreRaw * policyMultiplier).toFixed(2));
    let finalScore = standardScore;
    let customScoreApplied = false;

    // Check if Custom Scoring Formula is enabled & populated
    if (config.customFormulaEnabled && config.customFormulaExpression?.trim()) {
      const scope: MathScope = {
        tech: rawTechnicalScore,
        exp: rawExperienceScore,
        synergy: rawComplementarityScore,
        roles: rawComplementarityScore,
        completeness: rawCompletenessScore,
        linkedin: rawLinkedinScore,
        linkedin_score: rawLinkedinScore,
        linkedin_seniority: team.members.some(
          (m) =>
            m.rawSignals.linkedinMetrics?.seniorityLevel === 'founder' ||
            m.rawSignals.linkedinMetrics?.seniorityLevel === 'senior'
        )
          ? coef.linkedinSeniorityMaxPoints
          : 0,
        linkedin_connections: team.members.some(
          (m) => m.rawSignals.linkedinMetrics?.has500PlusConnections
        )
          ? 1
          : 0,
        linkedin_verified:
          team.members.filter((m) => m.rawSignals.hasLinkedin).length /
          Math.max(1, team.members.length),
        commits: aggregated.maxGithubContributions || aggregated.avgGithubContributions || 0,
        stars: aggregated.totalGithubStars || 0,
        wins: aggregated.totalHackathonCount || 0,
        hackathon_wins: aggregated.totalHackathonCount || 0,
        work_exp: expEval.experienceScore,
        research_intern: expEval.researchCount,
        tier1_company: expEval.tier1Count,
        clubs: expEval.clubsCount,
        keywords: expEval.keywordScore,
        matched_keywords_count: expEval.allMatchedKeywords.length,
        team_size: team.members.length,
        size: team.members.length,
        skills: aggregated.totalUniqueSkills.length,
        skills_count: aggregated.totalUniqueSkills.length,
      };

      const customEvaluated = evaluateCustomFormula(
        config.customFormulaExpression,
        scope,
        standardScore
      );
      finalScore = customEvaluated;
      customScoreApplied = true;
    }

    // --- Check for Organizer Manual Overrides ---
    const overrides = team.manualOverrides;
    const hasOverrides = Boolean(
      overrides &&
        (overrides.isEligibleOverride !== undefined ||
          overrides.technicalDepthScore !== undefined ||
          overrides.projectExperienceScore !== undefined ||
          overrides.skillComplementarityScore !== undefined ||
          overrides.dataCompletenessScore !== undefined ||
          overrides.finalScore !== undefined ||
          overrides.antiCheatDismissed ||
          (overrides.gateOverrides && Object.keys(overrides.gateOverrides).length > 0))
    );

    // Hard Gate Overrides
    const effectivePassedFilters = [...filterAudit.passedFilters];
    const effectiveFailedFilters = [...filterAudit.failedFilters];

    if (overrides?.gateOverrides) {
      Object.entries(overrides.gateOverrides).forEach(([gateName, shouldPass]) => {
        if (shouldPass) {
          const failedIdx = effectiveFailedFilters.findIndex((f) => f.filterName === gateName);
          if (failedIdx !== -1) {
            const removed = effectiveFailedFilters.splice(failedIdx, 1)[0];
            effectivePassedFilters.push({
              filterName: gateName,
              passed: true,
              reason: `Manually overridden to PASS by organizer (Originally failed: ${removed.reason})`,
            });
          }
        } else {
          const passedIdx = effectivePassedFilters.findIndex((f) => f.filterName === gateName);
          if (passedIdx !== -1) {
            effectivePassedFilters.splice(passedIdx, 1);
            effectiveFailedFilters.push({
              filterName: gateName,
              passed: false,
              reason: 'Manually overridden to FAIL by organizer.',
            });
          }
        }
      });
    }

    // Anti-cheat dismissal
    let effectiveAntiCheatFlags = [...antiCheatFlags];
    if (overrides?.antiCheatDismissed) {
      effectiveAntiCheatFlags = [];
    }

    // Dimension score overrides
    const effectiveTechnicalScore = overrides?.technicalDepthScore ?? rawTechnicalScore;
    const effectiveExperienceScore = overrides?.projectExperienceScore ?? rawExperienceScore;
    const effectiveComplementarityScore = overrides?.skillComplementarityScore ?? rawComplementarityScore;
    const effectiveCompletenessScore = overrides?.dataCompletenessScore ?? rawCompletenessScore;

    // Final score calculation with override support
    let effectiveFinalScore = finalScore;
    if (overrides?.finalScore !== undefined) {
      effectiveFinalScore = overrides.finalScore;
    } else if (
      overrides?.technicalDepthScore !== undefined ||
      overrides?.projectExperienceScore !== undefined ||
      overrides?.skillComplementarityScore !== undefined ||
      overrides?.dataCompletenessScore !== undefined
    ) {
      const reweighted =
        (effectiveTechnicalScore * techWeight +
          effectiveExperienceScore * expWeight +
          effectiveComplementarityScore * compWeight +
          effectiveCompletenessScore * completenessWeight) /
        safeTotalWeights;
      effectiveFinalScore = Number((reweighted * policyMultiplier).toFixed(2));
    }

    // Eligibility calculation with override support
    let effectiveIsEligible = effectiveFailedFilters.length === 0;
    if (overrides?.isEligibleOverride !== undefined) {
      effectiveIsEligible = overrides.isEligibleOverride;
    }

    const computedMetrics: TeamComputedMetrics = {
      isEligible: effectiveIsEligible,
      passedFilters: effectivePassedFilters,
      failedFilters: effectiveFailedFilters,
      technicalDepthScore: effectiveTechnicalScore,
      projectExperienceScore: effectiveExperienceScore,
      skillComplementarityScore: effectiveComplementarityScore,
      dataCompletenessScore: effectiveCompletenessScore,
      linkedinScore: rawLinkedinScore,
      finalScore: effectiveFinalScore,
      customScoreApplied,
      hasManualOverrides: hasOverrides,
      rank: 0, // Assigned in step 3
      coveredRoles: coveredRolesList,
      missingRoles: missingRolesList,
      missingDataWarnings,
      antiCheatFlags: effectiveAntiCheatFlags,
      manualStatus: team.computed?.manualStatus || 'normal',
      manualNote: overrides?.notes || team.computed?.manualNote,
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
