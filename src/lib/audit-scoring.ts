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

export function getMarketRanking(overallScore: number): { ranking: string; percentile: string } {
  if (overallScore >= 90) return { ranking: 'Elite', percentile: 'Top 5%' };
  if (overallScore >= 80) return { ranking: 'High Performer', percentile: 'Top 10%' };
  if (overallScore >= 70) return { ranking: 'Above Average', percentile: 'Top 25%' };
  if (overallScore >= 55) return { ranking: 'Average', percentile: 'Top 50%' };
  return { ranking: 'Below Average', percentile: 'Bottom 50%' };
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

  // Income gap analysis
  // Benchmark: 8% conversion rate, 38 deals/yr for top agents
  const BENCHMARK_CONVERSION = 8;
  const BENCHMARK_DEALS_PER_YEAR = 38;
  const DEAL_RECOVERY_RATE = 0.35; // 35% of lost deals recoverable

  const currentDealsPerYear = (input.leadsPerMonth * 12 * input.conversionRate) / 100;
  const currentEstimatedIncome = currentDealsPerYear * input.avgCommission;
  const topAgentDeals = Math.min(input.leadsPerMonth * 12 * BENCHMARK_CONVERSION / 100, BENCHMARK_DEALS_PER_YEAR);
  const topAgentIncome = topAgentDeals * input.avgCommission;

  const lostDeals = Math.max(0, topAgentDeals - currentDealsPerYear);
  const recoverableDeals = lostDeals * DEAL_RECOVERY_RATE;
  const recoverableAmount = Math.round(recoverableDeals * input.avgCommission);
  const estimatedLostCommission = Math.round(lostDeals * input.avgCommission);

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
