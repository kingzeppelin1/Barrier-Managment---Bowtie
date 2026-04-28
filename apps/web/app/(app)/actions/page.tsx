'use client';

import { CheckSquare } from 'lucide-react';

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
import { formatDate, relativeDays } from '@/lib/utils';

export default function ActionsPage() {
  const actions = useDemoStore((s) => s.actions);
  const users = useDemoStore((s) => s.users);

  return (
    <>
      <PageHeader
        title="Actions"
        description="Action / CAPA list — sourced from audits, incidents, verifications, MOC and AI suggestions."
      />
      <div className="p-6">
        {actions.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No actions open" />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((a) => {
                  const owner = users.find((u) => u.id === a.ownerId);
                  const days = relativeDays(a.dueDate);
                  const overdue = a.status === 'overdue' || (days !== null && days < 0 && a.status !== 'closed');
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.id}</TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{a.source.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{owner?.name ?? '—'}</TableCell>
                      <TableCell>
                        <span className={overdue ? 'text-status-red' : ''}>
                          {formatDate(a.dueDate)}
                          {days !== null && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              {days >= 0 ? `in ${days}d` : `${Math.abs(days)}d ago`}
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {a.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === 'closed' ? 'green' : a.status === 'overdue' ? 'red' : 'outline'
                          }
                          className="capitalize"
                        >
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
