import { expect, test } from '@playwright/test';

for (const marker of [null, 'true', 'false'] as const) {
  test(`progress migration with marker ${marker}`, async ({ page }) => {
    await page.addInitScript((initialMarker) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', 'true');
      localStorage.setItem('sterilab:levelProgress', JSON.stringify({ version: 1, completed: 3 }));
      localStorage.setItem('sterilab:evaluationProgress', JSON.stringify({ version: 1, completed: 2 }));
      localStorage.setItem('sterilab:audioEnabled', 'false');
      localStorage.setItem('unrelated', 'keep');
      if (initialMarker !== null) localStorage.setItem('requireRestartProgress', initialMarker);
    }, marker);
    await page.goto('/');
    const state = () => page.evaluate(() => ({
      marker: localStorage.getItem('requireRestartProgress'),
      level: localStorage.getItem('sterilab:levelProgress'),
      evaluation: localStorage.getItem('sterilab:evaluationProgress'),
      audio: localStorage.getItem('sterilab:audioEnabled'),
      unrelated: localStorage.getItem('unrelated'),
    }));
    const first = await state();
    expect(first.marker).toBe('false');
    expect(first.audio).toBe('false');
    expect(first.unrelated).toBe('keep');
    expect(first.level === null).toBe(marker !== 'false');
    expect(first.evaluation === null).toBe(marker !== 'false');
    await page.evaluate(() => {
      localStorage.setItem('sterilab:levelProgress', JSON.stringify({ version: 1, completed: 1 }));
      localStorage.setItem('sterilab:evaluationProgress', JSON.stringify({ version: 1, completed: 1 }));
    });
    await page.reload();
    const afterReload = await state();
    expect(afterReload.marker).toBe('false');
    expect(JSON.parse(afterReload.level!).completed).toBe(1);
    expect(JSON.parse(afterReload.evaluation!).completed).toBe(1);
  });
}
