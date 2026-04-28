'use client';

import { AlertTriangle, Plus, Sparkles, UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { EmptyState } from '@/components/common/empty-state';

import { useDemoStore } from '@/lib/store';
import { newDraftId } from '@/lib/wizard/steps';
import type {
  WizardBarrierDraft,
  WizardDegradationControlDraft,
  WizardDegradationFactorDraft,
  WizardDraft,
} from '@bowtie/shared';

import { EditableCard, moveDown, moveUp, removeAt } from './editable-card';

interface StepProps {
  draft: WizardDraft;
}

// -- Step 8 — Degradation Factors -------------------------------------

export function Step8DegradationFactors({ draft }: StepProps) {
  const patch = useDemoStore((s) => s.patchWizardDraft);
  const allBarriers = [...draft.preventiveBarriers, ...draft.mitigativeBarriers];

  const update = (next: WizardDegradationFactorDraft[]) => patch({ degradationFactors: next });

  const addFactor = () => {
    const f: WizardDegradationFactorDraft = {
      draftId: newDraftId('df'),
      barrierDraftId: allBarriers[0]?.draftId ?? '',
      description: '',
    };
    update([...draft.degradationFactors, f]);
  };

  if (allBarriers.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Add at least one barrier (Steps 6 or 7) before defining Degradation Factors — every DF must
        attach to a specific barrier.
      </div>
    );
  }

  if (draft.degradationFactors.length === 0) {
    return (
      <EmptyState
        icon={UserCog}
        title="No Degradation Factors yet"
        description="Optional but encouraged. Add the mechanisms — usually human or organisational — that erode a barrier's effectiveness over time. Each factor must attach to a barrier and will need at least one Degradation Control in Step 9."
        action={
          <Button size="sm" onClick={addFactor} className="gap-1">
            <Plus className="h-4 w-4" /> Add Degradation Factor
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {draft.degradationFactors.map((f, i) => {
        const updateField = (p: Partial<WizardDegradationFactorDraft>) => {
          const next = [...draft.degradationFactors];
          next[i] = { ...f, ...p };
          update(next);
        };
        return (
          <EditableCard
            key={f.draftId}
            index={i}
            total={draft.degradationFactors.length}
            label="Degradation Factor"
            onMoveUp={() => update(moveUp(draft.degradationFactors, i))}
            onMoveDown={() => update(moveDown(draft.degradationFactors, i))}
            onRemove={() => {
              // Cascade-remove DCs linked to this DF.
              const dcs = draft.degradationControls.filter((c) => c.factorDraftId !== f.draftId);
              patch({ degradationControls: dcs });
              update(removeAt(draft.degradationFactors, i));
            }}
            toneClassName="border-status-purple/30 bg-status-purple/5"
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Permit fatigue during 14/14 rotation — late-shift quality drop"
                  value={f.description}
                  onChange={(e) => updateField({ description: e.target.value })}
                />
                {f.description.trim().length === 0 && (
                  <p className="text-xs text-status-yellow">Description is required.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Erodes barrier</Label>
                <Select
                  value={f.barrierDraftId || 'unset'}
                  onValueChange={(v) => updateField({ barrierDraftId: v === 'unset' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a barrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {allBarriers.map((b) => (
                      <SelectItem key={b.draftId} value={b.draftId}>
                        {labelBarrier(b)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!f.barrierDraftId && (
                  <p className="text-xs text-status-yellow">Pick the barrier this factor erodes.</p>
                )}
              </div>
            </div>
          </EditableCard>
        );
      })}
      <Button variant="outline" size="sm" onClick={addFactor} className="gap-1">
        <Plus className="h-4 w-4" /> Add another Degradation Factor
      </Button>
      <p className="text-xs italic text-muted-foreground">
        Methodology note: terminology is &ldquo;Degradation Factor&rdquo;, never &ldquo;Escalation Factor&rdquo;.
        Aligned with current CCPS / EI / CGE.
      </p>
    </div>
  );
}

// -- Step 9 — Degradation Controls ------------------------------------

export function Step9DegradationControls({ draft }: StepProps) {
  const patch = useDemoStore((s) => s.patchWizardDraft);

  const update = (next: WizardDegradationControlDraft[]) => patch({ degradationControls: next });

  const addControl = () => {
    const c: WizardDegradationControlDraft = {
      draftId: newDraftId('dc'),
      factorDraftId: draft.degradationFactors[0]?.draftId ?? '',
      name: '',
    };
    update([...draft.degradationControls, c]);
  };

  if (draft.degradationFactors.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No Degradation Factors to defend"
        description="If you didn't add Degradation Factors in Step 8, you can skip this step. Otherwise, go back and add them first."
        action={
          <Button size="sm" variant="outline" onClick={() => patch({ step: 8 })}>
            Back to Step 8
          </Button>
        }
      />
    );
  }

  // Methodology coverage check: every DF must have at least one DC.
  const uncovered = draft.degradationFactors.filter(
    (f) => !draft.degradationControls.some((c) => c.factorDraftId === f.draftId),
  );

  return (
    <div className="space-y-3">
      {draft.degradationControls.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No Degradation Controls yet"
          description="Each Degradation Factor must be defended by at least one Degradation Control."
          action={
            <Button size="sm" onClick={addControl} className="gap-1">
              <Plus className="h-4 w-4" /> Add Degradation Control
            </Button>
          }
        />
      ) : (
        draft.degradationControls.map((c, i) => {
          const updateField = (p: Partial<WizardDegradationControlDraft>) => {
            const next = [...draft.degradationControls];
            next[i] = { ...c, ...p };
            update(next);
          };
          return (
            <EditableCard
              key={c.draftId}
              index={i}
              total={draft.degradationControls.length}
              label="Degradation Control"
              onMoveUp={() => update(moveUp(draft.degradationControls, i))}
              onMoveDown={() => update(moveDown(draft.degradationControls, i))}
              onRemove={() => update(removeAt(draft.degradationControls, i))}
              toneClassName="border-status-blue/30 bg-status-blue/5"
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="e.g. Mandatory dual-signoff for night-shift hot-work permits"
                    value={c.name}
                    onChange={(e) => updateField({ name: e.target.value })}
                  />
                  {c.name.trim().length === 0 && (
                    <p className="text-xs text-status-yellow">Name is required.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Defends Degradation Factor</Label>
                  <Select
                    value={c.factorDraftId || 'unset'}
                    onValueChange={(v) => updateField({ factorDraftId: v === 'unset' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a Degradation Factor" />
                    </SelectTrigger>
                    <SelectContent>
                      {draft.degradationFactors.map((f) => (
                        <SelectItem key={f.draftId} value={f.draftId}>
                          {f.description.trim().length > 0
                            ? truncate(f.description, 50)
                            : 'Unnamed factor'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </EditableCard>
          );
        })
      )}

      {draft.degradationControls.length > 0 && (
        <Button variant="outline" size="sm" onClick={addControl} className="gap-1">
          <Plus className="h-4 w-4" /> Add another Degradation Control
        </Button>
      )}

      {uncovered.length > 0 && (
        <div className="rounded-md border border-status-red/30 bg-status-red/5 p-3 text-xs text-status-red">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {uncovered.length} Degradation Factor{uncovered.length === 1 ? '' : 's'} without a Control
            </span>
          </div>
          <ul className="mt-1 list-disc pl-5 text-foreground/80">
            {uncovered.map((f) => (
              <li key={f.draftId}>
                {f.description.trim().length > 0 ? truncate(f.description, 60) : 'Unnamed factor'}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-foreground/70">
            Methodology rule (CLAUDE.md §2): every Degradation Factor must have at least one
            Degradation Control before this step is valid.
          </p>
        </div>
      )}
    </div>
  );
}

function labelBarrier(b: WizardBarrierDraft): string {
  return b.name.trim().length > 0 ? truncate(b.name, 50) : `Unnamed (${b.criticality})`;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
