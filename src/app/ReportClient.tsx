'use client';

import { useState, useEffect, useCallback } from 'react';
import { calculateAuditScore } from '@/lib/audit-scoring';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | 'landing'
  | 'closings'
  | 'lead-volume'
  | 'lead-sources'
  | 'commission'
  | 'response-speed'
  | 'follow-up'
  | 'automation'
  | 'processing'
  | 'email-gate'
  | 'results';

type LeadVolumeOption = '0-100' | '100-250' | '250-500' | '500-1000' | '1000+';
type CommissionOption = 'Under $5k' | '$5k-$8k' | '$8k-$12k' | '$12k-$20k' | '$20k+';
type ResponseSpeedOption =
  | 'Under 5 minutes'
  | '5-30 minutes'
  | '30-60 minutes'
  | '1-3 hours'
  | 'Same day'
  | 'Next day';
type FollowUpOption = '1-2 times' | '3-4 times' | '5-7 times' | '8+';
type AutomationOption = 'Yes' | 'No';

interface FormData {
  closings: string;
  leadVolume: LeadVolumeOption | '';
  leadSources: string[];
  commission: CommissionOption | '';
  responseSpeed: ResponseSpeedOption | '';
  followUp: FollowUpOption | '';
  automation: AutomationOption | '';
  email: string;
}

interface ScoreResult {
  overallScore: number;
  speedScore: number;
  followUpScore: number;
  conversionScore: number;
  marketRanking: string;
  marketPercentile: string;
  estimatedLostCommission: number;
  currentDeals: number;
  lostDeals: number;
  weeksPerLostDeal: number;
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

// ─── Lookup maps ──────────────────────────────────────────────────────────────

const LEAD_VOLUME_MIDPOINTS: Record<LeadVolumeOption, number> = {
  '0-100': 50,
  '100-250': 175,
  '250-500': 375,
  '500-1000': 750,
  '1000+': 1200,
};

const COMMISSION_MIDPOINTS: Record<CommissionOption, number> = {
  'Under $5k': 3500,
  '$5k-$8k': 6500,
  '$8k-$12k': 10000,
  '$12k-$20k': 16000,
  '$20k+': 25000,
};

const RESPONSE_SPEED_MINUTES: Record<ResponseSpeedOption, number> = {
  'Under 5 minutes': 2.5,
  '5-30 minutes': 17.5,
  '30-60 minutes': 45,
  '1-3 hours': 120,
  'Same day': 720,
  'Next day': 1440,
};

const FOLLOW_UP_MIDPOINTS: Record<FollowUpOption, number> = {
  '1-2 times': 1.5,
  '3-4 times': 3.5,
  '5-7 times': 6,
  '8+': 10,
};

const LEAD_SOURCE_OPTIONS = [
  'Zillow / Realtor.com',
  'Google / SEO',
  'Facebook / Instagram Ads',
  'Open Houses',
  'Referrals / Sphere',
  'Past Clients',
  'Sign Calls',
  'Other',
];

const STEP_SCREENS: Screen[] = [
  'closings',
  'lead-volume',
  'lead-sources',
  'commission',
  'response-speed',
  'follow-up',
  'automation',
];

const SCORE_TIERS: { min: number; label: string; color: string; bg: string }[] = [
  { min: 75, label: 'Elite', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { min: 65, label: 'High Performer', color: 'text-blue-700', bg: 'bg-blue-100' },
  { min: 55, label: 'Above Average', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  { min: 40, label: 'Falling Behind', color: 'text-amber-700', bg: 'bg-amber-100' },
  { min: 0, label: 'At Risk', color: 'text-red-700', bg: 'bg-red-100' },
];

// Badge config for top 20% agents
const BADGES: { min: number; badge: string; badgeColor: string; badgeBg: string; badgeBorder: string; icon: string }[] = [
  { min: 90, badge: 'Top 5% Agent', badgeColor: 'text-amber-900', badgeBg: 'bg-gradient-to-br from-amber-300 to-yellow-500', badgeBorder: 'border-amber-400', icon: '🏆' },
  { min: 80, badge: 'Top 10% Agent', badgeColor: 'text-slate-800', badgeBg: 'bg-gradient-to-br from-gray-200 to-gray-400', badgeBorder: 'border-gray-400', icon: '🥈' },
  { min: 70, badge: 'Top 20% Agent', badgeColor: 'text-amber-900', badgeBg: 'bg-gradient-to-br from-orange-300 to-amber-600', badgeBorder: 'border-amber-500', icon: '🥉' },
];

function getBadge(score: number) {
  return BADGES.find((b) => score >= b.min) ?? null;
}

// Score-based CTA hooks for Agent Assistant
function getCtaHook(score: number, commissionLeak: string) {
  if (score >= 90) return {
    headline: 'Protect Your Edge',
    sub: 'You\'re already elite. Agent Assistant automates your speed-to-lead and follow-up so you stay on top without burning out.',
    cta: 'Scale Without Burnout →',
  };
  if (score >= 80) return {
    headline: 'You\'re Close to the Top',
    sub: 'A few automated systems separate you from the top 5%. Agent Assistant closes the gap on speed and follow-up.',
    cta: 'Push Into the Top 5% →',
  };
  if (score >= 70) return {
    headline: `Stop Leaving ${commissionLeak} on the Table`,
    sub: 'You\'re above average, but your speed-to-lead and follow-up have clear gaps. Agent Assistant fixes both in minutes.',
    cta: 'Fix Your Pipeline Gaps →',
  };
  if (score >= 55) return {
    headline: `You\'re Losing ${commissionLeak}/yr to Faster Agents`,
    sub: 'Your competitors are responding faster and following up more. Agent Assistant responds in under 60 seconds and runs 7+ touch sequences automatically.',
    cta: 'Stop Losing to Faster Agents →',
  };
  return {
    headline: `${commissionLeak}/yr Is Walking Out the Door`,
    sub: 'Your response time and follow-up are costing you deals every single week. Agent Assistant responds instantly and follows up automatically — even while you sleep.',
    cta: 'Fix This Now →',
  };
}

// Score-based 3-step improvement plans
function getImprovementPlan(score: number, results: ScoreResult) {
  // Elite (90+): You're already winning — automate, scale, help your team
  if (score >= 90) return [
    {
      step: '01',
      title: 'Automate Your Workflow to Free Up 10+ Hours/Week',
      desc: 'You\'re already closing at elite levels. Let AI handle speed-to-lead, follow-up sequences, and appointment booking so you can focus on high-value conversations.',
      color: 'border-emerald-200 bg-emerald-50',
      icon: '🤖',
    },
    {
      step: '02',
      title: 'Help Your Team Match Your Performance',
      desc: 'Your systems work. Clone them for your team — set up automated playbooks so every agent in your office responds and follows up at your level.',
      color: 'border-emerald-200 bg-emerald-50',
      icon: '👥',
    },
    {
      step: '03',
      title: 'Scale Your Lead Volume Without Scaling Effort',
      desc: 'With automation handling the grunt work, you can safely 2-3x your lead sources without dropping quality. More leads, same effort, bigger checks.',
      color: 'border-emerald-200 bg-emerald-50',
      icon: '📈',
    },
  ];

  // High Performer (80-89): Close the gap to elite
  if (score >= 80) return [
    {
      step: '01',
      title: results.speedScore < 85 ? 'Close Your Speed Gap' : 'Lock In Your Response Speed',
      desc: results.speedScore < 85
        ? 'You\'re fast, but not instant. The top 5% respond in under 60 seconds — even on nights and weekends. Automate your first response to eliminate the gap.'
        : 'Your speed-to-lead is strong. Add automated failover for off-hours to make sure no lead waits more than a minute, ever.',
      color: results.speedScore < 85 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50',
      icon: results.speedScore < 85 ? '⚡' : '✅',
    },
    {
      step: '02',
      title: results.followUpScore < 85 ? 'Add 2-3 More Follow-Up Touches' : 'Optimize Your Follow-Up Sequences',
      desc: results.followUpScore < 85
        ? 'Top agents make 8-12 touches per lead. You\'re close — automate the last few touches so every lead gets a full sequence without extra work.'
        : 'Your follow-up cadence is elite. A/B test your messaging to squeeze even more conversions from the same pipeline.',
      color: results.followUpScore < 85 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50',
      icon: results.followUpScore < 85 ? '📬' : '✅',
    },
    {
      step: '03',
      title: 'Systematize to Break Into the Top 5%',
      desc: 'The difference between top 10% and top 5% isn\'t skill — it\'s systems. Automate intake, nurture, and booking so you never lose a deal to human error.',
      color: 'border-blue-200 bg-blue-50',
      icon: '🎯',
    },
  ];

  // Above Average (70-79): Fix the gaps holding you back
  if (score >= 70) return [
    {
      step: '01',
      title: results.speedScore < 70 ? 'Fix Your Response Time — It\'s Costing You' : 'Protect Your Speed Advantage',
      desc: results.speedScore < 70
        ? 'Leads go cold fast. Agents who respond in under 5 minutes are 100x more likely to connect. Automate instant responses so you never miss the window.'
        : 'Your response time is solid. Set up automated alerts for any lead that hasn\'t been contacted in 5 minutes to keep it locked down.',
      color: results.speedScore < 70 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50',
      icon: results.speedScore < 70 ? '⚡' : '✅',
    },
    {
      step: '02',
      title: results.followUpScore < 70 ? 'Build a Follow-Up System (Not Just Reminders)' : 'Scale Your Follow-Up Without More Effort',
      desc: results.followUpScore < 70
        ? 'You\'re leaving deals on the table with inconsistent follow-up. An automated 7+ touch sequence ensures every lead gets worked, every time.'
        : 'You\'re following up well, but doing it manually limits your capacity. Automate your sequence so you can handle 2x the leads.',
      color: results.followUpScore < 70 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50',
      icon: results.followUpScore < 70 ? '📬' : '✅',
    },
    {
      step: '03',
      title: 'Tighten Your Conversion Pipeline',
      desc: results.conversionScore < 70
        ? 'Structured intake, pre-appointment nurture, and automated objection handling can push your conversion rate above 8% — where the real money is.'
        : 'Your conversion rate is strong. Focus on increasing top-of-funnel lead volume to turn that efficiency into bigger paychecks.',
      color: results.conversionScore < 70 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50',
      icon: results.conversionScore < 70 ? '📈' : '✅',
    },
  ];

  // Falling Behind (55-69): Urgent fixes needed
  if (score >= 55) return [
    {
      step: '01',
      title: results.speedScore < 60 ? 'Your Speed Is Killing Your Pipeline' : 'Speed Is Your One Bright Spot — Don\'t Lose It',
      desc: results.speedScore < 60
        ? 'You\'re responding too slow. By the time you call back, faster agents already have the appointment. AI speed-to-lead can get your response under 60 seconds today.'
        : 'Your response time is decent, but everything else needs work. Automate your speed-to-lead so you can focus on fixing follow-up and conversion.',
      color: results.speedScore < 60 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50',
      icon: results.speedScore < 60 ? '🚨' : '⚡',
    },
    {
      step: '02',
      title: 'Stop Letting Leads Die After 1-2 Touches',
      desc: results.followUpScore < 60
        ? '80% of deals close after 5+ touches. You\'re giving up way too early. An automated follow-up sequence is the fastest way to recover lost revenue.'
        : 'You\'re following up, but not enough. Bump from 3-4 touches to 7+ with an automated sequence — each extra touch is money on the table.',
      color: results.followUpScore < 60 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50',
      icon: '📬',
    },
    {
      step: '03',
      title: 'Get a System — Any System',
      desc: 'Top agents don\'t wing it. They have automated intake, instant response, and multi-touch sequences running 24/7. You need a system that works while you sleep.',
      color: 'border-red-200 bg-red-50',
      icon: '🔧',
    },
  ];

  // At Risk (<55): Emergency intervention
  return [
    {
      step: '01',
      title: 'Stop the Bleeding: Automate Your First Response',
      desc: 'Every hour you wait to respond, your close probability drops by 90%. Set up AI-powered instant response today — it takes 15 minutes and immediately stops the bleeding.',
      color: 'border-red-300 bg-red-50',
      icon: '🚨',
    },
    {
      step: '02',
      title: 'Build a Follow-Up Engine Before Your Next Lead Comes In',
      desc: 'You\'re losing most of your leads after the first contact. A 7-touch automated sequence will work every lead systematically — no more leads falling through the cracks.',
      color: 'border-red-300 bg-red-50',
      icon: '🔄',
    },
    {
      step: '03',
      title: 'Rebuild Your Pipeline With Proven Systems',
      desc: 'The agents taking your deals aren\'t smarter — they have better systems. Speed-to-lead + automated follow-up + structured nurture = more closings from the same leads.',
      color: 'border-red-300 bg-red-50',
      icon: '🏗️',
    },
  ];
}

// Tier-specific share messaging
function getShareConfig(score: number, tier: { label: string }, commissionLeak: string) {
  if (score >= 70) return {
    heading: 'You Earned a Badge — Show It Off',
    sub: 'Flex your score. Challenge your office. See who\'s really on top.',
    challengeText: `I just earned a ${getBadge(score)?.badge || tier.label} badge on the Real Agent Report with a ${score}/100. Think you can beat me?`,
    sharePrompt: 'Share your badge and challenge other agents',
  };
  if (score >= 55) return {
    heading: 'Are Your Colleagues Losing Deals Too?',
    sub: `You might not be the only one leaking ${commissionLeak}. Send this to your office and find out who\'s actually on top.`,
    challengeText: `I just found out I might be losing ${commissionLeak}/yr in commission. Curious where you stack up? Take the 60-second audit:`,
    sharePrompt: 'Send to your office — see who\'s really winning',
  };
  return {
    heading: 'Don\'t Let Your Colleagues Make the Same Mistake',
    sub: 'Most agents have no idea how much commission they\'re losing. Share this and find out who in your office needs a wake-up call.',
    challengeText: `I just took the Real Agent Report and the results were eye-opening. Find out how much commission you might be losing:`,
    sharePrompt: 'Share the wake-up call with other agents',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreTier(score: number) {
  return SCORE_TIERS.find((t) => score >= t.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}

function formatCurrency(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

function computeResults(data: FormData): ScoreResult | null {
  if (
    !data.leadVolume ||
    !data.commission ||
    !data.responseSpeed ||
    !data.followUp
  )
    return null;

  const annualLeads = LEAD_VOLUME_MIDPOINTS[data.leadVolume as LeadVolumeOption];
  const leadsPerMonth = annualLeads / 12;
  const avgCommission = COMMISSION_MIDPOINTS[data.commission as CommissionOption];
  const responseTimeMinutes = RESPONSE_SPEED_MINUTES[data.responseSpeed as ResponseSpeedOption];
  const followUpTouches = FOLLOW_UP_MIDPOINTS[data.followUp as FollowUpOption];
  const closings = parseInt(data.closings || '0', 10);

  const conversionRate =
    annualLeads > 0 ? Math.min((closings / annualLeads) * 100, 100) : 2;

  const base = calculateAuditScore({
    responseTimeMinutes,
    followUpTouches,
    conversionRate,
    leadsPerMonth,
    avgCommission,
    avgHomePrice: 500000,
  });

  const BENCHMARK_CONVERSION = 8;
  const currentDeals = (annualLeads * conversionRate) / 100;
  const topDeals = Math.min((annualLeads * BENCHMARK_CONVERSION) / 100, 38);
  let lostDeals = Math.max(0, topDeals - currentDeals);

  // Even high-conversion agents lose deals to slow speed & weak follow-up.
  // Floor: at least 15% of current deals as missed opportunity when score < 75.
  if (lostDeals < 1 && base.overallScore < 75) {
    lostDeals = Math.max(2, Math.ceil(currentDeals * 0.15));
  }

  const weeksPerLostDeal = lostDeals > 0 ? Math.round(52 / lostDeals) : 999;

  // Override estimatedLostCommission with the floor-adjusted lostDeals
  const adjustedLostCommission = Math.round(lostDeals * avgCommission);

  return {
    ...base,
    estimatedLostCommission: Math.max(base.estimatedLostCommission, adjustedLostCommission),
    currentDeals: Math.round(currentDeals),
    lostDeals: Math.round(lostDeals),
    weeksPerLostDeal,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SocialShareBar({ shareText, shareUrl, onCopy, copied, compact }: { shareText: string; shareUrl: string; onCopy: () => void; copied: boolean; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'justify-center' : 'justify-center'}`}>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-black text-white hover:bg-gray-800 transition-colors">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        Post
      </a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </a>
      <a href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1DA851] transition-colors">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </a>
      <a href={`sms:?&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        Text
      </a>
      <a href={`mailto:?subject=${encodeURIComponent('Think you can beat my Agent Performance Score?')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-600 text-white hover:bg-gray-700 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        Email
      </a>
      <button onClick={onCopy} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
        {copied ? (
          <><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Copied!</>
        ) : (
          <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Link</>
        )}
      </button>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / 7) * 100);
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>Step {step} of 7</span>
        <span>{pct}% complete</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all duration-150 ${
        selected
          ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-sm'
          : 'border-gray-200 bg-white text-gray-700 hover:border-brand-400 hover:bg-gray-50'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 align-middle ${
          selected ? 'border-brand-600 bg-brand-600' : 'border-gray-400'
        }`}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
            <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

function CheckboxButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all duration-150 ${
        selected
          ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-sm'
          : 'border-gray-200 bg-white text-gray-700 hover:border-brand-400 hover:bg-gray-50'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 mr-3 flex-shrink-0 align-middle ${
          selected ? 'border-brand-600 bg-brand-600' : 'border-gray-400'
        }`}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6.5l2.5 2.5 4.5-5" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const tier = getScoreTier(score);
  const dashArray = 251.2;
  const dashOffset = dashArray - (dashArray * score) / 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#2563eb"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-900">{score}</span>
          <span className="text-xs text-gray-500 font-medium">/ 100</span>
        </div>
      </div>
      <span
        className={`mt-3 px-4 py-1.5 rounded-full text-sm font-bold ${tier.color} ${tier.bg}`}
      >
        {tier.label}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'red' | 'green' | 'blue';
}) {
  const colors = {
    red: 'border-red-300 bg-red-50',
    green: 'border-emerald-300 bg-emerald-50',
    blue: 'border-brand-300 bg-brand-50',
  };
  const valueColors = {
    red: 'text-red-700',
    green: 'text-emerald-700',
    blue: 'text-brand-700',
  };
  return (
    <div
      className={`rounded-xl border-2 p-5 text-center ${
        highlight ? colors[highlight] : 'border-gray-200 bg-white'
      }`}
    >
      <div
        className={`text-2xl font-bold mb-1 ${
          highlight ? valueColors[highlight] : 'text-slate-900'
        }`}
      >
        {value}
      </div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function ScreenLanding({ onStart, challengeScore }: { onStart: () => void; challengeScore: number | null }) {
  const challengeTier = challengeScore !== null ? getScoreTier(challengeScore) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Challenge banner */}
        {challengeScore !== null && (
          <div className="bg-amber-400/15 border-2 border-amber-400/40 rounded-2xl px-6 py-5 mb-8 max-w-lg mx-auto animate-fade-in">
            <div className="text-amber-300 text-xs uppercase tracking-widest font-bold mb-2">Challenge Received</div>
            <div className="text-white text-lg font-bold mb-1">
              A fellow agent scored <span className="text-amber-400 text-2xl font-extrabold">{challengeScore}/100</span>
            </div>
            <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 ${challengeTier?.bg} ${challengeTier?.color}`}>
              {challengeTier?.label}
            </div>
            <p className="text-blue-200/80 text-sm">Think you can beat them? Take the 60-second audit and find out.</p>
          </div>
        )}

        {/* Logo/brand mark */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-white/80 text-sm font-medium">Real Agent Report</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
          {challengeScore !== null ? (
            <>
              Can You <span className="text-amber-400">Beat Their Score?</span>
            </>
          ) : (
            <>
              How Much In Commissions Will You{' '}
              <span className="text-amber-400">Lose In The Next 12 Months?</span>
            </>
          )}
        </h1>

        <p className="text-lg sm:text-xl text-blue-100 mb-4 max-w-xl mx-auto">
          Run the 60-second Agent Performance Score audit and see how many deals may be slipping through your pipeline.
        </p>

        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl px-6 py-4 mb-8 max-w-lg mx-auto">
          <p className="text-amber-200 text-sm font-medium">
            Most agents lose{' '}
            <span className="text-amber-300 font-bold">20-40%</span> of potential deals due to slow response times and weak follow-up systems.
          </p>
        </div>

        <button
          onClick={onStart}
          className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 font-extrabold text-lg px-10 py-5 rounded-2xl shadow-lg shadow-amber-400/30 transition-all duration-150 hover:scale-[1.02] active:scale-[0.99]"
        >
          {challengeScore !== null ? 'Accept the Challenge →' : 'Run Your 60-Second Performance Score →'}
        </button>

        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-blue-200/70">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Free
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Takes 60 seconds
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            Built for real estate agents
          </span>
        </div>
      </div>
    </div>
  );
}

function ScreenClosings({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const valid = value !== '' && parseInt(value, 10) >= 0;
  return (
    <div className="space-y-6">
      <ProgressBar step={1} />
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          How many homes did you close in the last 12 months?
        </h2>
        <p className="text-gray-500 text-sm">Enter a whole number (e.g. 18). Estimate if unsure.</p>
      </div>
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' || /^\d+$/.test(v)) onChange(v);
        }}
        placeholder="e.g. 18"
        className="w-full px-5 py-4 text-2xl font-semibold border-2 border-gray-300 rounded-xl outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all"
        autoFocus
      />
      <button
        onClick={onNext}
        disabled={!valid}
        className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all duration-150"
      >
        Next →
      </button>
    </div>
  );
}

function ScreenLeadVolume({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: LeadVolumeOption | '';
  onChange: (v: LeadVolumeOption) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const options: LeadVolumeOption[] = ['0-100', '100-250', '250-500', '500-1000', '1000+'];
  return (
    <div className="space-y-6">
      <ProgressBar step={2} />
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
        About how many leads did you receive in the last 12 months?
      </h2>
      <div className="space-y-3">
        {options.map((o) => (
          <OptionButton
            key={o}
            label={o}
            selected={value === o}
            onClick={() => onChange(o)}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none px-6 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function ScreenLeadSources({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };
  return (
    <div className="space-y-6">
      <ProgressBar step={3} />
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
          Where do most of your leads come from?
        </h2>
        <p className="text-sm text-gray-500">Select all that apply.</p>
      </div>
      <div className="space-y-3">
        {LEAD_SOURCE_OPTIONS.map((o) => (
          <CheckboxButton
            key={o}
            label={o}
            selected={value.includes(o)}
            onClick={() => toggle(o)}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none px-6 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={value.length === 0}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function ScreenCommission({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: CommissionOption | '';
  onChange: (v: CommissionOption) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const options: CommissionOption[] = [
    'Under $5k',
    '$5k-$8k',
    '$8k-$12k',
    '$12k-$20k',
    '$20k+',
  ];
  return (
    <div className="space-y-6">
      <ProgressBar step={4} />
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
        What&apos;s your average commission per closing?
      </h2>
      <div className="space-y-3">
        {options.map((o) => (
          <OptionButton
            key={o}
            label={o}
            selected={value === o}
            onClick={() => onChange(o)}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none px-6 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function ScreenResponseSpeed({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: ResponseSpeedOption | '';
  onChange: (v: ResponseSpeedOption) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const options: ResponseSpeedOption[] = [
    'Under 5 minutes',
    '5-30 minutes',
    '30-60 minutes',
    '1-3 hours',
    'Same day',
    'Next day',
  ];
  return (
    <div className="space-y-6">
      <ProgressBar step={5} />
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
          How quickly do you usually respond to new leads?
        </h2>
        <p className="text-sm text-gray-500">Be honest — this is where most agents lose deals.</p>
      </div>
      <div className="space-y-3">
        {options.map((o) => (
          <OptionButton
            key={o}
            label={o}
            selected={value === o}
            onClick={() => onChange(o)}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none px-6 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function ScreenFollowUp({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: FollowUpOption | '';
  onChange: (v: FollowUpOption) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const options: FollowUpOption[] = ['1-2 times', '3-4 times', '5-7 times', '8+'];
  return (
    <div className="space-y-6">
      <ProgressBar step={6} />
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
          How many times do you typically follow up with a lead before moving on?
        </h2>
        <p className="text-sm text-gray-500">Include all channels — calls, texts, emails.</p>
      </div>
      <div className="space-y-3">
        {options.map((o) => (
          <OptionButton
            key={o}
            label={o}
            selected={value === o}
            onClick={() => onChange(o)}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none px-6 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function ScreenAutomation({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: AutomationOption | '';
  onChange: (v: AutomationOption) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const options: AutomationOption[] = ['Yes', 'No'];
  return (
    <div className="space-y-6">
      <ProgressBar step={7} />
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
          Do you use any automated follow-up system?
        </h2>
        <p className="text-sm text-gray-500">CRM auto-sequences, AI responders, drip campaigns, etc.</p>
      </div>
      <div className="space-y-3">
        {options.map((o) => (
          <OptionButton
            key={o}
            label={o}
            selected={value === o}
            onClick={() => onChange(o)}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none px-6 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-xl text-lg transition-all"
        >
          See My Results →
        </button>
      </div>
    </div>
  );
}

function ScreenProcessing({ onDone }: { onDone: () => void }) {
  const [checkedItems, setCheckedItems] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);

  const items = [
    'Calculating your conversion rate',
    'Benchmarking against other agents',
    "Estimating deals you're losing",
    'Calculating projected commission leak',
  ];

  useEffect(() => {
    const delays = [300, 900, 1500, 2200];
    const timers = delays.map((d, i) =>
      setTimeout(() => {
        setCheckedItems((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, d)
    );
    const done = setTimeout(onDone, 3400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="text-center space-y-8 py-4">
      <div>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Analyzing Your Agent Performance...
        </h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md mx-auto text-left space-y-4 shadow-sm">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 transition-all duration-300 ${
              checkedItems[i] ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                checkedItems[i] ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              {checkedItems[i] && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">{item}</span>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 max-w-md mx-auto">
        <p className="text-amber-800 text-sm font-semibold">
          Warning: many agents are surprised by their results.
        </p>
      </div>

      <p className="text-gray-500 text-sm">
        <span className="font-bold text-gray-700">3,248 agents</span> have taken the Agent Performance Score this month.
      </p>
    </div>
  );
}

function ScreenEmailGate({
  email,
  onEmailChange,
  onSubmit,
  submitting,
}: {
  email: string;
  onEmailChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && valid && !submitting) onSubmit();
  };

  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-2">
        <svg className="w-7 h-7 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Your Agent Performance Score Is Ready
        </h2>
        <p className="text-gray-500 text-lg font-medium">Where should we send your full report?</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left max-w-sm mx-auto space-y-2.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Your report includes:</p>
        {[
          'Your Agent Performance Score vs. top agents',
          "How many deals you're likely missing",
          'Your estimated income gap',
          'A personalized 3-step improvement plan',
          'Your shareable performance badge',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
            <svg className="w-4 h-4 text-brand-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {item}
          </div>
        ))}
      </div>

      <div className="max-w-sm mx-auto space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="your@email.com"
          className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 transition-all"
          autoFocus
        />
        <button
          onClick={onSubmit}
          disabled={!valid || submitting}
          className="w-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-xl text-lg transition-all duration-150 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating your report...
            </>
          ) : (
            'Send My Report →'
          )}
        </button>
        <p className="text-xs text-gray-400">
          We&apos;ll send your full score report with a PDF breakdown and your performance badge. No spam, ever.
        </p>
      </div>
    </div>
  );
}

function ScreenResults({
  results,
  formData,
  onShare,
  onChallenge,
  copied,
  challengeScore,
}: {
  results: ScoreResult;
  formData: FormData;
  onShare: () => void;
  onChallenge: () => void;
  copied: boolean;
  challengeScore: number | null;
}) {
  const tier = getScoreTier(results.overallScore);
  const commissionLeak = formatCurrency(results.estimatedLostCommission);
  const currentIncome = formatCurrency(results.incomeGap.currentEstimatedIncome);
  const topIncome = formatCurrency(results.incomeGap.topAgentIncome);
  const recoverable = formatCurrency(results.incomeGap.recoverableAmount);

  const weeksLine =
    results.lostDeals > 0 && results.weeksPerLostDeal < 100
      ? `This is equivalent to losing one deal every ${results.weeksPerLostDeal} weeks.`
      : null;

  const improvements = getImprovementPlan(results.overallScore, results);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?challenge=${results.overallScore}`
    : `https://realagentreport.com?challenge=${results.overallScore}`;
  const shareConfig = getShareConfig(results.overallScore, tier, commissionLeak);
  const shareText = shareConfig.challengeText;

  return (
    <div className="space-y-8">
      {/* Hero - driven by overall score, not just conversion */}
      <div className="bg-gradient-to-br from-slate-900 to-brand-900 rounded-2xl p-6 sm:p-8 text-white text-center">
        {results.overallScore >= 75 ? (
          <>
            <div className="inline-block bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              Top Performer Identified
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
              You&apos;re outperforming{' '}
              <span className="text-emerald-400">the benchmark.</span>
              <span className="block text-lg font-semibold text-blue-200 mt-2">Automation can help you maintain this edge and scale further.</span>
            </h1>
          </>
        ) : (
          <>
            <div className="inline-block bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              Missed Opportunity Detected
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
              Your estimated missed opportunity:{' '}
              <span className="text-amber-400">{commissionLeak}</span>
              <span className="block text-lg font-semibold text-blue-200 mt-2">per year with faster response and better follow-up.</span>
            </h1>
            {weeksLine && (
              <p className="text-blue-200 text-sm">{weeksLine}</p>
            )}
          </>
        )}
      </div>

      {/* Challenge comparison - show at top when someone came from a challenge link */}
      {challengeScore !== null && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm text-center">
          <div className="text-xs uppercase tracking-widest font-bold text-amber-600 mb-3">Challenge Result</div>
          <div className="flex items-center justify-center gap-6">
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Their Score</div>
              <div className="text-3xl font-extrabold text-gray-400">{challengeScore}</div>
            </div>
            <div className="text-2xl font-bold text-gray-300">vs</div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Your Score</div>
              <div className={`text-3xl font-extrabold ${results.overallScore > challengeScore ? 'text-emerald-600' : results.overallScore < challengeScore ? 'text-red-600' : 'text-amber-600'}`}>
                {results.overallScore}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold">
            {results.overallScore > challengeScore ? (
              <span className="text-emerald-700">You beat their score by {results.overallScore - challengeScore} points! Now challenge another agent.</span>
            ) : results.overallScore < challengeScore ? (
              <span className="text-red-700">They beat you by {challengeScore - results.overallScore} points. See below how to improve your score.</span>
            ) : (
              <span className="text-amber-700">It&apos;s a tie! See below how to pull ahead.</span>
            )}
          </p>
        </div>
      )}

      {/* Share bar - top */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Challenge your office - share your score</p>
        <SocialShareBar shareText={shareText} shareUrl={shareUrl} onCopy={onShare} copied={copied} compact />
      </div>

      {/* Score section - right after missed opportunity */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <ScoreGauge score={results.overallScore} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Your Agent Performance Score</h2>
            <p className="text-gray-500 text-sm mb-4">
              {results.overallScore >= 80 ? (
                <>You&apos;re in the <span className={`font-bold ${tier.color}`}>{results.marketPercentile}</span> of agents nationally.</>
              ) : (
                <>You&apos;re ranked <span className={`font-bold ${tier.color}`}>{results.marketPercentile}</span> — most agents in your range are leaving significant commission on the table.</>
              )}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Speed Score', val: results.speedScore },
                { label: 'Follow-Up Score', val: results.followUpScore },
                { label: 'Conversion Score', val: results.conversionScore },
              ].map(({ label, val }) => {
                const c =
                  val >= 70 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : val >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200';
                return (
                  <div key={label} className={`rounded-xl border p-3 text-center ${c}`}>
                    <div className="text-xl font-bold">{val}</div>
                    <div className="text-xs font-medium mt-0.5">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Metric cards - always show lost commission */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Your Closings"
          value={`${results.currentDeals}`}
          sub="Last 12 months"
          highlight="blue"
        />
        <MetricCard
          label="Deals You Could Be Missing"
          value={`${Math.max(results.lostDeals, Math.ceil(results.currentDeals * 0.15))}`}
          sub="Due to speed & follow-up gaps"
          highlight="red"
        />
        <MetricCard
          label="Projected Commission Leak"
          value={commissionLeak}
          sub="Next 12 months at current rate"
          highlight="red"
        />
      </div>

      {/* Benchmark comparison */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Benchmark Comparison</h3>
        <div className="space-y-4">
          {[
            {
              label: 'Response Speed',
              yours: results.speedBreakdown.benchmark,
              top: '< 5 minutes (top agents)',
              score: results.speedScore,
            },
            {
              label: 'Follow-Up Touches',
              yours: `${FOLLOW_UP_MIDPOINTS[formData.followUp as FollowUpOption] || 2} touches`,
              top: '15+ touches (top agents)',
              score: results.followUpScore,
            },
            {
              label: 'Conversion Rate',
              yours: `${results.conversionBreakdown.input.toFixed(1)}%`,
              top: '8-12% (top agents)',
              score: results.conversionScore,
            },
          ].map(({ label, yours, top, score }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">{label}</span>
                <span className="text-gray-500 text-xs">{score}/100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>You: <span className="font-medium text-gray-700">{yours}</span></span>
                <span>Target: <span className="font-medium text-gray-700">{top}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Analysis - always show lost commissions */}
      <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Income Analysis</h3>
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-600">Your Est. Annual Commission</span>
            <span className="text-sm font-bold text-gray-700">{currentIncome}</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-emerald-400/40 rounded-full" style={{ width: '100%' }} />
            <div className="absolute inset-y-0 left-0 bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (results.incomeGap.currentEstimatedIncome / Math.max(results.incomeGap.currentEstimatedIncome + results.estimatedLostCommission, 1)) * 100)}%` }} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-600">What You Could Be Earning</span>
            <span className="text-sm font-bold text-emerald-700">{formatCurrency(results.incomeGap.currentEstimatedIncome + results.estimatedLostCommission)}</span>
          </div>

          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{commissionLeak}</div>
              <div className="text-[10px] text-gray-500">Lost Commission Per Year</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-700">{recoverable}</div>
              <div className="text-[10px] text-gray-500">Recoverable with Automation</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-step improvement plan */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Your 3-Step Improvement Plan</h3>
        <div className="space-y-4">
          {improvements.map((item) => (
            <div key={item.step} className={`border-2 rounded-xl p-5 ${item.color}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-2xl">{item.icon}</div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    Step {item.step}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA — score-specific hook */}
      {(() => {
        const hook = getCtaHook(results.overallScore, commissionLeak);
        return (
          <div className="bg-gradient-to-br from-slate-900 to-brand-900 rounded-2xl p-6 sm:p-8 text-center">
            <div className="text-3xl mb-3">{results.overallScore >= 80 ? '🚀' : results.overallScore >= 55 ? '⚡' : '🚨'}</div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {hook.headline}
            </h3>
            <p className="text-blue-200 text-sm mb-6 max-w-md mx-auto">
              {hook.sub}
            </p>
            <a
              href={`https://agentassistant.io/signup?ref=report&utm_source=report&utm_medium=cta&score=${results.overallScore}&tier=${encodeURIComponent(tier.label)}${formData.email ? `&email=${encodeURIComponent(formData.email)}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 font-extrabold text-lg px-8 py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-amber-400/30"
            >
              {hook.cta}
            </a>
            <p className="text-blue-300/60 text-xs mt-4">No credit card required · Setup in minutes</p>
          </div>
        );
      })()}

      {/* Viral share section — tier-specific */}
      {(() => {
        const badge = getBadge(results.overallScore);
        const shareConfig = getShareConfig(results.overallScore, tier, commissionLeak);
        const shareUrl = typeof window !== 'undefined'
          ? `${window.location.origin}?challenge=${results.overallScore}`
          : `https://realagentreport.com?challenge=${results.overallScore}`;
        const shareText = shareConfig.challengeText;

        return (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{shareConfig.heading}</h3>
            <p className="text-gray-500 text-sm mb-5">{shareConfig.sub}</p>

            {/* Score card with badge */}
            <div className="bg-gradient-to-br from-slate-800 to-brand-900 rounded-xl p-5 mb-5 max-w-xs mx-auto text-white relative overflow-hidden">
              {badge && (
                <div className={`absolute -top-1 -right-1 ${badge.badgeBg} ${badge.badgeColor} text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-bl-lg rounded-tr-xl shadow-lg`}>
                  {badge.icon} {badge.badge}
                </div>
              )}
              <div className="text-[10px] uppercase tracking-widest text-blue-300/70 font-bold mb-2">Real Agent Performance Score</div>
              <div className="text-4xl font-extrabold mb-1">{results.overallScore}<span className="text-lg text-white/50"> / 100</span></div>
              <div className="text-sm font-bold mb-1">
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${tier.bg} ${tier.color}`}>{tier.label}</span>
              </div>
              {badge ? (
                <div className="text-xs text-emerald-300/80 mt-2 font-semibold">Verified {badge.badge} -- Real Agent Report</div>
              ) : (
                <div className="text-xs text-blue-200/60 mt-2">Commission Leak: {commissionLeak}/yr</div>
              )}
              <div className="text-[10px] text-blue-300/40 mt-3">realagentreport.com</div>
            </div>

            {/* Badge display for top 20% */}
            {badge && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${badge.badgeBorder} ${badge.badgeBg} mb-5 shadow-md`}>
                <span className="text-lg">{badge.icon}</span>
                <span className={`font-extrabold text-sm ${badge.badgeColor}`}>Certified {badge.badge}</span>
                <span className={`text-xs ${badge.badgeColor} opacity-70`}>by Real Agent Report</span>
              </div>
            )}

            {/* Social share buttons */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Share Your Score</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>

                {/* X / Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Post
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#25D366] text-white hover:bg-[#1DA851] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>

                {/* SMS / iMessage */}
                <a
                  href={`sms:?&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Text
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent('Think you can beat my Agent Performance Score?')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Email
                </a>
              </div>
            </div>

            {/* Copy link button */}
            <button
              onClick={onShare}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                copied
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Link Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Challenge Link
                </>
              )}
            </button>

            <p className="text-gray-400 text-xs mt-4">Challenge your office - see who&apos;s really on top</p>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function ReportPage() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [animating, setAnimating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    closings: '',
    leadVolume: '',
    leadSources: [],
    commission: '',
    responseSpeed: '',
    followUp: '',
    automation: '',
    email: '',
  });
  const [results, setResults] = useState<ScoreResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number | null>(null);

  // Read challenge score from URL params (e.g. ?challenge=38)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challenge = params.get('challenge');
    if (challenge) {
      const score = parseInt(challenge, 10);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        setChallengeScore(score);
      }
    }
  }, []);

  // Animated transition helper
  const goTo = useCallback(
    (next: Screen) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => {
        setScreen(next);
        setAnimating(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 200);
    },
    [animating]
  );

  // Step index for back navigation
  const stepIndex = STEP_SCREENS.indexOf(screen);

  const handleBack = useCallback(() => {
    if (stepIndex <= 0) {
      goTo('landing');
    } else {
      goTo(STEP_SCREENS[stepIndex - 1]);
    }
  }, [stepIndex, goTo]);

  // Email gate submit
  const handleEmailSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    const computed = computeResults(formData);
    setResults(computed);

    try {
      await fetch('/api/audit/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          report: {
            ...computed,
            answers: {
              closings: formData.closings,
              leadVolume: formData.leadVolume,
              leadSources: formData.leadSources,
              commission: formData.commission,
              responseSpeed: formData.responseSpeed,
              followUp: formData.followUp,
            },
          },
        }),
      });
    } catch {
      // Non-blocking — show results regardless
    }

    setSubmitting(false);
    goTo('results');
  }, [submitting, formData, goTo]);

  // Processing screen done
  const handleProcessingDone = useCallback(() => {
    goTo('email-gate');
  }, [goTo]);

  // Viral share — include score in URL so recipients see the challenge
  const handleShare = useCallback(() => {
    const url = results
      ? `${window.location.origin}?challenge=${results.overallScore}`
      : window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [results]);

  // Challenge another agent — tier-specific message with score URL
  const handleChallenge = useCallback(() => {
    if (!results) return;
    const challengeUrl = `${window.location.origin}?challenge=${results.overallScore}`;
    const tier = getScoreTier(results.overallScore);
    const leak = formatCurrency(results.estimatedLostCommission);
    const shareConfig = getShareConfig(results.overallScore, tier, leak);
    const msg = `${shareConfig.challengeText} ${challengeUrl}`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [results]);

  // Render landing separately (full-screen dark)
  if (screen === 'landing') {
    return (
      <div
        className={`transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}
      >
        <ScreenLanding onStart={() => goTo('closings')} challengeScore={challengeScore} />
      </div>
    );
  }

  // Results also gets a wider layout
  if (screen === 'results' && results) {
    return (
      <div
        className={`min-h-screen bg-gray-50 transition-opacity duration-200 ${
          animating ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-600 rounded-full" />
              <span className="font-bold text-brand-800 text-sm">Real Agent Report</span>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              Agent Performance Score
            </span>
          </div>
          <ScreenResults
            results={results}
            formData={formData}
            onShare={handleShare}
            onChallenge={handleChallenge}
            copied={copied}
            challengeScore={challengeScore}
          />
        </div>
      </div>
    );
  }

  // Processing screen (full-screen centered)
  if (screen === 'processing') {
    return (
      <div
        className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
          animating ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="max-w-lg w-full">
          <ScreenProcessing onDone={handleProcessingDone} />
        </div>
      </div>
    );
  }

  // All other screens share the card layout
  return (
    <div
      className={`min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-8 sm:pt-16 transition-opacity duration-200 ${
        animating ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-lg">
        {/* Header brand bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => goTo('landing')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <span className="w-2 h-2 bg-brand-600 rounded-full" />
            <span className="font-bold text-brand-800 text-sm">Real Agent Report</span>
          </button>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full">
            Agent Performance Score
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {screen === 'closings' && (
            <ScreenClosings
              value={formData.closings}
              onChange={(v) => setFormData((f) => ({ ...f, closings: v }))}
              onNext={() => goTo('lead-volume')}
            />
          )}
          {screen === 'lead-volume' && (
            <ScreenLeadVolume
              value={formData.leadVolume}
              onChange={(v) => setFormData((f) => ({ ...f, leadVolume: v }))}
              onNext={() => goTo('lead-sources')}
              onBack={handleBack}
            />
          )}
          {screen === 'lead-sources' && (
            <ScreenLeadSources
              value={formData.leadSources}
              onChange={(v) => setFormData((f) => ({ ...f, leadSources: v }))}
              onNext={() => goTo('commission')}
              onBack={handleBack}
            />
          )}
          {screen === 'commission' && (
            <ScreenCommission
              value={formData.commission}
              onChange={(v) => setFormData((f) => ({ ...f, commission: v }))}
              onNext={() => goTo('response-speed')}
              onBack={handleBack}
            />
          )}
          {screen === 'response-speed' && (
            <ScreenResponseSpeed
              value={formData.responseSpeed}
              onChange={(v) => setFormData((f) => ({ ...f, responseSpeed: v }))}
              onNext={() => goTo('follow-up')}
              onBack={handleBack}
            />
          )}
          {screen === 'follow-up' && (
            <ScreenFollowUp
              value={formData.followUp}
              onChange={(v) => setFormData((f) => ({ ...f, followUp: v }))}
              onNext={() => goTo('automation')}
              onBack={handleBack}
            />
          )}
          {screen === 'automation' && (
            <ScreenAutomation
              value={formData.automation}
              onChange={(v) => setFormData((f) => ({ ...f, automation: v }))}
              onNext={() => goTo('processing')}
              onBack={handleBack}
            />
          )}
          {screen === 'email-gate' && (
            <ScreenEmailGate
              email={formData.email}
              onEmailChange={(v) => setFormData((f) => ({ ...f, email: v }))}
              onSubmit={handleEmailSubmit}
              submitting={submitting}
            />
          )}
        </div>

        {/* Footer trust signal */}
        <p className="text-center text-xs text-gray-400 mt-5">
          No spam. No credit card. Just your real agent performance data.
        </p>
      </div>
    </div>
  );
}
