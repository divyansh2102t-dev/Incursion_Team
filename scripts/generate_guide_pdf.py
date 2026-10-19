import os
import base64
from playwright.sync_api import sync_playwright

assets_dir = os.path.abspath('public/guide_assets')
output_pdf = os.path.abspath('Incursion_User_Guide.pdf')

def get_base64_img(filename):
    path = os.path.join(assets_dir, filename)
    if os.path.exists(path):
        with open(path, 'rb') as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')
            return f"data:image/png;base64,{encoded}"
    return ""

img_landing = get_base64_img('01_landing_terminal.png')
img_leaderboard = get_base64_img('02_main_leaderboard.png')
img_drawer = get_base64_img('03_scoring_rules_drawer.png')
img_squad = get_base64_img('04_squad_dossier_modal.png')
img_compare = get_base64_img('05_pairwise_compare_modal.png')
img_formulas = get_base64_img('09_formula_studio.png')

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Incursion User Guide & Operating Manual</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  @page {{
    size: A4 portrait;
    margin: 12mm 10mm 14mm 10mm;
    @bottom-right {{
      content: counter(page);
    }}
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    background-color: #030712;
    color: #e2e8f0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  .mono {{
    font-family: 'JetBrains Mono', monospace;
  }}

  /* Page Break Rules */
  .page {{
    page-break-after: always;
    min-height: 100vh;
    padding: 4mm 2mm;
    position: relative;
  }}

  .page:last-child {{
    page-break-after: avoid;
  }}

  /* Header banner for pages */
  .page-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }}

  .page-header .brand {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    font-weight: 800;
    color: #22d3ee;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }}

  .page-header .doc-title {{
    font-size: 7.5pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }}

  /* Headings */
  h1.cover-title {{
    font-family: 'Inter', sans-serif;
    font-size: 26pt;
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1.1;
    text-transform: uppercase;
    background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 55%, #64748b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 8px;
  }}

  h2.section-title {{
    font-size: 14pt;
    font-weight: 800;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }}

  .badge-step {{
    background: linear-gradient(135deg, #0284c7, #06b6d4);
    color: #030712;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    font-weight: 900;
    padding: 2px 7px;
    border-radius: 4px;
    text-transform: uppercase;
  }}

  p.section-desc {{
    font-size: 9pt;
    color: #94a3b8;
    margin-bottom: 10px;
    line-height: 1.4;
  }}

  /* Visual Cards & Callouts */
  .card {{
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }}

  .card-cyan {{
    background: rgba(6, 182, 212, 0.04);
    border: 1px solid rgba(6, 182, 212, 0.3);
  }}

  .card-title {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    font-weight: 700;
    color: #22d3ee;
    margin-bottom: 4px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  /* Screenshot Containers */
  .screenshot-frame {{
    border: 1.5px solid #0e7490;
    border-radius: 8px;
    overflow: hidden;
    background: #000000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(6, 182, 212, 0.15);
    margin-bottom: 10px;
  }}

  .screenshot-frame img {{
    width: 100%;
    height: auto;
    display: block;
  }}

  .screenshot-caption {{
    background: #090d16;
    border-top: 1px solid #1e293b;
    padding: 5px 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    color: #38bdf8;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}

  /* Step by Step Table & Legend */
  .callout-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }}

  .callout-item {{
    background: #090e17;
    border: 1px solid #1e293b;
    border-radius: 6px;
    padding: 7px 9px;
  }}

  .callout-item .callout-header {{
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    font-weight: 800;
    color: #38bdf8;
    margin-bottom: 3px;
  }}

  .callout-item .num-bubble {{
    background: #0284c7;
    color: #ffffff;
    font-size: 7pt;
    font-weight: 900;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }}

  .callout-item p {{
    font-size: 8pt;
    color: #cbd5e1;
    line-height: 1.35;
  }}

  /* Key Takeaway Box */
  .tip-box {{
    background: rgba(16, 185, 129, 0.07);
    border: 1px solid rgba(16, 185, 129, 0.35);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 8.5pt;
    color: #a7f3d0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 8px;
  }}

  .tip-box strong {{
    color: #34d399;
  }}

  .warning-box {{
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.35);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 8.5pt;
    color: #fde68a;
    margin-top: 8px;
  }}

  /* Flow Steps on Cover */
  .flow-track {{
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: 6px;
    margin: 16px 0;
  }}

  .flow-step {{
    flex: 1;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid #1e293b;
    border-radius: 6px;
    padding: 8px;
    text-align: center;
    position: relative;
  }}

  .flow-step.active {{
    border-color: #06b6d4;
    background: rgba(6, 182, 212, 0.08);
  }}

  .flow-step .step-number {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    font-weight: 800;
    color: #22d3ee;
    text-transform: uppercase;
    margin-bottom: 2px;
  }}

  .flow-step .step-title {{
    font-size: 8pt;
    font-weight: 700;
    color: #ffffff;
  }}

  .flow-step .step-sub {{
    font-size: 7pt;
    color: #94a3b8;
    margin-top: 2px;
  }}

  /* Tables */
  table.cyber-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin: 8px 0;
  }}

  table.cyber-table th {{
    background: #090e17;
    color: #38bdf8;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #1e293b;
    font-size: 7.5pt;
    text-transform: uppercase;
  }}

  table.cyber-table td {{
    padding: 5px 8px;
    border: 1px solid #1e293b;
    color: #cbd5e1;
    background: rgba(15, 23, 42, 0.4);
  }}

  table.cyber-table tr:nth-child(even) td {{
    background: rgba(15, 23, 42, 0.7);
  }}

  .pill {{
    display: inline-block;
    padding: 1px 6px;
    border-radius: 9999px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 6.5pt;
    font-weight: 800;
  }}

  .pill-green {{ background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #059669; }}
  .pill-blue {{ background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid #2563eb; }}
  .pill-amber {{ background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #d97706; }}
  .pill-red {{ background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #dc2626; }}
  .pill-purple {{ background: rgba(139, 92, 246, 0.2); color: #c084fc; border: 1px solid #7c3aed; }}
</style>
</head>
<body>

  <!-- ===================================================================== -->
  <!-- PAGE 1: COVER & EXECUTIVE OVERVIEW                                     -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span class="brand">⚡ INCURSION // OFFICIAL USER GUIDE</span>
      <span class="doc-title">Zero-Cost Hackathon Recruitment Platform</span>
    </div>

    <div style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%); border: 1px solid rgba(6, 182, 212, 0.35); border-radius: 10px; padding: 18px 20px; margin-bottom: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="mono" style="font-size: 8.5pt; color: #22d3ee; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;">OPERATING MANUAL & USER GUIDE</div>
          <h1 class="cover-title">INCURSION</h1>
          <div style="font-size: 11pt; color: #93c5fd; font-weight: 600; margin-bottom: 6px;">
            Automated, Explainable & Tunable Hackathon Team Recruitment
          </div>
          <p style="font-size: 8.5pt; color: #94a3b8; max-width: 620px; line-height: 1.45;">
            A step-by-step visual handbook designed for organizers and judges who are using Incursion for the first time. Learn exactly how to upload candidate datasets, audit GitHub velocity, review candidate resumes, customize scoring rules, drill into squad telemetry, compare borderline teams, and export certified shortlist reports.
          </p>
        </div>
        <div style="background: rgba(3, 7, 18, 0.85); border: 1px solid #1e293b; border-radius: 8px; padding: 10px 14px; text-align: right; font-family: 'JetBrains Mono', monospace;">
          <div style="font-size: 7pt; color: #64748b; text-transform: uppercase;">PLATFORM STATUS</div>
          <div style="font-size: 10pt; color: #34d399; font-weight: 800;">100% OPERATIONAL</div>
          <div style="font-size: 7pt; color: #38bdf8; margin-top: 4px;">Zero-Cost Client Architecture</div>
          <div style="font-size: 6.5pt; color: #94a3b8;">$0 Cloud & API Bills</div>
        </div>
      </div>
    </div>

    <!-- Quick 5-Step Workflow Flowchart -->
    <div class="mono" style="font-size: 8pt; color: #38bdf8; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">
      THE 5-STEP ORGANIZER RECRUITMENT JOURNEY
    </div>
    <div class="flow-track">
      <div class="flow-step active">
        <div class="step-number">STEP 01</div>
        <div class="step-title">Intake Cohort</div>
        <div class="step-sub">Drop CSV, Excel, or Google Sheet</div>
      </div>
      <div class="flow-step">
        <div class="step-number">STEP 02</div>
        <div class="step-title">Review Leaderboard</div>
        <div class="step-sub">Check live ranks & qualification status</div>
      </div>
      <div class="flow-step">
        <div class="step-number">STEP 03</div>
        <div class="step-title">Tune Rules & Cutoff</div>
        <div class="step-sub">Adjust Top X & 5 scoring sliders</div>
      </div>
      <div class="flow-step">
        <div class="step-number">STEP 04</div>
        <div class="step-title">Inspect & Compare</div>
        <div class="step-sub">Radar skill coverage & head-to-head</div>
      </div>
      <div class="flow-step">
        <div class="step-number">STEP 05</div>
        <div class="step-title">Export PDF Audit</div>
        <div class="step-sub">1-click CSV & executive dossier</div>
      </div>
    </div>

    <!-- Core Features Summary Table -->
    <div class="card" style="margin-top: 10px;">
      <div class="card-title">What Makes Incursion Unique? (Executive Summary)</div>
      <table class="cyber-table">
        <thead>
          <tr>
            <th style="width: 28%;">Recruitment Dimension</th>
            <th style="width: 42%;">What Incursion Automates For You</th>
            <th style="width: 30%;">Organizer Advantage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color: #ffffff;">Universal File Intake</strong></td>
            <td>Ingests CSV, JSON, Excel (.xlsx/.xls) & Live Google Sheets directly.</td>
            <td><span class="pill pill-green">Zero Setup</span> No format conversion needed.</td>
          </tr>
          <tr>
            <td><strong style="color: #ffffff;">Live GitHub Velocity</strong></td>
            <td>Audits public repos, commits, stars, languages & flags fork-padding.</td>
            <td><span class="pill pill-blue">Anti-Cheat</span> Real code verification.</td>
          </tr>
          <tr>
            <td><strong style="color: #ffffff;">Resume Intelligence</strong></td>
            <td>Extracts skills, hackathon wins (SIH, ETHIndia) & portfolio links in RAM.</td>
            <td><span class="pill pill-purple">Cloud + PDF</span> Auto-syncs Google Drive resumes.</td>
          </tr>
          <tr>
            <td><strong style="color: #ffffff;">Role Synergy & Gaps</strong></td>
            <td>Checks balance across Frontend, Backend, AI/ML, DevOps, and Design.</td>
            <td><span class="pill pill-amber">Balanced Squads</span> Highlights missing disciplines.</td>
          </tr>
          <tr>
            <td><strong style="color: #ffffff;">Zero-DB Privacy</strong></td>
            <td>100% client-side memory execution; state saved safely in browser localStorage.</td>
            <td><span class="pill pill-green">Zero Liability</span> No data leaks, no GDPR issues.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="tip-box">
      <div>💡</div>
      <div>
        <strong>Beginner Tip:</strong> You don't need any technical coding background or API keys to use Incursion! The system comes pre-configured with industry-standard hackathon selection formulas. Simply drop your registration spreadsheet and watch the leaderboard populate instantly.
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 2: STEP 1 - INTAKE TERMINAL (UPLOADING YOUR DATASET)               -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span class="brand">⚡ INCURSION // CHAPTER 1: COHORT INTAKE</span>
      <span class="doc-title">How to upload registration files</span>
    </div>

    <h2 class="section-title">
      <span class="badge-step">STAGE 1</span>
      <span>The Intake Terminal: Loading Candidate Cohorts</span>
    </h2>
    <p class="section-desc">
      When you open Incursion, you are greeted by the Cyber Terminal and planetary Arc-Reactor telemetry wheel. Here is where you feed your event registrations into the system.
    </p>

    <!-- Real Screenshot with border -->
    <div class="screenshot-frame">
      <img src="{img_landing}" alt="Incursion Landing Terminal">
      <div class="screenshot-caption">
        <span>SCREENSHOT 1: INTAKE TERMINAL & ARC-REACTOR TELEMETRY WHEEL</span>
        <span>STATUS: READY FOR INGESTION</span>
      </div>
    </div>

    <!-- Annotated Callouts Grid -->
    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">1</span>
          <span>Central File Drop Zone</span>
        </div>
        <p>
          Drag and drop any registration file directly onto the cyan target area. Supports <strong>CSV, TSV, JSON, Excel (.xlsx, .xls)</strong> exported from Google Forms, Devpost, Typeform, or Tally.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">2</span>
          <span>Select File & Select Folder Buttons</span>
        </div>
        <p>
          Click <strong>"Select File"</strong> to choose a single spreadsheet, or <strong>"Select Folder"</strong> to choose a folder containing both your registration CSV <em>and</em> candidate PDF resumes for simultaneous auto-matching!
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">3</span>
          <span>Google Sheets Live URL Drawer</span>
        </div>
        <p>
          Click <strong>"Google Sheets Link"</strong> to paste a public Google Sheets URL. Incursion downloads and normalizes the sheet automatically through its built-in CORS bypass tunnel.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">4</span>
          <span>Arc-Reactor Telemetry Nodes</span>
        </div>
        <p>
          Interactive orbiting nodes display Incursion's active evaluation engines: Full Stack, AI & Data, Accolades, GitHub Velocity, Zero-DB Privacy, and Synergy Normalization.
        </p>
      </div>
    </div>

    <div class="tip-box">
      <div>⚡</div>
      <div>
        <strong>What Happens Next:</strong> Once dropped, Incursion automatically scans header names (Team Name, Member 1 Name, GitHub, Resume, etc.), groups teammates into unified squads, calculates preliminary scores, and takes you straight to the Live Leaderboard!
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 3: STEP 2 - THE EXECUTIVE LEADERBOARD                             -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span class="brand">⚡ INCURSION // CHAPTER 2: COMMAND CENTER</span>
      <span class="doc-title">Navigating the Executive Leaderboard</span>
    </div>

    <h2 class="section-title">
      <span class="badge-step">STAGE 2</span>
      <span>The Executive Leaderboard & Cohort Telemetry</span>
    </h2>
    <p class="section-desc">
      Once your file is loaded, the main dashboard opens immediately. Teams are dynamically ranked from #1 to #N based on composite multi-dimensional scores.
    </p>

    <!-- Screenshot 2: Leaderboard -->
    <div class="screenshot-frame">
      <img src="{img_leaderboard}" alt="Incursion Executive Leaderboard">
      <div class="screenshot-caption">
        <span>SCREENSHOT 2: REAL-TIME RANKING LEADERBOARD & SQUAD CARDS</span>
        <span>COHORT SIZE: 20 TEAMS AUDITED</span>
      </div>
    </div>

    <!-- How to read the table -->
    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">1</span>
          <span>Rank Badge & Cutoff Line</span>
        </div>
        <p>
          Teams above the configured cutoff (e.g., Top 10) display glowing cyan badges (#1, #2...). A prominent divider clearly marks the boundary between <strong>Qualified Candidates</strong> and <strong>Waitlisted Teams</strong>.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">2</span>
          <span>Composite Score (0-100)</span>
        </div>
        <p>
          The large numerical score on each card represents the team's overall score. Hovering over the mini dimension bars shows individual scores for <strong>Technical Output, Experience, Synergy, and LinkedIn</strong>.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">3</span>
          <span>Eligibility Status Pills</span>
        </div>
        <p>
          <span class="pill pill-green">QUALIFIED</span>: Passed all rules and ranked inside Top X.<br>
          <span class="pill pill-amber">WAITLISTED</span>: Passed all rules but fell outside Top X.<br>
          <span class="pill pill-red">DISQUALIFIED</span>: Failed team size or diversity constraints.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">4</span>
          <span>Filter Tabs & Quick Search</span>
        </div>
        <p>
          Switch views with one click: <strong>OVERALL, GITHUB, LINKEDIN, ROLES, ACCOLADES, SHORTLIST, DISQUALIFIED</strong>. Use the live search bar to find teams by name, member, or skill.
        </p>
      </div>
    </div>

    <div class="card" style="margin-top: 4px;">
      <div class="card-title">Quick Action Bar (Top Right of Dashboard)</div>
      <div style="font-size: 8pt; color: #94a3b8; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        <div>🔵 <strong>Weights & Rules:</strong> Open the constraint settings drawer.</div>
        <div>⚖️ <strong>Compare:</strong> Launch side-by-side squad comparison.</div>
        <div>📄 <strong>PDF Export:</strong> Download official executive audit report.</div>
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 4: STEP 3 - TUNING WEIGHTS & CONSTRAINTS (THE SETTINGS DRAWER)    -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span class="brand">⚡ INCURSION // CHAPTER 3: CRITERIA TUNING</span>
      <span class="doc-title">Customizing Recruitment Rules & Cutoffs</span>
    </div>

    <h2 class="section-title">
      <span class="badge-step">STAGE 3</span>
      <span>Recruitment Constraints & Weight Tuning Drawer</span>
    </h2>
    <p class="section-desc">
      Every hackathon has different priorities. Click <strong>"Weights & Rules"</strong> in the top navigation bar or dashboard to open the side drawer and customize your rules.
    </p>

    <!-- Screenshot 3: Drawer -->
    <div class="screenshot-frame">
      <img src="{img_drawer}" alt="Scoring Weights Drawer">
      <div class="screenshot-caption">
        <span>SCREENSHOT 3: SLIDING RECRUITMENT RULES & WEIGHTS CONTROLS</span>
        <span>TWO-WAY SYNCHRONIZED INPUTS</span>
      </div>
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">1</span>
          <span>Target Shortlist Capacity (Top X)</span>
        </div>
        <p>
          Set exactly how many teams you want to qualify (e.g. 10, 25, 50). You can either drag the slider or type the exact number in the synchronized number box. The cutoff updates across the entire leaderboard instantly!
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">2</span>
          <span>Hard Eligibility Gates</span>
        </div>
        <p>
          <strong>Min/Max Team Size:</strong> Enforce strict squad limits (e.g. 2 to 4 members).<br>
          <strong>Gender Diversity:</strong> Require at least 1 female team member. Teams failing gates are automatically marked as Disqualified with explanatory tags.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">3</span>
          <span>5-Dimension Scoring Sliders</span>
        </div>
        <p>
          Tune the relative importance of:
          <br>• <strong>Technical Depth (GitHub)</strong> (Default: 40%)
          <br>• <strong>Experience & Accolades (Resumes)</strong> (Default: 30%)
          <br>• <strong>Role Synergy & Balance</strong> (Default: 20%)
          <br>• <strong>LinkedIn Pedigree & Seniority</strong> (Default: 10%)
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">4</span>
          <span>One-Click Philosophy Presets</span>
        </div>
        <p>
          Don't want to adjust sliders manually? Click preset buttons to switch recruitment philosophy in 1 second:
          <br>• <strong>Balanced Hackathon</strong> (Default generalist)
          <br>• <strong>Code & Hard Tech Heavy</strong> (Prioritizes GitHub)
          <br>• <strong>Experience & Accolade Heavy</strong> (Prioritizes SIH/ETHIndia wins)
        </p>
      </div>
    </div>

    <div class="warning-box">
      ⚠️ <strong>Two-Way Input Feature:</strong> Notice that every slider has an editable numerical box next to it. Whether you drag the bar or type on your keyboard, Incursion stays 100% in sync without needing a "Save" button!
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 5: STEP 4 - SQUAD DEEP-DIVE & TELEMETRY DOSSIER                  -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span class="brand">⚡ INCURSION // CHAPTER 4: SQUAD DOSSIER</span>
      <span class="doc-title">Candidate Deep-Dive & Skill Radar</span>
    </div>

    <h2 class="section-title">
      <span class="badge-step">STAGE 4</span>
      <span>Squad Telemetry Dossier & Explainability Modal</span>
    </h2>
    <p class="section-desc">
      Want to know exactly <em>why</em> a squad received their score? Click <strong>"Inspect Squad"</strong> on any row or click the team name to open their complete multi-page dossier.
    </p>

    <!-- Screenshot 4: Squad Modal -->
    <div class="screenshot-frame">
      <img src="{img_squad}" alt="Squad Dossier Modal">
      <div class="screenshot-caption">
        <span>SCREENSHOT 4: SQUAD DOSSIER, 6-AXIS RADAR CHART & VERIFIED SIGNALS</span>
        <span>SQUAD: NEURALSYNC (#1 OVERALL)</span>
      </div>
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">1</span>
          <span>6-Axis Skill Radar Chart</span>
        </div>
        <p>
          Visualizes team balance across <strong>Frontend, Backend, AI/ML, Mobile, DevOps, and UI/UX Design</strong>. Full coverage prevents squads where everyone has the same skill and nobody can build the database or UI.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">2</span>
          <span>Member Profile Breakdown</span>
        </div>
        <p>
          Shows every individual candidate in the squad, their verified email, GitHub handle, LinkedIn profile, portfolio link, primary role, and extracted technical skills.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">3</span>
          <span>Verified GitHub Metrics & Anti-Cheat</span>
        </div>
        <p>
          Displays real commit counts, repository stars, active languages, and anti-cheat checks. If an account has 100% forks and 0 original commits, Incursion flags it with a red warning badge.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">4</span>
          <span>Manual Pin & Exclusion Overrides</span>
        </div>
        <p>
          Organizers have the final say! Click <strong>"Pin Squad"</strong> to guarantee qualification regardless of cutoff, or click <strong>"Exclude Squad"</strong> to disqualify with a custom audit note.
        </p>
      </div>
    </div>

    <div class="tip-box">
      <div>🛡️</div>
      <div>
        <strong>Transparent Explainability:</strong> Incursion never acts as a black box. The dossier provides an itemized justification card listing every bonus point earned for hackathon wins, verified portfolios, and role synergies.
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 6: STEP 5 - PAIRWISE SQUAD COMPARISON                            -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span class="brand">⚡ INCURSION // CHAPTER 5: SQUAD COMPARISON</span>
      <span class="doc-title">Head-to-Head Pairwise Decision Making</span>
    </div>

    <h2 class="section-title">
      <span class="badge-step">STAGE 5</span>
      <span>Head-to-Head Pairwise Squad Comparison HUD</span>
    </h2>
    <p class="section-desc">
      When two teams are tied near the shortlist cutoff line, deciding which team gets the last spot can be difficult. Click <strong>"Compare"</strong> in the top navigation bar to launch the Pairwise HUD.
    </p>

    <!-- Screenshot 5: Pairwise Compare -->
    <div class="screenshot-frame">
      <img src="{img_compare}" alt="Pairwise Squad Comparison">
      <div class="screenshot-caption">
        <span>SCREENSHOT 5: SIDE-BY-SIDE METRIC COMPARISON & VERDICT</span>
        <span>COMPARING SQUAD A VS SQUAD B</span>
      </div>
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">1</span>
          <span>Dropdown Squad Selectors</span>
        </div>
        <p>
          Select any two squads from your cohort (Team A and Team B). You can compare top performers, or compare the 10th and 11th squads sitting directly on the cutoff boundary.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">2</span>
          <span>Metric-by-Metric Row Comparison</span>
        </div>
        <p>
          Side-by-side rows compare <strong>Technical Depth, Total Commits, Total Stars, Experience Score, Hackathon Wins, and Synergy Breadth</strong>. The winning team in each category is highlighted with a cyan checkmark.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">3</span>
          <span>Dual Radar Charts</span>
        </div>
        <p>
          Direct visual comparison of both teams' skill coverage polygons side-by-side. Spot instantly if Team A lacks design while Team B has full-stack balance.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">4</span>
          <span>Automated Head-to-Head Verdict</span>
        </div>
        <p>
          Incursion generates an objective, written verdict stating which squad has the competitive advantage under the active criteria weights, including the exact point differential!
        </p>
      </div>
    </div>

    <div class="tip-box">
      <div>⚖️</div>
      <div>
        <strong>Judges' Meeting Tip:</strong> Project the Pairwise Comparison HUD onto the conference room display during jury deliberations to resolve close selection ties with total transparency!
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 7: STEP 6 - ADVANCED FORMULA TUNING                              -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span class="brand">⚡ INCURSION // CHAPTER 6: FORMULA STUDIO</span>
      <span class="doc-title">Fine-Tuning Point Formulas Without Code</span>
    </div>

    <h2 class="section-title">
      <span class="badge-step">STAGE 6</span>
      <span>The Formula & Algorithm Studio (/formulas)</span>
    </h2>
    <p class="section-desc">
      Want to change how many points a hackathon win or a GitHub star is worth? Navigate to the <strong>Formulae Page</strong> via the top navbar link or by visiting <code>/formulas</code>.
    </p>

    <!-- Screenshot 6: Formula Studio -->
    <div class="screenshot-frame">
      <img src="{img_formulas}" alt="Formula Studio">
      <div class="screenshot-caption">
        <span>SCREENSHOT 6: FORMULA & ALGORITHM STUDIO MULTIPLIERS</span>
        <span>REAL-TIME LOCAL RE-RANKING</span>
      </div>
    </div>

    <div class="callout-grid">
      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">1</span>
          <span>GitHub Velocity Multipliers</span>
        </div>
        <p>
          Tune points allocated per annual commit, points per repository star, and max contribution caps. If your hackathon is beginner-friendly, lower the commit weight so novices aren't penalized.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">2</span>
          <span>Resume & Accolade Weights</span>
        </div>
        <p>
          Adjust the bonus points awarded for national hackathon wins (SIH, ETHIndia), verified portfolio links, and technical skill matches found inside PDF resumes.
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">3</span>
          <span>Role Synergy Multipliers</span>
        </div>
        <p>
          Control the bonus awarded to squads that feature all key disciplines (e.g. at least 1 frontend + 1 backend + 1 designer).
        </p>
      </div>

      <div class="callout-item">
        <div class="callout-header">
          <span class="num-bubble">4</span>
          <span>Undo & Factory Reset Buttons</span>
        </div>
        <p>
          Experiment freely! If you don't like your changes, click <strong>"Undo Changes"</strong> to step back, or click <strong>"Reset to Default Formulas"</strong> to restore default settings anytime.
        </p>
      </div>
    </div>

    <div class="tip-box">
      <div>🔄</div>
      <div>
        <strong>Instant Propagation:</strong> Every adjustment in the Formula Studio instantly propagates back to the main leaderboard. When you return to the dashboard, your entire cohort is already re-ranked!
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 8: STEP 7 - EXPORTING RESULTS & AUDIT DOSSIER                    -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span class="brand">⚡ INCURSION // CHAPTER 7: EXPORT & REPORTING</span>
      <span class="doc-title">Sharing Certified Results with Judges & Sponsors</span>
    </div>

    <h2 class="section-title">
      <span class="badge-step">STAGE 7</span>
      <span>Exporting Your Shortlist & Generating Audit Reports</span>
    </h2>
    <p class="section-desc">
      Once your recruitment shortlisting is finalized, Incursion provides 1-click export options directly in the top navigation bar.
    </p>

    <!-- Export Options Table -->
    <div class="card card-cyan" style="margin-bottom: 12px;">
      <div class="card-title">Available Export Formats</div>
      <table class="cyber-table">
        <thead>
          <tr>
            <th style="width: 20%;">Export Action</th>
            <th style="width: 30%;">File Format</th>
            <th style="width: 50%;">Best Used For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color: #38bdf8;">Export CSV</strong></td>
            <td><code>.csv</code> spreadsheet</td>
            <td>Importing final shortlisted team lists into Discord, Slack, mailing lists, or Google Sheets.</td>
          </tr>
          <tr>
            <td><strong style="color: #38bdf8;">Export JSON</strong></td>
            <td><code>.json</code> bundle</td>
            <td>Backing up your complete scoring configuration, weights, and team records for technical archives.</td>
          </tr>
          <tr>
            <td><strong style="color: #22d3ee;">Download Audit PDF</strong></td>
            <td>Executive Multi-Page <code>.pdf</code></td>
            <td>Official submission to Hackathon Steering Committees, University Deans, and Corporate Sponsors.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Troubleshooting / Cheat Sheet -->
    <div class="card">
      <div class="card-title">Organizer Quick-Reference Cheat Sheet</div>
      <div style="font-size: 8pt; line-height: 1.5; color: #cbd5e1;">
        <div style="margin-bottom: 6px;">
          <strong style="color: #38bdf8;">Q: What if candidate resumes are in a Google Drive folder?</strong><br>
          <span style="color: #94a3b8;">A: Just leave the Google Drive links in your CSV! Click <strong>"Resume Sync"</strong> in the top bar. Incursion's server-side resolver will automatically extract the PDF text streams without CORS issues.</span>
        </div>
        <div style="margin-bottom: 6px;">
          <strong style="color: #38bdf8;">Q: What if candidate GitHub accounts hit rate limits?</strong><br>
          <span style="color: #94a3b8;">A: Incursion handles this automatically! It uses deterministic hash scoring when unauthenticated, or you can add a free personal token in the <strong>"GitHub Sync"</strong> modal for 5,000 requests/hour.</span>
        </div>
        <div style="margin-bottom: 6px;">
          <strong style="color: #38bdf8;">Q: Will my data be lost if I close the browser?</strong><br>
          <span style="color: #94a3b8;">A: No! Incursion automatically persists your active cohort, custom weights, and scoring snapshots in your browser's origin <code>localStorage</code>. When you re-open the tab, your leaderboard is right there.</span>
        </div>
        <div>
          <strong style="color: #38bdf8;">Q: How do I start over with a fresh hackathon cohort?</strong><br>
          <span style="color: #94a3b8;">A: Click <strong>"Home"</strong> or <strong>"Clear Cohort"</strong> on the main landing screen to wipe volatile memory and drop your next dataset.</span>
        </div>
      </div>
    </div>

    <!-- Final Signoff Footer -->
    <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid #1e293b; border-radius: 8px; padding: 12px 16px; margin-top: 14px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div class="mono" style="font-size: 8.5pt; font-weight: 800; color: #ffffff;">INCURSION // PLATFORM READY</div>
        <div style="font-size: 7.5pt; color: #94a3b8;">Built with Next.js 16, TypeScript, Tailwind CSS, unpdf & jsPDF. 100% Zero-Cost Local Intelligence.</div>
      </div>
      <div class="mono" style="font-size: 8pt; color: #34d399; font-weight: 800;">
        HAPPY HACKATHON RECRUITING! 🚀
      </div>
    </div>
  </div>

</body>
</html>
"""

temp_html = os.path.abspath('temp_guide.html')
with open(temp_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"HTML written to {temp_html}, converting to PDF via Playwright Chromium...")

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path='C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless=True
    )
    page = browser.new_page()
    page.goto(f"file:///{temp_html.replace(os.sep, '/')}", wait_until='networkidle')
    page.wait_for_timeout(1000)

    page.pdf(
        path=output_pdf,
        format="A4",
        print_background=True,
        display_header_footer=False,
        margin={"top": "8mm", "bottom": "8mm", "left": "8mm", "right": "8mm"}
    )
    browser.close()

print(f"SUCCESS! PDF Guide generated at: {output_pdf}")
print(f"Size: {os.path.getsize(output_pdf)} bytes")
