'use client';

import { GitBranch } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function MocPage() {
  const mocs = useDemoStore((s) => s.mocs);
  const users = useDemoStore((s) => s.users);

  return (
    <>
      <PageHeader
        title="MOC Impact"
        description="Management-of-Change requests that touch one or more bowties or barriers."
      />
      <div className="p-6">
        {mocs.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No active MOCs"
            description="Once you change a published bowtie, an MOC is required."
          />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Initiated</TableHead>
                  <TableHead>Affects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mocs.map((m) => {
                  const owner = users.find((u) => u.id === m.ownerId);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.id}</TableCell>
                      <TableCell className="font-medium">{m.title}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{m.changeType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {m.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{owner?.name ?? '—'}</TableCell>
                      <TableCell>{formatDate(m.initiatedAt)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.affectedBowtieIds.length} bowtie(s) · {m.affectedBarrierIds.length} barrier(s)
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
