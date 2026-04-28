'use client';

import { PrintShell, PrintSection } from '@/components/print/print-shell';
import { useDemoStore } from '@/lib/store';
import { formatDate, relativeDays } from '@/lib/utils';

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export default function OpenActionsPrintPage() {
  const actions = useDemoStore((s) => s.actions);
  const users = useDemoStore((s) => s.users);

  const now = new Date();
  const open = actions
    .filter((a) => a.status !== 'closed')
    .sort((a, b) => {
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pr !== 0) return pr;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const overdueCount = open.filter(
    (a) => a.status === 'overdue' || new Date(a.dueDate) < now,
  ).length;

  return (
    <PrintShell
      title="Open Actions"
      subtitle="All actions not yet closed, ordered by priority then due-date."
      meta={`${open.length} open · ${overdueCount} overdue`}
    >
      <PrintSection title="List">
        {open.length === 0 ? (
          <p className="text-muted-foreground">No open actions.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="border-b">
              <tr>
                <th className="py-1 text-left">ID</th>
                <th className="py-1 text-left">Title</th>
                <th className="py-1 text-left">Source</th>
                <th className="py-1 text-left">Owner</th>
                <th className="py-1 text-left">Priority</th>
                <th className="py-1 text-left">Status</th>
                <th className="py-1 text-left">Due</th>
              </tr>
            </thead>
            <tbody>
              {open.map((a) => {
                const owner = users.find((u) => u.id === a.ownerId);
                const days = relativeDays(a.dueDate);
                const overdue = a.status === 'overdue' || (days !== null && days < 0);
                return (
                  <tr key={a.id} className="border-b">
                    <td className="py-1.5 font-mono">{a.id}</td>
                    <td className="py-1.5 font-medium">{a.title}</td>
                    <td className="py-1.5 capitalize">{a.source.replace(/_/g, ' ')}</td>
                    <td className="py-1.5">{owner?.name ?? '—'}</td>
                    <td className="py-1.5 capitalize">{a.priority}</td>
                    <td className="py-1.5 capitalize">{a.status.replace(/_/g, ' ')}</td>
                    <td className="py-1.5">
                      <span className={overdue ? 'font-medium text-status-red' : ''}>
                        {formatDate(a.dueDate)}
                        {days !== null && (
                          <span className="ml-1 text-muted-foreground">
                            ({days >= 0 ? `in ${days}d` : `${Math.abs(days)}d ago`})
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </PrintSection>
    </PrintShell>
  );
}
