'use client';

import { ClipboardCheck } from 'lucide-react';

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

export default function VerificationsPage() {
  const verifications = useDemoStore((s) => s.verifications);
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);

  return (
    <>
      <PageHeader
        title="Verifications"
        description="Inspections, tests, drills and document reviews against performance standards."
      />
      <div className="p-6">
        {verifications.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No verifications recorded" />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Barrier</TableHead>
                  <TableHead>Performed by</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Next due</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map((v) => {
                  const barrier = barriers.find((b) => b.id === v.barrierId);
                  const performedBy = users.find((u) => u.id === v.performedById);
                  return (
                    <TableRow key={v.id}>
                      <TableCell>{formatDate(v.date)}</TableCell>
                      <TableCell className="font-medium">{barrier?.name ?? v.barrierId}</TableCell>
                      <TableCell>{performedBy?.name ?? '—'}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {v.method.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            v.result === 'pass' ? 'green' : v.result === 'fail' ? 'red' : 'yellow'
                          }
                          className="capitalize"
                        >
                          {v.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{v.evidence ?? '—'}</TableCell>
                      <TableCell>{formatDate(v.nextDue)}</TableCell>
                      <TableCell className="max-w-[40ch] text-xs text-muted-foreground">{v.comments ?? '—'}</TableCell>
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
