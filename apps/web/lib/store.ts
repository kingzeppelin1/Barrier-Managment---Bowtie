'use client';

import { create } from 'zustand';
import type {
  Action,
  AiSuggestion,
  Barrier,
  Bowtie,
  Consequence,
  DegradationControl,
  DegradationFactor,
  DemoState,
  Role,
  Threat,
  User,
  WizardDraft,
} from '@bowtie/shared';

import { readState, writeState, clearRaw } from './persistence';
import { buildSeedState, SCHEMA_VERSION } from './seed';

interface DemoStore extends DemoState {
  hydrated: boolean;
  hydrate: () => void;
  setRole: (role: Role) => void;
  setCurrentUserId: (userId: string) => void;
  resetDemoData: () => void;
  archiveBowtie: (id: string) => void;
  restoreBowtie: (id: string) => void;
  /** Returns the new bowtie's id, or null if the source was not found. */
  copyBowtieAsTemplate: (id: string) => string | null;
  /** Wizard draft mutators. */
  setWizardDraft: (draft: WizardDraft | null) => void;
  patchWizardDraft: (patch: Partial<WizardDraft>) => void;
  /** Materialise the current wizard draft into real entities; returns the new bowtie id. */
  submitWizardDraft: () => string | null;
  /**
   * AI Coach: merge fresh suggestions for a bowtie. Existing reviewed
   * suggestions are preserved; pending suggestions with the same id are
   * replaced (so re-runs refresh in place).
   */
  mergeAiSuggestions: (bowtieId: string, fresh: AiSuggestion[]) => void;
  /** Accept an AI suggestion: stamps reviewerDecision + writes aiOriginSuggestionId on the affected entity. */
  acceptAiSuggestion: (suggestionId: string) => void;
  /** Reject an AI suggestion with optional reason text. */
  rejectAiSuggestion: (suggestionId: string, reason?: string) => void;
  /** Defer = keep reviewerDecision null but bring the timestamp forward. */
  deferAiSuggestion: (suggestionId: string) => void;
  /** Bulk patch — keeps writes inside the persistence boundary. */
  patchState: (patch: Partial<DemoState>) => void;
}

const initial: DemoState = buildSeedState();

function loadOrSeed(): DemoState {
  const fromStorage = readState<DemoState>();
  if (fromStorage && fromStorage.schemaVersion === SCHEMA_VERSION) {
    return fromStorage;
  }
  // Either empty or stale schema — re-seed.
  return buildSeedState();
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  ...initial,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const fresh = loadOrSeed();
    set({ ...fresh, hydrated: true });
    // First write — pin seed into storage so subsequent loads are fast.
    writeState<DemoState>(fresh);
  },

  setRole: (role) => {
    const users = get().users;
    const matchingUser =
      users.find((u) => u.role === role) ?? users.find((u) => u.id === get().currentUserId);
    if (!matchingUser) return;
    const next = { ...get(), currentUserId: matchingUser.id };
    set({ currentUserId: matchingUser.id });
    persistFromState(next);
  },

  setCurrentUserId: (userId) => {
    set({ currentUserId: userId });
    persistFromState({ ...get(), currentUserId: userId });
  },

  resetDemoData: () => {
    clearRaw();
    const seeded = buildSeedState();
    set({ ...seeded, hydrated: true });
    writeState<DemoState>(seeded);
  },

  patchState: (patch) => {
    set(patch as Partial<DemoStore>);
    persistFromState({ ...get(), ...patch });
  },

  archiveBowtie: (id) => {
    const now = new Date().toISOString();
    const bowties = get().bowties.map((bt) => (bt.id === id ? { ...bt, archivedAt: now } : bt));
    set({ bowties });
    persistFromState({ ...get(), bowties });
  },

  restoreBowtie: (id) => {
    const bowties = get().bowties.map((bt) => (bt.id === id ? { ...bt, archivedAt: null } : bt));
    set({ bowties });
    persistFromState({ ...get(), bowties });
  },

  copyBowtieAsTemplate: (id) => {
    const source = get().bowties.find((bt) => bt.id === id);
    if (!source) return null;
    const newId = `bt-copy-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString().slice(0, 10);
    const copy: Bowtie = {
      ...source,
      id: newId,
      title: `${source.title} (copy)`,
      approvalState: 'draft',
      publishedAt: null,
      changesPendingMoc: false,
      archivedAt: null,
      lastRevisedAt: now,
      // Disconnect from threats/consequences/barriers — copying as a template
      // gives the user a clean slate that still keeps hazard, top event, scope.
      threatIds: [],
      consequenceIds: [],
      preventiveBarrierIds: [],
      mitigativeBarrierIds: [],
    };
    const bowties = [...get().bowties, copy];
    set({ bowties });
    persistFromState({ ...get(), bowties });
    return newId;
  },

  setWizardDraft: (draft) => {
    set({ wizardDraft: draft });
    persistFromState({ ...get(), wizardDraft: draft });
  },

  patchWizardDraft: (patch) => {
    const current = get().wizardDraft;
    if (!current) return;
    const next = { ...current, ...patch };
    set({ wizardDraft: next });
    persistFromState({ ...get(), wizardDraft: next });
  },

  submitWizardDraft: () => {
    const draft = get().wizardDraft;
    if (!draft) return null;
    const result = materialiseDraft(draft, {
      bowties: get().bowties,
      threats: get().threats,
      consequences: get().consequences,
      barriers: get().barriers,
      degradationFactors: get().degradationFactors,
      degradationControls: get().degradationControls,
      actions: get().actions,
    });
    const next: DemoState = {
      ...get(),
      bowties: result.bowties,
      threats: result.threats,
      consequences: result.consequences,
      barriers: result.barriers,
      degradationFactors: result.degradationFactors,
      degradationControls: result.degradationControls,
      actions: result.actions,
      wizardDraft: null,
    };
    set(next);
    persistFromState(next);
    return result.newBowtieId;
  },

  mergeAiSuggestions: (bowtieId, fresh) => {
    const existing = get().aiSuggestions;
    const freshById = new Map(fresh.map((s) => [s.id, s]));

    // Replace pending suggestions whose id matches a fresh one;
    // preserve every reviewed suggestion verbatim.
    const merged: AiSuggestion[] = existing.map((s) => {
      if (s.reviewerDecision !== null) return s;
      const refreshed = freshById.get(s.id);
      if (refreshed) {
        freshById.delete(s.id);
        return refreshed;
      }
      // Pending suggestion whose rule no longer fires for this bowtie -> drop it.
      if (s.bowtieId === bowtieId) return null as unknown as AiSuggestion;
      return s;
    }).filter(Boolean);

    // Append any fresh suggestions that weren't already in the store.
    for (const s of freshById.values()) merged.push(s);

    set({ aiSuggestions: merged });
    persistFromState({ ...get(), aiSuggestions: merged });
  },

  acceptAiSuggestion: (suggestionId) => {
    const reviewerId = get().currentUserId;
    const reviewedAt = new Date().toISOString();
    const target = get().aiSuggestions.find((s) => s.id === suggestionId);
    if (!target) return;

    const aiSuggestions = get().aiSuggestions.map((s) =>
      s.id === suggestionId
        ? { ...s, reviewerDecision: 'accepted' as const, reviewerId, reviewedAt, rejectionReason: null }
        : s,
    );

    // Stamp aiOriginSuggestionId on the affected entity (best-effort by context type).
    let barriers = get().barriers;
    let degradationFactors = get().degradationFactors;
    const degradationControls = get().degradationControls;
    const tid = target.context.targetId;
    if (tid) {
      switch (target.context.type) {
        case 'barrier':
        case 'degradation_factor':
        case 'performance_standard':
          barriers = barriers.map((b) =>
            b.id === tid ? { ...b, aiOriginSuggestionId: suggestionId } : b,
          );
          if (target.context.type === 'degradation_factor') {
            degradationFactors = degradationFactors.map((f) =>
              f.barrierId === tid && !f.aiOriginSuggestionId
                ? { ...f, aiOriginSuggestionId: suggestionId }
                : f,
            );
          }
          break;
        default:
          break;
      }
    }

    const next = { ...get(), aiSuggestions, barriers, degradationFactors, degradationControls };
    set({ aiSuggestions, barriers, degradationFactors, degradationControls });
    persistFromState(next);
  },

  rejectAiSuggestion: (suggestionId, reason) => {
    const reviewerId = get().currentUserId;
    const reviewedAt = new Date().toISOString();
    const aiSuggestions = get().aiSuggestions.map((s) =>
      s.id === suggestionId
        ? {
            ...s,
            reviewerDecision: 'rejected' as const,
            reviewerId,
            reviewedAt,
            rejectionReason: reason ?? null,
          }
        : s,
    );
    set({ aiSuggestions });
    persistFromState({ ...get(), aiSuggestions });
  },

  deferAiSuggestion: (suggestionId) => {
    // Defer leaves reviewerDecision null so the approval gate keeps blocking.
    // We refresh createdAt so the demo viewer sees the change "stick".
    const aiSuggestions = get().aiSuggestions.map((s) =>
      s.id === suggestionId ? { ...s, createdAt: new Date().toISOString() } : s,
    );
    set({ aiSuggestions });
    persistFromState({ ...get(), aiSuggestions });
  },
}));

// -- Wizard materialisation ------------------------------------------------

interface MaterialiseInputs {
  bowties: Bowtie[];
  threats: Threat[];
  consequences: Consequence[];
  barriers: Barrier[];
  degradationFactors: DegradationFactor[];
  degradationControls: DegradationControl[];
  actions: Action[];
}

interface MaterialiseResult extends MaterialiseInputs {
  newBowtieId: string;
}

function materialiseDraft(draft: WizardDraft, current: MaterialiseInputs): MaterialiseResult {
  const tag = Date.now().toString(36);
  const newBowtieId = `bt-w-${tag}`;
  const now = new Date().toISOString().slice(0, 10);

  // Map draft IDs to final IDs so that cross-references resolve.
  const idMap = new Map<string, string>();
  const remap = (draftId: string, prefix: string): string => {
    const existing = idMap.get(draftId);
    if (existing) return existing;
    const newId = `${prefix}-${tag}-${idMap.size}`;
    idMap.set(draftId, newId);
    return newId;
  };

  // Barriers (preventive + mitigative)
  const newPrevBarriers: Barrier[] = draft.preventiveBarriers.map((b) => ({
    id: remap(b.draftId, 'br'),
    scenarioId: draft.scenarioId,
    bowtieIds: [newBowtieId],
    name: b.name,
    type: b.type,
    function: b.function,
    criticality: b.criticality,
    ownerId: b.ownerId,
    description: '',
    performanceStandardId: b.performanceStandardId,
    healthScore: 95,
    status: 'green',
    withCompensatory: false,
    lastVerifiedAt: null,
    nextVerificationDue: null,
    failedTests: 0,
    openCriticalFindings: 0,
    evidenceUrl: null,
    aiOriginSuggestionId: null,
    gapRecord: null,
  }));

  const newMitBarriers: Barrier[] = draft.mitigativeBarriers.map((b) => ({
    id: remap(b.draftId, 'br'),
    scenarioId: draft.scenarioId,
    bowtieIds: [newBowtieId],
    name: b.name,
    type: b.type,
    function: b.function,
    criticality: b.criticality,
    ownerId: b.ownerId,
    description: '',
    performanceStandardId: b.performanceStandardId,
    healthScore: 95,
    status: 'green',
    withCompensatory: false,
    lastVerifiedAt: null,
    nextVerificationDue: null,
    failedTests: 0,
    openCriticalFindings: 0,
    evidenceUrl: null,
    aiOriginSuggestionId: null,
    gapRecord: null,
  }));

  // Threats / Consequences
  const newThreats: Threat[] = draft.threats.map((t) => ({
    id: remap(t.draftId, 'th'),
    bowtieId: newBowtieId,
    description: t.description,
    preventiveBarrierIds: t.preventiveBarrierDraftIds.map((id) => idMap.get(id) ?? id),
  }));

  const newConsequences: Consequence[] = draft.consequences.map((c) => ({
    id: remap(c.draftId, 'cq'),
    bowtieId: newBowtieId,
    description: c.description,
    severity: c.severity,
    mitigativeBarrierIds: c.mitigativeBarrierDraftIds.map((id) => idMap.get(id) ?? id),
  }));

  // DFs / DCs
  const newDFs: DegradationFactor[] = draft.degradationFactors.map((f) => ({
    id: remap(f.draftId, 'df'),
    barrierId: idMap.get(f.barrierDraftId) ?? f.barrierDraftId,
    description: f.description,
    degradationControlIds: draft.degradationControls
      .filter((c) => c.factorDraftId === f.draftId)
      .map((c) => remap(c.draftId, 'dc')),
    aiOriginSuggestionId: null,
  }));

  const newDCs: DegradationControl[] = draft.degradationControls.map((c) => ({
    id: remap(c.draftId, 'dc'),
    degradationFactorId: idMap.get(c.factorDraftId) ?? c.factorDraftId,
    name: c.name,
    function: 'organizational',
    ownerId: null,
    status: 'gray',
    aiOriginSuggestionId: null,
  }));

  // Actions
  const newActions: Action[] = draft.actions.map((a) => ({
    id: remap(a.draftId, 'ac'),
    scenarioId: draft.scenarioId,
    title: a.title,
    source: 'review',
    bowtieId: newBowtieId,
    barrierId: null,
    ownerId: a.ownerId ?? draft.ownerId,
    dueDate: a.dueDate,
    priority: a.priority,
    status: 'open',
    evidence: null,
    effectivenessReview: null,
  }));

  // Bowtie
  const newBowtie: Bowtie = {
    id: newBowtieId,
    scenarioId: draft.scenarioId,
    title: draft.title,
    hazard: draft.hazard,
    topEvent: draft.topEvent,
    assetOrProcess: draft.assetOrProcess,
    ownerId: draft.ownerId,
    approvalState: 'internal_review',
    riskBeforeBarriers: draft.riskBeforeBarriers,
    riskCurrent: draft.riskCurrent,
    riskAfterBarriers: draft.riskAfterBarriers,
    riskTarget: draft.riskTarget,
    threatIds: newThreats.map((t) => t.id),
    consequenceIds: newConsequences.map((c) => c.id),
    preventiveBarrierIds: newPrevBarriers.map((b) => b.id),
    mitigativeBarrierIds: newMitBarriers.map((b) => b.id),
    lastRevisedAt: now,
    nextReviewDue: addMonths(now, 12),
    changesPendingMoc: false,
    publishedAt: null,
    archivedAt: null,
  };

  return {
    bowties: [...current.bowties, newBowtie],
    threats: [...current.threats, ...newThreats],
    consequences: [...current.consequences, ...newConsequences],
    barriers: [...current.barriers, ...newPrevBarriers, ...newMitBarriers],
    degradationFactors: [...current.degradationFactors, ...newDFs],
    degradationControls: [...current.degradationControls, ...newDCs],
    actions: [...current.actions, ...newActions],
    newBowtieId,
  };
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function persistFromState(state: DemoState) {
  // Strip transient flags (e.g. `hydrated`) before persisting.
  const {
    schemaVersion,
    currentUserId,
    scenarios,
    users,
    bowties,
    threats,
    consequences,
    barriers,
    degradationFactors,
    degradationControls,
    risks,
    actions,
    verifications,
    performanceStandards,
    incidents,
    mocs,
    audits,
    templates,
    aiSuggestions,
    wizardDraft,
  } = state;
  writeState<DemoState>({
    schemaVersion,
    currentUserId,
    scenarios,
    users,
    bowties,
    threats,
    consequences,
    barriers,
    degradationFactors,
    degradationControls,
    risks,
    actions,
    verifications,
    performanceStandards,
    incidents,
    mocs,
    audits,
    templates,
    aiSuggestions,
    wizardDraft,
  });
}

// -- Selectors --------------------------------------------------------------

export const selectCurrentUser = (s: DemoStore): User | undefined =>
  s.users.find((u) => u.id === s.currentUserId);

export const selectCurrentRole = (s: DemoStore): Role => selectCurrentUser(s)?.role ?? 'risk_manager';
