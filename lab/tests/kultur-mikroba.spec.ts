import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { skipCaseNarration } from './case';

async function gotoStep5(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('sterilab:levelProgress', JSON.stringify({ version: 1, completed: 1 })));
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
