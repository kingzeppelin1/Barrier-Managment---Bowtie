'use client';

import { HeartPulse } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDemoStore } from '@/lib/store';

const RULES = [
  { color: 'bg-status-green', label: 'Green', range: '90 – 100', meaning: 'Verified, healthy.' },
  { color: 'bg-status-yellow', label: 'Yellow', range: '70 – 89', meaning: 'Weakness or uncertainty.' },
  { color: 'bg-status-red', label: 'Red', range: '0 – 69', meaning: 'Failed, missing, or overdue.' },
  { color: 'bg-status-gray', label: 'Unknown', range: 'No data', meaning: 'No verifications recorded.' },
];

const FLOORS = [
  'Failed critical test → caps at 49 (red).',
  'Open critical finding → caps at 49 (red).',
  'Missing owner → caps at 79 (yellow).',
  'Overdue critical verification → caps at 79 (yellow).',
  'Compensated red stays red — never auto-promoted.',
];

export default function BarrierHealthPage() {
  const barriers = useDemoStore((s) => s.barriers);
  const sorted = [...barriers].sort((a, b) => a.healthScore - b.healthScore);

  return (
    <>
      <PageHeader
        title="Barrier Health"
        description="Numerical 0–100 metric — single source of truth from packages/methodology."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Status thresholds</div>
              <ul className="space-y-2 text-sm">
                {RULES.map((r) => (
                  <li key={r.label} className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-sm ${r.color}`} />
                    <span className="font-medium">{r.label}</span>
                    <span className="text-muted-foreground">{r.range}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{r.meaning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Auto-floors (critical barriers)</div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {FLOORS.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={HeartPulse} title="No barriers to score" />
        ) : (
          <div className="rounded-lg border">
            <ul className="divide-y">
              {sorted.map((b) => (
                <li key={b.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.criticality} · {b.type} · {b.function}
                    </div>
                  </div>
                  <Progress
                    value={b.healthScore}
                    className="w-40"
                    indicatorClassName={
                      b.status === 'red'
                        ? 'bg-status-red'
                        : b.status === 'yellow'
                          ? 'bg-status-yellow'
                          : 'bg-status-green'
                    }
                  />
                  <div className="w-10 text-right text-sm tabular-nums">{b.healthScore}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
