'use client';

import Link from 'next/link';
import type { Barrier } from '@bowtie/shared';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/common/status-badge';

interface TopBarriersCardProps {
  barriers: Barrier[];
  limit?: number;
}

export function TopBarriersCard({ barriers, limit = 5 }: TopBarriersCardProps) {
  // Worst first — red before yellow, lowest score first, critical before non-critical.
  const sorted = [...barriers]
    .sort((a, b) => {
      const critA = a.criticality === 'critical' ? 0 : 1;
      const critB = b.criticality === 'critical' ? 0 : 1;
      if (critA !== critB) return critA - critB;
      return a.healthScore - b.healthScore;
    })
    .slice(0, limit);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">Barriers needing attention</div>
          <Link href="/barriers" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y">
          {sorted.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{b.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{b.criticality}</span>
                  <span>·</span>
                  <span className="capitalize">{b.type}</span>
                  <StatusBadge status={b.status} withCompensatory={b.withCompensatory} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Progress
                  value={b.healthScore}
                  className="w-24"
                  indicatorClassName={
                    b.status === 'red'
                      ? 'bg-status-red'
                      : b.status === 'yellow'
                        ? 'bg-status-yellow'
                        : 'bg-status-green'
                  }
                />
                <span className="w-7 text-right text-sm tabular-nums">{b.healthScore}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
