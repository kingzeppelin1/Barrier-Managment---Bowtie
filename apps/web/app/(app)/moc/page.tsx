'use client';

import { useMemo, useState } from 'react';
import { GitBranch, SearchX } from 'lucide-react';

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

export default function MocPage() {
  const mocs = useDemoStore((s) => s.mocs);
  const users = useDemoStore((s) => s.users);
  const scenarios = useDemoStore((s) => s.scenarios);

  const [q, setQ] = useState('');
  const [scenarioId, setScenarioId] = useState('all');
  const [status, setStatus] = useState('all');
  const [changeType, setChangeType] = useState('all');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return mocs.filter((m) => {
      if (scenarioId !== 'all' && m.scenarioId !== scenarioId) return false;
      if (status !== 'all' && m.status !== status) return false;
      if (changeType !== 'all' && m.changeType !== changeType) return false;
      if (term && !`${m.title} ${m.riskAssessmentSummary}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [mocs, q, scenarioId, status, changeType]);

  const clear = () => {
    setQ('');
    setScenarioId('all');
    setStatus('all');
    setChangeType('all');
  };

  return (
    <>
      <PageHeader
        title="MOC Impact"
        description="Management-of-Change requests that touch one or more bowties or barriers."
      />
      <div className="space-y-4 p-6">
        <RegisterToolbar
          search={{ value: q, onChange: setQ, placeholder: 'Search MOC title or summary…' }}
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
                { value: 'proposed', label: 'Proposed' },
                { value: 'in_review', label: 'In review' },
                { value: 'approved', label: 'Approved' },
                { value: 'implemented', label: 'Implemented' },
                { value: 'closed', label: 'Closed' },
              ],
            },
            {
              label: 'Type',
              value: changeType,
              onChange: setChangeType,
              options: [
                { value: 'all', label: 'All types' },
                { value: 'process', label: 'Process' },
                { value: 'organizational', label: 'Organisational' },
                { value: 'technology', label: 'Technology' },
                { value: 'procedure', label: 'Procedure' },
              ],
            },
          ]}
          onClear={clear}
        />

        {mocs.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No active MOCs"
            description="Once you change a published bowtie, an MOC is required."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No MOCs match these filters"
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
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Initiated</TableHead>
                  <TableHead>Affects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
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
