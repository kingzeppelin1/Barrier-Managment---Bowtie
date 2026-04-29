'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type {
  Action,
  Barrier,
  Bowtie,
  Risk,
  Scenario,
} from '@bowtie/shared';

import { cn, formatDate, relativeDays } from '@/lib/utils';

interface ScenarioHeroCardsProps {
  scenarios: Scenario[];
  bowties: Bowtie[];
  barriers: Barrier[];
  risks: Risk[];
  actions: Action[];
}

type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

function classifyResidualRisk(value: number): RiskLevel {
  if (value >= 12) return 'Critical';
  if (value >= 8) return 'High';
  if (value >= 4) return 'Medium';
  return 'Low';
}

const RISK_BADGE: Record<RiskLevel, string> = {
  Low: 'bg-status-green/15 text-status-green',
  Medium: 'bg-status-yellow/15 text-status-yellow',
  High: 'bg-status-yellow/20 text-status-yellow',
  Critical: 'bg-status-red/20 text-status-red',
};

/**
 * Per-scenario hero cards — four canonical metrics requested in the
 * Slice 15 brief, in order:
 *   1. Barrier Health Score % (effective / total)
 *   2. Critical findings count (failed barriers + degraded critical
 *      barriers + overdue critical actions, summed)
 *   3. Residual risk level pill (Low / Medium / High / Critical)
 *   4. Next review due (date + days remaining; orange ≤ 30d, red overdue)
 *
 * "Pending AI suggestions" was deliberately moved out of the hero card and
 * into the dedicated AI Coach Inbox accessible from the sidebar.
 */
export function ScenarioHeroCards({
  scenarios,
  bowties,
  barriers,
  risks,
  actions,
}: ScenarioHeroCardsProps) {
  const now = new Date();
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((s) => {
        const scenarioBowties = bowties.filter((b) => b.scenarioId === s.id);
        const scenarioBarriers = barriers.filter((b) => b.scenarioId === s.id);
        const total = scenarioBarriers.length;
        const effective = scenarioBarriers.filter((b) => b.status === 'green').length;
        const healthPct = total > 0 ? Math.round((effective / total) * 100) : 0;

        const failedBarriers = scenarioBarriers.filter((b) => b.status === 'red').length;
        const degradedCriticalBarriers = scenarioBarriers.filter(
          (b) => b.status === 'yellow' && b.criticality === 'critical',
        ).length;
        const overdueCriticalActions = actions.filter(
          (a) =>
            a.scenarioId === s.id &&
            a.priority === 'critical' &&
            a.status !== 'closed' &&
            (a.status === 'overdue' || new Date(a.dueDate) < now),
        ).length;
        const findings = failedBarriers + degradedCriticalBarriers + overdueCriticalActions;

        const scenarioRisks = risks.filter((r) => r.scenarioId === s.id);
        const maxResidual = scenarioRisks.reduce(
          (m, r) => Math.max(m, r.residualRisk),
          0,
        );
        const riskLevel = classifyResidualRisk(maxResidual);

        const nextReview = scenarioBowties
          .map((b) => b.nextReviewDue)
          .filter(Boolean)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;
        const reviewDays = relativeDays(nextReview ?? null);
        const reviewTone =
          reviewDays === null
            ? 'muted'
            : reviewDays < 0
              ? 'red'
              : reviewDays <= 30
                ? 'orange'
                : 'muted';

        const overallTone: 'green' | 'yellow' | 'red' =
          findings >= 3 || riskLevel === 'Critical'
            ? 'red'
            : findings > 0 || riskLevel === 'High'
              ? 'yellow'
              : 'green';

        return (
          <Link
            key={s.id}
            href="/barriers"
            className="group relative overflow-hidden rounded-lg bg-star-navy text-white transition-shadow hover:shadow-lg"
          >
            <div className="relative p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        overallTone === 'green' && 'bg-status-green',
                        overallTone === 'yellow' && 'bg-status-yellow',
                        overallTone === 'red' && 'bg-status-red',
                      )}
                    />
                    <span className="truncate text-base font-semibold">{s.name}</span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-white/60">
                    {s.industry.replace(/_/g, ' ')}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-star-teal" />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/50">Health</dt>
                  <dd className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold tabular-nums">{healthPct}</span>
                    <span className="text-xs text-white/70">%</span>
                  </dd>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        'h-full transition-all',
                        healthPct >= 80
                          ? 'bg-status-green'
                          : healthPct >= 50
                            ? 'bg-status-yellow'
                            : 'bg-status-red',
                      )}
                      style={{ width: `${healthPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/50">Findings</dt>
                  <dd
                    className={cn(
                      'mt-0.5 text-2xl font-semibold tabular-nums',
                      findings === 0 ? 'text-white' : 'text-status-red',
                    )}
                  >
                    {findings}
                  </dd>
                  <div className="text-[10px] text-white/50">
                    Failed + critical degraded + overdue
                  </div>
                </div>

                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/50">Residual risk</dt>
                  <dd className="mt-1">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        RISK_BADGE[riskLevel],
                      )}
                    >
                      {riskLevel}
                    </span>
                  </dd>
                  <div className="text-[10px] text-white/50">Max residual {maxResidual}</div>
                </div>

                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/50">
                    Next review
                  </dt>
                  <dd
                    className={cn(
                      'mt-0.5 text-sm font-medium',
                      reviewTone === 'red' && 'text-status-red',
                      reviewTone === 'orange' && 'text-status-yellow',
                      reviewTone === 'muted' && 'text-white',
                    )}
                  >
                    {nextReview ? formatDate(nextReview) : '—'}
                  </dd>
                  <div className="text-[10px] text-white/50">
                    {reviewDays === null
                      ? 'No review scheduled'
                      : reviewDays < 0
                        ? `${Math.abs(reviewDays)}d overdue`
                        : `in ${reviewDays}d`}
                  </div>
                </div>
              </dl>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
