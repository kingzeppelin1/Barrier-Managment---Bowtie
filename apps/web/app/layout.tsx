import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Barrier Management — Bowtie',
  description: 'ISO 31000-aligned bowtie & barrier management.',
};

export const viewport: Viewport = {
  themeColor: '#0b1020',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
