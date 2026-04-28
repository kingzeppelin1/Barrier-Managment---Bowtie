'use client';

import { useMemo, useState } from 'react';
import { Gauge, SearchX } from 'lucide-react';

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

export default function PerformanceStandardsPage() {
  const standards = useDemoStore((s) => s.performanceStandards);
  const scenarios = useDemoStore((s) => s.scenarios);

  const [q, setQ] = useState('');
  const [scenarioId, setScenarioId] = useState('all');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return standards.filter((s) => {
      if (scenarioId !== 'all' && s.scenarioId !== scenarioId) return false;
      if (category !== 'all' && s.category !== category) return false;
      if (term && !`${s.name} ${s.criteria} ${s.source}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [standards, q, scenarioId, category]);

  const clear = () => {
    setQ('');
    setScenarioId('all');
    setCategory('all');
  };

  return (
    <>
      <PageHeader
        title="Performance Standards"
        description="Functional, response-time and reliability criteria each barrier must meet."
      />
      <div className="space-y-4 p-6">
        <RegisterToolbar
          search={{ value: q, onChange: setQ, placeholder: 'Search name, criteria or source…' }}
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
                { value: 'functionality', label: 'Functionality' },
                { value: 'availability', label: 'Availability' },
                { value: 'reliability', label: 'Reliability' },
                { value: 'survivability', label: 'Survivability' },
                { value: 'response_time', label: 'Response time' },
              ],
              width: 'w-[12rem]',
            },
          ]}
          onClear={clear}
        />

        {standards.length === 0 ? (
          <EmptyState icon={Gauge} title="No performance standards defined" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No standards match these filters"
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
                {filtered.map((s) => (
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
