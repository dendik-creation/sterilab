import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Length of assets/sounds/02_scenes/03_case/hook_naration.ogg, read straight
// off the Ogg Opus container (final page granule 2416632 - 312 pre-skip
// samples, at the 48kHz Opus output rate). The Case CTA is gated on this file
// finishing, so any spec that walks past Case is implicitly asserting a ~50s
// wait exists - and case-narration.spec.ts asserts the number itself, so
// re-recording the narration fails loudly here instead of silently changing
// how long the Screen holds the Analyst.
export const HOOK_NARRATION_SECONDS = 50.34;

// Every journey that starts before Missions has to cross Case, and Case now
// withholds its only CTA until the hook narration ends. Waiting out ~50s per
// spec per viewport is not a test - so seek the real element to its end and
// let the app's own `ended` handler open the gate. Nothing is stubbed: the
// audio is the shipped file, playing, and the transition under test is the
// same one a real Analyst triggers by listening.
export async function skipCaseNarration(page: Page): Promise<void> {
  const narration = page.getByTestId('case-narration');
  await narration.waitFor({ state: 'attached' });

  await narration.evaluate(async (el: HTMLAudioElement) => {
    if (!Number.isFinite(el.duration) || el.duration === 0) {
      await new Promise<void>((resolve) => {
        el.addEventListener('loadedmetadata', () => resolve(), { once: true });
        el.addEventListener('error', () => resolve(), { once: true });
      });
    }
    if (Number.isFinite(el.duration) && el.duration > 0) {
      el.currentTime = Math.max(0, el.duration - 0.05);
      await el.play().catch(() => {});
    }
  });

  await expect(page.getByRole('button', { name: 'Lanjut Briefing' })).toBeVisible({ timeout: 10_000 });
}

// Splash -> Home -> Case, the two clicks every downstream journey repeats.
export async function reachCase(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  await expect(page.getByAltText(/Ruang laboratorium/)).toBeVisible({ timeout: 5000 });
}
