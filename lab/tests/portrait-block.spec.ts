import { test, expect } from '@playwright/test';

// ADR-0002 (landscape-only) + OrientationGuard's strict block. Only runs on
// the portrait project (phone-portrait-block-375x667 in playwright.config.ts).
test.beforeEach(({ viewport }) => {
  test.skip(!viewport || viewport.width > viewport.height, 'portrait-only check');
});

test('portrait shows the rotate prompt and inerts the app content behind it', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('alert')).toContainText('lanskap');

  // Strict block: the content wrapper is `inert` - not just visually
  // covered - so a screen reader/keyboard user can't reach it either.
  const contentInert = await page.evaluate(() => {
    const root = document.getElementById('root');
    const wrapper = root?.firstElementChild;
    return wrapper?.hasAttribute('inert') ?? false;
  });
  expect(contentInert).toBe(true);
});
