'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

/**
 * STAR Suite sidebar — dark navy with mint/teal accents, matching the
 * STAR Suite reference screens. Active items get a teal left accent +
 * white text on a faint mint overlay; inactive items are mint at low
 * contrast and lift to white on hover.
 */
export function Sidebar() {
  const pathname = usePathname();
  const tNavItems = useTranslations('nav.items');
  const tNavGroups = useTranslations('nav.groups');
  const tNav = useTranslations('nav');
  const tApp = useTranslations('app');

  const groups: { key: string; items: typeof NAV_ITEMS }[] = [];
  for (const item of NAV_ITEMS) {
    const last = groups.at(-1);
    const key = item.groupKey ?? '';
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, items: [item] });
    }
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-star-navy bg-star-navy text-white">
      {/* Header lockup: shield + STAR Suite + module label */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-star-teal text-white shadow-sm">
          <Shield className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-white">{tApp('suite')}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-star-teal">
            {tApp('tagline')}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.key || 'ungrouped'} className="mb-3">
            {group.key && (
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                {tNavGroups(group.key)}
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
                        'group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute -left-2 top-1.5 h-5 w-0.5 rounded-r bg-star-teal"
                        />
                      )}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-star-teal' : 'text-white/60 group-hover:text-white/90',
                        )}
                      />
                      <span className="truncate">{tNavItems(item.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3 text-[11px] text-white/50">{tNav('footer')}</div>
    </aside>
  );
}
