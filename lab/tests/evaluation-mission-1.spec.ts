import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { skipCaseNarration } from './case';
import { waitForMotionSettled } from './settle';

const STORAGE_KEY = 'sterilab:levelProgress';
const IMAGE_SIZE = { width: 1186, height: 645 };
const AREAS = [
  { id: 'mask', x: 449, y: 164, width: 260, height: 156, asset: 'problem-found-not-wearing-mask' },
  { id: 'petri-dish', x: 398, y: 428, width: 311, height: 110, asset: 'problem-found-petri-dish-left-open-for-a-long-time' },
  { id: 'test-tube', x: 617, y: 551, width: 242, height: 88, asset: 'problem-found-the-test-tube-was-placed-carelessly.' },
  { id: 'spill', x: 191, y: 551, width: 207, height: 88, asset: 'problem-found-spill-on-the-table' },
] as const;

test.beforeEach(({ viewport }) => {
  test.skip(!viewport || viewport.width <= viewport.height, 'landscape-only app');
});

async function openMission1(page: Page): Promise<void> {
  await page.addInitScript(
    ([key, completed]) => {
      window.localStorage.setItem(key as string, JSON.stringify({ version: 1, completed }));
    },
    [STORAGE_KEY, 3] as const,
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  await skipCaseNarration(page);
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  await expect(page.getByAltText(/Dashboard SteriLab/)).toBeVisible();
  await waitForMotionSettled(page);
  await page.getByRole('button', { name: /^Mulai Misi 4: Evaluasi$/ }).click();
  await expect(page.getByRole('heading', { name: 'EVALUASI STERILAB' })).toBeVisible();
  await page.getByRole('button', { name: 'Mulai Misi 1: Temukan Kesalahan' }).click();
  await expect(page.getByRole('heading', { name: 'MISI 01 — TEMUKAN KESALAHAN!' })).toBeVisible();
  await page.evaluate(async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
  });
}

async function expectArtworkPosition(page: Page): Promise<{ x: number; y: number; width: number; height: number }> {
  const viewport = page.viewportSize()!;
  const stageWidth = Math.min(viewport.width, (viewport.height * 16) / 9);
  const stageHeight = Math.min(viewport.height, (viewport.width * 9) / 16);
  const stageLeft = (viewport.width - stageWidth) / 2;
  const stageTop = (viewport.height - stageHeight) / 2;
  const image = page.getByTestId('mission1-image');
  const box = await image.boundingBox();
  expect(box, 'problem-set image box').not.toBeNull();

  const expected = {
    x: stageLeft + (596 / 1920) * stageWidth,
    y: stageTop + (220 / 1080) * stageHeight,
    width: (1186 / 1920) * stageWidth,
    height: (645 / 1080) * stageHeight,
  };
  expect(Math.abs(box!.x - expected.x), 'image x matches FigCraft').toBeLessThan(1.5);
  expect(Math.abs(box!.y - expected.y), 'image y matches FigCraft').toBeLessThan(1.5);
  expect(Math.abs(box!.width - expected.width), 'image width matches FigCraft').toBeLessThan(1.5);
  expect(Math.abs(box!.height - expected.height), 'image height matches FigCraft').toBeLessThan(1.5);

  for (const area of AREAS) {
    const region = await page.getByTestId(`mission1-area-${area.id}`).boundingBox();
    expect(region, `${area.id} indicator bounds`).not.toBeNull();
    expect(Math.abs(((region!.x - box!.x) / box!.width) * IMAGE_SIZE.width - area.x), `${area.id} x`).toBeLessThan(1);
    expect(Math.abs(((region!.y - box!.y) / box!.height) * IMAGE_SIZE.height - area.y), `${area.id} y`).toBeLessThan(1);
    expect(Math.abs((region!.width / box!.width) * IMAGE_SIZE.width - area.width), `${area.id} width`).toBeLessThan(1);
    expect(Math.abs((region!.height / box!.height) * IMAGE_SIZE.height - area.height), `${area.id} height`).toBeLessThan(1);
  }

  return box!;
}

test('Mission 1 reveals only mapped problems, uses matching assets, and stays aligned after resizing', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await openMission1(page);
  await waitForMotionSettled(page);

  const image = page.getByTestId('mission1-image');
  const artwork = page.getByTestId('mission1-art');
  await expect(image).toBeVisible();
  await expect(artwork).toBeVisible();
  await expect(artwork).toHaveJSProperty('naturalWidth', 1186);
  await expect(artwork).toHaveJSProperty('naturalHeight', 645);
  await expect(page.getByTestId('mission1-count')).toContainText('0/4');
  await expect(page.getByTestId('mission1-problem-found')).toHaveCount(0);
  const finishButton = page.getByRole('button', { name: 'Selesai' });
  await expect(finishButton).toBeDisabled();
  await expect(page.getByTestId('mission1-title')).toHaveClass(/sterilab-fade-in/);
  await expect(image).toHaveClass(/sterilab-bubble-in/);

  const soundButton = page.getByRole('button', { name: 'Matikan suara' });
  await expect(soundButton).toHaveAttribute('aria-pressed', 'true');
  await expect(soundButton.locator('img')).toHaveAttribute('src', /bgm_on_btn\.(?:png|webp)$/);
  await soundButton.click();
  const mutedButton = page.getByRole('button', { name: 'Nyalakan suara' });
  await expect(mutedButton).toHaveAttribute('aria-pressed', 'false');
  await expect(mutedButton.locator('img')).toHaveAttribute('src', /bgm_off_btn\.(?:png|webp)$/);
  await mutedButton.click();

  for (const area of AREAS) await expect(page.getByTestId(`mission1-area-${area.id}`)).toHaveCSS('opacity', '0');

  await expectArtworkPosition(page);
  if (page.viewportSize()!.width <= 667) {
    const instructions = page.getByTestId('mission1-instruction-scroll');
    const intro = await page.getByTestId('mission1-instruction-copy').boundingBox();
    const tasksHeading = await page.getByRole('heading', { name: 'Tugas Siswa' }).boundingBox();
    const instructionsBox = await instructions.boundingBox();
    expect(intro!.y + intro!.height, 'intro copy ends before the task heading').toBeLessThanOrEqual(tasksHeading!.y);

    await instructions.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const lastTask = await page.getByRole('listitem').last().boundingBox();
    expect(lastTask!.y, 'last task is reachable inside the scroll region').toBeGreaterThanOrEqual(instructionsBox!.y);
    expect(lastTask!.y + lastTask!.height).toBeLessThanOrEqual(instructionsBox!.y + instructionsBox!.height + 1);
    await instructions.evaluate((element) => {
      element.scrollTop = 0;
    });
  }
  await page.screenshot({ path: testInfo.outputPath('mission-1-initial.png') });

  let imageBox = (await image.boundingBox())!;
  await image.click({ position: { x: imageBox.width * 0.05, y: imageBox.height * 0.05 } });
  await expect(page.getByTestId('mission1-count')).toContainText('0/4');
  await expect(page.getByTestId('mission1-problem-found')).toHaveCount(0);

  const checks = [
    { viewport: { width: 1366, height: 768 }, areaIndex: 0 },
    { viewport: { width: 1024, height: 768 }, areaIndex: 1 },
    { viewport: { width: 568, height: 320 }, areaIndex: 2 },
    { viewport: { width: 1440, height: 900 }, areaIndex: 3 },
  ] as const;
  const found = new Set<string>();

  for (const { viewport, areaIndex } of checks) {
    await page.setViewportSize(viewport);
    imageBox = await expectArtworkPosition(page);
    const area = AREAS[areaIndex];
    const center = {
      x: ((area.x + area.width / 2) / IMAGE_SIZE.width) * imageBox.width,
      y: ((area.y + area.height / 2) / IMAGE_SIZE.height) * imageBox.height,
    };
    await image.click({ position: center });
    found.add(area.id);

    await expect(page.getByTestId('mission1-count')).toContainText(`${found.size}/4`);
    if (found.size < 4) await expect(finishButton).toBeDisabled();
    const popup = page.getByTestId('mission1-problem-found');
    await expect(popup).toHaveAttribute('data-problem-id', area.id);
    await expect(popup).toHaveAttribute('src', new RegExp(area.asset));
    await expect(popup).toHaveJSProperty('naturalWidth', 505);
    await expect(popup).toHaveJSProperty('naturalHeight', 410);
    for (const candidate of AREAS) {
      await expect(page.getByTestId(`mission1-area-${candidate.id}`)).toHaveCSS('opacity', found.has(candidate.id) ? '1' : '0');
    }
  }

  await page.setViewportSize({ width: 1024, height: 768 });
  imageBox = await expectArtworkPosition(page);
  await image.click({
    position: {
      x: ((AREAS[0].x + AREAS[0].width / 2) / IMAGE_SIZE.width) * imageBox.width,
      y: ((AREAS[0].y + AREAS[0].height / 2) / IMAGE_SIZE.height) * imageBox.height,
    },
  });
  await expect(page.getByTestId('mission1-count')).toContainText('4/4');
  await expect(page.getByTestId('mission1-problem-found')).toHaveAttribute('data-problem-id', 'mask');
  await expect(finishButton).toBeEnabled();

  const imagesLoaded = await page.evaluate(() => Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0));
  expect(imagesLoaded, 'all visible and discovered image assets load').toBe(true);
  expect(consoleErrors).toEqual([]);

  await finishButton.click();
  await expect(finishButton).toHaveClass(/sterilab-bubble-out/);
  await expect(page.getByRole('heading', { name: 'EVALUASI STERILAB' })).toBeVisible();
});
