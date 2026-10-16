import { MemberProfile, TeamRecord } from '@/types';

export interface AntiCheatReport {
  teamId: string;
  flags: string[];
}

export function runGlobalAntiCheatAudit(teams: TeamRecord[]): Map<string, string[]> {
  const flagsMap = new Map<string, string[]>();
  
  // Track occurrences of identifiers across teams
  const githubUsage = new Map<string, string[]>(); // githubHandle -> array of teamIds
  const emailUsage = new Map<string, string[]>();  // email -> array of teamIds

  for (const team of teams) {
    flagsMap.set(team.id, []);

    for (const member of team.members) {
      // Check GitHub duplicates
      if (member.rawSignals.githubUsername) {
        const gh = member.rawSignals.githubUsername.toLowerCase();
        const existing = githubUsage.get(gh) || [];
        existing.push(team.id);
        githubUsage.set(gh, existing);
      }

      // Check Email duplicates
      if (member.email) {
        const em = member.email.toLowerCase().trim();
        const existing = emailUsage.get(em) || [];
        existing.push(team.id);
        emailUsage.set(em, existing);
      }

      // Check Suspicious Individual GitHub flag
      if (member.rawSignals.githubMetrics?.isSuspicious) {
        const teamFlags = flagsMap.get(team.id) || [];
        teamFlags.push(
          `Member ${member.name || 'Member'}: ${member.rawSignals.githubMetrics.suspiciousReason || 'Suspicious GitHub profile'}`
        );
        flagsMap.set(team.id, teamFlags);
      }
    }
  }

  // Check cross-team duplicates
  for (const [gh, teamIds] of githubUsage.entries()) {
    if (teamIds.length > 1) {
      const uniqueTeams = Array.from(new Set(teamIds));
      if (uniqueTeams.length > 1) {
        for (const tId of uniqueTeams) {
          const list = flagsMap.get(tId) || [];
          list.push(`Cross-submission: GitHub account @${gh} appears in ${uniqueTeams.length} different teams`);
          flagsMap.set(tId, list);
        }
      }
    }
  }

  for (const [email, teamIds] of emailUsage.entries()) {
    if (teamIds.length > 1) {
      const uniqueTeams = Array.from(new Set(teamIds));
      if (uniqueTeams.length > 1) {
        for (const tId of uniqueTeams) {
          const list = flagsMap.get(tId) || [];
          list.push(`Cross-submission: Email '${email}' appears in ${uniqueTeams.length} different teams`);
          flagsMap.set(tId, list);
        }
      }
    }
  }

  return flagsMap;
}
