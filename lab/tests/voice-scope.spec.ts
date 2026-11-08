import { test, expect, type Page } from '@playwright/test';
import { skipCaseNarration } from './case';

async function dashboard(page: Page, completed: number) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(value => { localStorage.setItem('requireRestartProgress', 'false'); if (!localStorage.getItem('sterilab:levelProgress')) localStorage.setItem('sterilab:levelProgress', JSON.stringify({ version: 1, completed: value })); }, completed);
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  await skipCaseNarration(page);
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  await expect(page.getByAltText(/Dashboard SteriLab/)).toBeVisible();
}

for (const lab of [
  { completed: 0, card: /^Mulai Misi 1:/, id: 'aseptic', src: '4_teknik_kerja_aseptik', actions: ['Ambil sabun antiseptik', 'Gosok kedua telapak tangan', 'Buka kran air dan bilas tangan'] },
  { completed: 1, card: /^Mulai Misi 2:/, id: 'media', src: '5_media_kultur_scene', actions: Array(14).fill('Nutrient Agar') },
  { completed: 2, card: /^Mulai Misi 3:/, id: 'waste', src: '6_pengelolaan_limbah_scene', actions: ['Cawan petri berisi media agar bekas', 'Rak tabung reaksi berisi biakan bekas'] },
]) {
  test(`${lab.id} narration survives a procedural step and stops on exit`, async ({ page }) => {
    test.setTimeout(60000);
    await dashboard(page, lab.completed);
    await page.getByRole('button', { name: lab.card }).click();
    const voice = page.locator(`audio[data-sterilab-voice="${lab.id}"]`);
    await expect(voice).toHaveAttribute('src', new RegExp(lab.src));
    await expect.poll(() => voice.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
    const bgm = page.locator('audio[data-sterilab-bgm]');
    await expect.poll(() => bgm.evaluate((el: HTMLAudioElement) => el.volume)).toBeLessThan(0.4);
    const handle = (await voice.elementHandle())!;
    const before = await handle.evaluate((el: HTMLAudioElement) => el.currentTime);
    for (const action of lab.actions) await page.getByRole('button', { name: new RegExp(action) }).click();
    await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
    await expect(page.getByText(/Langkah 2 \/ /)).toBeVisible();
    expect(await handle.evaluate((el: HTMLAudioElement) => !el.paused && el.currentTime > 0)).toBe(true);
    expect(await handle.evaluate((el: HTMLAudioElement) => el.currentTime)).toBeGreaterThan(before);
    expect(await voice.count()).toBe(1);
    if (lab.id === 'media') {
      await page.getByRole('button', { name: /Aquades/ }).click();
      await page.getByRole('button', { name: /Hotplate/ }).click();
    } else if (lab.id === 'waste') {
      for (const name of ['Tray stainless steel berisi limbah biologis di atas meja', 'Ruang autoklaf', 'Tombol mulai autoklaf']) await page.getByRole('button', { name }).click();
    }
    if (lab.id !== 'aseptic') {
      await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
      await expect(page.getByText(/Langkah 3 \/ /)).toBeVisible();
      expect(await handle.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
      expect(await voice.count()).toBe(1);
    }
    await page.getByRole('button', { name: 'Kembali' }).click();
    expect(await handle.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
    if (lab.completed > 0) await expect.poll(() => bgm.evaluate((el: HTMLAudioElement) => el.volume)).toBeGreaterThan(0.9);
  });
}

test('dashboard narration responds to persisted aseptic completion', async ({ page }) => {
  await dashboard(page, 0);
  const voice = page.locator('audio[data-sterilab-voice="dashboard"]');
  await expect.poll(() => voice.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  const handle = (await voice.elementHandle())!;
  await page.evaluate(async () => { const progress = await import('/src/core/progress/levelProgress.ts'); progress.markLevelCompleted(1); });
  await expect.poll(() => handle.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
  await expect(voice).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sterilab:levelProgress'))).toBe('{"version":1,"completed":1}');
  await dashboard(page, 0);
  await expect(voice).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Mulai Misi 2:/ })).toBeEnabled();
});

test('evaluation narration starts once and stops when entering a mission', async ({ page }) => {
  await dashboard(page, 3);
  await expect(page.locator('audio[data-sterilab-voice="dashboard"]')).toHaveCount(0);
  await page.getByRole('button', { name: /^Mulai Misi 4: Evaluasi$/ }).click();
  const voice = page.locator('audio[data-sterilab-voice="evaluation"]');
  await expect(voice).toHaveAttribute('src', /7_evaluasi/);
  await expect.poll(() => voice.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  const handle = (await voice.elementHandle())!;
  await page.getByRole('button', { name: 'Mulai Misi 1: Temukan Kesalahan' }).click();
  expect(await handle.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
  await expect(page.getByRole('heading', { name: 'MISI 01 — TEMUKAN KESALAHAN!' })).toBeVisible();
});
