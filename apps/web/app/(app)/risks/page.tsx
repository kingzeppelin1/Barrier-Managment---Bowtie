'use client';

import { TriangleAlert } from 'lucide-react';

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

export default function RiskRegisterPage() {
  const risks = useDemoStore((s) => s.risks);
  const users = useDemoStore((s) => s.users);

  return (
    <>
      <PageHeader
        title="Risk Register"
        description="Four-level risk: Inherent → Current → Residual → Target."
      />
      <div className="p-6">
        {risks.length === 0 ? (
          <EmptyState icon={TriangleAlert} title="No risks logged" />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Inherent</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Residual</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Acceptance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((r) => {
                  const owner = users.find((u) => u.id === r.ownerId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {r.category.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.inherentRisk}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.currentRisk}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.residualRisk}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.targetRisk}</TableCell>
                      <TableCell>{owner?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {r.acceptanceStatus.replace(/_/g, ' ')}
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
