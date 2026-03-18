import type { Metadata } from 'next';
import ReportPage from './ReportClient';

interface Props {
  searchParams: { challenge?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
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
