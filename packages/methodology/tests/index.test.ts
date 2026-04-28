import { describe, expect, it } from 'vitest';
import { PACKAGE_NAME, calculateBarrierHealth, statusFromScore } from '../src/index.js';

describe('@bowtie/methodology', () => {
  it('exposes the package name', () => {
    expect(PACKAGE_NAME).toBe('@bowtie/methodology');
  });
});

const NOW = new Date('2026-04-28T00:00:00Z');

describe('calculateBarrierHealth', () => {
  it('returns gray + score 0 when no signals', () => {
    const r = calculateBarrierHealth({
      criticality: 'medium',
      hasOwner: false,
      lastVerifiedAt: null,
      nextVerificationDue: null,
      failedCriticalTests: 0,
      openCriticalFindings: 0,
      now: NOW,
    });
    expect(r.status).toBe('gray');
    expect(r.score).toBe(0);
  });

  it('returns green for a healthy non-critical barrier', () => {
    const r = calculateBarrierHealth({
      criticality: 'medium',
      hasOwner: true,
      lastVerifiedAt: '2026-03-01',
      nextVerificationDue: '2026-09-01',
      failedCriticalTests: 0,
      openCriticalFindings: 0,
      now: NOW,
    });
    expect(r.status).toBe('green');
    expect(r.score).toBeGreaterThanOrEqual(90);
  });

  it('floors to red (≤49) when a critical barrier has failed critical test', () => {
    const r = calculateBarrierHealth({
      criticality: 'critical',
      hasOwner: true,
      lastVerifiedAt: '2026-03-01',
      nextVerificationDue: '2026-09-01',
      failedCriticalTests: 1,
      openCriticalFindings: 0,
      now: NOW,
    });
    expect(r.status).toBe('red');
    expect(r.score).toBeLessThanOrEqual(49);
  });

  it('floors to red (≤49) when a critical barrier has open critical finding', () => {
    const r = calculateBarrierHealth({
      criticality: 'critical',
      hasOwner: true,
      lastVerifiedAt: '2026-03-01',
      nextVerificationDue: '2026-09-01',
      failedCriticalTests: 0,
      openCriticalFindings: 2,
      now: NOW,
    });
    expect(r.status).toBe('red');
    expect(r.score).toBeLessThanOrEqual(49);
  });

  it('floors to yellow (≤79) when a critical barrier is missing an owner', () => {
    const r = calculateBarrierHealth({
      criticality: 'critical',
      hasOwner: false,
      lastVerifiedAt: '2026-03-01',
      nextVerificationDue: '2026-09-01',
      failedCriticalTests: 0,
      openCriticalFindings: 0,
      now: NOW,
    });
    expect(r.status).toBe('yellow');
    expect(r.score).toBeLessThanOrEqual(79);
  });

  it('floors to yellow (≤79) when a critical verification is overdue', () => {
    const r = calculateBarrierHealth({
      criticality: 'critical',
      hasOwner: true,
      lastVerifiedAt: '2025-09-01',
      nextVerificationDue: '2026-01-01',
      failedCriticalTests: 0,
      openCriticalFindings: 0,
      now: NOW,
    });
    expect(r.status).toBe('yellow');
    expect(r.score).toBeLessThanOrEqual(79);
  });

  it('"compensated red stays red" — never auto-promotes when withCompensatory=true', () => {
    const r = calculateBarrierHealth({
      criticality: 'critical',
      hasOwner: true,
      lastVerifiedAt: '2026-03-01',
      nextVerificationDue: '2026-09-01',
      failedCriticalTests: 1,
      openCriticalFindings: 0,
      withCompensatory: true,
      now: NOW,
    });
    expect(r.status).toBe('red');
    expect(r.withCompensatory).toBe(true);
  });

  it('clamps to [0, 100]', () => {
    const r = calculateBarrierHealth({
      criticality: 'critical',
      hasOwner: false,
      lastVerifiedAt: null,
      nextVerificationDue: '2024-01-01',
      failedCriticalTests: 5,
      openCriticalFindings: 5,
      baseline: 100,
      now: NOW,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('treats non-critical missing-owner as yellow-ish (no hard floor)', () => {
    const r = calculateBarrierHealth({
      criticality: 'low',
      hasOwner: false,
      lastVerifiedAt: '2026-03-01',
      nextVerificationDue: '2026-09-01',
      failedCriticalTests: 0,
      openCriticalFindings: 0,
      now: NOW,
    });
    expect(r.status).toBe('yellow');
  });

  it('returns gray from statusFromScore(null)', () => {
    expect(statusFromScore(null)).toBe('gray');
  });

  it('returns the correct status from a numeric score', () => {
    expect(statusFromScore(95)).toBe('green');
    expect(statusFromScore(80)).toBe('yellow');
    expect(statusFromScore(50)).toBe('red');
  });
});
