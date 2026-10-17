import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SelectionConfig, TeamRecord } from '@/types';

/**
 * Generates and downloads a comprehensive, executive-grade PDF analytical audit report.
 * Contains:
 * 1. Executive Summary & Cohort Telemetry (Date, Teams, Members, Qualified/Disqualified counts)
 * 2. Active Scoring Model & Complete Mathematical Formulas
 * 3. Executive Leaderboard (Full ranked cohort comparative overview)
 * 4. Comparative Squad-by-Squad Deep Analysis & Explainability Justifications
 * 5. Verifiable Proof-of-Work (GitHub, Resumes, LinkedIn, ACM NIT Surat verified profiles)
 */
export function generateAnalyticalReportPDF(
  teams: TeamRecord[],
  config: SelectionConfig,
  shortlistCount: number
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Cohort statistics
  const totalTeams = teams.length;
  const totalMembers = teams.reduce((acc, t) => acc + t.members.length, 0);
  const qualifiedCount = teams.filter(
    (t) =>
      t.computed.manualStatus === 'pinned' ||
      (t.computed.rank <= shortlistCount && t.computed.isEligible && t.computed.manualStatus !== 'excluded')
  ).length;
  const disqualifiedCount = teams.filter(
    (t) => !t.computed.isEligible || t.computed.manualStatus === 'excluded'
  ).length;
  const waitlistedCount = Math.max(0, totalTeams - qualifiedCount - disqualifiedCount);
  const now = new Date();
  const generationDate = `${now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

  // =========================================================================
  // PAGE 1: COVER & EXECUTIVE DASHBOARD
  // =========================================================================

  // Top Cyber Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent Line
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 42, pageWidth, 1.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('INCURSION RECRUITMENT AUDIT REPORT', margin, 18);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(34, 211, 238); // cyan-400
  doc.text('Executive Multi-Criteria Candidate Selection & Explainability Analysis', margin, 26);

  // Generation timestamp & Confidentiality tag
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  doc.text(`Generated: ${generationDate} • Engine: Incursion v2.0 (Zero-Cost Local Intelligence)`, margin, 34);

  let curY = 52;

  // Section Header: Executive Summary
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Executive Cohort Summary & Audit Metrics', margin, curY);

  curY += 5;

  // Stat Cards Table
  autoTable(doc, {
    startY: curY,
    theme: 'grid',
    head: [['METRIC', 'VALUE', 'AUDIT DESCRIPTION']],
    body: [
      ['Total Evaluated Teams', `${totalTeams} Teams`, 'Entire registered cohort ingested and parsed in volatile memory'],
      ['Total Audited Participants', `${totalMembers} Members`, 'Individual profiles checked for GitHub, LinkedIn, and resume signals'],
      ['Target Shortlist Cutoff (X)', `Top ${shortlistCount} Squads`, 'Organizer-configured maximum acceptance capacity'],
      ['Officially Qualified / Shortlisted', `${qualifiedCount} Squads`, 'Passed all hard eligibility gates and scored above shortlist cutoff'],
      ['Waitlisted Teams', `${waitlistedCount} Squads`, 'Eligible teams ranked outside the primary acceptance cutoff'],
      ['Disqualified / Excluded', `${disqualifiedCount} Squads`, 'Failed one or more mandatory hard eligibility rules or manually excluded'],
      ['Active Preset & Model', `${config.presetName}`, `Aggregation model: ${config.aggregationStrategy}`],
      [
        'ACM NIT Surat Chapter Mode',
        config.acmEventConfig?.enabled ? 'ACTIVE (Official Sync)' : 'INACTIVE (Standard Mode)',
        config.acmEventConfig?.enabled
          ? `Priority: ${config.acmEventConfig.dataPriority === 'ACM_OVERWRITE' ? 'ACM Website Overwrites Form Input' : 'Preserve Registration Input'} • Weight: ${config.acmEventConfig.acmWeight}%`
          : 'Competitive programming telemetry not weighted in final score',
      ],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 48 },
      1: { fontStyle: 'bold', textColor: [6, 182, 212], cellWidth: 42 },
      2: { cellWidth: contentWidth - 90 },
    },
    margin: { left: margin, right: margin },
  });

  curY = (doc as any).lastAutoTable.finalY + 9;

  // Section Header: Active Scoring Dimensions
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Multi-Criteria Scoring Model & Dimension Weights', margin, curY);

  curY += 5;

  // Dimension Weights Table
  const wTech = config.weightsEnabled?.technicalDepth !== false ? `${config.weights.technicalDepth}%` : 'OFF (0%)';
  const wExp = config.weightsEnabled?.projectExperience !== false ? `${config.weights.projectExperience}%` : 'OFF (0%)';
  const wRoles = config.weightsEnabled?.skillComplementarity !== false ? `${config.weights.skillComplementarity}%` : 'OFF (0%)';
  const wComp = config.weightsEnabled?.dataCompleteness !== false ? `${config.weights.dataCompleteness}%` : 'OFF (0%)';

  autoTable(doc, {
    startY: curY,
    theme: 'grid',
    head: [['SCORING DIMENSION', 'WEIGHT', 'EVALUATED TELEMETRY & SIGNALS', 'ANTI-CHEAT / INTEGRITY']],
    body: [
      [
        'Technical Depth (GitHub)',
        wTech,
        'Original vs forked repo ratio, estimated commit volume, repository stars, active languages',
        'Detects 100% fork-padding & empty repo vanity claims',
      ],
      [
        'Project Experience & Accolades',
        wExp,
        'Hackathon podiums (SIH, ETHIndia, MLH), portfolio links, work & research internships, custom keywords',
        'Discounts training certificates disguised as company roles',
      ],
      [
        'Skill Synergy & Role Complementarity',
        wRoles,
        '4-discipline balance (Frontend, Backend, AI/ML, Mobile, DevOps, Design), cross-skill coverage',
        'Rewards balanced squads; flags single-domain overlap',
      ],
      [
        'Data Completeness',
        wComp,
        'Ratio of filled profiles, contact details, valid repository links, and portfolios',
        'Penalizes anonymous / blank submissions',
      ],
      [
        'ACM NIT Surat CP Telemetry',
        config.acmEventConfig?.enabled ? `${config.acmEventConfig.acmWeight}%` : 'Optional',
        'Official acm.score, LeetCode rating & problems solved, Codeforces rating/rank, CodeChef stars',
        'Directly synced with official acmnitsurat.in chapter leaderboard',
      ],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 44 },
      1: { fontStyle: 'bold', textColor: [6, 182, 212], cellWidth: 20 },
      2: { cellWidth: 65 },
      3: { cellWidth: contentWidth - 129 },
    },
    margin: { left: margin, right: margin },
  });

  curY = (doc as any).lastAutoTable.finalY + 9;

  // Section Header: Complete Mathematical Formulas
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Underlying Mathematical Formulas & Normalization Logic', margin, curY);

  curY += 5;

  const formulaRows = [
    [
      'Technical Depth Formula',
      'Tech = min(Cmax, Commits/Dcontrib * Cmax) + min(Smax, Stars/Dstars * Smax) + min(Kmax, Skills/Dskills * Kmax)',
      'Deterministic linear capped scaling across verified commit activity, repository stars, and verified technical skills.',
    ],
    [
      'Project Experience Formula',
      'Exp = min(Emax, (Wins * Pwin) + (Skills * Pskill) + Bproof + WorkExp + Keywords)',
      'Awards +25 pts per major hackathon podium, +4 pts per verified tech skill, +20 pts for working demo portfolios.',
    ],
    [
      'Squad Aggregation Model',
      config.aggregationStrategy === 'DIMINISHING_RETURNS'
        ? 'Lead (100%) + 2nd (66%) + 3rd (44%) + 4th (30%) + 5th (20%)'
        : config.aggregationStrategy === 'MAX_SKILL'
        ? 'Domain Max: Highest skill per domain sets squad score. Solo hackers equalized.'
        : 'Balanced Mean: Average member score with squad collaboration multiplier.',
      `Configured Strategy: ${config.aggregationStrategy}. Eliminates team-size unfairness.`,
    ],
  ];

  if (config.customFormulaEnabled && config.customFormulaExpression) {
    formulaRows.push([
      'Custom Math Expression',
      config.customFormulaExpression,
      'Active MathScope custom algebraic equation overriding default weighted sum.',
    ]);
  }

  autoTable(doc, {
    startY: curY,
    theme: 'grid',
    head: [['FORMULA COMPONENT', 'MATHEMATICAL EQUATION', 'EVALUATION BEHAVIOR']],
    body: formulaRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 70 },
      2: { cellWidth: contentWidth - 110 },
    },
    margin: { left: margin, right: margin },
  });

  // =========================================================================
  // PAGE 2+: EXECUTIVE LEADERBOARD TABLE
  // =========================================================================
  doc.addPage();
  curY = 18;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('4. Executive Cohort Leaderboard & Master Ranking', margin, curY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Complete deterministic ranking across all evaluated squads with dimension subscores and qualification status.', margin, curY + 5);

  curY += 9;

  const leaderboardRows = teams.map((team) => {
    const isShortlisted =
      team.computed.manualStatus === 'pinned' ||
      (team.computed.rank <= shortlistCount && team.computed.isEligible && team.computed.manualStatus !== 'excluded');

    const statusText =
      team.computed.manualStatus === 'pinned'
        ? 'PINNED'
        : team.computed.manualStatus === 'excluded'
        ? 'EXCLUDED'
        : isShortlisted
        ? 'SHORTLISTED'
        : !team.computed.isEligible
        ? 'DISQUALIFIED'
        : 'WAITLIST';

    return [
      `#${team.computed.rank}`,
      team.teamName,
      `${team.members.length}`,
      `${team.computed.technicalDepthScore}`,
      `${team.computed.projectExperienceScore}`,
      `${team.computed.skillComplementarityScore}`,
      `${team.computed.dataCompletenessScore}%`,
      config.acmEventConfig?.enabled ? `${team.computed.acmScore ?? 0}` : `${team.computed.linkedinScore ?? '—'}`,
      `${team.computed.finalScore}`,
      statusText,
    ];
  });

  autoTable(doc, {
    startY: curY,
    theme: 'grid',
    head: [[
      '#',
      'TEAM NAME',
      'SIZE',
      'TECH',
      'EXP',
      'ROLES',
      'DATA',
      config.acmEventConfig?.enabled ? 'ACM' : 'LINKEDIN',
      'FINAL',
      'STATUS',
    ]],
    body: leaderboardRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 42 },
      2: { halign: 'center', cellWidth: 10 },
      3: { halign: 'right', cellWidth: 14 },
      4: { halign: 'right', cellWidth: 14 },
      5: { halign: 'right', cellWidth: 14 },
      6: { halign: 'right', cellWidth: 14 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', fontStyle: 'bold', textColor: [6, 182, 212], cellWidth: 16 },
      9: { halign: 'center', fontStyle: 'bold', cellWidth: contentWidth - 152 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        const val = String(data.cell.raw);
        if (val === 'SHORTLISTED' || val === 'PINNED') {
          data.cell.styles.textColor = [16, 185, 129]; // emerald
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'DISQUALIFIED' || val === 'EXCLUDED') {
          data.cell.styles.textColor = [239, 68, 68]; // rose
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [245, 158, 11]; // amber
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  // =========================================================================
  // PAGE 3+: IN-DEPTH COMPARATIVE SQUAD ANALYSIS & SCORE EXPLAINABILITY
  // =========================================================================
  doc.addPage();
  curY = 18;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('5. Squad-by-Squad Comparative Analysis & Score Explainability', margin, curY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Comprehensive signal breakdown, verified candidates, skill distributions, and justification narrative for every team.', margin, curY + 5);

  curY += 10;

  teams.forEach((team) => {
    // Check page budget
    if (curY > pageHeight - 55) {
      doc.addPage();
      curY = 18;
    }

    const isShortlisted =
      team.computed.manualStatus === 'pinned' ||
      (team.computed.rank <= shortlistCount && team.computed.isEligible && team.computed.manualStatus !== 'excluded');

    const statusBadge =
      team.computed.manualStatus === 'pinned'
        ? 'PINNED'
        : team.computed.manualStatus === 'excluded'
        ? 'EXCLUDED'
        : isShortlisted
        ? 'SHORTLISTED'
        : !team.computed.isEligible
        ? 'DISQUALIFIED'
        : 'WAITLIST';

    // Team Card Header Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(margin, curY, contentWidth, 8, 1.5, 1.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`#${team.computed.rank} — ${team.teamName.toUpperCase()} (${team.members.length} members)`, margin + 3, curY + 5.5);

    doc.setFontSize(8);
    doc.setTextColor(6, 182, 212);
    doc.text(`Score: ${team.computed.finalScore} / 100`, pageWidth - margin - 45, curY + 5.5);

    // Status Pill
    if (statusBadge === 'SHORTLISTED' || statusBadge === 'PINNED') {
      doc.setTextColor(16, 185, 129);
    } else if (statusBadge === 'DISQUALIFIED' || statusBadge === 'EXCLUDED') {
      doc.setTextColor(239, 68, 68);
    } else {
      doc.setTextColor(245, 158, 11);
    }
    doc.text(`[${statusBadge}]`, pageWidth - margin - 18, curY + 5.5);

    curY += 11;

    // Explainability Narrative & Scores Row
    const coveredRolesStr = team.computed.coveredRoles.join(', ') || 'General / Unspecified';
    const missingRolesStr = team.computed.missingRoles.length > 0 ? team.computed.missingRoles.join(', ') : 'None (Full 4/4 Squad)';
    const allSkills = Array.from(new Set(team.members.flatMap((m) => m.rawSignals.skills))).slice(0, 12).join(', ') || 'Standard Web';

    let whyNarrative = `Ranked #${team.computed.rank} with score ${team.computed.finalScore}/100. `;
    if (team.computed.isEligible) {
      whyNarrative += `Covers primary disciplines [${coveredRolesStr}] with strong synergy. Technical depth ${team.computed.technicalDepthScore}/100 and experience ${team.computed.projectExperienceScore}/100.`;
    } else {
      whyNarrative += `Disqualified by hard gate audit: ${team.computed.failedFilters.map((f) => `${f.filterName} (${f.reason})`).join('; ')}.`;
    }

    // Team detail table
    const detailRows: string[][] = [
      ['Dimension Scores', `Tech: ${team.computed.technicalDepthScore} | Exp: ${team.computed.projectExperienceScore} | Roles: ${team.computed.skillComplementarityScore} | Data: ${team.computed.dataCompletenessScore}%${team.computed.acmScore ? ` | ACM: ${team.computed.acmScore} pts` : ''}`],
      ['Score Rationale & Audit', whyNarrative],
      ['Roles & Tech Stack', `Covered: [${coveredRolesStr}] • Missing: [${missingRolesStr}] • Identified Skills: ${allSkills}`],
    ];

    // Candidate Member Details
    const memberSummary = team.members.map((m) => {
      const parts = [m.name];
      if (m.college) parts.push(m.college);
      if (m.gradYear) parts.push(`'${m.gradYear}`);
      if (m.rawSignals.githubUsername) parts.push(`gh:@${m.rawSignals.githubUsername}`);
      if (m.acmProfile?.rollNumber || m.rollNumber) parts.push(`roll:${(m.acmProfile?.rollNumber || m.rollNumber)?.toUpperCase()}`);
      return parts.join(' | ');
    }).join('\n');

    detailRows.push(['Squad Members', memberSummary]);

    // ACM NIT Surat specifics if matched
    if (team.members.some((m) => m.acmProfile)) {
      const acmSummary = team.members
        .filter((m) => m.acmProfile)
        .map((m) => {
          const p = m.acmProfile!;
          return `${m.name} (${(p.rollNumber || m.rollNumber)?.toUpperCase()} - ${p.branch.toUpperCase()}): ACM Score: ${p.acm?.score || 0} pts (Rank #${p.acm?.overallRank || '—'}) • LeetCode: ${p.leetcode?.rating || 'Unrated'} (${p.leetcode?.totalSolved || 0} solved) • CF: ${p.codeforces?.currentRating || 'Unrated'} (${p.codeforces?.currentRank || 'Unrated'}) • CodeChef: ${p.codechef?.stars ? `${p.codechef.stars}*` : '1*'}`;
        })
        .join('\n');

      detailRows.push(['ACM NIT Surat Telemetry', acmSummary]);
    }

    autoTable(doc, {
      startY: curY,
      theme: 'plain',
      body: detailRows,
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85],
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 36 },
        1: { cellWidth: contentWidth - 36 },
      },
      margin: { left: margin, right: margin },
    });

    curY = (doc as any).lastAutoTable.finalY + 6;
  });

  // =========================================================================
  // PAGE NUMBERING & CONFIDENTIAL FOOTERS ON ALL PAGES
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Top Header line (pages 2+)
    if (i > 1) {
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 10, pageWidth - margin, 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Incursion Hackathon Recruitment Audit Report • Confidential', margin, 8);
      doc.text(`Generated: ${generationDate}`, pageWidth - margin, 8, { align: 'right' });
    }

    // Bottom Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Incursion AI Intelligence Platform • Zero-Cost Autonomous Team Recruiter', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Trigger Instant Browser Download
  const sanitizedPreset = config.presetName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const filename = `incursion_audit_report_${sanitizedPreset}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
