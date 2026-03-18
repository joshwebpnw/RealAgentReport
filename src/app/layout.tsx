import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Real Agent Report - Free Agent Performance Score for Real Estate Agents',
  description: 'Discover how much commission you\'re leaving on the table. Get your free Agent Performance Score in 60 seconds.',
  metadataBase: new URL('https://realagentreport.com'),
  openGraph: {
    title: 'Real Agent Report - How Much In Commissions Will You Lose In The Next 12 Months?',
    description: 'Run the free 60-second Agent Performance Score audit and see how many deals are slipping through your pipeline.',
    type: 'website',
    images: [{ url: '/api/og?score=0', width: 1200, height: 630, alt: 'Real Agent Report - Agent Performance Score' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Agent Report - How Much In Commissions Will You Lose In The Next 12 Months?',
    description: 'Run the free 60-second Agent Performance Score audit.',
    images: ['/api/og?score=0'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
