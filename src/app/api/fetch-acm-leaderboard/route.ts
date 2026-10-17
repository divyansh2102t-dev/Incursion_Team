import { NextRequest, NextResponse } from 'next/server';
import { AcmStudentProfile } from '@/types';

// In-memory cache to prevent spamming acmnitsurat.in
let cachedData: AcmStudentProfile[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('force') === 'true';

  return handleFetchAcmLeaderboard(forceRefresh);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const forceRefresh = Boolean(body?.force);
    return handleFetchAcmLeaderboard(forceRefresh);
  } catch {
    return handleFetchAcmLeaderboard(false);
  }
}

async function handleFetchAcmLeaderboard(forceRefresh: boolean) {
  const now = Date.now();

  // Return cached data if fresh and not forced
  if (!forceRefresh && cachedData && now - lastCacheTime < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      cached: true,
      source: 'https://acmnitsurat.in',
      attribution: 'Official ACM NIT Surat Student Chapter Leaderboard (SVNIT)',
      count: cachedData.length,
      fetchedAt: new Date(lastCacheTime).toISOString(),
      data: cachedData,
    });
  }

  try {
    const targetUrl = 'https://acmnitsurat.in/api/leaderboard?limit=200';
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IncursionRecruiter/2.0 (ACM-Integration)',
        Accept: 'application/json',
      },
      next: { revalidate: 300 }, // 5 min Next.js cache
    });

    if (!response.ok) {
      throw new Error(`Upstream ACM API returned HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const rawList: any[] = Array.isArray(json?.data) ? json.data : [];

    const formattedList: AcmStudentProfile[] = rawList.map((s, idx) => {
      const rollNumber = String(s.rollNumber || '').toLowerCase().trim();
      const displayName = String(
        s.displayName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || `Student ${idx + 1}`
      ).trim();

      const studentProfile: AcmStudentProfile = {
        uid: s.uid,
        rollNumber,
        displayName,
        firstName: s.firstName,
        lastName: s.lastName,
        branch: String(s.branch || 'Unknown').trim(),
        currentYear: Number(s.currentYear) || 1,
        graduationBatch: Number(s.graduationBatch) || 2026,
        profileImageUrl: s.profileImageUrl || '',
        slug: s.slug || '',
        acm: {
          score: Number(s.acm?.score) || 0,
          overallRank: Number(s.acm?.overallRank || s.rank || idx + 1),
          branchRank: Number(s.acm?.branchRank) || 1,
          yearRank: Number(s.acm?.yearRank) || 1,
          platformRanks: s.acm?.platformRanks || {},
          lastCalculated: s.acm?.lastCalculated,
        },
        leetcode: s.leetcode
          ? {
              username: String(s.leetcode.username || ''),
              rating: Number(s.leetcode.rating) || 0,
              totalSolved: Number(s.leetcode.totalSolved) || 0,
              easySolved: Number(s.leetcode.easySolved) || 0,
              mediumSolved: Number(s.leetcode.mediumSolved) || 0,
              hardSolved: Number(s.leetcode.hardSolved) || 0,
              contestCount: Number(s.leetcode.contestCount) || 0,
              globalRank: Number(s.leetcode.globalRank) || 0,
            }
          : undefined,
        codeforces: s.codeforces
          ? {
              handle: String(s.codeforces.handle || ''),
              currentRating: Number(s.codeforces.currentRating) || 0,
              maxRating: Number(s.codeforces.maxRating) || 0,
              currentRank: String(s.codeforces.currentRank || ''),
              maxRank: String(s.codeforces.maxRank || ''),
              problemsSolved: Number(s.codeforces.problemsSolved) || 0,
              contestCount: Number(s.codeforces.contestCount) || 0,
            }
          : undefined,
        codechef: s.codechef
          ? {
              username: String(s.codechef.username || ''),
              currentRating: Number(s.codechef.currentRating) || 0,
              highestRating: Number(s.codechef.highestRating) || 0,
              stars: Number(s.codechef.stars) || 0,
              contestCount: Number(s.codechef.contestCount) || 0,
              globalRank: Number(s.codechef.globalRank) || 0,
            }
          : undefined,
        github: s.github
          ? {
              username: String(s.github.username || ''),
              totalCommits: Number(s.github.totalCommits) || 0,
              publicRepos: Number(s.github.publicRepos) || 0,
              followers: Number(s.github.followers) || 0,
              starsReceived: Number(s.github.starsReceived) || 0,
              pullRequests: Number(s.github.pullRequests) || 0,
              issues: Number(s.github.issues) || 0,
            }
          : undefined,
      };

      return studentProfile;
    });

    // Save to cache
    cachedData = formattedList;
    lastCacheTime = Date.now();

    return NextResponse.json({
      success: true,
      cached: false,
      source: 'https://acmnitsurat.in',
      attribution: 'Official ACM NIT Surat Student Chapter Leaderboard (SVNIT)',
      count: formattedList.length,
      total: json.pagination?.total || formattedList.length,
      fetchedAt: new Date().toISOString(),
      data: formattedList,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch ACM NIT Surat data';

    // If fetch failed but we have an existing cache, return stale cache gracefully
    if (cachedData && cachedData.length > 0) {
      return NextResponse.json({
        success: true,
        cached: true,
        stale: true,
        source: 'https://acmnitsurat.in (offline fallback)',
        attribution: 'Official ACM NIT Surat Student Chapter Leaderboard (SVNIT)',
        warning: `Upstream unreachable (${errorMsg}), serving cached cohort.`,
        count: cachedData.length,
        fetchedAt: new Date(lastCacheTime).toISOString(),
        data: cachedData,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        source: 'https://acmnitsurat.in',
        attribution: 'Official ACM NIT Surat Student Chapter Leaderboard (SVNIT)',
      },
      { status: 502 }
    );
  }
}
