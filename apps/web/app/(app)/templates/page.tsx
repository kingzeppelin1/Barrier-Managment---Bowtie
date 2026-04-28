'use client';

import { useMemo, useState } from 'react';
import { FileStack, SearchX } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { RegisterToolbar } from '@/components/common/register-toolbar';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDemoStore } from '@/lib/store';

export default function TemplatesPage() {
  const templates = useDemoStore((s) => s.templates);

  const [q, setQ] = useState('');
  const [industry, setIndustry] = useState('all');

  const industryOptions = useMemo(() => {
    const industries = Array.from(new Set(templates.map((t) => t.industry))).sort();
    return [
      { value: 'all', label: 'All industries' },
      ...industries.map((i) => ({ value: i, label: i })),
    ];
  }, [templates]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return templates.filter((t) => {
      if (industry !== 'all' && t.industry !== industry) return false;
      if (term && !`${t.name} ${t.description} ${t.hazard} ${t.topEvent}`.toLowerCase().includes(term))
        return false;
      return true;
    });
  }, [templates, q, industry]);

  const clear = () => {
    setQ('');
    setIndustry('all');
  };

  return (
    <>
      <PageHeader
        title="Templates"
        description="Pre-built bowtie starters by industry."
      />
      <div className="space-y-4 p-6">
        <RegisterToolbar
          search={{ value: q, onChange: setQ, placeholder: 'Search template name, hazard or top event…' }}
          selects={[
            {
              label: 'Industry',
              value: industry,
              onChange: setIndustry,
              options: industryOptions,
              width: 'w-[12rem]',
            },
          ]}
          onClear={clear}
        />

        {templates.length === 0 ? (
          <EmptyState icon={FileStack} title="No templates yet" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No templates match these filters"
            action={
              <Button variant="outline" size="sm" onClick={clear}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
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
