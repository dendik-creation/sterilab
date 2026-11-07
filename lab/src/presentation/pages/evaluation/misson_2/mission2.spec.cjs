const { test, expect } = require('@playwright/test');

test('Mission 2 validates drops, completes in sequence, and preserves progress', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { if (request.url().includes('/assets/') && !request.failure()?.errorText.includes('ABORTED')) errors.push(request.url()); });
  await page.addInitScript(() => {
    localStorage.setItem('sterilab:levelProgress', JSON.stringify({ version: 1, completed: 3 }));
    localStorage.setItem('sterilab:evaluationProgress', JSON.stringify({ version: 1, completed: 1 }));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  const narration = page.getByTestId('case-narration');
  await narration.waitFor({ state: 'attached' });
  await narration.evaluate(async el => {
    if (!Number.isFinite(el.duration)) await new Promise(resolve => el.addEventListener('loadedmetadata', resolve, { once: true }));
    el.currentTime = Math.max(0, el.duration - .05);
    await el.play().catch(() => {});
  });
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: /^Mulai Misi 4: Evaluasi$/ }).click();
  await expect(page.getByTestId('evaluation-progress-count')).toContainText('1/4');
  await page.getByTestId('evaluation-mission-card-2').click();
  await expect(page.getByTestId('mission2-scene')).toHaveAttribute('data-step', '0');
  const entrances = page.locator('.mission2-choice-entrance');
  await expect(entrances).toHaveCount(7);
  await expect(entrances.first()).toHaveCSS('animation-name', 'sterilab-bubble-in');
  await expect(entrances.first()).toHaveCSS('animation-delay', '0.6s');
  await expect(entrances.last()).toHaveCSS('animation-delay', '1.02s');
  await page.waitForTimeout(1700);
  await expect(page.getByTestId('mission2-choices')).toHaveCSS('grid-template-columns', /\S+ \S+ \S+/);
  await expect(page.getByRole('button', { name: 'Belum selesai' })).toBeDisabled();
  expect(await page.getByTestId('mission2-image').evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mission2-step0.png') });
  await page.evaluate(() => { window.dropSounds = 0; HTMLMediaElement.prototype.play = function () { if (this.src.includes('click')) window.dropSounds++; return Promise.resolve(); }; });
  async function drag(id, checkHover = false) {
    const card = await page.getByTestId(`mission2-card-${id}`).boundingBox();
    const target = await page.getByTestId('mission2-target').boundingBox();
    await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 });
    if (checkHover) {
      await expect(page.getByTestId('mission2-target')).toHaveAttribute('data-active', 'true');
      await expect(page.getByTestId('mission2-target').locator('svg rect')).toHaveCSS('animation-name', 'mission2-trail');
      await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2, { steps: 5 });
      await expect(page.getByTestId('mission2-target')).toHaveAttribute('data-active', 'false');
      await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 5 });
    }
    await page.mouse.up();
  }
  await drag('heat', true);
  await expect(page.getByTestId('mission2-count')).toContainText('0/7');
  await expect(page.getByRole('alert')).toContainText('URUTAN BELUM TEPAT');
  await page.screenshot({ path: testInfo.outputPath('mission2-incorrect.png') });
  const ids = ['read', 'weigh', 'dissolve', 'heat', 'ph', 'sterilize', 'pour'];
  for (let i = 0; i < ids.length; i++) {
    await drag(ids[i], i === 0);
    await expect(page.getByTestId('mission2-count')).toContainText(`${i + 1}/7`);
    await expect(page.getByTestId('mission2-image')).toHaveAttribute('src', new RegExp(`step_${i + 1}`));
    if (i === 0) await page.screenshot({ path: testInfo.outputPath('mission2-step1.png') });
    if (i < 6) await page.waitForTimeout(500);
  }
  expect(await page.evaluate(() => window.dropSounds)).toBe(8);
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('mission2-scene')).toHaveAttribute('data-step', '7');
  await expect(page.getByTestId('mission2-completion')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sterilab:evaluationProgress')).completed)).toBe(1);
  await page.getByRole('button', { name: 'Selesai', exact: true }).click();
  await expect(page.getByTestId('mission2-completion')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mission2-complete.png') });
  await page.getByRole('button', { name: 'LANJUT MISI' }).click();
  await expect(page.getByTestId('evaluation-progress-count')).toContainText('2/4');
  await expect(page.getByTestId('evaluation-mission-card-1')).toHaveAttribute('data-status', 'completed');
  await page.getByTestId('evaluation-mission-card-2').click();
  await expect(page.getByTestId('mission2-scene')).toHaveAttribute('data-step', '0');
  expect(errors).toEqual([]);
});
