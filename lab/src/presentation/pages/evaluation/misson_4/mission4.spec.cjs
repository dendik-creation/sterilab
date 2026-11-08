const { test, expect } = require('@playwright/test');

test('nine mappings, invalid drops and persisted completion', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { localStorage.setItem('requireRestartProgress', 'false'); Math.random = () => 0; if (!sessionStorage.getItem('mission4-audit-initialized')) { localStorage.setItem('sterilab:evaluationProgress', JSON.stringify({ version: 1, completed: 3, extra: 'keep' })); localStorage.setItem('mission4-audit-unrelated', 'keep'); sessionStorage.setItem('mission4-audit-initialized', 'yes'); } });
  await page.goto('/src/presentation/pages/evaluation/misson_4/audit.html');
  await expect(page.getByTestId('evaluation-progress-count')).toContainText('3/4');
  await page.getByTestId('evaluation-mission-card-4').click();
  await expect(page.getByTestId('mission4-main')).toBeVisible();
  await expect(page.getByRole('banner')).toHaveClass(/sterilab-bubble-in/);
  await page.getByRole('button', { name: 'Matikan suara' }).click();
  await expect(page.getByRole('button', { name: 'Nyalakan suara' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Nyalakan suara' }).click();
  await page.waitForTimeout(800);
  const list = page.getByLabel('Pilihan analisis');
  await expect(list.locator('button')).toHaveCount(9);
  await expect(list.locator('button').first()).toHaveAttribute('data-id', 'error-case-2');
  await expect(list.locator('button').last()).toHaveAttribute('data-id', 'error-case-1');
  expect(await list.evaluate(el => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto')).toBe(true);
  await page.screenshot({ path: 'src/presentation/pages/evaluation/misson_4/initial.png' });
  const drop = async (id, target) => {
    const source = page.getByTestId(id), destination = page.getByTestId(target);
    await source.scrollIntoViewIfNeeded();
    const a = await source.boundingBox(), b = await destination.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
    await expect(page.locator('.mission4-drag-preview')).toBeVisible();
    await page.mouse.up();
  };
  await drop('error-case-1', 'case-1-error');
  await expect(page.getByTestId('case-1-error')).toContainText('Limbah mikrobiologi');
  await drop('error-case-2', 'case-1-error');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('case-1-error')).toContainText('Limbah mikrobiologi');
  await drop('risk-case-2', 'case-2-error');
  await expect(page.getByTestId('risk-case-2')).toBeVisible();
  for (const category of ['error', 'risk', 'solution']) for (let n = 1; n <= 3; n++) {
    if (category === 'error' && n === 1) continue;
    await drop(`${category}-case-${n}`, `case-${n}-${category}`);
    if (category === 'solution' && n === 3) {
      await expect(page.getByTestId('mission4-main')).toHaveClass(/sterilab-bubble-out/);
      await expect(page.getByRole('banner')).toHaveClass(/sterilab-bubble-out/);
    }
  }
  await expect(page.getByTestId('mission4-completion')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sterilab:evaluationProgress')))).toEqual({ version: 1, completed: 4, extra: 'keep' });
  expect(await page.evaluate(() => localStorage.getItem('mission4-audit-unrelated'))).toBe('keep');
  expect(errors).toEqual([]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'src/presentation/pages/evaluation/misson_4/completion.png' });
  await page.getByRole('button', { name: /selesai/i }).click();
  await expect(page.getByTestId('evaluation-progress-count')).toContainText('4/4');
  await expect(page.getByTestId('evaluation-mission-card-4')).toHaveAttribute('data-status', 'completed');
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sterilab:evaluationProgress')).completed)).toBe(4);
  await expect(page.getByTestId('evaluation-progress-count')).toContainText('4/4');
});

test('navigation remains immediate with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { localStorage.setItem('requireRestartProgress', 'false'); localStorage.setItem('sterilab:evaluationProgress', JSON.stringify({ version: 1, completed: 3 })); });
  await page.goto('/src/presentation/pages/evaluation/misson_4/audit.html');
  await page.getByTestId('evaluation-mission-card-4').click();
  await expect(page.getByTestId('mission4-main')).toBeVisible();
  await page.getByRole('button', { name: 'Kembali' }).click();
  await expect(page.getByTestId('evaluation-progress-count')).toHaveText('3/4 misi selesai');
});
