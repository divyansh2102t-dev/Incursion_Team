# Incursion — Hackathon Team Recruitment Automation Tool
> **Track 3:** Automated, Tunable, and Explainable Team Recruitment Platform

A reusable, 100% zero-cost ($0) recruitment automation tool designed for hackathon organizers to shortlist the top $X$ teams from tabular registration exports (CSV / JSON from Google Forms, Typeform, Devpost, etc.).

---

## 🚀 Key Features

- **Universal Spreadsheet Ingestion:** Drag-and-drop CSV or JSON files. Automatic fuzzy column detection for team names, member slots (1 to 6+), GitHub URLs, LinkedIn, resumes, portfolios, and bios.
- **Interactive Column Mapper:** Visually inspect and rebind any spreadsheet header to member attributes.
- **Zero-Cost Scoring & Signal Extraction:** Pure client-side regex taxonomy matching for languages, frameworks, roles, and achievements. No paid external LLM APIs or token costs.
- **Tunable Selection Philosophy:** Real-time sliders for technical depth, past hackathon experience, skill complementarity, and profile completeness.
- **Team-Size Fair Normalization:** Three mathematical aggregation strategies (`MAX_SKILL`, `DIMINISHING_RETURNS`, `BALANCED_MEAN`) ensuring solo participants and large teams compete fairly.
- **Hard Eligibility Gates:** Pass/fail rules (min/max size, mandatory GitHub, minimum commit thresholds, mandatory resumes) with clear disqualification explanations.
- **Explainable Drilldown:** Itemized score equations, native SVG 6-axis Role Radar Charts, hard filter checklists, and member-by-member proof-of-work.
- **Anti-Cheat & Partial Data Handling:** Detects cross-team duplicate submissions, 0-commit fork padding, and highlights missing data with transparent badges instead of silent penalties.
- **Borderline Sensitivity Analysis:** Simulates $\pm 15\%$ weight fluctuations to identify fragile "bubble teams" near the Top $X$ cutoff line.
- **Pairwise Head-to-Head Comparison:** Side-by-side evaluation modal comparing any two candidate teams across all dimensions.
- **Blind Review Mode:** One-click toggle in the navbar to anonymize personal names, emails, and identifiers to eliminate reviewer bias.
- **Audit-Ready Exports:** One-click export of shortlisted teams to CSV or full JSON bundle embedding the exact configuration snapshot used for reproduction.

---

## 🔍 How GitHub Details Are Fetched & Analyzed

The tool uses a **two-tier zero-cost pipeline** to verify candidate code output:

### 1. URL Extraction & Normalization
When a spreadsheet is loaded, links and handles (e.g. `https://github.com/torvalds/`, `github.com/torvalds`, `@torvalds`, or raw handles) are extracted and sanitized via regular expressions:
```typescript
/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-_]+)\/?/i
```
Reserved placeholders like `null`, `none`, `na`, or `orgs` are discarded automatically.

### 2. Free Public GitHub REST API
For live lookups, the client queries GitHub's official public REST API endpoints without requiring any paid service:
- **Profile Endpoint (`GET https://api.github.com/users/{username}`):**
  - Verifies account existence (flags `404` as missing or fake handles).
  - Retrieves `public_repos`, `followers`, and profile metadata.
- **Repositories Endpoint (`GET https://api.github.com/users/{username}/repos?per_page=100&sort=pushed`):**
  - **Fork vs. Original Ratio:** Distinguishes original repositories (`repo.fork === false`) from cloned forks.
  - **Stars Earned:** Sums stargazers across original projects.
  - **Top Languages:** Identifies primary languages by analyzing repo code tags.
  - **Estimated Annual Activity:** Heuristically estimated from original repos, stars, and follower engagement.

### 3. Anti-Cheat & Suspicious Profile Detection
- **Fork-Padding Detection:** If an account has multiple repositories but 100% of them are forks with 0 original commits, the account is flagged as suspicious and penalized in the technical score.
- **Cross-Team Duplicate Detection:** If the same GitHub handle or email address is registered across multiple different teams, both teams are flagged for organizer review.

### 4. Client-Side Caching & Deterministic Fallback
- **Session Cache:** Prevents duplicate network calls when evaluating applicants across multiple runs.
- **Deterministic Offline Fallback:** To prevent UI freezing when offline or when GitHub's unauthenticated rate limit (60 requests/hour per IP) is reached, a deterministic hash generator derives realistic, reproducible baseline metrics. The exact same username always produces the exact same score.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **Data Ingestion:** PapaParse (CSV streaming) + Zod
- **Visualizations:** Native SVG Radar Charts & Sensitivity Visualizer
- **State & Storage:** React 19 Client State + Local Exports

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm, yarn, or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/divyansh2102t-dev/Incursion_Team.git
cd Incursions

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Sample File for Testing

A sample Google Forms registration export containing 20+ realistic teams with various team sizes, partial submissions, solo hackers, and edge cases is available at:
- [`public/demo_hackathon_registrations.csv`](public/demo_hackathon_registrations.csv)

You can download this file directly from the app interface by clicking **"Download Demo CSV"** and drop it into the upload box to immediately test live scoring and ranking.
