'use client';

import { Gauge } from 'lucide-react';

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

export default function PerformanceStandardsPage() {
  const standards = useDemoStore((s) => s.performanceStandards);

  return (
    <>
      <PageHeader
        title="Performance Standards"
        description="Functional, response-time and reliability criteria each barrier must meet."
      />
      <div className="p-6">
        {standards.length === 0 ? (
          <EmptyState icon={Gauge} title="No performance standards defined" />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Applies to</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Effective</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standards.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.id}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {s.category.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.applicableBarrierIds.length} barrier(s)
                    </TableCell>
                    <TableCell className="max-w-[40ch] text-xs text-muted-foreground">{s.criteria}</TableCell>
                    <TableCell className="text-xs">{s.source}</TableCell>
                    <TableCell className="text-xs">{s.version}</TableCell>
                    <TableCell className="text-xs">{formatDate(s.effectiveDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
