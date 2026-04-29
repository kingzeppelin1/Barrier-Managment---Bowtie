'use client';

import { Suspense, use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Workflow } from 'lucide-react';

import type {
  Barrier,
  Consequence,
  DegradationControl,
  DegradationFactor,
  Threat,
} from '@bowtie/shared';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BowtieCanvas, type SelectedNode } from '@/components/bowtie/canvas/canvas';
import { DetailPanel } from '@/components/bowtie/detail-panel';
import { CoachPanel } from '@/components/ai-coach/coach-panel';
import { useDemoStore } from '@/lib/store';

export default function BowtieWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <WorkspaceInner id={id} />
    </Suspense>
  );
}

function WorkspaceInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const focusParam = searchParams?.get('focus') ?? null;

  const bowtie = useDemoStore((s) => s.bowties.find((b) => b.id === id));
  const threats = useDemoStore((s) => s.threats.filter((t) => t.bowtieId === id));
  const consequences = useDemoStore((s) => s.consequences.filter((c) => c.bowtieId === id));
  const allBarriers = useDemoStore((s) => s.barriers);
  const allDfs = useDemoStore((s) => s.degradationFactors);
  const allDcs = useDemoStore((s) => s.degradationControls);

  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachFilterTargetId, setCoachFilterTargetId] = useState<string | null>(null);

  // Apply ?focus=<id> deep links once on mount: select the node so the
  // detail panel auto-opens, and let the canvas centre on it.
  const focusAppliedRef = useRef(false);
  useEffect(() => {
    if (focusAppliedRef.current) return;
    if (!focusParam) return;
    const kind = resolveKindFromId(focusParam, {
      bowtieId: bowtie?.id ?? null,
      barriers: allBarriers,
      threats,
      consequences,
      dfs: allDfs,
      dcs: allDcs,
    });
    if (kind) {
      setSelected({ kind, id: focusParam });
      focusAppliedRef.current = true;
    }
  }, [focusParam, bowtie?.id, allBarriers, threats, consequences, allDfs, allDcs]);

  useEffect(() => {
    const handler = () => setCoachOpen((v) => !v);
    window.addEventListener('bowtie-coach-toggle', handler);
    return () => window.removeEventListener('bowtie-coach-toggle', handler);
  }, []);

  // When a node is selected with the coach already open, scope to that node.
  useEffect(() => {
    if (!coachOpen) return;
    setCoachFilterTargetId(selected ? selected.id : null);
  }, [selected, coachOpen]);

  const barriers = useMemo(
    () => allBarriers.filter((b) => b.bowtieIds.includes(id)),
    [allBarriers, id],
  );
  const degradationFactors = useMemo(
    () => allDfs.filter((f) => barriers.some((b) => b.id === f.barrierId)),
    [allDfs, barriers],
  );
  const degradationControls = useMemo(
    () => allDcs.filter((c) => degradationFactors.some((f) => f.id === c.degradationFactorId)),
    [allDcs, degradationFactors],
  );

  if (!bowtie) {
    return (
      <>
        <PageHeader title="Bowtie Workspace" description={`No bowtie found for id ${id}.`} />
        <div className="p-6">
          <EmptyState
            icon={Workflow}
            title="Bowtie not found"
            description="It may have been archived. Pick another from the library."
            action={
              <Button asChild size="sm">
                <Link href="/bowties">Back to library</Link>
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={bowtie.title}
        description={`${bowtie.assetOrProcess} · Top event: ${bowtie.topEvent}`}
        actions={
          <>
            <Badge variant="outline" className="capitalize">
              {bowtie.approvalState.replace(/_/g, ' ')}
            </Badge>
            <Button asChild size="sm" variant="outline">
              <Link href="/bowties">Back to library</Link>
            </Button>
          </>
        }
      />
      <div className="relative h-[calc(100vh-3.5rem-72px)]">
        {threats.length === 0 && consequences.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Workflow}
              title="This bowtie has no structure yet"
              description="Use the Builder Wizard to add threats, the top event and barriers."
              action={
                <Button asChild size="sm">
                  <Link href="/bowties/new">Open Builder</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <BowtieCanvas
            bowtie={bowtie}
            threats={threats}
            consequences={consequences}
            barriers={barriers}
            degradationFactors={degradationFactors}
            degradationControls={degradationControls}
            onSelect={setSelected}
            selectedId={selected?.id ?? null}
            focusNodeId={focusParam}
          />
        )}
      </div>
      <DetailPanel selected={selected} bowtie={bowtie} onClose={() => setSelected(null)} />
      <CoachPanel
        bowtie={bowtie}
        open={coachOpen}
        onOpenChange={setCoachOpen}
        filterTargetId={coachFilterTargetId}
        onClearFilter={() => setCoachFilterTargetId(null)}
      />
    </>
  );
}

interface ResolverInput {
  bowtieId: string | null;
  barriers: Barrier[];
  threats: Threat[];
  consequences: Consequence[];
  dfs: DegradationFactor[];
  dcs: DegradationControl[];
}

function resolveKindFromId(id: string, ctx: ResolverInput): SelectedNode['kind'] | null {
  if (id === 'top-event' || id === ctx.bowtieId) return 'topEvent';
  if (ctx.barriers.some((b) => b.id === id)) return 'barrier';
  if (ctx.threats.some((t) => t.id === id)) return 'threat';
  if (ctx.consequences.some((c) => c.id === id)) return 'consequence';
  if (ctx.dfs.some((f) => f.id === id)) return 'degradationFactor';
  if (ctx.dcs.some((dc) => dc.id === id)) return 'degradationControl';
  return null;
}
