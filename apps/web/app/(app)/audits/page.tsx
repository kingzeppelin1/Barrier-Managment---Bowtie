'use client';

import { useMemo, useState } from 'react';
import { ScrollText, SearchX } from 'lucide-react';

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

export default function AuditsPage() {
  const audits = useDemoStore((s) => s.audits);
  const users = useDemoStore((s) => s.users);
  const scenarios = useDemoStore((s) => s.scenarios);

  const [q, setQ] = useState('');
  const [scenarioId, setScenarioId] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return audits.filter((a) => {
      if (scenarioId !== 'all' && a.scenarioId !== scenarioId) return false;
      if (status !== 'all' && a.status !== status) return false;
      if (term && !`${a.title} ${a.scope}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [audits, q, scenarioId, status]);

  const clear = () => {
    setQ('');
    setScenarioId('all');
    setStatus('all');
  };

  return (
    <>
      <PageHeader
        title="Audits"
        description="Internal and third-party audits across the operating estate."
      />
      <div className="space-y-4 p-6">
        <RegisterToolbar
          search={{ value: q, onChange: setQ, placeholder: 'Search audit title or scope…' }}
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
              label: 'Status',
              value: status,
              onChange: setStatus,
              options: [
                { value: 'all', label: 'All status' },
                { value: 'planned', label: 'Planned' },
                { value: 'in_progress', label: 'In progress' },
                { value: 'reporting', label: 'Reporting' },
                { value: 'closed', label: 'Closed' },
              ],
            },
          ]}
          onClear={clear}
        />

        {audits.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audits scheduled" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No audits match these filters"
            action={
              <Button variant="outline" size="sm" onClick={clear}>
                Clear filters
              </Button>
            }
          />
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
                {filtered.map((a) => {
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
