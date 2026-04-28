'use client';

import { PrintShell, PrintSection } from '@/components/print/print-shell';
import { useDemoStore } from '@/lib/store';

export default function RiskExposurePrintPage() {
  const risks = useDemoStore((s) => s.risks);
  const users = useDemoStore((s) => s.users);

  const sorted = [...risks].sort((a, b) => b.residualRisk - a.residualRisk);

  return (
    <PrintShell
      title="Risk Exposure"
      subtitle="Four-level risk profile across the register."
      meta={`${risks.length} risk(s)`}
    >
      <PrintSection title="Register">
        {sorted.length === 0 ? (
          <p className="text-muted-foreground">No risks logged.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="border-b">
              <tr>
                <th className="py-1 text-left">ID</th>
                <th className="py-1 text-left">Title</th>
                <th className="py-1 text-left">Category</th>
                <th className="py-1 text-right">Inherent</th>
                <th className="py-1 text-right">Current</th>
                <th className="py-1 text-right">Residual</th>
                <th className="py-1 text-right">Target</th>
                <th className="py-1 text-left">Owner</th>
                <th className="py-1 text-left">Acceptance</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const owner = users.find((u) => u.id === r.ownerId);
                return (
                  <tr key={r.id} className="border-b">
                    <td className="py-1.5 font-mono">{r.id}</td>
                    <td className="py-1.5 font-medium">{r.title}</td>
                    <td className="py-1.5 capitalize">{r.category.replace(/_/g, ' ')}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.inherentRisk}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.currentRisk}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.residualRisk}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.targetRisk}</td>
                    <td className="py-1.5">{owner?.name ?? '—'}</td>
                    <td className="py-1.5 capitalize">{r.acceptanceStatus.replace(/_/g, ' ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </PrintSection>

      <PrintSection title="Methodology">
        <p className="text-xs text-muted-foreground">
          Four-level risk: <b>Inherent</b> (pre-barrier worst case) → <b>Current</b> (with current
          barrier health) → <b>Residual</b> (if all barriers perform) → <b>Target</b> (ALARP /
          ambition). Two-level shortcuts are not allowed.
        </p>
      </PrintSection>
    </PrintShell>
  );
}
