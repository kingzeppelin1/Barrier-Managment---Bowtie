'use client';

import { Lightbulb } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDemoStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function IncidentsPage() {
  const incidents = useDemoStore((s) => s.incidents);
  const barriers = useDemoStore((s) => s.barriers);

  return (
    <>
      <PageHeader
        title="Incidents & Learnings"
        description="Recorded incidents and the barrier failures they trace back to."
      />
      <div className="space-y-3 p-6">
        {incidents.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No incidents on record" />
        ) : (
          incidents.map((i) => (
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
          ))
        )}
      </div>
    </>
  );
}
