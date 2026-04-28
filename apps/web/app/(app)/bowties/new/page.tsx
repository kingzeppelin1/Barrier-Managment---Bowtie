import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';

const STEPS = [
  '1 · Scope and context',
  '2 · Hazard',
  '3 · Top Event',
  '4 · Threats',
  '5 · Consequences',
  '6 · Preventive barriers',
  '7 · Mitigative / recovery barriers',
  '8 · Degradation factors',
  '9 · Degradation controls',
  '10 · Risk assessment (4-level)',
  '11 · Actions / treatment plan',
  '12 · Review, approval and publish',
];

export default function NewBowtiePage() {
  return (
    <>
      <PageHeader
        title="New Bowtie · Builder Wizard"
        description="Guided 12-step bowtie builder. Full implementation arrives in Slice 6."
        actions={<Button size="sm" disabled>Save draft</Button>}
      />
      <div className="space-y-6 p-6">
        <ol className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, idx) => (
            <li
              key={step}
              className="flex items-center gap-2 rounded-md border bg-card p-3 text-sm text-muted-foreground"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                {idx + 1}
              </span>
              <span>{step.replace(/^\d+ · /, '')}</span>
            </li>
          ))}
        </ol>
        <EmptyState
          icon={Plus}
          title="Wizard not yet wired"
          description="Each step will collect a small slice of the bowtie via react-hook-form + zod and persist into the store."
        />
      </div>
    </>
  );
}
