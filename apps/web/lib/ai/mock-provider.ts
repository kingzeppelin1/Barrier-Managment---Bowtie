import type {
  AiSuggestion,
  AiSuggestionCategory,
  Barrier,
  BarrierFunction,
} from '@bowtie/shared';

import type { AIProvider, CoachInput } from './provider';

const MODEL_ID = 'demo-coach-v1';

/**
 * Deterministic mock AI Coach. Same inputs → same outputs, so re-runs don't
 * spawn duplicates and the demo behaves predictably across sessions.
 *
 * Each rule produces at most one suggestion per (bowtie, target). The
 * suggestion id is `ai-mock-<bowtieId>-<category>-<targetSuffix>` so the
 * store can dedupe by id when a fresh run lands.
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'mock' as const;

  async evaluate(input: CoachInput): Promise<AiSuggestion[]> {
    // Loading delay — instant returns feel fake.
    await delay(400 + Math.random() * 400);

    const out: AiSuggestion[] = [];
    out.push(...checkMissingBarriers(input));
    out.push(...checkTopEventQuality(input));
    out.push(...checkBarrierIndependence(input));
    out.push(...checkRiskAcceptanceWarnings(input));
    out.push(...checkSuggestDF(input));
    out.push(...checkSuggestPS(input));
    out.push(...checkStaleVerification(input));
    out.push(...checkInsufficientDiversity(input));
    return out;
  }
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

function checkMissingBarriers({ bowtie, threats, consequences, barriers }: CoachInput): AiSuggestion[] {
  const out: AiSuggestion[] = [];
  const barriersById = new Map(barriers.map((b) => [b.id, b]));

  for (const t of threats) {
    const linked = t.preventiveBarrierIds
      .map((id) => barriersById.get(id))
      .filter((b): b is Barrier => Boolean(b));
    if (linked.length === 0) {
      out.push(
        suggestion({
          id: idOf(bowtie.id, 'missing_barrier', `t-${t.id}`),
          bowtieId: bowtie.id,
          category: 'missing_barrier',
          context: { type: 'threat', targetId: t.id },
          title: 'Threat has no preventive barrier',
          rationale: `Threat "${truncate(t.description, 60)}" is not defended by any preventive barrier. The methodology requires every threat to be defended by at least one preventive barrier in the bowtie.`,
          suggested: 'Add a preventive barrier and assign it to this threat in the Builder Wizard (Step 6).',
          confidence: 'high',
          severity: 'blocker',
          citations: ['CCPS Bowtie Methodology §3.1', 'CLAUDE.md §2 Methodology guardrails'],
        }),
      );
    }
  }

  for (const c of consequences) {
    const linked = c.mitigativeBarrierIds.length;
    if (linked === 0) {
      out.push(
        suggestion({
          id: idOf(bowtie.id, 'missing_barrier', `c-${c.id}`),
          bowtieId: bowtie.id,
          category: 'missing_barrier',
          context: { type: 'consequence', targetId: c.id },
          title: 'Consequence has no mitigative / recovery barrier',
          rationale: `Consequence "${truncate(c.description, 60)}" has no mitigative barrier between it and the Top Event.`,
          suggested: 'Add a mitigative or recovery barrier in the Builder Wizard (Step 7) and link it to this consequence.',
          confidence: 'high',
          severity: 'warning',
          citations: ['CCPS Bowtie Methodology §3.1'],
        }),
      );
    }
  }

  return out;
}

function checkTopEventQuality({ bowtie }: CoachInput): AiSuggestion[] {
  const text = bowtie.topEvent.toLowerCase();
  const issues: string[] = [];
  // Heuristics that match what a methodology coach would flag.
  if (/injur|fatal|death|fire|explosion/.test(text)) {
    issues.push('Top Event reads like a consequence (injury/fire/explosion). It should describe a loss-of-control event, not its outcomes.');
  }
  if (/due to|because of|caused by/.test(text)) {
    issues.push('Top Event includes a cause clause. Causes belong on the threats side; phrase the Top Event neutrally.');
  }
  if (bowtie.topEvent.length < 25) {
    issues.push('Top Event is short. Make sure it’s precise enough to anchor the barriers downstream.');
  }
  if (issues.length === 0) return [];

  return [
    suggestion({
      id: idOf(bowtie.id, 'top_event_quality', 'te'),
      bowtieId: bowtie.id,
      category: 'top_event_quality',
      context: { type: 'top_event', targetId: bowtie.id },
      title: 'Top Event wording could be tightened',
      rationale: issues.join(' '),
      suggested: 'Rephrase the Top Event as a loss-of-control event, neutral and free of consequence/cause language.',
      confidence: 'medium',
      severity: 'info',
      citations: ['CCPS Bowtie Methodology §2.4', 'EI Bowtie Guideline 2nd ed. §4.2'],
    }),
  ];
}

function checkBarrierIndependence({ bowtie, barriers }: CoachInput): AiSuggestion[] {
  const critical = barriers.filter(
    (b) => b.criticality === 'critical' && bowtie.preventiveBarrierIds.concat(bowtie.mitigativeBarrierIds).includes(b.id),
  );
  // Group by owner.
  const byOwner = new Map<string, Barrier[]>();
  for (const b of critical) {
    if (!b.ownerId) continue;
    const list = byOwner.get(b.ownerId) ?? [];
    list.push(b);
    byOwner.set(b.ownerId, list);
  }
  const violations = Array.from(byOwner.entries()).filter(([, list]) => list.length >= 2);
  if (violations.length === 0) return [];

  return violations.map(([ownerId, list]) =>
    suggestion({
      id: idOf(bowtie.id, 'barrier_independence', `o-${ownerId}`),
      bowtieId: bowtie.id,
      category: 'barrier_independence',
      context: { type: 'barrier', targetId: list[0]!.id },
      title: 'Critical barriers share the same owner',
      rationale: `${list.length} critical barriers (${list.map((b) => b.name).join(', ')}) are owned by the same person. Shared ownership reduces independence and creates a single point of accountability for multiple defence layers.`,
      suggested: 'Reassign at least one critical barrier to a different owner so independence is preserved.',
      confidence: 'medium',
      severity: 'warning',
      citations: ['IEC 61511 §11.2.10 (independence)', 'CCPS Bowtie Methodology §4.5'],
    }),
  );
}

function checkRiskAcceptanceWarnings({ bowtie, risks, ...rest }: CoachInput): AiSuggestion[] {
  // Existing AI suggestions for this bowtie are already in store; we don't
  // see them here, but we approximate: if a risk linked to this bowtie is
  // marked accepted/ALARP and any barrier on the bowtie has a documented gap
  // OR the bowtie has open suggestions we surface a warning.
  const linked = risks.filter((r) => r.bowtieIds.includes(bowtie.id));
  const accepted = linked.filter(
    (r) => r.acceptanceStatus === 'accepted' || r.acceptanceStatus === 'alarp_justified',
  );
  if (accepted.length === 0) return [];
  const barriersWithGap = rest.barriers.filter(
    (b) => b.bowtieIds.includes(bowtie.id) && (b.gapRecord || !b.ownerId),
  );
  if (barriersWithGap.length === 0) return [];
  return [
    suggestion({
      id: idOf(bowtie.id, 'risk_acceptance_warning', 'risk'),
      bowtieId: bowtie.id,
      category: 'risk_acceptance_warning',
      context: { type: 'risk_acceptance', targetId: accepted[0]!.id },
      title: 'Risk acceptance documented while a barrier has an open gap',
      rationale: `Risk "${accepted[0]!.title}" is recorded as ${accepted[0]!.acceptanceStatus.replace(/_/g, ' ')}, but ${barriersWithGap.length} barrier(s) on this bowtie still have an open gap or no owner. Acceptance should normally wait until the gap is closed or compensatory controls are explicitly accepted.`,
      suggested: 'Reopen the acceptance decision until the barrier ownership / gap is resolved, or add an ALARP justification that explicitly references the gap.',
      confidence: 'high',
      severity: 'warning',
      citations: ['CCPS Bowtie Methodology §6.2', 'ISO 31000 §6.5'],
    }),
  ];
}

function checkSuggestDF({ bowtie, barriers, degradationFactors }: CoachInput): AiSuggestion[] {
  // Suggest a DF for any critical, non-instrumented barrier that has no DFs yet.
  const out: AiSuggestion[] = [];
  const onBowtie = barriers.filter((b) => b.bowtieIds.includes(bowtie.id));
  for (const b of onBowtie) {
    if (b.criticality !== 'critical') continue;
    if (b.function === 'instrumented') continue; // less likely to have human-factor DFs
    const has = degradationFactors.some((f) => f.barrierId === b.id);
    if (has) continue;
    out.push(
      suggestion({
        id: idOf(bowtie.id, 'suggest_df', `b-${b.id}`),
        bowtieId: bowtie.id,
        category: 'suggest_df',
        context: { type: 'degradation_factor', targetId: b.id },
        title: `Consider a Degradation Factor for "${truncate(b.name, 40)}"`,
        rationale: `Critical ${b.function} barriers commonly carry human or organisational degradation mechanisms (fatigue, role rotation, time pressure). This barrier has no Degradation Factor recorded.`,
        suggested: `Add a Degradation Factor describing a credible human/organisational mechanism that erodes "${b.name}", and at least one Degradation Control to defend it.`,
        confidence: 'medium',
        severity: 'info',
        citations: ['CCPS Bowtie Methodology §4.3', 'EI Human Factors Briefing'],
      }),
    );
  }
  return out;
}

function checkSuggestPS({ bowtie, barriers }: CoachInput): AiSuggestion[] {
  const onBowtie = barriers.filter((b) => b.bowtieIds.includes(bowtie.id));
  return onBowtie
    .filter((b) => b.criticality === 'critical' && !b.performanceStandardId)
    .map((b) =>
      suggestion({
        id: idOf(bowtie.id, 'suggest_ps', `b-${b.id}`),
        bowtieId: bowtie.id,
        category: 'suggest_ps',
        context: { type: 'performance_standard', targetId: b.id },
        title: `Critical barrier needs a Performance Standard: "${truncate(b.name, 40)}"`,
        rationale: 'Every critical barrier must reference a Performance Standard so its functional, response-time and reliability criteria are explicit and verifiable. This barrier has no PS linked.',
        suggested: 'Link an existing Performance Standard or author a new one (functionality / availability / reliability / survivability / response_time).',
        confidence: 'high',
        severity: 'warning',
        citations: ['CLAUDE.md §2 Methodology guardrails', 'IEC 61511 §11.2.6'],
      }),
    );
}

function checkStaleVerification({ bowtie, barriers, now: nowIn }: CoachInput): AiSuggestion[] {
  const now = nowIn ?? new Date();
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 12);
  const onBowtie = barriers.filter((b) => b.bowtieIds.includes(bowtie.id));
  return onBowtie
    .filter((b) => {
      if (b.criticality !== 'critical') return false;
      if (!b.lastVerifiedAt) return true;
      return new Date(b.lastVerifiedAt) < cutoff;
    })
    .map((b) =>
      suggestion({
        id: idOf(bowtie.id, 'stale_verification', `b-${b.id}`),
        bowtieId: bowtie.id,
        category: 'stale_verification',
        context: { type: 'barrier', targetId: b.id },
        title: `Stale verification on critical barrier "${truncate(b.name, 40)}"`,
        rationale: b.lastVerifiedAt
          ? `Last verified ${b.lastVerifiedAt}. For a critical barrier, this exceeds the 12-month freshness window.`
          : 'No verification has ever been recorded for this critical barrier.',
        suggested: 'Schedule a verification (test, inspection or drill) and record the result. Critical barriers without recent evidence cap their health at the yellow auto-floor.',
        confidence: 'high',
        severity: 'warning',
        citations: ['CCPS Bowtie Methodology §5.4', 'IEC 61511 §16'],
      }),
    );
}

function checkInsufficientDiversity({ bowtie, threats, barriers }: CoachInput): AiSuggestion[] {
  const out: AiSuggestion[] = [];
  const barriersById = new Map(barriers.map((b) => [b.id, b]));

  for (const t of threats) {
    const linked = t.preventiveBarrierIds
      .map((id) => barriersById.get(id))
      .filter((b): b is Barrier => Boolean(b));
    if (linked.length < 2) {
      out.push(
        suggestion({
          id: idOf(bowtie.id, 'insufficient_diversity', `t-${t.id}-single`),
          bowtieId: bowtie.id,
          category: 'insufficient_diversity',
          context: { type: 'threat', targetId: t.id },
          title: 'Threat protected by a single barrier',
          rationale: `Threat "${truncate(t.description, 60)}" relies on only ${linked.length} preventive barrier(s). A single failure mode can defeat the chain — defence-in-depth requires at least two independent layers.`,
          suggested: 'Add at least one more preventive barrier, ideally of a different function (e.g. add a hardware barrier alongside a procedural one).',
          confidence: 'medium',
          severity: 'warning',
          citations: ['CCPS Defence-in-Depth Principles', 'EI Bowtie Guideline §5.3'],
        }),
      );
      continue;
    }
    const fns = new Set<BarrierFunction>(linked.map((b) => b.function));
    if (fns.size === 1) {
      out.push(
        suggestion({
          id: idOf(bowtie.id, 'insufficient_diversity', `t-${t.id}-fn`),
          bowtieId: bowtie.id,
          category: 'insufficient_diversity',
          context: { type: 'threat', targetId: t.id },
          title: `All preventive barriers for one threat share the same function (${[...fns][0]})`,
          rationale: `Threat "${truncate(t.description, 60)}" is defended by ${linked.length} barriers, but they all share the function "${[...fns][0]}". Common-mode failures (training gap, procedure drift) can defeat them simultaneously.`,
          suggested: 'Add a barrier of a different function (e.g. instrumented or hardware) to break the common-mode dependency.',
          confidence: 'medium',
          severity: 'warning',
          citations: ['CCPS Bowtie Methodology §4.5'],
        }),
      );
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BuildArgs {
  id: string;
  bowtieId: string;
  category: AiSuggestionCategory;
  context: AiSuggestion['context'];
  title: string;
  rationale: string;
  suggested: string;
  confidence: AiSuggestion['output']['confidence'];
  severity: AiSuggestion['output']['severity'];
  citations: string[];
}

function suggestion(a: BuildArgs): AiSuggestion {
  return {
    id: a.id,
    promptHash: hash(`${a.id}|${a.title}|${a.suggested}`),
    modelId: MODEL_ID,
    bowtieId: a.bowtieId,
    category: a.category,
    context: a.context,
    output: {
      title: a.title,
      rationale: a.rationale,
      suggested: a.suggested,
      confidence: a.confidence,
      severity: a.severity,
      citations: a.citations,
    },
    reviewerDecision: null,
    reviewerId: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  };
}

function idOf(bowtieId: string, category: AiSuggestionCategory, suffix: string): string {
  return `ai-mock-${bowtieId}-${category}-${suffix}`;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function hash(s: string): string {
  // Tiny demo-only hash. Not cryptographic.
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return `mock-${(h >>> 0).toString(36)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
