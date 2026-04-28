'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Minimal toast: a single message at a time, dispatched via the
 * 'bowtie-toast' CustomEvent. Auto-dismisses after 4.5s.
 *
 * Mounted once in the AppShell. Anywhere else in the app:
 *   window.dispatchEvent(new CustomEvent('bowtie-toast', { detail: 'Message' }));
 */
export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setMessage(detail);
    }
    window.addEventListener('bowtie-toast', handler);
    return () => window.removeEventListener('bowtie-toast', handler);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div
      className={cn(
        'no-print pointer-events-auto fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-2 rounded-md border bg-card p-3 shadow-lg',
        'animate-in fade-in-0 slide-in-from-bottom-2',
      )}
      role="status"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-green" />
      <div className="text-sm">{message}</div>
      <button
        type="button"
        onClick={() => setMessage(null)}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Helper for dispatching toasts from anywhere. */
export function showToast(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bowtie-toast', { detail: message }));
  }
}
