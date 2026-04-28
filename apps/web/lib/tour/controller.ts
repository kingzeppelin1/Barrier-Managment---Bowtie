'use client';

import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import type { TourStep } from './types';
import { showToast } from '@/components/common/toast';

const ELEMENT_TIMEOUT_MS = 4000;

export interface TourEnv {
  /** Programmatic navigation — same shape as next/navigation's useRouter().push. */
  push: (href: string) => void;
  /** Read the current pathname; defaults to window.location.pathname when not given. */
  pathname?: () => string;
}

/**
 * Tour controller. Wraps driver.js so we can navigate between routes,
 * wait for elements to mount, and inject auto-click / wait-click behaviour
 * per step.
 *
 * driver.js is used only for highlighting + popover rendering — we keep
 * the step machine in our own code so it's easier to debug.
 */
export class TourController {
  private idx = 0;
  private d: Driver | null = null;
  private steps: TourStep[];
  private env: TourEnv;
  private destroyed = false;
  private cleanups: Array<() => void> = [];

  constructor(steps: TourStep[], env: TourEnv) {
    this.steps = steps;
    this.env = env;
  }

  async start(): Promise<void> {
    this.idx = 0;
    this.destroyed = false;
    this.d = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 6,
      popoverClass: 'bowtie-tour',
      onCloseClick: () => this.destroy(),
      onDestroyed: () => this.destroy(),
    });
    await this.show();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.runCleanups();
    if (this.d) {
      try {
        this.d.destroy();
      } catch {
        // ignore
      }
      this.d = null;
    }
  }

  private runCleanups(): void {
    for (const c of this.cleanups) c();
    this.cleanups = [];
  }

  private async next(): Promise<void> {
    if (this.destroyed) return;
    this.runCleanups();
    this.idx += 1;
    if (this.idx >= this.steps.length) {
      this.complete();
      return;
    }
    await this.show();
  }

  private complete(): void {
    showToast('Tour complete. Restart anytime from Settings.');
    this.destroy();
  }

  private async show(): Promise<void> {
    if (this.destroyed || !this.d) return;
    const step = this.steps[this.idx];
    if (!step) return;

    try {
      await step.before?.();
    } catch (err) {
      // Skip step gracefully on a before-hook error.
      // eslint-disable-next-line no-console
      console.warn('[tour] before-hook failed for', step.id, err);
    }

    if (this.destroyed) return;

    let element: HTMLElement | null = null;
    if (step.selector) {
      element = await waitForElement(step.selector, ELEMENT_TIMEOUT_MS);
      if (!element) {
        // eslint-disable-next-line no-console
        console.warn('[tour] selector not found, terminating gracefully:', step.selector);
        showToast('Demo Tour stopped — expected element not found. Restart from Settings.');
        this.destroy();
        return;
      }
    }

    if (this.destroyed || !this.d) return;

    const popover = buildPopover(step, this.idx, this.steps.length, () => this.advance(), () => this.destroy());
    if (element) {
      this.d.highlight({ element, popover });
    } else {
      // No selector: show a centered popover by highlighting body.
      this.d.highlight({ element: document.body, popover });
    }

    // Hook up per-mode behaviour.
    if (step.mode === 'wait_click' && element) {
      const handler = () => {
        // Use rAF so the click finishes propagating before we navigate the tour.
        requestAnimationFrame(() => void this.next());
      };
      element.addEventListener('click', handler, { once: true });
      this.cleanups.push(() => element?.removeEventListener('click', handler));
    }

    if (step.mode === 'auto_click' && element) {
      const delay = step.delayMs ?? 1000;
      const timer = setTimeout(() => {
        try {
          element?.click();
        } catch {
          // ignore
        }
        // Advance shortly after the click so the side effect is visible.
        const advance = setTimeout(() => void this.next(), 450);
        this.cleanups.push(() => clearTimeout(advance));
      }, delay);
      this.cleanups.push(() => clearTimeout(timer));
    }

    try {
      await step.after?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[tour] after-hook failed for', step.id, err);
    }

    if (step.completeToast) showToast(step.completeToast);
  }

  /** Advance from a popover button click. Exposed so the popover Next button
   *  (wired via popover html attribute) can trigger progression. */
  advance(): void {
    void this.next();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPopover(
  step: TourStep,
  idx: number,
  total: number,
  onNext: () => void,
  onClose: () => void,
) {
  const showButtons: ('next' | 'previous' | 'close')[] =
    step.mode === 'wait_click' || step.mode === 'auto_click'
      ? ['close']
      : ['next', 'close'];

  const hint =
    step.mode === 'wait_click'
      ? 'Click the highlighted element to continue…'
      : step.mode === 'auto_click'
        ? 'Watching this happen for you…'
        : undefined;

  const description = [
    `<p>${escapeHtml(step.copy.description)}</p>`,
    hint ? `<p style="margin-top:0.5rem;color:hsl(var(--muted-foreground));font-size:11px;">${escapeHtml(hint)}</p>` : '',
    step.copy.disclaimer
      ? `<p style="margin-top:0.5rem;color:hsl(var(--muted-foreground));font-size:11px;font-style:italic;">${escapeHtml(step.copy.disclaimer)}</p>`
      : '',
    `<p style="margin-top:0.5rem;color:hsl(var(--muted-foreground));font-size:11px;">Step ${idx + 1} of ${total}</p>`,
  ].join('');

  return {
    title: step.copy.title,
    description,
    showButtons,
    nextBtnText: step.mode === 'done' ? 'Done' : 'Next',
    closeBtnText: 'Skip',
    onNextClick: () => onNext(),
    onCloseClick: () => onClose(),
  } as const;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function waitForElement(selector: string, timeoutMs: number): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const found = document.querySelector<HTMLElement>(selector);
    if (found) {
      resolve(found);
      return;
    }
    const obs = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) {
        obs.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => {
      obs.disconnect();
      resolve(document.querySelector<HTMLElement>(selector));
    }, timeoutMs);
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
