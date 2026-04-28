'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Shield, SearchX } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
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

import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function BarrierRegisterPage() {
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);
  const actions = useDemoStore((s) => s.actions);
  const bowties = useDemoStore((s) => s.bowties);
  const [filters, setFilters] = useState<RegisterFilterValue>(DEFAULT_REGISTER_FILTERS);

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
