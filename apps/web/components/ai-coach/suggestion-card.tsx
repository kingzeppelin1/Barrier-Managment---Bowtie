'use client';

import { useState } from 'react';
import { Check, Clock3, Sparkles, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatDate } from '@/lib/utils';
import type { AiSuggestion } from '@bowtie/shared';

interface SuggestionCardProps {
  suggestion: AiSuggestion;
  readOnly?: boolean;
  onAccept: () => void;
  onReject: (reason: string) => void;
  onDefer: () => void;
}

export function SuggestionCard({ suggestion, readOnly, onAccept, onReject, onDefer }: SuggestionCardProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');
  const decided = suggestion.reviewerDecision !== null;

  const severityVariant =
    suggestion.output.severity === 'blocker'
      ? 'red'
      : suggestion.output.severity === 'warning'
        ? 'yellow'
        : 'blue';

  return (
    <div
      className={cn(
        'rounded-md border bg-card p-3 text-sm shadow-sm',
        decided && 'opacity-70',
        suggestion.reviewerDecision === 'accepted' && 'border-status-green/40',
        suggestion.reviewerDecision === 'rejected' && 'border-status-gray/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-status-blue" />
          <span className="text-sm font-semibold leading-tight">{suggestion.output.title}</span>
        </div>
        <Badge variant={severityVariant} className="capitalize">
          {suggestion.output.severity}
        </Badge>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{suggestion.output.rationale}</p>

      <div className="mt-2 rounded-md border bg-muted/40 p-2 text-xs">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Suggested</div>
        <div className="mt-0.5">{suggestion.output.suggested}</div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        <Badge variant="outline" className="capitalize text-[10px]">
          {suggestion.output.confidence} confidence
        </Badge>
        {suggestion.category && (
          <Badge variant="outline" className="capitalize text-[10px]">
            {suggestion.category.replace(/_/g, ' ')}
          </Badge>
        )}
        {suggestion.output.citations.length > 0 && (
          <span className="flex flex-wrap items-center gap-1">
            {suggestion.output.citations.map((c, i) => (
              <a
                key={i}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-primary hover:underline"
                title="Demo citation — disabled link"
              >
                {c}
              </a>
            ))}
          </span>
        )}
      </div>

      {decided && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          {suggestion.reviewerDecision === 'accepted' ? (
            <span className="inline-flex items-center gap-1 text-status-green">
              <Check className="h-3 w-3" /> Accepted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <X className="h-3 w-3" /> Rejected
            </span>
          )}
          {suggestion.reviewedAt && <span className="ml-2">on {formatDate(suggestion.reviewedAt)}</span>}
          {suggestion.rejectionReason && (
            <div className="mt-0.5 italic text-muted-foreground">“{suggestion.rejectionReason}”</div>
          )}
        </div>
      )}

      {!decided && !readOnly && (
        <div className="mt-3 space-y-2">
          {rejectMode ? (
            <>
              <Textarea
                rows={2}
                placeholder="Why is this suggestion not appropriate? (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setRejectMode(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onReject(reason.trim());
                    setRejectMode(false);
                    setReason('');
                  }}
                >
                  Confirm reject
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={onDefer} className="gap-1 text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" /> Defer
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRejectMode(true)} className="gap-1">
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button size="sm" onClick={onAccept} className="gap-1">
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
            </div>
          )}
        </div>
      )}
      {!decided && readOnly && (
        <div className="mt-2 text-[11px] italic text-muted-foreground">
          Auditor view — accept / reject is disabled. Approval gate would block until a Risk Manager
          or Approver reviews this suggestion.
        </div>
      )}
    </div>
  );
}
