import { AcmDataPriority, AcmEventConfig, AcmStudentProfile, MemberProfile, TeamRecord } from '@/types';

/**
 * Extracts a candidate's college roll number from explicit fields, custom fields, or institutional email.
 * E.g., "u25cs079@coed.svnit.ac.in" -> "u25cs079"
 * E.g., "U23AI053" -> "u23ai053"
 */
export function extractRollNumberFromMember(member: MemberProfile): string | null {
  // 1. Direct rollNumber property
  if (member.rollNumber && member.rollNumber.trim()) {
    const clean = member.rollNumber.trim().toLowerCase();
    if (/^[iup]\d{2}[a-z]{2,5}\d{2,4}$/i.test(clean)) {
      return clean;
    }
  }

  // 2. Custom fields (e.g., "Roll Number", "Admission No", "ID", "Reg No")
  if (member.customFields) {
    for (const [key, val] of Object.entries(member.customFields)) {
      if (/roll|admission|reg|student\s*id/i.test(key) && val) {
        const clean = val.trim().toLowerCase();
        if (/^[iup]\d{2}[a-z]{2,5}\d{2,4}$/i.test(clean)) {
          return clean;
        }
      }
    }
  }

  // 3. Institutional Email prefix (e.g. u25cs079@coed.svnit.ac.in, i24ai012@svnit.ac.in)
  if (member.email) {
    const cleanEmail = member.email.trim().toLowerCase();
    const emailPrefix = cleanEmail.split('@')[0];
    if (/^[iup]\d{2}[a-z]{2,5}\d{2,4}$/i.test(emailPrefix)) {
      return emailPrefix;
    }
  }

  return null;
}

/**
 * Normalizes a student's full name by removing extraneous SVNIT club suffixes, titles, and whitespace.
 * E.g., "PATADIYA PRATHAM PRAFULLBHAI SVNIT" -> "patadiya pratham prafullbhai"
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bsvnit\b/gi, '')
    .replace(/\bacm\b/gi, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches a candidate registration profile against the official ACM NIT Surat chapter database.
 * Priority:
 * 1. Exact Roll Number (u25cs079) - Deterministic zero collision
 * 2. Exact GitHub Username
 * 3. Exact Normalized Full Name
 */
export function matchCandidateToAcm(
  member: MemberProfile,
  acmDb: AcmStudentProfile[]
): AcmStudentProfile | null {
  if (!acmDb || acmDb.length === 0) return null;

  const candidateRoll = extractRollNumberFromMember(member);
  const candidateGithub = (member.rawSignals.githubUsername || '').trim().toLowerCase();
  const candidateName = normalizeName(member.name);

  // 1. Match by Roll Number
  if (candidateRoll) {
    const match = acmDb.find(
      (s) => s.rollNumber.toLowerCase() === candidateRoll
    );
    if (match) return match;
  }

  // 2. Match by GitHub Username
  if (candidateGithub) {
    const match = acmDb.find(
      (s) => s.github?.username && s.github.username.toLowerCase() === candidateGithub
    );
    if (match) return match;
  }

  // 3. Match by Normalized Full Name
  if (candidateName && candidateName.length >= 4) {
    const match = acmDb.find((s) => {
      const sName = normalizeName(s.displayName);
      if (sName === candidateName) return true;
      // Partial match if both have first and last name
      if (candidateName.length > 8 && sName.includes(candidateName)) return true;
      return false;
    });
    if (match) return match;
  }

  return null;
}

/**
 * Enriches a candidate member with data from the official ACM NIT Surat leaderboard.
 * Respects the user's dataPriority preference:
 * - 'ACM_OVERWRITE': Authoritative ACM verified data overrides self-reported inputs (anti-cheat).
 * - 'PRESERVE_INPUT': Input registration/resume data is preserved; ACM data only fills gaps.
 */
export function enrichMemberWithAcmData(
  member: MemberProfile,
  acmStudent: AcmStudentProfile,
  dataPriority: AcmDataPriority
): MemberProfile {
  const isOverwrite = dataPriority === 'ACM_OVERWRITE';

  // Determine updated GitHub metrics
  let updatedGithubUsername = member.rawSignals.githubUsername;
  let updatedGithubMetrics = member.rawSignals.githubMetrics;

  if (acmStudent.github) {
    if (isOverwrite || !updatedGithubUsername) {
      updatedGithubUsername = acmStudent.github.username;
    }

    if (isOverwrite || !updatedGithubMetrics) {
      updatedGithubMetrics = {
        username: acmStudent.github.username,
        publicRepos: acmStudent.github.publicRepos,
        originalRepos: Math.max(0, acmStudent.github.publicRepos),
        forkedRepos: 0,
        totalStars: acmStudent.github.starsReceived,
        estimatedContributions: acmStudent.github.totalCommits,
        topLanguages: updatedGithubMetrics?.topLanguages || [],
        isSuspicious: false,
        avatarUrl: acmStudent.profileImageUrl || updatedGithubMetrics?.avatarUrl,
      };
    } else {
      // Preserve input, but supplement zeroed metrics with verified ACM metrics
      updatedGithubMetrics = {
        ...updatedGithubMetrics,
        estimatedContributions: Math.max(
          updatedGithubMetrics.estimatedContributions || 0,
          acmStudent.github.totalCommits || 0
        ),
        totalStars: Math.max(
          updatedGithubMetrics.totalStars || 0,
          acmStudent.github.starsReceived || 0
        ),
      };
    }
  }

  // Set roll number and college
  const finalRollNumber = isOverwrite
    ? acmStudent.rollNumber
    : member.rollNumber || acmStudent.rollNumber;
  const finalCollege = isOverwrite
    ? `SVNIT (${acmStudent.branch})`
    : member.college || `SVNIT (${acmStudent.branch})`;

  return {
    ...member,
    rollNumber: finalRollNumber,
    college: finalCollege,
    isAcmMatched: true,
    acmProfile: acmStudent,
    acmDataSource: isOverwrite ? 'acm_website' : 'input_form',
    rawSignals: {
      ...member.rawSignals,
      githubUsername: updatedGithubUsername,
      githubMetrics: updatedGithubMetrics,
      hasGithub: Boolean(updatedGithubUsername || updatedGithubMetrics),
    },
  };
}

/**
 * Enriches an entire cohort of teams with data from the official ACM NIT Surat platform.
 */
export function enrichTeamsWithAcmDatabase(
  teams: TeamRecord[],
  acmDb: AcmStudentProfile[],
  config: AcmEventConfig
): TeamRecord[] {
  if (!config.enabled || !acmDb || acmDb.length === 0) {
    return teams;
  }

  return teams.map((team) => {
    let matchedInTeamCount = 0;

    const enrichedMembers = team.members.map((member) => {
      const match = matchCandidateToAcm(member, acmDb);
      if (match) {
        matchedInTeamCount++;
        return enrichMemberWithAcmData(member, match, config.dataPriority);
      }
      return member;
    });

    return {
      ...team,
      members: enrichedMembers,
    };
  });
}

/**
 * Computes aggregate ACM and Competitive Programming stats for a team.
 */
export function computeTeamAcmStats(members: MemberProfile[]) {
  let matchedCount = 0;
  let totalAcmScore = 0;
  let bestAcmRank = 999999;
  let maxCfRating = 0;
  let maxLeetcodeRating = 0;
  let maxCcStars = 0;
  let totalLeetcodeSolved = 0;
  let totalCfProblems = 0;

  members.forEach((m) => {
    if (m.isAcmMatched && m.acmProfile) {
      matchedCount++;
      totalAcmScore += m.acmProfile.acm.score || 0;
      if (m.acmProfile.acm.overallRank < bestAcmRank) {
        bestAcmRank = m.acmProfile.acm.overallRank;
      }

      if (m.acmProfile.codeforces) {
        if (m.acmProfile.codeforces.currentRating > maxCfRating) {
          maxCfRating = m.acmProfile.codeforces.currentRating;
        }
        totalCfProblems += m.acmProfile.codeforces.problemsSolved || 0;
      }

      if (m.acmProfile.leetcode) {
        if (m.acmProfile.leetcode.rating > maxLeetcodeRating) {
          maxLeetcodeRating = m.acmProfile.leetcode.rating;
        }
        totalLeetcodeSolved += m.acmProfile.leetcode.totalSolved || 0;
      }

      if (m.acmProfile.codechef) {
        if (m.acmProfile.codechef.stars > maxCcStars) {
          maxCcStars = m.acmProfile.codechef.stars;
        }
      }
    }
  });

  const avgAcmScore = matchedCount > 0 ? Number((totalAcmScore / matchedCount).toFixed(1)) : 0;

  return {
    matchedCount,
    teamAcmScore: avgAcmScore,
    bestAcmRank: bestAcmRank === 999999 ? 0 : bestAcmRank,
    maxCfRating,
    maxLeetcodeRating,
    maxCcStars,
    totalLeetcodeSolved,
    totalCfProblems,
  };
}
