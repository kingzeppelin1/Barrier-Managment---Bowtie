'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FileText, Workflow } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDemoStore } from '@/lib/store';

const REPORTS: { slug: string; title: string; description: string }[] = [
  {
    slug: 'management-summary',
    title: 'Management summary',
    description: 'One-page rollup for the leadership review.',
  },
  {
    slug: 'critical-barriers',
    title: 'Critical barriers report',
    description: 'All critical barriers with current status and owners.',
  },
  {
    slug: 'overdue-verifications',
    title: 'Overdue verifications',
    description: 'Barriers past their next-verification date.',
  },
  {
    slug: 'open-actions',
    title: 'Open actions',
    description: 'All actions not yet closed, by owner and due date.',
  },
  {
    slug: 'risk-exposure',
    title: 'Risk exposure',
    description: 'Four-level risk profile across the register.',
  },
  {
    slug: 'alarp',
    title: 'ALARP justification',
    description: 'Justification trail for risks accepted at ALARP.',
  },
  {
    slug: 'audit-readiness',
    title: 'Audit readiness',
    description: 'Snapshot for upcoming external or internal audit.',
  },
  {
    slug: 'barrier-health',
    title: 'Barrier health report',
    description: 'Distribution of barrier health scores across the estate.',
  },
];

export default function ReportsPage() {
  const bowties = useDemoStore((s) => s.bowties.filter((b) => !b.archivedAt));
  const [bowtieId, setBowtieId] = useState(bowties[0]?.id ?? '');

  return (
    <>
      <PageHeader
        title="Reports"
        description="Print-optimised views — open in a new tab and use the browser's Print / Save as PDF."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map((r) => (
            <Card key={r.slug} className="flex flex-col">
              <CardContent className="flex-1 space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>{r.title}</CardTitle>
                </div>
                <CardDescription>{r.description}</CardDescription>
              </CardContent>
              <div className="border-t p-3">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/print/reports/${r.slug}`} target="_blank">
                    Open print view
                  </Link>
                </Button>
              </div>
            </Card>
          ))}

          <Card className="flex flex-col">
            <CardContent className="flex-1 space-y-2 p-4">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Bowtie report</CardTitle>
              </div>
              <CardDescription>
                Per-bowtie summary: scope, four-level risk, threats, consequences and barriers.
              </CardDescription>
              <div className="pt-2">
                <Select value={bowtieId} onValueChange={setBowtieId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a bowtie" />
                  </SelectTrigger>
                  <SelectContent>
                    {bowties.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <div className="border-t p-3">
              <Button asChild size="sm" variant="outline" disabled={!bowtieId}>
                <Link
                  href={bowtieId ? `/print/reports/bowtie/${bowtieId}` : '#'}
                  target="_blank"
                  aria-disabled={!bowtieId}
                >
                  Open print view
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        <p className="text-xs italic text-muted-foreground">
          {/* DEMO-ONLY */}
          Demo build: PDF export uses the browser&rsquo;s built-in &ldquo;Print to PDF&rdquo;. In
          production we&rsquo;d render via a server-side PDF library with audit logging.
        </p>
      </div>
    </>
  );
}
