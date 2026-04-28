import { FileText } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const REPORTS = [
  { id: 'bowtie', title: 'Bowtie report', description: 'Per-bowtie summary with barriers, threats and consequences.' },
  { id: 'barrier-health', title: 'Barrier health report', description: 'Distribution of barrier health scores across the estate.' },
  { id: 'critical-barriers', title: 'Critical barriers report', description: 'All critical barriers with current status and owners.' },
  { id: 'overdue-verification', title: 'Overdue verifications', description: 'Barriers past their next-verification date.' },
  { id: 'open-actions', title: 'Open actions', description: 'All actions not yet closed, by owner and due date.' },
  { id: 'risk-exposure', title: 'Risk exposure', description: 'Four-level risk profile across the register.' },
  { id: 'alarp', title: 'ALARP justification', description: 'Justification trail for risks accepted at ALARP.' },
  { id: 'audit-readiness', title: 'Audit readiness', description: 'Snapshot for upcoming external audit.' },
  { id: 'management-summary', title: 'Management summary', description: 'One-page rollup for the leadership review.' },
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Print-optimised reports — Slice 9 wires PDF export via @media print + window.print()."
      />
      <div className="grid gap-3 p-6 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.id} className="flex flex-col">
            <CardContent className="flex-1 space-y-2 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle>{r.title}</CardTitle>
              </div>
              <CardDescription>{r.description}</CardDescription>
            </CardContent>
            <div className="border-t p-3">
              <Button size="sm" variant="outline" disabled>
                Open print view
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
