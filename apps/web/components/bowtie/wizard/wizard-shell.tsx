'use client';

import { type ReactNode } from 'react';
import { Check, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { STEPS } from '@/lib/wizard/steps';
import { useDemoStore } from '@/lib/store';
import type { WizardDraft } from '@bowtie/shared';

interface WizardShellProps {
  /** Steps that are already valid (used to show check marks for "done"). */
  draft: WizardDraft;
  children: ReactNode;
}

export function WizardShell({ draft, children }: WizardShellProps) {
  const goToStep = useDemoStore((s) => s.patchWizardDraft);

  return (
    <div className="flex h-[calc(100vh-3.5rem-72px)] min-h-0 w-full">
      <aside className="flex w-72 shrink-0 flex-col border-r bg-card">
        <div className="border-b px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Builder Wizard</div>
          <div className="mt-0.5 truncate text-sm font-semibold">{draft.title || 'Untitled bowtie'}</div>
        </div>
        <ol className="flex-1 overflow-y-auto p-2">
          {STEPS.map((s) => {
            const isCurrent = draft.step === s.step;
            const isDone = draft.step > s.step && s.validate(draft).ok;
            return (
              <li key={s.step}>
                <button
                  type="button"
                  onClick={() => goToStep({ step: s.step })}
                  className={cn(
                    'group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    isCurrent
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-accent hover:text-foreground',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums',
                      isDone
                        ? 'border-status-green bg-status-green/15 text-status-green'
                        : isCurrent
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted text-muted-foreground',
                    )}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : s.step}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="truncate text-sm font-medium">{s.label}</span>
                    {isCurrent && <span className="block text-xs text-muted-foreground">{s.hint}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="border-t p-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-current text-status-yellow" />
            <span>Auto-saving to your browser as you type.</span>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
