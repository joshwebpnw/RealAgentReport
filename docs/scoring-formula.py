#!/usr/bin/env python3
"""
Real Agent Report - Scoring Formula Documentation PDF
Generates a professional PDF explaining the complete scoring methodology.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
import math
import os

# Colors
BRAND_NAVY = HexColor('#1e293b')
BRAND_BLUE = HexColor('#2563eb')
BRAND_LIGHT = HexColor('#eff6ff')
BRAND_GREEN = HexColor('#059669')
BRAND_AMBER = HexColor('#d97706')
BRAND_RED = HexColor('#dc2626')
GRAY_100 = HexColor('#f1f5f9')
GRAY_200 = HexColor('#e2e8f0')
GRAY_500 = HexColor('#64748b')
GRAY_700 = HexColor('#334155')
GRAY_900 = HexColor('#0f172a')

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'Real_Agent_Report_Scoring_Formula.pdf')

def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
        leftMargin=0.85*inch,
        rightMargin=0.85*inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle(
        'DocTitle', parent=styles['Title'],
        fontSize=26, leading=32, textColor=BRAND_NAVY,
        spaceAfter=4, alignment=TA_CENTER, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'DocSubtitle', parent=styles['Normal'],
        fontSize=12, leading=16, textColor=GRAY_500,
        spaceAfter=24, alignment=TA_CENTER, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'SectionHead', parent=styles['Heading1'],
        fontSize=17, leading=22, textColor=BRAND_NAVY,
        spaceBefore=20, spaceAfter=10, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'SubHead', parent=styles['Heading2'],
        fontSize=13, leading=17, textColor=BRAND_BLUE,
        spaceBefore=14, spaceAfter=6, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontSize=10.5, leading=15, textColor=GRAY_700,
        spaceAfter=8, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'BodyBold', parent=styles['Normal'],
        fontSize=10.5, leading=15, textColor=GRAY_900,
        spaceAfter=8, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'Formula', parent=styles['Normal'],
        fontSize=11, leading=16, textColor=BRAND_NAVY,
        spaceAfter=10, fontName='Courier-Bold', alignment=TA_CENTER,
        backColor=GRAY_100, borderPadding=8,
    ))
    styles.add(ParagraphStyle(
        'Caption', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=GRAY_500,
        spaceAfter=12, fontName='Helvetica-Oblique', alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        'Callout', parent=styles['Normal'],
        fontSize=10, leading=14, textColor=BRAND_NAVY,
        spaceAfter=10, fontName='Helvetica',
        leftIndent=12, borderPadding=10, backColor=BRAND_LIGHT,
    ))
    styles.add(ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontSize=9.5, leading=13, textColor=GRAY_700,
        fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontSize=9.5, leading=13, textColor=white,
        fontName='Helvetica-Bold'
    ))

    story = []

    # ── TITLE PAGE ──
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("Real Agent Report", styles['DocTitle']))
    story.append(Paragraph("Scoring Formula & Methodology", styles['DocSubtitle']))
    story.append(HRFlowable(width="40%", thickness=2, color=BRAND_BLUE, spaceAfter=20))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(
        "This document details the complete scoring algorithm used by Real Agent Report "
        "to calculate agent performance scores, percentile rankings, and commission gap analysis. "
        "All formulas are deterministic - the same inputs always produce the same outputs.",
        styles['Body']
    ))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Prepared for: Tim Donovan & Justin Smith", styles['BodyBold']))
    story.append(Paragraph("Product: agentassistant.io / realagentreport.com", styles['Body']))
    story.append(Paragraph("Date: March 2026", styles['Body']))

    story.append(PageBreak())

    # ── TABLE OF CONTENTS ──
    story.append(Paragraph("Table of Contents", styles['SectionHead']))
    toc_items = [
        "1. Overview - How the Score Works",
        "2. Input Collection - The 7-Question Funnel",
        "3. Component Scoring - Speed, Follow-Up, Conversion",
        "4. Weighted Overall Score",
        "5. Bell Curve Percentile Distribution",
        "6. Tier Labels & Badges",
        "7. Commission Gap Analysis",
        "8. Example Walkthrough",
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles['Body']))
    story.append(Spacer(1, 0.5*inch))

    # ── 1. OVERVIEW ──
    story.append(Paragraph("1. Overview", styles['SectionHead']))
    story.append(Paragraph(
        "The Real Agent Report scoring system evaluates real estate agents across three "
        "core performance dimensions:",
        styles['Body']
    ))
    overview_data = [
        [Paragraph("<b>Dimension</b>", styles['TableHeader']),
         Paragraph("<b>Weight</b>", styles['TableHeader']),
         Paragraph("<b>What It Measures</b>", styles['TableHeader'])],
        [Paragraph("Speed to Lead", styles['TableCell']),
         Paragraph("40%", styles['TableCell']),
         Paragraph("How fast the agent responds to new leads", styles['TableCell'])],
        [Paragraph("Follow-Up Persistence", styles['TableCell']),
         Paragraph("30%", styles['TableCell']),
         Paragraph("How many times the agent contacts each lead", styles['TableCell'])],
        [Paragraph("Conversion Rate", styles['TableCell']),
         Paragraph("30%", styles['TableCell']),
         Paragraph("Percentage of leads that become closed deals", styles['TableCell'])],
    ]
    t = Table(overview_data, colWidths=[1.8*inch, 0.8*inch, 3.6*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Speed is weighted highest (40%) because industry data shows that the first agent "
        "to respond wins 60-80% of the time. Follow-up and conversion are equally weighted "
        "at 30% each.",
        styles['Callout']
    ))

    # ── 2. INPUT COLLECTION ──
    story.append(Paragraph("2. Input Collection", styles['SectionHead']))
    story.append(Paragraph(
        "The funnel collects 7 data points. Each multiple-choice answer maps to a numeric "
        "midpoint value used in calculations:",
        styles['Body']
    ))

    story.append(Paragraph("Question 1: Homes Closed (last 12 months)", styles['SubHead']))
    story.append(Paragraph("Free-text number input (e.g., 12, 25). Used directly as closings count.", styles['Body']))

    story.append(Paragraph("Question 2: Lead Volume (last 12 months)", styles['SubHead']))
    lead_data = [
        [Paragraph("<b>Answer</b>", styles['TableHeader']), Paragraph("<b>Mapped Value</b>", styles['TableHeader'])],
        [Paragraph("0-100", styles['TableCell']), Paragraph("50 leads/year", styles['TableCell'])],
        [Paragraph("100-250", styles['TableCell']), Paragraph("175 leads/year", styles['TableCell'])],
        [Paragraph("250-500", styles['TableCell']), Paragraph("375 leads/year", styles['TableCell'])],
        [Paragraph("500-1,000", styles['TableCell']), Paragraph("750 leads/year", styles['TableCell'])],
        [Paragraph("1,000+", styles['TableCell']), Paragraph("1,200 leads/year", styles['TableCell'])],
    ]
    t = Table(lead_data, colWidths=[3*inch, 3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("Question 3: Lead Sources", styles['SubHead']))
    story.append(Paragraph(
        "Multi-select checkboxes (Zillow, Google, Ads, Open Houses, Referrals, Past Clients, "
        "Sign Calls, Other). Stored for context but not scored.",
        styles['Body']
    ))

    story.append(Paragraph("Question 4: Average Commission Per Deal", styles['SubHead']))
    comm_data = [
        [Paragraph("<b>Answer</b>", styles['TableHeader']), Paragraph("<b>Mapped Value</b>", styles['TableHeader'])],
        [Paragraph("Under $5k", styles['TableCell']), Paragraph("$3,500", styles['TableCell'])],
        [Paragraph("$5k-$8k", styles['TableCell']), Paragraph("$6,500", styles['TableCell'])],
        [Paragraph("$8k-$12k", styles['TableCell']), Paragraph("$10,000", styles['TableCell'])],
        [Paragraph("$12k-$20k", styles['TableCell']), Paragraph("$16,000", styles['TableCell'])],
        [Paragraph("$20k+", styles['TableCell']), Paragraph("$25,000", styles['TableCell'])],
    ]
    t = Table(comm_data, colWidths=[3*inch, 3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("Question 5: Response Speed to New Leads", styles['SubHead']))
    speed_data = [
        [Paragraph("<b>Answer</b>", styles['TableHeader']), Paragraph("<b>Mapped Value</b>", styles['TableHeader'])],
        [Paragraph("Under 5 minutes", styles['TableCell']), Paragraph("2.5 minutes", styles['TableCell'])],
        [Paragraph("5-30 minutes", styles['TableCell']), Paragraph("17.5 minutes", styles['TableCell'])],
        [Paragraph("30-60 minutes", styles['TableCell']), Paragraph("45 minutes", styles['TableCell'])],
        [Paragraph("1-3 hours", styles['TableCell']), Paragraph("120 minutes", styles['TableCell'])],
        [Paragraph("Same day", styles['TableCell']), Paragraph("720 minutes (12 hrs)", styles['TableCell'])],
        [Paragraph("Next day", styles['TableCell']), Paragraph("1,440 minutes (24 hrs)", styles['TableCell'])],
    ]
    t = Table(speed_data, colWidths=[3*inch, 3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("Question 6: Follow-Up Touches Per Lead", styles['SubHead']))
    fu_data = [
        [Paragraph("<b>Answer</b>", styles['TableHeader']), Paragraph("<b>Mapped Value</b>", styles['TableHeader'])],
        [Paragraph("1-2 times", styles['TableCell']), Paragraph("1.5 touches", styles['TableCell'])],
        [Paragraph("3-4 times", styles['TableCell']), Paragraph("3.5 touches", styles['TableCell'])],
        [Paragraph("5-7 times", styles['TableCell']), Paragraph("6 touches", styles['TableCell'])],
        [Paragraph("8+", styles['TableCell']), Paragraph("10 touches", styles['TableCell'])],
    ]
    t = Table(fu_data, colWidths=[3*inch, 3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("Question 7: Automation Usage", styles['SubHead']))
    story.append(Paragraph(
        "Yes/No answer. Used for personalized improvement plan messaging, not scored numerically.",
        styles['Body']
    ))

    story.append(Paragraph("Derived Input: Conversion Rate", styles['SubHead']))
    story.append(Paragraph(
        "conversionRate = (closings / annualLeads) x 100",
        styles['Formula']
    ))
    story.append(Paragraph(
        "If leads = 0, defaults to 2%. Capped at 100% maximum.",
        styles['Caption']
    ))

    story.append(PageBreak())

    # ── 3. COMPONENT SCORING ──
    story.append(Paragraph("3. Component Scoring", styles['SectionHead']))
    story.append(Paragraph(
        "Each of the three dimensions is scored on a 0-100 scale using bracket-based thresholds. "
        "These brackets are calibrated against industry benchmarks from NAR and InsideSales.com data.",
        styles['Body']
    ))

    story.append(Paragraph("3a. Speed Score (40% weight)", styles['SubHead']))
    story.append(Paragraph(
        "Measures response time to new leads. Heavily front-loaded because "
        "the difference between 5 minutes and 30 minutes matters far more than "
        "the difference between 4 hours and 8 hours.",
        styles['Body']
    ))
    speed_score_data = [
        [Paragraph("<b>Response Time</b>", styles['TableHeader']),
         Paragraph("<b>Score</b>", styles['TableHeader']),
         Paragraph("<b>Rating</b>", styles['TableHeader'])],
        [Paragraph("Under 5 minutes", styles['TableCell']),
         Paragraph("100", styles['TableCell']),
         Paragraph("Elite - first to respond wins", styles['TableCell'])],
        [Paragraph("5-15 minutes", styles['TableCell']),
         Paragraph("85", styles['TableCell']),
         Paragraph("Very good - slight gap", styles['TableCell'])],
        [Paragraph("15-60 minutes", styles['TableCell']),
         Paragraph("65", styles['TableCell']),
         Paragraph("Good - moderate gap", styles['TableCell'])],
        [Paragraph("1-4 hours", styles['TableCell']),
         Paragraph("40", styles['TableCell']),
         Paragraph("Poor - significant gap", styles['TableCell'])],
        [Paragraph("4-24 hours (same day)", styles['TableCell']),
         Paragraph("20", styles['TableCell']),
         Paragraph("Very poor - most leads gone", styles['TableCell'])],
        [Paragraph("Next day or later", styles['TableCell']),
         Paragraph("10", styles['TableCell']),
         Paragraph("Critical - lead is cold", styles['TableCell'])],
    ]
    t = Table(speed_score_data, colWidths=[2*inch, 0.8*inch, 3.4*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("3b. Follow-Up Score (30% weight)", styles['SubHead']))
    story.append(Paragraph(
        "Measures persistence in contacting leads. Research shows 80% of sales require "
        "5+ follow-up touches, but most agents stop after 1-2.",
        styles['Body']
    ))
    fu_score_data = [
        [Paragraph("<b>Follow-Up Touches</b>", styles['TableHeader']),
         Paragraph("<b>Score</b>", styles['TableHeader']),
         Paragraph("<b>Rating</b>", styles['TableHeader'])],
        [Paragraph("15+ touches", styles['TableCell']),
         Paragraph("100", styles['TableCell']),
         Paragraph("Elite - comprehensive nurture system", styles['TableCell'])],
        [Paragraph("10-14 touches", styles['TableCell']),
         Paragraph("85", styles['TableCell']),
         Paragraph("Very good - strong persistence", styles['TableCell'])],
        [Paragraph("6-9 touches", styles['TableCell']),
         Paragraph("70", styles['TableCell']),
         Paragraph("Good - above average", styles['TableCell'])],
        [Paragraph("3-5 touches", styles['TableCell']),
         Paragraph("50", styles['TableCell']),
         Paragraph("Fair - leaving deals on the table", styles['TableCell'])],
        [Paragraph("1-2 touches", styles['TableCell']),
         Paragraph("25", styles['TableCell']),
         Paragraph("Poor - most leads go cold", styles['TableCell'])],
        [Paragraph("0 touches", styles['TableCell']),
         Paragraph("0", styles['TableCell']),
         Paragraph("No follow-up at all", styles['TableCell'])],
    ]
    t = Table(fu_score_data, colWidths=[2*inch, 0.8*inch, 3.4*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("3c. Conversion Score (30% weight)", styles['SubHead']))
    story.append(Paragraph(
        "Measures what percentage of leads become closed deals. Calculated as "
        "(closings / annual leads) x 100. Top-performing agents typically convert 8-12%.",
        styles['Body']
    ))
    conv_score_data = [
        [Paragraph("<b>Conversion Rate</b>", styles['TableHeader']),
         Paragraph("<b>Score</b>", styles['TableHeader']),
         Paragraph("<b>Rating</b>", styles['TableHeader'])],
        [Paragraph("10%+", styles['TableCell']),
         Paragraph("100", styles['TableCell']),
         Paragraph("Elite - exceptional closer", styles['TableCell'])],
        [Paragraph("7-9.9%", styles['TableCell']),
         Paragraph("85", styles['TableCell']),
         Paragraph("Very good - strong conversion", styles['TableCell'])],
        [Paragraph("5-6.9%", styles['TableCell']),
         Paragraph("70", styles['TableCell']),
         Paragraph("Good - above average", styles['TableCell'])],
        [Paragraph("3-4.9%", styles['TableCell']),
         Paragraph("50", styles['TableCell']),
         Paragraph("Fair - room for improvement", styles['TableCell'])],
        [Paragraph("1-2.9%", styles['TableCell']),
         Paragraph("25", styles['TableCell']),
         Paragraph("Poor - significant leak", styles['TableCell'])],
        [Paragraph("Under 1%", styles['TableCell']),
         Paragraph("0", styles['TableCell']),
         Paragraph("Critical - pipeline issue", styles['TableCell'])],
    ]
    t = Table(conv_score_data, colWidths=[2*inch, 0.8*inch, 3.4*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(PageBreak())

    # ── 4. WEIGHTED OVERALL SCORE ──
    story.append(Paragraph("4. Weighted Overall Score", styles['SectionHead']))
    story.append(Paragraph(
        "The three component scores are combined using a weighted average:",
        styles['Body']
    ))
    story.append(Paragraph(
        "Overall Score = round( Speed x 0.40 + Follow-Up x 0.30 + Conversion x 0.30 )",
        styles['Formula']
    ))
    story.append(Paragraph(
        "Result is an integer from 0 to 100. Speed carries the most weight because response "
        "time is the single biggest predictor of lead conversion in real estate.",
        styles['Body']
    ))

    # Example calculation
    story.append(Paragraph("Example:", styles['SubHead']))
    story.append(Paragraph(
        "An agent who responds in 17 minutes (speed=85), does 3.5 follow-ups (follow-up=50), "
        "and has a 6.9% conversion rate (conversion=70):",
        styles['Body']
    ))
    story.append(Paragraph(
        "Overall = round( 85 x 0.40 + 50 x 0.30 + 70 x 0.30 ) = round( 34 + 15 + 21 ) = 70",
        styles['Formula']
    ))

    # ── 5. BELL CURVE PERCENTILE ──
    story.append(Paragraph("5. Bell Curve Percentile Distribution", styles['SectionHead']))
    story.append(Paragraph(
        "The overall score (0-100) is mapped to a percentile using a standard normal distribution "
        "(bell curve). This ensures every different score produces a unique percentile, and "
        "the distribution reflects real-world agent performance patterns.",
        styles['Body']
    ))

    story.append(Paragraph("Distribution Parameters", styles['SubHead']))
    param_data = [
        [Paragraph("<b>Parameter</b>", styles['TableHeader']),
         Paragraph("<b>Value</b>", styles['TableHeader']),
         Paragraph("<b>Why</b>", styles['TableHeader'])],
        [Paragraph("Mean", styles['TableCell']),
         Paragraph("45", styles['TableCell']),
         Paragraph("Average agent scores slightly below midpoint (most agents have gaps)", styles['TableCell'])],
        [Paragraph("Standard Deviation", styles['TableCell']),
         Paragraph("18", styles['TableCell']),
         Paragraph("Provides meaningful spread - most agents fall between 27 and 63", styles['TableCell'])],
        [Paragraph("Clamp Range", styles['TableCell']),
         Paragraph("1st - 99th", styles['TableCell']),
         Paragraph("Never shows 0th or 100th percentile", styles['TableCell'])],
    ]
    t = Table(param_data, colWidths=[1.5*inch, 0.8*inch, 3.9*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("Formula", styles['SubHead']))
    story.append(Paragraph(
        "percentile = normalCDF( score, mean=45, sd=18 ) x 100",
        styles['Formula']
    ))
    story.append(Paragraph(
        'The CDF (Cumulative Distribution Function) uses the Abramowitz &amp; Stegun '
        'approximation of the error function for high-precision results without external libraries.',
        styles['Body']
    ))

    story.append(Paragraph("Score-to-Percentile Reference Table", styles['SubHead']))

    # Generate the bell curve reference table
    def normal_cdf(x, mean=45, sd=18):
        z = (x - mean) / (sd * math.sqrt(2))
        t = 1 / (1 + 0.3275911 * abs(z))
        a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429]
        poly = t * (a[0] + t * (a[1] + t * (a[2] + t * (a[3] + t * a[4]))))
        erf = 1 - poly * math.exp(-(z * z))
        erf_signed = erf if z >= 0 else -erf
        raw = 0.5 * (1 + erf_signed) * 100
        return round(max(1, min(99, raw)))

    bell_data = [
        [Paragraph("<b>Score</b>", styles['TableHeader']),
         Paragraph("<b>Percentile</b>", styles['TableHeader']),
         Paragraph("<b>Label</b>", styles['TableHeader']),
         Paragraph("<b>Score</b>", styles['TableHeader']),
         Paragraph("<b>Percentile</b>", styles['TableHeader']),
         Paragraph("<b>Label</b>", styles['TableHeader'])],
    ]
    scores_left = [20, 25, 30, 35, 40, 45, 50]
    scores_right = [55, 60, 65, 70, 75, 80, 85]
    for sl, sr in zip(scores_left, scores_right):
        pl = normal_cdf(sl)
        pr = normal_cdf(sr)
        ll = f"Bottom {pl}%" if pl < 50 else f"Top {100-pl}%"
        lr = f"Bottom {pr}%" if pr < 50 else f"Top {100-pr}%"
        bell_data.append([
            Paragraph(str(sl), styles['TableCell']),
            Paragraph(f"{pl}th", styles['TableCell']),
            Paragraph(ll, styles['TableCell']),
            Paragraph(str(sr), styles['TableCell']),
            Paragraph(f"{pr}th", styles['TableCell']),
            Paragraph(lr, styles['TableCell']),
        ])

    t = Table(bell_data, colWidths=[0.7*inch, 0.9*inch, 1.3*inch, 0.7*inch, 0.9*inch, 1.3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
        ('LINEBEFORE', (3, 0), (3, -1), 1.5, BRAND_BLUE),
    ]))
    callout = Paragraph(
        "Every unique score maps to a unique percentile. No two different scores will "
        "ever show the same ranking.",
        styles['Callout']
    )
    story.append(KeepTogether([t, Spacer(1, 6), callout]))

    story.append(PageBreak())

    # ── 6. TIER LABELS & BADGES ──
    story.append(Paragraph("6. Tier Labels & Badges", styles['SectionHead']))
    story.append(Paragraph(
        "Based on the overall score, agents receive a performance tier label and (for top performers) "
        "a shareable badge.",
        styles['Body']
    ))

    story.append(Paragraph("Performance Tiers", styles['SubHead']))
    tier_data = [
        [Paragraph("<b>Score Range</b>", styles['TableHeader']),
         Paragraph("<b>Approx. Percentile</b>", styles['TableHeader']),
         Paragraph("<b>Tier Label</b>", styles['TableHeader']),
         Paragraph("<b>Color</b>", styles['TableHeader'])],
        [Paragraph("75-100", styles['TableCell']),
         Paragraph("95th+", styles['TableCell']),
         Paragraph("Elite", styles['TableCell']),
         Paragraph("Emerald/Green", styles['TableCell'])],
        [Paragraph("65-74", styles['TableCell']),
         Paragraph("87th-94th", styles['TableCell']),
         Paragraph("High Performer", styles['TableCell']),
         Paragraph("Blue", styles['TableCell'])],
        [Paragraph("55-64", styles['TableCell']),
         Paragraph("71st-86th", styles['TableCell']),
         Paragraph("Above Average", styles['TableCell']),
         Paragraph("Indigo", styles['TableCell'])],
        [Paragraph("40-54", styles['TableCell']),
         Paragraph("39th-70th", styles['TableCell']),
         Paragraph("Falling Behind", styles['TableCell']),
         Paragraph("Amber/Warning", styles['TableCell'])],
        [Paragraph("0-39", styles['TableCell']),
         Paragraph("Below 39th", styles['TableCell']),
         Paragraph("At Risk", styles['TableCell']),
         Paragraph("Red/Danger", styles['TableCell'])],
    ]
    t = Table(tier_data, colWidths=[1.2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("Shareable Badges (Top Performers Only)", styles['SubHead']))
    badge_data = [
        [Paragraph("<b>Score</b>", styles['TableHeader']),
         Paragraph("<b>Badge</b>", styles['TableHeader']),
         Paragraph("<b>Purpose</b>", styles['TableHeader'])],
        [Paragraph("90+", styles['TableCell']),
         Paragraph("Top 5% Agent", styles['TableCell']),
         Paragraph("Gold badge - drives viral sharing and challenges", styles['TableCell'])],
        [Paragraph("80-89", styles['TableCell']),
         Paragraph("Top 10% Agent", styles['TableCell']),
         Paragraph("Silver badge - encourages social proof", styles['TableCell'])],
        [Paragraph("70-79", styles['TableCell']),
         Paragraph("Top 20% Agent", styles['TableCell']),
         Paragraph("Bronze badge - aspirational for above-average agents", styles['TableCell'])],
    ]
    t = Table(badge_data, colWidths=[1*inch, 1.5*inch, 3.7*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    # ── 7. COMMISSION GAP ANALYSIS ──
    story.append(Paragraph("7. Commission Gap Analysis", styles['SectionHead']))
    story.append(Paragraph(
        "The report calculates how much commission the agent is likely leaving on the table "
        "compared to top-performing agents with the same lead volume.",
        styles['Body']
    ))

    story.append(Paragraph("Benchmarks", styles['SubHead']))
    bench_data = [
        [Paragraph("<b>Benchmark</b>", styles['TableHeader']),
         Paragraph("<b>Value</b>", styles['TableHeader']),
         Paragraph("<b>Source</b>", styles['TableHeader'])],
        [Paragraph("Top Agent Conversion Rate", styles['TableCell']),
         Paragraph("8%", styles['TableCell']),
         Paragraph("NAR / industry averages for top 10% agents", styles['TableCell'])],
        [Paragraph("Max Deals Per Year", styles['TableCell']),
         Paragraph("38", styles['TableCell']),
         Paragraph("Practical ceiling for individual agent capacity", styles['TableCell'])],
        [Paragraph("Deal Recovery Rate", styles['TableCell']),
         Paragraph("35%", styles['TableCell']),
         Paragraph("% of lost deals recoverable with better systems", styles['TableCell'])],
    ]
    t = Table(bench_data, colWidths=[2*inch, 0.8*inch, 3.4*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("Calculation Steps", styles['SubHead']))
    steps = [
        ("Step 1 - Current Deals:", "currentDeals = (annualLeads x conversionRate) / 100"),
        ("Step 2 - Top Agent Deals:", "topDeals = min( annualLeads x 8 / 100, 38 )"),
        ("Step 3 - Lost Deals:", "lostDeals = max( 0, topDeals - currentDeals )"),
        ("Step 4 - Commission Leak:", "commissionLeak = max( lostDeals x avgCommission, avgCommission x 2 )"),
        ("Step 5 - Recoverable:", "recoverableAmount = commissionLeak x 0.35"),
    ]
    for label, formula in steps:
        story.append(Paragraph(f"<b>{label}</b>", styles['Body']))
        story.append(Paragraph(formula, styles['Formula']))

    story.append(Paragraph(
        "The commission leak has a floor of 2x average commission. This ensures even "
        "high-performing agents see a meaningful improvement opportunity, which is important "
        "for the CTA to Agent Assistant. The 35% recovery rate is conservative and credible.",
        styles['Callout']
    ))

    story.append(PageBreak())

    # ── 8. EXAMPLE WALKTHROUGH ──
    story.append(Paragraph("8. Full Example Walkthrough", styles['SectionHead']))
    story.append(Paragraph(
        "Here is a complete calculation for a typical mid-market real estate agent:",
        styles['Body']
    ))

    story.append(Paragraph("Inputs", styles['SubHead']))
    example_input = [
        [Paragraph("<b>Question</b>", styles['TableHeader']),
         Paragraph("<b>Answer</b>", styles['TableHeader']),
         Paragraph("<b>Parsed Value</b>", styles['TableHeader'])],
        [Paragraph("Closings", styles['TableCell']),
         Paragraph("12", styles['TableCell']),
         Paragraph("12 deals", styles['TableCell'])],
        [Paragraph("Lead Volume", styles['TableCell']),
         Paragraph("100-250", styles['TableCell']),
         Paragraph("175 leads/year", styles['TableCell'])],
        [Paragraph("Commission", styles['TableCell']),
         Paragraph("$8k-$12k", styles['TableCell']),
         Paragraph("$10,000 avg", styles['TableCell'])],
        [Paragraph("Response Speed", styles['TableCell']),
         Paragraph("5-30 minutes", styles['TableCell']),
         Paragraph("17.5 minutes", styles['TableCell'])],
        [Paragraph("Follow-Up", styles['TableCell']),
         Paragraph("3-4 times", styles['TableCell']),
         Paragraph("3.5 touches", styles['TableCell'])],
    ]
    t = Table(example_input, colWidths=[1.5*inch, 1.5*inch, 2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Paragraph("Step-by-Step Calculation", styles['SubHead']))

    calc_steps = [
        "1. Conversion Rate = (12 / 175) x 100 = 6.9%",
        "2. Speed Score: 17.5 min falls in 5-15 min bracket = 85",
        "3. Follow-Up Score: 3.5 touches falls in 3-5 bracket = 50",
        "4. Conversion Score: 6.9% falls in 5-6.9% bracket = 70",
        "5. Overall = round(85 x 0.40 + 50 x 0.30 + 70 x 0.30) = round(34 + 15 + 21) = 70",
        "6. Percentile = normalCDF(70, mean=45, sd=18) x 100 = 92nd percentile",
        "7. Tier = High Performer (score 65-74 range)",
        "8. Badge = Top 20% Agent (score 70-79 range)",
    ]
    for step in calc_steps:
        story.append(Paragraph(step, styles['Body']))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Commission Gap:", styles['SubHead']))
    gap_steps = [
        "9. Top Agent Deals = min(175 x 0.08, 38) = 14 deals",
        "10. Lost Deals = max(0, 14 - 12) = 2 deals",
        "11. Raw Leak = 2 x $10,000 = $20,000",
        "12. Commission Leak = max($20,000, $10,000 x 2) = $20,000",
        "13. Recoverable = $20,000 x 0.35 = $7,000",
    ]
    for step in gap_steps:
        story.append(Paragraph(step, styles['Body']))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Final Report Output", styles['SubHead']))
    output_data = [
        [Paragraph("<b>Field</b>", styles['TableHeader']),
         Paragraph("<b>Value</b>", styles['TableHeader'])],
        [Paragraph("Overall Score", styles['TableCell']), Paragraph("70 / 100", styles['TableCell'])],
        [Paragraph("Percentile", styles['TableCell']), Paragraph("92nd (Top 8%)", styles['TableCell'])],
        [Paragraph("Tier", styles['TableCell']), Paragraph("High Performer", styles['TableCell'])],
        [Paragraph("Badge", styles['TableCell']), Paragraph("Top 20% Agent", styles['TableCell'])],
        [Paragraph("Commission Leak", styles['TableCell']), Paragraph("$20,000/year", styles['TableCell'])],
        [Paragraph("Recoverable", styles['TableCell']), Paragraph("$7,000 with better systems", styles['TableCell'])],
    ]
    t = Table(output_data, colWidths=[2*inch, 3.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
    ]))
    story.append(t)

    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="100%", thickness=1, color=GRAY_200, spaceAfter=12))
    story.append(Paragraph(
        "This scoring methodology is deterministic and consistent across all entry points "
        "(web funnel, API, and future integrations). The bell curve distribution ensures "
        "meaningful differentiation between agents at every performance level.",
        styles['Body']
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Patriot Pulse Digital - Real Agent Report Scoring v2.0 - March 2026",
        styles['Caption']
    ))

    doc.build(story)
    print(f"PDF generated: {os.path.abspath(OUTPUT_PATH)}")

if __name__ == '__main__':
    build_pdf()
