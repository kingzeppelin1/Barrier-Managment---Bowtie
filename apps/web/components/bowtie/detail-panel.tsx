'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  ExternalLink,
  Sparkles,
  UserCog,
} from 'lucide-react';
import Link from 'next/link';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/common/status-badge';

import type {
  Action,
  AiSuggestion,
  Barrier,
  Bowtie,
  Consequence,
  DegradationControl,
  DegradationFactor,
  PerformanceStandard,
  Threat,
  User,
  Verification,
} from '@bowtie/shared';

import { selectCurrentRole, useDemoStore } from '@/lib/store';
import { isReadOnly } from '@/lib/rbac';
import { cn, formatDate, relativeDays } from '@/lib/utils';
import type { SelectedNode } from './canvas/canvas';

interface DetailPanelProps {
  selected: SelectedNode | null;
  bowtie: Bowtie;
  onClose: () => void;
}

export function DetailPanel({ selected, bowtie, onClose }: DetailPanelProps) {
  const open = Boolean(selected);
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="right" className="flex w-[28rem] flex-col overflow-hidden p-0 sm:max-w-[28rem]">
        {selected && <PanelBody selected={selected} bowtie={bowtie} />}
      </SheetContent>
    </Sheet>
  );
}

// -------------------------------------------------------------------------

function PanelBody({ selected, bowtie }: { selected: SelectedNode; bowtie: Bowtie }) {
  const store = useDemoStore();

  switch (selected.kind) {
    case 'barrier':
      return (
        <BarrierPanel
          barrier={store.barriers.find((b) => b.id === selected.id)}
          users={store.users}
          actions={store.actions}
          verifications={store.verifications}
          standards={store.performanceStandards}
        />
      );
    case 'threat':
      return (
        <ThreatPanel
          threat={store.threats.find((t) => t.id === selected.id)}
          barriers={store.barriers}
        />
      );
    case 'consequence':
      return (
        <ConsequencePanel
          consequence={store.consequences.find((c) => c.id === selected.id)}
          barriers={store.barriers}
        />
      );
    case 'topEvent':
      return (
        <TopEventPanel
          bowtie={bowtie}
          users={store.users}
          aiSuggestions={store.aiSuggestions}
          barriers={store.barriers.filter((b) => b.bowtieIds.includes(bowtie.id))}
          consequences={store.consequences.filter((c) => c.bowtieId === bowtie.id)}
          threats={store.threats.filter((t) => t.bowtieId === bowtie.id)}
        />
      );
    case 'degradationFactor':
      return (
        <DegradationFactorPanel
          factor={store.degradationFactors.find((f) => f.id === selected.id)}
          controls={store.degradationControls}
          barriers={store.barriers}
        />
      );
    case 'degradationControl':
      return (
        <DegradationControlPanel
          control={store.degradationControls.find((c) => c.id === selected.id)}
          factors={store.degradationFactors}
          users={store.users}
        />
      );
    default:
      return null;
  }
}

// -------------------------------------------------------------------------

function PanelShell({
  kind,
  title,
  subtitle,
  badges,
  children,
  showEdit = true,
}: {
  kind: string;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  children: React.ReactNode;
  showEdit?: boolean;
}) {
  const role = useDemoStore(selectCurrentRole);
  const readOnly = isReadOnly(role);

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{kind}</span>
          {readOnly && (
            <Badge variant="outline" className="text-[10px] uppercase">
              Read-only
            </Badge>
          )}
        </div>
        <SheetTitle className="text-base leading-snug">{title}</SheetTitle>
        {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
        {badges && <div className="flex flex-wrap items-center gap-1.5 pt-1">{badges}</div>}
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto p-6 text-sm">{children}</div>
      {showEdit && (
        <div className="flex items-center justify-end gap-2 border-t p-3">
          <Button size="sm" variant="outline" disabled={readOnly} className="gap-1">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: 'red' | 'yellow' | 'blue' | 'purple';
  title: string;
  children: React.ReactNode;
}) {
  const TONE_CLASS = {
    red: 'border-status-red/30 bg-status-red/5 text-status-red',
    yellow: 'border-status-yellow/30 bg-status-yellow/5 text-status-yellow',
    blue: 'border-status-blue/30 bg-status-blue/5 text-status-blue',
    purple: 'border-status-purple/30 bg-status-purple/5 text-status-purple',
  } as const;
  return (
    <div className={cn('rounded-md border p-3 text-xs', TONE_CLASS[tone])}>
      <div className="flex items-center gap-1.5 font-semibold">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      <div className="mt-1 text-foreground/80">{children}</div>
    </div>
  );
}

function NotFound({ kind }: { kind: string }) {
  return (
    <PanelShell kind={kind} title={`${kind} not found`} showEdit={false}>
      <p className="text-muted-foreground">This element no longer exists in the demo data.</p>
    </PanelShell>
  );
}

// -- Barrier panel --------------------------------------------------------

function BarrierPanel({
  barrier,
  users,
  actions,
  verifications,
  standards,
}: {
  barrier: Barrier | undefined;
  users: User[];
  actions: Action[];
  verifications: Verification[];
  standards: PerformanceStandard[];
}) {
  if (!barrier) return <NotFound kind="Barrier" />;
  const owner = users.find((u) => u.id === barrier.ownerId);
  const linkedActions = actions.filter((a) => a.barrierId === barrier.id);
  const latestVerif = verifications
    .filter((v) => v.barrierId === barrier.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const standard = standards.find((s) => s.id === barrier.performanceStandardId);
  const days = relativeDays(barrier.nextVerificationDue);
  const overdue = days !== null && days < 0;

  // AI quality check — heuristic preview, mirrors what Slice 10 will compute.
  const aiChecks: { label: string; tone: 'green' | 'yellow' | 'red' }[] = [];
  if (!barrier.ownerId) aiChecks.push({ label: 'Missing barrier owner', tone: 'red' });
  if (overdue) aiChecks.push({ label: 'Verification overdue', tone: 'red' });
  if (barrier.openCriticalFindings > 0)
    aiChecks.push({ label: `${barrier.openCriticalFindings} open critical finding(s)`, tone: 'red' });
  if (barrier.failedTests > 0) aiChecks.push({ label: `${barrier.failedTests} failed critical test(s)`, tone: 'red' });
  if (barrier.criticality === 'critical' && !standard)
    aiChecks.push({ label: 'No performance standard linked to a critical barrier', tone: 'yellow' });
  if (aiChecks.length === 0)
    aiChecks.push({ label: 'No AI quality issues detected', tone: 'green' });

  return (
    <PanelShell
      kind="Barrier"
      title={barrier.name}
      subtitle={`${barrier.type} · ${barrier.function} · ${barrier.criticality}`}
      badges={
        <>
          <StatusBadge status={barrier.status} withCompensatory={barrier.withCompensatory} />
          <Badge variant="outline" className="text-[10px] tabular-nums">
            Health {barrier.healthScore}
          </Badge>
        </>
      }
    >
      {barrier.withCompensatory && barrier.status === 'red' && (
        <Callout tone="red" title="Compensated control">
          Risk acceptance has been documented and compensatory measures are in place, but the barrier
          remains degraded. Per methodology, compensated red stays red.
          {barrier.compensatoryNotes && <div className="mt-1 italic">{barrier.compensatoryNotes}</div>}
        </Callout>
      )}

      {barrier.gapRecord && (
        <Callout tone="yellow" title="Documented gap">
          <div className="space-y-1">
            <div>
              Gap owner: <span className="font-medium">{users.find((u) => u.id === barrier.gapRecord!.ownerId)?.name ?? barrier.gapRecord!.ownerId}</span>
            </div>
            <div>Target resolution: {formatDate(barrier.gapRecord.targetResolutionDate)}</div>
            {barrier.gapRecord.linkedActionId && (
              <div>
                Linked action:{' '}
                <Link
                  href="/actions"
                  className="font-mono text-foreground underline-offset-2 hover:underline"
                >
                  {barrier.gapRecord.linkedActionId}
                </Link>
              </div>
            )}
            {barrier.gapRecord.notes && <div className="italic">{barrier.gapRecord.notes}</div>}
          </div>
        </Callout>
      )}

      <Field label="Description">{barrier.description ?? '—'}</Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Owner">{owner?.name ?? <span className="text-status-red">Unassigned</span>}</Field>
        <Field label="Performance standard">{standard ? standard.name : '—'}</Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Health</div>
          <span className="text-xs tabular-nums text-muted-foreground">{barrier.healthScore} / 100</span>
        </div>
        <Progress
          value={barrier.healthScore}
          indicatorClassName={
            barrier.status === 'red'
              ? 'bg-status-red'
              : barrier.status === 'yellow'
                ? 'bg-status-yellow'
                : 'bg-status-green'
          }
        />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Last verified">{formatDate(barrier.lastVerifiedAt)}</Field>
        <Field label="Next due">
          <span className={overdue ? 'text-status-red' : ''}>
            {formatDate(barrier.nextVerificationDue)}
            {days !== null && (
              <span className="ml-1 text-xs text-muted-foreground">
                {days >= 0 ? `in ${days}d` : `${Math.abs(days)}d ago`}
              </span>
            )}
          </span>
        </Field>
      </div>

      {latestVerif && (
        <Field label="Latest verification">
          <div className="rounded-md border bg-card p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="capitalize">{latestVerif.method.replace(/_/g, ' ')}</span>
              <Badge
                variant={latestVerif.result === 'pass' ? 'green' : latestVerif.result === 'fail' ? 'red' : 'yellow'}
                className="capitalize"
              >
                {latestVerif.result}
              </Badge>
            </div>
            {latestVerif.comments && <div className="mt-1 text-xs text-muted-foreground">{latestVerif.comments}</div>}
            {latestVerif.evidence && (
              <div className="mt-1 flex items-center gap-1 text-xs text-primary">
                <ExternalLink className="h-3 w-3" />
                <span>{latestVerif.evidence}</span>
              </div>
            )}
          </div>
        </Field>
      )}

      <Separator />

      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Linked actions ({linkedActions.length})
        </div>
        <ul className="mt-2 space-y-1.5">
          {linkedActions.length === 0 && <li className="text-xs text-muted-foreground">No linked actions.</li>}
          {linkedActions.map((a) => {
            const isOverdue = a.status === 'overdue' || (a.status !== 'closed' && new Date(a.dueDate) < new Date());
            return (
              <li key={a.id} className="rounded-md border p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-medium">{a.title}</div>
                  <Badge
                    variant={a.status === 'closed' ? 'green' : isOverdue ? 'red' : 'outline'}
                    className="capitalize"
                  >
                    {a.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="mt-0.5 flex justify-between text-[11px] text-muted-foreground">
                  <span className="capitalize">{a.priority} priority</span>
                  <span className={isOverdue ? 'text-status-red' : ''}>Due {formatDate(a.dueDate)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Separator />

      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3 w-3" /> AI quality check (preview)
        </div>
        <ul className="mt-2 space-y-1.5">
          {aiChecks.map((c, idx) => (
            <li
              key={idx}
              className={cn(
                'flex items-center gap-2 rounded-md border p-2 text-xs',
                c.tone === 'red' && 'border-status-red/30 bg-status-red/5',
                c.tone === 'yellow' && 'border-status-yellow/30 bg-status-yellow/5',
                c.tone === 'green' && 'border-status-green/30 bg-status-green/5',
              )}
            >
              {c.tone === 'green' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-status-green" />
              ) : (
                <AlertTriangle
                  className={cn(
                    'h-3.5 w-3.5',
                    c.tone === 'red' ? 'text-status-red' : 'text-status-yellow',
                  )}
                />
              )}
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-[11px] italic text-muted-foreground">
          Full AI Coach panel arrives in Slice 10. Suggestions remain advisory — every accepted suggestion
          requires a named human reviewer.
        </div>
      </div>
    </PanelShell>
  );
}

// -- Threat / Consequence panels -----------------------------------------

function ThreatPanel({ threat, barriers }: { threat: Threat | undefined; barriers: Barrier[] }) {
  if (!threat) return <NotFound kind="Threat" />;
  const linked = barriers.filter((b) => threat.preventiveBarrierIds.includes(b.id));
  return (
    <PanelShell kind="Threat" title={threat.description}>
      <Field label="Preventive barrier chain">
        {linked.length === 0 ? (
          <span className="text-muted-foreground">No barriers linked.</span>
        ) : (
          <ol className="space-y-1.5">
            {linked.map((b, i) => (
              <li key={b.id} className="flex items-center gap-2 rounded-md border p-2 text-xs">
                <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                <span className="flex-1 truncate">{b.name}</span>
                <StatusBadge status={b.status} withCompensatory={b.withCompensatory} />
              </li>
            ))}
          </ol>
        )}
      </Field>
      <Callout tone="yellow" title="Methodology note">
        Threats describe the credible mechanisms that could realise the Top Event. Each threat must be
        defended by at least one preventive barrier in the bowtie.
      </Callout>
    </PanelShell>
  );
}

function ConsequencePanel({
  consequence,
  barriers,
}: {
  consequence: Consequence | undefined;
  barriers: Barrier[];
}) {
  if (!consequence) return <NotFound kind="Consequence" />;
  const linked = barriers.filter((b) => consequence.mitigativeBarrierIds.includes(b.id));
  return (
    <PanelShell
      kind="Consequence"
      title={consequence.description}
      badges={
        <Badge
          variant={
            consequence.severity === 'catastrophic' || consequence.severity === 'major'
              ? 'red'
              : consequence.severity === 'moderate'
                ? 'yellow'
                : 'outline'
          }
          className="capitalize"
        >
          {consequence.severity}
        </Badge>
      }
    >
      <Field label="Mitigative / recovery barrier chain">
        {linked.length === 0 ? (
          <span className="text-muted-foreground">No barriers linked.</span>
        ) : (
          <ol className="space-y-1.5">
            {linked.map((b, i) => (
              <li key={b.id} className="flex items-center gap-2 rounded-md border p-2 text-xs">
                <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                <span className="flex-1 truncate">{b.name}</span>
                <StatusBadge status={b.status} withCompensatory={b.withCompensatory} />
              </li>
            ))}
          </ol>
        )}
      </Field>
    </PanelShell>
  );
}

// -- Top Event panel -----------------------------------------------------

function TopEventPanel({
  bowtie,
  users,
  aiSuggestions,
  barriers,
  consequences,
  threats,
}: {
  bowtie: Bowtie;
  users: User[];
  aiSuggestions: AiSuggestion[];
  barriers: Barrier[];
  consequences: Consequence[];
  threats: Threat[];
}) {
  const owner = users.find((u) => u.id === bowtie.ownerId);
  const barrierIds = new Set(barriers.map((b) => b.id));
  const threatIds = new Set(threats.map((t) => t.id));
  const consIds = new Set(consequences.map((c) => c.id));
  const relevantSuggestions = aiSuggestions.filter((s) => {
    const t = s.context.targetId;
    return t === bowtie.id || (t && (barrierIds.has(t) || threatIds.has(t) || consIds.has(t)));
  });
  const pending = relevantSuggestions.filter((s) => s.reviewerDecision === null);

  return (
    <PanelShell
      kind="Top Event"
      title={bowtie.topEvent}
      subtitle={`Hazard: ${bowtie.hazard}`}
      badges={
        <>
          <Badge variant="outline" className="capitalize">
            {bowtie.approvalState.replace(/_/g, ' ')}
          </Badge>
          {bowtie.changesPendingMoc && (
            <Badge variant="yellow" className="text-[10px] uppercase">
              MOC pending
            </Badge>
          )}
        </>
      }
      showEdit={false}
    >
      <Field label="Asset / process">{bowtie.assetOrProcess}</Field>
      <Field label="Owner">{owner?.name ?? '—'}</Field>

      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Four-level risk
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
          {(
            [
              ['Inherent', bowtie.riskBeforeBarriers],
              ['Current', bowtie.riskCurrent],
              ['Residual', bowtie.riskAfterBarriers],
              ['Target', bowtie.riskTarget],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-md border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          AI suggestions on this bowtie ({relevantSuggestions.length})
        </div>
        {pending.length > 0 && (
          <div className="mt-2 rounded-md border border-status-red/30 bg-status-red/5 p-2 text-xs text-status-red">
            <strong>Approval gate would block:</strong>{' '}
            {pending.length} AI suggestion{pending.length === 1 ? '' : 's'} pending human review.
          </div>
        )}
        <ul className="mt-2 space-y-1.5">
          {relevantSuggestions.length === 0 && (
            <li className="text-xs text-muted-foreground">No AI suggestions yet.</li>
          )}
          {relevantSuggestions.map((s) => (
            <li key={s.id} className="rounded-md border p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{s.output.title}</span>
                <Badge
                  variant={
                    s.reviewerDecision === 'accepted'
                      ? 'green'
                      : s.reviewerDecision === 'rejected'
                        ? 'red'
                        : 'yellow'
                  }
                  className="text-[10px] capitalize"
                >
                  {s.reviewerDecision ?? 'pending'}
                </Badge>
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{s.output.rationale}</div>
            </li>
          ))}
        </ul>
      </div>
    </PanelShell>
  );
}

// -- Degradation Factor / Control panels --------------------------------

function DegradationFactorPanel({
  factor,
  controls,
  barriers,
}: {
  factor: DegradationFactor | undefined;
  controls: DegradationControl[];
  barriers: Barrier[];
}) {
  if (!factor) return <NotFound kind="Degradation Factor" />;
  const parent = barriers.find((b) => b.id === factor.barrierId);
  const linkedControls = controls.filter((c) => c.degradationFactorId === factor.id);
  return (
    <PanelShell
      kind="Degradation Factor"
      title={factor.description}
      subtitle={parent ? `Erodes barrier: ${parent.name}` : undefined}
    >
      <Field label={`Degradation Controls (${linkedControls.length})`}>
        {linkedControls.length === 0 ? (
          <Callout tone="red" title="No Degradation Controls linked">
            A Degradation Factor without at least one Degradation Control fails the structural rules of
            the bowtie methodology.
          </Callout>
        ) : (
          <ul className="space-y-1.5">
            {linkedControls.map((dc) => (
              <li key={dc.id} className="flex items-center gap-2 rounded-md border border-status-blue/30 bg-status-blue/5 p-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-status-blue" />
                <span className="flex-1 truncate">{dc.name}</span>
                <StatusBadge status={dc.status} />
              </li>
            ))}
          </ul>
        )}
      </Field>
      <Callout tone="purple" title="Methodology note">
        Degradation Factors describe mechanisms that erode a barrier&rsquo;s effectiveness over time —
        human, organisational or environmental. Every DF must be defended by one or more Degradation
        Controls. (Never &ldquo;Escalation Factor&rdquo; — terminology aligned with current CCPS / EI / CGE.)
      </Callout>
    </PanelShell>
  );
}

function DegradationControlPanel({
  control,
  factors,
  users,
}: {
  control: DegradationControl | undefined;
  factors: DegradationFactor[];
  users: User[];
}) {
  if (!control) return <NotFound kind="Degradation Control" />;
  const parent = factors.find((f) => f.id === control.degradationFactorId);
  const owner = users.find((u) => u.id === control.ownerId);
  return (
    <PanelShell
      kind="Degradation Control"
      title={control.name}
      subtitle={parent ? `Defends DF: ${parent.description}` : undefined}
      badges={<StatusBadge status={control.status} />}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Function">
          <span className="capitalize">{control.function}</span>
        </Field>
        <Field label="Owner">{owner?.name ?? '—'}</Field>
      </div>
      <Callout tone="blue" title="Methodology note">
        Degradation Controls protect a Degradation Factor pathway from undermining the parent barrier.
        They&rsquo;re not standalone barriers and don&rsquo;t carry the full barrier health calculation —
        their status reflects their own assurance.
      </Callout>
      {control.aiOriginSuggestionId && (
        <Callout tone="yellow" title="AI-origin">
          This Degradation Control originated from an AI suggestion. Approval gates check that the
          originating suggestion has been accepted by a named human reviewer.
          <span className="ml-1 inline-flex items-center gap-1 font-mono text-[11px]">
            <UserCog className="h-3 w-3" /> {control.aiOriginSuggestionId}
          </span>
        </Callout>
      )}
      <div className="text-[11px] italic text-muted-foreground">
        <ClipboardCheck className="mr-1 inline h-3 w-3" />
        Verifications and edit affordances arrive in later slices.
      </div>
    </PanelShell>
  );
}
