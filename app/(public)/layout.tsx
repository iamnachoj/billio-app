import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import '../globals.css';
import PublicHeader from '@/components/layout/PublicHeader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Billio',
    template: '%s | Billio',
  },
  description:
    'Track shared expenses, settle balances and manage group finances effortlessly.',
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PublicHeader />
        {children}
      </body>
    </html>
  );
}
