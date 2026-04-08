import type { Metadata } from 'next';
import ReportPage from './ReportClient';

interface Props {
  searchParams: { challenge?: string; score?: string; badge?: string };
}

function getBadgeLabel(score: number): string {
  if (score >= 93) return 'Top 5%';
  if (score >= 90) return 'Top 10%';
  if (score >= 80) return 'Top 20%';
  return '';
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  // Agent sharing their own score (?score=96&badge=Top+5%)
  const sharedScore = searchParams.score ? parseInt(searchParams.score, 10) : 0;
  if (sharedScore > 0) {
    const badge = searchParams.badge || getBadgeLabel(sharedScore);
    const ogImageUrl = `/api/og?score=${sharedScore}${badge ? `&badge=${encodeURIComponent(badge)}` : ''}`;
    const badgeText = badge ? ` — Certified ${badge} Agent` : '';
    const title = `${sharedScore}/100 Agent Performance Score${badgeText}`;
    const description = `This agent scored ${sharedScore}/100 on the Real Agent Report${badge ? ` and earned a ${badge} badge` : ''}. Take the free 60-second audit to get your score.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }

  // Challenge link (?challenge=82) — framed as "can you beat this?"
  const challengeScore = searchParams.challenge ? parseInt(searchParams.challenge, 10) : 0;
  if (challengeScore > 0) {
    const ogImageUrl = `/api/og?score=${challengeScore}`;
    return {
      title: `Can you beat ${challengeScore}/100? - Real Agent Report`,
      description: `Someone scored ${challengeScore}/100 on the Agent Performance Score. Take the free 60-second audit and see if you can beat them.`,
      openGraph: {
        title: `Can you beat ${challengeScore}/100? - Real Agent Report`,
        description: `Someone scored ${challengeScore}/100 on the Agent Performance Score. Take the 60-second audit and see where you rank.`,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Agent Performance Score: ${challengeScore}/100` }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Can you beat ${challengeScore}/100? - Real Agent Report`,
        description: `Someone scored ${challengeScore}/100. Think you can do better?`,
        images: [ogImageUrl],
      },
    };
  }

  return {};
}

export default function Page() {
  return <ReportPage />;
}
