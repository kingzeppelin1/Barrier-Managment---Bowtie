'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Archive, ArchiveRestore, Copy, Eye, MoreHorizontal, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Bowtie } from '@bowtie/shared';

import { selectCurrentRole, useDemoStore } from '@/lib/store';
import { can } from '@/lib/rbac';

interface BowtieRowActionsProps {
  bowtie: Bowtie;
}

export function BowtieRowActions({ bowtie }: BowtieRowActionsProps) {
  const router = useRouter();
  const role = useDemoStore(selectCurrentRole);
  const archive = useDemoStore((s) => s.archiveBowtie);
  const restore = useDemoStore((s) => s.restoreBowtie);
  const copy = useDemoStore((s) => s.copyBowtieAsTemplate);

  const canEdit = can(role, 'bowtie:edit');
  const canCreate = can(role, 'bowtie:create');
  const canArchive = can(role, 'bowtie:archive');

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmCopy, setConfirmCopy] = useState(false);

  const archived = Boolean(bowtie.archivedAt);

  const handleExport = () => {
    if (typeof window !== 'undefined') {
      window.alert(
        `Export PDF for "${bowtie.title}" arrives in Slice 9 — a print-optimised route + window.print().`,
      );
    }
  };

  const handleCopy = () => {
    const newId = copy(bowtie.id);
    setConfirmCopy(false);
    if (newId) router.push(`/bowties/${newId}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Bowtie actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => router.push(`/bowties/${bowtie.id}`)} className="gap-2">
            <Eye className="h-4 w-4" /> View
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => canCreate && setConfirmCopy(true)}
            disabled={!canCreate}
            className="gap-2"
          >
            <Copy className="h-4 w-4" /> Copy as template
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExport} className="gap-2">
            <Printer className="h-4 w-4" /> Export PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {archived ? (
            <DropdownMenuItem
              onSelect={() => canEdit && restore(bowtie.id)}
              disabled={!canEdit}
              className="gap-2"
            >
              <ArchiveRestore className="h-4 w-4" /> Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => canArchive && setConfirmArchive(true)}
              disabled={!canArchive}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Archive className="h-4 w-4" /> Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive bowtie?</DialogTitle>
            <DialogDescription>
              {bowtie.title} will be hidden from the default library view. You can restore it from the
              archived view at any time. (No real backend — this only updates demo state.)
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmArchive(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                archive(bowtie.id);
                setConfirmArchive(false);
              }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmCopy} onOpenChange={setConfirmCopy}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy as template?</DialogTitle>
            <DialogDescription>
              Creates a new draft bowtie with the same hazard, top event and scope as &ldquo;{bowtie.title}&rdquo;,
              and an empty barrier set so you can build from a clean slate. The new bowtie starts in Draft.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCopy(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopy}>Create copy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
