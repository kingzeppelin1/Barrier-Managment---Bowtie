'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Shield, SearchX } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { RegisterPageSkeleton } from '@/components/common/register-skeleton';
import { StatusBadge } from '@/components/common/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RegisterFilters,
  DEFAULT_REGISTER_FILTERS,
  type RegisterFilterValue,
} from '@/components/barrier/register-filters';
import type { BarrierType, Criticality, HealthStatus } from '@bowtie/shared';

import { useDemoStore } from '@/lib/store';
import { useUrlFilterSync } from '@/lib/url-filters';
import { formatDate } from '@/lib/utils';

const VALID_STATUS = new Set<HealthStatus>(['green', 'yellow', 'red', 'gray']);
const VALID_TYPE = new Set<BarrierType>(['preventive', 'mitigative', 'recovery', 'control']);
const VALID_CRIT = new Set<Criticality>(['critical', 'high', 'medium', 'low']);

export default function BarrierRegisterPage() {
  return (
    <Suspense fallback={<RegisterPageSkeleton />}>
      <BarrierRegisterInner />
    </Suspense>
  );
}

function BarrierRegisterInner() {
  const searchParams = useSearchParams();
  const syncUrl = useUrlFilterSync();
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);
  const actions = useDemoStore((s) => s.actions);
  const bowties = useDemoStore((s) => s.bowties);

  // Seed filter state from URL params (?status=, ?criticality=, ?type=, ?scenarioId=).
  // Filter mutations push back to URL via useUrlFilterSync so deep links
  // accumulate rather than overwrite.
  const [filters, setFiltersState] = useState<RegisterFilterValue>(() => {
    const initial = { ...DEFAULT_REGISTER_FILTERS };
    const status = searchParams?.get('status');
    if (status && VALID_STATUS.has(status as HealthStatus)) initial.status = status as HealthStatus;
    const crit = searchParams?.get('criticality');
    if (crit && VALID_CRIT.has(crit as Criticality)) initial.criticality = crit as Criticality;
    const type = searchParams?.get('type');
    if (type && VALID_TYPE.has(type as BarrierType)) initial.type = type as BarrierType;
    const scenarioId = searchParams?.get('scenarioId');
    if (scenarioId) initial.scenarioId = scenarioId;
    return initial;
  });

  const setFilters = (next: RegisterFilterValue) => {
    setFiltersState(next);
    syncUrl({
      status: next.status,
      criticality: next.criticality,
      type: next.type,
      scenarioId: next.scenarioId,
    });
  };

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return barriers.filter((b) => {
      if (filters.scenarioId !== 'all' && b.scenarioId !== filters.scenarioId) return false;
      if (filters.status !== 'all' && b.status !== filters.status) return false;
      if (filters.type !== 'all' && b.type !== filters.type) return false;
      if (filters.criticality !== 'all' && b.criticality !== filters.criticality) return false;
      if (q) {
        const hay = `${b.name} ${b.description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [barriers, filters]);

  return (
    <>
      <PageHeader
        title="Barrier Register"
        description={`${barriers.length} barrier${barriers.length === 1 ? '' : 's'} across ${new Set(barriers.map((b) => b.scenarioId)).size} scenario${new Set(barriers.map((b) => b.scenarioId)).size === 1 ? '' : 's'}.`}
      />
      <div className="space-y-4 p-6">
        <RegisterFilters value={filters} onChange={setFilters} />

        {barriers.length === 0 ? (
          <EmptyState icon={Shield} title="No barriers in the register" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No barriers match these filters"
            action={
              <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_REGISTER_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Crit.</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Health</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last verified</TableHead>
                  <TableHead>Next due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                  <TableHead>On bowtie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => {
                  const owner = users.find((u) => u.id === b.ownerId);
                  const openActions = actions.filter(
                    (a) => a.barrierId === b.id && a.status !== 'closed',
                  ).length;
                  const onBowties = bowties.filter((bt) => b.bowtieIds.includes(bt.id));
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs">{b.id}</TableCell>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{b.type}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{b.function}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {b.criticality}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {owner?.name ?? <span className="text-status-red">— gap</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{b.healthScore}</TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} withCompensatory={b.withCompensatory} />
                      </TableCell>
                      <TableCell>{formatDate(b.lastVerifiedAt)}</TableCell>
                      <TableCell>{formatDate(b.nextVerificationDue)}</TableCell>
                      <TableCell className="text-right tabular-nums">{openActions}</TableCell>
                      <TableCell>
                        {onBowties.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {onBowties.map((bt) => (
                              <Link
                                key={bt.id}
                                href={`/bowties/${bt.id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                {bt.id}
                              </Link>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
