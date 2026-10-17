import { NextRequest, NextResponse } from 'next/server';
import {
  extractLinkedinUsername,
  isCustomVanitySlug,
  analyzeCrossMatch,
  parseLinkedinHeadline,
  LinkedinAnalysisResult,
} from '@/engine/linkedin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUrl = body?.url?.trim();
    const candidateName = body?.candidateName?.trim();
    const githubUsername = body?.githubUsername?.trim();

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: url' },
        { status: 400 }
      );
    }

    const username = extractLinkedinUsername(rawUrl);
    const isCustomSlug = isCustomVanitySlug(username || undefined);
    const crossMatch = analyzeCrossMatch(username || undefined, githubUsername, candidateName);

    let headline = '';
    let has500Plus = false;
    let seniority: 'senior' | 'mid' | 'junior' | 'founder' | 'student' | 'unknown' = 'unknown';
    let company: string | undefined;
    let extractedSkills: string[] = [];

    // Attempt to fetch public OpenGraph metadata using social bot User-Agent
    try {
      const response = await fetch(rawUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; Twitterbot/1.0; +https://twitter.com/bot) AppleWebKit/537.36 (KHTML, like Gecko)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        cache: 'no-store',
      });

      if (response.ok) {
        const html = await response.text();

        // Extract og:title and og:description using regex
        const ogTitleMatch = html.match(
          /<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i
        );
        const ogDescMatch = html.match(
          /<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i
        );
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);

        const ogTitle = ogTitleMatch ? ogTitleMatch[1] : titleMatch ? titleMatch[1] : '';
        const ogDesc = ogDescMatch ? ogDescMatch[1] : '';

        headline = `${ogTitle} ${ogDesc}`.replace(/\|?\s*LinkedIn$/i, '').trim();

        if (headline) {
          const parsed = parseLinkedinHeadline(headline);
          seniority = parsed.seniority;
          has500Plus = parsed.has500Plus;
          company = parsed.detectedCompany;
          extractedSkills = parsed.skills;
        }
      }
    } catch {
      // In case LinkedIn network block occurs, gracefully proceed with vanity & cross-match signals
    }

    // Baseline verified score
    let verifiedScore = 20;
    if (isCustomSlug) verifiedScore += 15;
    if (crossMatch) verifiedScore += 15;
    if (has500Plus) verifiedScore += 20;
    if (seniority === 'founder' || seniority === 'senior') verifiedScore += 25;
    else if (seniority === 'mid') verifiedScore += 15;
    if (company) verifiedScore += 15;

    const analysis: LinkedinAnalysisResult = {
      username: username || undefined,
      headline: headline || undefined,
      company,
      seniorityLevel: seniority,
      has500PlusConnections: has500Plus,
      isCustomVanitySlug: isCustomSlug,
      crossMatchesGithub: crossMatch,
      extractedSkills,
      verifiedScore: Math.min(100, verifiedScore),
    };

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse LinkedIn profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
