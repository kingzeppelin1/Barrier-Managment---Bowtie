import type { ReactNode } from 'react';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { HydrationGate } from './hydration-gate';
import { ToastHost } from '@/components/common/toast';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <HydrationGate />
      <Sidebar />
      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
