import type { TourStep } from './types';
import type { TourEnv } from './controller';
import { delay } from './controller';

/**
 * 8-beat golden-path narrative.
 *
 * Identifiers are stable across builds. Each `selector` matches a
 * `data-tour="..."` attribute placed on the corresponding component, so the
 * tour stays robust even if class names change.
 */

const TARGET_BOWTIE = 'bt-off-001';

function pathname(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

async function navigateAndWait(env: TourEnv, href: string): Promise<void> {
  if (pathname() === href) return;
  env.push(href);
  // Yield so Next can paint; the controller will then waitForElement.
  await delay(300);
}

function dispatchCoachToggle(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bowtie-coach-toggle'));
  }
}

export function buildTourSteps(env: TourEnv): TourStep[] {
  return [
    {
      id: 'dashboard-alert',
      selector: '[data-tour="dashboard-alert"]',
      copy: {
        title: 'Welcome to Barrier Management',
        description:
          'Three critical issues need attention right now. Let’s investigate the most concerning — PTW, flagged red on the offshore platform.',
        disclaimer: 'This tour will create a demo Action. You can reset everything anytime in Settings.',
      },
      mode: 'next',
      before: async () => {
        await navigateAndWait(env, '/dashboard');
      },
    },
    {
      id: 'open-bowtie',
      selector: '[data-tour="canvas"]',
      copy: {
        title: 'Hydrocarbon Release on Topsides',
        description:
          'Bowtie analysis lays out how barriers stand between threats (left) and consequences (right). The Top Event sits in the middle.',
      },
      mode: 'next',
      before: async () => {
        await navigateAndWait(env, `/bowties/${TARGET_BOWTIE}`);
      },
    },
    {
      id: 'click-ptw',
      selector: '[data-tour="ptw-node"]',
      copy: {
        title: 'PTW system — critical, red',
        description:
          'This is the Permit-to-Work barrier. It’s flagged red — but the methodology cares about more than just the colour. Click it to see why.',
      },
      mode: 'wait_click',
    },
    {
      id: 'compensatory-callout',
      selector: '[data-tour="compensatory-callout"]',
      copy: {
        title: 'Compensated red stays red',
        description:
          'PTW has compensatory measures in place — extra audits, supervisor sign-off — but the methodology says the barrier remains degraded. Compensation acknowledges the gap; it doesn’t close it.',
      },
      mode: 'next',
    },
    {
      id: 'coach-badge',
      selector: '[data-tour="coach-badge"]',
      copy: {
        title: 'AI Coach has flagged additional issues',
        description:
          'The Coach has analysed this bowtie against the methodology. The badge shows pending suggestions awaiting human review.',
      },
      mode: 'next',
      after: async () => {
        // Open the panel ahead of step 6 so the suggestion list is visible.
        dispatchCoachToggle();
        await delay(250);
      },
    },
    {
      id: 'stale-suggestion',
      selector: '[data-tour="suggestion-stale-deluge"]',
      copy: {
        title: 'Stale verification on the deluge system',
        description:
          'The Coach noticed that the topsides deluge — a critical mitigative barrier — hasn’t been verified in over 12 months. Accepting this suggestion logs you as the reviewer and creates a follow-up.',
      },
      mode: 'next',
    },
    {
      id: 'accept-suggestion',
      selector: '[data-tour="suggestion-stale-deluge"] [data-tour="accept-btn"]',
      copy: {
        title: 'One click to accept',
        description:
          'Watch this suggestion get accepted. The approval-gate counter moves forward, and a follow-up Action is logged for tracking.',
      },
      mode: 'auto_click',
      delayMs: 1200,
      completeToast: 'Suggestion accepted. Follow-up logged.',
    },
    {
      id: 'actions-register',
      selector: '[data-tour="actions-table"]',
      copy: {
        title: 'Where the work lives',
        description:
          'All follow-up work — owner, due date, evidence, effectiveness review — lives here. From threat to barrier to AI insight to action: that’s a complete bowtie management loop.',
      },
      mode: 'next',
      before: async () => {
        // Close the coach panel before we change routes so it doesn't sit open over /actions.
        dispatchCoachToggle();
        await delay(150);
        await navigateAndWait(env, '/actions');
      },
    },
  ];
}
