import { test, expect } from '@playwright/test';
import { waitForMotionSettled } from './settle';
import { skipCaseNarration } from './case';

// Single-path SPA (docs/adr/0005-single-path-spa-navigation.md): every
// assertion below runs against "/" and never expects the URL to change.
// Skipped on the portrait project - the whole app is landscape-only
// (ADR-0002) and gets its own spec (portrait-block.spec.ts).
test.beforeEach(({ viewport }) => {
  test.skip(!viewport || viewport.width <= viewport.height, 'landscape-only app');
});

test('splash loads, advances to home, and Mulai Menjelajah reaches Case - all on "/"', async ({ page }) => {
  await page.goto('/');

  // Loading phase: real progressbar, then the touch-anywhere gate it hands
  // off to. Under parallel-worker CPU contention the exact 100% frame can be
  // too narrow a window for polling to catch reliably, so the functional
  // gate (touch prompt actually appearing) is the assertion that matters.
  const progressbar = page.getByRole('progressbar', { name: 'Memuat konten' });
  await expect(progressbar).toBeVisible();

  const touchPrompt = page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' });
  await expect(touchPrompt).toBeVisible({ timeout: 10_000 });
  await touchPrompt.click();

  const exploreBtn = page.getByRole('button', { name: 'Mulai Menjelajah' });
  await expect(exploreBtn).toBeVisible();

  // URL never changes - no react-router, no history entries.
  expect(new URL(page.url()).pathname).toBe('/');

  await exploreBtn.click();

  // Exit-bubble transition holds the Home content on screen for a beat
  // before Case actually mounts - the Screen must not swap the instant the
  // CTA is clicked.
  await expect(exploreBtn).toBeVisible();
  await expect(page.getByAltText(/Ruang laboratorium/)).not.toBeAttached();

  await expect(page.getByAltText(/Ruang laboratorium/)).toBeVisible({ timeout: 2000 });
  expect(new URL(page.url()).pathname).toBe('/');
});

test('Case holds its content for the staggered exit before Missions mounts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();

  await skipCaseNarration(page);

  const lanjut = page.getByRole('button', { name: 'Lanjut Briefing' });
  await lanjut.click();

  // Exit ladder runs first: the CTA is still on screen and the next Screen
  // has not mounted yet.
  await expect(lanjut).toBeVisible();
  await expect(page.getByAltText(/Dashboard SteriLab/)).not.toBeAttached();

  await expect(page.getByAltText(/Dashboard SteriLab/)).toBeVisible({ timeout: 4000 });
  expect(new URL(page.url()).pathname).toBe('/');
});

test('top-bar icon buttons meet the 44x44 CSS px touch target minimum on Splash and Case', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click();

  const homeSoundBox = await page.getByRole('button', { name: /suara/ }).boundingBox();
  expect(homeSoundBox?.width).toBeGreaterThanOrEqual(44);
  expect(homeSoundBox?.height).toBeGreaterThanOrEqual(44);

  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();

  // Case's top bar now bubbles in on a stagger, so these have to be measured
  // after the entrance lands or the boundingBox is a mid-scale snapshot.
  await expect(page.getByAltText(/Ruang laboratorium/)).toBeVisible({ timeout: 5000 });
  await waitForMotionSettled(page);

  for (const name of ['Menu Utama', 'Kembali', /suara/]) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box?.width, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box?.height, `${name} height`).toBeGreaterThanOrEqual(44);
  }
});
