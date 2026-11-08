import { test, expect } from '@playwright/test';

test('objectives narration coordinates music and stops at the hook', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  await expect(page.getByRole('heading', { name: /Setelah mengikuti pembelajaran/ })).toBeVisible();
  await expect(page.locator('img.objectives-info')).toHaveCount(1);
  await expect(page.locator('img.objectives-info')).toHaveAttribute('src', /tujuan_pembelajaran_info/);
  const voice = page.locator('audio[data-sterilab-voice="objectives"]');
  await expect(voice).toHaveCount(1);
  await expect(voice).toHaveAttribute('src', /1\.5_tujuan_scene/);
  await expect.poll(() => voice.evaluate((el: HTMLAudioElement) => el.duration)).toBeGreaterThan(0);
  await expect.poll(() => voice.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  const bgm = page.locator('audio[data-sterilab-bgm]');
  await expect.poll(() => bgm.evaluate((el: HTMLAudioElement) => el.volume)).toBeLessThan(0.4);
  await page.locator('.objectives').evaluate(el => el.getAnimations({ subtree: true }).forEach(animation => animation.finish()));
  await expect(page.locator('.ai-disclosure')).toBeVisible();
  await page.screenshot({ path: `test-results/objectives-${test.info().project.name}.png` });
  await expect(page.locator('img.objectives-info')).toBeVisible();
  await page.getByRole('button', { name: 'Matikan suara' }).click();
  await expect.poll(() => bgm.evaluate((el: HTMLAudioElement) => el.volume)).toBeGreaterThan(0.9);
  await page.getByRole('button', { name: 'Nyalakan suara' }).click();
  await expect.poll(() => bgm.evaluate((el: HTMLAudioElement) => el.volume)).toBeLessThan(0.4);
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
  await expect(voice).toHaveCount(0);
  await expect(page.getByTestId('case-narration')).toHaveAttribute('src', /2_hook_scene/);
  expect(errors).toEqual([]);
});

test('back to cover stops objectives narration without waiting', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  const voice = page.locator('audio[data-sterilab-voice="objectives"]');
  await expect.poll(() => voice.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  const handle = (await voice.elementHandle())!;
  await page.getByRole('button', { name: 'Kembali' }).click();
  expect(await handle.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
  await expect(page.locator('img.objectives-info')).toHaveClass(/sterilab-bubble-out/);
  await expect(page.getByRole('button', { name: 'Lanjut', exact: true })).toHaveClass(/sterilab-bubble-out/);
  await expect(page.getByRole('button', { name: 'Mulai Menjelajah' })).toBeVisible();
});
