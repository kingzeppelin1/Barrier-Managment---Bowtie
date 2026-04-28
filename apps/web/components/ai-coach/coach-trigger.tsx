'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDemoStore } from '@/lib/store';

/**
 * Topbar AI Coach trigger. Only renders on /bowties/[id] pages, where it
 * shows the count of pending suggestions for the active bowtie. Click
 * dispatches a custom event the workspace listens for; the workspace owns
 * the panel state so the canvas can drive node-scoped filters.
 */
export function CoachTrigger() {
  const pathname = usePathname();
  const allSuggestions = useDemoStore((s) => s.aiSuggestions);
  const barriers = useDemoStore((s) => s.barriers);
  const threats = useDemoStore((s) => s.threats);
  const consequences = useDemoStore((s) => s.consequences);

  const bowtieId = useMemo(() => extractBowtieId(pathname), [pathname]);
  const pendingCount = useMemo(() => {
    if (!bowtieId) return 0;
    const bowtieBarrierIds = new Set(
      barriers.filter((b) => b.bowtieIds.includes(bowtieId)).map((b) => b.id),
    );
    const bowtieThreatIds = new Set(threats.filter((t) => t.bowtieId === bowtieId).map((t) => t.id));
    const bowtieConsIds = new Set(consequences.filter((c) => c.bowtieId === bowtieId).map((c) => c.id));
    return allSuggestions.filter((s) => {
      if (s.reviewerDecision !== null) return false;
      if (s.bowtieId === bowtieId) return true;
      const t = s.context.targetId;
      return (
        t === bowtieId ||
        (t !== null && (bowtieBarrierIds.has(t) || bowtieThreatIds.has(t) || bowtieConsIds.has(t)))
      );
    }).length;
  }, [allSuggestions, bowtieId, barriers, threats, consequences]);

  if (!bowtieId) return null;

  return (
    <Button
      data-tour="coach-badge"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bowtie-coach-toggle'));
        }
      }}
    >
      <Sparkles className="h-4 w-4 text-status-blue" />
      Coach
      {pendingCount > 0 && (
        <Badge variant="yellow" className="-mr-1 px-1.5 py-0 text-[10px]">
          {pendingCount}
        </Badge>
      )}
    </Button>
  );
}

function extractBowtieId(pathname: string | null): string | null {
  if (!pathname) return null;
  const m = pathname.match(/^\/bowties\/([^/]+)(?:\/|$)/);
  if (!m) return null;
  if (m[1] === 'new') return null;
  return m[1] ?? null;
}
