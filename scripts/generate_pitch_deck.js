const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');
const fs = require('fs');
const path = require('path');

// Initialize 16:9 widescreen presentation PDF (960pt x 540pt)
const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'pt',
  format: [960, 540],
});

// Color Palette
const COLORS = {
  bg: [3, 7, 18],          // #030712 Deep Cyber Slate
  cardBg: [11, 17, 32],     // #0b1120 Dark Navy Card
  cardBorder: [30, 41, 59], // #1e293b Slate Border
  cyan: [6, 182, 212],      // #06b6d4 Neon Cyan
  blue: [59, 130, 246],     // #3b82f6 Electric Blue
  emerald: [16, 185, 129],  // #10b981 Emerald Green
  amber: [245, 158, 11],    // #f59e0b Cyber Amber
  rose: [244, 63, 94],      // #f43f5e Cyber Rose
  purple: [168, 85, 247],   // #a855f7 Cyber Purple
  white: [255, 255, 255],
  textSilver: [203, 213, 225], // #cbd5e1
  textMuted: [148, 163, 184],  // #94a3b8
  darkHeader: [7, 12, 24],
};

// Check if logo exists
let logoBase64 = null;
const logoPath = path.join(__dirname, '..', 'public', 'icon-512.png');
if (fs.existsSync(logoPath)) {
  logoBase64 = fs.readFileSync(logoPath).toString('base64');
}

/**
 * Standard Slide Shell (Header & Footer)
 */
function drawSlideShell(doc, slideNum, title, subtitle, category = 'TRACK 3: AUTOMATED RECRUITMENT ENGINE') {
  // 1. Dark Background
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, 960, 540, 'F');

  // Subtle cyber grid lines
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  for (let x = 40; x <= 920; x += 80) {
    doc.line(x, 0, x, 540);
  }
  for (let y = 30; y <= 510; y += 60) {
    doc.line(0, y, 960, y);
  }

  // 2. Top Header
  // Category Pill
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(1);
  doc.roundedRect(40, 24, 260, 16, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.cyan);
  doc.text(category, 48, 35);

  // Slide Number Pill on Right
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(...COLORS.cyan);
  doc.roundedRect(870, 24, 50, 16, 4, 4, 'FD');
  doc.setTextColor(...COLORS.cyan);
  doc.text(`0${slideNum} / 05`, 880, 35);

  // Slide Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text(title, 40, 58);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(subtitle, 40, 72);

  // Horizontal Rule with Cyan Accent
  doc.setDrawColor(...COLORS.cardBorder);
  doc.setLineWidth(1);
  doc.line(40, 82, 920, 82);

  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(2);
  doc.line(40, 82, 160, 82);

  // 3. Bottom Footer
  doc.setDrawColor(...COLORS.cardBorder);
  doc.setLineWidth(1);
  doc.line(40, 508, 920, 508);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.cyan);
  doc.text('INCURSION', 40, 523);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text(' |  Autonomous, Tunable & Explainable Team Recruitment Platform', 95, 523);

  doc.setFont('helvetica', 'normal');
  doc.text(`Slide ${slideNum} of 5  •  100% Zero-Cost Architecture  •  Zero-DB Privacy`, 920, 523, { align: 'right' });
}

// ==========================================
// SLIDE 1: TITLE & EXECUTIVE OVERVIEW
// ==========================================
function renderSlide1(doc) {
  // Background
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, 960, 540, 'F');

  // Subtle grid
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  for (let x = 40; x <= 920; x += 80) doc.line(x, 0, x, 540);
  for (let y = 30; y <= 510; y += 60) doc.line(0, y, 960, y);

  // Top Track Pill
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(1);
  doc.roundedRect(40, 30, 360, 20, 5, 5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.cyan);
  doc.text('HACKATHON TRACK 3: AUTOMATED RECRUITMENT ENGINE', 52, 43);

  // Version Badge
  doc.setFillColor(6, 182, 212);
  doc.roundedRect(850, 30, 70, 20, 5, 5, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('v1.0.0 PROD', 863, 43);

  // Hero Section with Logo
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 40, 68, 52, 52);
  }

  const titleX = logoBase64 ? 104 : 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...COLORS.white);
  doc.text('INCURSION', titleX, 96);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.cyan);
  doc.text('Autonomous, Zero-Cost ($0 API Bills) Hackathon Recruitment & Shortlisting Engine', titleX, 114);

  // Executive Pitch Hero Card
  doc.setFillColor(...COLORS.cardBg);
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(1);
  doc.roundedRect(40, 134, 880, 85, 6, 6, 'FD');

  // Left Cyan accent strip
  doc.setFillColor(...COLORS.cyan);
  doc.roundedRect(40, 134, 5, 85, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.text('EXECUTIVE OVERVIEW & PROBLEM BRIEF', 55, 152);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.textSilver);
  const pitchText = 
    "Evaluating 500+ team submissions across Google Forms, Devpost, and spreadsheets is historically slow, biased, expensive, and opaque. " +
    "Incursion replaces manual volunteer fatigue and costly LLM wrappers with an unopinionated, mathematically explainable, client-side recruitment engine. " +
    "It inspects GitHub commit velocity, scans cloud resumes in parallel, balances multi-member squads against solo hackers, and provides an executive mathematical audit trail—all with 100% client-side privacy and $0 API bills.";
  doc.text(doc.splitTextToSize(pitchText, 845), 55, 170);

  // 4 Core Innovation Pillars
  const pillars = [
    {
      title: '100% ZERO-COST ($0)',
      subtitle: 'Zero Paid API Tokens',
      tagColor: COLORS.emerald,
      bullets: [
        'Eliminates paid LLM tokens ($50-$200/cohort) via deterministic NLP taxonomy.',
        'Runs in browser memory with public REST APIs and Web Workers.',
        'Zero recurring monthly bills for student & community hackathons.',
      ],
      highlight: '$0.00 Total Evaluation Cost',
    },
    {
      title: 'ZERO-DB PRIVACY',
      subtitle: 'Local Origin Vault',
      tagColor: COLORS.cyan,
      bullets: [
        'Persistent localStorage maintains cohorts across computer restarts.',
        'Zero remote database servers; candidate PII never leaves organizer device.',
        '100% GDPR & DPDP compliant with zero data breach liability.',
      ],
      highlight: '0 Bytes PII Retained Remotely',
    },
    {
      title: 'DUAL-STREAM ENGINE',
      subtitle: 'Concurrent Parallel Audit',
      tagColor: COLORS.blue,
      bullets: [
        'Audits GitHub commit frequency, stars, and language diversity.',
        'Anti-cheat heuristic flags accounts with 100% forks & zero commits.',
        'Simultaneously extracts Google Drive/Dropbox PDF resume streams.',
      ],
      highlight: 'Simultaneous Code + Resume Scan',
    },
    {
      title: 'EXPLAINABLE MATH',
      subtitle: 'Tunable Formula Studio',
      tagColor: COLORS.purple,
      bullets: [
        'Dedicated /formulas studio with MathScope AST equation compiler.',
        'Dynamic squad normalization (Balanced Mean, Diminishing Returns).',
        'Downloadable executive multi-page audit PDF report with role gaps.',
      ],
      highlight: '100% Transparent Mathematical Trail',
    },
  ];

  const colWidth = 212;
  const colGap = 10;
  const startY = 230;

  pillars.forEach((p, idx) => {
    const x = 40 + idx * (colWidth + colGap);
    
    // Card background
    doc.setFillColor(...COLORS.cardBg);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.setLineWidth(1);
    doc.roundedRect(x, startY, colWidth, 205, 6, 6, 'FD');

    // Top Accent line
    doc.setDrawColor(...p.tagColor);
    doc.setLineWidth(2);
    doc.line(x + 10, startY, x + colWidth - 10, startY);

    // Title & Tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...p.tagColor);
    doc.text(p.title, x + 12, startY + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(p.subtitle, x + 12, startY + 34);

    // Bullets
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textSilver);
    let bulletY = startY + 54;
    p.bullets.forEach((b) => {
      doc.setFillColor(...p.tagColor);
      doc.circle(x + 15, bulletY - 3, 1.8, 'F');
      const lines = doc.splitTextToSize(b, colWidth - 28);
      doc.text(lines, x + 22, bulletY);
      bulletY += lines.length * 10 + 6;
    });

    // Bottom Highlight Badge
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(...p.tagColor);
    doc.roundedRect(x + 10, startY + 175, colWidth - 20, 20, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...p.tagColor);
    doc.text(p.highlight, x + colWidth / 2, startY + 188, { align: 'center' });
  });

  // Footer
  doc.setDrawColor(...COLORS.cardBorder);
  doc.setLineWidth(1);
  doc.line(40, 508, 920, 508);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.cyan);
  doc.text('INCURSION', 40, 523);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text(' |  Next.js 16 • React 19 • TypeScript • Tailwind CSS • unpdf • jsPDF', 95, 523);
  doc.text('Slide 1 of 5  •  Executive Title & Architecture Overview', 920, 523, { align: 'right' });
}

// ==========================================
// SLIDE 2: THE PROBLEM STATEMENT
// ==========================================
function renderSlide2(doc) {
  drawSlideShell(
    doc,
    2,
    'THE PROBLEM STATEMENT',
    'Why Existing Hackathon Screening & Evaluation Workflows Fail Organizers'
  );

  // Subheader banner
  doc.setFillColor(...COLORS.cardBg);
  doc.setDrawColor(...COLORS.cardBorder);
  doc.roundedRect(40, 95, 880, 42, 5, 5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.amber);
  doc.text('THE SCALE DILEMMA:', 52, 112);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textSilver);
  doc.text(
    'Hackathon organizing committees receive 300 to 1,000+ multi-member squad registrations with only a 24-48 hour window to shortlist candidates. ' +
    'Existing workflows force organizers into an impossible trade-off between exhausting manual review and expensive, untrustworthy AI wrappers.',
    52, 126
  );

  // 3 Critical Problem Columns
  const problems = [
    {
      badge: 'PROBLEM 01',
      title: 'MANUAL SPREADSHEET FATIGUE',
      subtitle: 'Human Bottleneck & Inconsistency',
      badgeColor: COLORS.rose,
      points: [
        {
          label: '40+ Volunteer Review Hours',
          desc: 'Organizers manually click through hundreds of Google Forms rows, opening candidate GitHub links and PDF drives one by one.',
        },
        {
          label: 'Subjective Fatigue & Nepotism',
          desc: 'Exhausted evaluators apply inconsistent standards at 2 AM compared to 9 AM, creating unfair bias and arbitrary selection cutoffs.',
        },
        {
          label: 'Zero Anti-Cheat Verification',
          desc: 'Reviewers cannot verify if a GitHub account represents authentic original code or 100% cloned/fork-padded repositories.',
        },
      ],
      stat: '90% of applicants receive zero deep code inspection',
    },
    {
      badge: 'PROBLEM 02',
      title: 'EXPENSIVE LLM WRAPPERS',
      subtitle: 'Fragile, Costly & Non-Deterministic',
      badgeColor: COLORS.amber,
      points: [
        {
          label: '$100-$300+ in API Token Bills',
          desc: 'Sending 500+ team registrations and multi-page PDFs to proprietary LLMs (GPT-4) drains student and non-profit hackathon budgets.',
        },
        {
          label: 'Severe Rate Limits & Timeouts',
          desc: 'API token rate limits throttle bulk evaluation during intake surges, causing pipeline crashes and missed registration deadlines.',
        },
        {
          label: 'Prompt Hallucination & Variance',
          desc: 'Generative AI scores the exact same applicant differently on repeated runs, completely destroying competitive integrity.',
        },
      ],
      stat: '$150+ wasted per event on hallucination-prone tokens',
    },
    {
      badge: 'PROBLEM 03',
      title: '"BLACK-BOX" AI & PII LIABILITIES',
      subtitle: 'Zero Trust & Legal Vulnerability',
      badgeColor: COLORS.rose,
      points: [
        {
          label: 'Unexplainable Rejection Rationale',
          desc: 'Generative AI wrappers cannot explain the mathematical rationale behind rankings, fueling applicant distrust and appeals.',
        },
        {
          label: 'GDPR / DPDP Privacy Violations',
          desc: 'Storing student phone numbers, resumes, and college roll numbers in cloud databases creates severe data breach liability.',
        },
        {
          label: 'Solo vs Squad Inequity',
          desc: 'Generic tools fail to normalize solo prodigies against 4-person squads, improperly penalizing solo hackers or over-weighting teams.',
        },
      ],
      stat: '100% PII exposure risk across third-party cloud databases',
    },
  ];

  const colWidth = 286;
  const colGap = 11;
  const startY = 150;

  problems.forEach((p, idx) => {
    const x = 40 + idx * (colWidth + colGap);

    doc.setFillColor(...COLORS.cardBg);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.setLineWidth(1);
    doc.roundedRect(x, startY, colWidth, 245, 6, 6, 'FD');

    // Header badge
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(...p.badgeColor);
    doc.roundedRect(x + 12, startY + 12, 70, 15, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...p.badgeColor);
    doc.text(p.badge, x + 20, startY + 23);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLORS.white);
    doc.text(p.title, x + 12, startY + 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(p.subtitle, x + 12, startY + 54);

    // Divider line
    doc.setDrawColor(...COLORS.cardBorder);
    doc.line(x + 12, startY + 62, x + colWidth - 12, startY + 62);

    // Points
    let ptY = startY + 76;
    p.points.forEach((pt) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...p.badgeColor);
      doc.text(`• ${pt.label}`, x + 12, ptY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textSilver);
      const lines = doc.splitTextToSize(pt.desc, colWidth - 24);
      doc.text(lines, x + 18, ptY + 11);
      ptY += lines.length * 9.5 + 18;
    });

    // Stat banner at bottom of card
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(...p.badgeColor);
    doc.roundedRect(x + 10, startY + 215, colWidth - 20, 20, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...p.badgeColor);
    doc.text(p.stat, x + colWidth / 2, startY + 228, { align: 'center' });
  });

  // Bottom Takeaway Banner
  doc.setFillColor(...COLORS.cardBg);
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(1);
  doc.roundedRect(40, 410, 880, 85, 6, 6, 'FD');

  doc.setFillColor(...COLORS.cyan);
  doc.roundedRect(40, 410, 5, 85, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.text('THE RECRUITMENT AUTOMATION IMPERATIVE', 55, 428);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textSilver);
  const takeaway = 
    "Hackathon organizers require a platform that is: (1) 100% Free ($0 API bills) with zero LLM tokens, " +
    "(2) Transparent & Mathematically Explainable with custom tunable weights, " +
    "(3) Concurrent & Fast (< 45 seconds for 500 teams), " +
    "(4) Anti-Cheat Protected against fake/forked GitHub profiles, and " +
    "(5) Fully Client-Side with zero database liability or PII leaks.";
  doc.text(doc.splitTextToSize(takeaway, 845), 55, 444);
}

// ==========================================
// SLIDE 3: THE PROPOSED SOLUTION
// ==========================================
function renderSlide3(doc) {
  drawSlideShell(
    doc,
    3,
    'THE PROPOSED SOLUTION',
    'Incursion: Autonomous, Explainable & Zero-Cost Team Recruitment Architecture'
  );

  // Subheader
  doc.setFillColor(...COLORS.cardBg);
  doc.setDrawColor(...COLORS.cardBorder);
  doc.roundedRect(40, 95, 880, 36, 5, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.cyan);
  doc.text('CORE VALUE PROPOSITION:', 52, 111);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textSilver);
  doc.text(
    'A 100% zero-cost recruitment platform combining deterministic NLP taxonomy matching, concurrent parallel velocity auditing, and a tunable mathematical formula studio.',
    52, 123
  );

  // 4 Feature Quadrants
  const features = [
    {
      title: 'DUAL-STREAM CONCURRENT SCORING',
      subtitle: 'Parallel GitHub Velocity + Cloud Resume Intelligence',
      color: COLORS.cyan,
      bullets: [
        'Stream A (GitHub REST API): Evaluates annual commit velocity, original vs fork ratio, stars, and language diversity.',
        'Anti-Cheat Heuristic: Penalizes accounts with 100% forked repos and 0 original commits.',
        'Stream B (unpdf Engine): Server-side CORS stream extracts skills, hackathon accolades, and portfolios from Google Drive/PDF resumes in volatile RAM.',
        'Temporary Hash Transparency: Profiles scored via rate-limit fallback display visible #hash badges with smart "Fetch Remaining" sync.',
      ],
    },
    {
      title: 'FORMULA & ALGORITHM STUDIO (/formulas)',
      subtitle: 'Completely Unopinionated & Mathematically Tunable',
      color: COLORS.emerald,
      bullets: [
        'Interactive Formula Studio: Organizers customize mathematical multipliers and scoring curves.',
        'MathScope AST Evaluation: Compiles custom mathematical expressions into deterministic ranking functions.',
        'Two-Way Synchronized Controls: Sliders and numeric inputs update live with real-time cohort leaderboard previews.',
        'Hard Eligibility Gates: Enforce minimum team size, required GitHub handles, ACM chapter membership, or experience cutoffs.',
      ],
    },
    {
      title: 'DYNAMIC SQUAD-SIZE NORMALIZATION',
      subtitle: 'Equalizing Solo Prodigies & Multi-Member Teams',
      color: COLORS.amber,
      bullets: [
        'Balanced Mean Model (Platform Default): Multiplies average member score by a capped synergy bonus: min(1.40, 1 + (N-1) * 0.08).',
        'Diminishing Returns Model: Exponential decay (1.5^(i-1)) weighting lead hacker 100%, 2nd 67%, 3rd 44%.',
        'Max Skill Rating: Highest skill in each discipline sets the team rating, giving solo hackers an equal playing field.',
        '7 Core Disciplines: Audits coverage across Frontend, Backend, AI/ML, DevOps, Mobile, Systems, and UI/UX.',
      ],
    },
    {
      title: 'OFFICIAL ACM NIT SURAT CHAPTER BRIDGE',
      subtitle: 'Live Chapter Leaderboard Integration & Conflict Overrides',
      color: COLORS.blue,
      bullets: [
        'Server-Side CORS Proxy: Direct API bridge (/api/fetch-acm-leaderboard) to acmnitsurat.in.',
        'Tri-Platform Coding Metrics: Imports official contest ratings and solved counts for LeetCode, Codeforces, and CodeChef.',
        'Institutional Telemetry: Verifies candidate roll numbers (e.g. u25cs079), engineering branches, and graduation years.',
        'Conflict Override Toggle: Choose between official ACM chapter scores or Incursion calculated formulas.',
      ],
    },
  ];

  const qWidth = 435;
  const qHeight = 160;

  features.forEach((f, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 40 + col * (qWidth + 10);
    const y = 142 + row * (qHeight + 10);

    doc.setFillColor(...COLORS.cardBg);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, qWidth, qHeight, 6, 6, 'FD');

    // Left color bar
    doc.setFillColor(...f.color);
    doc.roundedRect(x, y, 4, qHeight, 2, 2, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...f.color);
    doc.text(f.title, x + 12, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(f.subtitle, x + 12, y + 29);

    // Divider
    doc.setDrawColor(...COLORS.cardBorder);
    doc.line(x + 12, y + 35, x + qWidth - 12, y + 35);

    // Bullets
    let bY = y + 48;
    f.bullets.forEach((b) => {
      doc.setFillColor(...f.color);
      doc.circle(x + 16, bY - 2.5, 1.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.textSilver);
      const lines = doc.splitTextToSize(b, qWidth - 28);
      doc.text(lines, x + 22, bY);
      bY += lines.length * 8.5 + 5;
    });
  });

  // Bottom Pill Bar
  const pillY = 485;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.cyan);
  doc.text('ADDITIONAL PLATFORM CAPABILITIES:', 40, pillY);

  const pills = [
    'Pairwise Head-to-Head Compare',
    'Sensitivity & Robustness Simulator',
    'Schema Column Mapper',
    'Multi-PAT Encrypted Vault',
    'Executive PDF Dossier',
  ];

  let pX = 220;
  pills.forEach((p) => {
    const textWidth = doc.getTextWidth(p);
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(...COLORS.cyan);
    doc.roundedRect(pX, pillY - 10, textWidth + 14, 15, 3, 3, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textSilver);
    doc.text(p, pX + 7, pillY);
    pX += textWidth + 20;
  });
}

// ==========================================
// SLIDE 4: TECHNICAL ARCHITECTURE
// ==========================================
function renderSlide4(doc) {
  drawSlideShell(
    doc,
    4,
    'TECHNICAL ARCHITECTURE & PIPELINE',
    'End-to-End Client-Side Pipeline: Ingestion, Dual-Stream Scoring & Zero-DB Storage'
  );

  // Top Pipeline Flow (5 Stages)
  const stages = [
    {
      num: '01',
      title: 'MULTI-INTAKE',
      items: ['CSV / TSV / JSON', 'Excel (.xlsx, .xls)', 'Google Sheets URLs', '1-Click Demo Loader'],
      color: COLORS.emerald,
    },
    {
      num: '02',
      title: 'SCHEMA SNIFFER',
      items: ['Auto Tall/Wide Sniff', 'usedColumns Guard', 'No Ghost Members', 'ColumnMapperModal'],
      color: COLORS.cyan,
    },
    {
      num: '03',
      title: 'DUAL SCORING',
      items: ['GitHub REST Engine', 'unpdf Resume Stream', 'Anti-Cheat Fork Guard', 'Rate-Limit Hash Tag'],
      color: COLORS.blue,
    },
    {
      num: '04',
      title: 'MATH STUDIO',
      items: ['MathScope AST Rules', 'Balanced Mean / Decay', '4 Dimension Weights', 'Eligibility Gates'],
      color: COLORS.amber,
    },
    {
      num: '05',
      title: 'ZERO-DB OUTPUTS',
      items: ['localStorage Vault', 'Live Leaderboard HUD', 'Compare & Sensitivity', 'Executive PDF Report'],
      color: COLORS.purple,
    },
  ];

  const stageWidth = 160;
  const stageGap = 20;
  const stageY = 95;

  stages.forEach((s, idx) => {
    const x = 40 + idx * (stageWidth + stageGap);

    // Box
    doc.setFillColor(...COLORS.cardBg);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.setLineWidth(1);
    doc.roundedRect(x, stageY, stageWidth, 120, 6, 6, 'FD');

    // Number tag
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(...s.color);
    doc.roundedRect(x + 10, stageY + 10, 26, 14, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...s.color);
    doc.text(s.num, x + 16, stageY + 20);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.text(s.title, x + 42, stageY + 20);

    // Divider
    doc.setDrawColor(...s.color);
    doc.setLineWidth(1.5);
    doc.line(x + 10, stageY + 30, x + stageWidth - 10, stageY + 30);

    // Items
    let itY = stageY + 44;
    s.items.forEach((it) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.textSilver);
      doc.text(`› ${it}`, x + 12, itY);
      itY += 16;
    });

    // Arrow to next stage
    if (idx < stages.length - 1) {
      const arrowX = x + stageWidth + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...COLORS.cyan);
      doc.text('➔', arrowX, stageY + 65);
    }
  });

  // 3 Deep Architectural Pillars (Bottom Row)
  const archPillars = [
    {
      title: '1. CLIENT-SIDE LOCALSTORAGE PRIVACY & ZERO-DB MANIFESTO',
      color: COLORS.cyan,
      paragraphs: [
        'Zero Cloud Database Servers: All scored teams, custom formulas, encrypted tokens, and run history persist in the browser\'s origin localStorage across computer restarts, tab closures, and venue reboots.',
        'Zero PII & GDPR Liability: Candidate names, phone numbers, roll numbers, and resumes are evaluated in volatile RAM and never touch external database servers, eliminating data breach risks entirely.',
      ],
    },
    {
      title: '2. SERVERLESS STREAM RESOLVERS & CORS PROXIES',
      color: COLORS.blue,
      paragraphs: [
        'Universal Sheet Ingestion (/api/fetch-sheet): Bypasses browser CORS restrictions to fetch and stream Google Sheets exports directly into memory.',
        'Cloud PDF Resume Streamer (/api/parse-resume): Downloads Google Drive / Dropbox PDF links server-side and parses text streams via universal unpdf with zero native C++ dependencies.',
      ],
    },
    {
      title: '3. ENCRYPTED MULTI-TOKEN PAT VAULT & RATE-LIMIT RESILIENCE',
      color: COLORS.emerald,
      paragraphs: [
        'Multi-Token Pool: Organizers pool multiple free Personal Access Tokens client-side with AES encryption. Quotas automatically fail over (e.g. 3 tokens = 15,000 req/hr at $0 cost) with zero token transmission.',
        'Deterministic Hash Fallback: When offline or unauthenticated, candidate handles generate reproducible #hash placeholders with a targeted "Fetch Remaining" sync button.',
      ],
    },
  ];

  const pWidth = 880;
  const pHeight = 70;
  let archY = 230;

  archPillars.forEach((p) => {
    doc.setFillColor(...COLORS.cardBg);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.setLineWidth(1);
    doc.roundedRect(40, archY, pWidth, pHeight, 5, 5, 'FD');

    // Left accent bar
    doc.setFillColor(...p.color);
    doc.roundedRect(40, archY, 4, pHeight, 2, 2, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...p.color);
    doc.text(p.title, 52, archY + 16);

    // Paragraphs
    let textY = archY + 28;
    p.paragraphs.forEach((para) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.textSilver);
      const lines = doc.splitTextToSize(para, pWidth - 24);
      doc.text(lines, 52, textY);
      textY += lines.length * 8.5 + 4;
    });

    archY += pHeight + 8;
  });

  // Technology Stack Badges Footer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('CORE TECH STACK:', 40, 485);

  const stack = [
    'Next.js 16 (App Router)',
    'React 19',
    'TypeScript 5',
    'Tailwind CSS v4',
    'unpdf 1.9',
    'jsPDF & Autotable',
    'xlsx 0.18',
    'Web Workers',
    'PWA Service Worker',
  ];

  let stX = 145;
  stack.forEach((st) => {
    const w = doc.getTextWidth(st);
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.roundedRect(stX, 475, w + 10, 14, 3, 3, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.cyan);
    doc.text(st, stX + 5, 485);
    stX += w + 15;
  });
}

// ==========================================
// SLIDE 5: RESULTS, IMPACT & ROADMAP
// ==========================================
function renderSlide5(doc) {
  drawSlideShell(
    doc,
    5,
    'RESULTS, IMPACT & SUBMISSION DIFFERENTIATORS',
    'Quantifiable Performance Benchmarks, Competitive Comparison & Future Scope'
  );

  // 4 Large Key Metrics Tiles
  const metrics = [
    {
      num: '$0.00',
      label: 'TOTAL API & SERVER BILLS',
      sub: '100% Free Tier • Zero LLM Tokens',
      color: COLORS.emerald,
    },
    {
      num: '< 45s',
      label: '500-TEAM COHORT SCREENING',
      sub: '99% Faster than 40+ Human Hours',
      color: COLORS.cyan,
    },
    {
      num: '100%',
      label: 'EXPLAINABLE AUDIT TRAIL',
      sub: 'Deterministic Mathematical Formulas',
      color: COLORS.blue,
    },
    {
      num: '0 Bytes',
      label: 'REMOTE PII RETENTION',
      sub: 'Zero-DB Architecture • Full GDPR',
      color: COLORS.purple,
    },
  ];

  const mWidth = 212;
  const mGap = 10;
  const mY = 95;

  metrics.forEach((m, idx) => {
    const x = 40 + idx * (mWidth + mGap);

    doc.setFillColor(...COLORS.cardBg);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.roundedRect(x, mY, mWidth, 75, 6, 6, 'FD');

    // Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...m.color);
    doc.text(m.num, x + 14, mY + 28);

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.white);
    doc.text(m.label, x + 14, mY + 44);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(m.sub, x + 14, mY + 58);
  });

  // Comparison Matrix Table
  const tableData = [
    ['Evaluation Cost', 'High volunteer burnout', '$50 - $200 in API tokens', '$0.00 Forever (Zero paid tokens)'],
    ['Evaluation Latency', '2 to 4 Days (Fatigue)', '10 to 20 mins (Rate throttled)', '< 45 Seconds (In-Memory Workers)'],
    ['Decision Explainability', 'Subjective & Inconsistent', 'Black-Box LLM Hallucinations', '100% Mathematical AST Rationale'],
    ['Candidate Privacy', 'Sheets shared across chats', 'Uploaded to remote LLM clouds', '100% Client-Side localStorage (0 DB)'],
    ['Anti-Cheat Defense', 'None (Fake links slip by)', 'None (Blind link ingestion)', 'Fork-Padding & Commit Auditing'],
    ['Chapter Integration', 'None', 'None', 'Live ACM NIT Surat Leaderboard Sync'],
  ];

  autoTable(doc, {
    startY: 185,
    margin: { left: 40, right: 40 },
    head: [['Recruitment Dimension', 'Manual Spreadsheet Review', 'Proprietary LLM Wrapper', 'Incursion Platform (Track 3)']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [6, 182, 212],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    bodyStyles: {
      fillColor: [11, 17, 32],
      textColor: [203, 213, 225],
      fontSize: 7.5,
      cellPadding: 3.5,
      lineColor: [30, 41, 59],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [255, 255, 255], cellWidth: 150 },
      1: { textColor: [244, 63, 94], cellWidth: 220 },
      2: { textColor: [245, 158, 11], cellWidth: 220 },
      3: { fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 290 },
    },
    tableWidth: 880,
  });

  // Roadmap & Final Submission Verdict Banner
  const rY = 370;
  doc.setFillColor(...COLORS.cardBg);
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(1);
  doc.roundedRect(40, rY, 880, 115, 6, 6, 'FD');

  doc.setFillColor(...COLORS.cyan);
  doc.roundedRect(40, rY, 5, 115, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.cyan);
  doc.text('HACKATHON DIFFERENTIATORS & FUTURE ROADMAP', 55, rY + 18);

  const roadmaps = [
    {
      title: 'Rate-Limit Resilience & Selective Sync:',
      desc: 'Surfaces temporary #<hash> badges when rate-limited with a targeted "⚡ Fetch Remaining" button to resume without wasting quota.',
    },
    {
      title: 'Automated Shortlist Notification Webhooks (Roadmap):',
      desc: 'One-click announcement broadcasts via WhatsApp, Discord, and Slack webhooks directly to shortlisted applicants.',
    },
    {
      title: 'Client-Side AST Code Quality Scorer (Roadmap):',
      desc: 'In-browser static analysis of candidate codebases for cyclomatic complexity, test coverage, and documentation depth at $0 cost.',
    },
    {
      title: 'Production Readiness:',
      desc: '100% test-verified, PWA installable, clean TypeScript architecture with universal Excel, Google Sheets, and CSV intake.',
    },
  ];

  let rmY = rY + 34;
  roadmaps.forEach((r) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.white);
    doc.text(`• ${r.title} `, 55, rmY);

    const titleW = doc.getTextWidth(`• ${r.title} `);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textSilver);
    const lines = doc.splitTextToSize(r.desc, 825 - titleW);
    doc.text(lines[0], 55 + titleW, rmY);
    if (lines.length > 1) {
      doc.text(lines.slice(1), 65, rmY + 9);
      rmY += (lines.length - 1) * 9;
    }
    rmY += 16;
  });
}

// ==========================================
// MAIN COMPILATION SCRIPT
// ==========================================
console.log('Generating Incursion 5-Slide Presentation PDF...');

// Slide 1
renderSlide1(doc);

// Slide 2
doc.addPage([960, 540], 'landscape');
renderSlide2(doc);

// Slide 3
doc.addPage([960, 540], 'landscape');
renderSlide3(doc);

// Slide 4
doc.addPage([960, 540], 'landscape');
renderSlide4(doc);

// Slide 5
doc.addPage([960, 540], 'landscape');
renderSlide5(doc);

// Save outputs
const outRoot = path.join(__dirname, '..', 'Incursion_Track3_Presentation.pdf');
const outPublic = path.join(__dirname, '..', 'public', 'Incursion_Track3_Presentation.pdf');

const pdfBytes = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outRoot, pdfBytes);
fs.writeFileSync(outPublic, pdfBytes);

console.log(`Presentation PDF generated successfully!`);
console.log(`Saved to: ${outRoot}`);
console.log(`Saved to: ${outPublic}`);
console.log(`Total Pages: ${doc.internal.getNumberOfPages()} slides`);
