// Zero-cost GitHub analyzer & client-side caching

export interface GitHubStats {
  username: string;
  publicRepos: number;
  originalRepos: number;
  forkedRepos: number;
  totalStars: number;
  estimatedContributions: number;
  topLanguages: string[];
  isSuspicious: boolean;
  suspiciousReason?: string;
  avatarUrl?: string;
  isHeuristicFallback?: boolean;
  fallbackHash?: number;
  syncStatus?: 'live_verified' | 'fallback_hash' | 'rate_limited';
}

// In-memory cache for the session to prevent duplicate network calls
const GITHUB_CACHE = new Map<string, GitHubStats>();

export function clearGitHubUserCache(username?: string): void {
  if (username) {
    GITHUB_CACHE.delete(username.replace(/^@/, '').trim().toLowerCase());
  } else {
    GITHUB_CACHE.clear();
  }
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetDate: Date;
  isAuthenticated: boolean;
}

export async function checkGitHubRateLimit(userToken?: string): Promise<RateLimitInfo> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (userToken) {
    headers.Authorization = `token ${userToken}`;
  }
  try {
    const res = await fetch('https://api.github.com/rate_limit', { headers });
    if (res.ok) {
      const data = await res.json();
      const core = data.resources?.core;
      return {
        limit: core?.limit || (userToken ? 5000 : 60),
        remaining: core?.remaining || 0,
        resetDate: new Date((core?.reset || 0) * 1000),
        isAuthenticated: Boolean(userToken),
      };
    }
  } catch {
    // fallback
  }
  return {
    limit: userToken ? 5000 : 60,
    remaining: userToken ? 5000 : 60,
    resetDate: new Date(Date.now() + 3600000),
    isAuthenticated: Boolean(userToken),
  };
}

export function extractGithubUsername(urlOrHandle: string): string | null {
  if (!urlOrHandle) return null;
  const trimmed = urlOrHandle.trim();
  // match https://github.com/username or github.com/username or @username or username
  const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-_]+)\/?/i);
  if (match && match[1]) {
    const user = match[1].toLowerCase();
    if (user !== 'null' && user !== 'undefined' && user !== 'none' && user !== 'orgs') {
      return match[1];
    }
  }
  // Check if handle is just @handle or username
  const handleMatch = trimmed.match(/^@?([a-zA-Z0-9-_]{1,39})$/);
  if (handleMatch && handleMatch[1]) {
    const handle = handleMatch[1].toLowerCase();
    if (handle !== 'none' && handle !== 'null' && handle !== 'na' && handle !== 'n/a') {
      return handleMatch[1];
    }
  }
  return null;
}

export async function fetchGitHubStats(
  username: string,
  userToken?: string
): Promise<GitHubStats> {
  const cleanUser = username.replace(/^@/, '').trim();
  const cached = GITHUB_CACHE.get(cleanUser);
  if (cached) {
    // If cached as a rate limited fallback and a new token was supplied, bypass cache and attempt live fetch
    if (!(cached.isHeuristicFallback && userToken)) {
      return cached;
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (userToken) {
    headers.Authorization = `token ${userToken}`;
  }

  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`, {
      headers,
    });

    if (userRes.status === 404) {
      const notFoundStats: GitHubStats = {
        username: cleanUser,
        publicRepos: 0,
        originalRepos: 0,
        forkedRepos: 0,
        totalStars: 0,
        estimatedContributions: 0,
        topLanguages: [],
        isSuspicious: true,
        suspiciousReason: 'GitHub profile does not exist (404)',
        isHeuristicFallback: false,
        syncStatus: 'live_verified',
      };
      GITHUB_CACHE.set(cleanUser, notFoundStats);
      return notFoundStats;
    }

    if (!userRes.ok) {
      // If rate limited (status 403) or network issue, generate reasonable heuristic fallback based on username
      const isRateLimited = userRes.status === 403;
      const fallback = generateHeuristicFallback(cleanUser, isRateLimited);
      GITHUB_CACHE.set(cleanUser, fallback);
      return fallback;
    }

    const userData = await userRes.json();
    const publicRepos = userData.public_repos || 0;

    // Fetch user repos to analyze original vs forked and stars
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=100&sort=pushed`,
      { headers }
    );

    let originalRepos = 0;
    let forkedRepos = 0;
    let totalStars = 0;
    const languageCounts: Record<string, number> = {};

    if (reposRes.ok) {
      const repos = await reposRes.json();
      if (Array.isArray(repos)) {
        for (const repo of repos) {
          if (repo.fork) {
            forkedRepos++;
          } else {
            originalRepos++;
          }
          totalStars += repo.stargazers_count || 0;
          if (repo.language) {
            languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
          }
        }
      }
    } else {
      originalRepos = Math.round(publicRepos * 0.7);
      forkedRepos = publicRepos - originalRepos;
    }

    const topLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([lang]) => lang);

    // Heuristic estimation of annual activity based on repos, stars, and age
    const estimatedContributions = Math.max(
      10,
      Math.min(1200, originalRepos * 22 + totalStars * 15 + (userData.followers || 0) * 8)
    );

    // Suspicious profile detection
    let isSuspicious = false;
    let suspiciousReason: string | undefined;

    if (publicRepos > 15 && originalRepos === 0) {
      isSuspicious = true;
      suspiciousReason = 'Account has multiple repositories but 100% are forked';
    } else if (publicRepos === 0 && (userData.followers || 0) === 0) {
      isSuspicious = true;
      suspiciousReason = 'Empty GitHub profile (0 public repos, 0 followers)';
    }

    const stats: GitHubStats = {
      username: cleanUser,
      publicRepos,
      originalRepos,
      forkedRepos,
      totalStars,
      estimatedContributions,
      topLanguages,
      isSuspicious,
      suspiciousReason,
      avatarUrl: userData.avatar_url,
      isHeuristicFallback: false,
      fallbackHash: undefined,
      syncStatus: 'live_verified',
    };

    GITHUB_CACHE.set(cleanUser, stats);
    return stats;
  } catch {
    return generateHeuristicFallback(cleanUser, false);
  }
}

/**
 * Deterministic offline fallback in case of rate limits or offline use.
 * Produces realistic, stable numbers based on string hash so results are 100% reproducible.
 */
export function generateHeuristicFallback(
  username: string,
  isRateLimited: boolean = false
): GitHubStats {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const publicRepos = (positiveHash % 28) + 3;
  const forkedRepos = positiveHash % 5;
  const originalRepos = Math.max(1, publicRepos - forkedRepos);
  const totalStars = (positiveHash % 15) * 3;
  const estimatedContributions = (positiveHash % 350) + 45;

  const sampleLanguages = ['TypeScript', 'Python', 'JavaScript', 'Rust', 'Go', 'C++', 'Java'];
  const topLanguages = [
    sampleLanguages[positiveHash % sampleLanguages.length],
    sampleLanguages[(positiveHash + 2) % sampleLanguages.length],
  ];

  return {
    username,
    publicRepos,
    originalRepos,
    forkedRepos,
    totalStars,
    estimatedContributions,
    topLanguages,
    isSuspicious: false,
    isHeuristicFallback: true,
    fallbackHash: positiveHash,
    syncStatus: isRateLimited ? 'rate_limited' : 'fallback_hash',
  };
}
