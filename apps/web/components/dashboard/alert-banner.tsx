'use client';

import { AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

import type { Action, Barrier, Verification } from '@bowtie/shared';

interface AlertBannerProps {
  barriers: Barrier[];
  actions: Action[];
  verifications: Verification[];
}

interface Alert {
  label: string;
  href: string;
}

function buildAlerts(barriers: Barrier[], actions: Action[], verifications: Verification[]): Alert[] {
  const now = new Date();
  const alerts: Alert[] = [];

  // Red barriers — surface up to 3, with the most informative reason per barrier.
  const redBarriers = barriers.filter((b) => b.status === 'red').slice(0, 3);
  for (const b of redBarriers) {
    const verifsForBarrier = verifications
      .filter((v) => v.barrierId === b.id)
      .sort((a, c) => new Date(c.date).getTime() - new Date(a.date).getTime());
    const latest = verifsForBarrier[0];

    let reason = 'red status';
    if (b.withCompensatory) reason = 'compensated red';
    else if (latest?.result === 'fail' || b.failedTests > 0) reason = 'failed test';
    else if (latest?.result === 'partial') reason = 'underperforming';
    else if (!b.ownerId || b.gapRecord) reason = 'owner gap';
    else if (b.nextVerificationDue && new Date(b.nextVerificationDue) < now) reason = 'verification overdue';
    else if (b.openCriticalFindings > 0) reason = 'open critical finding';
    alerts.push({ label: `${b.name} — ${reason}`, href: '/barriers' });
  }

  // Overdue critical actions.
  const overdueCritical = actions
    .filter(
      (a) =>
        a.priority === 'critical' &&
        a.status !== 'closed' &&
        (a.status === 'overdue' || new Date(a.dueDate) < now),
    )
    .slice(0, 2);
  for (const a of overdueCritical) {
    alerts.push({ label: `Action overdue — ${a.title}`, href: '/actions' });
  }

  // Overdue verifications (compact).
  const overdueVerifs = verifications.filter((v) => new Date(v.nextDue) < now).length;
  if (overdueVerifs > 0) {
    alerts.push({
      label: `${overdueVerifs} verification${overdueVerifs === 1 ? '' : 's'} past due`,
      href: '/verifications',
    });
  }

  return alerts;
}

export function AlertBanner({ barriers, actions, verifications }: AlertBannerProps) {
  const alerts = buildAlerts(barriers, actions, verifications);

  if (alerts.length === 0) return null;

  const headline = `${alerts.length} item${alerts.length === 1 ? '' : 's'} need attention`;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-status-red/30 bg-status-red/5 p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-red/15 text-status-red">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-status-red">{headline}</div>
        <ul className="mt-1 space-y-0.5 text-sm">
          {alerts.map((a, idx) => (
            <li key={idx} className="truncate">
              <Link href={a.href} className="text-foreground/90 hover:underline">
                {a.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        className="text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss"
        // Demo dismiss — not persisted.
        onClick={(e) => {
          (e.currentTarget.closest('div[class*="rounded-lg"]') as HTMLElement | null)?.remove();
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
