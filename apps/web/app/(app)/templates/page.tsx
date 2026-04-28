'use client';

import { FileStack } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDemoStore } from '@/lib/store';

export default function TemplatesPage() {
  const templates = useDemoStore((s) => s.templates);

  return (
    <>
      <PageHeader
        title="Templates"
        description="Pre-built bowtie starters by industry."
      />
      <div className="p-6">
        {templates.length === 0 ? (
          <EmptyState icon={FileStack} title="No templates yet" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{t.name}</CardTitle>
                    <Badge variant="outline">{t.industry}</Badge>
                  </div>
                  <CardDescription>{t.description}</CardDescription>
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    <span>{t.threatCount} threats</span>
                    <span>{t.consequenceCount} consequences</span>
                    <span>{t.barrierCount} barriers</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
