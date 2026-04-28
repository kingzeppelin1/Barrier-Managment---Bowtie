'use client';

import { useMemo, useState } from 'react';
import { ClipboardCheck, SearchX } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { RegisterToolbar } from '@/components/common/register-toolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function VerificationsPage() {
  const verifications = useDemoStore((s) => s.verifications);
  const barriers = useDemoStore((s) => s.barriers);
  const users = useDemoStore((s) => s.users);
  const scenarios = useDemoStore((s) => s.scenarios);

  const [q, setQ] = useState('');
  const [scenarioId, setScenarioId] = useState('all');
  const [method, setMethod] = useState('all');
  const [result, setResult] = useState('all');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return verifications.filter((v) => {
      if (scenarioId !== 'all' && v.scenarioId !== scenarioId) return false;
      if (method !== 'all' && v.method !== method) return false;
      if (result !== 'all' && v.result !== result) return false;
      if (term) {
        const barrier = barriers.find((b) => b.id === v.barrierId);
        const hay = `${barrier?.name ?? ''} ${v.comments ?? ''} ${v.evidence ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [verifications, barriers, q, scenarioId, method, result]);

  return (
    <>
      <PageHeader
        title="Verifications"
        description="Inspections, tests, drills and document reviews against performance standards."
      />
      <div className="space-y-4 p-6">
        <RegisterToolbar
          search={{ value: q, onChange: setQ, placeholder: 'Search barrier name or comments…' }}
          selects={[
            {
              label: 'Scenario',
              value: scenarioId,
              onChange: setScenarioId,
              options: [
                { value: 'all', label: 'All scenarios' },
                ...scenarios.map((s) => ({ value: s.id, label: s.name })),
              ],
              width: 'w-[12rem]',
            },
            {
              label: 'Method',
              value: method,
              onChange: setMethod,
              options: [
                { value: 'all', label: 'All methods' },
                { value: 'inspection', label: 'Inspection' },
                { value: 'test', label: 'Test' },
                { value: 'drill', label: 'Drill' },
                { value: 'audit', label: 'Audit' },
                { value: 'document_review', label: 'Document review' },
              ],
              width: 'w-[11rem]',
            },
            {
              label: 'Result',
              value: result,
              onChange: setResult,
              options: [
                { value: 'all', label: 'All results' },
                { value: 'pass', label: 'Pass' },
                { value: 'partial', label: 'Partial' },
                { value: 'fail', label: 'Fail' },
                { value: 'inconclusive', label: 'Inconclusive' },
              ],
            },
          ]}
          onClear={() => {
            setQ('');
            setScenarioId('all');
            setMethod('all');
            setResult('all');
          }}
        />

        {verifications.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No verifications recorded" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No verifications match these filters"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQ('');
                  setScenarioId('all');
                  setMethod('all');
                  setResult('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
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
                {filtered.map((v) => {
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
