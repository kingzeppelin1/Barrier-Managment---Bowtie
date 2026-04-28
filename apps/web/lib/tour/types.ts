/**
 * Tour step shape — kept separate from driver.js types so we can swap the
 * overlay library later without touching the narrative.
 */
export interface TourStepCopy {
  title: string;
  description: string;
  /** Optional small disclaimer rendered under the description in muted text. */
  disclaimer?: string;
}

export interface TourStep {
  id: string;
  /** CSS selector for the element to highlight, or null to skip highlighting. */
  selector: string | null;
  copy: TourStepCopy;
  /**
   * Mode controls the popover buttons + auto-progression behaviour.
   *
   *  next        — standard "Next" button advances to the next step (default).
   *  wait_click  — popover hides Next; the highlighted element's click event
   *                advances the tour (or any descendant match).
   *  auto_click  — popover hides Next; after `delayMs` we programmatically
   *                click the element, then advance after a short pause.
   *  done        — popover shows "Done" and closes the tour.
   */
  mode: 'next' | 'wait_click' | 'auto_click' | 'done';
  /** Required when mode === 'auto_click'. */
  delayMs?: number;
  /** Side effect to run BEFORE the step's element is resolved (navigation, etc.) */
  before?: () => Promise<void> | void;
  /** Side effect to run AFTER the popover renders (e.g. open a side panel). */
  after?: () => Promise<void> | void;
  /** Toast to dispatch when the step completes successfully. */
  completeToast?: string;
}
