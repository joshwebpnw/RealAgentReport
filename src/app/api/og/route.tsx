import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const score = parseInt(searchParams.get('score') || '0', 10);
  const badge = searchParams.get('badge') || '';

  // Determine tier
  let tier = 'At Risk';
  let tierColor = '#dc2626';
  let tierBg = '#fef2f2';
  if (score >= 75) { tier = 'Elite'; tierColor = '#047857'; tierBg = '#ecfdf5'; }
  else if (score >= 65) { tier = 'High Performer'; tierColor = '#1d4ed8'; tierBg = '#eff6ff'; }
  else if (score >= 55) { tier = 'Above Average'; tierColor = '#4338ca'; tierBg = '#eef2ff'; }
  else if (score >= 40) { tier = 'Falling Behind'; tierColor = '#b45309'; tierBg = '#fffbeb'; }

  // Score ring color
  const ringColor = score >= 70 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  // Badge display
  let badgeText = '';
  let badgeIcon = '';
  if (badge.includes('5%')) { badgeText = 'Top 5% Agent'; badgeIcon = '\u{1F3C6}'; }
  else if (badge.includes('10%')) { badgeText = 'Top 10% Agent'; badgeIcon = '\u{1F948}'; }
  else if (badge.includes('20%')) { badgeText = 'Top 20% Agent'; badgeIcon = '\u{1F949}'; }
  else if (badge.includes('30%')) { badgeText = 'Top 30% Agent'; badgeIcon = ''; }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
          <span style={{ color: '#93c5fd', fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>
            Real Agent Report
          </span>
        </div>

        <span style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '3px', textTransform: 'uppercase' as const, marginBottom: '24px' }}>
          Agent Performance Score
        </span>

        {/* Score circle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            border: `8px solid ${ringColor}`,
            background: 'rgba(255,255,255,0.05)',
            marginBottom: '20px',
          }}
        >
          <span style={{ color: '#ffffff', fontSize: '72px', fontWeight: 800, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '20px', fontWeight: 600 }}>
            / 100
          </span>
        </div>

        {/* Tier badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: tierBg,
            color: tierColor,
            padding: '8px 24px',
            borderRadius: '999px',
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          {tier}
        </div>

        {/* Achievement badge for top performers */}
        {badgeText && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#78350f',
              padding: '8px 20px',
              borderRadius: '999px',
              fontSize: '16px',
              fontWeight: 800,
              marginBottom: '16px',
            }}
          >
            {badgeIcon && <span>{badgeIcon}</span>}
            <span>Certified {badgeText}</span>
          </div>
        )}

        {/* CTA */}
        <span style={{ color: '#93c5fd', fontSize: '18px', fontWeight: 600, marginTop: '8px' }}>
          Think you can beat this? Take the 60-second audit.
        </span>

        {/* URL */}
        <span style={{ color: 'rgba(147, 197, 253, 0.4)', fontSize: '14px', marginTop: '12px' }}>
          realagentreport.com
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
