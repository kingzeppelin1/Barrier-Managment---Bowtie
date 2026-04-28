'use client';

import { use } from 'react';
import Link from 'next/link';
import { Workflow } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDemoStore } from '@/lib/store';

export default function BowtieWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const bowtie = useDemoStore((s) => s.bowties.find((b) => b.id === id));
  const threats = useDemoStore((s) => s.threats.filter((t) => t.bowtieId === id));
  const consequences = useDemoStore((s) => s.consequences.filter((c) => c.bowtieId === id));
  const barriers = useDemoStore((s) =>
    s.barriers.filter((b) => b.bowtieIds.includes(id)),
  );

  if (!bowtie) {
    return (
      <>
        <PageHeader title="Bowtie Workspace" description={`No bowtie found for id ${id}.`} />
        <div className="p-6">
          <EmptyState
            icon={Workflow}
            title="Bowtie not found"
            description="It may have been archived. Pick another from the library."
            action={
              <Button asChild size="sm">
                <Link href="/bowties">Back to library</Link>
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={bowtie.title}
        description={`${bowtie.assetOrProcess} · Top event: ${bowtie.topEvent}`}
        actions={
          <>
            <Badge variant="outline" className="capitalize">
              {bowtie.approvalState.replace(/_/g, ' ')}
            </Badge>
            <Button size="sm" variant="outline" disabled>
              Open canvas
            </Button>
          </>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Threats</div>
              <div className="mt-1 text-2xl font-semibold">{threats.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Barriers</div>
              <div className="mt-1 text-2xl font-semibold">{barriers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Consequences</div>
              <div className="mt-1 text-2xl font-semibold">{consequences.length}</div>
            </CardContent>
          </Card>
        </div>
        <EmptyState
          icon={Workflow}
          title="Visual canvas arrives in Slice 5"
          description="React Flow canvas with custom barrier/threat/consequence/DF nodes, color-coded by health, and a click-to-open detail panel."
        />
      </div>
    </>
  );
}
