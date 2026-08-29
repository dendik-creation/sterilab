import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForMotionSettled } from './settle';

// Screen 5 - Missions (Figma "Sterilab-APHP" node 29:2435 "Scene 03: Navigasi
// (Menu Utama)"). Landscape-only app (ADR-0002); the portrait project has its
// own spec.
test.beforeEach(({ viewport }) => {
  test.skip(!viewport || viewport.width <= viewport.height, 'landscape-only app');
});

const STORAGE_KEY = 'sterilab:levelProgress';

// Missions is reached through Splash -> Home -> Case -> Missions, and each
// hop plays its own exit transition, so every wait below is on the next
// Screen's own content rather than on a fixed delay.
// Pass `completedLevels` to seed the unlock ledger before the app boots; omit
// it to walk in on whatever this browser context already has stored (a fresh
// context starts empty, which is the real first-run state).
async function gotoMissions(page: Page, completedLevels?: number): Promise<void> {
  if (completedLevels !== undefined) {
    await page.addInitScript(
      ([key, completed]) => {
        window.localStorage.setItem(key as string, JSON.stringify({ version: 1, completed }));
      },
      [STORAGE_KEY, completedLevels] as const,
    );
  }

  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  await page.getByRole('button', { name: 'Baca Selengkapnya' }).click({ timeout: 5000 });
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  await expect(page.getByAltText(/Dashboard SteriLab/)).toBeVisible({ timeout: 5000 });

  await waitForMotionSettled(page);
}

function card(page: Page, name: RegExp) {
  return page.getByRole('button', { name });
}

test('renders all five menu cards plus the note card, with only Misi 1 unlocked on a fresh install', async ({ page }) => {
  await gotoMissions(page);

  await expect(card(page, /^Mulai Misi 1: Teknik Kerja Aseptik$/)).toBeEnabled();
  for (const [n, title] of [
    [2, 'Pembuatan Media Kultur Mikroba'],
    [3, 'Pengelolaan Limbah Laboratorium'],
    [4, 'Evaluasi'],
    [5, 'Refleksi'],
  ] as const) {
    const locked = card(page, new RegExp(`^Misi ${n}: ${title} - terkunci`));
    await expect(locked).toBeVisible();
    await expect(locked).toBeDisabled();
    // "Locked" must state a reason, not just look grey (TASKS.md > Screen 5).
    await expect(locked).toHaveAccessibleName(new RegExp(`Selesaikan Misi ${n - 1} lebih dulu`));
  }

  await expect(page.getByAltText(/Selesaikan setiap menu secara berurutan/)).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');
});

test('completing a menu unlocks exactly the next one and keeps the finished one re-openable', async ({ page }) => {
  await gotoMissions(page, 2);

  await expect(card(page, /^Ulangi Misi 1: Teknik Kerja Aseptik$/)).toBeEnabled();
  await expect(card(page, /^Ulangi Misi 2: Pembuatan Media Kultur Mikroba$/)).toBeEnabled();
  await expect(card(page, /^Mulai Misi 3: Pengelolaan Limbah Laboratorium$/)).toBeEnabled();
  await expect(card(page, /^Misi 4: Evaluasi - terkunci/)).toBeDisabled();
  await expect(card(page, /^Misi 5: Refleksi - terkunci/)).toBeDisabled();
});

test('finishing a menu writes through to localStorage and the unlock survives a reload', async ({ page }) => {
  await gotoMissions(page);
  await expect(card(page, /^Misi 2:.* terkunci/)).toBeDisabled();

  // Driven through the real core module (the Stage Screens will call this
  // once they exist) rather than by hand-writing the storage payload, so the
  // schema this test asserts is the one the app actually writes.
  const stored = await page.evaluate(async (key) => {
    const mod = await import('/src/core/progress/levelProgress.ts');
    mod.markLevelCompleted(1);
    return window.localStorage.getItem(key as string);
  }, STORAGE_KEY);
  expect(stored).toBe(JSON.stringify({ version: 1, completed: 1 }));

  // Re-entered from a cold load, so this reads the stored ledger rather than
  // any in-memory state left over from above.
  await gotoMissions(page);
  await expect(card(page, /^Ulangi Misi 1: Teknik Kerja Aseptik$/)).toBeEnabled();
  await expect(card(page, /^Mulai Misi 2: Pembuatan Media Kultur Mikroba$/)).toBeEnabled();
  await expect(card(page, /^Misi 3:.* terkunci/)).toBeDisabled();
});

test('menu cards and the note card land on their Figma positions at every supported size', async ({ page }) => {
  await gotoMissions(page);

  // Stage's safe layer is a 16:9 box centered in the viewport - the same box
  // every percentage in the design is measured against.
  const stage = await page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });

  // Figma 42:36: cards at y=421.195/1080, x = 252.878 + (n-1) * 291.098 of 1920.
  const expectedLeft = [252.878, 543.976, 835.074, 1126.172, 1417.27];
  const names = [
    /^Mulai Misi 1:/,
    /^Misi 2:.* terkunci/,
    /^Misi 3:.* terkunci/,
    /^Misi 4:.* terkunci/,
    /^Misi 5:.* terkunci/,
  ];

  for (let i = 0; i < names.length; i += 1) {
    const box = await card(page, names[i]).boundingBox();
    expect(box, `card ${i + 1} box`).not.toBeNull();
    const relLeft = ((box!.x - stage.left) / stage.w) * 1920;
    const relTop = ((box!.y - stage.top) / stage.h) * 1080;
    expect(Math.abs(relLeft - expectedLeft[i]), `card ${i + 1} x`).toBeLessThan(3);
    expect(Math.abs(relTop - 421.195), `card ${i + 1} y`).toBeLessThan(3);
    // 254x430 (card 1) / 257x430 - one design pixel of slack for rounding.
    expect(Math.abs((box!.height / stage.h) * 1080 - 430), `card ${i + 1} height`).toBeLessThan(3);
  }

  // Note card (group 42:677): 685x93 at x=617.487, y=962.149 - and it must
  // stay fully inside the safe layer, not hang off the bottom edge.
  const note = await page.getByAltText(/Selesaikan setiap menu secara berurutan/).boundingBox();
  expect(note).not.toBeNull();
  expect(Math.abs(((note!.x - stage.left) / stage.w) * 1920 - 617.487)).toBeLessThan(4);
  expect(Math.abs(((note!.y - stage.top) / stage.h) * 1080 - 962.149)).toBeLessThan(4);
  expect(note!.y + note!.height).toBeLessThanOrEqual(stage.top + stage.h + 1);
});

test('top-bar icons keep a 44x44 touch target without overlapping or leaving the stage', async ({ page }) => {
  await gotoMissions(page);

  const boxes = [];
  for (const name of ['Menu Utama', 'Kembali', /suara/] as const) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box, `${name} box`).not.toBeNull();
    expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    boxes.push(box!);
  }

  // Home and Back are 25 design px apart at 1920 - once both are floored to
  // 44px on a 568px-wide phone that gap has to be re-derived, or they collide.
  expect(boxes[0].x + boxes[0].width, 'home/back overlap').toBeLessThanOrEqual(boxes[1].x);
  const viewport = page.viewportSize()!;
  expect(boxes[2].x + boxes[2].width, 'sound icon off-screen').toBeLessThanOrEqual(viewport.width);
});

test('cards never overlap the note card or the top bar', async ({ page }) => {
  await gotoMissions(page);

  const soundBox = (await page.getByRole('button', { name: /suara/ }).boundingBox())!;
  const noteBox = (await page.getByAltText(/Selesaikan setiap menu secara berurutan/).boundingBox())!;
  const cardBox = (await card(page, /^Mulai Misi 1:/).boundingBox())!;

  expect(cardBox.y, 'card overlaps top bar').toBeGreaterThan(soundBox.y + soundBox.height);
  expect(cardBox.y + cardBox.height, 'card overlaps note card').toBeLessThanOrEqual(noteBox.y);
});

test('leaving runs the exit transition before the Screen swaps, and reaches the selected menu', async ({ page }) => {
  await gotoMissions(page);

  const misi1 = card(page, /^Mulai Misi 1:/);
  await misi1.click();

  // The Screen must hold its content for the staggered exit instead of
  // swapping out from under a still-visible UI (same contract as Home's exit).
  // Misi 1 opens Stage 4's DOM Screen (see StagePage), so the landing marker is
  // its own heading rather than the Phaser stub's "Instruksi".
  await expect(misi1).toBeVisible();
  await expect(page.getByRole('heading', { name: 'TEKNIK KERJA ASEPTIK' })).not.toBeAttached();

  await expect(page.getByRole('heading', { name: 'TEKNIK KERJA ASEPTIK' })).toBeVisible({ timeout: 4000 });
  expect(new URL(page.url()).pathname).toBe('/');
});
