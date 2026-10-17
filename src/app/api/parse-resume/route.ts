import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { extractSkillsAndRoles } from '@/engine/taxonomy';
import { extractGithubUsername } from '@/engine/github';
import { extractWorkAndClubExperiences } from '@/engine/experienceParser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  // Match /file/d/<id>/
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Match id=<id>
  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  // Match /open?id=<id> or /uc?id=<id>
  const openMatch = url.match(/(?:open|uc)\?(?:[^&]+&)*id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) return openMatch[1];

  return null;
}

function normalizeCloudUrl(url: string): { fetchUrl: string; isGoogleDrive: boolean } {
  const trimmed = url.trim();

  // 1. Google Drive Link
  if (trimmed.includes('drive.google.com')) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      return {
        fetchUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        isGoogleDrive: true,
      };
    }
  }

  // 2. Dropbox Link
  if (trimmed.includes('dropbox.com')) {
    const urlObj = new URL(trimmed);
    urlObj.searchParams.set('dl', '1');
    return {
      fetchUrl: urlObj.toString(),
      isGoogleDrive: false,
    };
  }

  // 3. Direct PDF or other cloud URL
  return {
    fetchUrl: trimmed,
    isGoogleDrive: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let pdfBuffer: Uint8Array | null = null;
    let sourceUrl = '';
    let candidateName = '';

    let customKeywords: Array<{ keyword: string; weight: number }> = [];

    // Handle JSON payload containing a cloud URL (Google Drive, Dropbox, etc.)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      sourceUrl = body.url || '';
      candidateName = body.candidateName || '';
      if (Array.isArray(body.customKeywords)) {
        customKeywords = body.customKeywords;
      }

      if (!sourceUrl) {
        return NextResponse.json({ error: 'No resume URL provided' }, { status: 400 });
      }

      const { fetchUrl, isGoogleDrive } = normalizeCloudUrl(sourceUrl);

      // Fetch file server-side (bypassing browser CORS)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      let fetchRes: Response;
      try {
        fetchRes = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/pdf,application/octet-stream,*/*',
          },
          redirect: 'follow',
        });
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const errMsg = err instanceof Error ? err.message : 'Network fetch failed';
        return NextResponse.json(
          {
            success: false,
            status: 'fetch_error',
            error: `Failed to fetch remote resume: ${errMsg}`,
          },
          { status: 200 }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      if (!fetchRes.ok) {
        return NextResponse.json(
          {
            success: false,
            status: 'inaccessible',
            error: `Remote server returned HTTP ${fetchRes.status}. If this is Google Drive, verify sharing is set to "Anyone with the link".`,
          },
          { status: 200 }
        );
      }

      const arrayBuffer = await fetchRes.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Check if response is actually HTML instead of PDF (e.g. Google Drive login/permission page or virus warning)
      const firstBytes = new TextDecoder().decode(bytes.slice(0, 500)).toLowerCase();
      const isHtml = firstBytes.includes('<!doctype html') || firstBytes.includes('<html');

      if (isHtml) {
        // If Google Drive returned an HTML page instead of the binary PDF stream, it requires auth or is private
        if (isGoogleDrive) {
          return NextResponse.json(
            {
              success: false,
              status: 'inaccessible',
              error:
                'Google Drive link is private or requires authorization. Candidate must set sharing to "Anyone with the link can view".',
            },
            { status: 200 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            status: 'not_a_pdf',
            error: 'The provided link returned an HTML webpage instead of a PDF document.',
          },
          { status: 200 }
        );
      }

      pdfBuffer = bytes;
    } else if (contentType.includes('multipart/form-data')) {
      // Handle direct file upload via FormData
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      pdfBuffer = new Uint8Array(arrayBuffer);
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json(
        { success: false, status: 'empty', error: 'Empty file buffer received' },
        { status: 200 }
      );
    }

    // Extract text using unpdf
    let fullText = '';
    let totalPages = 1;

    try {
      const extracted = await extractText(pdfBuffer);
      fullText = Array.isArray(extracted.text) ? extracted.text.join('\n') : (extracted.text || '');
      totalPages = extracted.totalPages || 1;
    } catch (pdfErr: unknown) {
      const errMsg = pdfErr instanceof Error ? pdfErr.message : 'Unknown PDF parse error';
      return NextResponse.json(
        {
          success: false,
          status: 'corrupt_pdf',
          error: `PDF document parsing error: ${errMsg}`,
        },
        { status: 200 }
      );
    }

    // Process extracted text through our deterministic taxonomy NLP scanner
    const taxonomy = extractSkillsAndRoles(fullText);

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

    // Scan for portfolio or custom domain
    let embeddedPortfolio: string | undefined;
    const portMatch = fullText.match(/(?:https?:\/\/)?([a-zA-Z0-9-_]+\.(?:dev|me|io|tech|app|vercel\.app|netlify\.app))\b/i);
    if (portMatch && portMatch[0]) {
      embeddedPortfolio = portMatch[0].startsWith('http') ? portMatch[0] : `https://${portMatch[0]}`;
    }

    // Extract work experiences, research internships, tier-1 companies, spam, clubs, and custom keywords
    const expAnalysis = extractWorkAndClubExperiences(fullText, customKeywords);

    return NextResponse.json({
      success: true,
      status: 'parsed',
      candidateName,
      totalPages,
      textLength: fullText.length,
      extracted: {
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
        snippet: fullText.slice(0, 300).replace(/\s+/g, ' ').trim(),
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json(
      { success: false, status: 'error', error: errMsg },
      { status: 500 }
    );
  }
}
