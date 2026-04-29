'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { CoachTrigger } from '@/components/ai-coach/coach-trigger';
import { RoleSwitcher } from './role-switcher';
import { DemoTourButton } from './demo-tour-button';

export function Topbar() {
  const t = useTranslations('topbar');
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search')}
          className="pl-8"
          aria-label={t('search')}
        />
      </div>
      <div className="flex-1" />
      <CoachTrigger />
      <DemoTourButton />
      <RoleSwitcher />
    </header>
  );
}
