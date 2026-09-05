import type { Page } from '@playwright/test';

// Every Screen animates its content in on a stagger, and those entrances
// animate `transform: scale()` - a boundingBox taken mid-flight measures a
// shrunken element, not its laid-out position. Wait for the motion to land
// before measuring anything.
//
// Looping animations (PulseButton's highlight ring) never reach 'finished',
// so they're excluded rather than waited on. Under reduced motion there are
// no animations at all and this returns immediately.
export async function waitForMotionSettled(page: Page, timeout = 8000): Promise<void> {
  // A newly mounted step can be visible before the browser has created its CSS
  // animations. If we inspect `document.getAnimations()` in that gap, the
  // empty list looks settled and geometry is measured during the first bubble
  // frame. Give style/layout and the following paint a chance to register the
  // animations before waiting on them.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .every((a) => a.playState === 'finished' || a.effect?.getComputedTiming().iterations === Infinity),
    null,
    { timeout },
  );
}
