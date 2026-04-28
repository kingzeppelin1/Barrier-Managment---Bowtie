'use client';

import { AlertTriangle, Plus, Shield, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import type {
  BarrierFunction,
  BarrierType,
  Criticality,
  WizardBarrierDraft,
  WizardConsequenceDraft,
  WizardDraft,
  WizardThreatDraft,
} from '@bowtie/shared';

import { EditableCard, moveDown, moveUp, removeAt } from './editable-card';

const TYPE_OPTIONS: { value: BarrierType; label: string }[] = [
  { value: 'preventive', label: 'Preventive' },
  { value: 'mitigative', label: 'Mitigative' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'control', label: 'Control' },
];
const FUNCTION_OPTIONS: { value: BarrierFunction; label: string }[] = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'instrumented', label: 'Instrumented' },
  { value: 'procedural', label: 'Procedural' },
  { value: 'human', label: 'Human' },
  { value: 'organizational', label: 'Organisational' },
];
const CRITICALITY_OPTIONS: { value: Criticality; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

interface StepProps {
  draft: WizardDraft;
}

// -- Step 6 — Preventive barriers --------------------------------------

export function Step6PreventiveBarriers({ draft }: StepProps) {
  return (
    <BarrierStep
      draft={draft}
      kind="preventive"
      defaultType="preventive"
      icon={ShieldCheck}
      headerLabel="Preventive barrier"
      emptyTitle="No preventive barriers yet"
      emptyDescription="Add barriers that prevent threats from realising the Top Event. Each barrier should defend at least one threat."
    />
  );
}

// -- Step 7 — Mitigative / recovery barriers --------------------------

export function Step7MitigativeBarriers({ draft }: StepProps) {
  return (
    <BarrierStep
      draft={draft}
      kind="mitigative"
      defaultType="mitigative"
      icon={Shield}
      headerLabel="Mitigative barrier"
      emptyTitle="No mitigative or recovery barriers yet"
      emptyDescription="Add barriers that limit the consequences once the Top Event has occurred."
    />
  );
}

// -- Shared barrier-step body ----------------------------------------

interface BarrierStepProps {
  draft: WizardDraft;
  kind: 'preventive' | 'mitigative';
  defaultType: BarrierType;
  icon: typeof Shield;
  headerLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

function BarrierStep({
  draft,
  kind,
  defaultType,
  icon: Icon,
  headerLabel,
  emptyTitle,
  emptyDescription,
}: BarrierStepProps) {
  const patch = useDemoStore((s) => s.patchWizardDraft);
  const users = useDemoStore((s) => s.users);
  const performanceStandards = useDemoStore((s) =>
    s.performanceStandards.filter((ps) => ps.scenarioId === draft.scenarioId),
  );

  const list = kind === 'preventive' ? draft.preventiveBarriers : draft.mitigativeBarriers;
  const targets = kind === 'preventive' ? draft.threats : draft.consequences;
  const targetsKey = kind === 'preventive' ? 'threats' : 'consequences';

  const updateBarriers = (next: WizardBarrierDraft[]) => {
    patch(kind === 'preventive' ? { preventiveBarriers: next } : { mitigativeBarriers: next });
  };

  const updateTargets = (
    next: typeof targets,
  ) => patch({ [targetsKey]: next } as Partial<WizardDraft>);

  const addBarrier = () => {
    const draftId = newDraftId('bd');
    const newBarrier: WizardBarrierDraft = {
      draftId,
      name: '',
      type: defaultType,
      function: 'procedural',
      criticality: 'medium',
      ownerId: null,
      performanceStandardId: null,
    };
    updateBarriers([...list, newBarrier]);
  };

  const toggleLink = (barrierDraftId: string, targetDraftId: string) => {
    const next = targets.map((t) => {
      if (kind === 'preventive') {
        const tt = t as WizardThreatDraft;
        if (tt.draftId !== targetDraftId) return tt;
        const has = tt.preventiveBarrierDraftIds.includes(barrierDraftId);
        return {
          ...tt,
          preventiveBarrierDraftIds: has
            ? tt.preventiveBarrierDraftIds.filter((id) => id !== barrierDraftId)
            : [...tt.preventiveBarrierDraftIds, barrierDraftId],
        };
      }
      const cc = t as WizardConsequenceDraft;
      if (cc.draftId !== targetDraftId) return cc;
      const has = cc.mitigativeBarrierDraftIds.includes(barrierDraftId);
      return {
        ...cc,
        mitigativeBarrierDraftIds: has
          ? cc.mitigativeBarrierDraftIds.filter((id) => id !== barrierDraftId)
          : [...cc.mitigativeBarrierDraftIds, barrierDraftId],
      };
    });
    updateTargets(next as typeof targets);
  };

  const isLinked = (barrierDraftId: string, targetDraftId: string): boolean => {
    const target = targets.find((t) =>
      kind === 'preventive'
        ? (t as WizardThreatDraft).draftId === targetDraftId
        : (t as WizardConsequenceDraft).draftId === targetDraftId,
    );
    if (!target) return false;
    if (kind === 'preventive')
      return (target as WizardThreatDraft).preventiveBarrierDraftIds.includes(barrierDraftId);
    return (target as WizardConsequenceDraft).mitigativeBarrierDraftIds.includes(barrierDraftId);
  };

  const targetLabel = (t: WizardThreatDraft | WizardConsequenceDraft): string =>
    t.description.trim().length > 0 ? truncate(t.description, 40) : 'Unnamed';

  // Coverage warning: every threat / consequence should have at least one barrier.
  const uncovered = targets.filter((t) => {
    const ids =
      kind === 'preventive'
        ? (t as WizardThreatDraft).preventiveBarrierDraftIds
        : (t as WizardConsequenceDraft).mitigativeBarrierDraftIds;
    return ids.length === 0;
  });

  if (targets.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Add at least one {kind === 'preventive' ? 'threat (Step 4)' : 'consequence (Step 5)'} before
        defining {kind === 'preventive' ? 'preventive' : 'mitigative'} barriers — the cross-link UI
        relies on it.
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <EmptyState
        icon={Icon}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Button size="sm" onClick={addBarrier} className="gap-1">
            <Plus className="h-4 w-4" /> Add barrier
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {list.map((b, i) => {
        const missingPS = b.criticality === 'critical' && !b.performanceStandardId;

        const updateBarrier = (patchBarrier: Partial<WizardBarrierDraft>) => {
          const next = [...list];
          next[i] = { ...b, ...patchBarrier };
          updateBarriers(next);
        };

        return (
          <EditableCard
            key={b.draftId}
            index={i}
            total={list.length}
            label={headerLabel}
            onMoveUp={() => updateBarriers(moveUp(list, i))}
            onMoveDown={() => updateBarriers(moveDown(list, i))}
            onRemove={() => {
              // Also remove any cross-links from threats / consequences.
              const next = targets.map((t) => {
                if (kind === 'preventive') {
                  const tt = t as WizardThreatDraft;
                  return {
                    ...tt,
                    preventiveBarrierDraftIds: tt.preventiveBarrierDraftIds.filter(
                      (id) => id !== b.draftId,
                    ),
                  };
                }
                const cc = t as WizardConsequenceDraft;
                return {
                  ...cc,
                  mitigativeBarrierDraftIds: cc.mitigativeBarrierDraftIds.filter(
                    (id) => id !== b.draftId,
                  ),
                };
              });
              updateTargets(next as typeof targets);
              updateBarriers(removeAt(list, i));
            }}
            toneClassName={missingPS ? 'border-status-red/40' : undefined}
          >
            <div className="space-y-3">
              {/* Row 1 — name */}
              <div className="space-y-1.5">
                <Label htmlFor={`barrier-name-${b.draftId}`} className="text-xs">
                  Name
                </Label>
                <Input
                  id={`barrier-name-${b.draftId}`}
                  placeholder="e.g. Risk-Based Inspection (RBI) program"
                  value={b.name}
                  onChange={(e) => updateBarrier({ name: e.target.value })}
                />
                {b.name.trim().length === 0 && (
                  <p className="text-xs text-status-yellow">Name is required.</p>
                )}
              </div>

              {/* Row 2 — type / function / criticality */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={b.type}
                    onValueChange={(v) => updateBarrier({ type: v as BarrierType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Function</Label>
                  <Select
                    value={b.function}
                    onValueChange={(v) => updateBarrier({ function: v as BarrierFunction })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNCTION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Criticality</Label>
                  <Select
                    value={b.criticality}
                    onValueChange={(v) => updateBarrier({ criticality: v as Criticality })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CRITICALITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3 — owner / PS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Owner</Label>
                  <Select
                    value={b.ownerId ?? 'unassigned'}
                    onValueChange={(v) => updateBarrier({ ownerId: v === 'unassigned' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Performance standard</Label>
                  <Select
                    value={b.performanceStandardId ?? 'none'}
                    onValueChange={(v) =>
                      updateBarrier({ performanceStandardId: v === 'none' ? null : v })
                    }
                  >
                    <SelectTrigger className={missingPS ? 'border-status-red/60' : undefined}>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {performanceStandards.map((ps) => (
                        <SelectItem key={ps.id} value={ps.id}>
                          {ps.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {missingPS && (
                    <p className="flex items-center gap-1 text-xs text-status-red">
                      <AlertTriangle className="h-3 w-3" />
                      Critical barrier needs a Performance Standard.
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4 — cross-links */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Defends {kind === 'preventive' ? 'threats' : 'consequences'}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {targets.map((t) => {
                    const linked = isLinked(b.draftId, (t as { draftId: string }).draftId);
                    return (
                      <button
                        type="button"
                        key={(t as { draftId: string }).draftId}
                        onClick={() => toggleLink(b.draftId, (t as { draftId: string }).draftId)}
                        className={cn(
                          'rounded-md border px-2 py-1 text-xs transition-colors',
                          linked
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input bg-background text-foreground/80 hover:bg-accent',
                        )}
                      >
                        {targetLabel(t)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </EditableCard>
        );
      })}

      {uncovered.length > 0 && (
        <div className="rounded-md border border-status-yellow/30 bg-status-yellow/5 p-3 text-xs text-status-yellow">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {uncovered.length} {kind === 'preventive' ? 'threat' : 'consequence'}
              {uncovered.length === 1 ? '' : 's'} without a {kind === 'preventive' ? 'preventive' : 'mitigative'} barrier
            </span>
          </div>
          <ul className="mt-1 list-disc pl-5 text-foreground/80">
            {uncovered.map((t) => (
              <li key={(t as { draftId: string }).draftId}>{targetLabel(t)}</li>
            ))}
          </ul>
          {kind === 'preventive' && (
            <p className="mt-1 text-foreground/70">
              Methodology rule: every threat must have at least one preventive barrier before this step
              is valid.
            </p>
          )}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={addBarrier} className="gap-1">
        <Plus className="h-4 w-4" /> Add another {kind === 'preventive' ? 'preventive' : 'mitigative'} barrier
      </Button>

      {performanceStandards.length === 0 && (
        <Badge variant="outline" className="text-[10px] uppercase">
          No Performance Standards exist for this scenario yet — critical barriers will need one defined elsewhere.
        </Badge>
      )}
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
