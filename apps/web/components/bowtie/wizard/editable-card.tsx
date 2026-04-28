'use client';

import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditableCardProps {
  index: number;
  total: number;
  label: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  removeDisabled?: boolean;
  toneClassName?: string;
  children: ReactNode;
}

export function EditableCard({
  index,
  total,
  label,
  onMoveUp,
  onMoveDown,
  onRemove,
  removeDisabled,
  toneClassName,
  children,
}: EditableCardProps) {
  return (
    <div className={cn('rounded-md border bg-card p-3', toneClassName)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums">
            {index + 1}
          </span>
          <span className="uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={index === total - 1}
            onClick={onMoveDown}
            aria-label="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            disabled={removeDisabled}
            onClick={onRemove}
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

// -- Generic move helpers (immutable) ------------------------------------

export function moveUp<T>(list: T[], idx: number): T[] {
  if (idx <= 0) return list;
  const next = [...list];
  const tmp = next[idx - 1]!;
  next[idx - 1] = next[idx]!;
  next[idx] = tmp;
  return next;
}

export function moveDown<T>(list: T[], idx: number): T[] {
  if (idx >= list.length - 1) return list;
  const next = [...list];
  const tmp = next[idx + 1]!;
  next[idx + 1] = next[idx]!;
  next[idx] = tmp;
  return next;
}

export function removeAt<T>(list: T[], idx: number): T[] {
  const next = [...list];
  next.splice(idx, 1);
  return next;
}
