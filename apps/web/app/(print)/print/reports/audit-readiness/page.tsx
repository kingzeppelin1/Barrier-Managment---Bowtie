'use client';

import { PrintShell, PrintSection } from '@/components/print/print-shell';
import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function AuditReadinessPrintPage() {
  const audits = useDemoStore((s) => s.audits);
  const actions = useDemoStore((s) => s.actions);
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);

  const auditActions = actions.filter((a) => a.source === 'audit');
  const openAuditActions = auditActions.filter((a) => a.status !== 'closed');
  const criticalRed = barriers.filter((b) => b.criticality === 'critical' && b.status === 'red');
  const ownerlessBarriers = barriers.filter((b) => !b.ownerId);

  return (
    <PrintShell
      title="Audit Readiness"
      subtitle="Snapshot for upcoming external or internal audit."
      meta={`${audits.length} audit(s) on file · ${openAuditActions.length} open audit-sourced action(s)`}
    >
      <PrintSection title="Audits on file">
        {audits.length === 0 ? (
          <p className="text-muted-foreground">None.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="border-b">
              <tr>
                <th className="py-1 text-left">ID</th>
                <th className="py-1 text-left">Title</th>
                <th className="py-1 text-left">Auditor</th>
                <th className="py-1 text-left">Date</th>
                <th className="py-1 text-right">Findings</th>
                <th className="py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => {
                const auditor = users.find((u) => u.id === a.auditorId);
                return (
                  <tr key={a.id} className="border-b">
                    <td className="py-1.5 font-mono">{a.id}</td>
                    <td className="py-1.5 font-medium">{a.title}</td>
                    <td className="py-1.5">{auditor?.name ?? '—'}</td>
                    <td className="py-1.5">{formatDate(a.date)}</td>
                    <td className="py-1.5 text-right tabular-nums">{a.findings}</td>
                    <td className="py-1.5 capitalize">{a.status.replace(/_/g, ' ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </PrintSection>

      <PrintSection title="Open audit-sourced actions">
        {openAuditActions.length === 0 ? (
          <p className="text-muted-foreground">No open actions sourced from audits.</p>
        ) : (
          <ul className="list-disc space-y-0.5 pl-5 text-xs">
            {openAuditActions.map((a) => (
              <li key={a.id}>
                <span className="font-medium">{a.title}</span> — {a.priority}, due {formatDate(a.dueDate)},{' '}
                {a.status.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        )}
      </PrintSection>

      <PrintSection title="Methodology exposure">
        <ul className="list-disc space-y-0.5 pl-5 text-xs">
          <li>
            Critical barriers in red: {criticalRed.length}
            {criticalRed.length > 0 && (
              <span className="text-muted-foreground">
                {' — '}
                {criticalRed.map((b) => b.name).join('; ')}
              </span>
            )}
          </li>
          <li>
            Barriers without an owner: {ownerlessBarriers.length}
            {ownerlessBarriers.length > 0 && (
              <span className="text-muted-foreground">
                {' — '}
                {ownerlessBarriers.map((b) => b.name).join('; ')}
              </span>
            )}
          </li>
        </ul>
      </PrintSection>
    </PrintShell>
  );
}
