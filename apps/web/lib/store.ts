'use client';

import { create } from 'zustand';
import type { DemoState, Role, User } from '@bowtie/shared';

import { readState, writeState, clearRaw } from './persistence';
import { buildSeedState, SCHEMA_VERSION } from './seed';

interface DemoStore extends DemoState {
  hydrated: boolean;
  hydrate: () => void;
  setRole: (role: Role) => void;
  setCurrentUserId: (userId: string) => void;
  resetDemoData: () => void;
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
