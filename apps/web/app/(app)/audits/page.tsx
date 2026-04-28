'use client';

import { ScrollText } from 'lucide-react';

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

export default function AuditsPage() {
  const audits = useDemoStore((s) => s.audits);
  const users = useDemoStore((s) => s.users);

  return (
    <>
      <PageHeader
        title="Audits"
        description="Internal and third-party audits across the operating estate."
      />
      <div className="p-6">
        {audits.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audits scheduled" />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Findings</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((a) => {
                  const auditor = users.find((u) => u.id === a.auditorId);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.id}</TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell className="max-w-[40ch] text-xs text-muted-foreground">{a.scope}</TableCell>
                      <TableCell>{auditor?.name ?? '—'}</TableCell>
                      <TableCell>{formatDate(a.date)}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.findings}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {a.status.replace(/_/g, ' ')}
                        </Badge>
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
