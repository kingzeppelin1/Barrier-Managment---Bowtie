'use client';

import { use } from 'react';
import { PrintShell, PrintSection } from '@/components/print/print-shell';
import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function BowtieReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const bowtie = useDemoStore((s) => s.bowties.find((b) => b.id === id));
  const threats = useDemoStore((s) => s.threats.filter((t) => t.bowtieId === id));
  const consequences = useDemoStore((s) => s.consequences.filter((c) => c.bowtieId === id));
  const barriers = useDemoStore((s) => s.barriers.filter((b) => b.bowtieIds.includes(id)));
  const dfs = useDemoStore((s) => s.degradationFactors);
  const dcs = useDemoStore((s) => s.degradationControls);
  const users = useDemoStore((s) => s.users);
  const standards = useDemoStore((s) => s.performanceStandards);

  if (!bowtie) {
    return (
      <PrintShell title="Bowtie Report" subtitle="Bowtie not found.">
        <p>No bowtie exists for id <code>{id}</code>.</p>
      </PrintShell>
    );
  }

  const owner = users.find((u) => u.id === bowtie.ownerId);
  const prevBarriers = barriers.filter((b) => bowtie.preventiveBarrierIds.includes(b.id));
  const mitBarriers = barriers.filter((b) => bowtie.mitigativeBarrierIds.includes(b.id));

  return (
    <PrintShell
      title={bowtie.title}
      subtitle={`Bowtie report — ${bowtie.id}`}
      meta={`Last revised ${formatDate(bowtie.lastRevisedAt)} · ${bowtie.approvalState.replace(/_/g, ' ')}`}
    >
      <PrintSection title="Scope">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-medium">Hazard</div>
            <div className="text-muted-foreground">{bowtie.hazard}</div>
          </div>
          <div>
            <div className="font-medium">Top Event</div>
            <div className="text-muted-foreground">{bowtie.topEvent}</div>
          </div>
          <div>
            <div className="font-medium">Asset / process</div>
            <div className="text-muted-foreground">{bowtie.assetOrProcess}</div>
          </div>
          <div>
            <div className="font-medium">Owner</div>
            <div className="text-muted-foreground">{owner?.name ?? '—'}</div>
          </div>
        </div>
      </PrintSection>

      <PrintSection title="Four-level risk">
        <div className="grid grid-cols-4 gap-3 text-center text-xs">
          {(
            [
              ['Inherent', bowtie.riskBeforeBarriers],
              ['Current', bowtie.riskCurrent],
              ['Residual', bowtie.riskAfterBarriers],
              ['Target', bowtie.riskTarget],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-md border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      </PrintSection>

      <PrintSection title={`Threats (${threats.length})`}>
        <ol className="list-decimal space-y-1 pl-5 text-xs">
          {threats.map((t) => {
            const chain = barriers.filter((b) => t.preventiveBarrierIds.includes(b.id));
            return (
              <li key={t.id}>
                <div className="font-medium">{t.description}</div>
                <div className="text-muted-foreground">
                  Preventive chain ({chain.length}): {chain.map((b) => b.name).join(' → ') || '—'}
                </div>
              </li>
            );
          })}
        </ol>
      </PrintSection>

      <PrintSection title={`Consequences (${consequences.length})`}>
        <ol className="list-decimal space-y-1 pl-5 text-xs">
          {consequences.map((c) => {
            const chain = barriers.filter((b) => c.mitigativeBarrierIds.includes(b.id));
            return (
              <li key={c.id}>
                <div className="font-medium">
                  {c.description}{' '}
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {c.severity}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Mitigative chain ({chain.length}): {chain.map((b) => b.name).join(' → ') || '—'}
                </div>
              </li>
            );
          })}
        </ol>
      </PrintSection>

      <PrintSection title={`Preventive barriers (${prevBarriers.length})`}>
        <BarrierTable
          barriers={prevBarriers}
          users={users}
          standards={standards}
          dfs={dfs}
          dcs={dcs}
        />
      </PrintSection>

      <PrintSection title={`Mitigative / recovery barriers (${mitBarriers.length})`}>
        <BarrierTable
          barriers={mitBarriers}
          users={users}
          standards={standards}
          dfs={dfs}
          dcs={dcs}
        />
      </PrintSection>
    </PrintShell>
  );
}

function BarrierTable({
  barriers,
  users,
  standards,
  dfs,
  dcs,
}: {
  barriers: ReturnType<typeof useDemoStore.getState>['barriers'];
  users: ReturnType<typeof useDemoStore.getState>['users'];
  standards: ReturnType<typeof useDemoStore.getState>['performanceStandards'];
  dfs: ReturnType<typeof useDemoStore.getState>['degradationFactors'];
  dcs: ReturnType<typeof useDemoStore.getState>['degradationControls'];
}) {
  if (barriers.length === 0) return <p className="text-muted-foreground text-xs">None.</p>;
  return (
    <table className="w-full border-collapse text-xs">
      <thead className="border-b">
        <tr>
          <th className="py-1 text-left">Name</th>
          <th className="py-1 text-left">Type / Function</th>
          <th className="py-1 text-left">Crit.</th>
          <th className="py-1 text-left">Owner</th>
          <th className="py-1 text-right">Health</th>
          <th className="py-1 text-left">Status</th>
          <th className="py-1 text-left">PS</th>
          <th className="py-1 text-right">DF/DC</th>
        </tr>
      </thead>
      <tbody>
        {barriers.map((b) => {
          const owner = users.find((u) => u.id === b.ownerId);
          const ps = standards.find((s) => s.id === b.performanceStandardId);
          const dfCount = dfs.filter((f) => f.barrierId === b.id).length;
          const dcCount = dcs.filter((c) =>
            dfs.some((f) => f.id === c.degradationFactorId && f.barrierId === b.id),
          ).length;
          return (
            <tr key={b.id} className="border-b">
              <td className="py-1.5 font-medium">{b.name}</td>
              <td className="py-1.5 capitalize text-muted-foreground">
                {b.type} / {b.function}
              </td>
              <td className="py-1.5 capitalize">{b.criticality}</td>
              <td className="py-1.5">{owner?.name ?? '— gap'}</td>
              <td className="py-1.5 text-right tabular-nums">{b.healthScore}</td>
              <td className="py-1.5 capitalize">
                {b.status}
                {b.withCompensatory && b.status === 'red' ? ' (+ comp)' : ''}
              </td>
              <td className="py-1.5">{ps?.name ?? '—'}</td>
              <td className="py-1.5 text-right tabular-nums">
                {dfCount}/{dcCount}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
