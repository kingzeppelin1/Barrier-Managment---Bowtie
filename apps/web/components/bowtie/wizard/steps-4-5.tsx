'use client';

import { Plus, Lightbulb, Skull } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  WizardConsequenceDraft,
  WizardDraft,
  WizardThreatDraft,
} from '@bowtie/shared';

import { EditableCard, moveDown, moveUp, removeAt } from './editable-card';

interface StepProps {
  draft: WizardDraft;
}

// -- Step 4 — Threats ---------------------------------------------------

export function Step4Threats({ draft }: StepProps) {
  const patch = useDemoStore((s) => s.patchWizardDraft);

  const updateThreats = (next: WizardThreatDraft[]) => patch({ threats: next });

  const addThreat = () => {
    const newThreat: WizardThreatDraft = {
      draftId: newDraftId('th'),
      description: '',
      preventiveBarrierDraftIds: [],
    };
    updateThreats([...draft.threats, newThreat]);
  };

  if (draft.threats.length === 0) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="No threats yet"
        description="Add the credible mechanisms that could realise the Top Event. Each threat is a starting point on the left of the bowtie."
        action={
          <Button size="sm" onClick={addThreat} className="gap-1">
            <Plus className="h-4 w-4" /> Add threat
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {draft.threats.map((t, i) => (
        <EditableCard
          key={t.draftId}
          index={i}
          total={draft.threats.length}
          label="Threat"
          onMoveUp={() => updateThreats(moveUp(draft.threats, i))}
          onMoveDown={() => updateThreats(moveDown(draft.threats, i))}
          onRemove={() => updateThreats(removeAt(draft.threats, i))}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`threat-${t.draftId}`} className="text-xs">
              Description
            </Label>
            <Textarea
              id={`threat-${t.draftId}`}
              rows={2}
              placeholder="e.g. Internal corrosion of process piping"
              value={t.description}
              onChange={(e) => {
                const next = [...draft.threats];
                next[i] = { ...t, description: e.target.value };
                updateThreats(next);
              }}
            />
            {t.description.trim().length === 0 && (
              <p className="text-xs text-status-yellow">Description is required.</p>
            )}
          </div>
        </EditableCard>
      ))}
      <Button variant="outline" size="sm" onClick={addThreat} className="gap-1">
        <Plus className="h-4 w-4" /> Add another threat
      </Button>
    </div>
  );
}

// -- Step 5 — Consequences ----------------------------------------------

const SEVERITY_OPTIONS: { value: WizardConsequenceDraft['severity']; label: string }[] = [
  { value: 'catastrophic', label: 'Catastrophic' },
  { value: 'major', label: 'Major' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'minor', label: 'Minor' },
  { value: 'negligible', label: 'Negligible' },
];

export function Step5Consequences({ draft }: StepProps) {
  const patch = useDemoStore((s) => s.patchWizardDraft);

  const updateConsequences = (next: WizardConsequenceDraft[]) => patch({ consequences: next });

  const addConsequence = () => {
    const newC: WizardConsequenceDraft = {
      draftId: newDraftId('cq'),
      description: '',
      severity: 'major',
      mitigativeBarrierDraftIds: [],
    };
    updateConsequences([...draft.consequences, newC]);
  };

  if (draft.consequences.length === 0) {
    return (
      <EmptyState
        icon={Skull}
        title="No consequences yet"
        description="Add the outcomes that occur if the Top Event is realised and mitigative barriers fail. Each consequence sits on the right of the bowtie."
        action={
          <Button size="sm" onClick={addConsequence} className="gap-1">
            <Plus className="h-4 w-4" /> Add consequence
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {draft.consequences.map((c, i) => (
        <EditableCard
          key={c.draftId}
          index={i}
          total={draft.consequences.length}
          label="Consequence"
          onMoveUp={() => updateConsequences(moveUp(draft.consequences, i))}
          onMoveDown={() => updateConsequences(moveDown(draft.consequences, i))}
          onRemove={() => updateConsequences(removeAt(draft.consequences, i))}
        >
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="space-y-1.5">
              <Label htmlFor={`consequence-${c.draftId}`} className="text-xs">
                Description
              </Label>
              <Textarea
                id={`consequence-${c.draftId}`}
                rows={2}
                placeholder="e.g. Pool fire / vapour cloud explosion on topsides"
                value={c.description}
                onChange={(e) => {
                  const next = [...draft.consequences];
                  next[i] = { ...c, description: e.target.value };
                  updateConsequences(next);
                }}
              />
              {c.description.trim().length === 0 && (
                <p className="text-xs text-status-yellow">Description is required.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Severity</Label>
              <Select
                value={c.severity}
                onValueChange={(v) => {
                  const next = [...draft.consequences];
                  next[i] = { ...c, severity: v as WizardConsequenceDraft['severity'] };
                  updateConsequences(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </EditableCard>
      ))}
      <Button variant="outline" size="sm" onClick={addConsequence} className="gap-1">
        <Plus className="h-4 w-4" /> Add another consequence
      </Button>
    </div>
  );
}
