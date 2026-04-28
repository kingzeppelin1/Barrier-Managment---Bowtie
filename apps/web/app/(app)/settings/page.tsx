'use client';

import { useState } from 'react';
import { Play, RotateCcw, Settings as SettingsIcon, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDemoStore } from '@/lib/store';
import { ROLE_LABEL, ROLE_DESCRIPTION } from '@/lib/rbac';
import { getAIProviderName } from '@/lib/ai';
import { dispatchTourStart } from '@/lib/tour/use-tour';
import type { Role } from '@bowtie/shared';

const ROLES: Role[] = ['risk_manager', 'barrier_owner', 'approver', 'auditor'];

export default function SettingsPage() {
  const resetDemoData = useDemoStore((s) => s.resetDemoData);
  const users = useDemoStore((s) => s.users);
  const scenarios = useDemoStore((s) => s.scenarios);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Demo configuration. There is no real backend — these settings live in your browser only."
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Demo data</CardTitle>
            </div>
            <CardDescription>
              The demo persists state in <code className="rounded bg-muted px-1 text-xs">localStorage</code> under
              the key <code className="rounded bg-muted px-1 text-xs">bowtie-demo-state-v1</code>. Resetting restores
              the seeded scenarios.
            </CardDescription>
            <div className="flex gap-3 pt-2">
              {confirming ? (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-2"
                    onClick={() => {
                      resetDemoData();
                      setConfirming(false);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" /> Yes, reset everything
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setConfirming(true)}>
                  <RotateCcw className="h-4 w-4" /> Reset demo data
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            <CardTitle>Personas (demo RBAC)</CardTitle>
            <CardDescription>Switch persona via the top-bar dropdown to see RBAC in effect.</CardDescription>
            <ul className="mt-2 space-y-2">
              {ROLES.map((role) => (
                <li key={role} className="flex items-start gap-3 rounded-md border p-3">
                  <Badge variant="outline" className="mt-0.5">
                    {ROLE_LABEL[role]}
                  </Badge>
                  <div className="text-sm text-muted-foreground">{ROLE_DESCRIPTION[role]}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Demo tools</CardTitle>
            </div>
            <CardDescription>
              Run the guided walkthrough — Dashboard → Bowtie Workspace → AI Coach → Action.
              Takes about a minute. Will create a demo follow-up Action; reset above to revert.
            </CardDescription>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => dispatchTourStart()}>
              <Play className="h-4 w-4" /> Restart Demo Tour
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-status-blue" />
              <CardTitle>AI Coach provider</CardTitle>
            </div>
            <CardDescription>
              The Coach is advisory only — every accepted suggestion is logged with a named human
              reviewer. The provider is selected by the{' '}
              <code className="rounded bg-muted px-1 text-xs">AI_PROVIDER</code> env variable.
            </CardDescription>
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">
                  Active provider:{' '}
                  <Badge variant="outline" className="ml-1 capitalize">
                    {getAIProviderName()}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Production AI requires an{' '}
                  <code className="rounded bg-muted px-1 text-[10px]">ANTHROPIC_API_KEY</code> env
                  variable. Switch is disabled until the key is configured.
                </p>
              </div>
              <Button size="sm" variant="outline" disabled>
                Switch to Anthropic Claude
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1 p-4 text-sm">
            <CardTitle>Loaded scenarios</CardTitle>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {scenarios.map((s) => (
                <li key={s.id}>
                  <span className="font-medium text-foreground">{s.name}</span> — {s.description}
                </li>
              ))}
            </ul>
            <div className="pt-2 text-xs text-muted-foreground">{users.length} demo users seeded.</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
