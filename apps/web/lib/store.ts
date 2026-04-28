'use client';

import { create } from 'zustand';
import type { Bowtie, DemoState, Role, User } from '@bowtie/shared';

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
}));

function persistFromState(state: DemoState) {
  // Strip transient flags before persisting.
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
  });
}

// -- Selectors --------------------------------------------------------------

export const selectCurrentUser = (s: DemoStore): User | undefined =>
  s.users.find((u) => u.id === s.currentUserId);

export const selectCurrentRole = (s: DemoStore): Role => selectCurrentUser(s)?.role ?? 'risk_manager';
