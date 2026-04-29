'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for ACCUMULATING filter state into the URL.
 *
 * Returns a setter that takes a partial map of `{ key: value | null }`:
 *   - non-empty values are written to the URL
 *   - `null`, `undefined`, '' and 'all' are removed from the URL
 *   - any other params currently in the URL are preserved
 *
 * Updates use `router.replace` (history is not polluted by every keystroke).
 *
 * Example: a user lands on /barriers?criticality=critical and adds a
 * scenario filter; the URL becomes ?criticality=critical&scenarioId=sc-x
 * — not just ?scenarioId=sc-x.
 */
export function useUrlFilterSync(): (
  patch: Record<string, string | null | undefined>,
) => void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (patch) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === '' || v === 'all') {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      }
      const qs = params.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      router.replace(next as Parameters<typeof router.replace>[0], { scroll: false });
    },
    [pathname, searchParams, router],
  );
}
