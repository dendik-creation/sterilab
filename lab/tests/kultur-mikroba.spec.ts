import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { skipCaseNarration } from './case';

async function gotoStep5(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { localStorage.setItem('requireRestartProgress', 'false'); localStorage.setItem('sterilab:levelProgress', JSON.stringify({ version: 1, completed: 1 })); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click();
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  await skipCaseNarration(page);
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  await page.getByRole('button', { name: /^Mulai Misi 2:/ }).click();

  for (let i = 0; i < 14; i += 1) await page.getByRole('button', { name: /Nutrient Agar/ }).click();
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();

  await page.getByRole('button', { name: /Aquades/ }).click();
  await page.getByRole('button', { name: /Hotplate/ }).click();
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();

  await page.getByRole('button', { name: /pH meter/ }).click();
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();

  for (const name of [/Erlenmeyer, klik untuk menuangkan media/, /Kapas/, /Kertas timah/]) {
    await page.getByRole('button', { name }).click();
  }
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
  await page.getByRole('button', { name: /Erlenmeyer, klik untuk memasukkan/ }).click();
}

test('Langkah 5 requires 121°C, 15 psi, and 15–20 minutes', async ({ page }) => {
  test.setTimeout(60_000);
  await gotoStep5(page);

  const start = page.getByRole('button', { name: /Mulai Proses/ });
  const panel = page.locator('img[src*="new_autoclave_panel"]');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveJSProperty('naturalWidth', 1774);
  await expect(page.getByText('10 psi', { exact: true })).toBeVisible();
  await expect(start).toBeDisabled();

  for (const name of [/Kurangi suhu/, /Tambah suhu/, /Kurangi tekanan/, /Tambah tekanan/, /Kurangi waktu/, /Tambah waktu/]) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  for (let i = 0; i < 6; i += 1) await page.getByRole('button', { name: /Tambah suhu/ }).click();
  for (let i = 0; i < 5; i += 1) await page.getByRole('button', { name: /Tambah tekanan/ }).click();
  for (let i = 0; i < 6; i += 1) await page.getByRole('button', { name: /Tambah waktu/ }).click();

  await expect(page.getByText('121°C', { exact: true })).toBeVisible();
  await expect(page.getByText('15 psi', { exact: true })).toBeVisible();
  await expect(page.getByText('16 min', { exact: true })).toBeVisible();
  await expect(start).toBeEnabled();
});

test('Langkah 6 targets the visible objects in each updated background', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await gotoStep5(page);
  for (let i = 0; i < 6; i += 1) await page.getByRole('button', { name: /Tambah suhu/ }).click();
  for (let i = 0; i < 5; i += 1) await page.getByRole('button', { name: /Tambah tekanan/ }).click();
  for (let i = 0; i < 6; i += 1) await page.getByRole('button', { name: /Tambah waktu/ }).click();
  await page.getByRole('button', { name: /Mulai Proses/ }).click();
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
  await expect(page.getByText('Langkah 6 / 6', { exact: true })).toBeVisible();

  const frames = [
    { alt: /Analis berdiri di meja kerja dengan labu Erlenmeyer/, name: /Erlenmeyer, klik untuk mulai/, point: [750, 770], lamps: [[550, 760], [895, 760]] },
    { alt: /Analis memegang tutup cawan Petri/, name: /Erlenmeyer, klik untuk melanjutkan/, point: [480, 700], lamps: [[580, 760], [1030, 760]] },
    { alt: /Analis menuangkan media dari labu Erlenmeyer/, name: /Cawan Petri, klik untuk menuntaskan/, point: [805, 780], lamps: [[550, 760], [1030, 760]] },
  ] as const;
  for (const [index, frame] of frames.entries()) {
    const image = page.getByAltText(frame.alt);
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', new RegExp(`step_6/backgrounds/${index + 1}\\.png`));
    await image.evaluate((element: HTMLImageElement) => element.decode());
    const bounds = (await image.boundingBox())!;
    const hotspot = page.getByRole('button', { name: frame.name });
    const hitbox = (await hotspot.boundingBox())!;
    const point = (x: number, y: number) => ({ x: bounds.x + bounds.width * x / 1671, y: bounds.y + bounds.height * y / 941 });
    const target = point(...frame.point);
    expect(target.x).toBeGreaterThan(hitbox.x);
    expect(target.x).toBeLessThan(hitbox.x + hitbox.width);
    expect(target.y).toBeGreaterThan(hitbox.y);
    expect(target.y).toBeLessThan(hitbox.y + hitbox.height);
    expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('aria-label'), target)).toMatch(frame.name);
    for (const lamp of frame.lamps) {
      const position = point(...lamp);
      await page.mouse.click(position.x, position.y);
      await expect(image).toBeVisible();
    }
    const emptyTable = point(350, 900);
    await page.mouse.click(emptyTable.x, emptyTable.y);
    await expect(image).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`state-${index + 1}.png`) });
    await page.mouse.click(target.x, target.y);
  }
  const completedImage = page.getByAltText(/Analis mengacungkan jempol di meja kerja/);
  await expect(completedImage).toHaveAttribute('src', /step_6\/backgrounds\/4\.png/);
  await completedImage.evaluate((element: HTMLImageElement) => element.decode());
  for (const frame of frames) await expect(page.getByRole('button', { name: frame.name })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Pembuatan media berhasil!' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('state-4-complete.png') });
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
  await expect(page.getByRole('button', { name: /^Ulangi Misi 2:/ })).toBeVisible();
  expect(errors).toEqual([]);
});
