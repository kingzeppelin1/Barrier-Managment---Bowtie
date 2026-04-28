'use client';

import Link from 'next/link';
import { Library, Plus } from 'lucide-react';

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
import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function BowtieLibraryPage() {
  const bowties = useDemoStore((s) => s.bowties);
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);

  return (
    <>
      <PageHeader
        title="Bowtie Library"
        description="All bowtie analyses across scenarios. Filters and bulk actions arrive in Slice 4."
        actions={
          <Button asChild size="sm" className="gap-1">
            <Link href="/bowties/new">
              <Plus className="h-4 w-4" /> Create new
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        {bowties.length === 0 ? (
          <EmptyState
            icon={Library}
            title="No bowties yet"
            description="Use the seed Reset in Settings to restore the demo scenarios."
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
                  <TableHead className="text-right">Risk before</TableHead>
                  <TableHead className="text-right">Risk after</TableHead>
                  <TableHead className="text-right">Barriers</TableHead>
                  <TableHead>Next review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bowties.map((bt) => {
                  const owner = users.find((u) => u.id === bt.ownerId);
                  const barrierCount = barriers.filter((b) => b.bowtieIds.includes(bt.id)).length;
                  return (
                    <TableRow key={bt.id}>
                      <TableCell className="font-mono text-xs">{bt.id}</TableCell>
                      <TableCell>
                        <Link href={`/bowties/${bt.id}`} className="font-medium text-primary hover:underline">
                          {bt.title}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[28ch] truncate text-muted-foreground">{bt.topEvent}</TableCell>
                      <TableCell>{owner?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {bt.approvalState.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{bt.riskBeforeBarriers}</TableCell>
                      <TableCell className="text-right">{bt.riskAfterBarriers}</TableCell>
                      <TableCell className="text-right">{barrierCount}</TableCell>
                      <TableCell>{formatDate(bt.nextReviewDue)}</TableCell>
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
