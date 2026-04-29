'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckSquare, SearchX } from 'lucide-react';

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
import { formatDate, relativeDays } from '@/lib/utils';

const VALID_STATUS = new Set([
  'open',
  'in_progress',
  'pending_review',
  'overdue',
  'closed',
]);
const VALID_PRIORITY = new Set(['critical', 'high', 'medium', 'low']);

export default function ActionsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <ActionsInner />
    </Suspense>
  );
}

function ActionsInner() {
  const searchParams = useSearchParams();
  const actions = useDemoStore((s) => s.actions);
  const users = useDemoStore((s) => s.users);
  const scenarios = useDemoStore((s) => s.scenarios);

  const [q, setQ] = useState('');
  const [scenarioId, setScenarioId] = useState(searchParams?.get('scenarioId') ?? 'all');
  const [status, setStatus] = useState(() => {
    const s = searchParams?.get('status');
    return s && VALID_STATUS.has(s) ? s : 'all';
  });
  const [priority, setPriority] = useState(() => {
    const p = searchParams?.get('priority');
    return p && VALID_PRIORITY.has(p) ? p : 'all';
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return actions.filter((a) => {
      if (scenarioId !== 'all' && a.scenarioId !== scenarioId) return false;
      if (status !== 'all' && a.status !== status) return false;
      if (priority !== 'all' && a.priority !== priority) return false;
      if (term && !a.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [actions, q, scenarioId, status, priority]);

  return (
    <>
      <PageHeader
        title="Actions"
        description={`${actions.length} action${actions.length === 1 ? '' : 's'} sourced from audits, incidents, verifications, MOC and AI suggestions.`}
      />
      <div className="space-y-4 p-6">
        <RegisterToolbar
          search={{ value: q, onChange: setQ, placeholder: 'Search action title…' }}
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
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In progress' },
                { value: 'pending_review', label: 'Pending review' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'closed', label: 'Closed' },
              ],
            },
            {
              label: 'Priority',
              value: priority,
              onChange: setPriority,
              options: [
                { value: 'all', label: 'All priorities' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ],
            },
          ]}
          onClear={() => {
            setQ('');
            setScenarioId('all');
            setStatus('all');
            setPriority('all');
          }}
        />

        {actions.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No actions open" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No actions match these filters"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQ('');
                  setScenarioId('all');
                  setStatus('all');
                  setPriority('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div data-tour="actions-table" className="rounded-lg border">
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
                {filtered.map((a) => {
                  const owner = users.find((u) => u.id === a.ownerId);
                  const days = relativeDays(a.dueDate);
                  const overdue = a.status === 'overdue' || (days !== null && days < 0 && a.status !== 'closed');
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.id}</TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {a.source.replace(/_/g, ' ')}
                      </TableCell>
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
