'use client';

import { PrintShell, PrintSection } from '@/components/print/print-shell';
import { useDemoStore } from '@/lib/store';

export default function ManagementSummaryPrintPage() {
  const bowties = useDemoStore((s) => s.bowties);
  const barriers = useDemoStore((s) => s.barriers);
  const actions = useDemoStore((s) => s.actions);
  const verifications = useDemoStore((s) => s.verifications);
  const risks = useDemoStore((s) => s.risks);

  const now = new Date();
  const red = barriers.filter((b) => b.status === 'red').length;
  const yellow = barriers.filter((b) => b.status === 'yellow').length;
  const green = barriers.filter((b) => b.status === 'green').length;
  const critical = barriers.filter((b) => b.criticality === 'critical');
  const criticalAtRisk = critical.filter((b) => b.status === 'red' || b.status === 'yellow').length;
  const overdueVerifs = verifications.filter((v) => new Date(v.nextDue) < now).length;
  const openActions = actions.filter((a) => a.status !== 'closed').length;
  const overdueActions = actions.filter(
    (a) => a.status !== 'closed' && (a.status === 'overdue' || new Date(a.dueDate) < now),
  ).length;
  const highResidual = risks.filter((r) => r.residualRisk >= 8);

  return (
    <PrintShell
      title="Management Summary"
      subtitle="One-page rollup for the leadership review."
      meta={`${bowties.length} bowties · ${barriers.length} barriers`}
    >
      <PrintSection title="Headline">
        <div className="grid grid-cols-4 gap-3">
          <Tile label="Active bowties" value={bowties.length} />
          <Tile label="Critical barriers" value={critical.length} />
          <Tile label="Critical at risk" value={criticalAtRisk} tone={criticalAtRisk > 0 ? 'red' : 'default'} />
          <Tile label="High residual risks" value={highResidual.length} />
        </div>
      </PrintSection>

      <PrintSection title="Barrier health">
        <div className="grid grid-cols-3 gap-3">
          <Tile label="Green" value={green} tone="green" />
          <Tile label="Yellow" value={yellow} tone="yellow" />
          <Tile label="Red" value={red} tone="red" />
        </div>
      </PrintSection>

      <PrintSection title="Action backlog">
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Open actions" value={openActions} />
          <Tile label="Overdue actions" value={overdueActions} tone={overdueActions > 0 ? 'red' : 'default'} />
        </div>
      </PrintSection>

      <PrintSection title="Verifications">
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Recorded" value={verifications.length} />
          <Tile label="Overdue" value={overdueVerifs} tone={overdueVerifs > 0 ? 'red' : 'default'} />
        </div>
      </PrintSection>

      <PrintSection title="High residual risks">
        {highResidual.length === 0 ? (
          <p className="text-muted-foreground">No risks above the residual threshold.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="border-b">
              <tr>
                <th className="py-1 text-left">Risk</th>
                <th className="py-1 text-left">Category</th>
                <th className="py-1 text-right">Inherent</th>
                <th className="py-1 text-right">Current</th>
                <th className="py-1 text-right">Residual</th>
                <th className="py-1 text-right">Target</th>
                <th className="py-1 text-left">Acceptance</th>
              </tr>
            </thead>
            <tbody>
              {highResidual.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-1.5 font-medium">{r.title}</td>
                  <td className="py-1.5 capitalize text-muted-foreground">{r.category.replace(/_/g, ' ')}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.inherentRisk}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.currentRisk}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.residualRisk}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.targetRisk}</td>
                  <td className="py-1.5 capitalize">{r.acceptanceStatus.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>
    </PrintShell>
  );
}

function Tile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'green' | 'yellow' | 'red';
}) {
  const toneClass =
    tone === 'green'
      ? 'text-status-green'
      : tone === 'yellow'
        ? 'text-status-yellow'
        : tone === 'red'
          ? 'text-status-red'
          : '';
  return (
    <div className="rounded-md border p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
