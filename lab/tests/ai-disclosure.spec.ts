import { expect, test } from '@playwright/test';

test('mission 3 moves the complete disclosure from the task box to the completion pill', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/src/presentation/pages/evaluation/misson_3/audit.html');
  const badge = page.locator('.ai-disclosure');
  const text = 'Ilustrasi visual dalam media SteriLab dibuat dengan bantuan Artificial Intelligence (AI) dan digunakan sebagai pendukung pembelajaran.';
  await expect(badge).toHaveCount(1);
  await expect(badge).toHaveText(text);
  await expect(badge).toHaveClass(/ai-disclosure--box/);
  const badgeBox = (await badge.boundingBox())!;
  const cardBox = (await page.locator('.mission3-instruction-panel').boundingBox())!;
  expect(Math.abs(badgeBox.x - cardBox.x)).toBeLessThan(1);
  expect(badgeBox.y).toBeGreaterThanOrEqual(cardBox.y + cardBox.height);
  expect(badgeBox.y + badgeBox.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(page.getByRole('complementary', { name: 'Pengantar dan tugas siswa' })).toHaveCSS('overflow-y', 'auto');
  await page.getByTestId('mission3-choice-A').click();
  await page.getByTestId('mission3-choice-D').click();
  await page.getByRole('button', { name: 'PERIKSA JAWABAN' }).click();
  await page.getByRole('button', { name: 'LANJUT', exact: true }).click();
  await expect(page.getByTestId('mission3-completion')).toBeVisible();
  await expect(badge).toHaveCount(1);
  await expect(badge).toHaveClass(/ai-disclosure--horizontal/);
  await expect(badge).toHaveText(text);
});
