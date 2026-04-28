'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCcw, Sparkles, X } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { selectCurrentRole, useDemoStore } from '@/lib/store';
import { isReadOnly } from '@/lib/rbac';
import { getAIProvider } from '@/lib/ai';
import type { Bowtie } from '@bowtie/shared';

import { SuggestionCard } from './suggestion-card';

interface CoachPanelProps {
  bowtie: Bowtie;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, suggestions are filtered to ones touching this entity id. */
  filterTargetId?: string | null;
  /** Provided so the workspace can clear the filter without losing the panel. */
  onClearFilter?: () => void;
}

export function CoachPanel({ bowtie, open, onOpenChange, filterTargetId, onClearFilter }: CoachPanelProps) {
  const role = useDemoStore(selectCurrentRole);
  const readOnly = isReadOnly(role);

  const allSuggestions = useDemoStore((s) => s.aiSuggestions);
  const merge = useDemoStore((s) => s.mergeAiSuggestions);
  const accept = useDemoStore((s) => s.acceptAiSuggestion);
  const reject = useDemoStore((s) => s.rejectAiSuggestion);
  const defer = useDemoStore((s) => s.deferAiSuggestion);

  const ctx = useDemoStore((s) => ({
    threats: s.threats.filter((t) => t.bowtieId === bowtie.id),
    consequences: s.consequences.filter((c) => c.bowtieId === bowtie.id),
    barriers: s.barriers.filter((b) => b.bowtieIds.includes(bowtie.id)),
    degradationFactors: s.degradationFactors,
    degradationControls: s.degradationControls,
    performanceStandards: s.performanceStandards,
    verifications: s.verifications,
    risks: s.risks,
  }));

  const [running, setRunning] = useState(false);
  const lastRunForBowtie = useRef<string | null>(null);

  const run = async () => {
    setRunning(true);
    try {
      const provider = getAIProvider();
      const out = await provider.evaluate({
        bowtie,
        threats: ctx.threats,
        consequences: ctx.consequences,
        barriers: ctx.barriers,
        degradationFactors: ctx.degradationFactors.filter((f) =>
          ctx.barriers.some((b) => b.id === f.barrierId),
        ),
        degradationControls: ctx.degradationControls.filter((c) =>
          ctx.degradationFactors.some(
            (f) => f.id === c.degradationFactorId && ctx.barriers.some((b) => b.id === f.barrierId),
          ),
        ),
        performanceStandards: ctx.performanceStandards,
        verifications: ctx.verifications,
        risks: ctx.risks,
      });
      merge(bowtie.id, out);
    } finally {
      setRunning(false);
    }
  };

  // Auto-evaluate the first time we encounter this bowtie in this session.
  useEffect(() => {
    if (lastRunForBowtie.current === bowtie.id) return;
    lastRunForBowtie.current = bowtie.id;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bowtie.id]);

  const forBowtie = useMemo(
    () => allSuggestions.filter((s) => s.bowtieId === bowtie.id || isLegacyForBowtie(s, bowtie, ctx)),
    [allSuggestions, bowtie, ctx],
  );

  const filtered = useMemo(() => {
    if (!filterTargetId) return forBowtie;
    return forBowtie.filter((s) => s.context.targetId === filterTargetId);
  }, [forBowtie, filterTargetId]);

  const pending = filtered.filter((s) => s.reviewerDecision === null);
  const reviewed = filtered.filter((s) => s.reviewerDecision !== null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[28rem] flex-col p-0 sm:max-w-[28rem]">
        <SheetHeader className="border-b">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-status-blue" /> Barrier Coach
            </span>
            {readOnly && (
              <Badge variant="outline" className="text-[10px] uppercase">
                Read-only
              </Badge>
            )}
          </div>
          <SheetTitle className="text-base leading-snug">Methodology check</SheetTitle>
          <SheetDescription>
            Advisory only. Each accepted suggestion is logged with a named reviewer; deferred or
            unreviewed suggestions block the approval gate.
          </SheetDescription>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {pending.length > 0 && (
                <Badge variant="yellow">{pending.length} pending</Badge>
              )}
              {reviewed.length > 0 && (
                <Badge variant="outline">{reviewed.length} reviewed</Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={run}
              disabled={running}
              className="gap-1"
            >
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="h-3.5 w-3.5" />
              )}
              Re-run
            </Button>
          </div>

          {filterTargetId && (
            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
              <Badge variant="outline">Filter: this node</Badge>
              {onClearFilter && (
                <button
                  type="button"
                  onClick={onClearFilter}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Show all
                </button>
              )}
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-3 p-4">
            {running && filtered.length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating…
              </div>
            )}

            {!running && filtered.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                <Sparkles className="mx-auto mb-1 h-4 w-4 text-status-green" />
                <div className="font-medium text-foreground">No issues detected by AI Coach.</div>
                <div className="mt-1 text-xs">Re-run after edits to re-evaluate.</div>
              </div>
            )}

            {pending.length > 0 && (
              <Section label={`Pending review (${pending.length})`}>
                {pending.map((s) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    readOnly={readOnly}
                    onAccept={() => accept(s.id)}
                    onReject={(reason) => reject(s.id, reason)}
                    onDefer={() => defer(s.id)}
                  />
                ))}
              </Section>
            )}

            {reviewed.length > 0 && (
              <Section label={`Reviewed (${reviewed.length})`}>
                {reviewed.map((s) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    readOnly={readOnly}
                    onAccept={() => accept(s.id)}
                    onReject={(reason) => reject(s.id, reason)}
                    onDefer={() => defer(s.id)}
                  />
                ))}
              </Section>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

/**
 * Legacy seed AI suggestions don't have a top-level `bowtieId` field. Match
 * them to a bowtie via the targetId — if the target is one of this bowtie's
 * barriers/threats/consequences, we count it as belonging here.
 */
function isLegacyForBowtie(
  s: { bowtieId?: string | null; context: { targetId: string | null } },
  bowtie: Bowtie,
  ctx: {
    threats: { id: string }[];
    consequences: { id: string }[];
    barriers: { id: string }[];
  },
): boolean {
  if (s.bowtieId) return false;
  const t = s.context.targetId;
  if (!t) return false;
  if (t === bowtie.id) return true;
  if (ctx.barriers.some((b) => b.id === t)) return true;
  if (ctx.threats.some((th) => th.id === t)) return true;
  if (ctx.consequences.some((c) => c.id === t)) return true;
  return false;
}
