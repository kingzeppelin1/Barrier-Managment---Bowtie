'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield } from 'lucide-react';

import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-config';

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/dashboard') return pathname === '/' || pathname.startsWith('/dashboard');
  // Workspace shortcut should not light up on the Library route.
  if (href.startsWith('/bowties/') && href !== '/bowties/new') {
    return pathname.startsWith('/bowties/') && !pathname.endsWith('/new');
  }
  if (href === '/bowties') return pathname === '/bowties';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname();

  // Render items grouped by their `group` field, preserving order.
  const groups: { name: string; items: typeof NAV_ITEMS }[] = [];
  for (const item of NAV_ITEMS) {
    const last = groups.at(-1);
    const groupName = item.group ?? '';
    if (last && last.name === groupName) {
      last.items.push(item);
    } else {
      groups.push({ name: groupName, items: [item] });
    }
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Shield className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Bowtie</span>
          <span className="text-[11px] text-muted-foreground">Barrier Management</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.name} className="mb-3">
            {group.name && (
              <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.name}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/80 hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-3 text-[11px] text-muted-foreground">
        Demo build — no real backend
      </div>
    </aside>
  );
}
