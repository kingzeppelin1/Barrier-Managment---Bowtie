'use client';

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
import type { BarrierType, Criticality, HealthStatus } from '@bowtie/shared';

import { useDemoStore } from '@/lib/store';

export interface RegisterFilterValue {
  q: string;
  scenarioId: string; // 'all' | id
  status: HealthStatus | 'all';
  type: BarrierType | 'all';
  criticality: Criticality | 'all';
}

export const DEFAULT_REGISTER_FILTERS: RegisterFilterValue = {
  q: '',
  scenarioId: 'all',
  status: 'all',
  type: 'all',
  criticality: 'all',
};

interface Props {
  value: RegisterFilterValue;
  onChange: (next: RegisterFilterValue) => void;
}

export function RegisterFilters({ value, onChange }: Props) {
  const scenarios = useDemoStore((s) => s.scenarios);
  const set = (p: Partial<RegisterFilterValue>) => onChange({ ...value, ...p });
  const hasActive =
    value.q.trim() !== '' ||
    value.scenarioId !== 'all' ||
    value.status !== 'all' ||
    value.type !== 'all' ||
    value.criticality !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={value.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search barrier name or description…"
            className="pl-8"
          />
        </div>

        <Select value={value.scenarioId} onValueChange={(v) => set({ scenarioId: v })}>
          <SelectTrigger className="w-[12rem]">
            <SelectValue />
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

        <Select value={value.status} onValueChange={(v) => set({ status: v as HealthStatus | 'all' })}>
          <SelectTrigger className="w-[8.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="green">Green</SelectItem>
            <SelectItem value="yellow">Yellow</SelectItem>
            <SelectItem value="red">Red</SelectItem>
            <SelectItem value="gray">Unknown</SelectItem>
          </SelectContent>
        </Select>

        <Select value={value.type} onValueChange={(v) => set({ type: v as BarrierType | 'all' })}>
          <SelectTrigger className="w-[10rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="preventive">Preventive</SelectItem>
            <SelectItem value="mitigative">Mitigative</SelectItem>
            <SelectItem value="recovery">Recovery</SelectItem>
            <SelectItem value="control">Control</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={value.criticality}
          onValueChange={(v) => set({ criticality: v as Criticality | 'all' })}
        >
          <SelectTrigger className="w-[10rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All criticalities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_REGISTER_FILTERS)}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {hasActive && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {value.q && <Badge variant="outline">search: {value.q}</Badge>}
          {value.scenarioId !== 'all' && (
            <Badge variant="outline">
              scenario: {scenarios.find((s) => s.id === value.scenarioId)?.name ?? value.scenarioId}
            </Badge>
          )}
          {value.status !== 'all' && (
            <Badge variant="outline" className="capitalize">
              status: {value.status}
            </Badge>
          )}
          {value.type !== 'all' && (
            <Badge variant="outline" className="capitalize">
              type: {value.type}
            </Badge>
          )}
          {value.criticality !== 'all' && (
            <Badge variant="outline" className="capitalize">
              criticality: {value.criticality}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
