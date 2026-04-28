'use client';

import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { AlertBanner } from '@/components/dashboard/alert-banner';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { StatusDonut, StatusDonutLegend } from '@/components/dashboard/status-donut';
import { TopBarriersCard } from '@/components/dashboard/top-barriers-card';
import { TopActionsCard } from '@/components/dashboard/top-actions-card';
import { useDemoStore } from '@/lib/store';

export default function DashboardPage() {
  const bowties = useDemoStore((s) => s.bowties);
  const barriers = useDemoStore((s) => s.barriers);
  const actions = useDemoStore((s) => s.actions);
  const verifications = useDemoStore((s) => s.verifications);
  const risks = useDemoStore((s) => s.risks);
  const users = useDemoStore((s) => s.users);

  const now = new Date();
  const overdueVerifications = verifications.filter((v) => new Date(v.nextDue) < now).length;
  const openActions = actions.filter((a) => a.status !== 'closed').length;
  const highResidual = risks.filter((r) => r.residualRisk >= 8).length;
  const criticalBarriers = barriers.filter((b) => b.criticality === 'critical').length;
  const requiringReview = bowties.filter(
    (bt) =>
      bt.approvalState === 'internal_review' ||
      bt.approvalState === 'sme_review' ||
      bt.approvalState === 'risk_manager_review',
  ).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live snapshot from the demo seed — three industry scenarios."
      />
      <div className="space-y-6 p-6">
        <AlertBanner barriers={barriers} actions={actions} verifications={verifications} />

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Active bowties" value={bowties.length} hint={`${requiringReview} in review`} />
          <KpiCard label="Critical barriers" value={criticalBarriers} />
          <KpiCard label="Open actions" value={openActions} tone={openActions > 0 ? 'yellow' : 'default'} />
          <KpiCard
            label="Overdue verifications"
            value={overdueVerifications}
            tone={overdueVerifications > 0 ? 'red' : 'green'}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-baseline justify-between">
                <div className="text-sm font-semibold">Barrier health distribution</div>
                <div className="text-xs text-muted-foreground">{barriers.length} total</div>
              </div>
              <StatusDonut barriers={barriers} />
              <StatusDonutLegend barriers={barriers} />
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid gap-3 md:grid-cols-2">
            <KpiCard
              label="High residual risks"
              value={highResidual}
              hint="Residual ≥ 8"
              tone={highResidual > 0 ? 'yellow' : 'default'}
            />
            <KpiCard
              label="Bowties requiring review"
              value={requiringReview}
              hint="In any review stage"
            />
            <KpiCard
              label="Red barriers"
              value={barriers.filter((b) => b.status === 'red').length}
              tone="red"
            />
            <KpiCard
              label="Yellow barriers"
              value={barriers.filter((b) => b.status === 'yellow').length}
              tone="yellow"
            />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <TopBarriersCard barriers={barriers} />
          <TopActionsCard actions={actions} users={users} />
        </div>
      </div>
    </>
  );
}
