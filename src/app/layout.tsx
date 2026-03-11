import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agent Assistant Report - Free AI Conversion Audit for Real Estate Agents',
  description: 'Discover how much commission you\'re leaving on the table. Get your free AI-powered conversion audit in 60 seconds.',
  openGraph: {
    title: 'Agent Assistant Report - How Much Commission Are You Losing?',
    description: 'Run the free 60-second audit and see how many deals are slipping through your pipeline.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
