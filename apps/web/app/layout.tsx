import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Figtree } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'STAR Suite — Barrier Management',
  description:
    'STAR Barrier Management — bowtie & barrier-management module of STAR Suite. Demo build.',
};

export const viewport: Viewport = {
  themeColor: '#10263E', // STAR Navy
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={figtree.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
