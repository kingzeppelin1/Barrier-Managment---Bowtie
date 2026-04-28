'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDemoStore } from '@/lib/store';
import type { WizardDraft } from '@bowtie/shared';

interface StepProps {
  draft: WizardDraft;
}

// Step 1 — Scope and context ---------------------------------------------
export function Step1Scope({ draft }: StepProps) {
  const scenarios = useDemoStore((s) => s.scenarios);
  const users = useDemoStore((s) => s.users);
  const patch = useDemoStore((s) => s.patchWizardDraft);

  return (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g. Hydrocarbon Release on Topsides"
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="asset">Asset / process</Label>
        <Input
          id="asset"
          placeholder="e.g. Topsides modules M20–M40"
          value={draft.assetOrProcess}
          onChange={(e) => patch({ assetOrProcess: e.target.value })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Scenario</Label>
          <Select value={draft.scenarioId} onValueChange={(v) => patch({ scenarioId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a scenario" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Owner</Label>
          <Select value={draft.ownerId} onValueChange={(v) => patch({ ownerId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Assign an owner" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Step 2 — Hazard --------------------------------------------------------
export function Step2Hazard({ draft }: StepProps) {
  const patch = useDemoStore((s) => s.patchWizardDraft);
  return (
    <div className="space-y-1.5">
      <Label htmlFor="hazard">Hazard</Label>
      <Textarea
        id="hazard"
        rows={4}
        placeholder="The energy or substance with the potential to cause harm. e.g. Hydrocarbon under pressure (process equipment, modules M20–M40)."
        value={draft.hazard}
        onChange={(e) => patch({ hazard: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        A bowtie is built around exactly one hazard. State it precisely — this anchors every barrier
        downstream.
      </p>
    </div>
  );
}

// Step 3 — Top Event -----------------------------------------------------
export function Step3TopEvent({ draft }: StepProps) {
  const patch = useDemoStore((s) => s.patchWizardDraft);
  return (
    <div className="space-y-1.5">
      <Label htmlFor="top-event">Top Event</Label>
      <Textarea
        id="top-event"
        rows={4}
        placeholder="The unwanted release of control over the hazard. e.g. Loss of containment of hydrocarbon from process equipment."
        value={draft.topEvent}
        onChange={(e) => patch({ topEvent: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Phrase the Top Event as a loss-of-control event, not as a consequence (the latter belong on the
        right of the bowtie). Use neutral, factual language — no causes (those are threats) and no
        outcomes (those are consequences).
      </p>
    </div>
  );
}
