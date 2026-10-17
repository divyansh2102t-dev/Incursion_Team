// Client-side & Cloud Resume Intelligence Parser
// Extracts technical skills, hackathon accolades, and links from PDF files and Google Drive links.

import { extractText } from 'unpdf';
import { extractSkillsAndRoles } from './taxonomy';
import { extractGithubUsername } from './github';
import { RoleCategory, WorkExperienceItem, ClubActivityItem } from '@/types';
import { extractWorkAndClubExperiences } from './experienceParser';

export interface ResumeParseResult {
  success: boolean;
  status: 'parsed' | 'inaccessible' | 'fetch_error' | 'not_a_pdf' | 'corrupt_pdf' | 'error';
  candidateName?: string;
  sourceType: 'google_drive' | 'local_file' | 'web_link';
  skills: string[];
  hackathonMentionCount: number;
  roleDistribution: Record<RoleCategory, number>;
  embeddedGithub?: string;
  embeddedLinkedin?: string;
  embeddedPortfolio?: string;
  workExperiences?: WorkExperienceItem[];
  clubActivities?: ClubActivityItem[];
  matchedCustomKeywords?: string[];
  hasResearchInternship?: boolean;
  hasTier1Company?: boolean;
  hasSpamExperience?: boolean;
  hasClubLeadership?: boolean;
  totalPages?: number;
  snippet?: string;
  errorMessage?: string;
}

/**
 * Parses a remote cloud resume URL (Google Drive, Dropbox, direct PDF link)
 * via our Next.js API route to bypass browser CORS restrictions.
 */
export async function parseCloudResumeUrl(
  url: string,
  candidateName?: string,
  customKeywords: Array<{ keyword: string; weight: number }> = []
): Promise<ResumeParseResult> {
  const isGoogleDrive = url.includes('drive.google.com');
  const sourceType = isGoogleDrive ? 'google_drive' : 'web_link';

  try {
    const res = await fetch('/api/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, candidateName, customKeywords }),
    });

    if (!res.ok) {
      return {
        success: false,
        status: 'fetch_error',
        sourceType,
        skills: [],
        hackathonMentionCount: 0,
        roleDistribution: { frontend: 0, backend: 0, ai_ml: 0, mobile: 0, design: 0, devops: 0, general: 1 },
        errorMessage: `HTTP ${res.status}: Failed to reach parser API.`,
      };
    }

    const data = await res.json();

    if (!data.success) {
      return {
        success: false,
        status: data.status || 'error',
        sourceType,
        skills: [],
        hackathonMentionCount: 0,
        roleDistribution: { frontend: 0, backend: 0, ai_ml: 0, mobile: 0, design: 0, devops: 0, general: 1 },
        errorMessage: data.error || 'Failed to parse document.',
      };
    }

    return {
      success: true,
      status: 'parsed',
      candidateName,
      sourceType,
      skills: data.extracted.skills || [],
      hackathonMentionCount: data.extracted.hackathonMentionCount || 0,
      roleDistribution: data.extracted.roleDistribution || {
        frontend: 0,
        backend: 0,
        ai_ml: 0,
        mobile: 0,
        design: 0,
        devops: 0,
        general: 1,
      },
      embeddedGithub: data.extracted.embeddedGithub,
      embeddedLinkedin: data.extracted.embeddedLinkedin,
      embeddedPortfolio: data.extracted.embeddedPortfolio,
      workExperiences: data.extracted.workExperiences,
      clubActivities: data.extracted.clubActivities,
      matchedCustomKeywords: data.extracted.matchedCustomKeywords,
      hasResearchInternship: data.extracted.hasResearchInternship,
      hasTier1Company: data.extracted.hasTier1Company,
      hasSpamExperience: data.extracted.hasSpamExperience,
      hasClubLeadership: data.extracted.hasClubLeadership,
      totalPages: data.totalPages,
      snippet: data.extracted.snippet,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return {
      success: false,
      status: 'fetch_error',
      sourceType,
      skills: [],
      hackathonMentionCount: 0,
      roleDistribution: { frontend: 0, backend: 0, ai_ml: 0, mobile: 0, design: 0, devops: 0, general: 1 },
      errorMessage: msg,
    };
  }
}

/**
 * Parses a local PDF file directly in the browser's volatile RAM using unpdf.
 * 100% free, 0 API calls, zero server roundtrip.
 */
export async function parseLocalPdfFile(
  file: File,
  candidateName?: string,
  customKeywords: Array<{ keyword: string; weight: number }> = []
): Promise<ResumeParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const extracted = await extractText(bytes);
    const fullText = Array.isArray(extracted.text)
      ? extracted.text.join('\n')
      : (extracted.text || '');

    const taxonomy = extractSkillsAndRoles(fullText);
    const expAnalysis = extractWorkAndClubExperiences(fullText, customKeywords);

    // Scan for any GitHub handle or links inside the resume text
    let embeddedGithub: string | undefined;
    const ghMatch = fullText.match(/(?:github\.com\/|gh:?\s*|@)([a-zA-Z0-9-_]{2,39})\b/i);
    if (ghMatch && ghMatch[1]) {
      const candidateGh = extractGithubUsername(ghMatch[1]);
      if (candidateGh) embeddedGithub = candidateGh;
    }

    // Scan for LinkedIn inside the resume text
    let embeddedLinkedin: string | undefined;
    const liMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-_]+)/i);
    if (liMatch && liMatch[0]) {
      embeddedLinkedin = liMatch[0];
    }

    // Scan for portfolio URL
    let embeddedPortfolio: string | undefined;
    const portMatch = fullText.match(/(?:https?:\/\/)?([a-zA-Z0-9-_]+\.(?:dev|me|io|tech|app|vercel\.app|netlify\.app))\b/i);
    if (portMatch && portMatch[0]) {
      embeddedPortfolio = portMatch[0].startsWith('http') ? portMatch[0] : `https://${portMatch[0]}`;
    }

    return {
      success: true,
      status: 'parsed',
      candidateName,
      sourceType: 'local_file',
      skills: taxonomy.skills,
      hackathonMentionCount: taxonomy.hackathonMentionCount,
      roleDistribution: taxonomy.roleDistribution,
      embeddedGithub,
      embeddedLinkedin,
      embeddedPortfolio,
      workExperiences: expAnalysis.workExperiences,
      clubActivities: expAnalysis.clubActivities,
      matchedCustomKeywords: expAnalysis.matchedCustomKeywords,
      hasResearchInternship: expAnalysis.hasResearchInternship,
      hasTier1Company: expAnalysis.hasTier1Company,
      hasSpamExperience: expAnalysis.hasSpamExperience,
      hasClubLeadership: expAnalysis.hasClubLeadership,
      totalPages: extracted.totalPages,
      snippet: fullText.slice(0, 300).replace(/\s+/g, ' ').trim(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'PDF read error';
    return {
      success: false,
      status: 'corrupt_pdf',
      sourceType: 'local_file',
      skills: [],
      hackathonMentionCount: 0,
      roleDistribution: { frontend: 0, backend: 0, ai_ml: 0, mobile: 0, design: 0, devops: 0, general: 1 },
      errorMessage: msg,
    };
  }
}

/**
 * Matches a dropped PDF file or extracted text to the best candidate in a cohort.
 * Checks candidate first/last name, email prefix, and text occurrences.
 */
export function matchResumeToCandidate(
  fileName: string,
  resumeSnippet: string,
  candidates: Array<{ memberId: string; name: string; email?: string }>
): string | null {
  const cleanFileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const cleanSnippet = resumeSnippet.toLowerCase();

  for (const candidate of candidates) {
    const rawName = candidate.name.toLowerCase().trim();
    if (!rawName || rawName === 'unnamed' || rawName.startsWith('member')) continue;

    const nameParts = rawName.split(/\s+/).filter((p) => p.length >= 3);

    // 1. Direct match in filename (e.g. "aarav_sharma_resume.pdf" matches "Aarav Sharma")
    if (nameParts.length > 0 && nameParts.every((part) => cleanFileName.includes(part))) {
      return candidate.memberId;
    }

    // 2. Email username match in filename (e.g. "aarav.sharma@gmail.com" => "aarav.sharma")
    if (candidate.email) {
      const emailUser = candidate.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ' ');
      if (emailUser.length >= 4 && cleanFileName.includes(emailUser)) {
        return candidate.memberId;
      }
    }

    // 3. Candidate full name present in the first few hundred chars of the resume
    if (nameParts.length >= 2 && nameParts.every((part) => cleanSnippet.includes(part))) {
      return candidate.memberId;
    }
  }

  return null;
}
