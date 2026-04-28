import type { ReactNode } from 'react';

import { HydrationGate } from '@/components/app-shell/hydration-gate';

/**
 * Print route group — bypasses the AppShell so the page is print-clean.
 * Hydrates the demo store (the persistence layer is browser-only) so reports
 * read the same data the app would.
 */
export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <HydrationGate />
      {children}
    </div>
  );
}
