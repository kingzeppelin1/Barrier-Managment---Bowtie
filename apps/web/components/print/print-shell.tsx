'use client';

import type { ReactNode } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface PrintShellProps {
  title: string;
  subtitle?: string;
  meta?: string;
  children: ReactNode;
}

/**
 * Demo-only print page wrapper. Marked DEMO-ONLY: in production we'd render
 * via a server-side PDF library (puppeteer/Playwright/PDFKit). For the demo we
 * use the browser's "Print to PDF" via window.print() and @media print CSS.
 */
export function PrintShell({ title, subtitle, meta, children }: PrintShellProps) {
  // DEMO-ONLY
  return (
    <div className="mx-auto max-w-5xl px-8 py-10 print:px-0 print:py-2">
      <div className="no-print mb-6 flex items-center justify-between gap-3 border-b pb-4">
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" /> Back to reports
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            In the print dialog, choose <span className="font-medium">Save as PDF</span> as the destination.
          </span>
          <Button
            size="sm"
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="gap-1"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <header className="mb-6 flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Barrier Management — Bowtie
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Generated</div>
          <div>{new Date().toLocaleString()}</div>
          {meta && <div className="mt-1">{meta}</div>}
        </div>
      </header>

      <main className="space-y-6 text-sm">{children}</main>

      <footer className="mt-10 border-t pt-3 text-[11px] text-muted-foreground">
        Demo build — no real backend. Data shown is from the local browser
        seed. In production, this would be a verified, audit-logged export.
      </footer>
    </div>
  );
}

export function PrintSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="border-b pb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
