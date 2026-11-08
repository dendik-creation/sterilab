import { test, expect } from '@playwright/test';

test('navigation interrupts voices and Hook remains usable during narration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 30000 });
  const cover = page.locator('audio[data-sterilab-voice="cover"]');
  await expect.poll(() => cover.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  const coverHandle = (await cover.elementHandle())!;
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  expect(await coverHandle.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
  const hook = page.getByTestId('case-narration');
  await expect(hook).toHaveAttribute('src', /2_hook_scene/);
  await expect.poll(() => hook.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  await expect(page.getByRole('progressbar', { name: 'Kemajuan narasi' })).toHaveCount(0);
  const hookHandle = (await hook.elementHandle())!;
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  expect(await hookHandle.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
  const dashboard = page.locator('audio[data-sterilab-voice="dashboard"]');
  await expect.poll(() => dashboard.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  const dashboardHandle = (await dashboard.elementHandle())!;
  await page.getByRole('button', { name: 'Kembali' }).click();
  expect(await dashboardHandle.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
  await expect.poll(() => hook.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  expect(await page.locator('audio').evaluateAll(els => els.filter(el => !el.paused && (el.dataset.sterilabVoice || el.dataset.testid === 'case-narration')).length)).toBe(1);
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  await page.getByRole('button', { name: 'Mulai Misi 1: Teknik Kerja Aseptik' }).click();
  const aseptic = page.locator('audio[data-sterilab-voice="aseptic"]');
  await expect.poll(() => aseptic.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  const asepticHandle = (await aseptic.elementHandle())!;
  await page.getByRole('button', { name: 'Kembali' }).click();
  expect(await asepticHandle.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
  expect(errors).toEqual([]);
});

test('muting narration restores music volume without unmuting music', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  const bgm = page.locator('audio[data-sterilab-bgm]');
  await expect.poll(() => bgm.evaluate((el: HTMLAudioElement) => el.volume)).toBeLessThan(0.4);
  await page.getByRole('button', { name: 'Matikan suara' }).click();
  await expect.poll(() => bgm.evaluate((el: HTMLAudioElement) => el.volume)).toBeGreaterThan(0.9);
  expect(await bgm.evaluate((el: HTMLAudioElement) => el.muted)).toBe(true);
  await page.getByRole('button', { name: 'Nyalakan suara' }).click();
  await expect.poll(() => bgm.evaluate((el: HTMLAudioElement) => el.volume)).toBeLessThan(0.4);
});
