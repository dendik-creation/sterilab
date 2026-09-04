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
  await expect(page.getByText('Langkah 1 / 6', { exact: true })).toBeVisible();
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
  await expect(page.getByText('Langkah 2 / 6', { exact: true })).toBeVisible();
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

test('the step marker row carries one dot per step, centred under the counter pill', async ({ page }) => {
  await gotoStage(page);

  const dots = page.getByTestId('step-dots');
  // Dropped below 1024px on purpose: each dot is ~8.8 CSS px there, and the
  // pill above already carries the same fact as real text.
  if (isPhone(page)) {
    await expect(dots).toHaveCount(0);
    return;
  }

  const markers = dots.locator('> span');
  await expect(markers, 'one marker per step').toHaveCount(6);

  const first = await designBox(page, markers.first());
  const last = await designBox(page, markers.last());

  // Figma's six-step frame draws 41.16 dots, not the 29.814 of the twelve-step
  // one (61:541, vectors 242:278 / 295 / 300 / 280 / 281 / 282).
  expect(Math.abs(first.w - 41.16), 'dot keeps its authored size').toBeLessThan(3);

  // Those six on their 64.4165 pitch span 363.24 design px: x runs 122.665 to
  // 444.747 + 41.16. Spreading them across the 467.068 rule instead - which is
  // what `space-between` does once the count drops below twelve - would make
  // the span the rule itself.
  const span = last.x + last.w - first.x;
  expect(Math.abs(span - 363.24), 'six dots keep their authored pitch').toBeLessThan(8);

  // And the shortened group sits under the counter pill, not hard left.
  const pill = await designBox(page, page.getByText('Langkah 1 / 6', { exact: true }));
  const rowCentre = (first.x + last.x + last.w) / 2;
  expect(Math.abs(rowCentre - (pill.x + pill.w / 2)), 'row centred on the pill').toBeLessThan(6);
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
// The Screen is a drag onto the analyst instead, on *every* viewport: a phone
// gets the same six sockets a desktop does. So no assertion about the
// *interaction* below forks on viewport width - the same drag is expected to
// work at 568x320 and at 1440x900 alike.
//
// The socket *layout* does fork, because a 44px-floored circle on a 568px stage
// is nearly twice its designed size. Both sets of centres are repeated here in
// the frame's own 1920x1080 coordinates, deliberately duplicated from
// data/stages/teknikAseptik.ts: this is the spec that says a drop target lands
// on the body part it claims, so it has to fail when the data drifts rather
// than move with it.
// ---------------------------------------------------------------------------

const APD = [
  { name: 'Jas laboratorium', part: 'badan', wide: { x: 934, y: 500 }, compact: { x: 934, y: 520 } },
  { name: 'Kacamata pelindung', part: 'mata', wide: { x: 934, y: 348 }, compact: { x: 770, y: 342 } },
  { name: 'Sarung tangan', part: 'tangan', wide: { x: 842, y: 682 }, compact: { x: 842, y: 682 } },
  { name: 'Masker wajah', part: 'wajah', wide: { x: 1052, y: 392 }, compact: { x: 1098, y: 392 } },
  { name: 'Sepatu keselamatan', part: 'kaki', wide: { x: 934, y: 1002 }, compact: { x: 934, y: 1000 } },
  { name: 'Penutup kepala', part: 'kepala', wide: { x: 934, y: 252 }, compact: { x: 934, y: 276 } },
] as const;

type Apd = (typeof APD)[number];

function isPhone(page: Page): boolean {
  return page.viewportSize()!.width < 1024;
}

function tile(page: Page, item: Apd) {
  return page.getByRole('button', { name: `${item.name}, seret ke ${item.part} analis`, exact: true });
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
  await expect(page.getByText('Langkah 2 / 6', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);
}

// Puts one item on the analyst through the tap path (pick up, then tap the body
// part) - the one that also serves the keyboard. `dragOnto` below covers the
// pointer path.
async function wear(page: Page, item: Apd): Promise<void> {
  await tile(page, item).click();
  await socket(page, item).click();
  await expect(placedTile(page, item)).toBeVisible();
}

async function center(locator: ReturnType<Page['getByRole']>) {
  const box = (await locator.boundingBox())!;
  expect(box).not.toBeNull();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// Mouse drag: press on the tile, travel to the target, release.
async function dragOnto(page: Page, item: Apd, target: Apd): Promise<void> {
  const from = await center(tile(page, item));
  const to = await center(socket(page, target));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 16 });
  await page.mouse.up();
}

// The same drag as a finger. Playwright's touchscreen can only tap, so the
// touch points go through CDP - which is what makes these real touch events
// (pointerType "touch", browser-managed pointer capture) rather than synthetic
// PointerEvents that would never exercise the capture path a finger takes when
// it slides off the tile it started on.
async function touchDragOnto(page: Page, item: Apd, target: Apd): Promise<void> {
  const session = await page.context().newCDPSession(page);
  const from = await center(tile(page, item));
  const to = await center(socket(page, target));
  const touch = (x: number, y: number) => [{ x, y, radiusX: 12, radiusY: 12, force: 1 }];

  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(from.x, from.y) });
  for (let i = 1; i <= 12; i += 1) {
    const t = i / 12;
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: touch(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t),
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
}

test('Langkah 2 opens with nothing worn, the first frame, and Selesai locked', async ({ page }) => {
  await gotoStep2(page);

  await expect(page.getByText('Memakai APD', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Kenakan seluruh alat pelindung diri sebelum memasuki area kerja aseptik.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Seret setiap APD ke tubuh analis :', { exact: true })).toBeVisible();

  for (const item of APD) {
    await expect(tile(page, item)).toBeVisible();
    // Every unworn tile carries the grip badge that says it can be dragged -
    // the affordance that replaced the empty checkbox when the step stopped
    // being a checklist.
    await expect(tile(page, item).locator('svg')).toHaveCount(1);
    // And every body part it can go to is on screen, on a phone as much as on
    // a desktop.
    await expect(socket(page, item)).toBeVisible();
  }

  // Selesai is the confirm, not a shortcut: it cannot fire until all six land.
  await expect(page.getByRole('button', { name: 'Selesai', exact: true })).toBeDisabled();
  expect(await lockerFrame(page)).toBe('1');
  await expect(page.getByRole('group', { name: 'Seluruh APD telah dipakai!' })).not.toBeAttached();
});

test('every drop target sits on the body part it is named after', async ({ page }) => {
  await gotoStep2(page);

  for (const item of APD) {
    const expected = isPhone(page) ? item.compact : item.wide;
    const box = await designBox(page, socket(page, item));
    expect(Math.abs(box.x + box.w / 2 - expected.x), `${item.part} socket centre x`).toBeLessThan(6);
    expect(Math.abs(box.y + box.h / 2 - expected.y), `${item.part} socket centre y`).toBeLessThan(6);
    // The floored circle has to stay inside the stage - kepala is the one that
    // used to float above the analyst's head, kaki the one nearest the bottom.
    expect(box.y, `${item.part} socket above the stage`).toBeGreaterThan(0);
    expect(box.y + box.h, `${item.part} socket below the stage`).toBeLessThan(1080);
  }
});

test('an item dropped on the wrong body part is refused with a written reason', async ({ page }) => {
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

test('dragging a tile onto its socket equips it, and onto the wrong one does not', async ({ page }) => {
  await gotoStep2(page);

  const coat = APD[0];
  const shoes = APD[4];

  await dragOnto(page, coat, coat);
  await expect(placedTile(page, coat)).toBeVisible();

  // A drag is refused by the same rule a tap is, and says why.
  await dragOnto(page, shoes, APD[5]);
  await expect(page.locator('[aria-live="polite"]')).toHaveText(
    'Sepatu keselamatan dipakai di kaki, bukan di kepala.',
  );
  await expect(tile(page, shoes)).toBeVisible();

  // A drag that ends nowhere near a socket is simply dropped, not scored.
  const stage = await stageBox(page);
  const from = await center(tile(page, shoes));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(stage.left + stage.w * 0.4, stage.top + stage.h * 0.9, { steps: 12 });
  await page.mouse.up();
  await expect(tile(page, shoes)).toBeVisible();
});

// The drag has to work with a finger, not only a mouse: this is the path that
// silently did nothing before, because the tile refused to start a drag below
// the 1024px breakpoint and there were no sockets to aim at anyway.
test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('a finger can drag a tile onto its socket', async ({ page }) => {
    await gotoStep2(page);

    const goggles = APD[1];
    await touchDragOnto(page, goggles, goggles);
    await expect(placedTile(page, goggles)).toBeVisible();

    // Including onto a socket that had to step off the head to fit - the leader
    // line is the only thing saying where it points, so it had better be
    // droppable.
    const mask = APD[3];
    await touchDragOnto(page, mask, mask);
    await expect(placedTile(page, mask)).toBeVisible();

    await expect(page.locator('[aria-live="polite"]')).toHaveText('2 dari 6 APD terpasang.');
  });
});

test('a worn item can be taken off again', async ({ page }) => {
  await gotoStep2(page);
  const gloves = APD[2];

  await wear(page, gloves);
  await placedTile(page, gloves).click();
  await expect(tile(page, gloves)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Selesai', exact: true })).toBeDisabled();
});

test('wearing every item unlocks Selesai, switches the art, and LANJUT advances to Langkah 3', async ({ page }) => {
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
  // Steps advance in place: Langkah 3 is authored now, so LANJUT walks
  // PROCEDURE_STEPS rather than falling through to Missions.
  await expect(page.getByText('Langkah 3 / 6', { exact: true })).toBeVisible();
  await expect(page.getByText('Membersihkan Meja Kerja', { exact: true })).toBeVisible();
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
  const card = (await page.getByText('Seret setiap APD ke tubuh analis :', { exact: true }).boundingBox())!;

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

// ---------------------------------------------------------------------------
// Langkah 3 "Membersihkan Meja Kerja" - Figma frame 61:541 "LANGKAH 3 NEW".
// Spray the bench, then wipe it; both are sweeps across the same strip.

const SEGMENTS = 5;
const WIPE_PASSES = 2;

function segment(page: Page, n: number) {
  return page.getByRole('button', { name: new RegExp(`^Bagian meja ${n} dari ${SEGMENTS}`) });
}

function benchArt(page: Page) {
  return page.getByAltText(/Meja kerja laboratorium di tengah ruangan/);
}

async function gotoStep3(page: Page): Promise<void> {
  await gotoStep2(page);
  for (const item of APD) await wear(page, item);
  await page.getByRole('button', { name: 'Selesai', exact: true }).click();
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click({ timeout: 5000 });
  await expect(page.getByText('Langkah 3 / 6', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);
}

// One sweep across the whole strip. Sampled finely on purpose: a sweep is
// applied while the pointer moves, so a spec that jumped the pointer in three
// hops would be testing the sampling rate rather than the interaction.
async function sweep(page: Page, direction: 'ltr' | 'rtl' = 'ltr'): Promise<void> {
  const first = (await segment(page, 1).boundingBox())!;
  const last = (await segment(page, SEGMENTS).boundingBox())!;
  const y = first.y + first.height / 2;
  const from = direction === 'ltr' ? first.x + 4 : last.x + last.width - 4;
  const to = direction === 'ltr' ? last.x + last.width - 4 : first.x + 4;

  await page.mouse.move(from, y);
  await page.mouse.down();
  for (let i = 1; i <= 30; i += 1) await page.mouse.move(from + (to - from) * (i / 30), y);
  await page.mouse.up();
}

async function touchSweep(page: Page): Promise<void> {
  const session = await page.context().newCDPSession(page);
  const first = (await segment(page, 1).boundingBox())!;
  const last = (await segment(page, SEGMENTS).boundingBox())!;
  const y = first.y + first.height / 2;
  const from = first.x + 4;
  const to = last.x + last.width - 4;
  const touch = (x: number) => [{ x, y, radiusX: 12, radiusY: 12, force: 1 }];

  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(from) });
  for (let i = 1; i <= 24; i += 1) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: touch(from + (to - from) * (i / 24)),
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('Langkah 3 opens dirty, on the spray phase, with the bottle in the card', async ({ page }) => {
  await gotoStep3(page);

  await expect(page.getByText('Membersihkan Meja Kerja', { exact: true })).toBeVisible();
  await expect(benchArt(page)).toBeVisible();
  await expect(page.getByTestId('tool-spray')).toBeVisible();
  await expect(page.getByTestId('tool-cloth')).toHaveCount(0);
  await expect(page.getByText(/^Semprot Permukaan Meja:/)).toBeVisible();

  // Every segment starts un-sprayed, and says so.
  for (let n = 1; n <= SEGMENTS; n += 1) {
    await expect(segment(page, n)).toHaveAccessibleName(new RegExp('semprot dengan alkohol 70%$'));
  }
  await expect(page.locator('[aria-live="polite"]')).toHaveText(
    `0 dari ${SEGMENTS} bagian meja tersemprot alkohol.`,
  );
});

test('one sweep sprays the whole bench and hands the card over to the cloth', async ({ page }) => {
  await gotoStep3(page);
  await sweep(page);

  await expect(page.locator('[aria-live="polite"]')).toHaveText(`0 dari ${SEGMENTS} bagian meja selesai diusap.`);
  await expect(page.getByTestId('tool-cloth')).toBeVisible();
  await expect(page.getByTestId('tool-spray')).toHaveCount(0);
  await expect(page.getByText(/^Usap Permukaan Meja:/)).toBeVisible();
  // Wet is not clean: the step is not finished by spraying alone.
  await expect(page.getByRole('group', { name: 'Meja kerja telah dibersihkan!' })).not.toBeAttached();
});

test('wiping takes a pass and a return pass, and finishing raises the note', async ({ page }) => {
  await gotoStep3(page);
  await sweep(page);

  // One sweep is one pass: every segment is half wiped, none of them done.
  await sweep(page);
  await expect(page.locator('[aria-live="polite"]')).toHaveText(`0 dari ${SEGMENTS} bagian meja selesai diusap.`);
  await expect(segment(page, 1)).toHaveAccessibleName(new RegExp(`1 dari ${WIPE_PASSES} usapan$`));

  await sweep(page, 'rtl');
  const note = page.getByRole('group', { name: 'Meja kerja telah dibersihkan!' });
  await expect(note).toBeVisible({ timeout: 4000 });
  await waitForMotionSettled(page);

  // Same note card geometry as every other step's (Figma bottom edge 1001.159).
  const box = await designBox(page, note);
  expect(box.raw.y + box.raw.height).toBeLessThanOrEqual(box.stage.top + box.stage.h + 1);
  expect(Math.abs(box.y + box.h - 1001.159)).toBeLessThan(4);

  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
  // Langkah 3 is the last authored step, so LANJUT falls through to Missions
  // rather than dead-ending on an empty workspace.
  await expect(page.getByAltText(/Dashboard SteriLab/)).toBeVisible({ timeout: 4000 });
});

test('a reversal inside one press counts as a second pass', async ({ page }) => {
  await gotoStep3(page);
  await sweep(page);

  // Out and back without lifting: the same stroke, two passes.
  const first = (await segment(page, 1).boundingBox())!;
  const last = (await segment(page, SEGMENTS).boundingBox())!;
  const y = first.y + first.height / 2;
  const from = first.x + 4;
  const to = last.x + last.width - 4;

  await page.mouse.move(from, y);
  await page.mouse.down();
  for (let i = 1; i <= 30; i += 1) await page.mouse.move(from + (to - from) * (i / 30), y);
  for (let i = 1; i <= 30; i += 1) await page.mouse.move(to + (from - to) * (i / 30), y);
  await page.mouse.up();

  await expect(page.getByRole('group', { name: 'Meja kerja telah dibersihkan!' })).toBeVisible({ timeout: 4000 });
});

test('the step is completable from the keyboard, with no sweep at all', async ({ page }) => {
  await gotoStep3(page);

  for (let n = 1; n <= SEGMENTS; n += 1) {
    await segment(page, n).focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('[aria-live="polite"]')).toHaveText(`0 dari ${SEGMENTS} bagian meja selesai diusap.`);

  for (let pass = 0; pass < WIPE_PASSES; pass += 1) {
    for (let n = 1; n <= SEGMENTS; n += 1) {
      await segment(page, n).focus();
      await page.keyboard.press('Enter');
    }
  }
  await expect(page.getByRole('group', { name: 'Meja kerja telah dibersihkan!' })).toBeVisible({ timeout: 4000 });
});

test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('a finger can sweep the bench clean', async ({ page }) => {
    await gotoStep3(page);

    await touchSweep(page);
    await expect(page.locator('[aria-live="polite"]')).toHaveText(`0 dari ${SEGMENTS} bagian meja selesai diusap.`);

    await touchSweep(page);
    await touchSweep(page);
    await expect(page.getByRole('group', { name: 'Meja kerja telah dibersihkan!' })).toBeVisible({ timeout: 4000 });
  });
});

test('a press that never reaches the bench is refused with a written reason', async ({ page }) => {
  await gotoStep3(page);

  const panel = (await page.getByTestId('tool-spray').boundingBox())!;
  const y = panel.y + panel.height / 2;
  await page.mouse.move(panel.x + panel.width / 2, y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(panel.x + panel.width / 2 + i * 4, y);
  await page.mouse.up();

  await expect(page.locator('[aria-live="polite"]')).toHaveText(
    'Arahkan ke permukaan meja kerja - hanya meja yang perlu dibersihkan.',
  );
  await expect(page.getByTestId('tool-spray')).toBeVisible();

  // And the refused sweep must not have armed the "this was a drag, not a
  // click" flag against the next real tap: a sweep that starts on the tool
  // never lands a click of its own to spend it on.
  await segment(page, 1).click();
  await expect(page.locator('[aria-live="polite"]')).toHaveText(
    `1 dari ${SEGMENTS} bagian meja tersemprot alkohol.`,
  );
});

test('Langkah 3 card and tool panel land on their Figma coordinates', async ({ page }) => {
  await gotoStep3(page);

  // Card tab (Figma group 229:462) at x=1535.317, y=220.129 - the same tab
  // position Langkah 1 uses.
  const tab = await designBox(page, page.getByText('Langkah 3', { exact: true }).last());
  expect(Math.abs(tab.x - 1535.317), 'card tab x').toBeLessThan(6);
  expect(Math.abs(tab.y - 220.129), 'card tab y').toBeLessThan(6);

  // The instruction paragraph (229:474) starts at y=287.823.
  const hint = await designBox(page, page.getByText(/^Semprot Permukaan Meja:/));
  expect(Math.abs(hint.y - 287.823), 'hint y').toBeLessThan(8);

  // The bench strip the interaction targets, measured off the frame's own art.
  const first = await designBox(page, segment(page, 1));
  const last = await designBox(page, segment(page, SEGMENTS));
  expect(first.x + first.w / 2, 'strip starts on the painted bench').toBeGreaterThan(566);
  expect(last.x + last.w / 2, 'strip stops before the floating card').toBeLessThan(1428);
});

test('bench segments keep a 44x44 touch target, tile the strip, and clear both cards', async ({ page }) => {
  await gotoStep3(page);

  const procedure = (await page
    .getByText('Bersihkan permukaan meja menggunakan alkohol 70% untuk mengurangi risiko kontaminasi sebelum memulai pekerjaan.', { exact: true })
    .boundingBox())!;
  const card = (await page.getByText(/^Semprot Permukaan Meja:/).boundingBox())!;

  const boxes = [];
  for (let n = 1; n <= SEGMENTS; n += 1) {
    const box = (await segment(page, n).boundingBox())!;
    expect(box.width, `segment ${n} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `segment ${n} height`).toBeGreaterThanOrEqual(44);
    // A segment under either card could not be swept.
    expect(box.x, `segment ${n} behind the procedure card`).toBeGreaterThan(procedure.x + procedure.width);
    expect(box.x + box.width, `segment ${n} behind the floating card`).toBeLessThan(card.x);
    boxes.push(box);
  }

  // No gaps: a sweep must not fall between two segments. Each one starts where
  // the previous ended (a floored segment may overlap, never leave a hole).
  for (let i = 1; i < boxes.length; i += 1) {
    expect(boxes[i].x, `segment ${i + 1} leaves a gap`).toBeLessThanOrEqual(boxes[i - 1].x + boxes[i - 1].width + 0.5);
  }
});
