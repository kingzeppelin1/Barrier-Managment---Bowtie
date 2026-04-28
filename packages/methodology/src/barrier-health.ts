/**
 * Canonical 0–100 barrier-health calculator.
 *
 * Pure function. No I/O. Deterministic. Used as the single source for both
 * UI rendering and approval-gate logic. Status thresholds (per spec):
 *   green  = 90..100
 *   yellow = 70..89
 *   red    =  0..69
 *   gray   = unknown (no inputs at all)
 *
 * Automatic floors for critical barriers are NOT optional:
 *   - Failed critical test           → caps score at 49 (red)
 *   - Open critical finding          → caps score at 49 (red)
 *   - Missing owner                  → caps score at 79 (yellow)
 *   - Overdue critical verification  → caps score at 79 (yellow)
 *
 * "Compensated red stays red." If withCompensatory=true and the computed
 * status is red, the result remains red and a flag is surfaced. The function
 * never auto-promotes a red barrier.
 */

export type Criticality = 'critical' | 'high' | 'medium' | 'low';
export type HealthStatus = 'green' | 'yellow' | 'red' | 'gray';

export interface BarrierHealthInput {
  criticality: Criticality;
  hasOwner: boolean;
  lastVerifiedAt: Date | string | null;
  nextVerificationDue: Date | string | null;
  failedCriticalTests: number;
  openCriticalFindings: number;
  /** Optional baseline score in 0..100. Defaults to 95 when no signals. */
  baseline?: number;
  /** Whether documented compensatory measures exist for a red state. */
  withCompensatory?: boolean;
  /** Optional reference date — for testability. */
  now?: Date;
}

export interface BarrierHealthResult {
  score: number; // 0..100
  status: HealthStatus;
  withCompensatory: boolean;
  reasons: string[];
}

const STATUS_THRESHOLDS = {
  green: 90,
  yellow: 70,
} as const;

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = typeof v === 'string' ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? null : d;
}

function classify(score: number): HealthStatus {
  if (score >= STATUS_THRESHOLDS.green) return 'green';
  if (score >= STATUS_THRESHOLDS.yellow) return 'yellow';
  return 'red';
}

export function calculateBarrierHealth(input: BarrierHealthInput): BarrierHealthResult {
  const reasons: string[] = [];
  const isCritical = input.criticality === 'critical';
  const now = input.now ?? new Date();

  // No signals at all → unknown.
  const hasAnySignal =
    input.hasOwner ||
    input.lastVerifiedAt ||
    input.nextVerificationDue ||
    input.failedCriticalTests > 0 ||
    input.openCriticalFindings > 0;

  if (!hasAnySignal && input.baseline === undefined) {
    return { score: 0, status: 'gray', withCompensatory: false, reasons: ['No data'] };
  }

  let score = input.baseline ?? 95;

  if (!input.hasOwner) {
    score -= 20;
    reasons.push('Missing owner');
  }

  const nextDue = toDate(input.nextVerificationDue);
  if (nextDue && nextDue.getTime() < now.getTime()) {
    score -= isCritical ? 25 : 15;
    reasons.push('Verification overdue');
  }

  const lastVerified = toDate(input.lastVerifiedAt);
  if (!lastVerified) {
    score -= 5;
    reasons.push('Never verified');
  }

  if (input.failedCriticalTests > 0) {
    score -= 40;
    reasons.push(`${input.failedCriticalTests} failed critical test(s)`);
  }

  if (input.openCriticalFindings > 0) {
    score -= 30;
    reasons.push(`${input.openCriticalFindings} open critical finding(s)`);
  }

  // -- Auto-floors for critical barriers (cannot be skipped) --------------
  if (isCritical) {
    if (input.failedCriticalTests > 0) score = Math.min(score, 49);
    if (input.openCriticalFindings > 0) score = Math.min(score, 49);
    if (!input.hasOwner) score = Math.min(score, 79);
    if (nextDue && nextDue.getTime() < now.getTime()) score = Math.min(score, 79);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const status = classify(score);
  const withCompensatory = status === 'red' && Boolean(input.withCompensatory);

  return { score, status, withCompensatory, reasons };
}

/** Convenience for callers that only want the status from a known score. */
export function statusFromScore(score: number | null): HealthStatus {
  if (score === null || Number.isNaN(score)) return 'gray';
  return classify(score);
}
