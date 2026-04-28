'use client';

import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDemoStore } from '@/lib/store';
import { STEPS, TOTAL_STEPS } from '@/lib/wizard/steps';
import type { WizardDraft } from '@bowtie/shared';

interface WizardFooterProps {
  draft: WizardDraft;
  onSubmit?: () => void;
  submitting?: boolean;
}

export function WizardFooter({ draft, onSubmit, submitting }: WizardFooterProps) {
  const patchDraft = useDemoStore((s) => s.patchWizardDraft);
  const setDraft = useDemoStore((s) => s.setWizardDraft);

  const stepConfig = STEPS[draft.step - 1]!;
  const validation = stepConfig.validate(draft);
  const isLast = draft.step === TOTAL_STEPS;

  return (
    <div className="flex items-center justify-between gap-3 border-t bg-card px-6 py-3">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={draft.step <= 1}
          onClick={() => patchDraft({ step: Math.max(1, draft.step - 1) })}
          className="gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Forces a no-op patch to trigger persist so users see the "saved" cue if we add one.
            patchDraft({});
          }}
          className="gap-1 text-muted-foreground"
        >
          <Save className="h-3.5 w-3.5" /> Save draft
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (typeof window !== 'undefined' && window.confirm('Discard this draft? This cannot be undone.')) {
              setDraft(null);
            }
          }}
          className="text-muted-foreground"
        >
          Discard
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {!validation.ok && (
          <Badge variant="yellow" className="text-[10px] uppercase">
            {validation.errors.length} issue{validation.errors.length === 1 ? '' : 's'}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">
          Step {draft.step} of {TOTAL_STEPS}
        </span>
        {isLast ? (
          <Button size="sm" disabled={!validation.ok || submitting} onClick={onSubmit} className="gap-1">
            <Send className="h-3.5 w-3.5" /> Submit for review
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!validation.ok}
            onClick={() => patchDraft({ step: Math.min(TOTAL_STEPS, draft.step + 1) })}
            className="gap-1"
          >
            Next <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
