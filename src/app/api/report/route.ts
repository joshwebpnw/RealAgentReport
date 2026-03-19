import { NextRequest, NextResponse } from 'next/server';
import {
  calculateSpeedScore,
  calculateFollowUpScore,
  calculateConversionScore,
  scoreToPercentile,
} from '@/lib/audit-scoring';

/**
 * Anonymous audit calculation for the Real Agent Report funnel.
 * No auth required — this is the free lead-gen tool.
 *
 * Accepts the 6 question answers from the funnel and returns scores.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      closings,       // Screen 2: homes closed last 12 months (number)
      leadVolume,     // Screen 3: leads last 12 months (range string)
      leadSources,    // Screen 4: array of lead source strings
      commission,     // Screen 5: avg commission range string
      responseSpeed,  // Screen 6: response time range string
      followUpCount,  // Screen 7: follow-up count range string
      email,          // Screen 9: email (optional, for gate)
    } = body;

    // Parse inputs into numbers for scoring
    const closingsNum = Number(closings) || 0;
    const leadsPerYear = parseLeadVolume(leadVolume);
    const avgCommission = parseCommission(commission);
    const responseTimeMinutes = parseResponseSpeed(responseSpeed);
    const followUpTouches = parseFollowUp(followUpCount);

    // Calculate conversion rate from closings / leads
    const conversionRate = leadsPerYear > 0 ? (closingsNum / leadsPerYear) * 100 : 2;

    // --- Score calculations (shared with frontend via audit-scoring.ts) ---
    const speedScore = calculateSpeedScore(responseTimeMinutes);
    const followUpScore = calculateFollowUpScore(followUpTouches);
    const conversionScore = calculateConversionScore(conversionRate);

    // Overall weighted score
    const overallScore = Math.round(
      speedScore * 0.4 + followUpScore * 0.3 + conversionScore * 0.3
    );

    // Bell curve percentile (continuous, no more bracket collisions)
    const percentile = scoreToPercentile(overallScore);

    // Badge tier
    let badge: string;
    if (percentile >= 95) badge = 'Top 5%';
    else if (percentile >= 90) badge = 'Top 10%';
    else if (percentile >= 80) badge = 'Top 20%';
    else if (percentile >= 70) badge = 'Top 30%';
    else badge = '';

    // Income analysis (aligned with audit-scoring.ts)
    const BENCHMARK_CONVERSION = 8; // top agent conversion %
    const BENCHMARK_DEALS_PER_YEAR = 38;

    const currentDeals = closingsNum;
    const potentialDeals = Math.min(
      Math.round(leadsPerYear * (BENCHMARK_CONVERSION / 100)),
      BENCHMARK_DEALS_PER_YEAR
    );
    let lostDeals = Math.max(0, potentialDeals - currentDeals);

    // Even high-conversion agents lose deals to slow speed & weak follow-up.
    // Floor: at least 15% of current deals when overall score < 75.
    if (lostDeals < 1 && overallScore < 75) {
      lostDeals = Math.max(2, Math.ceil(currentDeals * 0.15));
    }

    const commissionLeak = Math.round(lostDeals * avgCommission);
    const weeksPerLostDeal = lostDeals > 0 ? Math.round(52 / lostDeals) : 0;

    // Improvement plan (personalized based on weakest area)
    const plan = generateImprovementPlan(speedScore, followUpScore, conversionScore, responseTimeMinutes, followUpTouches);

    const report = {
      overallScore,
      percentile,
      badge,
      speedScore,
      followUpScore,
      conversionScore,
      closings: closingsNum,
      leadsPerYear,
      conversionRate: Math.round(conversionRate * 10) / 10,
      potentialDeals,
      lostDeals,
      commissionLeak: Math.round(commissionLeak),
      weeksPerLostDeal,
      avgCommission,
      responseTimeMinutes,
      followUpTouches,
      leadSources: leadSources || [],
      plan,
    };

    // Forward lead to main app if email provided
    if (email) {
      try {
        const MAIN_APP_URL = process.env.MAIN_APP_URL || 'https://agentassistant.io';
        await fetch(`${MAIN_APP_URL}/api/audit/gate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, report }),
        }).catch(() => {}); // Don't fail if main app is unreachable
      } catch {}
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// --- Parsers ---

function parseLeadVolume(val: string): number {
  if (!val) return 200;
  // Order matters: check most specific first
  if (val.includes('1000')) return 1200;
  if (val.startsWith('500') || val === '500-1000') return 700;
  if (val.startsWith('250') || val === '250-500') return 375;
  if (val.startsWith('100') || val === '100-250') return 175;
  return 50; // 0-100
}

function parseCommission(val: string): number {
  if (!val) return 8000;
  // Order matters: check exact option strings first
  if (val.includes('20k') || val === '$20k+') return 25000;
  if (val.includes('12k') || val === '$12k-$20k') return 16000;
  if (val === '$8k-$12k') return 10000;
  if (val === '$5k-$8k') return 6500;
  if (val.includes('Under') || val.includes('under')) return 3500;
  return 8000;
}

function parseResponseSpeed(val: string): number {
  if (!val) return 120;
  const lower = val.toLowerCase();
  if (lower.includes('under 5') || lower.includes('< 5')) return 3;
  if (lower.includes('5') && lower.includes('30')) return 15;
  if (lower.includes('30') && lower.includes('60')) return 45;
  if (lower.includes('1') && lower.includes('3')) return 120;
  if (lower.includes('same day')) return 720;
  if (lower.includes('next day')) return 1440;
  return 120;
}

function parseFollowUp(val: string): number {
  if (!val) return 2;
  if (val.includes('8') || val.includes('+')) return 10;
  if (val.includes('5') || val.includes('7')) return 6;
  if (val.includes('3') || val.includes('4')) return 3;
  return 1;
}

function generateImprovementPlan(
  speedScore: number,
  followUpScore: number,
  conversionScore: number,
  responseTime: number,
  followUps: number
): Array<{ step: number; title: string; description: string }> {
  const plan: Array<{ step: number; title: string; description: string }> = [];

  // Weakest area first
  const areas = [
    { type: 'speed', score: speedScore },
    { type: 'followup', score: followUpScore },
    { type: 'conversion', score: conversionScore },
  ].sort((a, b) => a.score - b.score);

  let step = 1;
  for (const area of areas) {
    if (step > 3) break;

    if (area.type === 'speed' && speedScore < 80) {
      plan.push({
        step: step++,
        title: 'Respond to new leads faster',
        description: responseTime > 60
          ? `You\'re currently at ${responseTime >= 60 ? Math.round(responseTime / 60) + ' hours' : responseTime + ' minutes'}. Top agents respond in under 5 minutes. Implement automated instant SMS response to capture leads before competitors.`
          : `Your ${responseTime}-minute response time is close. Automate your first touch to cut it under 60 seconds and win leads before the competition.`,
      });
    } else if (area.type === 'followup' && followUpScore < 80) {
      plan.push({
        step: step++,
        title: 'Increase follow-up touches to at least 5',
        description: followUps < 3
          ? `Only ${followUps} follow-ups means most leads go cold. Build an automated sequence with 7+ touches across SMS, email, and phone. Most deals happen after the 5th contact.`
          : `${followUps} follow-ups is a start, but top closers average 7+. Add automated drip sequences to stay in front of leads without manual effort.`,
      });
    } else if (area.type === 'conversion' && conversionScore < 80) {
      plan.push({
        step: step++,
        title: 'Track and nurture pipeline leads consistently',
        description: 'Use a CRM with pipeline tracking, set up lead scoring, and create nurture campaigns for leads that aren\'t ready to transact yet. Converting even 1-2 more deals per year adds significant revenue.',
      });
    }
  }

  // Fill remaining slots if needed
  if (plan.length < 3) {
    if (!plan.some(p => p.title.includes('faster'))) {
      plan.push({ step: plan.length + 1, title: 'Automate your speed-to-lead', description: 'Set up instant AI-powered SMS and email responses within 60 seconds of every new lead. First to respond wins 60-80% of the time.' });
    }
    if (plan.length < 3 && !plan.some(p => p.title.includes('follow-up'))) {
      plan.push({ step: plan.length + 1, title: 'Build multi-channel follow-up sequences', description: 'Create 7+ touch sequences across SMS, email, and phone. Automate the first 5 touches so no lead falls through the cracks.' });
    }
    if (plan.length < 3) {
      plan.push({ step: plan.length + 1, title: 'Re-engage your sphere and past clients', description: 'Most agents leave money on the table by not staying in touch with past clients and referral partners. Set up automated check-ins to generate repeat and referral business.' });
    }
  }

  return plan;
}
