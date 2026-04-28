import { z } from 'zod';
import {
  WizardSeveritySchema,
  type WizardDraft,
} from '@bowtie/shared';

/**
 * Step configuration for the 12-step Bowtie Builder Wizard.
 *
 * Each step has a label, optional short description, and a `validate` fn
 * that takes the current draft and returns either { ok: true } or
 * { ok: false; errors: string[] }. The wizard blocks "Next" until valid.
 */

export const TOTAL_STEPS = 12;

export interface StepValidation {
  ok: boolean;
  errors: string[];
}

export interface StepConfig {
  step: number;
  label: string;
  hint: string;
  validate: (d: WizardDraft) => StepValidation;
}

const ok: StepValidation = { ok: true, errors: [] };

function nonEmpty(v: string): boolean {
  return v.trim().length > 0;
}

export const STEPS: StepConfig[] = [
  {
    step: 1,
    label: 'Scope and context',
    hint: 'Pick the scenario and asset, name the bowtie.',
    validate: (d) => {
      const errors: string[] = [];
      if (!nonEmpty(d.title)) errors.push('Title is required.');
      if (!nonEmpty(d.assetOrProcess)) errors.push('Asset / process is required.');
      if (!nonEmpty(d.scenarioId)) errors.push('Scenario is required.');
      if (!nonEmpty(d.ownerId)) errors.push('Owner is required.');
      return errors.length === 0 ? ok : { ok: false, errors };
    },
  },
  {
    step: 2,
    label: 'Hazard',
    hint: 'The energy or substance with potential to cause harm.',
    validate: (d) =>
      nonEmpty(d.hazard) ? ok : { ok: false, errors: ['Hazard description is required.'] },
  },
  {
    step: 3,
    label: 'Top Event',
    hint: 'The unwanted release / loss-of-control event at the centre of the bowtie.',
    validate: (d) =>
      nonEmpty(d.topEvent) ? ok : { ok: false, errors: ['Top Event description is required.'] },
  },
  {
    step: 4,
    label: 'Threats',
    hint: 'Credible mechanisms that could realise the Top Event.',
    validate: (d) => {
      const errors: string[] = [];
      if (d.threats.length === 0) errors.push('At least one threat is required.');
      d.threats.forEach((t, i) => {
        if (!nonEmpty(t.description)) errors.push(`Threat ${i + 1} needs a description.`);
      });
      return errors.length === 0 ? ok : { ok: false, errors };
    },
  },
  {
    step: 5,
    label: 'Consequences',
    hint: 'Outcomes if the Top Event occurs and mitigative barriers fail.',
    validate: (d) => {
      const errors: string[] = [];
      if (d.consequences.length === 0) errors.push('At least one consequence is required.');
      d.consequences.forEach((c, i) => {
        if (!nonEmpty(c.description)) errors.push(`Consequence ${i + 1} needs a description.`);
        if (!WizardSeveritySchema.safeParse(c.severity).success)
          errors.push(`Consequence ${i + 1} needs a severity.`);
      });
      return errors.length === 0 ? ok : { ok: false, errors };
    },
  },
  {
    step: 6,
    label: 'Preventive barriers',
    hint: 'Barriers that prevent threats from realising the Top Event.',
    validate: (d) => {
      const errors: string[] = [];
      if (d.preventiveBarriers.length === 0) errors.push('At least one preventive barrier is required.');

      d.preventiveBarriers.forEach((b, i) => {
        if (!nonEmpty(b.name)) errors.push(`Preventive barrier ${i + 1} needs a name.`);
        // Methodology rule (CLAUDE.md §2): critical barrier must reference a performance standard.
        if (b.criticality === 'critical' && !b.performanceStandardId)
          errors.push(`Critical preventive barrier "${b.name || `#${i + 1}`}" needs a performance standard.`);
      });

      // Methodology rule (CLAUDE.md §2): every threat must have at least one preventive barrier.
      d.threats.forEach((t, i) => {
        if (t.preventiveBarrierDraftIds.length === 0)
          errors.push(`Threat ${i + 1} has no preventive barrier linked.`);
      });

      return errors.length === 0 ? ok : { ok: false, errors };
    },
  },
  {
    step: 7,
    label: 'Mitigative / recovery barriers',
    hint: 'Barriers that limit consequences if the Top Event occurs.',
    validate: (d) => {
      const errors: string[] = [];
      if (d.mitigativeBarriers.length === 0)
        errors.push('At least one mitigative or recovery barrier is required.');

      d.mitigativeBarriers.forEach((b, i) => {
        if (!nonEmpty(b.name)) errors.push(`Mitigative barrier ${i + 1} needs a name.`);
        if (b.criticality === 'critical' && !b.performanceStandardId)
          errors.push(`Critical mitigative barrier "${b.name || `#${i + 1}`}" needs a performance standard.`);
      });

      // Each consequence should be defended by at least one mitigative barrier (not strictly required by
      // CLAUDE.md §2 but it's strong practice; keep as a warning-level check by leaving it out of errors).
      return errors.length === 0 ? ok : { ok: false, errors };
    },
  },
  {
    step: 8,
    label: 'Degradation factors',
    hint: 'Mechanisms that erode a barrier’s effectiveness over time.',
    validate: () => ok, // DFs are optional; the rule is enforced on step 9 after DCs are added.
  },
  {
    step: 9,
    label: 'Degradation controls',
    hint: 'Controls that defend each Degradation Factor pathway.',
    validate: (d) => {
      const errors: string[] = [];
      // Methodology invariant: every Degradation Factor needs at least one DC.
      d.degradationFactors.forEach((f, i) => {
        const linked = d.degradationControls.filter((c) => c.factorDraftId === f.draftId);
        if (linked.length === 0) {
          errors.push(`Degradation Factor ${i + 1} ("${truncate(f.description, 40)}") has no Degradation Control linked.`);
        }
      });
      return errors.length === 0 ? ok : { ok: false, errors };
    },
  },
  {
    step: 10,
    label: 'Risk assessment',
    hint: 'Four-level risk: Inherent → Current → Residual → Target.',
    validate: (d) => {
      const errors: string[] = [];
      const all = [d.riskBeforeBarriers, d.riskCurrent, d.riskAfterBarriers, d.riskTarget];
      if (all.some((r) => !Number.isFinite(r) || r < 0))
        errors.push('All four risk levels must be non-negative numbers.');
      // Sanity check: residual ≤ current ≤ inherent. Target ≤ residual is desirable but not always.
      if (d.riskCurrent > d.riskBeforeBarriers)
        errors.push('Current risk cannot exceed inherent risk.');
      if (d.riskAfterBarriers > d.riskCurrent)
        errors.push('Residual risk cannot exceed current risk.');
      return errors.length === 0 ? ok : { ok: false, errors };
    },
  },
  {
    step: 11,
    label: 'Actions / treatment plan',
    hint: 'Actions that move residual risk towards target.',
    validate: () => ok, // Actions are optional in the wizard; a bowtie can ship with none.
  },
  {
    step: 12,
    label: 'Review, approval & publish',
    hint: 'Final summary; submit advances the bowtie to Internal Review.',
    validate: (d) => {
      const errors: string[] = [];
      // Re-run all earlier checks to make sure nothing slipped (covers cases where the user
      // changed an earlier step then jumped to review).
      for (let i = 1; i <= 11; i += 1) {
        const r = STEPS[i - 1]!.validate(d);
        if (!r.ok) errors.push(...r.errors);
      }
      return errors.length === 0 ? ok : { ok: false, errors };
    },
  },
];

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

// --- Default draft factory ----------------------------------------------

export function defaultDraft(scenarioId: string, ownerId: string): WizardDraft {
  return {
    step: 1,
    scenarioId,
    ownerId,
    title: '',
    hazard: '',
    topEvent: '',
    assetOrProcess: '',
    threats: [],
    consequences: [],
    preventiveBarriers: [],
    mitigativeBarriers: [],
    degradationFactors: [],
    degradationControls: [],
    riskBeforeBarriers: 0,
    riskCurrent: 0,
    riskAfterBarriers: 0,
    riskTarget: 0,
    actions: [],
    startedAt: new Date().toISOString(),
  };
}

// --- ID helper -----------------------------------------------------------

let _counter = 0;
export function newDraftId(prefix: string): string {
  _counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${_counter.toString(36)}`;
}
