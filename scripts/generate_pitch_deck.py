import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# 16:9 Widescreen dimensions
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)

# Color Palette
BG_COLOR = RGBColor(3, 7, 18)          # #030712 Deep Cyber Slate
CARD_BG = RGBColor(11, 17, 32)         # #0b1120 Dark Navy Card
CARD_BORDER = RGBColor(30, 41, 59)     # #1e293b Slate Border
CYAN = RGBColor(6, 182, 212)           # #06b6d4 Neon Cyan
BLUE = RGBColor(59, 130, 246)          # #3b82f6 Electric Blue
EMERALD = RGBColor(16, 185, 129)       # #10b981 Emerald Green
AMBER = RGBColor(245, 158, 11)         # #f59e0b Cyber Amber
ROSE = RGBColor(244, 63, 94)           # #f43f5e Cyber Rose
PURPLE = RGBColor(168, 85, 247)        # #a855f7 Cyber Purple
WHITE = RGBColor(255, 255, 255)
SILVER = RGBColor(203, 213, 225)       # #cbd5e1
MUTED = RGBColor(148, 163, 184)        # #94a3b8

prs = Presentation()
prs.slide_width = SLIDE_WIDTH
prs.slide_height = SLIDE_HEIGHT
blank_layout = prs.slide_layouts[6]

def set_slide_background(slide):
    bg_shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT
    )
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = BG_COLOR
    bg_shape.line.fill.background()

def add_header(slide, slide_num, title, subtitle, category="TRACK 3: AUTOMATED RECRUITMENT ENGINE"):
    # Category Pill
    pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(0.35), Inches(3.6), Inches(0.28))
    pill.fill.solid()
    pill.fill.fore_color.rgb = RGBColor(15, 23, 42)
    pill.line.color.rgb = CYAN
    pill.line.width = Pt(1)
    tf = pill.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = category
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = CYAN
    p.alignment = PP_ALIGN.CENTER

    # Slide Number Pill
    num_pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(12.0), Inches(0.35), Inches(0.75), Inches(0.28))
    num_pill.fill.solid()
    num_pill.fill.fore_color.rgb = RGBColor(15, 23, 42)
    num_pill.line.color.rgb = CYAN
    num_pill.line.width = Pt(1)
    tf_n = num_pill.text_frame
    p_n = tf_n.paragraphs[0]
    p_n.text = f"0{slide_num} / 05"
    p_n.font.size = Pt(8.5)
    p_n.font.bold = True
    p_n.font.color.rgb = CYAN
    p_n.alignment = PP_ALIGN.CENTER

    # Title Box
    title_box = slide.shapes.add_textbox(Inches(0.6), Inches(0.68), Inches(11.5), Inches(0.55))
    tf_t = title_box.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = title
    p_t.font.bold = True
    p_t.font.size = Pt(21)
    p_t.font.color.rgb = WHITE

    # Subtitle Box
    sub_box = slide.shapes.add_textbox(Inches(0.6), Inches(1.15), Inches(11.5), Inches(0.35))
    tf_s = sub_box.text_frame
    tf_s.word_wrap = True
    p_s = tf_s.paragraphs[0]
    p_s.text = subtitle
    p_s.font.size = Pt(10.5)
    p_s.font.color.rgb = MUTED

    # Accent Divider Line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.5), Inches(12.13), Pt(1.5))
    line.fill.solid()
    line.fill.fore_color.rgb = CARD_BORDER
    line.line.fill.background()

    cyan_strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.5), Inches(2.2), Pt(2.5))
    cyan_strip.fill.solid()
    cyan_strip.fill.fore_color.rgb = CYAN
    cyan_strip.line.fill.background()

def add_footer(slide, slide_num):
    # Footer Divider Line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(7.0), Inches(12.13), Pt(1))
    line.fill.solid()
    line.fill.fore_color.rgb = CARD_BORDER
    line.line.fill.background()

    # Left text
    fb = slide.shapes.add_textbox(Inches(0.6), Inches(7.05), Inches(7.0), Inches(0.35))
    tf = fb.text_frame
    p = tf.paragraphs[0]
    p.text = "INCURSION  |  Autonomous, Tunable & Explainable Team Recruitment Platform"
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = CYAN

    # Right text
    fb_r = slide.shapes.add_textbox(Inches(7.5), Inches(7.05), Inches(5.23), Inches(0.35))
    tf_r = fb_r.text_frame
    p_r = tf_r.paragraphs[0]
    p_r.text = f"Slide {slide_num} of 5  •  100% Zero-Cost Architecture  •  Zero-DB Privacy"
    p_r.font.size = Pt(9)
    p_r.font.color.rgb = MUTED
    p_r.alignment = PP_ALIGN.RIGHT

# ==========================================
# SLIDE 1: COVER & EXECUTIVE OVERVIEW
# ==========================================
slide1 = prs.slides.add_slide(blank_layout)
set_slide_background(slide1)

# Top Track Pill
pill1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(0.4), Inches(4.8), Inches(0.32))
pill1.fill.solid()
pill1.fill.fore_color.rgb = RGBColor(15, 23, 42)
pill1.line.color.rgb = CYAN
pill1.line.width = Pt(1)
p = pill1.text_frame.paragraphs[0]
p.text = "HACKATHON TRACK 3: AUTOMATED RECRUITMENT ENGINE"
p.font.size = Pt(9)
p.font.bold = True
p.font.color.rgb = CYAN
p.alignment = PP_ALIGN.CENTER

# Version Badge
ver = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.5), Inches(0.4), Inches(1.23), Inches(0.32))
ver.fill.solid()
ver.fill.fore_color.rgb = CYAN
ver.line.fill.background()
p = ver.text_frame.paragraphs[0]
p.text = "v1.0.0 PROD"
p.font.size = Pt(9)
p.font.bold = True
p.font.color.rgb = RGBColor(0, 0, 0)
p.alignment = PP_ALIGN.CENTER

# Main Title & Subtitle
logo_img_path = os.path.join(os.path.dirname(__file__), "..", "public", "icon-512.png")
if os.path.exists(logo_img_path):
    slide1.shapes.add_picture(logo_img_path, Inches(0.6), Inches(0.9), Inches(0.85), Inches(0.85))
    tx_x = Inches(1.6)
else:
    tx_x = Inches(0.6)

tb = slide1.shapes.add_textbox(tx_x, Inches(0.85), Inches(10.5), Inches(0.6))
p = tb.text_frame.paragraphs[0]
p.text = "INCURSION"
p.font.bold = True
p.font.size = Pt(36)
p.font.color.rgb = WHITE

sub_tb = slide1.shapes.add_textbox(tx_x, Inches(1.45), Inches(10.5), Inches(0.4))
p = sub_tb.text_frame.paragraphs[0]
p.text = "Autonomous, Zero-Cost ($0 API Bills) Hackathon Recruitment & Shortlisting Engine"
p.font.bold = True
p.font.size = Pt(13)
p.font.color.rgb = CYAN

# Executive Brief Card
eb = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.95), Inches(12.13), Inches(1.2))
eb.fill.solid()
eb.fill.fore_color.rgb = CARD_BG
eb.line.color.rgb = CYAN
eb.line.width = Pt(1)

# Left accent strip
strip = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.95), Inches(0.08), Inches(1.2))
strip.fill.solid()
strip.fill.fore_color.rgb = CYAN
strip.line.fill.background()

eb_tb = slide1.shapes.add_textbox(Inches(0.8), Inches(2.05), Inches(11.7), Inches(1.0))
tf = eb_tb.text_frame
tf.word_wrap = True
p1 = tf.paragraphs[0]
p1.text = "EXECUTIVE OVERVIEW & PROBLEM BRIEF"
p1.font.bold = True
p1.font.size = Pt(10)
p1.font.color.rgb = CYAN

p2 = tf.add_paragraph()
p2.text = (
    "Evaluating 500+ team registrations across Google Forms, Devpost, and spreadsheets is historically slow, biased, expensive, and opaque. "
    "Incursion replaces manual volunteer fatigue and costly LLM wrappers with an unopinionated, mathematically explainable, client-side recruitment engine. "
    "It inspects GitHub commit velocity, scans cloud resumes in parallel, balances multi-member squads against solo hackers, and provides an executive mathematical audit trail—all with 100% client-side privacy and $0 API bills."
)
p2.font.size = Pt(9.5)
p2.font.color.rgb = SILVER

# 4 Pillars
pillars_data = [
    {
        "title": "100% ZERO-COST ($0)",
        "sub": "Zero Paid API Tokens",
        "color": EMERALD,
        "bullets": [
            "Eliminates paid LLM tokens ($50-$200/cohort) via deterministic NLP taxonomy.",
            "Runs in browser memory with public REST endpoints & Web Workers.",
            "Zero recurring bills for student and community hackathons.",
        ],
        "stat": "$0.00 Total Evaluation Cost",
    },
    {
        "title": "ZERO-DB PRIVACY",
        "sub": "Local Origin Vault",
        "color": CYAN,
        "bullets": [
            "Persistent localStorage maintains cohorts across computer restarts.",
            "Zero remote database servers; candidate PII never leaves device.",
            "100% GDPR & DPDP compliant with zero data breach liability.",
        ],
        "stat": "0 Bytes PII Retained Remotely",
    },
    {
        "title": "DUAL-STREAM ENGINE",
        "sub": "Concurrent Parallel Audit",
        "color": BLUE,
        "bullets": [
            "Audits GitHub commit frequency, stars, and language diversity.",
            "Anti-cheat heuristic flags accounts with 100% forks & zero commits.",
            "Simultaneously extracts Google Drive/Dropbox PDF resume streams.",
        ],
        "stat": "Simultaneous Code + Resume Scan",
    },
    {
        "title": "EXPLAINABLE MATH",
        "sub": "Tunable Formula Studio",
        "color": PURPLE,
        "bullets": [
            "Dedicated /formulas studio with MathScope AST equation compiler.",
            "Dynamic squad normalization (Balanced Mean, Diminishing Returns).",
            "Downloadable executive multi-page audit PDF report with role gaps.",
        ],
        "stat": "100% Transparent Mathematical Trail",
    },
]

col_w = Inches(2.9)
col_gap = Inches(0.17)
top_y = Inches(3.3)

for idx, p_info in enumerate(pillars_data):
    cx = Inches(0.6) + idx * (col_w + col_gap)
    card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, top_y, col_w, Inches(3.45))
    card.fill.solid()
    card.fill.fore_color.rgb = CARD_BG
    card.line.color.rgb = CARD_BORDER
    card.line.width = Pt(1)

    # Accent Top Line
    top_line = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx + Inches(0.1), top_y, col_w - Inches(0.2), Pt(2.5))
    top_line.fill.solid()
    top_line.fill.fore_color.rgb = p_info["color"]
    top_line.line.fill.background()

    tb_card = slide1.shapes.add_textbox(cx + Inches(0.15), top_y + Inches(0.15), col_w - Inches(0.3), Inches(2.5))
    tf_c = tb_card.text_frame
    tf_c.word_wrap = True

    p_t = tf_c.paragraphs[0]
    p_t.text = p_info["title"]
    p_t.font.bold = True
    p_t.font.size = Pt(10.5)
    p_t.font.color.rgb = p_info["color"]

    p_sub = tf_c.add_paragraph()
    p_sub.text = p_info["sub"]
    p_sub.font.size = Pt(8.5)
    p_sub.font.color.rgb = MUTED

    for b in p_info["bullets"]:
        p_b = tf_c.add_paragraph()
        p_b.text = f"• {b}"
        p_b.font.size = Pt(8)
        p_b.font.color.rgb = SILVER

    # Stat Banner at bottom of card
    stat_box = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx + Inches(0.12), top_y + Inches(2.95), col_w - Inches(0.24), Inches(0.35))
    stat_box.fill.solid()
    stat_box.fill.fore_color.rgb = RGBColor(15, 23, 42)
    stat_box.line.color.rgb = p_info["color"]
    stat_box.line.width = Pt(1)
    p_stat = stat_box.text_frame.paragraphs[0]
    p_stat.text = p_info["stat"]
    p_stat.font.bold = True
    p_stat.font.size = Pt(8)
    p_stat.font.color.rgb = p_info["color"]
    p_stat.alignment = PP_ALIGN.CENTER

add_footer(slide1, 1)

# ==========================================
# SLIDE 2: THE PROBLEM STATEMENT
# ==========================================
slide2 = prs.slides.add_slide(blank_layout)
set_slide_background(slide2)
add_header(slide2, 2, "THE PROBLEM STATEMENT", "Why Existing Hackathon Screening & Evaluation Workflows Fail Organizers")

# Context Banner
banner2 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.65), Inches(12.13), Inches(0.65))
banner2.fill.solid()
banner2.fill.fore_color.rgb = CARD_BG
banner2.line.color.rgb = CARD_BORDER
banner2.line.width = Pt(1)
tf_b2 = banner2.text_frame
tf_b2.word_wrap = True
p = tf_b2.paragraphs[0]
p.text = "THE SCALE DILEMMA: 300 to 1,000+ Teams • 24-48 Hour Screening Window"
p.font.bold = True
p.font.size = Pt(9.5)
p.font.color.rgb = AMBER

p2 = tf_b2.add_paragraph()
p2.text = "Organizing committees receive thousands of applicant profiles. Existing workflows force an impossible compromise between exhausting volunteer manual review and expensive, fragile, and untrustworthy AI wrappers."
p2.font.size = Pt(9)
p2.font.color.rgb = SILVER

# 3 Problem Columns
prob_cols = [
    {
        "badge": "PROBLEM 01",
        "title": "MANUAL SPREADSHEET FATIGUE",
        "sub": "Human Bottleneck & Inconsistency",
        "color": ROSE,
        "items": [
            ("40+ Volunteer Review Hours", "Organizers manually open hundreds of Google Forms rows, clicking candidate GitHub links and PDF drives one by one."),
            ("Subjective Fatigue & Bias", "Exhausted evaluators apply inconsistent standards at 2 AM vs 9 AM, causing unfair bias and arbitrary selection cutoffs."),
            ("Zero Anti-Cheat Verification", "Reviewers cannot verify if a GitHub account represents authentic original code or 100% cloned/fork-padded repositories."),
        ],
        "stat": "90% of applicants receive zero deep code inspection",
    },
    {
        "badge": "PROBLEM 02",
        "title": "EXPENSIVE LLM WRAPPERS",
        "sub": "Fragile, Costly & Non-Deterministic",
        "color": AMBER,
        "items": [
            ("$100-$300+ in API Token Bills", "Sending 500+ team registrations and multi-page PDFs to proprietary LLMs (GPT-4) drains student and non-profit hackathon budgets."),
            ("Severe Rate Limits & Timeouts", "API token rate limits throttle bulk evaluation during intake surges, causing pipeline crashes and missed registration deadlines."),
            ("Prompt Hallucination & Variance", "Generative AI scores the exact same applicant differently on repeated runs, completely destroying competitive integrity."),
        ],
        "stat": "$150+ wasted per event on hallucination-prone tokens",
    },
    {
        "badge": "PROBLEM 03",
        "title": '"BLACK-BOX" AI & PII LIABILITIES',
        "sub": "Zero Trust & Legal Vulnerability",
        "color": ROSE,
        "items": [
            ("Unexplainable Rejection Rationale", "Generative AI wrappers cannot explain the mathematical rationale behind rankings, fueling applicant distrust and appeals."),
            ("GDPR / DPDP Privacy Violations", "Storing student phone numbers, resumes, and college roll numbers in cloud databases creates severe data breach liability."),
            ("Solo vs Squad Inequity", "Generic tools fail to normalize solo prodigies against 4-person squads, improperly penalizing solo hackers or over-weighting teams."),
        ],
        "stat": "100% PII exposure risk across third-party cloud databases",
    },
]

col_w3 = Inches(3.92)
col_gap3 = Inches(0.18)
startY3 = Inches(2.45)

for idx, p_info in enumerate(prob_cols):
    cx = Inches(0.6) + idx * (col_w3 + col_gap3)
    card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, startY3, col_w3, Inches(3.25))
    card.fill.solid()
    card.fill.fore_color.rgb = CARD_BG
    card.line.color.rgb = CARD_BORDER
    card.line.width = Pt(1)

    # Header badge
    hb = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx + Inches(0.15), startY3 + Inches(0.15), Inches(1.1), Inches(0.25))
    hb.fill.solid()
    hb.fill.fore_color.rgb = RGBColor(15, 23, 42)
    hb.line.color.rgb = p_info["color"]
    p_hb = hb.text_frame.paragraphs[0]
    p_hb.text = p_info["badge"]
    p_hb.font.bold = True
    p_hb.font.size = Pt(8)
    p_hb.font.color.rgb = p_info["color"]
    p_hb.alignment = PP_ALIGN.CENTER

    tb = slide2.shapes.add_textbox(cx + Inches(0.15), startY3 + Inches(0.48), col_w3 - Inches(0.3), Inches(2.2))
    tf = tb.text_frame
    tf.word_wrap = True

    p_t = tf.paragraphs[0]
    p_t.text = p_info["title"]
    p_t.font.bold = True
    p_t.font.size = Pt(10.5)
    p_t.font.color.rgb = WHITE

    p_sub = tf.add_paragraph()
    p_sub.text = p_info["sub"]
    p_sub.font.size = Pt(8)
    p_sub.font.color.rgb = MUTED

    for label, desc in p_info["items"]:
        p_l = tf.add_paragraph()
        p_l.text = f"• {label}:"
        p_l.font.bold = True
        p_l.font.size = Pt(8)
        p_l.font.color.rgb = p_info["color"]

        p_d = tf.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(7.5)
        p_d.font.color.rgb = SILVER

    # Stat box
    st = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx + Inches(0.15), startY3 + Inches(2.8), col_w3 - Inches(0.3), Inches(0.32))
    st.fill.solid()
    st.fill.fore_color.rgb = RGBColor(15, 23, 42)
    st.line.color.rgb = p_info["color"]
    st.line.width = Pt(1)
    p_st = st.text_frame.paragraphs[0]
    p_st.text = p_info["stat"]
    p_st.font.bold = True
    p_st.font.size = Pt(8)
    p_st.font.color.rgb = p_info["color"]
    p_st.alignment = PP_ALIGN.CENTER

# Bottom Callout
takeaway2 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(5.85), Inches(12.13), Inches(1.0))
takeaway2.fill.solid()
takeaway2.fill.fore_color.rgb = CARD_BG
takeaway2.line.color.rgb = CYAN
takeaway2.line.width = Pt(1)

# Left accent
strp = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(5.85), Inches(0.08), Inches(1.0))
strp.fill.solid()
strp.fill.fore_color.rgb = CYAN
strp.line.fill.background()

tf_tk = takeaway2.text_frame
tf_tk.word_wrap = True
p = tf_tk.paragraphs[0]
p.text = "THE RECRUITMENT AUTOMATION IMPERATIVE"
p.font.bold = True
p.font.size = Pt(9.5)
p.font.color.rgb = CYAN

p2 = tf_tk.add_paragraph()
p2.text = (
    "Hackathon organizers require a platform that is: (1) 100% Free ($0 API bills) with zero LLM tokens, "
    "(2) Transparent & Mathematically Explainable with custom tunable weights, "
    "(3) Concurrent & Fast (< 45 seconds for 500 teams), "
    "(4) Anti-Cheat Protected against fake/forked GitHub profiles, and "
    "(5) Fully Client-Side with zero database liability or PII leaks."
)
p2.font.size = Pt(8.5)
p2.font.color.rgb = SILVER

add_footer(slide2, 2)

# ==========================================
# SLIDE 3: THE PROPOSED SOLUTION
# ==========================================
slide3 = prs.slides.add_slide(blank_layout)
set_slide_background(slide3)
add_header(slide3, 3, "THE PROPOSED SOLUTION", "Incursion: Autonomous, Explainable & Zero-Cost Team Recruitment Architecture")

sol_quads = [
    {
        "title": "DUAL-STREAM CONCURRENT SCORING",
        "sub": "Parallel GitHub Velocity + Cloud Resume Intelligence",
        "color": CYAN,
        "bullets": [
            "Stream A (GitHub REST API): Evaluates annual commit velocity, original vs fork ratio, stars, and language diversity.",
            "Anti-Cheat Heuristic: Penalizes accounts with 100% forked repos and 0 original commits.",
            "Stream B (unpdf Engine): Server-side CORS stream extracts skills, hackathon accolades, and portfolios from Google Drive/PDF resumes in volatile RAM.",
            "Temporary Hash Transparency: Profiles scored via rate-limit fallback display visible #hash badges with smart 'Fetch Remaining' sync.",
        ],
    },
    {
        "title": "FORMULA & ALGORITHM STUDIO (/formulas)",
        "sub": "Completely Unopinionated & Mathematically Tunable",
        "color": EMERALD,
        "bullets": [
            "Interactive Formula Studio: Organizers customize mathematical multipliers and scoring curves.",
            "MathScope AST Evaluation: Compiles custom mathematical expressions into deterministic ranking functions.",
            "Two-Way Synchronized Controls: Sliders and numeric inputs update live with real-time cohort leaderboard previews.",
            "Hard Eligibility Gates: Enforce minimum team size, required GitHub handles, ACM chapter membership, or experience cutoffs.",
        ],
    },
    {
        "title": "DYNAMIC SQUAD-SIZE NORMALIZATION",
        "sub": "Equalizing Solo Prodigies & Multi-Member Teams",
        "color": AMBER,
        "bullets": [
            "Balanced Mean Model (Platform Default): Multiplies average member score by a capped synergy bonus: min(1.40, 1 + (N-1) * 0.08).",
            "Diminishing Returns Model: Exponential decay (1.5^(i-1)) weighting lead hacker 100%, 2nd 67%, 3rd 44%.",
            "Max Skill Rating: Highest skill in each discipline sets the team rating, giving solo hackers an equal playing field.",
            "7 Core Disciplines: Audits coverage across Frontend, Backend, AI/ML, DevOps, Mobile, Systems, and UI/UX.",
        ],
    },
    {
        "title": "OFFICIAL ACM NIT SURAT CHAPTER BRIDGE",
        "sub": "Live Chapter Leaderboard Integration & Conflict Overrides",
        "color": BLUE,
        "bullets": [
            "Server-Side CORS Proxy: Direct API bridge (/api/fetch-acm-leaderboard) to acmnitsurat.in.",
            "Tri-Platform Coding Metrics: Imports official contest ratings and solved counts for LeetCode, Codeforces, and CodeChef.",
            "Institutional Telemetry: Verifies candidate roll numbers (e.g. u25cs079), engineering branches, and graduation years.",
            "Conflict Override Toggle: Choose between official ACM chapter scores or Incursion calculated formulas.",
        ],
    },
]

qw = Inches(5.98)
qh = Inches(2.4)

for idx, q_info in enumerate(sol_quads):
    col = idx % 2
    row = idx // 2
    qx = Inches(0.6) + col * (qw + Inches(0.17))
    qy = Inches(1.7) + row * (qh + Inches(0.15))

    card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, qx, qy, qw, qh)
    card.fill.solid()
    card.fill.fore_color.rgb = CARD_BG
    card.line.color.rgb = CARD_BORDER
    card.line.width = Pt(1)

    # Accent left strip
    strp = slide3.shapes.add_shape(MSO_SHAPE.RECTANGLE, qx, qy, Inches(0.06), qh)
    strp.fill.solid()
    strp.fill.fore_color.rgb = q_info["color"]
    strp.line.fill.background()

    tb = slide3.shapes.add_textbox(qx + Inches(0.15), qy + Inches(0.1), qw - Inches(0.3), qh - Inches(0.2))
    tf = tb.text_frame
    tf.word_wrap = True

    p_t = tf.paragraphs[0]
    p_t.text = q_info["title"]
    p_t.font.bold = True
    p_t.font.size = Pt(10)
    p_t.font.color.rgb = q_info["color"]

    p_sub = tf.add_paragraph()
    p_sub.text = q_info["sub"]
    p_sub.font.size = Pt(8)
    p_sub.font.color.rgb = MUTED

    for b in q_info["bullets"]:
        p_b = tf.add_paragraph()
        p_b.text = f"• {b}"
        p_b.font.size = Pt(8)
        p_b.font.color.rgb = SILVER

# Bottom Capabilities Pill Bar
cp_y = Inches(6.65)
cp_tb = slide3.shapes.add_textbox(Inches(0.6), cp_y - Inches(0.05), Inches(3.2), Inches(0.3))
p = cp_tb.text_frame.paragraphs[0]
p.text = "ADDITIONAL CAPABILITIES:"
p.font.bold = True
p.font.size = Pt(8.5)
p.font.color.rgb = CYAN

capabilities = [
    "Head-to-Head Compare",
    "Sensitivity Simulator",
    "Schema Column Mapper",
    "Multi-PAT Token Vault",
    "Executive PDF Dossier",
]

cx_start = Inches(3.2)
for cap in capabilities:
    c_pill = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx_start, cp_y - Inches(0.05), Inches(1.85), Inches(0.28))
    c_pill.fill.solid()
    c_pill.fill.fore_color.rgb = RGBColor(15, 23, 42)
    c_pill.line.color.rgb = CYAN
    c_pill.line.width = Pt(1)
    p_c = c_pill.text_frame.paragraphs[0]
    p_c.text = cap
    p_c.font.size = Pt(7.5)
    p_c.font.color.rgb = SILVER
    p_c.alignment = PP_ALIGN.CENTER
    cx_start += Inches(1.95)

add_footer(slide3, 3)

# ==========================================
# SLIDE 4: TECHNICAL ARCHITECTURE
# ==========================================
slide4 = prs.slides.add_slide(blank_layout)
set_slide_background(slide4)
add_header(slide4, 4, "TECHNICAL ARCHITECTURE & PIPELINE", "End-to-End Client-Side Pipeline: Ingestion, Dual-Stream Scoring & Zero-DB Storage")

stages = [
    {
        "num": "01",
        "title": "MULTI-INTAKE",
        "items": ["CSV / TSV / JSON", "Excel (.xlsx, .xls)", "Google Sheets URLs", "1-Click Demo Loader"],
        "color": EMERALD,
    },
    {
        "num": "02",
        "title": "SCHEMA SNIFFER",
        "items": ["Auto Tall/Wide Sniff", "usedColumns Guard", "No Ghost Members", "ColumnMapperModal"],
        "color": CYAN,
    },
    {
        "num": "03",
        "title": "DUAL SCORING",
        "items": ["GitHub REST Engine", "unpdf Resume Stream", "Anti-Cheat Fork Guard", "Rate-Limit Hash Tag"],
        "color": BLUE,
    },
    {
        "num": "04",
        "title": "MATH STUDIO",
        "items": ["MathScope AST Rules", "Balanced Mean / Decay", "4 Dimension Weights", "Eligibility Gates"],
        "color": AMBER,
    },
    {
        "num": "05",
        "title": "ZERO-DB OUTPUTS",
        "items": ["localStorage Vault", "Live Leaderboard HUD", "Compare & Sensitivity", "Executive PDF Report"],
        "color": PURPLE,
    },
]

sw = Inches(2.26)
sgap = Inches(0.2)
sy = Inches(1.7)

for idx, s in enumerate(stages):
    sx = Inches(0.6) + idx * (sw + sgap)
    box = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx, sy, sw, Inches(1.75))
    box.fill.solid()
    box.fill.fore_color.rgb = CARD_BG
    box.line.color.rgb = CARD_BORDER
    box.line.width = Pt(1)

    # Top accent line
    al = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, sx + Inches(0.1), sy, sw - Inches(0.2), Pt(2.5))
    al.fill.solid()
    al.fill.fore_color.rgb = s["color"]
    al.line.fill.background()

    tb = slide4.shapes.add_textbox(sx + Inches(0.1), sy + Inches(0.1), sw - Inches(0.2), Inches(1.55))
    tf = tb.text_frame
    tf.word_wrap = True

    p_t = tf.paragraphs[0]
    p_t.text = f"{s['num']}. {s['title']}"
    p_t.font.bold = True
    p_t.font.size = Pt(9.5)
    p_t.font.color.rgb = s["color"]

    for it in s["items"]:
        p_it = tf.add_paragraph()
        p_it.text = f"› {it}"
        p_it.font.size = Pt(8)
        p_it.font.color.rgb = SILVER

# 3 Architectural Deep Dive Cards
arch_cards = [
    {
        "title": "1. CLIENT-SIDE LOCALSTORAGE PRIVACY & ZERO-DB MANIFESTO",
        "color": CYAN,
        "paras": [
            "Zero Cloud Database Servers: All scored teams, custom formulas, encrypted tokens, and run history persist in the browser's origin localStorage across computer restarts, tab closures, and venue reboots.",
            "Zero PII & GDPR Liability: Candidate names, phone numbers, roll numbers, and resumes are evaluated in volatile RAM and never touch external database servers, eliminating data breach risks entirely.",
        ],
    },
    {
        "title": "2. SERVERLESS STREAM RESOLVERS & CORS PROXIES",
        "color": BLUE,
        "paras": [
            "Universal Sheet Ingestion (/api/fetch-sheet): Bypasses browser CORS restrictions to fetch and stream Google Sheets exports directly into memory.",
            "Cloud PDF Resume Streamer (/api/parse-resume): Downloads Google Drive / Dropbox PDF links server-side and parses text streams via universal unpdf with zero native C++ dependencies.",
        ],
    },
    {
        "title": "3. ENCRYPTED MULTI-TOKEN PAT VAULT & RATE-LIMIT RESILIENCE",
        "color": EMERALD,
        "paras": [
            "Multi-Token Pool: Organizers pool multiple free Personal Access Tokens client-side with AES encryption. Quotas automatically fail over (e.g. 3 tokens = 15,000 req/hr at $0 cost) with zero token transmission.",
            "Deterministic Hash Fallback: When offline or unauthenticated, candidate handles generate reproducible #hash placeholders with a targeted 'Fetch Remaining' sync button.",
        ],
    },
]

ay_start = Inches(3.65)
card_h = Inches(1.0)
for p in arch_cards:
    c = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), ay_start, Inches(12.13), card_h)
    c.fill.solid()
    c.fill.fore_color.rgb = CARD_BG
    c.line.color.rgb = CARD_BORDER
    c.line.width = Pt(1)

    # Left accent
    l_strip = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), ay_start, Inches(0.06), card_h)
    l_strip.fill.solid()
    l_strip.fill.fore_color.rgb = p["color"]
    l_strip.line.fill.background()

    tb = slide4.shapes.add_textbox(Inches(0.8), ay_start + Inches(0.06), Inches(11.7), card_h - Inches(0.12))
    tf = tb.text_frame
    tf.word_wrap = True

    p_t = tf.paragraphs[0]
    p_t.text = p["title"]
    p_t.font.bold = True
    p_t.font.size = Pt(8.5)
    p_t.font.color.rgb = p["color"]

    for para in p["paras"]:
        p_p = tf.add_paragraph()
        p_p.text = para
        p_p.font.size = Pt(7.5)
        p_p.font.color.rgb = SILVER

    ay_start += card_h + Inches(0.1)

# Tech Stack Footer
tb_stk = slide4.shapes.add_textbox(Inches(0.6), Inches(6.65), Inches(12.13), Inches(0.3))
tf_stk = tb_stk.text_frame
p = tf_stk.paragraphs[0]
p.text = "CORE STACK: Next.js 16 (App Router) • React 19 • TypeScript 5 • Tailwind CSS v4 • unpdf 1.9 • jsPDF & Autotable • xlsx 0.18 • Web Workers"
p.font.bold = True
p.font.size = Pt(8)
p.font.color.rgb = MUTED

add_footer(slide4, 4)

# ==========================================
# SLIDE 5: RESULTS, IMPACT & ROADMAP
# ==========================================
slide5 = prs.slides.add_slide(blank_layout)
set_slide_background(slide5)
add_header(slide5, 5, "RESULTS, IMPACT & SUBMISSION DIFFERENTIATORS", "Quantifiable Performance Benchmarks, Competitive Comparison & Future Scope")

metrics5 = [
    {
        "num": "$0.00",
        "label": "TOTAL API & SERVER BILLS",
        "sub": "100% Free Tier • Zero LLM Tokens",
        "color": EMERALD,
    },
    {
        "num": "< 45s",
        "label": "500-TEAM COHORT SCREENING",
        "sub": "99% Faster than 40+ Human Hours",
        "color": CYAN,
    },
    {
        "num": "100%",
        "label": "EXPLAINABLE AUDIT TRAIL",
        "sub": "Deterministic Mathematical Formulas",
        "color": BLUE,
    },
    {
        "num": "0 Bytes",
        "label": "REMOTE PII RETENTION",
        "sub": "Zero-DB Architecture • Full GDPR",
        "color": PURPLE,
    },
]

mw5 = Inches(2.9)
mgap5 = Inches(0.17)
my5 = Inches(1.65)

for idx, m in enumerate(metrics5):
    mx = Inches(0.6) + idx * (mw5 + mgap5)
    box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, mx, my5, mw5, Inches(1.15))
    box.fill.solid()
    box.fill.fore_color.rgb = CARD_BG
    box.line.color.rgb = CARD_BORDER
    box.line.width = Pt(1)

    tb = slide5.shapes.add_textbox(mx + Inches(0.15), my5 + Inches(0.08), mw5 - Inches(0.3), Inches(1.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p_num = tf.paragraphs[0]
    p_num.text = m["num"]
    p_num.font.bold = True
    p_num.font.size = Pt(24)
    p_num.font.color.rgb = m["color"]

    p_lbl = tf.add_paragraph()
    p_lbl.text = m["label"]
    p_lbl.font.bold = True
    p_lbl.font.size = Pt(8)
    p_lbl.font.color.rgb = WHITE

    p_sub = tf.add_paragraph()
    p_sub.text = m["sub"]
    p_sub.font.size = Pt(7.5)
    p_sub.font.color.rgb = MUTED

# Comparison Table
table_shape = slide5.shapes.add_table(7, 4, Inches(0.6), Inches(2.95), Inches(12.13), Inches(2.3))
table = table_shape.table

# Column widths
table.columns[0].width = Inches(2.3)
table.columns[1].width = Inches(3.2)
table.columns[2].width = Inches(3.2)
table.columns[3].width = Inches(3.43)

headers = ["Recruitment Dimension", "Manual Spreadsheet Review", "Proprietary LLM Wrapper", "Incursion Platform (Track 3)"]
for col_idx, h in enumerate(headers):
    cell = table.cell(0, col_idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = RGBColor(15, 23, 42)
    p = cell.text_frame.paragraphs[0]
    p.text = h
    p.font.bold = True
    p.font.size = Pt(8.5)
    p.font.color.rgb = CYAN

rows_data = [
    ("Evaluation Cost", "High volunteer burnout", "$50 - $200 in API tokens", "$0.00 Forever (Zero paid tokens)"),
    ("Evaluation Latency", "2 to 4 Days (Fatigue)", "10 to 20 mins (Rate throttled)", "< 45 Seconds (In-Memory Workers)"),
    ("Decision Explainability", "Subjective & Inconsistent", "Black-Box LLM Hallucinations", "100% Mathematical AST Rationale"),
    ("Candidate Privacy", "Sheets shared across chats", "Uploaded to remote LLM clouds", "100% Client-Side localStorage (0 DB)"),
    ("Anti-Cheat Defense", "None (Fake links slip by)", "None (Blind link ingestion)", "Fork-Padding & Commit Auditing"),
    ("Chapter Integration", "None", "None", "Live ACM NIT Surat Leaderboard Sync"),
]

for row_idx, r in enumerate(rows_data, start=1):
    for col_idx, val in enumerate(r):
        cell = table.cell(row_idx, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG
        p = cell.text_frame.paragraphs[0]
        p.text = val
        p.font.size = Pt(8)
        if col_idx == 0:
            p.font.bold = True
            p.font.color.rgb = WHITE
        elif col_idx == 1:
            p.font.color.rgb = ROSE
        elif col_idx == 2:
            p.font.color.rgb = AMBER
        else:
            p.font.bold = True
            p.font.color.rgb = EMERALD

# Roadmap Banner
rm_card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(5.4), Inches(12.13), Inches(1.4))
rm_card.fill.solid()
rm_card.fill.fore_color.rgb = CARD_BG
rm_card.line.color.rgb = CYAN
rm_card.line.width = Pt(1)

# Left accent
strp = slide5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(5.4), Inches(0.08), Inches(1.4))
strp.fill.solid()
strp.fill.fore_color.rgb = CYAN
strp.line.fill.background()

tf_rm = rm_card.text_frame
tf_rm.word_wrap = True

p_h = tf_rm.paragraphs[0]
p_h.text = "HACKATHON DIFFERENTIATORS & FUTURE ROADMAP"
p_h.font.bold = True
p_h.font.size = Pt(9.5)
p_h.font.color.rgb = CYAN

roadmaps = [
    ("Rate-Limit Resilience & Selective Sync:", "Surfaces temporary #<hash> badges when rate-limited with a targeted '⚡ Fetch Remaining' button to resume without wasting quota."),
    ("Automated Shortlist Notification Webhooks (Roadmap):", "One-click announcement broadcasts via WhatsApp, Discord, and Slack webhooks directly to shortlisted applicants."),
    ("Client-Side AST Code Quality Scorer (Roadmap):", "In-browser static analysis of candidate codebases for cyclomatic complexity, test coverage, and documentation depth at $0 cost."),
    ("Production Readiness:", "100% test-verified, PWA installable, clean TypeScript architecture with universal Excel, Google Sheets, and CSV intake."),
]

for title, desc in roadmaps:
    p = tf_rm.add_paragraph()
    p.text = f"• {title} {desc}"
    p.font.size = Pt(8)
    p.font.color.rgb = SILVER

add_footer(slide5, 5)

# Save presentations
out_root_pptx = os.path.join(os.path.dirname(__file__), "..", "Incursion_Track3_Presentation.pptx")
out_public_pptx = os.path.join(os.path.dirname(__file__), "..", "public", "Incursion_Track3_Presentation.pptx")

prs.save(out_root_pptx)
prs.save(out_public_pptx)

print("PowerPoint (.pptx) Presentation generated successfully!")
print(f"Saved to: {out_root_pptx}")
print(f"Saved to: {out_public_pptx}")
print(f"Total Slides: {len(prs.slides)}")
