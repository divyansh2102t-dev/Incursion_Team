import { NextRequest, NextResponse } from 'next/server';
import { extractGoogleSheetsExportUrl } from '@/engine/parser';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: 'Missing required query parameter: url' },
      { status: 400 }
    );
  }

  return handleFetchSheet(targetUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetUrl = body?.url;

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: url' },
        { status: 400 }
      );
    }

    return handleFetchSheet(targetUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

async function handleFetchSheet(rawUrl: string) {
  try {
    const exportUrl = extractGoogleSheetsExportUrl(rawUrl);

    if (!exportUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid Google Sheets URL. Please provide a valid link (e.g. docs.google.com/spreadsheets/d/...)',
        },
        { status: 400 }
      );
    }

    // Server-side fetch to bypass browser CORS
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 IncursionRecruiter/1.0',
        Accept: 'text/csv,text/plain,*/*',
      },
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Google Sheets returned HTTP ${response.status}. Please check permissions or spreadsheet ID.`,
        },
        { status: 400 }
      );
    }

    const text = await response.text();

    // Check if Google redirected to a sign-in HTML page (happens if sheet is private)
    const lowerText = text.trim().toLowerCase();
    if (
      lowerText.startsWith('<!doctype html') ||
      lowerText.includes('<html') ||
      lowerText.includes('service login') ||
      lowerText.includes('accounts.google.com')
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This Google Sheet is private. In Google Sheets, click 'Share' -> change to 'Anyone with the link can view' -> try again.",
        },
        { status: 403 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'The fetched Google Sheet is empty.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      csvContent: text,
      sourceUrl: rawUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch Google Sheet';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
