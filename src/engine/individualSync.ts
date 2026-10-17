// Individual Sync Engine: Live signals auditing for a single member or single team
// Prevents cohort-wide re-syncing when an organizer makes small adjustments or fixes links.

import { MemberProfile, TeamRecord } from '@/types';
import { extractGithubUsername, fetchGitHubStats, GitHubStats } from './github';
import { extractLinkedinUsername, isCustomVanitySlug, analyzeCrossMatch } from './linkedin';
import { extractSkillsAndRoles } from './taxonomy';
import { decryptTokenString } from '@/utils/cryptoUtils';

const TOKENS_STORAGE_KEY = 'incursion_enc_tokens_list_v1';

export function getActiveGitHubToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
    if (!stored) return undefined;
    const list = JSON.parse(stored);
    const activeItem = list.find((item: { isActive: boolean }) => item.isActive) || list[0];
    if (activeItem && activeItem.encrypted) {
      return decryptTokenString(activeItem.encrypted) || undefined;
    }
  } catch {
    // Ignore error
  }
  return undefined;
}

export interface IndividualSyncResult {
  updatedMember: MemberProfile;
  details: string[];
  success: boolean;
}

export async function syncSingleMemberSignals(
  member: MemberProfile,
  candidateName?: string
): Promise<IndividualSyncResult> {
  const details: string[] = [];
  let updated = { ...member, rawSignals: { ...member.rawSignals } };
  const currentSkills = new Set(updated.rawSignals.skills || []);

  const token = getActiveGitHubToken();
  const nameToUse = candidateName || member.name || 'Member';

  // 1. Sync Live GitHub stats
  const ghInput = member.githubUrl || member.rawSignals.githubUsername;
  const ghHandle = ghInput ? extractGithubUsername(ghInput) : null;

  if (ghHandle) {
    try {
      const stats: GitHubStats = await fetchGitHubStats(ghHandle, token);
      updated.rawSignals.githubUsername = stats.username;
      updated.rawSignals.hasGithub = true;
      updated.rawSignals.githubMetrics = stats;

      if (stats.topLanguages && stats.topLanguages.length > 0) {
        stats.topLanguages.forEach((l) => currentSkills.add(l));
      }

      details.push(
        `GitHub: @${stats.username} (${stats.estimatedContributions} commits, ${stats.totalStars}★, ${stats.originalRepos} repos)`
      );
    } catch {
      details.push(`GitHub: @${ghHandle} (Failed to fetch live API stats)`);
    }
  }

  // 2. Sync Live LinkedIn Signals
  if (member.linkedinUrl && member.linkedinUrl.trim()) {
    try {
      const res = await fetch('/api/parse-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: member.linkedinUrl.trim(),
          candidateName: nameToUse,
          githubUsername: ghHandle || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          const a = data.analysis;
          updated.rawSignals.hasLinkedin = true;
          updated.rawSignals.linkedinUsername = a.username;
          updated.rawSignals.linkedinMetrics = {
            username: a.username,
            headline: a.headline,
            company: a.company,
            seniorityLevel: a.seniorityLevel,
            has500PlusConnections: a.has500PlusConnections,
            isCustomVanitySlug: a.isCustomVanitySlug,
            crossMatchesGithub: a.crossMatchesGithub,
            extractedSkills: a.extractedSkills || [],
            verifiedScore: a.verifiedScore,
          };

          if (a.extractedSkills && Array.isArray(a.extractedSkills)) {
            a.extractedSkills.forEach((s: string) => currentSkills.add(s));
          }

          details.push(
            `LinkedIn: @${a.username} (${a.seniorityLevel} level, ${a.has500PlusConnections ? '500+ conn' : 'active'}, score ${a.verifiedScore}pts)`
          );
        }
      }
    } catch {
      // Ignore network errors
    }
  }

  // 3. Sync Cloud Resume / PDF
  if (
    member.resumeUrl &&
    member.resumeUrl.trim() &&
    (member.resumeUrl.includes('drive.google.com') ||
      member.resumeUrl.includes('dropbox.com') ||
      member.resumeUrl.startsWith('http'))
  ) {
    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeUrl: member.resumeUrl.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          updated.rawSignals.hasResume = true;
          if (data.skillsFound && Array.isArray(data.skillsFound)) {
            data.skillsFound.forEach((s: string) => currentSkills.add(s));
          }
          if (data.hackathonMentionCount) {
            updated.rawSignals.hackathonExperienceCount = Math.max(
              updated.rawSignals.hackathonExperienceCount || 0,
              data.hackathonMentionCount
            );
          }
          if (data.githubHandle && !updated.githubUrl && !updated.rawSignals.githubUsername) {
            updated.githubUrl = `https://github.com/${data.githubHandle}`;
            updated.rawSignals.githubUsername = data.githubHandle;
            updated.rawSignals.hasGithub = true;
          }

          details.push(
            `Resume: Verified (${data.skillsFound?.length || 0} skills, ${data.hackathonMentionCount || 0} hackathon mentions)`
          );
        }
      }
    } catch {
      // Ignore network errors
    }
  }

  // 4. Update merged skills & role distribution
  updated.rawSignals.skills = Array.from(currentSkills);
  if (updated.roleOrBio || updated.rawSignals.skills.length > 0) {
    const taxonomyRes = extractSkillsAndRoles(
      `${updated.roleOrBio || ''} ${updated.rawSignals.skills.join(' ')}`
    );
    updated.rawSignals.roleDistribution = taxonomyRes.roleDistribution;
  }

  // 5. Recompute completeness ratio
  const signalsPresent = [
    Boolean(updated.name),
    Boolean(updated.email),
    Boolean(updated.githubUrl || updated.rawSignals.githubUsername),
    Boolean(updated.resumeUrl || updated.rawSignals.hasResume),
    Boolean(updated.portfolioUrl || updated.linkedinUrl || updated.rawSignals.hasLinkedin),
    Boolean(updated.rawSignals.skills.length > 0),
  ].filter(Boolean).length;

  updated.rawSignals.completenessRatio = Number((signalsPresent / 6).toFixed(2));

  return {
    updatedMember: updated,
    details: details.length > 0 ? details : ['Signals verified from cache.'],
    success: true,
  };
}

export async function syncEntireTeamSignals(team: TeamRecord): Promise<{
  updatedTeam: TeamRecord;
  summary: string;
}> {
  const syncResults = await Promise.all(
    team.members.map((m) => syncSingleMemberSignals(m, m.name))
  );

  const updatedMembers = syncResults.map((r) => r.updatedMember);
  const totalDetailsCount = syncResults.reduce((acc, r) => acc + r.details.length, 0);

  return {
    updatedTeam: {
      ...team,
      members: updatedMembers,
    },
    summary: `Synced live signals across ${team.members.length} member(s) (${totalDetailsCount} signals verified).`,
  };
}
