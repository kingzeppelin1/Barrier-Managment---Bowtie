'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Placeholder Demo Tour trigger. Slice 11 will wire this to driver.js
 * with the golden-path walkthrough. Until then it shows a friendly toast-
 * less alert so the affordance is discoverable.
 */
export function DemoTourButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.alert(
            'Demo Tour will guide you Dashboard → Bowtie Workspace → AI Coach → Action.\n\nWiring to driver.js arrives in Slice 11.',
          );
        }
      }}
    >
      <Sparkles className="h-4 w-4" />
      Demo Tour
    </Button>
  );
}
