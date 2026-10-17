// Legal LinkedIn Profile & Signal Analysis Engine
// Implements Strategies 1, 2, and 3: Search Caching, OpenGraph Meta, and Cross-Corroboration

import { FormulaCoefficients, ExtractedSignals } from '@/types';
import { extractSkillsAndRoles } from './taxonomy';

export interface LinkedinAnalysisResult {
  username?: string;
  headline?: string;
  company?: string;
  seniorityLevel: 'senior' | 'mid' | 'junior' | 'founder' | 'student' | 'unknown';
  has500PlusConnections: boolean;
  isCustomVanitySlug: boolean;
  crossMatchesGithub: boolean;
  extractedSkills: string[];
  verifiedScore: number; // 0 to 100
  rawSummary?: string;
}

/**
 * Extracts a clean LinkedIn username or vanity slug from any profile URL or handle string.
 */
export function extractLinkedinUsername(urlOrHandle?: string): string | null {
  if (!urlOrHandle) return null;
  const clean = urlOrHandle.trim().replace(/^@/, '');

  // Match: linkedin.com/in/{username} or linkedin.com/pub/{username}
  const match = clean.match(/(?:linkedin\.com\/(?:in|pub)\/|linkedin:)([a-zA-Z0-9-_%]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).replace(/[/?#].*$/, '').toLowerCase();
  }

  // Handle plain username provided without URL (e.g. "alex-chen-swe")
  if (/^[a-zA-Z0-9-]{3,60}$/.test(clean) && !clean.includes('.') && !clean.includes('/')) {
    return clean.toLowerCase();
  }

  return null;
}

/**
 * Detects if a username is a claimed custom vanity handle (e.g. "alexchen", "john-doe-dev")
 * versus an auto-generated random junk slug (e.g. "john-doe-892348b91").
 */
export function isCustomVanitySlug(username?: string): boolean {
  if (!username) return false;
  // If slug ends with a 7+ digit hex or numeric sequence, it's typically auto-generated
  if (/[-_][0-9a-f]{7,}$/i.test(username) || /[0-9]{8,}$/.test(username)) {
    return false;
  }
  return username.length >= 3;
}

/**
 * Checks if the candidate's LinkedIn vanity handle matches or correlates with their GitHub handle or name.
 */
export function analyzeCrossMatch(
  linkedinUser?: string,
  githubUser?: string,
  candidateName?: string
): boolean {
  if (!linkedinUser) return false;
  const lUser = linkedinUser.toLowerCase();

  // Exact or subset match with GitHub username
  if (githubUser) {
    const ghUser = githubUser.toLowerCase();
    if (lUser === ghUser || lUser.includes(ghUser) || ghUser.includes(lUser)) {
      return true;
    }
  }

  // Correlation with candidate real name
  if (candidateName) {
    const parts = candidateName
      .toLowerCase()
      .split(/\s+/)
      .filter((p) => p.length >= 2);
    if (parts.length > 0 && parts.every((p) => lUser.includes(p))) {
      return true;
    }
  }

  return false;
}

const TIER1_COMPANIES_AND_LABS = [
  'google', 'microsoft', 'apple', 'amazon', 'meta', 'netflix', 'nvidia',
  'uber', 'airbnb', 'stripe', 'openai', 'anthropic', 'deepmind', 'palantir',
  'datadog', 'snowflake', 'coinbase', 'y combinator', 'yc', 'scale ai',
  'mit', 'stanford', 'harvard', 'cmu', 'berkeley', 'iit', 'bits', 'iiit'
];

/**
 * Parses public LinkedIn headline text to classify seniority, company pedigree,
 * 500+ connections indicator, and technical skills.
 */
export function parseLinkedinHeadline(headlineText: string): {
  seniority: 'senior' | 'mid' | 'junior' | 'founder' | 'student' | 'unknown';
  isPedigreeCompany: boolean;
  has500Plus: boolean;
  skills: string[];
  detectedCompany?: string;
} {
  const lower = headlineText.toLowerCase();

  // 1. Seniority Level Detection
  let seniority: 'senior' | 'mid' | 'junior' | 'founder' | 'student' | 'unknown' = 'unknown';

  if (/\b(?:founder|co-founder|ceo|cto|cpo|principal|founding)\b/i.test(lower)) {
    seniority = 'founder';
  } else if (/\b(?:senior|sr\b|lead|staff|architect|director|head of)\b/i.test(lower)) {
    seniority = 'senior';
  } else if (/\b(?:engineer|developer|specialist|consultant|analyst|associate)\b/i.test(lower)) {
    seniority = 'mid';
  } else if (/\b(?:intern|internship|fellow|fellowship|apprentice|trainee)\b/i.test(lower)) {
    seniority = 'junior';
  } else if (/\b(?:student|undergraduate|candidate|scholar|b\.tech|ms|phd)\b/i.test(lower)) {
    seniority = 'student';
  }

  // 2. Company & Pedigree Detection
  const isPedigreeCompany = TIER1_COMPANIES_AND_LABS.some((c) => lower.includes(c));
  let detectedCompany: string | undefined;
  for (const c of TIER1_COMPANIES_AND_LABS) {
    if (lower.includes(c)) {
      detectedCompany = c.toUpperCase();
      break;
    }
  }

  // 3. 500+ Connections Detection
  const has500Plus =
    lower.includes('500+') ||
    lower.includes('500 +') ||
    lower.includes('over 500 connections') ||
    lower.includes('1,000+ followers') ||
    lower.includes('1000+ followers');

  // 4. Skills extraction from headline text
  const taxonomy = extractSkillsAndRoles(headlineText);

  return {
    seniority,
    isPedigreeCompany,
    has500Plus,
    skills: taxonomy.skills,
    detectedCompany,
  };
}

/**
 * Computes a standardized LinkedIn score (0 - 100) based entirely on the organizer's
 * tunable formula coefficients from Formula Studio!
 */
export function computeMemberLinkedinScore(
  signals: ExtractedSignals,
  coef: FormulaCoefficients
): number {
  if (!signals.hasLinkedin) return 0;

  const metrics = signals.linkedinMetrics;
  let score = 0;

  const seniorityPoints = {
    founder: coef.linkedinSeniorityMaxPoints,
    senior: coef.linkedinSeniorityMaxPoints * 0.85,
    mid: coef.linkedinSeniorityMaxPoints * 0.6,
    junior: coef.linkedinSeniorityMaxPoints * 0.4,
    student: coef.linkedinSeniorityMaxPoints * 0.3,
    unknown: coef.linkedinSeniorityMaxPoints * 0.2,
  };

  if (metrics) {
    // 1. Seniority Points
    score += seniorityPoints[metrics.seniorityLevel] || 0;

    // 2. Pedigree Company Points
    if (metrics.company) {
      score += coef.linkedinPedigreeMaxPoints;
    }

    // 3. 500+ Connections Milestone
    if (metrics.has500PlusConnections) {
      score += coef.linkedinConnections500Points;
    }

    // 4. Custom Vanity Slug
    if (metrics.isCustomVanitySlug) {
      score += coef.linkedinVanitySlugPoints;
    }

    // 5. Cross-platform GitHub Handle Match
    if (metrics.crossMatchesGithub) {
      score += coef.linkedinGithubMatchPoints;
    }
  } else {
    // Baseline heuristic for present LinkedIn profile when live fetch is unverified
    score += coef.linkedinVanitySlugPoints;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Fetches public LinkedIn signals server-side using public OpenGraph headers
 * and cross-corroboration with resume signals.
 */
export async function fetchPublicLinkedinSignals(
  url: string,
  candidateName?: string,
  githubUsername?: string
): Promise<LinkedinAnalysisResult> {
  const username = extractLinkedinUsername(url) || undefined;
  const isCustomSlug = isCustomVanitySlug(username);
  const crossMatch = analyzeCrossMatch(username, githubUsername, candidateName);

  try {
    const res = await fetch('/api/parse-linkedin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, candidateName, githubUsername }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.analysis) {
        return {
          username: data.analysis.username || username,
          headline: data.analysis.headline,
          company: data.analysis.company,
          seniorityLevel: data.analysis.seniorityLevel || 'unknown',
          has500PlusConnections: data.analysis.has500PlusConnections || false,
          isCustomVanitySlug: data.analysis.isCustomVanitySlug ?? isCustomSlug,
          crossMatchesGithub: data.analysis.crossMatchesGithub ?? crossMatch,
          extractedSkills: data.analysis.extractedSkills || [],
          verifiedScore: data.analysis.verifiedScore || 50,
          rawSummary: data.analysis.headline,
        };
      }
    }
  } catch (err) {
    console.warn('[LinkedIn] Server fetch fallback:', err);
  }

  // Graceful, 100% deterministic heuristic fallback if network is restricted
  return {
    username,
    seniorityLevel: 'unknown',
    has500PlusConnections: false,
    isCustomVanitySlug: isCustomSlug,
    crossMatchesGithub: crossMatch,
    extractedSkills: [],
    verifiedScore: isCustomSlug ? 40 : 25,
  };
}
