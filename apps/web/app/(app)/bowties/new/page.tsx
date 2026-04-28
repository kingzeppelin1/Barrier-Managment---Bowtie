'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { WizardShell } from '@/components/bowtie/wizard/wizard-shell';
import { WizardBody } from '@/components/bowtie/wizard/wizard-body';
import { WizardFooter } from '@/components/bowtie/wizard/wizard-footer';
import { Step1Scope, Step2Hazard, Step3TopEvent } from '@/components/bowtie/wizard/steps-1-3';
import { Step4Threats, Step5Consequences } from '@/components/bowtie/wizard/steps-4-5';
import { Step6PreventiveBarriers, Step7MitigativeBarriers } from '@/components/bowtie/wizard/steps-6-7';
import { Step8DegradationFactors, Step9DegradationControls } from '@/components/bowtie/wizard/steps-8-9';
import { Step10Risk, Step11Actions, Step12Review } from '@/components/bowtie/wizard/steps-10-12';
import { selectCurrentRole, useDemoStore } from '@/lib/store';
import { defaultDraft } from '@/lib/wizard/steps';

export default function NewBowtiePage() {
  const router = useRouter();
  const role = useDemoStore(selectCurrentRole);
  const draft = useDemoStore((s) => s.wizardDraft);
  const setDraft = useDemoStore((s) => s.setWizardDraft);
  const submit = useDemoStore((s) => s.submitWizardDraft);
  const currentUserId = useDemoStore((s) => s.currentUserId);
  const scenarios = useDemoStore((s) => s.scenarios);
  const hydrated = useDemoStore((s) => s.hydrated);

  const [submitting, setSubmitting] = useState(false);

  // Lazily initialise a draft only after hydration so we don't double-create
  // one before the persisted state arrives.
  useEffect(() => {
    if (!hydrated) return;
    if (draft) return;
    if (role === 'auditor') return;
    const firstScenario = scenarios[0]?.id ?? '';
    setDraft(defaultDraft(firstScenario, currentUserId));
  }, [hydrated, draft, role, scenarios, currentUserId, setDraft]);

  // Auditor gate.
  if (role === 'auditor') {
    return (
      <>
        <PageHeader title="New Bowtie · Builder Wizard" />
        <div className="p-6">
          <EmptyState
            icon={Lock}
            title="Auditors are read-only"
            description="The Auditor persona cannot create or modify bowties. Switch persona via the top-bar dropdown."
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

  if (!hydrated || !draft) {
    return (
      <>
        <PageHeader title="New Bowtie · Builder Wizard" />
        <div className="p-6 text-sm text-muted-foreground">Loading draft…</div>
      </>
    );
  }

  const handleSubmit = () => {
    setSubmitting(true);
    const id = submit();
    if (id) {
      router.push(`/bowties/${id}`);
    } else {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Bowtie · Builder Wizard"
        description="Guided 12-step bowtie creation. Auto-saves to your browser as you type."
      />
      <WizardShell draft={draft}>
        <WizardBody draft={draft}>
          {draft.step === 1 && <Step1Scope draft={draft} />}
          {draft.step === 2 && <Step2Hazard draft={draft} />}
          {draft.step === 3 && <Step3TopEvent draft={draft} />}
          {draft.step === 4 && <Step4Threats draft={draft} />}
          {draft.step === 5 && <Step5Consequences draft={draft} />}
          {draft.step === 6 && <Step6PreventiveBarriers draft={draft} />}
          {draft.step === 7 && <Step7MitigativeBarriers draft={draft} />}
          {draft.step === 8 && <Step8DegradationFactors draft={draft} />}
          {draft.step === 9 && <Step9DegradationControls draft={draft} />}
          {draft.step === 10 && <Step10Risk draft={draft} />}
          {draft.step === 11 && <Step11Actions draft={draft} />}
          {draft.step === 12 && <Step12Review draft={draft} />}
        </WizardBody>
        <WizardFooter draft={draft} onSubmit={handleSubmit} submitting={submitting} />
      </WizardShell>
    </>
  );
}
