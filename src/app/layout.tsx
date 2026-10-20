import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { PWARegistration } from '@/components/PWARegistration';
import { OfflineBanner } from '@/components/OfflineBanner';

const geistSans = { variable: 'font-sans' };
const geistMono = { variable: 'font-mono' };

export const viewport: Viewport = {
  themeColor: '#06b6d4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://incursion-recruitment.vercel.app'
  ),
  title: {
    default: 'Incursion — Hackathon Team Recruitment Automation Tool',
    template: '%s | Incursion Recruitment Engine',
  },
  description:
    '100% Zero-cost ($0 API bills) recruitment automation platform for hackathon organizers. Features live GitHub velocity inspection, universal spreadsheet ingestion (Excel, Google Sheets, CSV, JSON), unpdf resume parsing, and a custom mathematical formula studio with zero database retention.',
  keywords: [
    'hackathon recruitment automation',
    'hackathon team shortlisting',
    'hackathon applicant ranking',
    'devpost csv parser',
    'typeform hackathon evaluator',
    'github velocity scoring',
    'resume parser hackathon',
    'google sheets hackathon intake',
    'excel recruitment ranker',
    'candidate screening tool',
    'explainable team selection',
    'track 3 autonomous recruiter',
    'zero cost recruitment tool',
  ],
  authors: [{ name: 'Incursion Engineering Team' }],
  creator: 'Incursion Platform',
  publisher: 'Incursion Platform',
  applicationName: 'Incursion',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/icon.svg'],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Incursion — Hackathon Team Recruitment Automation Tool',
    description:
      'Autonomous, explainable, and tunable team recruitment platform for hackathons. Zero API bills, zero database retention, and live dual-stream GitHub & resume scoring.',
    siteName: 'Incursion',
    images: [
      {
        url: '/logo.svg',
        width: 512,
        height: 512,
        alt: 'Incursion Cyber Logo — Autonomous Recruitment Engine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Incursion — Hackathon Team Recruitment Automation Tool',
    description:
      'Automated, tunable, and explainable team recruitment platform for hackathons with zero API bills and zero database retention.',
    images: ['/logo.svg'],
    creator: '@incursion_hq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured Data (JSON-LD) for Search Engines
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Incursion',
    url: 'https://incursion-recruitment.vercel.app',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    description:
      'Automated, tunable, and explainable recruitment and candidate shortlisting platform for hackathons.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Zero-cost $0 API bills with client-side NLP taxonomy matching',
      'Live GitHub commit velocity inspection with encrypted PAT vault',
      'Zero database retention with volatile in-memory processing',
      'Universal spreadsheet ingestion (Excel, Google Sheets, CSV, JSON)',
      'Dual-stream concurrent parallel scoring engine',
      'Custom mathematical formula sandbox expression studio',
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#030712] text-zinc-100 selection:bg-cyan-500 selection:text-black">
        <AppProvider>
          <OfflineBanner />
          {children}
          <PWARegistration />
        </AppProvider>
      </body>
    </html>
  );
}
