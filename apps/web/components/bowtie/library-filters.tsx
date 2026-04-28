'use client';

import { useMemo } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ApprovalState } from '@bowtie/shared';

import { useDemoStore } from '@/lib/store';

export interface LibraryFilterValue {
  q: string;
  scenarioId: string; // 'all' | scenario id
  approvalState: ApprovalState | 'all';
  ownerId: string; // 'all' | user id
  showArchived: boolean;
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFilterValue = {
  q: '',
  scenarioId: 'all',
  approvalState: 'all',
  ownerId: 'all',
  showArchived: false,
};

interface LibraryFiltersProps {
  value: LibraryFilterValue;
  onChange: (next: LibraryFilterValue) => void;
}

const APPROVAL_STATES: { value: ApprovalState | 'all'; label: string }[] = [
  { value: 'all', label: 'All states' },
  { value: 'draft', label: 'Draft' },
  { value: 'internal_review', label: 'Internal review' },
  { value: 'sme_review', label: 'SME review' },
  { value: 'risk_manager_review', label: 'Risk manager review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
];

export function LibraryFilters({ value, onChange }: LibraryFiltersProps) {
  const scenarios = useDemoStore((s) => s.scenarios);
  const users = useDemoStore((s) => s.users);
  const bowties = useDemoStore((s) => s.bowties);

  const ownerOptions = useMemo(() => {
    const ids = new Set(bowties.map((b) => b.ownerId));
    return users.filter((u) => ids.has(u.id));
  }, [users, bowties]);

  const set = (patch: Partial<LibraryFilterValue>) => onChange({ ...value, ...patch });

  const hasActive =
    value.q.trim() !== '' ||
    value.scenarioId !== 'all' ||
    value.approvalState !== 'all' ||
    value.ownerId !== 'all' ||
    value.showArchived;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={value.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search title, hazard, top event…"
            className="pl-8"
            aria-label="Search bowties"
          />
        </div>

        <Select value={value.scenarioId} onValueChange={(v) => set({ scenarioId: v })}>
          <SelectTrigger className="w-[12rem]">
            <SelectValue placeholder="Scenario" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scenarios</SelectItem>
            {scenarios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.approvalState}
          onValueChange={(v) => set({ approvalState: v as ApprovalState | 'all' })}
        >
          <SelectTrigger className="w-[12rem]">
            <SelectValue placeholder="Approval state" />
          </SelectTrigger>
          <SelectContent>
            {APPROVAL_STATES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.ownerId} onValueChange={(v) => set({ ownerId: v })}>
          <SelectTrigger className="w-[10rem]">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {ownerOptions.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={value.showArchived ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => set({ showArchived: !value.showArchived })}
        >
          {value.showArchived ? 'Hide archived' : 'Show archived'}
        </Button>

        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_LIBRARY_FILTERS)}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {hasActive && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {value.q && (
            <Badge variant="outline">
              search: <span className="ml-1 font-mono">{value.q}</span>
            </Badge>
          )}
          {value.scenarioId !== 'all' && (
            <Badge variant="outline">
              scenario: {scenarios.find((s) => s.id === value.scenarioId)?.name ?? value.scenarioId}
            </Badge>
          )}
          {value.approvalState !== 'all' && (
            <Badge variant="outline" className="capitalize">
              state: {value.approvalState.replace(/_/g, ' ')}
            </Badge>
          )}
          {value.ownerId !== 'all' && (
            <Badge variant="outline">
              owner: {users.find((u) => u.id === value.ownerId)?.name ?? value.ownerId}
            </Badge>
          )}
          {value.showArchived && <Badge variant="outline">incl. archived</Badge>}
        </div>
      )}
    </div>
  );
}
