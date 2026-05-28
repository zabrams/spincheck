import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpinCheck — Political Bias Detector',
  description:
    'Paste any news article to get an AI-powered analysis of its political bias, with evidence and balanced perspectives.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
