'use client';

import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { Barrier, HealthStatus } from '@bowtie/shared';

interface StatusDonutProps {
  barriers: Barrier[];
}

const ORDER: HealthStatus[] = ['red', 'yellow', 'green', 'gray'];

const LABEL: Record<HealthStatus, string> = {
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  gray: 'Unknown',
};

const COLOR_VAR: Record<HealthStatus, string> = {
  red: 'hsl(var(--status-red))',
  yellow: 'hsl(var(--status-yellow))',
  green: 'hsl(var(--status-green))',
  gray: 'hsl(var(--status-gray))',
};

export function StatusDonut({ barriers }: StatusDonutProps) {
  const data = useMemo(() => {
    const counts: Record<HealthStatus, number> = { red: 0, yellow: 0, green: 0, gray: 0 };
    for (const b of barriers) counts[b.status] += 1;
    return ORDER.filter((s) => counts[s] > 0).map((s) => ({
      name: LABEL[s],
      value: counts[s],
      key: s,
    }));
  }, [barriers]);

  const total = barriers.length;

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No barriers to chart.
      </div>
    );
  }

  return (
    <div className="relative h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            cursor={false}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.375rem',
              fontSize: '12px',
            }}
            formatter={(v: number, n: string) => [`${v} barrier${v === 1 ? '' : 's'}`, n]}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={80}
            stroke="hsl(var(--background))"
            strokeWidth={2}
            paddingAngle={1}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={COLOR_VAR[d.key as HealthStatus]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold tabular-nums">{total}</div>
        <div className="text-xs text-muted-foreground">barriers</div>
      </div>
    </div>
  );
}

export function StatusDonutLegend({ barriers }: StatusDonutProps) {
  const counts: Record<HealthStatus, number> = { red: 0, yellow: 0, green: 0, gray: 0 };
  for (const b of barriers) counts[b.status] += 1;
  return (
    <ul className="flex flex-wrap gap-3 text-xs">
      {ORDER.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_VAR[s] }} />
          <span className="text-muted-foreground">{LABEL[s]}</span>
          <span className="tabular-nums font-medium">{counts[s]}</span>
        </li>
      ))}
    </ul>
  );
}
