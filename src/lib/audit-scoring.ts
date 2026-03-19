// Tim's deterministic scoring formula
// Speed: 40% weight, Follow-up: 30% weight, Conversion: 30% weight

interface AuditInput {
  responseTimeMinutes: number; // in minutes
  followUpTouches: number;
  conversionRate: number; // as percentage, e.g. 5 = 5%
  leadsPerMonth: number;
  avgCommission: number;
  avgHomePrice: number;
}

interface AuditScoreResult {
  overallScore: number;
  speedScore: number;
  followUpScore: number;
  conversionScore: number;
  marketRanking: string;
  marketPercentile: string;
  estimatedLostCommission: number;
  incomeGap: {
    currentEstimatedIncome: number;
    topAgentIncome: number;
    recoverableAmount: number;
    recoveryRate: number;
  };
  speedBreakdown: { input: number; score: number; benchmark: string };
  followUpBreakdown: { input: number; score: number; benchmark: string };
  conversionBreakdown: { input: number; score: number; benchmark: string };
}

export function calculateSpeedScore(responseTimeMinutes: number): number {
  if (responseTimeMinutes < 5) return 100;
  if (responseTimeMinutes <= 15) return 85;
  if (responseTimeMinutes <= 60) return 65;
  if (responseTimeMinutes <= 240) return 40; // 1-4 hours
  if (responseTimeMinutes <= 1440) return 20; // same day
  return 10; // next day+
}

export function calculateFollowUpScore(touches: number): number {
  if (touches >= 15) return 100;
  if (touches >= 10) return 85;
  if (touches >= 6) return 70;
  if (touches >= 3) return 50;
  if (touches >= 1) return 25;
  return 0;
}

export function calculateConversionScore(rate: number): number {
  if (rate >= 10) return 100;
  if (rate >= 7) return 85;
  if (rate >= 5) return 70;
  if (rate >= 3) return 50;
  if (rate >= 1) return 25;
  return 0;
}

/**
 * Standard normal CDF approximation using the error function.
 * Maps a 0-100 score to a percentile using a bell curve distribution.
 *
 * Parameters calibrated to real estate agent performance:
 * - Mean = 45 (average agent scores below midpoint)
 * - SD = 18 (reasonable spread across the population)
 */
function normalCDF(x: number, mean: number, sd: number): number {
  const z = (x - mean) / (sd * Math.SQRT2);
  // Abramowitz & Stegun approximation of erf
  const t = 1 / (1 + 0.3275911 * Math.abs(z));
  const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  const poly = t * (a[0] + t * (a[1] + t * (a[2] + t * (a[3] + t * a[4]))));
  const erf = 1 - poly * Math.exp(-(z * z));
  const erfSigned = z >= 0 ? erf : -erf;
  return 0.5 * (1 + erfSigned);
}

const BELL_CURVE_MEAN = 45;
const BELL_CURVE_SD = 21.5;

export function scoreToPercentile(overallScore: number): number {
  const raw = normalCDF(overallScore, BELL_CURVE_MEAN, BELL_CURVE_SD) * 100;
  // Clamp to 1-99 range (never show 0th or 100th percentile)
  return Math.round(Math.max(1, Math.min(99, raw)));
}

export function getMarketRanking(overallScore: number): { ranking: string; percentile: string } {
  const pct = scoreToPercentile(overallScore);
  let ranking: string;
  if (pct >= 95) ranking = 'Elite';
  else if (pct >= 88) ranking = 'High Performer';
  else if (pct >= 71) ranking = 'Above Average';
  else if (pct >= 39) ranking = 'Falling Behind';
  else ranking = 'At Risk';

  const percentileLabel = pct >= 50 ? `Top ${100 - pct}%` : `Bottom ${pct}%`;
  return { ranking, percentile: percentileLabel };
}

export function calculateAuditScore(input: AuditInput): AuditScoreResult {
  const speedScore = calculateSpeedScore(input.responseTimeMinutes);
  const followUpScore = calculateFollowUpScore(input.followUpTouches);
  const conversionScore = calculateConversionScore(input.conversionRate);

  // Weighted overall score
  const overallScore = Math.round(
    speedScore * 0.4 + followUpScore * 0.3 + conversionScore * 0.3
  );

  const { ranking, percentile } = getMarketRanking(overallScore);

  // Income analysis
  // Benchmark: 8% conversion rate, 38 deals/yr cap for top agents
  const BENCHMARK_CONVERSION = 8;
  const BENCHMARK_DEALS_PER_YEAR = 38;
  const DEAL_RECOVERY_RATE = 0.35; // 35% of lost deals recoverable with automation

  const annualLeads = input.leadsPerMonth * 12;
  const currentDealsPerYear = (annualLeads * input.conversionRate) / 100;
  const currentEstimatedIncome = currentDealsPerYear * input.avgCommission;
  const topAgentDeals = Math.min(annualLeads * BENCHMARK_CONVERSION / 100, BENCHMARK_DEALS_PER_YEAR);
  const topAgentIncome = topAgentDeals * input.avgCommission;

  let lostDeals = Math.max(0, topAgentDeals - currentDealsPerYear);

  // Every agent loses some deals to speed & follow-up gaps, even top performers.
  // Agents don't see the leads that ghosted because they were too slow.
  // Floor: at least 2 lost deals (scales down for elite agents).
  if (lostDeals < 2) {
    lostDeals = Math.max(2, Math.ceil(currentDealsPerYear * 0.10));
  }

  const estimatedLostCommission = Math.round(lostDeals * input.avgCommission);
  const recoverableAmount = Math.round(lostDeals * DEAL_RECOVERY_RATE * input.avgCommission);

  // Speed benchmark description
  let speedBenchmark = '< 5 minutes (top agents)';
  if (input.responseTimeMinutes >= 1440) speedBenchmark = 'Next day+ (critical gap)';
  else if (input.responseTimeMinutes >= 240) speedBenchmark = '1-4 hours (significant gap)';
  else if (input.responseTimeMinutes >= 60) speedBenchmark = '15-60 minutes (moderate gap)';
  else if (input.responseTimeMinutes >= 15) speedBenchmark = '5-15 minutes (slight gap)';

  return {
    overallScore,
    speedScore,
    followUpScore,
    conversionScore,
    marketRanking: ranking,
    marketPercentile: percentile,
    estimatedLostCommission,
    incomeGap: {
      currentEstimatedIncome: Math.round(currentEstimatedIncome),
      topAgentIncome: Math.round(topAgentIncome),
      recoverableAmount,
      recoveryRate: DEAL_RECOVERY_RATE,
    },
    speedBreakdown: {
      input: input.responseTimeMinutes,
      score: speedScore,
      benchmark: speedBenchmark,
    },
    followUpBreakdown: {
      input: input.followUpTouches,
      score: followUpScore,
      benchmark: '15+ touches (top agents)',
    },
    conversionBreakdown: {
      input: input.conversionRate,
      score: conversionScore,
      benchmark: '8-12% (top agents)',
    },
  };
}
