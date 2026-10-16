import { SelectionConfig, TeamRecord } from '@/types';
import Papa from 'papaparse';

export function exportShortlistToCSV(
  teams: TeamRecord[],
  config: SelectionConfig,
  shortlistCount: number
): void {
  const rows = teams.map((team) => {
    const isShortlisted = team.computed.rank <= shortlistCount && team.computed.isEligible;
    const memberNames = team.members.map((m) => m.name).join(' | ');
    const memberGithubs = team.members.map((m) => m.rawSignals.githubUsername || 'N/A').join(' | ');
    const allSkills = Array.from(new Set(team.members.flatMap((m) => m.rawSignals.skills))).join(', ');

    return {
      Rank: team.computed.rank,
      'Team Name': team.teamName,
      'Selection Status': team.computed.manualStatus === 'pinned'
        ? 'PINNED (Shortlisted)'
        : team.computed.manualStatus === 'excluded'
        ? 'EXCLUDED'
        : isShortlisted
        ? 'SHORTLISTED'
        : !team.computed.isEligible
        ? 'DISQUALIFIED'
        : 'WAITLIST',
      'Final Score': team.computed.finalScore,
      'Technical Depth (35%)': team.computed.technicalDepthScore,
      'Project Experience (30%)': team.computed.projectExperienceScore,
      'Skill Complementarity (25%)': team.computed.skillComplementarityScore,
      'Data Completeness (10%)': team.computed.dataCompletenessScore,
      'Team Size': team.members.length,
      'Members': memberNames,
      'GitHub Handles': memberGithubs,
      'Identified Skills': allSkills,
      'Covered Roles': team.computed.coveredRoles.join(', ') || 'General',
      'Eligibility Reason': team.computed.isEligible
        ? 'Passed all hard filters'
        : team.computed.failedFilters.map((f) => f.reason).join('; '),
      'Missing Data Warnings': team.computed.missingDataWarnings.join('; ') || 'None',
      'Anti-Cheat Flags': team.computed.antiCheatFlags.join('; ') || 'None',
    };
  });

  const csv = Papa.unparse(rows);
  triggerDownload(
    `shortlist_${config.presetName.toLowerCase().replace(/\s+/g, '_')}_top_${shortlistCount}.csv`,
    csv,
    'text/csv;charset=utf-8;'
  );
}

export function exportShortlistWithConfigJSON(
  teams: TeamRecord[],
  config: SelectionConfig,
  shortlistCount: number
): void {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    tool: 'Incursions Hackathon Recruitment Automation Tool',
    version: '1.0.0',
    totalTeamsEvaluated: teams.length,
    shortlistCutoffX: shortlistCount,
    configurationUsed: config,
    shortlist: teams
      .filter((t) => t.computed.rank <= shortlistCount && t.computed.isEligible)
      .map((t) => ({
        rank: t.computed.rank,
        teamName: t.teamName,
        finalScore: t.computed.finalScore,
        membersCount: t.members.length,
        scoreBreakdown: {
          technicalDepth: t.computed.technicalDepthScore,
          projectExperience: t.computed.projectExperienceScore,
          skillComplementarity: t.computed.skillComplementarityScore,
          dataCompleteness: t.computed.dataCompletenessScore,
        },
        members: t.members.map((m) => ({
          name: m.name,
          email: m.email,
          github: m.rawSignals.githubUsername,
          skills: m.rawSignals.skills,
        })),
        rationale: `Ranked #${t.computed.rank} with score ${t.computed.finalScore}. Covers roles: [${t.computed.coveredRoles.join(', ')}].`,
      })),
    disqualifiedOrExcluded: teams
      .filter((t) => !t.computed.isEligible || t.computed.manualStatus === 'excluded')
      .map((t) => ({
        teamName: t.teamName,
        reason: t.computed.failedFilters.map((f) => f.reason).join('; ') || 'Manually excluded',
      })),
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  triggerDownload(
    `shortlist_audit_bundle_${config.presetName.toLowerCase().replace(/\s+/g, '_')}.json`,
    jsonString,
    'application/json;charset=utf-8;'
  );
}

export function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
