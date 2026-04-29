'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { useTour } from '@/lib/tour/use-tour';

/**
 * Demo Tour trigger. Wired to driver.js via lib/tour. Always visible in
 * the topbar; Settings has a "Restart Tour" button that dispatches the
 * same custom event.
 */
export function DemoTourButton() {
  const t = useTranslations('topbar');
  const { start } = useTour();
  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={start}>
      <Sparkles className="h-4 w-4" />
      {t('demoTour')}
    </Button>
  );
}
