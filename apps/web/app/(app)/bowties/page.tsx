'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Library, Plus, SearchX } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LibraryFilters,
  DEFAULT_LIBRARY_FILTERS,
  type LibraryFilterValue,
} from '@/components/bowtie/library-filters';
import { BowtieRowActions } from '@/components/bowtie/bowtie-row-actions';
import { selectCurrentRole, useDemoStore } from '@/lib/store';
import { can } from '@/lib/rbac';
import { cn, formatDate } from '@/lib/utils';

export default function BowtieLibraryPage() {
  const bowties = useDemoStore((s) => s.bowties);
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);
  const role = useDemoStore(selectCurrentRole);
  const [filters, setFilters] = useState<LibraryFilterValue>(DEFAULT_LIBRARY_FILTERS);

  const canCreate = can(role, 'bowtie:create');

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return bowties.filter((bt) => {
      if (!filters.showArchived && bt.archivedAt) return false;
      if (filters.scenarioId !== 'all' && bt.scenarioId !== filters.scenarioId) return false;
      if (filters.approvalState !== 'all' && bt.approvalState !== filters.approvalState) return false;
      if (filters.ownerId !== 'all' && bt.ownerId !== filters.ownerId) return false;
      if (q) {
        const hay = `${bt.title} ${bt.hazard} ${bt.topEvent} ${bt.assetOrProcess}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bowties, filters]);

  const archivedCount = bowties.filter((b) => b.archivedAt).length;

  return (
    <>
      <PageHeader
        title="Bowtie Library"
        description={`${bowties.length} bowtie${bowties.length === 1 ? '' : 's'}${archivedCount > 0 ? ` · ${archivedCount} archived` : ''}.`}
        actions={
          <Button asChild size="sm" className="gap-1" disabled={!canCreate}>
            <Link href="/bowties/new" aria-disabled={!canCreate}>
              <Plus className="h-4 w-4" /> Create new
            </Link>
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <LibraryFilters value={filters} onChange={setFilters} />

        {bowties.length === 0 ? (
          <EmptyState
            icon={Library}
            title="No bowties yet"
            description="Use Settings → Reset demo data to restore the seeded scenarios."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No bowties match these filters"
            description="Try widening the search, clearing a filter, or showing archived bowties."
            action={
              <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_LIBRARY_FILTERS)}>
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
                  <TableHead>Title</TableHead>
                  <TableHead>Top Event</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Inherent</TableHead>
                  <TableHead className="text-right">Residual</TableHead>
                  <TableHead className="text-right">Barriers</TableHead>
                  <TableHead>Next review</TableHead>
                  <TableHead className="w-9" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((bt) => {
                  const owner = users.find((u) => u.id === bt.ownerId);
                  const barrierCount = barriers.filter((b) => b.bowtieIds.includes(bt.id)).length;
                  const archived = Boolean(bt.archivedAt);
                  return (
                    <TableRow key={bt.id} className={cn(archived && 'opacity-60')}>
                      <TableCell className="font-mono text-xs">{bt.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/bowties/${bt.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {bt.title}
                          </Link>
                          {archived && <Badge variant="outline">Archived</Badge>}
                          {bt.changesPendingMoc && (
                            <Badge variant="yellow" className="text-[10px] uppercase">
                              MOC pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[28ch] truncate text-muted-foreground">{bt.topEvent}</TableCell>
                      <TableCell>{owner?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {bt.approvalState.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{bt.riskBeforeBarriers}</TableCell>
                      <TableCell className="text-right tabular-nums">{bt.riskAfterBarriers}</TableCell>
                      <TableCell className="text-right tabular-nums">{barrierCount}</TableCell>
                      <TableCell>{formatDate(bt.nextReviewDue)}</TableCell>
                      <TableCell>
                        <BowtieRowActions bowtie={bt} />
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
