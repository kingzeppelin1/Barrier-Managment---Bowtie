/**
 * Thin localStorage wrapper for the demo. Survives reloads, falls back to
 * an in-memory Map on the server / when storage is unavailable.
 *
 * No real backend. Marked DEMO-ONLY per CLAUDE.md §2 (the production app
 * uses Postgres + Prisma + RLS, not localStorage).
 */

const STORAGE_KEY = 'bowtie-demo-state-v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

const memoryFallback = new Map<string, string>();

export function readRaw(): string | null {
  if (isBrowser()) {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // fall through
    }
  }
  return memoryFallback.get(STORAGE_KEY) ?? null;
}

export function writeRaw(value: string): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
      return;
    } catch {
      // fall through to memory
    }
  }
  memoryFallback.set(STORAGE_KEY, value);
}

export function clearRaw(): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  memoryFallback.delete(STORAGE_KEY);
}

export function readState<T>(): T | null {
  const raw = readRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeState<T>(state: T): void {
  writeRaw(JSON.stringify(state));
}
