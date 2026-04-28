'use client';

import { useMemo, useState } from 'react';
import { TriangleAlert, SearchX } from 'lucide-react';

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

export default function RiskRegisterPage() {
  const risks = useDemoStore((s) => s.risks);
  const users = useDemoStore((s) => s.users);
  const scenarios = useDemoStore((s) => s.scenarios);

  const [q, setQ] = useState('');
  const [scenarioId, setScenarioId] = useState('all');
  const [category, setCategory] = useState('all');
  const [acceptance, setAcceptance] = useState('all');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return risks.filter((r) => {
      if (scenarioId !== 'all' && r.scenarioId !== scenarioId) return false;
      if (category !== 'all' && r.category !== category) return false;
      if (acceptance !== 'all' && r.acceptanceStatus !== acceptance) return false;
      if (term && !r.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [risks, q, scenarioId, category, acceptance]);

  return (
    <>
      <PageHeader
        title="Risk Register"
        description="Four-level risk: Inherent → Current → Residual → Target."
      />
      <div className="space-y-4 p-6">
        <RegisterToolbar
          search={{ value: q, onChange: setQ, placeholder: 'Search risk title…' }}
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
              label: 'Category',
              value: category,
              onChange: setCategory,
              options: [
                { value: 'all', label: 'All categories' },
                { value: 'safety', label: 'Safety' },
                { value: 'environmental', label: 'Environmental' },
                { value: 'asset', label: 'Asset' },
                { value: 'reputation', label: 'Reputation' },
                { value: 'financial', label: 'Financial' },
                { value: 'patient_safety', label: 'Patient safety' },
              ],
              width: 'w-[12rem]',
            },
            {
              label: 'Acceptance',
              value: acceptance,
              onChange: setAcceptance,
              options: [
                { value: 'all', label: 'All acceptance' },
                { value: 'pending', label: 'Pending' },
                { value: 'alarp_justified', label: 'ALARP justified' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'unacceptable', label: 'Unacceptable' },
              ],
              width: 'w-[12rem]',
            },
          ]}
          onClear={() => {
            setQ('');
            setScenarioId('all');
            setCategory('all');
            setAcceptance('all');
          }}
        />

        {risks.length === 0 ? (
          <EmptyState icon={TriangleAlert} title="No risks logged" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No risks match these filters"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQ('');
                  setScenarioId('all');
                  setCategory('all');
                  setAcceptance('all');
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
                {filtered.map((r) => {
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
                        <Badge
                          variant={
                            r.acceptanceStatus === 'accepted' || r.acceptanceStatus === 'alarp_justified'
                              ? 'green'
                              : r.acceptanceStatus === 'unacceptable'
                                ? 'red'
                                : 'outline'
                          }
                          className="capitalize"
                        >
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
