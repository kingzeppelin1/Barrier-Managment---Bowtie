'use client';

import { useMemo, useState } from 'react';
import { HeartPulse } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatusDonut, StatusDonutLegend } from '@/components/dashboard/status-donut';
import { StatusBadge } from '@/components/common/status-badge';

import { useDemoStore } from '@/lib/store';
import type { Barrier, Criticality } from '@bowtie/shared';

const RULES = [
  { color: 'bg-status-green', label: 'Green', range: '90 – 100', meaning: 'Verified, healthy.' },
  { color: 'bg-status-yellow', label: 'Yellow', range: '70 – 89', meaning: 'Weakness or uncertainty.' },
  { color: 'bg-status-red', label: 'Red', range: '0 – 69', meaning: 'Failed, missing or overdue.' },
  { color: 'bg-status-gray', label: 'Unknown', range: 'No data', meaning: 'No verifications recorded.' },
];

const FLOORS = [
  'Failed critical test → caps at 49 (red).',
  'Open critical finding → caps at 49 (red).',
  'Missing owner → caps at 79 (yellow).',
  'Overdue critical verification → caps at 79 (yellow).',
  'Compensated red stays red — never auto-promoted.',
];

const CRITICALITIES: Criticality[] = ['critical', 'high', 'medium', 'low'];

export default function BarrierHealthPage() {
  const barriers = useDemoStore((s) => s.barriers);
  const [filter, setFilter] = useState<'all' | Criticality>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? barriers : barriers.filter((b) => b.criticality === filter)),
    [barriers, filter],
  );

  const sorted = [...filtered].sort((a, b) => a.healthScore - b.healthScore);

  const byCriticality: Record<Criticality, Barrier[]> = {
    critical: barriers.filter((b) => b.criticality === 'critical'),
    high: barriers.filter((b) => b.criticality === 'high'),
    medium: barriers.filter((b) => b.criticality === 'medium'),
    low: barriers.filter((b) => b.criticality === 'low'),
  };

  return (
    <>
      <PageHeader
        title="Barrier Health"
        description="Numerical 0–100 metric — single source of truth from packages/methodology."
      />
      <div className="space-y-6 p-6">
        {/* Distribution + thresholds + floors */}
        <div className="grid gap-3 lg:grid-cols-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-baseline justify-between">
                <div className="text-sm font-semibold">Distribution</div>
                <div className="text-xs text-muted-foreground">{barriers.length} total</div>
              </div>
              <StatusDonut barriers={barriers} />
              <StatusDonutLegend barriers={barriers} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Thresholds</div>
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
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Auto-floors (critical barriers)
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {FLOORS.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Per-criticality breakdown */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold">Health by criticality</div>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              {CRITICALITIES.map((c) => {
                const list = byCriticality[c];
                const total = list.length;
                const red = list.filter((b) => b.status === 'red').length;
                const yellow = list.filter((b) => b.status === 'yellow').length;
                const green = list.filter((b) => b.status === 'green').length;
                return (
                  <div key={c} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{c}</span>
                      <Badge variant="outline">{total}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      {red > 0 && <Badge variant="red">{red} red</Badge>}
                      {yellow > 0 && <Badge variant="yellow">{yellow} yellow</Badge>}
                      {green > 0 && <Badge variant="green">{green} green</Badge>}
                      {total === 0 && <span className="text-muted-foreground">No barriers</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Per-barrier list with criticality filter tabs */}
        {sorted.length === 0 && filter === 'all' ? (
          <EmptyState icon={HeartPulse} title="No barriers to score" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | Criticality)}>
                  <TabsList>
                    <TabsTrigger value="all">All ({barriers.length})</TabsTrigger>
                    {CRITICALITIES.map((c) => (
                      <TabsTrigger key={c} value={c} className="capitalize">
                        {c} ({byCriticality[c].length})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value={filter} className="mt-0" />
                </Tabs>
              </div>
              {sorted.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No {filter} barriers.
                </div>
              ) : (
                <ul className="divide-y">
                  {sorted.map((b) => (
                    <li key={b.id} className="flex items-center gap-4 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{b.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{b.criticality}</span>
                          <span>·</span>
                          <span className="capitalize">{b.type}</span>
                          <StatusBadge status={b.status} withCompensatory={b.withCompensatory} />
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
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
