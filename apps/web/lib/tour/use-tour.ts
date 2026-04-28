'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { TourController, type TourEnv } from './controller';
import { buildTourSteps } from './steps';

/**
 * Tour hook. Returns a stable `start()` callback. Anyone in the tree can
 * also call `dispatchTourStart()` (custom event) to start the tour.
 */
export function useTour(): { start: () => void } {
  const router = useRouter();
  const controllerRef = useRef<TourController | null>(null);

  const start = useCallback(() => {
    // Tear down any existing run.
    controllerRef.current?.destroy();

    const env: TourEnv = {
      push: (href) => router.push(href as Parameters<typeof router.push>[0]),
      pathname: () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
    };
    const steps = buildTourSteps(env);
    const c = new TourController(steps, env);
    controllerRef.current = c;
    void c.start();
  }, [router]);

  // Listen for global "start tour" events so Settings can trigger us.
  useEffect(() => {
    function handler() {
      start();
    }
    window.addEventListener('bowtie-tour-start', handler);
    return () => window.removeEventListener('bowtie-tour-start', handler);
  }, [start]);

  // Tear down on unmount so we don't leak overlays across route changes.
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
    };
  }, []);

  return { start };
}

export function dispatchTourStart(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bowtie-tour-start'));
  }
}
