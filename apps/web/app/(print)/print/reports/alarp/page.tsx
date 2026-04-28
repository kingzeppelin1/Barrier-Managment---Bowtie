'use client';

import { PrintShell, PrintSection } from '@/components/print/print-shell';
import { useDemoStore } from '@/lib/store';

export default function AlarpPrintPage() {
  const risks = useDemoStore((s) => s.risks);
  const users = useDemoStore((s) => s.users);
  const bowties = useDemoStore((s) => s.bowties);

  const justified = risks.filter(
    (r) => r.acceptanceStatus === 'alarp_justified' || r.acceptanceStatus === 'accepted',
  );
  const pending = risks.filter((r) => r.acceptanceStatus === 'pending');
  const unacceptable = risks.filter((r) => r.acceptanceStatus === 'unacceptable');

  return (
    <PrintShell
      title="ALARP Justification"
      subtitle="Justification trail for risks accepted at ALARP."
      meta={`${justified.length} justified · ${pending.length} pending · ${unacceptable.length} unacceptable`}
    >
      <PrintSection title="Risks at ALARP / accepted">
        {justified.length === 0 ? (
          <p className="text-muted-foreground">None.</p>
        ) : (
          justified.map((r) => {
            const owner = users.find((u) => u.id === r.ownerId);
            const linked = bowties.filter((bt) => r.bowtieIds.includes(bt.id));
            return (
              <div key={r.id} className="rounded-md border p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-semibold">{r.title}</div>
                  <span className="text-[11px] capitalize text-muted-foreground">
                    {r.acceptanceStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="mt-1 grid grid-cols-4 gap-2 text-center text-[11px]">
                  {(
                    [
                      ['Inherent', r.inherentRisk],
                      ['Current', r.currentRisk],
                      ['Residual', r.residualRisk],
                      ['Target', r.targetRisk],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded border p-1.5">
                      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
                      <div className="text-sm font-semibold tabular-nums">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs">
                  <span className="font-medium">Treatment plan:</span> {r.treatmentPlan}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Owner: {owner?.name ?? '—'} ·{' '}
                  Bowties: {linked.length === 0 ? '—' : linked.map((b) => b.id).join(', ')}
                </div>
              </div>
            );
          })
        )}
      </PrintSection>

      {pending.length > 0 && (
        <PrintSection title="Pending acceptance">
          <ul className="list-disc space-y-0.5 pl-5 text-xs">
            {pending.map((r) => (
              <li key={r.id}>
                {r.title} — residual {r.residualRisk}, target {r.targetRisk}
              </li>
            ))}
          </ul>
        </PrintSection>
      )}

      {unacceptable.length > 0 && (
        <PrintSection title="Unacceptable">
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-status-red">
            {unacceptable.map((r) => (
              <li key={r.id}>{r.title}</li>
            ))}
          </ul>
        </PrintSection>
      )}
    </PrintShell>
  );
}
