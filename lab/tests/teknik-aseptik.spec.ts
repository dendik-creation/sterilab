import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForMotionSettled } from './settle';
import { skipCaseNarration } from './case';

// Stage 4 - Teknik Kerja Aseptik, Langkah 1 "Cuci tangan". Figma "Sterilab-APHP"
// canvas 42:678, frame 42:679 "LANGKAH 1" (1920x1080). Landscape-only app
// (ADR-0002); the portrait project has its own spec.
test.beforeEach(({ viewport }) => {
  test.skip(!viewport || viewport.width <= viewport.height, 'landscape-only app');
});

const SOAP = 'Ambil sabun antiseptik';
const HANDS = 'Gosok kedua telapak tangan';
const TAP = 'Buka kran air dan bilas tangan';

async function gotoStage(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  await skipCaseNarration(page);
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  await page.getByRole('button', { name: /^Mulai Misi 1:/ }).click({ timeout: 5000 });
  await expect(page.getByRole('heading', { name: 'TEKNIK KERJA ASEPTIK' })).toBeVisible({ timeout: 5000 });
  await waitForMotionSettled(page);
}

// Stage's safe layer is a 16:9 box centred in the viewport - the same box every
// coordinate in the Figma frame is measured against.
async function stageBox(page: Page) {
  return page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });
}

// A bounding box expressed back in the frame's own 1920x1080 coordinates.
async function designBox(page: Page, locator: ReturnType<Page['getByRole']>) {
  const [box, stage] = await Promise.all([locator.boundingBox(), stageBox(page)]);
  expect(box).not.toBeNull();
  return {
    x: ((box!.x - stage.left) / stage.w) * 1920,
    y: ((box!.y - stage.top) / stage.h) * 1080,
    w: (box!.width / stage.w) * 1920,
    h: (box!.height / stage.h) * 1080,
    raw: box!,
    stage,
  };
}

function workspace(page: Page) {
  return page.getByAltText(/Wastafel laboratorium/);
}

async function backgroundFrame(page: Page): Promise<string> {
  const src = await workspace(page).getAttribute('src');
  return src?.match(/(\d)\.png/)?.[1] ?? src ?? '';
}

test('opens on Langkah 1 with only the first instruction pill and the first frame', async ({ page }) => {
  await gotoStage(page);

  await expect(page.getByText('PROSEDUR', { exact: true })).toBeVisible();
  await expect(page.getByText('Langkah 1 / 12', { exact: true })).toBeVisible();
  await expect(page.getByText('Cuci tangan', { exact: true })).toBeVisible();
  await expect(page.getByText('Cuci tangan dengan sabun hingga bersih sebelum memulai pekerjaan.', { exact: true })).toBeVisible();
  await expect(page.getByText('Klik sabun, lalu tangan, kemudian air untuk mencuci tangan dengan benar.', { exact: true })).toBeVisible();

  // Pills are revealed one step at a time, so only the first one exists yet.
  await expect(page.getByText('1.  Klik sabun', { exact: true })).toBeVisible();
  await expect(page.getByText('2.  Klik tangan', { exact: true })).not.toBeAttached();
  await expect(page.getByText('3.  Klik Kran Air', { exact: true })).not.toBeAttached();

  expect(await backgroundFrame(page)).toBe('1');
  await expect(page.getByRole('group', { name: 'Tangan telah dibersihkan!' })).not.toBeAttached();
  expect(new URL(page.url()).pathname).toBe('/');
});

test('only the next object in the sequence is clickable, and each click advances the frame', async ({ page }) => {
  await gotoStage(page);

  // Out-of-order clicks must be refused by the control itself, not silently
  // ignored - a disabled button is what tells the Analyst it is not their turn.
  await expect(page.getByRole('button', { name: SOAP })).toBeEnabled();
  await expect(page.getByRole('button', { name: HANDS })).toBeDisabled();
  await expect(page.getByRole('button', { name: TAP })).toBeDisabled();

  await page.getByRole('button', { name: SOAP }).click();
  expect(await backgroundFrame(page)).toBe('2');
  await expect(page.getByText('2.  Klik tangan', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: HANDS })).toBeEnabled();
  await expect(page.getByRole('button', { name: TAP })).toBeDisabled();

  await page.getByRole('button', { name: HANDS }).click();
  expect(await backgroundFrame(page)).toBe('3');
  await expect(page.getByText('3.  Klik Kran Air', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: TAP })).toBeEnabled();

  await page.getByRole('button', { name: TAP }).click();
  expect(await backgroundFrame(page)).toBe('4');
  // Every object is spent, so nothing in the workspace stays clickable.
  for (const name of [SOAP, HANDS, TAP]) {
    await expect(page.getByRole('button', { name: new RegExp(name) })).toBeDisabled();
  }
});

test('finishing the step raises the note card, and LANJUT advances to Langkah 2', async ({ page }) => {
  await gotoStage(page);
  for (const name of [SOAP, HANDS, TAP]) await page.getByRole('button', { name }).click();

  const note = page.getByRole('group', { name: 'Tangan telah dibersihkan!' });
  await expect(note).toBeVisible({ timeout: 4000 });
  await expect(page.getByText('Anda siap melanjutkan ke langkah berikutnya.', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);

  // It rises in from below - it must land fully inside the stage, not hang off
  // the bottom edge, at any of the supported sizes.
  const box = await designBox(page, page.getByRole('group', { name: 'Tangan telah dibersihkan!' }));
  expect(box.raw.y + box.raw.height).toBeLessThanOrEqual(box.stage.top + box.stage.h + 1);
  // Bottom edge is the anchored one (1001.159 of 1080); the card grows upwards.
  expect(Math.abs(box.y + box.h - 1001.159)).toBeLessThan(4);

  const lanjut = page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' });
  await expect(lanjut).toBeVisible();
  await lanjut.click();

  // Steps advance in place - the Screen is one workspace walking through
  // PROCEDURE_STEPS, not a navigation per step.
  await expect(page.getByText('Langkah 2 / 12', { exact: true })).toBeVisible();
  await expect(page.getByText('Memakai APD', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Tangan telah dibersihkan!' })).not.toBeAttached();
});

test('chrome and instruction pills land on their Figma coordinates at every supported size', async ({ page }) => {
  await gotoStage(page);

  // Instruction pill 1 (Figma group 60:384) - the tightest one, because it has
  // to stay on the soap bottle it points at.
  const pill = await designBox(page, page.getByText('1.  Klik sabun', { exact: true }));
  expect(Math.abs(pill.x + pill.w / 2 - (583.288 + 205.521 / 2)), 'pill 1 centre x').toBeLessThan(6);
  expect(Math.abs(pill.y + pill.h / 2 - (358.358 + 54.616 / 2)), 'pill 1 centre y').toBeLessThan(6);

  // Procedure card banner (Figma group 60:139) at x=49.917, y=219.623, w=506.572.
  const banner = await designBox(page, page.getByText('PROSEDUR', { exact: true }));
  expect(Math.abs(banner.y - 241.749), 'PROSEDUR y').toBeLessThan(6);

  // Floating hint card's tab (Figma group 60:308) at x=1535.317, y=221.17.
  const hintTab = await designBox(page, page.getByText('Langkah 1', { exact: true }).last());
  expect(Math.abs(hintTab.x - 1535.317), 'hint tab x').toBeLessThan(6);
  expect(Math.abs(hintTab.y - 221.17), 'hint tab y').toBeLessThan(6);
});

test('top-bar icons keep a 44x44 touch target and never collide with the title', async ({ page }) => {
  await gotoStage(page);

  const boxes = [];
  for (const name of ['Menu Utama', 'Kembali', /suara/] as const) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box, `${name} box`).not.toBeNull();
    expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    boxes.push(box!);
  }
  expect(boxes[0].x + boxes[0].width, 'home/back overlap').toBeLessThanOrEqual(boxes[1].x);

  const viewport = page.viewportSize()!;
  expect(boxes[2].x + boxes[2].width, 'sound icon off-screen').toBeLessThanOrEqual(viewport.width);

  // At 568x320 the designed title x lands inside the widened back button, so
  // the title has its own floor - and the whole pair has to clear the icons.
  const title = (await page.getByRole('heading', { name: 'TEKNIK KERJA ASEPTIK' }).boundingBox())!;
  const subtitle = (await page.getByText('Lakukan prosedur dengan urutan yang benar', { exact: true }).boundingBox())!;
  expect(title.x, 'title overlaps back button').toBeGreaterThanOrEqual(boxes[1].x + boxes[1].width);
  expect(subtitle.x + subtitle.width, 'subtitle overlaps sound icon').toBeLessThanOrEqual(boxes[2].x);
  // Both lines stay inside the band they are centred in.
  const bandBottom = (await page.locator('header').boundingBox())!;
  expect(subtitle.y + subtitle.height).toBeLessThanOrEqual(bandBottom.y + bandBottom.height + 1);
});

test('object hit areas keep a 44x44 touch target and stay clear of the procedure card', async ({ page }) => {
  await gotoStage(page);

  const card = (await page.getByText('Cuci tangan dengan sabun hingga bersih sebelum memulai pekerjaan.', { exact: true }).boundingBox())!;
  for (const name of [SOAP, HANDS, TAP]) {
    const box = (await page.getByRole('button', { name }).boundingBox())!;
    expect(box.width, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${name} height`).toBeGreaterThanOrEqual(44);
    // The card is opaque chrome; an object hidden behind it could not be
    // clicked even though the sequence demands it.
    expect(box.x, `${name} behind procedure card`).toBeGreaterThan(card.x + card.width);
  }
});

test('progress is announced, not only shown in the artwork', async ({ page }) => {
  await gotoStage(page);

  const live = page.locator('[aria-live="polite"]');
  await expect(live).toHaveText(/Tindakan 0 dari 3 selesai\. Berikutnya: Ambil sabun antiseptik\./);

  await page.getByRole('button', { name: SOAP }).click();
  await expect(live).toHaveText(/Tindakan 1 dari 3 selesai\. Berikutnya: Gosok kedua telapak tangan\./);

  await page.getByRole('button', { name: HANDS }).click();
  await page.getByRole('button', { name: TAP }).click();
  await expect(live).toHaveText(/Tangan telah dibersihkan!/);
});

// ---------------------------------------------------------------------------
// Langkah 2 "Memakai APD" - Figma frame 58:2.
//
// The frame itself only specifies a checklist (tick six boxes, press Selesai).
// That is what a phone gets, because six 44px sockets will not fit on an
// analyst who is ~67 CSS px wide at 568x320. From 1024px up the same six tiles
// are also draggable onto sockets on the body, so the assertions below fork on
// viewport width rather than pretending one interaction serves both.
// ---------------------------------------------------------------------------

const APD = [
  { name: 'Jas laboratorium', part: 'badan' },
  { name: 'Kacamata pelindung', part: 'mata' },
  { name: 'Sarung tangan', part: 'tangan' },
  { name: 'Masker wajah', part: 'wajah' },
  { name: 'Sepatu keselamatan', part: 'kaki' },
  { name: 'Penutup kepala', part: 'kepala' },
] as const;

type Apd = (typeof APD)[number];

function isPhone(page: Page): boolean {
  return page.viewportSize()!.width < 1024;
}

function tile(page: Page, item: Apd) {
  const suffix = isPhone(page) ? `pasang pada ${item.part}` : `seret ke ${item.part} analis`;
  return page.getByRole('button', { name: `${item.name}, ${suffix}`, exact: true });
}

function placedTile(page: Page, item: Apd) {
  return page.getByRole('button', { name: `${item.name} sudah terpasang di ${item.part}`, exact: true });
}

function socket(page: Page, item: Apd) {
  return page.getByRole('button', { name: `Pasang APD pada ${item.part} analis`, exact: true });
}

function lockerArt(page: Page) {
  return page.getByAltText(/Ruang ganti laboratorium|Analis yang sama kini/);
}

async function lockerFrame(page: Page): Promise<string> {
  const src = await lockerArt(page).getAttribute('src');
  return src?.match(/(\d)\.png/)?.[1] ?? src ?? '';
}

async function gotoStep2(page: Page): Promise<void> {
  await gotoStage(page);
  for (const name of [SOAP, HANDS, TAP]) await page.getByRole('button', { name }).click();
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click({ timeout: 5000 });
  await expect(page.getByText('Langkah 2 / 12', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);
}

// Puts one item on the analyst through whichever path this viewport supports.
async function wear(page: Page, item: Apd): Promise<void> {
  await tile(page, item).click();
  if (!isPhone(page)) await socket(page, item).click();
  await expect(placedTile(page, item)).toBeVisible();
}

test('Langkah 2 opens with nothing worn, the first frame, and Selesai locked', async ({ page }) => {
  await gotoStep2(page);

  await expect(page.getByText('Memakai APD', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Kenakan seluruh alat pelindung diri sebelum memasuki area kerja aseptik.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Pilih semua APD secara lengkap :', { exact: true })).toBeVisible();

  for (const item of APD) await expect(tile(page, item)).toBeVisible();

  // Selesai is the confirm, not a shortcut: it cannot fire until all six land.
  await expect(page.getByRole('button', { name: 'Selesai', exact: true })).toBeDisabled();
  expect(await lockerFrame(page)).toBe('1');
  await expect(page.getByRole('group', { name: 'Seluruh APD telah dipakai!' })).not.toBeAttached();
});

test('an item dropped on the wrong body part is refused with a written reason', async ({ page }) => {
  test.skip(isPhone(page), 'sockets only exist from 1024px up');
  await gotoStep2(page);

  const goggles = APD[1];
  const cap = APD[5];

  await tile(page, goggles).click();
  await socket(page, cap).click();

  // Refused, and refused out loud - the point of the step is knowing where each
  // item goes, so a silent snap-back would teach nothing.
  await expect(page.locator('[aria-live="polite"]')).toHaveText(
    'Kacamata pelindung dipakai di mata, bukan di kepala.',
  );
  await expect(tile(page, goggles)).toBeVisible();
  await expect(placedTile(page, goggles)).not.toBeAttached();

  await socket(page, goggles).click();
  await expect(placedTile(page, goggles)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kacamata pelindung terpasang di mata. Lepas.' })).toBeVisible();
});

test('dragging a tile onto its socket equips it', async ({ page }) => {
  test.skip(isPhone(page), 'drag needs sockets, which only exist from 1024px up');
  await gotoStep2(page);

  const coat = APD[0];
  const from = (await tile(page, coat).boundingBox())!;
  const to = (await socket(page, coat).boundingBox())!;

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 16 });
  await page.mouse.up();

  await expect(placedTile(page, coat)).toBeVisible();
});

test('a worn item can be taken off again', async ({ page }) => {
  await gotoStep2(page);
  const gloves = APD[2];

  await wear(page, gloves);
  await placedTile(page, gloves).click();
  await expect(tile(page, gloves)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Selesai', exact: true })).toBeDisabled();
});

test('wearing every item unlocks Selesai, switches the art, and LANJUT returns to Missions', async ({ page }) => {
  await gotoStep2(page);
  for (const item of APD) await wear(page, item);

  const selesai = page.getByRole('button', { name: 'Selesai', exact: true });
  await expect(selesai).toBeEnabled();
  // Only frame 2 exists for this step, so the art may only change on confirm.
  expect(await lockerFrame(page)).toBe('1');

  await selesai.click();
  expect(await lockerFrame(page)).toBe('2');

  const note = page.getByRole('group', { name: 'Seluruh APD telah dipakai!' });
  await expect(note).toBeVisible({ timeout: 4000 });
  await waitForMotionSettled(page);

  const box = await designBox(page, note);
  expect(box.raw.y + box.raw.height).toBeLessThanOrEqual(box.stage.top + box.stage.h + 1);
  expect(Math.abs(box.y + box.h - 1001.159)).toBeLessThan(4);

  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
  // Langkah 2 is the last authored step, so LANJUT falls through to Missions
  // rather than dead-ending on an empty workspace.
  await expect(page.getByRole('heading', { name: 'TEKNIK KERJA ASEPTIK' })).toBeVisible();
  await expect(page.getByAltText(/Dashboard SteriLab/)).toBeVisible({ timeout: 4000 });
});

test('Langkah 2 card and grid land on their Figma coordinates', async ({ page }) => {
  await gotoStep2(page);

  // Floating card's tab (Figma group 62:802) at x=1494.754, y=221.17.
  const tab = await designBox(page, page.getByText('Langkah 2', { exact: true }).last());
  expect(Math.abs(tab.x - 1494.754), 'APD tab x').toBeLessThan(6);
  expect(Math.abs(tab.y - 221.17), 'APD tab y').toBeLessThan(6);

  // Grid columns (Figma checkbox centres 1454.19 / 1609.77 / 1763.11) and the
  // two rows the frame mirrors around.
  const coat = await designBox(page, tile(page, APD[0]));
  const goggles = await designBox(page, tile(page, APD[1]));
  const mask = await designBox(page, tile(page, APD[3]));
  expect(Math.abs(coat.x + coat.w / 2 - 1451.69), 'column 1 centre').toBeLessThan(8);
  expect(Math.abs(goggles.x + goggles.w / 2 - 1609.75), 'column 2 centre').toBeLessThan(8);
  expect(coat.y + coat.h, 'row 1 sits above row 2').toBeLessThanOrEqual(mask.y + 1);
});

test('Langkah 2 controls keep a 44x44 touch target and never overlap each other', async ({ page }) => {
  await gotoStep2(page);

  const stage = await stageBox(page);
  const card = (await page.getByText('Pilih semua APD secara lengkap :', { exact: true }).boundingBox())!;

  for (const item of APD) {
    const box = (await tile(page, item).boundingBox())!;
    expect(box.width, `${item.name} tile width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${item.name} tile height`).toBeGreaterThanOrEqual(44);
  }

  const selesai = (await page.getByRole('button', { name: 'Selesai', exact: true }).boundingBox())!;
  expect(selesai.height, 'Selesai height').toBeGreaterThanOrEqual(44);
  // The card grows downwards from a fixed top edge; on the smallest viewport
  // the floored button and copy must still land inside the stage.
  expect(selesai.y + selesai.height, 'Selesai below the stage').toBeLessThanOrEqual(stage.top + stage.h + 1);

  if (isPhone(page)) return;

  const procedure = (await page
    .getByText('Kenakan seluruh alat pelindung diri sebelum memasuki area kerja aseptik.', { exact: true })
    .boundingBox())!;

  const sockets: { name: string; box: { x: number; y: number; width: number; height: number } }[] = [];
  for (const item of APD) {
    const box = (await socket(page, item).boundingBox())!;
    expect(box.width, `${item.part} socket width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${item.part} socket height`).toBeGreaterThanOrEqual(44);
    // A socket hidden behind either card could not be dropped on.
    expect(box.x, `${item.part} socket behind procedure card`).toBeGreaterThan(procedure.x + procedure.width);
    expect(box.x + box.width, `${item.part} socket behind APD card`).toBeLessThan(card.x);
    sockets.push({ name: item.part, box });
  }

  // Mata and Wajah are only ~53 design px apart on the face - closer than two
  // floored sockets may sit - which is why both are nudged aside in the data.
  for (let i = 0; i < sockets.length; i += 1) {
    for (let j = i + 1; j < sockets.length; j += 1) {
      const a = sockets[i].box;
      const b = sockets[j].box;
      const overlaps = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      expect(overlaps, `${sockets[i].name} overlaps ${sockets[j].name}`).toBe(false);
    }
  }
});

test('Langkah 2 progress is announced, not only shown in the checkboxes', async ({ page }) => {
  await gotoStep2(page);
  const live = page.locator('[aria-live="polite"]');

  await expect(live).toHaveText('0 dari 6 APD terpasang.');
  await wear(page, APD[0]);
  await expect(live).toHaveText('1 dari 6 APD terpasang.');

  for (const item of APD.slice(1)) await wear(page, item);
  await expect(live).toHaveText('Seluruh APD terpasang. Tekan Selesai untuk melanjutkan.');

  await page.getByRole('button', { name: 'Selesai', exact: true }).click();
  await expect(live).toHaveText(/Seluruh APD telah dipakai!/);
});
