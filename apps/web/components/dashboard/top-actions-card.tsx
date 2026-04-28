'use client';

import Link from 'next/link';
import type { Action, User } from '@bowtie/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, relativeDays } from '@/lib/utils';

interface TopActionsCardProps {
  actions: Action[];
  users: User[];
  limit?: number;
}

const PRIORITY_RANK: Record<Action['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function TopActionsCard({ actions, users, limit = 5 }: TopActionsCardProps) {
  const sorted = [...actions]
    .filter((a) => a.status !== 'closed')
    .sort((a, b) => {
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pr !== 0) return pr;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, limit);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">Actions due soon</div>
          <Link href="/actions" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        {sorted.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No open actions.</div>
        ) : (
          <ul className="divide-y">
            {sorted.map((a) => {
              const owner = users.find((u) => u.id === a.ownerId);
              const days = relativeDays(a.dueDate);
              const overdue = a.status === 'overdue' || (days !== null && days < 0);
              return (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="capitalize">
                        {a.priority}
                      </Badge>
                      <span>{owner?.name ?? '—'}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <div className={overdue ? 'font-medium text-status-red' : 'text-muted-foreground'}>
                      {formatDate(a.dueDate)}
                    </div>
                    {days !== null && (
                      <div className="text-[11px] text-muted-foreground">
                        {days >= 0 ? `in ${days}d` : `${Math.abs(days)}d overdue`}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
