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

export interface FilterSelectDef {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
  /** Optional pretty value-to-label mapping for the active-chip render. */
  width?: string;
}

interface RegisterToolbarProps {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  selects?: FilterSelectDef[];
  onClear?: () => void;
}

export function RegisterToolbar({ search, selects = [], onClear }: RegisterToolbarProps) {
  const activeSelects = selects.filter((s) => s.value !== 'all' && s.value !== '');
  const hasActive = (search?.value.trim().length ?? 0) > 0 || activeSelects.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {search && (
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? 'Search…'}
              className="pl-8"
            />
          </div>
        )}
        {selects.map((s) => (
          <Select key={s.label} value={s.value} onValueChange={s.onChange}>
            <SelectTrigger className={s.width ?? 'w-[10rem]'}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {s.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {hasActive && onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {hasActive && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {search && search.value.trim() && <Badge variant="outline">search: {search.value}</Badge>}
          {activeSelects.map((s) => {
            const opt = s.options.find((o) => o.value === s.value);
            return (
              <Badge key={s.label} variant="outline">
                {s.label.toLowerCase()}: {opt?.label ?? s.value}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
