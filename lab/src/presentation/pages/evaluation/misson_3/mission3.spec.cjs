const { test, expect } = require('@playwright/test');

test('selection, feedback, and completion', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('sterilab:evaluationProgress', JSON.stringify({ version: 1, completed: 2 })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/src/presentation/pages/evaluation/misson_3/audit.html');
  await page.screenshot({ path: testInfo.outputPath('initial.png') });
  const choice = id => page.getByTestId(`mission3-choice-${id}`);
  const check = page.getByRole('button', { name: 'PERIKSA JAWABAN' });
  await expect(page.getByTestId('mission3-count')).toContainText('0/2');
  await expect(check).toBeDisabled();
  await choice('A').click();
  await expect(page.getByTestId('mission3-count')).toContainText('1/2');
  await choice('D').click();
  await choice('B').click();
  await expect(choice('B')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('mission3-count')).toContainText('2/2');
  await choice('D').click();
  await expect(check).toBeDisabled();
  await choice('B').click();
  await check.click();
  await expect(page.getByRole('dialog', { name: 'Jawaban belum tepat' })).toBeVisible();
  await expect(page.getByTestId('mission3-main')).toBeVisible();
  await page.getByRole('dialog').locator('img.mission3-dialog-art').evaluate(img => img.decode());
  await page.screenshot({ path: testInfo.outputPath('incorrect.png') });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sterilab:evaluationProgress')).completed)).toBe(2);
  await page.getByRole('button', { name: 'COBA LAGI' }).click();
  await expect(choice('A')).toHaveAttribute('aria-pressed', 'true');
  await choice('A').click();
  await choice('C').click();
  await check.click();
  await expect(page.getByRole('dialog', { name: 'Jawaban belum tepat' })).toBeVisible();
  await page.getByRole('button', { name: 'COBA LAGI' }).click();
  await choice('B').click();
  await choice('C').click();
  await choice('D').click();
  await choice('A').click();
  await check.click();
  await expect(page.getByRole('dialog', { name: 'Jawaban benar' })).toBeVisible();
  await page.getByRole('dialog').locator('img.mission3-dialog-art').evaluate(img => img.decode());
  await page.screenshot({ path: testInfo.outputPath('correct.png') });
  await expect(page.getByTestId('mission3-completion')).toHaveCount(0);
  await page.getByRole('button', { name: 'LANJUT', exact: true }).click();
  await expect(page.getByTestId('mission3-completion')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('complete.png') });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sterilab:evaluationProgress')).completed)).toBe(3);
  expect(errors).toEqual([]);
});

test('menu navigation persists mission 3 completion across reload', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('sterilab:evaluationProgress')) {
      localStorage.setItem('sterilab:evaluationProgress', JSON.stringify({ version: 1, completed: 2 }));
    }
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/src/presentation/pages/evaluation/misson_3/audit.html?menu');
  await expect(page.getByTestId('evaluation-progress-count')).toContainText('2/4');
  await page.getByTestId('evaluation-mission-card-3').click();
  await expect(page.getByTestId('mission3-main')).toBeVisible();
  await page.getByTestId('mission3-choice-A').click();
  await page.getByTestId('mission3-choice-D').click();
  await page.getByRole('button', { name: 'PERIKSA JAWABAN' }).click();
  await expect(page.getByRole('dialog', { name: 'Jawaban benar' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sterilab:evaluationProgress')).completed)).toBe(2);
  await page.getByRole('button', { name: 'LANJUT', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sterilab:evaluationProgress')).completed)).toBe(3);
  await page.getByRole('button', { name: 'LANJUT MISI' }).click();
  await expect(page.getByTestId('evaluation-progress-count')).toContainText('3/4');
  await expect(page.getByTestId('evaluation-progress-mission-1')).toHaveAttribute('data-status', 'completed');
  await expect(page.getByTestId('evaluation-progress-mission-2')).toHaveAttribute('data-status', 'completed');
  await expect(page.getByTestId('evaluation-progress-mission-3')).toHaveAttribute('data-status', 'completed');
  await expect(page.getByTestId('evaluation-progress-mission-4')).toHaveAttribute('data-status', 'available');
  await page.reload();
  await expect(page.getByTestId('evaluation-progress-count')).toContainText('3/4');
});

test('entrances are staggered and respect reduced motion', async ({ page }) => {
  await page.goto('/src/presentation/pages/evaluation/misson_3/audit.html');
  const main = page.getByTestId('mission3-main');
  const delays = await main.locator(':scope > *').evaluateAll(elements => elements.map(element => getComputedStyle(element).animationDelay));
  expect(new Set(delays).size).toBeGreaterThan(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(main.locator(':scope > *').first()).toHaveCSS('animation-name', 'none');
  await expect(page.getByRole('complementary', { name: 'Pengantar dan tugas siswa' })).toHaveCSS('scrollbar-width', 'thin');
});
