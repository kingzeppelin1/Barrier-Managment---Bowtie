'use client';

import { Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';

/**
 * AI Coach Inbox — placeholder. Slice 15 fills this in with a global view
 * of pending suggestions across all bowties.
 */
export default function AiCoachInboxPage() {
  return (
    <>
      <PageHeader title="AI Coach Inbox" description="Pending suggestions across all bowties." />
      <div className="p-6">
        <EmptyState
          icon={Sparkles}
          title="Inbox view arrives in Slice 15"
          description="Per-bowtie Coach panels are already live — open any bowtie and use the topbar Coach button. The cross-bowtie inbox view is queued for the next batch."
        />
      </div>
    </>
  );
}
