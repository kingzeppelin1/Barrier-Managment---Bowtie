'use client';

import { useMemo, useState } from 'react';
import { Lightbulb, SearchX } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { RegisterToolbar } from '@/components/common/register-toolbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function IncidentsPage() {
  const incidents = useDemoStore((s) => s.incidents);
  const barriers = useDemoStore((s) => s.barriers);
  const scenarios = useDemoStore((s) => s.scenarios);

  const [q, setQ] = useState('');
  const [scenarioId, setScenarioId] = useState('all');
  const [severity, setSeverity] = useState('all');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return incidents.filter((i) => {
      if (scenarioId !== 'all' && i.scenarioId !== scenarioId) return false;
      if (severity !== 'all' && i.severity !== severity) return false;
      if (term && !`${i.title} ${i.description} ${i.learnings}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [incidents, q, scenarioId, severity]);

  const clear = () => {
    setQ('');
    setScenarioId('all');
    setSeverity('all');
  };

  return (
    <>
      <PageHeader
        title="Incidents & Learnings"
        description="Recorded incidents and the barrier failures they trace back to."
      />
      <div className="space-y-4 p-6">
        <RegisterToolbar
          search={{ value: q, onChange: setQ, placeholder: 'Search incident title, description or learning…' }}
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
              label: 'Severity',
              value: severity,
              onChange: setSeverity,
              options: [
                { value: 'all', label: 'All severities' },
                { value: 'catastrophic', label: 'Catastrophic' },
                { value: 'major', label: 'Major' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'minor', label: 'Minor' },
                { value: 'near_miss', label: 'Near miss' },
              ],
              width: 'w-[11rem]',
            },
          ]}
          onClear={clear}
        />

        {incidents.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No incidents on record" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No incidents match these filters"
            action={
              <Button variant="outline" size="sm" onClick={clear}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((i) => (
              <Card key={i.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{i.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(i.date)} · {i.id}
                      </div>
                    </div>
                    <Badge
                      variant={
                        i.severity === 'catastrophic' || i.severity === 'major'
                          ? 'red'
                          : i.severity === 'moderate'
                            ? 'yellow'
                            : 'outline'
                      }
                      className="capitalize"
                    >
                      {i.severity.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm">{i.description}</p>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Learning: </span>
                    {i.learnings}
                  </div>
                  {i.barrierFailures.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      <span className="text-muted-foreground">Barrier failures:</span>
                      {i.barrierFailures.map((bid) => {
                        const b = barriers.find((br) => br.id === bid);
                        return (
                          <Badge key={bid} variant="outline">
                            {b?.name ?? bid}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
