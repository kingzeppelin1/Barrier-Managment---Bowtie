'use client';

import { Shield } from 'lucide-react';

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
import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function BarrierRegisterPage() {
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);
  const actions = useDemoStore((s) => s.actions);

  return (
    <>
      <PageHeader
        title="Barrier Register"
        description="All barriers across scenarios. Filtering, grouping and edit panes arrive in Slice 7."
      />
      <div className="p-6">
        {barriers.length === 0 ? (
          <EmptyState icon={Shield} title="No barriers in the register" />
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
                  <TableHead className="text-right">Open actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barriers.map((b) => {
                  const owner = users.find((u) => u.id === b.ownerId);
                  const openActions = actions.filter(
                    (a) => a.barrierId === b.id && a.status !== 'closed',
                  ).length;
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
                      <TableCell>{owner?.name ?? <span className="text-status-red">— gap</span>}</TableCell>
                      <TableCell className="text-right tabular-nums">{b.healthScore}</TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} withCompensatory={b.withCompensatory} />
                      </TableCell>
                      <TableCell>{formatDate(b.lastVerifiedAt)}</TableCell>
                      <TableCell>{formatDate(b.nextVerificationDue)}</TableCell>
                      <TableCell className="text-right tabular-nums">{openActions}</TableCell>
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
