import Papa from 'papaparse';
import { ColumnMappingConfig, MemberProfile, TeamRecord } from '@/types';
import { extractSkillsAndRoles } from './taxonomy';
import { extractGithubUsername, generateHeuristicFallback } from './github';

export interface ParseResult {
  headers: string[];
  rawRows: Record<string, string>[];
  detectedMapping: ColumnMappingConfig;
  teams: TeamRecord[];
}

export function autoDetectColumnMapping(headers: string[]): ColumnMappingConfig {
  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // 1. Find Team Name column
  let teamNameCol = headers[0] || 'Team Name';
  const teamNameIdx = lowerHeaders.findIndex((h) =>
    h.includes('team name') || h === 'team' || h.includes('group name') || h.includes('project name')
  );
  if (teamNameIdx !== -1) {
    teamNameCol = headers[teamNameIdx];
  }

  // 2. Find Timestamp column
  let submissionTimeCol: string | undefined;
  const timeIdx = lowerHeaders.findIndex((h) =>
    h.includes('timestamp') || h.includes('submitted') || h.includes('date') || h.includes('time')
  );
  if (timeIdx !== -1) {
    submissionTimeCol = headers[timeIdx];
  }

  // 3. Scan for member repetitions (e.g., Member 1, Member 2... or Leader, Teammate 1...)
  const memberColumns: ColumnMappingConfig['memberColumns'] = [];
  
  // Dynamically detect the highest member index referenced in the headers (up to 100)
  let maxMemberIndexFound = 1;
  for (const h of headers) {
    const match = h.match(/(?:member|participant|teammate|person|applicant|m)[_\s]*(\d+)/i);
    if (match && match[1]) {
      const parsedIdx = parseInt(match[1]);
      if (parsedIdx > maxMemberIndexFound && parsedIdx <= 100) {
        maxMemberIndexFound = parsedIdx;
      }
    }
  }
  const scanLimit = Math.max(6, maxMemberIndexFound);

  for (let m = 1; m <= scanLimit; m++) {
    const memberPrefixPatterns = [
      new RegExp(`member\\s*${m}\\b`, 'i'),
      new RegExp(`member_${m}\\b`, 'i'),
      new RegExp(`m${m}\\b`, 'i'),
      new RegExp(`participant\\s*${m}\\b`, 'i'),
      ...(m === 1 ? [/leader\b/i, /captain\b/i, /applicant\b/i] : []),
    ];

    const findCol = (keywords: string[]): string | undefined => {
      // First look for prefix + keyword
      for (let i = 0; i < headers.length; i++) {
        const h = headers[i];
        const lh = lowerHeaders[i];
        const hasPrefix = memberPrefixPatterns.some((p) => p.test(h));
        if (hasPrefix && keywords.some((kw) => lh.includes(kw))) {
          return h;
        }
      }
      // If m === 1 and not prefixed, look for standalone (e.g. "Full Name", "GitHub URL")
      if (m === 1) {
        for (let i = 0; i < headers.length; i++) {
          const lh = lowerHeaders[i];
          const hasAnyMemberPrefix = /member\s*[1-9]/i.test(headers[i]);
          if (!hasAnyMemberPrefix && keywords.some((kw) => lh.includes(kw))) {
            return headers[i];
          }
        }
      }
      return undefined;
    };

    const nameCol = findCol(['name', 'full name', 'first name']);
    const emailCol = findCol(['email', 'mail']);
    const githubCol = findCol(['github', 'git', 'repo', 'gh']);
    const linkedinCol = findCol(['linkedin', 'linked in']);
    const portfolioCol = findCol(['portfolio', 'website', 'personal site']);
    const resumeCol = findCol(['resume', 'cv', 'drive', 'doc']);
    const roleOrBioCol = findCol(['role', 'bio', 'skills', 'about', 'experience']);

    if (nameCol || githubCol || resumeCol || emailCol) {
      memberColumns.push({
        memberIndex: m,
        nameCol,
        emailCol,
        githubCol,
        linkedinCol,
        portfolioCol,
        resumeCol,
        roleOrBioCol,
      });
    }
  }

  // If no structured member columns detected, bind generic columns to member 1
  if (memberColumns.length === 0) {
    memberColumns.push({
      memberIndex: 1,
      nameCol: headers.find((h) => /name/i.test(h) && !/team/i.test(h)),
      emailCol: headers.find((h) => /email/i.test(h)),
      githubCol: headers.find((h) => /github|git/i.test(h)),
      linkedinCol: headers.find((h) => /linkedin/i.test(h)),
      portfolioCol: headers.find((h) => /portfolio|website/i.test(h)),
      resumeCol: headers.find((h) => /resume|cv/i.test(h)),
      roleOrBioCol: headers.find((h) => /skill|role|experience/i.test(h)),
    });
  }

  return {
    teamNameCol,
    submissionTimeCol,
    memberCountType: 'single_row_multiple_members',
    maxMembersDetected: Math.max(1, memberColumns.length),
    memberColumns,
  };
}

export function parseRawDataToTeams(
  rawRows: Record<string, string>[],
  mapping: ColumnMappingConfig
): TeamRecord[] {
  return rawRows.map((row, rowIdx) => {
    const rawTeamName = (row[mapping.teamNameCol] || '').trim();
    const teamName = rawTeamName || `Team #${rowIdx + 1}`;
    const submissionTimestamp = mapping.submissionTimeCol ? row[mapping.submissionTimeCol] : undefined;

    const members: MemberProfile[] = [];

    mapping.memberColumns.forEach((mCol, idx) => {
      const name = mCol.nameCol ? (row[mCol.nameCol] || '').trim() : '';
      const email = mCol.emailCol ? (row[mCol.emailCol] || '').trim() : '';
      const githubUrl = mCol.githubCol ? (row[mCol.githubCol] || '').trim() : '';
      const linkedinUrl = mCol.linkedinCol ? (row[mCol.linkedinCol] || '').trim() : '';
      const portfolioUrl = mCol.portfolioCol ? (row[mCol.portfolioCol] || '').trim() : '';
      const resumeUrl = mCol.resumeCol ? (row[mCol.resumeCol] || '').trim() : '';
      const roleOrBio = mCol.roleOrBioCol ? (row[mCol.roleOrBioCol] || '').trim() : '';

      // Check if this member has at least one piece of data
      const hasAnyData = Boolean(name || email || githubUrl || resumeUrl || portfolioUrl || roleOrBio);
      if (!hasAnyData && idx > 0) {
        // Skip empty member slots beyond member 1
        return;
      }

      // Extract skills and roles from text
      const extracted = extractSkillsAndRoles(`${roleOrBio} ${name} ${portfolioUrl}`);

      // GitHub extraction
      const ghUsername = extractGithubUsername(githubUrl);
      const ghMetrics = ghUsername ? generateHeuristicFallback(ghUsername) : undefined;

      // Add languages from GitHub to skills if available
      if (ghMetrics && ghMetrics.topLanguages) {
        ghMetrics.topLanguages.forEach((l) => {
          if (!extracted.skills.includes(l)) {
            extracted.skills.push(l);
          }
        });
      }

      // Calculate completeness ratio
      const signalsPresent = [
        Boolean(name),
        Boolean(email),
        Boolean(githubUrl || ghUsername),
        Boolean(resumeUrl),
        Boolean(portfolioUrl || linkedinUrl),
        Boolean(extracted.skills.length > 0),
      ].filter(Boolean).length;

      const completenessRatio = Number((signalsPresent / 6).toFixed(2));

      members.push({
        id: `mem-${rowIdx + 1}-${idx + 1}`,
        name: name || `Member ${idx + 1}`,
        email,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
        resumeUrl,
        roleOrBio,
        rawSignals: {
          skills: extracted.skills,
          roleDistribution: extracted.roleDistribution,
          githubUsername: ghUsername || undefined,
          githubMetrics: ghMetrics,
          hackathonExperienceCount: extracted.hackathonMentionCount,
          hasResume: Boolean(resumeUrl),
          hasGithub: Boolean(githubUrl || ghUsername),
          hasLinkedin: Boolean(linkedinUrl),
          hasPortfolio: Boolean(portfolioUrl),
          completenessRatio,
          rawTextSummary: roleOrBio,
        },
      });
    });

    // Default uncalculated computed state (will be populated by scoring engine)
    return {
      id: `team-${rowIdx + 1}`,
      teamName,
      submissionTimestamp,
      members: members.length > 0 ? members : [
        {
          id: `mem-${rowIdx + 1}-1`,
          name: 'Lead Hacker',
          rawSignals: {
            skills: [],
            roleDistribution: { frontend: 0, backend: 0, ai_ml: 0, mobile: 0, design: 0, devops: 0, general: 1 },
            hackathonExperienceCount: 0,
            hasResume: false,
            hasGithub: false,
            hasLinkedin: false,
            hasPortfolio: false,
            completenessRatio: 0.1,
          },
        },
      ],
      rawRowData: row,
      computed: {
        isEligible: true,
        failedFilters: [],
        passedFilters: [],
        technicalDepthScore: 0,
        projectExperienceScore: 0,
        skillComplementarityScore: 0,
        dataCompletenessScore: 0,
        finalScore: 0,
        rank: rowIdx + 1,
        coveredRoles: [],
        missingRoles: [],
        missingDataWarnings: [],
        antiCheatFlags: [],
        manualStatus: 'normal',
      },
    };
  });
}

export function parseCSVString(csvContent: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
  });

  const headers = parsed.meta.fields || [];
  const rawRows = parsed.data;
  const detectedMapping = autoDetectColumnMapping(headers);
  const teams = parseRawDataToTeams(rawRows, detectedMapping);

  return {
    headers,
    rawRows,
    detectedMapping,
    teams,
  };
}
