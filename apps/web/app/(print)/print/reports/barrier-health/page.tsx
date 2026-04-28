'use client';

import { PrintShell, PrintSection } from '@/components/print/print-shell';
import { useDemoStore } from '@/lib/store';
import type { Criticality } from '@bowtie/shared';

const CRITICALITIES: Criticality[] = ['critical', 'high', 'medium', 'low'];

export default function BarrierHealthPrintPage() {
  const barriers = useDemoStore((s) => s.barriers);

  const total = barriers.length;
  const red = barriers.filter((b) => b.status === 'red').length;
  const yellow = barriers.filter((b) => b.status === 'yellow').length;
  const green = barriers.filter((b) => b.status === 'green').length;
  const gray = barriers.filter((b) => b.status === 'gray').length;

  return (
    <PrintShell
      title="Barrier Health Report"
      subtitle="Distribution of barrier health scores across the estate."
      meta={`${total} barrier(s)`}
    >
      <PrintSection title="Distribution">
        <table className="w-full border-collapse text-xs">
          <thead className="border-b">
            <tr>
              <th className="py-1 text-left">Status</th>
              <th className="py-1 text-right">Count</th>
              <th className="py-1 text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['Green (90–100)', green],
                ['Yellow (70–89)', yellow],
                ['Red (0–69)', red],
                ['Unknown', gray],
              ] as const
            ).map(([label, count]) => (
              <tr key={label} className="border-b">
                <td className="py-1.5">{label}</td>
                <td className="py-1.5 text-right tabular-nums">{count}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {total > 0 ? `${Math.round((count / total) * 100)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintSection>

      <PrintSection title="By criticality">
        <table className="w-full border-collapse text-xs">
          <thead className="border-b">
            <tr>
              <th className="py-1 text-left">Criticality</th>
              <th className="py-1 text-right">Total</th>
              <th className="py-1 text-right">Red</th>
              <th className="py-1 text-right">Yellow</th>
              <th className="py-1 text-right">Green</th>
              <th className="py-1 text-right">Avg health</th>
            </tr>
          </thead>
          <tbody>
            {CRITICALITIES.map((c) => {
              const list = barriers.filter((b) => b.criticality === c);
              const r = list.filter((b) => b.status === 'red').length;
              const y = list.filter((b) => b.status === 'yellow').length;
              const g = list.filter((b) => b.status === 'green').length;
              const avg =
                list.length === 0
                  ? '—'
                  : (list.reduce((acc, b) => acc + b.healthScore, 0) / list.length).toFixed(0);
              return (
                <tr key={c} className="border-b">
                  <td className="py-1.5 capitalize">{c}</td>
                  <td className="py-1.5 text-right tabular-nums">{list.length}</td>
                  <td className="py-1.5 text-right tabular-nums">{r}</td>
                  <td className="py-1.5 text-right tabular-nums">{y}</td>
                  <td className="py-1.5 text-right tabular-nums">{g}</td>
                  <td className="py-1.5 text-right tabular-nums">{avg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </PrintSection>

      <PrintSection title="Worst-first">
        <table className="w-full border-collapse text-xs">
          <thead className="border-b">
            <tr>
              <th className="py-1 text-left">Barrier</th>
              <th className="py-1 text-left">Crit.</th>
              <th className="py-1 text-right">Health</th>
              <th className="py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...barriers]
              .sort((a, b) => a.healthScore - b.healthScore)
              .map((b) => (
                <tr key={b.id} className="border-b">
                  <td className="py-1.5 font-medium">{b.name}</td>
                  <td className="py-1.5 capitalize">{b.criticality}</td>
                  <td className="py-1.5 text-right tabular-nums">{b.healthScore}</td>
                  <td className="py-1.5 capitalize">
                    {b.status}
                    {b.withCompensatory && b.status === 'red' ? ' (+ comp)' : ''}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </PrintSection>
    </PrintShell>
  );
}
