import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ColumnMappingConfig, MemberProfile, TeamRecord } from '@/types';
import { extractSkillsAndRoles } from './taxonomy';
import { extractGithubUsername, generateHeuristicFallback } from './github';
import { extractLinkedinUsername, isCustomVanitySlug, analyzeCrossMatch } from './linkedin';
import { detectMemberGender } from './genderDetection';
import { extractWorkAndClubExperiences } from './experienceParser';

export interface ParseResult {
  headers: string[];
  rawRows: Record<string, string>[];
  detectedMapping: ColumnMappingConfig;
  teams: TeamRecord[];
}

/**
 * Extracts a direct CSV export URL from any public Google Sheets URL or ID.
 */
export function extractGoogleSheetsExportUrl(inputUrl: string): string | null {
  const clean = inputUrl.trim();
  const match = clean.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (!match || !match[1]) {
    // If user provided just the raw spreadsheet ID
    if (/^[a-zA-Z0-9-_]{25,60}$/.test(clean)) {
      return `https://docs.google.com/spreadsheets/d/${clean}/export?format=csv&gid=0`;
    }
    return null;
  }
  const spreadsheetId = match[1];
  const gidMatch = clean.match(/[#&?]gid=([0-9]+)/i);
  const gid = gidMatch ? gidMatch[1] : '0';
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Helper to sniff column data types directly from cell values.
 * Resolves completely arbitrary, foreign, or vague headers (e.g. "Col 4", "Drive Link", "Q2").
 */
function sniffColumnTypeFromValues(
  colName: string,
  rows: Record<string, string>[],
  maxSample = 50
): 'github' | 'linkedin' | 'resume' | 'email' | 'portfolio' | 'gender' | 'phone' | 'college' | 'gradYear' | 'unknown' {
  if (!rows || rows.length === 0) return 'unknown';

  let githubCount = 0;
  let linkedinCount = 0;
  let resumeCount = 0;
  let emailCount = 0;
  let portfolioCount = 0;
  let genderCount = 0;
  let phoneCount = 0;
  let collegeCount = 0;
  let gradYearCount = 0;
  let sampleCount = 0;

  for (let i = 0; i < Math.min(rows.length, maxSample); i++) {
    const val = String(rows[i][colName] ?? '').trim();
    if (!val) continue;
    sampleCount++;

    if (/github\.com\/[a-zA-Z0-9-_]+/i.test(val) || (/^@?[a-zA-Z0-9-_]{2,39}$/i.test(val) && /git/i.test(colName))) {
      githubCount++;
    }
    if (/linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9-_]+/i.test(val)) {
      linkedinCount++;
    }
    if (/drive\.google\.com|dropbox\.com|onedrive\.live|docsend|\.pdf(\?|$)/i.test(val)) {
      resumeCount++;
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      emailCount++;
    }
    if (
      /^(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}$/.test(val) ||
      (/^\+?[0-9]{10,14}$/.test(val) && !/^\d{4}$/.test(val))
    ) {
      phoneCount++;
    }
    if (/university|college|institute|campus|school|academy|iit|nit|bits|iiit/i.test(val)) {
      collegeCount++;
    }
    if (
      /^(?:1st|2nd|3rd|4th|final|first|second|third|fourth)\s*(?:year)?$/i.test(val) ||
      /^202[3-9]$/.test(val) ||
      /^(?:freshman|sophomore|junior|senior)$/i.test(val)
    ) {
      gradYearCount++;
    }
    if (/^(?:https?:\/\/)?(?:[a-zA-Z0-9-_]+\.)*(?:github\.io|vercel\.app|netlify\.app|portfolio|dev|me)(\/|$)/i.test(val)) {
      portfolioCount++;
    }
    if (/^(?:female|male|woman|man|non-binary|transgender|she\/her|he\/him|they\/them|f|m)$/i.test(val)) {
      genderCount++;
    }
  }

  if (sampleCount === 0) return 'unknown';

  if (githubCount / sampleCount >= 0.2) return 'github';
  if (linkedinCount / sampleCount >= 0.2) return 'linkedin';
  if (resumeCount / sampleCount >= 0.2) return 'resume';
  if (emailCount / sampleCount >= 0.4) return 'email';
  if (phoneCount / sampleCount >= 0.4) return 'phone';
  if (collegeCount / sampleCount >= 0.3) return 'college';
  if (gradYearCount / sampleCount >= 0.3) return 'gradYear';
  if (genderCount / sampleCount >= 0.3) return 'gender';
  if (portfolioCount / sampleCount >= 0.2) return 'portfolio';

  return 'unknown';
}

/**
 * Intelligent Header Offset Detector.
 * Handles Excel and CSV files with preambles, titles, or empty metadata rows at the top.
 */
function detectHeaderRowOffset(grid: string[][]): number {
  if (!grid || grid.length === 0) return 0;

  const headerKeywords = [
    'team', 'name', 'email', 'github', 'git', 'repo', 'linkedin', 'resume', 'cv',
    'drive', 'timestamp', 'date', 'gender', 'role', 'skill', 'member', 'participant',
    'college', 'phone', 'lead', 'captain', 'project', 'submission', 'mobile', 'year', 'grad'
  ];

  let bestRowIndex = 0;
  let highestScore = -1;

  for (let r = 0; r < Math.min(grid.length, 6); r++) {
    const row = grid[r];
    if (!row || row.length === 0) continue;

    const nonBlankCount = row.filter((c) => String(c ?? '').trim().length > 0).length;
    if (nonBlankCount < 2) continue; // Skip title banners with only 1 or 2 merged cells

    let matchCount = 0;
    row.forEach((cell) => {
      const lower = String(cell ?? '').toLowerCase().trim();
      if (headerKeywords.some((kw) => lower.includes(kw))) {
        matchCount++;
      }
    });

    const score = matchCount * 10 + nonBlankCount;
    if (score > highestScore) {
      highestScore = score;
      bestRowIndex = r;
    }
  }

  return bestRowIndex;
}

/**
 * Parses an Excel ArrayBuffer (.xlsx, .xls) into structured ParseResult.
 */
export function parseExcelArrayBuffer(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel workbook contains no sheets.');
  }

  let sheetName = workbook.SheetNames[0];
  const preferredSheet = workbook.SheetNames.find((s) =>
    /response|register|team|submission|form|data/i.test(s)
  );
  if (preferredSheet) {
    sheetName = preferredSheet;
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawGrid = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '' });
  return processRawGridToResult(rawGrid);
}

/**
 * Parses a raw CSV / TSV string into structured ParseResult.
 */
export function parseCSVString(csvContent: string): ParseResult {
  const rawParsed = Papa.parse<string[]>(csvContent.trim(), {
    header: false,
    skipEmptyLines: 'greedy',
  });

  return processRawGridToResult(rawParsed.data);
}

/**
 * Core processor taking a 2D grid of strings, auto-detecting headers, sniffing types,
 * resolving Wide vs Tall format, and producing 100% data-safe TeamRecords.
 */
function processRawGridToResult(grid: string[][]): ParseResult {
  if (!grid || grid.length === 0) {
    return {
      headers: [],
      rawRows: [],
      detectedMapping: {
        teamNameCol: 'Team Name',
        memberCountType: 'single_row_multiple_members',
        maxMembersDetected: 1,
        memberColumns: [{ memberIndex: 1 }],
      },
      teams: [],
    };
  }

  // 1. Detect Header Row Offset
  const headerRowIdx = detectHeaderRowOffset(grid);
  const rawHeaderRow = grid[headerRowIdx] || [];
  
  const headers: string[] = [];
  const headerCountMap = new Map<string, number>();

  rawHeaderRow.forEach((h, idx) => {
    let cleanHeader = String(h ?? '').trim();
    if (!cleanHeader) {
      cleanHeader = `Column_${idx + 1}`;
    }
    if (headerCountMap.has(cleanHeader)) {
      const count = headerCountMap.get(cleanHeader)! + 1;
      headerCountMap.set(cleanHeader, count);
      cleanHeader = `${cleanHeader}_${count}`;
    } else {
      headerCountMap.set(cleanHeader, 1);
    }
    headers.push(cleanHeader);
  });

  // 2. Build rawRows object dictionary
  const rawRows: Record<string, string>[] = [];
  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r];
    if (!row || row.length === 0) continue;

    const hasData = row.some((c) => String(c ?? '').trim().length > 0);
    if (!hasData) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = (row[colIdx] !== undefined ? String(row[colIdx]) : '').trim();
    });
    rawRows.push(rowObj);
  }

  // 3. Auto-detect schema mapping
  const detectedMapping = autoDetectColumnMapping(headers, rawRows);

  // 4. Parse raw rows into complete TeamRecords
  const teams = parseRawDataToTeams(rawRows, detectedMapping);

  return {
    headers,
    rawRows,
    detectedMapping,
    teams,
  };
}

/**
 * Auto-detects column mapping using a combination of Header Keywords
 * and Content-Aware Deep Cell Sniffing.
 */
export function autoDetectColumnMapping(
  headers: string[],
  rawRows?: Record<string, string>[]
): ColumnMappingConfig {
  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // 1. Find Team Name column
  let teamNameCol = headers[0] || 'Team Name';
  const teamNameIdx = lowerHeaders.findIndex((h) =>
    h.includes('team name') ||
    h === 'team' ||
    h.includes('group name') ||
    h.includes('project name') ||
    h.includes('squad name') ||
    h.includes('team_name') ||
    h.includes('team / group')
  );
  if (teamNameIdx !== -1) {
    teamNameCol = headers[teamNameIdx];
  } else {
    const fallbackIdx = lowerHeaders.findIndex((h) => h.includes('team'));
    if (fallbackIdx !== -1) {
      teamNameCol = headers[fallbackIdx];
    }
  }

  // 2. Find Timestamp column
  let submissionTimeCol: string | undefined;
  const timeIdx = lowerHeaders.findIndex((h) =>
    h.includes('timestamp') || h.includes('submitted') || h.includes('submission date') || h.includes('date') || h === 'time'
  );
  if (timeIdx !== -1) {
    submissionTimeCol = headers[timeIdx];
  }

  // 3. Detect Format: Wide (1 row = 1 team with Member 1, Member 2...) vs. Tall (1 row = 1 participant)
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

  let isTallFormat = false;
  if (maxMemberIndexFound === 1 && rawRows && rawRows.length > 1 && teamNameCol) {
    const teamNameOccurrences = new Map<string, number>();
    rawRows.forEach((r) => {
      const val = (r[teamNameCol] || '').trim().toLowerCase();
      if (val) {
        teamNameOccurrences.set(val, (teamNameOccurrences.get(val) || 0) + 1);
      }
    });

    const duplicateTeamsCount = Array.from(teamNameOccurrences.values()).filter((c) => c > 1).length;
    if (duplicateTeamsCount >= 2 || (teamNameOccurrences.size > 0 && rawRows.length / teamNameOccurrences.size >= 1.5)) {
      isTallFormat = true;
    }
  }

  const memberColumns: ColumnMappingConfig['memberColumns'] = [];
  const scanLimit = isTallFormat ? 1 : Math.max(1, maxMemberIndexFound);
  const usedColumns = new Set<string>();
  if (teamNameCol) usedColumns.add(teamNameCol);
  if (submissionTimeCol) usedColumns.add(submissionTimeCol);

  for (let m = 1; m <= scanLimit; m++) {
    const memberPrefixPatterns = [
      new RegExp(`member\\s*${m}\\b`, 'i'),
      new RegExp(`member_${m}\\b`, 'i'),
      new RegExp(`m${m}\\b`, 'i'),
      new RegExp(`participant\\s*${m}\\b`, 'i'),
      new RegExp(`teammate\\s*${m}\\b`, 'i'),
      ...(m === 1 ? [/leader\b/i, /captain\b/i, /applicant\b/i, /lead\b/i] : []),
    ];

    const findColByKeyword = (keywords: string[]): string | undefined => {
      // First try matching memberPrefixPatterns on unused columns
      for (let i = 0; i < headers.length; i++) {
        const h = headers[i];
        if (usedColumns.has(h)) continue;
        const lh = lowerHeaders[i];
        const hasPrefix = memberPrefixPatterns.some((p) => p.test(h));
        if (hasPrefix && keywords.some((kw) => lh.includes(kw))) {
          return h;
        }
      }
      // If member 1 or tall format, try matching without member prefix on unused columns
      if (m === 1 || isTallFormat) {
        for (let i = 0; i < headers.length; i++) {
          const h = headers[i];
          if (usedColumns.has(h)) continue;
          const lh = lowerHeaders[i];
          const hasAnyMemberPrefix = /(?:member|participant|teammate)[_\s]*[2-9]/i.test(headers[i]);
          if (!hasAnyMemberPrefix && keywords.some((kw) => lh.includes(kw)) && headers[i] !== teamNameCol) {
            return headers[i];
          }
        }
      }
      return undefined;
    };

    let nameCol = findColByKeyword(['full name', 'candidate name', 'participant name', 'student name', 'name', 'first name']);
    let emailCol = findColByKeyword(['email', 'mail', 'e-mail']);
    let phoneCol = findColByKeyword(['mobile', 'phone', 'contact', 'whatsapp', 'cell', 'ph no', 'phone number', 'mobile number', 'contact number']);
    let collegeCol = findColByKeyword(['college', 'university', 'institute', 'campus', 'institution', 'school', 'org', 'department']);
    let gradYearCol = findColByKeyword(['year of study', 'year of college', 'year', 'grad year', 'graduation year', 'batch', 'semester', 'class of', 'passout year', 'academic year']);
    let genderCol = findColByKeyword(['gender', 'sex', 'pronoun', 'female']);
    let githubCol = findColByKeyword(['github', 'git', 'repo', 'gh', 'code link', 'repository']);
    let linkedinCol = findColByKeyword(['linkedin', 'linked in', 'linked_in']);
    let portfolioCol = findColByKeyword(['portfolio', 'website', 'personal site', 'webpage']);
    let resumeCol = findColByKeyword(['resume', 'cv', 'curriculum', 'drive', 'google drive', 'pdf', 'doc']);
    let roleOrBioCol = findColByKeyword(['role', 'bio', 'skills', 'about', 'experience', 'tech stack', 'primary tech']);

    // Content-Aware Sniffing Fallback (strictly for member 1 or tall format, on unused columns only)
    if ((m === 1 || isTallFormat) && rawRows && rawRows.length > 0) {
      if (!githubCol) {
        const sniffed = headers.find((h) => !usedColumns.has(h) && sniffColumnTypeFromValues(h, rawRows) === 'github');
        if (sniffed) githubCol = sniffed;
      }
      if (!linkedinCol) {
        const sniffed = headers.find((h) => !usedColumns.has(h) && sniffColumnTypeFromValues(h, rawRows) === 'linkedin');
        if (sniffed) linkedinCol = sniffed;
      }
      if (!resumeCol) {
        const sniffed = headers.find((h) => !usedColumns.has(h) && sniffColumnTypeFromValues(h, rawRows) === 'resume');
        if (sniffed) resumeCol = sniffed;
      }
      if (!emailCol) {
        const sniffed = headers.find((h) => !usedColumns.has(h) && sniffColumnTypeFromValues(h, rawRows) === 'email');
        if (sniffed) emailCol = sniffed;
      }
      if (!phoneCol) {
        const sniffed = headers.find((h) => !usedColumns.has(h) && sniffColumnTypeFromValues(h, rawRows) === 'phone');
        if (sniffed) phoneCol = sniffed;
      }
      if (!collegeCol) {
        const sniffed = headers.find((h) => !usedColumns.has(h) && sniffColumnTypeFromValues(h, rawRows) === 'college');
        if (sniffed) collegeCol = sniffed;
      }
      if (!gradYearCol) {
        const sniffed = headers.find((h) => !usedColumns.has(h) && sniffColumnTypeFromValues(h, rawRows) === 'gradYear');
        if (sniffed) gradYearCol = sniffed;
      }
      if (!genderCol) {
        const sniffed = headers.find((h) => !usedColumns.has(h) && sniffColumnTypeFromValues(h, rawRows) === 'gender');
        if (sniffed) genderCol = sniffed;
      }
      if (!portfolioCol) {
        const sniffed = headers.find((h) => !usedColumns.has(h) && sniffColumnTypeFromValues(h, rawRows) === 'portfolio');
        if (sniffed && sniffed !== githubCol && sniffed !== linkedinCol && sniffed !== resumeCol) {
          portfolioCol = sniffed;
        }
      }
    }

    // Mark matched columns as used so later members don't duplicate them
    [nameCol, emailCol, phoneCol, collegeCol, gradYearCol, genderCol, githubCol, linkedinCol, portfolioCol, resumeCol, roleOrBioCol].forEach((col) => {
      if (col) usedColumns.add(col);
    });

    if (nameCol || githubCol || resumeCol || emailCol || genderCol || phoneCol || collegeCol) {
      memberColumns.push({
        memberIndex: m,
        nameCol,
        emailCol,
        phoneCol,
        collegeCol,
        gradYearCol,
        genderCol,
        githubCol,
        linkedinCol,
        portfolioCol,
        resumeCol,
        roleOrBioCol,
      });
    }
  }

  // Fallback
  if (memberColumns.length === 0) {
    memberColumns.push({
      memberIndex: 1,
      nameCol: headers.find((h) => /name/i.test(h) && !/team/i.test(h)),
      emailCol: headers.find((h) => /email/i.test(h)),
      phoneCol: headers.find((h) => /phone|mobile|whatsapp/i.test(h)),
      collegeCol: headers.find((h) => /college|univ|institute/i.test(h)),
      gradYearCol: headers.find((h) => /year|batch|grad/i.test(h)),
      genderCol: headers.find((h) => /gender|sex|pronoun/i.test(h)),
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
    memberCountType: isTallFormat ? 'delimited_or_stacked' : 'single_row_multiple_members',
    maxMembersDetected: Math.max(1, memberColumns.length),
    memberColumns,
  };
}

/**
 * Converts rawRows into structured TeamRecords based on ColumnMappingConfig.
 * Handles both Wide (single row per team) and Tall (grouped rows per team) formats,
 * while deduplicating redundant submissions and preserving 100% of raw data.
 */
export function parseRawDataToTeams(
  rawRows: Record<string, string>[],
  mapping: ColumnMappingConfig
): TeamRecord[] {
  // --- BRANCH A: Tall / Row-Per-Member Format (Group rows by Team Name) ---
  if (mapping.memberCountType === 'delimited_or_stacked') {
    const teamMap = new Map<string, Record<string, string>[]>();

    rawRows.forEach((row, rowIdx) => {
      const rawTeamName = (row[mapping.teamNameCol] || '').trim();
      const teamKey = rawTeamName.toLowerCase() || `team-unnamed-${rowIdx + 1}`;
      if (!teamMap.has(teamKey)) {
        teamMap.set(teamKey, []);
      }
      teamMap.get(teamKey)!.push(row);
    });

    const teams: TeamRecord[] = [];
    let teamCounter = 0;

    teamMap.forEach((rows) => {
      teamCounter++;
      const primaryRow = rows[0];
      const teamName = (primaryRow[mapping.teamNameCol] || '').trim() || `Team #${teamCounter}`;
      const submissionTimestamp = mapping.submissionTimeCol ? primaryRow[mapping.submissionTimeCol] : undefined;

      const members: MemberProfile[] = [];
      const mCol = mapping.memberColumns[0] || {};

      rows.forEach((row, mIdx) => {
        const name = mCol.nameCol ? (row[mCol.nameCol] || '').trim() : '';
        let email = mCol.emailCol ? (row[mCol.emailCol] || '').trim() : '';
        const phone = mCol.phoneCol ? (row[mCol.phoneCol] || '').trim() : '';
        const college = mCol.collegeCol ? (row[mCol.collegeCol] || '').trim() : '';
        const gradYear = mCol.gradYearCol ? (row[mCol.gradYearCol] || '').trim() : '';
        let githubUrl = mCol.githubCol ? (row[mCol.githubCol] || '').trim() : '';
        const linkedinUrl = mCol.linkedinCol ? (row[mCol.linkedinCol] || '').trim() : '';
        let portfolioUrl = mCol.portfolioCol ? (row[mCol.portfolioCol] || '').trim() : '';
        let resumeUrl = mCol.resumeCol ? (row[mCol.resumeCol] || '').trim() : '';
        const roleOrBio = mCol.roleOrBioCol ? (row[mCol.roleOrBioCol] || '').trim() : '';

        const hasAnyData = Boolean(name || email || githubUrl || resumeUrl || portfolioUrl || roleOrBio || phone || college);
        if (!hasAnyData && mIdx > 0) return;

        // Collect custom/unmapped fields for this member
        const mappedCols = new Set([
          mapping.teamNameCol,
          mapping.submissionTimeCol,
          mCol.nameCol,
          mCol.emailCol,
          mCol.phoneCol,
          mCol.collegeCol,
          mCol.gradYearCol,
          mCol.genderCol,
          mCol.githubCol,
          mCol.linkedinCol,
          mCol.portfolioCol,
          mCol.resumeCol,
          mCol.roleOrBioCol,
        ].filter(Boolean) as string[]);

        const customFields: Record<string, string> = {};
        Object.entries(row).forEach(([k, rawVal]) => {
          const v = String(rawVal ?? '').trim();
          if (!mappedCols.has(k) && v.length > 0) {
            customFields[k] = v;
          }
        });

        // Scan all row text for unmapped skills and accolades (Zero Data Loss)
        const allRowText = Object.values(row).join(' ');
        const extracted = extractSkillsAndRoles(`${roleOrBio} ${name} ${portfolioUrl} ${allRowText}`);

        let ghUsername = extractGithubUsername(githubUrl);
        // Column recovery if respondent swapped or shifted fields
        if (!ghUsername) {
          if (resumeUrl && extractGithubUsername(resumeUrl)) {
            ghUsername = extractGithubUsername(resumeUrl);
            githubUrl = resumeUrl;
            resumeUrl = '';
          } else if (portfolioUrl && extractGithubUsername(portfolioUrl)) {
            ghUsername = extractGithubUsername(portfolioUrl);
            githubUrl = portfolioUrl;
            portfolioUrl = '';
          }
        }
        if (!ghUsername && githubUrl && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(githubUrl) && !email.includes('@')) {
          email = githubUrl;
          githubUrl = '';
        }
        if (ghUsername) {
          githubUrl = githubUrl.startsWith('http') ? githubUrl : `https://github.com/${ghUsername}`;
        } else {
          githubUrl = '';
        }

        const ghMetrics = ghUsername ? generateHeuristicFallback(ghUsername) : undefined;
        if (ghMetrics && ghMetrics.topLanguages) {
          ghMetrics.topLanguages.forEach((l) => {
            if (!extracted.skills.includes(l)) {
              extracted.skills.push(l);
            }
          });
        }

        const linkedinUsername = extractLinkedinUsername(linkedinUrl) || undefined;
        const isCustomSlug = isCustomVanitySlug(linkedinUsername);
        const crossMatch = analyzeCrossMatch(linkedinUsername, ghUsername || undefined, name);
        const linkedinMetrics = linkedinUsername
          ? {
              username: linkedinUsername,
              seniorityLevel: 'unknown' as const,
              has500PlusConnections: false,
              isCustomVanitySlug: isCustomSlug,
              crossMatchesGithub: crossMatch,
              extractedSkills: [],
              verifiedScore: isCustomSlug ? 35 : 20,
            }
          : undefined;

        const signalsPresent = [
          Boolean(name),
          Boolean(email),
          Boolean(ghUsername),
          Boolean(resumeUrl),
          Boolean(portfolioUrl || linkedinUrl),
          Boolean(extracted.skills.length > 0),
        ].filter(Boolean).length;

        const completenessRatio = Number((signalsPresent / 6).toFixed(2));

        const rawGender = mCol.genderCol ? (row[mCol.genderCol] || '').trim() : '';
        const genderRes = detectMemberGender({
          rawGender,
          name,
          roleOrBio,
        });

        const initialExp = extractWorkAndClubExperiences(roleOrBio || '');

        members.push({
          id: `mem-${teamCounter}-${mIdx + 1}`,
          name: name || `Member ${mIdx + 1}`,
          email,
          phone: phone || undefined,
          college: college || undefined,
          gradYear: gradYear || undefined,
          gender: genderRes.gender,
          isFemale: genderRes.isFemale,
          githubUrl: githubUrl || undefined,
          linkedinUrl: linkedinUrl || undefined,
          portfolioUrl: portfolioUrl || undefined,
          resumeUrl: resumeUrl || undefined,
          roleOrBio,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
          rawSignals: {
            skills: extracted.skills,
            roleDistribution: extracted.roleDistribution,
            githubUsername: ghUsername || undefined,
            githubMetrics: ghMetrics,
            hackathonExperienceCount: extracted.hackathonMentionCount,
            workExperiences: initialExp.workExperiences.length > 0 ? initialExp.workExperiences : undefined,
            clubActivities: initialExp.clubActivities.length > 0 ? initialExp.clubActivities : undefined,
            matchedCustomKeywords: initialExp.matchedCustomKeywords.length > 0 ? initialExp.matchedCustomKeywords : undefined,
            hasResume: Boolean(resumeUrl),
            hasGithub: Boolean(ghUsername),
            hasLinkedin: Boolean(linkedinUrl || linkedinUsername),
            linkedinUsername,
            linkedinMetrics,
            hasPortfolio: Boolean(portfolioUrl),
            completenessRatio,
            rawTextSummary: roleOrBio,
          },
        });
      });

      // Merge all row attributes into rawRowData so zero columns are lost
      const mergedRawRowData = Object.assign({}, ...rows);

      // Check team-level female signal in any row
      const hasTeamLevelFemaleSignal = rows.some((r) =>
        Object.entries(r).some(([colName, val]) => {
          const lcCol = colName.toLowerCase();
          const lcVal = String(val ?? '').toLowerCase().trim();
          return (
            (lcCol.includes('female') || lcCol.includes('women') || lcCol.includes('diversity')) &&
            (lcVal === 'yes' || lcVal === 'true' || lcVal === '1' || lcVal.includes('female'))
          );
        })
      );
      if (hasTeamLevelFemaleSignal && !members.some((m) => m.isFemale) && members.length > 0) {
        members[0].isFemale = true;
        members[0].gender = 'female';
      }

      teams.push({
        id: `team-${teamCounter}`,
        teamName,
        submissionTimestamp,
        members: members.length > 0 ? members : createFallbackMembers(teamCounter),
        rawRowData: mergedRawRowData,
        computed: createInitialComputedMetrics(teamCounter),
      });
    });

    return teams;
  }

  // --- BRANCH B: Wide Format (1 row = 1 team with multiple member columns) ---
  const uniqueTeamsMap = new Map<string, Record<string, string>>();

  rawRows.forEach((row, rowIdx) => {
    const rawTeamName = (row[mapping.teamNameCol] || '').trim();
    const teamKey = rawTeamName ? rawTeamName.toLowerCase() : `__row_${rowIdx}`;

    if (uniqueTeamsMap.has(teamKey)) {
      const existing = uniqueTeamsMap.get(teamKey)!;
      const merged: Record<string, string> = { ...existing };
      Object.entries(row).forEach(([k, rawVal]) => {
        const v = String(rawVal ?? '').trim();
        if (v.length > 0) {
          merged[k] = v;
        }
      });
      uniqueTeamsMap.set(teamKey, merged);
    } else {
      uniqueTeamsMap.set(teamKey, row);
    }
  });

  const dedupedRows = Array.from(uniqueTeamsMap.values());

  return dedupedRows.map((row, rowIdx) => {
    const rawTeamName = String(row[mapping.teamNameCol] ?? '').trim();
    const teamName = rawTeamName || `Team #${rowIdx + 1}`;
    const submissionTimestamp = mapping.submissionTimeCol ? row[mapping.submissionTimeCol] : undefined;

    const members: MemberProfile[] = [];
    const allRowText = Object.values(row).join(' ');

    // Collect all explicitly mapped columns across all members
    const allMappedColumns = new Set<string>([
      mapping.teamNameCol,
      mapping.submissionTimeCol || '',
    ]);

    mapping.memberColumns.forEach((mCol) => {
      [
        mCol.nameCol,
        mCol.emailCol,
        mCol.phoneCol,
        mCol.collegeCol,
        mCol.gradYearCol,
        mCol.genderCol,
        mCol.githubCol,
        mCol.linkedinCol,
        mCol.portfolioCol,
        mCol.resumeCol,
        mCol.roleOrBioCol,
      ].forEach((col) => {
        if (col) allMappedColumns.add(col);
      });
    });

    // Unmapped team/candidate custom fields
    const customFields: Record<string, string> = {};
    Object.entries(row).forEach(([k, rawVal]) => {
      const v = String(rawVal ?? '').trim();
      if (!allMappedColumns.has(k) && v.length > 0) {
        customFields[k] = v;
      }
    });

    mapping.memberColumns.forEach((mCol, idx) => {
      const name = mCol.nameCol ? (row[mCol.nameCol] || '').trim() : '';
      let email = mCol.emailCol ? (row[mCol.emailCol] || '').trim() : '';
      const phone = mCol.phoneCol ? (row[mCol.phoneCol] || '').trim() : '';
      const college = mCol.collegeCol ? (row[mCol.collegeCol] || '').trim() : '';
      const gradYear = mCol.gradYearCol ? (row[mCol.gradYearCol] || '').trim() : '';
      let githubUrl = mCol.githubCol ? (row[mCol.githubCol] || '').trim() : '';
      const linkedinUrl = mCol.linkedinCol ? (row[mCol.linkedinCol] || '').trim() : '';
      let portfolioUrl = mCol.portfolioCol ? (row[mCol.portfolioCol] || '').trim() : '';
      let resumeUrl = mCol.resumeCol ? (row[mCol.resumeCol] || '').trim() : '';
      const roleOrBio = mCol.roleOrBioCol ? (row[mCol.roleOrBioCol] || '').trim() : '';

      const hasAnyData = Boolean(name || email || githubUrl || resumeUrl || portfolioUrl || roleOrBio || phone || college);
      if (!hasAnyData && idx > 0) {
        return;
      }

      const extracted = extractSkillsAndRoles(`${roleOrBio} ${name} ${portfolioUrl} ${idx === 0 ? allRowText : ''}`);

      let ghUsername = extractGithubUsername(githubUrl);
      // Column recovery if respondent swapped or shifted fields
      if (!ghUsername) {
        if (resumeUrl && extractGithubUsername(resumeUrl)) {
          ghUsername = extractGithubUsername(resumeUrl);
          githubUrl = resumeUrl;
          resumeUrl = '';
        } else if (portfolioUrl && extractGithubUsername(portfolioUrl)) {
          ghUsername = extractGithubUsername(portfolioUrl);
          githubUrl = portfolioUrl;
          portfolioUrl = '';
        }
      }
      if (!ghUsername && githubUrl && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(githubUrl) && !email.includes('@')) {
        email = githubUrl;
        githubUrl = '';
      }
      if (ghUsername) {
        githubUrl = githubUrl.startsWith('http') ? githubUrl : `https://github.com/${ghUsername}`;
      } else {
        githubUrl = '';
      }

      const ghMetrics = ghUsername ? generateHeuristicFallback(ghUsername) : undefined;

      if (ghMetrics && ghMetrics.topLanguages) {
        ghMetrics.topLanguages.forEach((l) => {
          if (!extracted.skills.includes(l)) {
            extracted.skills.push(l);
          }
        });
      }

      const linkedinUsername = extractLinkedinUsername(linkedinUrl) || undefined;
      const isCustomSlug = isCustomVanitySlug(linkedinUsername);
      const crossMatch = analyzeCrossMatch(linkedinUsername, ghUsername || undefined, name);
      const linkedinMetrics = linkedinUsername
        ? {
            username: linkedinUsername,
            seniorityLevel: 'unknown' as const,
            has500PlusConnections: false,
            isCustomVanitySlug: isCustomSlug,
            crossMatchesGithub: crossMatch,
            extractedSkills: [],
            verifiedScore: isCustomSlug ? 35 : 20,
          }
        : undefined;

      const signalsPresent = [
        Boolean(name),
        Boolean(email),
        Boolean(ghUsername),
        Boolean(resumeUrl),
        Boolean(portfolioUrl || linkedinUrl),
        Boolean(extracted.skills.length > 0),
      ].filter(Boolean).length;

      const completenessRatio = Number((signalsPresent / 6).toFixed(2));

      const rawGender = mCol.genderCol ? (row[mCol.genderCol] || '').trim() : '';
      const genderRes = detectMemberGender({
        rawGender,
        name,
        roleOrBio,
      });

      const initialExp = extractWorkAndClubExperiences(roleOrBio || '');

      // Auto-detect institutional roll number (e.g. u25cs079, u23ai053)
      let detectedRollNumber: string | undefined = undefined;
      if (email) {
        const prefix = email.split('@')[0]?.toLowerCase().trim();
        if (/^[iup]\d{2}[a-z]{2,5}\d{2,4}$/i.test(prefix)) {
          detectedRollNumber = prefix;
        }
      }
      if (!detectedRollNumber) {
        for (const [k, v] of Object.entries(row)) {
          if (/roll|admission|reg\s*no|student\s*id/i.test(k)) {
            const clean = String(v ?? '').trim().toLowerCase();
            if (/^[iup]\d{2}[a-z]{2,5}\d{2,4}$/i.test(clean)) {
              detectedRollNumber = clean;
              break;
            }
          }
        }
      }

      members.push({
        id: `mem-${rowIdx + 1}-${idx + 1}`,
        name: name || `Member ${idx + 1}`,
        email,
        phone: phone || undefined,
        college: college || undefined,
        gradYear: gradYear || undefined,
        rollNumber: detectedRollNumber,
        gender: genderRes.gender,
        isFemale: genderRes.isFemale,
        githubUrl: githubUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
        resumeUrl: resumeUrl || undefined,
        roleOrBio,
        customFields: idx === 0 && Object.keys(customFields).length > 0 ? customFields : undefined,
        rawSignals: {
          skills: extracted.skills,
          roleDistribution: extracted.roleDistribution,
          githubUsername: ghUsername || undefined,
          githubMetrics: ghMetrics,
          hackathonExperienceCount: extracted.hackathonMentionCount,
          workExperiences: initialExp.workExperiences.length > 0 ? initialExp.workExperiences : undefined,
          clubActivities: initialExp.clubActivities.length > 0 ? initialExp.clubActivities : undefined,
          matchedCustomKeywords: initialExp.matchedCustomKeywords.length > 0 ? initialExp.matchedCustomKeywords : undefined,
          hasResume: Boolean(resumeUrl),
          hasGithub: Boolean(ghUsername),
          hasLinkedin: Boolean(linkedinUrl || linkedinUsername),
          linkedinUsername,
          linkedinMetrics,
          hasPortfolio: Boolean(portfolioUrl),
          completenessRatio,
          rawTextSummary: roleOrBio,
        },
      });
    });

    // Team-level female signal fallback
    const hasTeamLevelFemaleSignal = Object.entries(row).some(([colName, val]) => {
      const lcCol = colName.toLowerCase();
      const lcVal = String(val ?? '').toLowerCase().trim();
      return (
        (lcCol.includes('female') || lcCol.includes('women') || lcCol.includes('diversity')) &&
        (lcVal === 'yes' || lcVal === 'true' || lcVal === '1' || lcVal.includes('female'))
      );
    });
    if (hasTeamLevelFemaleSignal && !members.some((m) => m.isFemale) && members.length > 0) {
      members[0].isFemale = true;
      members[0].gender = 'female';
    }

    return {
      id: `team-${rowIdx + 1}`,
      teamName,
      submissionTimestamp,
      members: members.length > 0 ? members : createFallbackMembers(rowIdx + 1),
      rawRowData: row,
      computed: createInitialComputedMetrics(rowIdx + 1),
    };
  });
}

function createFallbackMembers(idIndex: number): MemberProfile[] {
  return [
    {
      id: `mem-${idIndex}-1`,
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
  ];
}

function createInitialComputedMetrics(rankIdx: number) {
  return {
    isEligible: true,
    failedFilters: [],
    passedFilters: [],
    technicalDepthScore: 0,
    projectExperienceScore: 0,
    skillComplementarityScore: 0,
    dataCompletenessScore: 0,
    finalScore: 0,
    rank: rankIdx,
    coveredRoles: [],
    missingRoles: [],
    missingDataWarnings: [],
    antiCheatFlags: [],
    manualStatus: 'normal' as const,
  };
}
