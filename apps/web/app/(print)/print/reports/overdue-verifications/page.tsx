'use client';

import { PrintShell, PrintSection } from '@/components/print/print-shell';
import { useDemoStore } from '@/lib/store';
import { formatDate, relativeDays } from '@/lib/utils';

export default function OverdueVerificationsPrintPage() {
  const verifications = useDemoStore((s) => s.verifications);
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);

  const now = new Date();
  const overdue = verifications
    .filter((v) => new Date(v.nextDue) < now)
    .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());

  return (
    <PrintShell
      title="Overdue Verifications"
      subtitle="Barriers past their next-verification date."
      meta={`${overdue.length} overdue`}
    >
      <PrintSection title="List">
        {overdue.length === 0 ? (
          <p className="text-muted-foreground">No overdue verifications.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="border-b">
              <tr>
                <th className="py-1 text-left">Barrier</th>
                <th className="py-1 text-left">Last result</th>
                <th className="py-1 text-left">Performed by</th>
                <th className="py-1 text-left">Last date</th>
                <th className="py-1 text-left">Due</th>
                <th className="py-1 text-right">Days overdue</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((v) => {
                const barrier = barriers.find((b) => b.id === v.barrierId);
                const performer = users.find((u) => u.id === v.performedById);
                const days = relativeDays(v.nextDue);
                return (
                  <tr key={v.id} className="border-b">
                    <td className="py-1.5 font-medium">{barrier?.name ?? v.barrierId}</td>
                    <td className="py-1.5 capitalize">{v.result}</td>
                    <td className="py-1.5">{performer?.name ?? '—'}</td>
                    <td className="py-1.5">{formatDate(v.date)}</td>
                    <td className="py-1.5">{formatDate(v.nextDue)}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {days !== null ? Math.abs(days) : '—'}
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
