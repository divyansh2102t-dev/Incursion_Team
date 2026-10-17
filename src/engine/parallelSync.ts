import { TeamRecord, MemberProfile } from '@/types';
import { fetchGitHubStats } from './github';
import { parseCloudResumeUrl, ResumeParseResult } from './resumeParser';

export interface ParallelProgress {
  github: {
    current: number;
    total: number;
    activeUser?: string;
    completed: boolean;
  };
  resumes: {
    current: number;
    total: number;
    activeCandidate?: string;
    completed: boolean;
  };
  isFinished: boolean;
}

export interface ParallelSyncResult {
  updatedTeams: TeamRecord[];
  stats: {
    githubAudited: number;
    resumesParsed: number;
    resumesPrivate: number;
    skillsDiscovered: number;
  };
}

/**
 * Executes GitHub velocity auditing and Cloud Resume PDF parsing
 * concurrently in parallel streams without blocking each other.
 */
export async function runParallelDeepScan(
  teams: TeamRecord[],
  options?: {
    githubToken?: string;
    onProgress?: (progress: ParallelProgress) => void;
  }
): Promise<ParallelSyncResult> {
  const { githubToken, onProgress } = options || {};

  // 1. Gather distinct GitHub candidate usernames
  const githubUsernames = Array.from(
    new Set(
      teams.flatMap((t) =>
        t.members
          .map((m) => m.rawSignals.githubUsername)
          .filter((u): u is string => Boolean(u))
      )
    )
  );

  // 2. Gather distinct candidates with Cloud Resume links (Google Drive, Dropbox, direct URLs)
  interface ResumeTarget {
    memberId: string;
    candidateName: string;
    url: string;
  }

  const resumeTargets: ResumeTarget[] = [];
  teams.forEach((t) => {
    t.members.forEach((m) => {
      const url = m.resumeUrl?.trim();
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        resumeTargets.push({
          memberId: m.id,
          candidateName: m.name,
          url,
        });
      }
    });
  });

  const progress: ParallelProgress = {
    github: {
      current: 0,
      total: githubUsernames.length,
      completed: githubUsernames.length === 0,
    },
    resumes: {
      current: 0,
      total: resumeTargets.length,
      completed: resumeTargets.length === 0,
    },
    isFinished: false,
  };

  const notifyProgress = () => {
    if (onProgress) {
      onProgress({ ...progress });
    }
  };

  notifyProgress();

  // Storage for results
  const githubStatsMap = new Map<string, any>();
  const resumeResultsMap = new Map<string, ResumeParseResult>();

  // Stream 1: GitHub live fetch
  const runGitHubStream = async () => {
    if (githubUsernames.length === 0) {
      progress.github.completed = true;
      notifyProgress();
      return;
    }

    for (let i = 0; i < githubUsernames.length; i++) {
      const username = githubUsernames[i];
      progress.github.current = i + 1;
      progress.github.activeUser = username;
      notifyProgress();

      try {
        const stats = await fetchGitHubStats(username, githubToken);
        githubStatsMap.set(username.toLowerCase(), stats);
      } catch (err) {
        console.warn(`[ParallelSync] GitHub fetch error for ${username}:`, err);
      }
    }

    progress.github.completed = true;
    progress.github.activeUser = undefined;
    notifyProgress();
  };

  // Stream 2: Cloud Resume fetch (with concurrency limit of 3)
  const runResumeStream = async () => {
    if (resumeTargets.length === 0) {
      progress.resumes.completed = true;
      notifyProgress();
      return;
    }

    let processedCount = 0;
    const concurrency = 3;

    for (let i = 0; i < resumeTargets.length; i += concurrency) {
      const batch = resumeTargets.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (target) => {
          progress.resumes.activeCandidate = target.candidateName;
          try {
            const parsed = await parseCloudResumeUrl(target.url, target.candidateName);
            resumeResultsMap.set(target.memberId, parsed);
          } catch (err) {
            console.warn(`[ParallelSync] Resume parse error for ${target.candidateName}:`, err);
          } finally {
            processedCount++;
            progress.resumes.current = processedCount;
            notifyProgress();
          }
        })
      );
    }

    progress.resumes.completed = true;
    progress.resumes.activeCandidate = undefined;
    notifyProgress();
  };

  // Execute BOTH streams concurrently in parallel!
  await Promise.all([runGitHubStream(), runResumeStream()]);

  progress.isFinished = true;
  notifyProgress();

  // Merge results into teams
  let resumesParsed = 0;
  let resumesPrivate = 0;
  let skillsDiscovered = 0;

  const updatedTeams = teams.map((team) => {
    const updatedMembers: MemberProfile[] = team.members.map((member) => {
      let updatedSignals = { ...member.rawSignals };
      let updatedGithubUrl = member.githubUrl;

      // 1. Merge GitHub live stats
      const ghUser = member.rawSignals.githubUsername;
      if (ghUser && githubStatsMap.has(ghUser.toLowerCase())) {
        const liveGh = githubStatsMap.get(ghUser.toLowerCase());
        updatedSignals.githubMetrics = liveGh;
      }

      // 2. Merge Resume parsing results
      if (resumeResultsMap.has(member.id)) {
        const resResult = resumeResultsMap.get(member.id)!;
        if (resResult.success && resResult.status === 'parsed') {
          resumesParsed++;

          // Discovered skills
          const combinedSkills = Array.from(
            new Set([...updatedSignals.skills, ...(resResult.skills || [])])
          );
          skillsDiscovered += (resResult.skills || []).length;

          // Discovered hackathon mentions
          const updatedHackathons = Math.max(
            updatedSignals.hackathonExperienceCount || 0,
            resResult.hackathonMentionCount || 0
          );

          // Embedded links
          if (resResult.embeddedGithub && !updatedSignals.githubUsername) {
            updatedGithubUrl = resResult.embeddedGithub;
            const extractedGhUser = resResult.embeddedGithub.split('/').filter(Boolean).pop();
            if (extractedGhUser) {
              updatedSignals.githubUsername = extractedGhUser;
              updatedSignals.hasGithub = true;
            }
          }

          updatedSignals = {
            ...updatedSignals,
            skills: combinedSkills,
            hackathonExperienceCount: updatedHackathons,
            workExperiences: resResult.workExperiences || updatedSignals.workExperiences,
            clubActivities: resResult.clubActivities || updatedSignals.clubActivities,
            matchedCustomKeywords: resResult.matchedCustomKeywords || updatedSignals.matchedCustomKeywords,
            hasResume: true,
            hasLinkedin: updatedSignals.hasLinkedin || Boolean(resResult.embeddedLinkedin),
            hasPortfolio: updatedSignals.hasPortfolio || Boolean(resResult.embeddedPortfolio),
          };
        } else if (resResult.status === 'inaccessible') {
          resumesPrivate++;
        }
      }

      return {
        ...member,
        githubUrl: updatedGithubUrl,
        rawSignals: updatedSignals,
      };
    });

    return {
      ...team,
      members: updatedMembers,
    };
  });

  return {
    updatedTeams,
    stats: {
      githubAudited: githubStatsMap.size,
      resumesParsed,
      resumesPrivate,
      skillsDiscovered,
    },
  };
}
