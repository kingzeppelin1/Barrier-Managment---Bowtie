'use client';

import { LayoutDashboard } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { useDemoStore } from '@/lib/store';

export default function DashboardPage() {
  const bowties = useDemoStore((s) => s.bowties);
  const barriers = useDemoStore((s) => s.barriers);
  const actions = useDemoStore((s) => s.actions);
  const verifications = useDemoStore((s) => s.verifications);
  const risks = useDemoStore((s) => s.risks);

  const redBarriers = barriers.filter((b) => b.status === 'red').length;
  const yellowBarriers = barriers.filter((b) => b.status === 'yellow').length;
  const greenBarriers = barriers.filter((b) => b.status === 'green').length;
  const overdueVerifications = verifications.filter((v) => new Date(v.nextDue) < new Date()).length;
  const openActions = actions.filter((a) => a.status !== 'closed').length;
  const highResidual = risks.filter((r) => r.residualRisk >= 8).length;

  const cards = [
    { label: 'Active bowties', value: bowties.length },
    { label: 'Critical barriers', value: barriers.filter((b) => b.criticality === 'critical').length },
    { label: 'Red barriers', value: redBarriers },
    { label: 'Yellow barriers', value: yellowBarriers },
    { label: 'Green barriers', value: greenBarriers },
    { label: 'Overdue verifications', value: overdueVerifications },
    { label: 'Open actions', value: openActions },
    { label: 'High residual risks', value: highResidual },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live snapshot from the demo seed — three industry scenarios."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <CardDescription className="text-xs uppercase tracking-wider">{c.label}</CardDescription>
                <CardTitle className="mt-1 text-3xl font-semibold">{c.value}</CardTitle>
              </CardContent>
            </Card>
          ))}
        </div>
        <EmptyState
          icon={LayoutDashboard}
          title="Charts arrive in Slice 3"
          description="The dashboard cards are wired to the store. Visualisations (status donut, action burn-down, alert banner) land with the dedicated dashboard slice."
        />
      </div>
    </>
  );
}
