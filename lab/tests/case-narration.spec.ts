import { test, expect } from '@playwright/test';
import { waitForMotionSettled } from './settle';
import { reachCase, skipCaseNarration } from './case';

// Revised Case (Figma frame 20:1296): the "Baca Selengkapnya" reveal is gone
// - case_bg.png bakes the whole news monitor - and what paces the Screen now
// is the hook narration. These specs cover the three things that revision
// depends on: the audio really plays and really gates the CTA, the BGM ducks
// underneath it, and both bottom-edge pieces land inside the stage.
test.beforeEach(({ viewport }) => {
  test.skip(!viewport || viewport.width <= viewport.height, 'landscape-only app');
});

test('the shipped narration can be decoded for the CTA gate', async ({ page }) => {
  await reachCase(page);

  const duration = await page
    .getByTestId('case-narration')
    .evaluate(async (el: HTMLAudioElement) => {
      if (!Number.isFinite(el.duration) || el.duration === 0) {
        await new Promise<void>((resolve) => {
          el.addEventListener('loadedmetadata', () => resolve(), { once: true });
          el.addEventListener('error', () => resolve(), { once: true });
        });
      }
      return el.duration;
    });

  // Also proves the browser decoded it: an unsupported codec leaves duration
  // NaN, which would silently fall through to the error-path CTA reveal.
  expect(Number.isFinite(duration)).toBe(true);
  expect(duration).toBeGreaterThan(0);
});

test('narration plays on mount, controls mark progress, and the CTA only arrives when it ends', async ({ page }) => {
  await reachCase(page);

  const controls = page.getByRole('progressbar', { name: 'Kemajuan narasi' });
  const lanjut = page.getByRole('button', { name: 'Lanjut Briefing' });

  await expect(page.getByTestId('case-scientist')).toBeVisible();
  await expect(page.getByTestId('case-speaking-mouth')).toBeVisible();
  await expect(controls).toBeVisible();
  await expect(lanjut).not.toBeAttached();

  const firstMouthFrame = await page.getByTestId('case-speaking-mouth').getAttribute('src');
  await expect.poll(() => page.getByTestId('case-speaking-mouth').getAttribute('src')).not.toBe(firstMouthFrame);

  // Playing, not merely present - the badge would be a lie otherwise.
  const playing = await page
    .getByTestId('case-narration')
    .evaluate((el: HTMLAudioElement) => !el.paused && !el.ended);
  expect(playing).toBe(true);

  await skipCaseNarration(page);

  await expect(controls).not.toBeAttached();
  await expect(lanjut).toBeVisible();
});

test('dialogue follows narration timestamps and stays above the scientist', async ({ page }) => {
  await reachCase(page);

  const dialogue = page.getByRole('region', { name: 'Pesan dari Analis Lab' });
  const narration = page.getByTestId('case-narration');
  const lines = [
    'Tahukah kamu, satu hasil uji mikrobiologi yang tidak akurat dapat menyebabkan makanan yang berbahaya dinyatakan aman, atau sebaliknya.',
    'Dampaknya, tidak hanya mengancam keselamatan konsumen, tetapi juga dapat merusak reputasi perusahaan dan menurunkan kepercayaan masyarakat terhadap keamanan pangan.',
    'Bagaimana seorang analis mikrobiologi memastikan hasil pengujiannya akurat dan dapat dipertanggungjawabkan?',
    'Ayo, jelajah di Sterilab!',
  ];

  await expect(dialogue).toHaveCSS('z-index', '2');
  for (const [time, line] of [
    [0, lines[0]],
    [9, lines[1]],
    [19, lines[2]],
    [27, lines[3]],
  ] as const) {
    await narration.evaluate((el, currentTime) => {
      el.currentTime = currentTime;
      el.dispatchEvent(new Event('timeupdate'));
    }, time);
    await expect(dialogue).toContainText(line);
  }
});

test('the global BGM ducks for Case and is restored on the way to Missions', async ({ page }) => {
  await reachCase(page);

  const bgmVolume = () =>
    page.evaluate(() => {
      const el = document.querySelector<HTMLAudioElement>('audio[data-sterilab-bgm]');
      return el ? el.volume : null;
    });

  // The duck is a ramp, so poll rather than sampling one frame.
  await expect.poll(bgmVolume, { timeout: 3000 }).toBeLessThan(0.3);

  await skipCaseNarration(page);
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  await expect(page.getByAltText(/Dashboard SteriLab/)).toBeVisible({ timeout: 4000 });

  await expect.poll(bgmVolume, { timeout: 3000 }).toBeGreaterThan(0.95);
});

test('narration controls and CTA stay inside the stage and clear of the top bar at every landscape size', async ({ page }) => {
  await reachCase(page);
  await waitForMotionSettled(page);

  const stage = await page.getByAltText(/Ruang laboratorium/).evaluate(() => {
    const safe = document.querySelector<HTMLElement>('h1')?.parentElement;
    const r = safe!.getBoundingClientRect();
    return { top: r.top, left: r.left, right: r.right, bottom: r.bottom };
  });

  const controlsBox = await page.getByRole('progressbar', { name: 'Kemajuan narasi' }).boundingBox();
  expect(controlsBox).not.toBeNull();
  expect(controlsBox!.x).toBeGreaterThanOrEqual(stage.left - 1);
  expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(stage.right + 1);
  expect(controlsBox!.y + controlsBox!.height).toBeLessThanOrEqual(stage.bottom + 1);

  await skipCaseNarration(page);
  await waitForMotionSettled(page);

  const ctaBox = await page.getByRole('button', { name: 'Lanjut Briefing' }).boundingBox();
  expect(ctaBox).not.toBeNull();
  // WCAG 2.2 AA: this art is 434x79, so the width floor has to be driven by
  // the height it produces, not by a round number.
  expect(ctaBox!.height).toBeGreaterThanOrEqual(44);
  expect(ctaBox!.x).toBeGreaterThanOrEqual(stage.left - 1);
  expect(ctaBox!.x + ctaBox!.width).toBeLessThanOrEqual(stage.right + 1);
  expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(stage.bottom + 1);

  // Centered on the stage, not just "somewhere along the bottom".
  const ctaCenter = ctaBox!.x + ctaBox!.width / 2;
  expect(Math.abs(ctaCenter - (stage.left + stage.right) / 2)).toBeLessThan(2);

  // Never under the top bar, whatever the 44px icon floor does to it.
  for (const name of ['Menu Utama', 'Kembali', /suara/]) {
    const icon = await page.getByRole('button', { name }).boundingBox();
    expect(ctaBox!.y, `CTA vs ${name}`).toBeGreaterThan(icon!.y + icon!.height);
  }
});

test('the top bar sits at the revised frame coordinates - back no longer jumps on the way to Missions', async ({
  page,
}) => {
  await reachCase(page);
  await waitForMotionSettled(page);

  const caseBack = await page.getByRole('button', { name: 'Kembali' }).boundingBox();

  await skipCaseNarration(page);
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  await expect(page.getByAltText(/Dashboard SteriLab/)).toBeVisible({ timeout: 4000 });
  await waitForMotionSettled(page);

  const missionsBack = await page.getByRole('button', { name: 'Kembali' }).boundingBox();

  expect(Math.abs(caseBack!.x - missionsBack!.x)).toBeLessThan(1);
  expect(Math.abs(caseBack!.y - missionsBack!.y)).toBeLessThan(1);
});
