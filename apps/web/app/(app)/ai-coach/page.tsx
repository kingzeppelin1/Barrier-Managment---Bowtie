'use client';

import Link from 'next/link';
import { Sparkles, ArrowUpRight, CheckCircle2, X, AlertTriangle } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDemoStore } from '@/lib/store';
import { cn, formatDate } from '@/lib/utils';
import type { AiSuggestion } from '@bowtie/shared';

/**
 * Cross-bowtie AI Coach inbox. Shows every AI suggestion in store,
 * grouped pending → reviewed. Pending suggestions are what block the
 * approval gate; reviewed suggestions stay in history with the named
 * reviewer.
 */
export default function AiCoachInboxPage() {
  const allSuggestions = useDemoStore((s) => s.aiSuggestions);
  const bowties = useDemoStore((s) => s.bowties);
  const barriers = useDemoStore((s) => s.barriers);
  const threats = useDemoStore((s) => s.threats);
  const consequences = useDemoStore((s) => s.consequences);
  const users = useDemoStore((s) => s.users);

  // Resolve which bowtie a suggestion belongs to (legacy seed entries
  // don't have bowtieId set; infer from context.targetId).
  function bowtieFor(s: AiSuggestion): string | null {
    if (s.bowtieId) return s.bowtieId;
    const t = s.context.targetId;
    if (!t) return null;
    const onBowtie = bowties.find((bt) => bt.id === t);
    if (onBowtie) return onBowtie.id;
    const barrier = barriers.find((b) => b.id === t);
    if (barrier) return barrier.bowtieIds[0] ?? null;
    const threat = threats.find((th) => th.id === t);
    if (threat) return threat.bowtieId;
    const cq = consequences.find((c) => c.id === t);
    if (cq) return cq.bowtieId;
    return null;
  }

  const pending = allSuggestions.filter((s) => s.reviewerDecision === null);
  const reviewed = allSuggestions.filter((s) => s.reviewerDecision !== null);

  return (
    <>
      <PageHeader
        title="AI Coach Inbox"
        description={`${pending.length} pending across all bowties · ${reviewed.length} reviewed`}
      />
      <div className="space-y-6 p-6">
        {pending.length === 0 && reviewed.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No suggestions yet"
            description="Open a bowtie to trigger the Coach. Suggestions you defer here block the approval gate."
          />
        ) : null}

        {pending.length > 0 && (
          <Section
            title="Pending review"
            count={pending.length}
            tone="yellow"
            description="Each pending suggestion blocks the approval gate on its bowtie until a Risk Manager or Approver reviews it."
          >
            <ul className="space-y-2">
              {pending.map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  bowtieId={bowtieFor(s)}
                  bowties={bowties}
                  reviewer={undefined}
                />
              ))}
            </ul>
          </Section>
        )}

        {reviewed.length > 0 && (
          <Section
            title="Reviewed"
            count={reviewed.length}
            tone="muted"
            description="History — each accepted suggestion stamps an aiOriginSuggestionId on the affected entity."
          >
            <ul className="space-y-2">
              {reviewed.map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  bowtieId={bowtieFor(s)}
                  bowties={bowties}
                  reviewer={users.find((u) => u.id === s.reviewerId)?.name}
                />
              ))}
            </ul>
          </Section>
        )}
      </div>
    </>
  );
}

function Section({
  title,
  count,
  tone,
  description,
  children,
}: {
  title: string;
  count: number;
  tone: 'yellow' | 'muted';
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b px-4 py-3',
            tone === 'yellow' && 'bg-status-yellow/5',
          )}
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>{title}</span>
              <Badge variant={tone === 'yellow' ? 'yellow' : 'outline'}>{count}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="p-3">{children}</div>
      </CardContent>
    </Card>
  );
}

function SuggestionRow({
  suggestion,
  bowtieId,
  bowties,
  reviewer,
}: {
  suggestion: AiSuggestion;
  bowtieId: string | null;
  bowties: ReturnType<typeof useDemoStore.getState>['bowties'];
  reviewer: string | undefined;
}) {
  const bowtie = bowties.find((b) => b.id === bowtieId);
  const decided = suggestion.reviewerDecision !== null;
  const sevVariant =
    suggestion.output.severity === 'blocker'
      ? 'red'
      : suggestion.output.severity === 'warning'
        ? 'yellow'
        : 'blue';

  return (
    <li>
      <Link
        href={bowtieId ? `/bowties/${bowtieId}` : '#'}
        aria-disabled={!bowtieId}
        className={cn(
          'group flex items-start gap-3 rounded-md border p-3 transition-colors',
          decided ? 'opacity-70' : '',
          suggestion.reviewerDecision === 'accepted' && 'border-status-green/40',
          suggestion.reviewerDecision === 'rejected' && 'border-status-gray/40',
          !decided && 'hover:border-primary/50',
        )}
      >
        <div className="mt-0.5 shrink-0">
          {suggestion.reviewerDecision === 'accepted' ? (
            <CheckCircle2 className="h-4 w-4 text-status-green" />
          ) : suggestion.reviewerDecision === 'rejected' ? (
            <X className="h-4 w-4 text-muted-foreground" />
          ) : (
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                suggestion.output.severity === 'blocker'
                  ? 'text-status-red'
                  : 'text-status-yellow',
              )}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium">{suggestion.output.title}</span>
            <Badge variant={sevVariant} className="capitalize text-[10px]">
              {suggestion.output.severity}
            </Badge>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {suggestion.output.rationale}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {bowtie && (
              <span className="inline-flex items-center gap-1">
                <span className="font-medium text-foreground">{bowtie.title}</span>
                <span className="font-mono text-[10px]">{bowtie.id}</span>
              </span>
            )}
            {suggestion.category && (
              <Badge variant="outline" className="capitalize text-[10px]">
                {suggestion.category.replace(/_/g, ' ')}
              </Badge>
            )}
            {decided && reviewer && (
              <span>
                {suggestion.reviewerDecision === 'accepted' ? 'accepted' : 'rejected'} by {reviewer}
                {suggestion.reviewedAt ? ` on ${formatDate(suggestion.reviewedAt)}` : ''}
              </span>
            )}
          </div>
        </div>

        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </Link>
    </li>
  );
}
