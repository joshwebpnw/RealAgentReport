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

interface FormData {
  closings: string;
  leadVolume: LeadVolumeOption | '';
  leadSources: string[];
  commission: CommissionOption | '';
  responseSpeed: ResponseSpeedOption | '';
  followUp: FollowUpOption | '';
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
];

const SCORE_TIERS: { min: number; label: string; color: string; bg: string }[] = [
  { min: 90, label: 'Elite', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { min: 80, label: 'High Performer', color: 'text-blue-700', bg: 'bg-blue-100' },
  { min: 70, label: 'Above Average', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  { min: 55, label: 'Average', color: 'text-amber-700', bg: 'bg-amber-100' },
  { min: 0, label: 'Below Average', color: 'text-red-700', bg: 'bg-red-100' },
];

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
  const lostDeals = Math.max(0, topDeals - currentDeals);
  const weeksPerLostDeal = lostDeals > 0 ? Math.round(52 / lostDeals) : 999;

  return {
    ...base,
    currentDeals: Math.round(currentDeals),
    lostDeals: Math.round(lostDeals),
    weeksPerLostDeal,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / 6) * 100);
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>Step {step} of 6</span>
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

function ScreenLanding({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo/brand mark */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-white/80 text-sm font-medium">Powered by Agent Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
          How Much Commission Are You{' '}
          <span className="text-amber-400">Losing Every Year?</span>
        </h1>

        <p className="text-lg sm:text-xl text-blue-100 mb-4 max-w-xl mx-auto">
          Run the 60-second Agent Assistant Report audit and see how many deals may be slipping through your pipeline.
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
          Start the 60-Second Audit →
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
        <p className="text-gray-500 text-sm">Enter a whole number (e.g. 18)</p>
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
        <p className="text-sm text-amber-600 font-medium flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Fast response times dramatically improve lead conversion.
        </p>
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
        <p className="text-sm text-brand-700 font-medium flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Most deals happen after 5+ follow-ups.
        </p>
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
        <span className="font-bold text-gray-700">3,248 agents</span> have taken the Agent Assistant Report audit this month.
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
          Your Agent Assistant Report Is Ready
        </h2>
        <p className="text-gray-500">Where should we send your full report?</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left max-w-sm mx-auto space-y-2.5">
        {[
          'Your Agent Performance Score',
          "Deals you're likely losing",
          'Your projected commission leak',
          'A personalized improvement plan',
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
              Loading your score...
            </>
          ) : (
            'See My Score →'
          )}
        </button>
        <p className="text-xs text-gray-400">
          We never spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}

function ScreenResults({
  results,
  formData,
  onShare,
  copied,
}: {
  results: ScoreResult;
  formData: FormData;
  onShare: () => void;
  copied: boolean;
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

  const improvements = [
    {
      step: '01',
      title: 'Fix Your Response Speed',
      desc:
        results.speedScore < 70
          ? 'Your response time is costing you leads. Implement AI speed-to-lead to respond within 60 seconds — even at 2am.'
          : 'Good response speed. Maintain this with automated failover if your schedule changes.',
      color: results.speedScore < 70 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50',
      icon: results.speedScore < 70 ? '⚡' : '✓',
    },
    {
      step: '02',
      title: 'Build a Systematic Follow-Up Engine',
      desc:
        results.followUpScore < 70
          ? 'Most deals require 5-12 touches. An automated sequence means no lead ever falls through the cracks.'
          : 'Solid follow-up discipline. Consider automating sequences to scale without mental overhead.',
      color: results.followUpScore < 70 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50',
      icon: results.followUpScore < 70 ? '📬' : '✓',
    },
    {
      step: '03',
      title: 'Improve Your Conversion System',
      desc:
        results.conversionScore < 70
          ? 'Structured intake, pre-appointment nurture, and objection sequences can push your conversion rate above 8%.'
          : 'Above-average conversion rate. Focus on increasing lead volume to scale revenue.',
      color: results.conversionScore < 70 ? 'border-brand-200 bg-brand-50' : 'border-emerald-200 bg-emerald-50',
      icon: results.conversionScore < 70 ? '📈' : '✓',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-brand-900 rounded-2xl p-6 sm:p-8 text-white text-center">
        <div className="inline-block bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
          Commission Leak Detected
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
          Based on your answers, you could lose{' '}
          <span className="text-amber-400">{commissionLeak}</span> in commission over the next 12 months if nothing changes.
        </h1>
        {weeksLine && (
          <p className="text-blue-200 text-sm">{weeksLine}</p>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Deals You Should Close"
          value={`${results.currentDeals + results.lostDeals}`}
          sub="Based on your lead volume"
          highlight="blue"
        />
        <MetricCard
          label="Deals You're Losing"
          value={`${results.lostDeals}`}
          sub="vs. top-agent benchmark"
          highlight="red"
        />
        <MetricCard
          label="Projected Commission Leak"
          value={commissionLeak}
          sub="Next 12 months at current rate"
          highlight="red"
        />
      </div>

      {/* Score section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <ScoreGauge score={results.overallScore} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Your Agent Performance Score</h2>
            <p className="text-gray-500 text-sm mb-4">
              You scored in the <span className={`font-bold ${tier.color}`}>{results.marketPercentile}</span> of real estate agents nationally.
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

      {/* Income gap */}
      <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Your Income Gap</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-gray-700">{currentIncome}</div>
            <div className="text-xs text-gray-500 mt-0.5">Your Est. Annual Commission</div>
          </div>
          <div>
            <div className="text-xl font-bold text-brand-700">{topIncome}</div>
            <div className="text-xs text-gray-500 mt-0.5">Top Agent Equivalent</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-xl font-bold text-emerald-700">{recoverable}</div>
            <div className="text-xs text-gray-500 mt-0.5">Recoverable with Right Systems</div>
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

      {/* Primary CTA */}
      <div className="bg-gradient-to-br from-slate-900 to-brand-900 rounded-2xl p-6 sm:p-8 text-center">
        <div className="text-3xl mb-3">🚀</div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Fix Your Leaks &amp; Boost Your Closings
        </h3>
        <p className="text-blue-200 text-sm mb-6 max-w-md mx-auto">
          Agents using Agent Assistant typically close 3-6 more deals per year with AI speed-to-lead, automated follow-up, and smart conversion tools.
        </p>
        <a
          href={`https://agentassistant.io/signup?ref=report&utm_source=report&utm_medium=cta${formData.email ? `&email=${encodeURIComponent(formData.email)}` : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 font-extrabold text-lg px-8 py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-amber-400/30"
        >
          Fix Your Leaks &amp; Boost Your Closings →
        </a>
        <p className="text-blue-300/60 text-xs mt-4">No credit card required · Setup in minutes</p>
      </div>

      {/* Viral share section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Share Your Score With Other Agents</h3>
        <p className="text-gray-500 text-sm mb-5">
          Think a colleague might be losing commission too? Challenge them.
        </p>

        {/* Score card preview */}
        <div className="bg-gradient-to-br from-slate-800 to-brand-900 rounded-xl p-5 mb-5 max-w-xs mx-auto text-white">
          <div className="text-[10px] uppercase tracking-widest text-blue-300/70 font-bold mb-2">Real Agent Performance Score</div>
          <div className="text-4xl font-extrabold mb-1">{results.overallScore}<span className="text-lg text-white/50"> / 100</span></div>
          <div className={`text-sm font-bold mb-1 ${tier.color.replace('text-', 'text-')}`}>
            <span className={`inline-block px-2 py-0.5 rounded text-xs ${tier.bg} ${tier.color}`}>{tier.label}</span>
          </div>
          <div className="text-xs text-blue-200/60 mt-2">Commission Leak: {commissionLeak}/yr</div>
          <div className="text-[10px] text-blue-300/40 mt-3">realagentreport.com</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onShare}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
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
                Copy Audit Link
              </>
            )}
          </button>
          <button
            onClick={() => {
              const msg = `I just ran the Agent Assistant Report and scored ${results.overallScore}/100. Curious what you get. Run it here: ${window.location.origin}`;
              navigator.clipboard.writeText(msg);
              onShare();
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Challenge Another Agent
          </button>
        </div>
      </div>
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
    email: '',
  });
  const [results, setResults] = useState<ScoreResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Viral share
  const handleShare = useCallback(() => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, []);

  // Render landing separately (full-screen dark)
  if (screen === 'landing') {
    return (
      <div
        className={`transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}
      >
        <ScreenLanding onStart={() => goTo('closings')} />
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
              <span className="font-bold text-brand-800 text-sm">Agent Assistant Report</span>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              Powered by Agent Assistant
            </span>
          </div>
          <ScreenResults
            results={results}
            formData={formData}
            onShare={handleShare}
            copied={copied}
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
            <span className="font-bold text-brand-800 text-sm">Agent Assistant Report</span>
          </button>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full">
            Free Audit
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
