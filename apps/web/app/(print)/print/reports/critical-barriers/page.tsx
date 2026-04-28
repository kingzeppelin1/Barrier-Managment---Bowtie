'use client';

import { PrintShell, PrintSection } from '@/components/print/print-shell';
import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function CriticalBarriersPrintPage() {
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);
  const standards = useDemoStore((s) => s.performanceStandards);

  const critical = barriers.filter((b) => b.criticality === 'critical');
  const sorted = [...critical].sort((a, b) => a.healthScore - b.healthScore);

  return (
    <PrintShell
      title="Critical Barriers Report"
      subtitle="All barriers flagged Critical, with current status and owners."
      meta={`${critical.length} critical barrier(s)`}
    >
      <PrintSection title="Roster">
        {sorted.length === 0 ? (
          <p className="text-muted-foreground">No critical barriers in the register.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="border-b">
              <tr>
                <th className="py-1 text-left">ID</th>
                <th className="py-1 text-left">Name</th>
                <th className="py-1 text-left">Type</th>
                <th className="py-1 text-left">Function</th>
                <th className="py-1 text-left">Owner</th>
                <th className="py-1 text-right">Health</th>
                <th className="py-1 text-left">Status</th>
                <th className="py-1 text-left">Last verified</th>
                <th className="py-1 text-left">Next due</th>
                <th className="py-1 text-left">Performance standard</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => {
                const owner = users.find((u) => u.id === b.ownerId);
                const ps = standards.find((s) => s.id === b.performanceStandardId);
                return (
                  <tr key={b.id} className="border-b">
                    <td className="py-1.5 font-mono">{b.id}</td>
                    <td className="py-1.5 font-medium">{b.name}</td>
                    <td className="py-1.5 capitalize">{b.type}</td>
                    <td className="py-1.5 capitalize">{b.function}</td>
                    <td className="py-1.5">{owner?.name ?? '— gap'}</td>
                    <td className="py-1.5 text-right tabular-nums">{b.healthScore}</td>
                    <td className="py-1.5 capitalize">
                      {b.status}
                      {b.withCompensatory && b.status === 'red' ? ' (+ comp)' : ''}
                    </td>
                    <td className="py-1.5">{formatDate(b.lastVerifiedAt)}</td>
                    <td className="py-1.5">{formatDate(b.nextVerificationDue)}</td>
                    <td className="py-1.5">{ps?.name ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </PrintSection>

      <PrintSection title="Methodology callouts">
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>
            Critical barriers carry automatic floors: failed test or open critical finding caps at 49
            (red); missing owner or overdue verification caps at 79 (yellow).
          </li>
          <li>Compensated red stays red — it never auto-promotes.</li>
          <li>Every critical barrier should reference a Performance Standard.</li>
        </ul>
      </PrintSection>
    </PrintShell>
  );
}
