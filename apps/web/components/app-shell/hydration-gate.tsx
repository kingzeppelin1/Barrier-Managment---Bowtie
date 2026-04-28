'use client';

import { useEffect } from 'react';
import { useDemoStore } from '@/lib/store';

/**
 * Triggers a one-time client-side hydration of the demo store from
 * localStorage (or seed). Renders nothing.
 */
export function HydrationGate() {
  const hydrate = useDemoStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}
