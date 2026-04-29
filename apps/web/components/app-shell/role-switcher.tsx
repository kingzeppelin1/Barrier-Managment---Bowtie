'use client';

import { ChevronDown, UserCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLE_LABEL, ROLE_DESCRIPTION } from '@/lib/rbac';
import { selectCurrentRole, selectCurrentUser, useDemoStore } from '@/lib/store';
import type { Role } from '@bowtie/shared';

const ALL_ROLES: Role[] = ['risk_manager', 'barrier_owner', 'approver', 'auditor'];

export function RoleSwitcher() {
  const t = useTranslations('topbar');
  const currentUser = useDemoStore(selectCurrentUser);
  const currentRole = useDemoStore(selectCurrentRole);
  const setRole = useDemoStore((s) => s.setRole);
  const hydrated = useDemoStore((s) => s.hydrated);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle2 className="h-4 w-4" />
          <span className="max-w-[18ch] truncate">
            {hydrated && currentUser ? `${currentUser.name} · ${ROLE_LABEL[currentRole]}` : t('loading')}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{t('switchPersona')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_ROLES.map((role) => (
          <DropdownMenuItem
            key={role}
            onSelect={() => setRole(role)}
            className="flex flex-col items-start gap-0.5"
          >
            <span className="text-sm font-medium">{ROLE_LABEL[role]}</span>
            <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTION[role]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
