'use client';

import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { STEPS } from '@/lib/wizard/steps';
import type { WizardDraft } from '@bowtie/shared';
import { cn } from '@/lib/utils';

interface WizardBodyProps {
  draft: WizardDraft;
  children: ReactNode;
}

export function WizardBody({ draft, children }: WizardBodyProps) {
  const stepConfig = STEPS[draft.step - 1]!;
  const validation = stepConfig.validate(draft);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Step {draft.step} of {STEPS.length}
          </span>
        </div>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{stepConfig.label}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{stepConfig.hint}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {children}
          {!validation.ok && validation.errors.length > 0 && (
            <ValidationCard errors={validation.errors} />
          )}
        </div>
      </div>
    </div>
  );
}

function ValidationCard({ errors }: { errors: string[] }) {
  return (
    <div className={cn('rounded-md border border-status-yellow/30 bg-status-yellow/5 p-3 text-sm')}>
      <div className="flex items-center gap-1.5 font-semibold text-status-yellow">
        <AlertTriangle className="h-4 w-4" />
        <span>To proceed, resolve:</span>
      </div>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-foreground/80">
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
