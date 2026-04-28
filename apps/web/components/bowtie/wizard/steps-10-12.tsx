'use client';

import { CheckCircle2, Plus, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/empty-state';

import { useDemoStore } from '@/lib/store';
import { newDraftId, STEPS } from '@/lib/wizard/steps';
import type { WizardActionDraft, WizardDraft } from '@bowtie/shared';

import { EditableCard, moveDown, moveUp, removeAt } from './editable-card';

interface StepProps {
  draft: WizardDraft;
}

// -- Step 10 — Four-level risk -----------------------------------------

export function Step10Risk({ draft }: StepProps) {
  const patch = useDemoStore((s) => s.patchWizardDraft);

  const setNum = (key: keyof WizardDraft, v: number) =>
    patch({ [key]: Number.isFinite(v) ? v : 0 } as Partial<WizardDraft>);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <RiskField
          label="Inherent risk"
          hint="Pre-barrier worst case"
          value={draft.riskBeforeBarriers}
          onChange={(v) => setNum('riskBeforeBarriers', v)}
        />
        <RiskField
          label="Current risk"
          hint="With current barrier health"
          value={draft.riskCurrent}
          onChange={(v) => setNum('riskCurrent', v)}
        />
        <RiskField
          label="Residual risk"
          hint="If all barriers perform"
          value={draft.riskAfterBarriers}
          onChange={(v) => setNum('riskAfterBarriers', v)}
        />
        <RiskField
          label="Target risk"
          hint="ALARP / ambition"
          value={draft.riskTarget}
          onChange={(v) => setNum('riskTarget', v)}
        />
      </div>
      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        Sanity rules: <span className="font-medium">residual ≤ current ≤ inherent</span>. Target may be
        below residual if ALARP justification exists. Two-level shortcuts (inherent + residual only)
        are not allowed by the methodology.
      </div>
    </div>
  );
}

function RiskField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-md border p-3">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        className="mt-1"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

// -- Step 11 — Actions / treatment plan -------------------------------

const PRIORITY_OPTIONS: WizardActionDraft['priority'][] = ['critical', 'high', 'medium', 'low'];

export function Step11Actions({ draft }: StepProps) {
  const patch = useDemoStore((s) => s.patchWizardDraft);
  const users = useDemoStore((s) => s.users);

  const update = (next: WizardActionDraft[]) => patch({ actions: next });

  const addAction = () => {
    const today = new Date();
    const due = new Date(today);
    due.setMonth(due.getMonth() + 3);
    const a: WizardActionDraft = {
      draftId: newDraftId('ac'),
      title: '',
      ownerId: draft.ownerId,
      dueDate: due.toISOString().slice(0, 10),
      priority: 'medium',
    };
    update([...draft.actions, a]);
  };

  if (draft.actions.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No actions yet"
        description="Optional. Add CAPA-style actions that move residual risk towards target. You can also raise actions later from incidents, audits or AI suggestions."
        action={
          <Button size="sm" onClick={addAction} className="gap-1">
            <Plus className="h-4 w-4" /> Add action
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {draft.actions.map((a, i) => {
        const updateField = (p: Partial<WizardActionDraft>) => {
          const next = [...draft.actions];
          next[i] = { ...a, ...p };
          update(next);
        };
        return (
          <EditableCard
            key={a.draftId}
            index={i}
            total={draft.actions.length}
            label="Action"
            onMoveUp={() => update(moveUp(draft.actions, i))}
            onMoveDown={() => update(moveDown(draft.actions, i))}
            onRemove={() => update(removeAt(draft.actions, i))}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input
                  placeholder="e.g. Replace topsides deluge lift pump #2 mechanical seal"
                  value={a.title}
                  onChange={(e) => updateField({ title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Owner</Label>
                  <Select
                    value={a.ownerId ?? 'unassigned'}
                    onValueChange={(v) => updateField({ ownerId: v === 'unassigned' ? null : v })}
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
                  <Label className="text-xs">Due</Label>
                  <Input
                    type="date"
                    value={a.dueDate}
                    onChange={(e) => updateField({ dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select
                    value={a.priority}
                    onValueChange={(v) => updateField({ priority: v as WizardActionDraft['priority'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </EditableCard>
        );
      })}
      <Button variant="outline" size="sm" onClick={addAction} className="gap-1">
        <Plus className="h-4 w-4" /> Add another action
      </Button>
    </div>
  );
}

// -- Step 12 — Review summary -----------------------------------------

export function Step12Review({ draft }: StepProps) {
  const scenarios = useDemoStore((s) => s.scenarios);
  const users = useDemoStore((s) => s.users);
  const scenario = scenarios.find((s) => s.id === draft.scenarioId);
  const owner = users.find((u) => u.id === draft.ownerId);

  // Aggregate validation status by step (excluding step 12 itself).
  const stepStatuses = STEPS.slice(0, 11).map((s) => ({
    step: s.step,
    label: s.label,
    valid: s.validate(draft).ok,
  }));
  const allValid = stepStatuses.every((s) => s.valid);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Scope</div>
          <div className="text-base font-semibold">{draft.title || 'Untitled bowtie'}</div>
          <div className="text-sm text-muted-foreground">{draft.assetOrProcess || '—'}</div>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <Badge variant="outline">{scenario?.name ?? draft.scenarioId}</Badge>
            <Badge variant="outline">Owner: {owner?.name ?? draft.ownerId}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryRow label="Hazard" value={draft.hazard} />
        <SummaryRow label="Top Event" value={draft.topEvent} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <CountTile label="Threats" value={draft.threats.length} />
        <CountTile label="Consequences" value={draft.consequences.length} />
        <CountTile
          label="Barriers"
          value={draft.preventiveBarriers.length + draft.mitigativeBarriers.length}
          hint={`${draft.preventiveBarriers.length} prev / ${draft.mitigativeBarriers.length} mit`}
        />
        <CountTile
          label="Degradation Factors"
          value={draft.degradationFactors.length}
          hint={`${draft.degradationControls.length} controls`}
        />
        <CountTile label="Actions" value={draft.actions.length} />
        <CountTile
          label="Critical barriers"
          value={
            draft.preventiveBarriers.filter((b) => b.criticality === 'critical').length +
            draft.mitigativeBarriers.filter((b) => b.criticality === 'critical').length
          }
        />
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Four-level risk</div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {(
              [
                ['Inherent', draft.riskBeforeBarriers],
                ['Current', draft.riskCurrent],
                ['Residual', draft.riskAfterBarriers],
                ['Target', draft.riskTarget],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-md border p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Step checklist</div>
          <ul className="space-y-1 text-sm">
            {stepStatuses.map((s) => (
              <li key={s.step} className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${s.valid ? 'text-status-green' : 'text-muted-foreground/40'}`}
                />
                <span className={s.valid ? '' : 'text-muted-foreground'}>
                  Step {s.step}: {s.label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div
        className={`rounded-md border p-3 text-sm ${
          allValid
            ? 'border-status-green/30 bg-status-green/5 text-status-green'
            : 'border-status-yellow/30 bg-status-yellow/5 text-status-yellow'
        }`}
      >
        <div className="flex items-center gap-1.5 font-semibold">
          <Send className="h-4 w-4" />
          {allValid
            ? 'Ready to submit. The bowtie will land in the Library at "internal review".'
            : 'Resolve the open issues above before submission.'}
        </div>
        <p className="mt-1 text-xs text-foreground/80">
          Submission moves the bowtie into the six-stage approval lifecycle. Approvers and SMEs can
          then advance it through SME Review → Risk Manager Review → Approved → Published.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function CountTile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
        {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
