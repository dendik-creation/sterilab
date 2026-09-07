import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForMotionSettled } from './settle';
import { skipCaseNarration } from './case';

// Stage 3 - Pengelolaan Limbah Laboratorium, Langkah 1 "Mengidentifikasi
// Limbah Biologis" and Langkah 2 "Mendekontaminasi Limbah Biologis". Figma
// "Sterilab-APHP" frames "6.1 - A/B" and "6.2 - A/B/C" (node-id 305-616),
// 1920x1080. Landscape-only app (ADR-0002); the portrait project has its own
// spec.
test.beforeEach(({ viewport }) => {
  test.skip(!viewport || viewport.width <= viewport.height, 'landscape-only app');
});

const STORAGE_KEY = 'sterilab:levelProgress';
const PETRI = 'Cawan petri berisi media agar bekas';
const RACK = 'Rak tabung reaksi berisi biakan bekas';
const PAPER = 'Selembar kertas bersih';
const BOTTLE = 'Botol akuades';

// Misi 3 only unlocks once Misi 1 and 2 are both done - seed the ledger the
// same way missions.spec.ts does, so the walk-in matches a real Analyst who
// just finished Stage 2.
async function gotoStage(page: Page): Promise<void> {
  await page.addInitScript(
    ([key]) => {
      window.localStorage.setItem(key as string, JSON.stringify({ version: 1, completed: 2 }));
    },
    [STORAGE_KEY] as const,
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Ketuk di mana saja untuk melanjutkan' }).click({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Mulai Menjelajah' }).click();
  await skipCaseNarration(page);
  await page.getByRole('button', { name: 'Lanjut Briefing' }).click();
  await page.getByRole('button', { name: /^Mulai Misi 3:/ }).click({ timeout: 5000 });
  await expect(page.getByRole('heading', { name: 'PENGELOLAAN LIMBAH LABORATORIUM' })).toBeVisible({ timeout: 5000 });
  await waitForMotionSettled(page);
}

function workspace(page: Page) {
  return page.getByAltText(
    /cawan petri berisi media agar bekas|dipindahkan ke kotak kuning|kotak kuning limbah biohazard|dimasukkan ke dalam autoklaf|Pintu autoklaf tertutup|botol semprot desinfektan|menyemprotkan larutan desinfektan|mengusap permukaan meja|lima limbah yang belum dipilah|memberi tanda jempol/i,
  );
}

async function backgroundFrame(page: Page): Promise<string> {
  const src = await workspace(page).getAttribute('src');
  return src?.match(/(\d)\.png/)?.[1] ?? src ?? '';
}

async function gotoStep2(page: Page): Promise<void> {
  await gotoStage(page);
  await page.getByRole('button', { name: PETRI }).click();
  await page.getByRole('button', { name: RACK }).click();
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click({ timeout: 5000 });
  await expect(page.getByText('Langkah 2 / 4', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);
}

const BIN = 'Kotak kuning limbah biohazard di atas meja';
const AUTOCLAVE_DOOR = 'Autoklaf dengan pintu terbuka';
const START_BUTTON = 'Tombol mulai autoklaf';
const SPRAY_BOTTLE = 'Botol semprot desinfektan';
const CLOTH = 'Tumpukan kain lap';

async function gotoStep3(page: Page): Promise<void> {
  await gotoStep2(page);
  await page.getByRole('button', { name: BIN }).click();
  await page.getByRole('button', { name: AUTOCLAVE_DOOR }).click();
  await page.getByRole('button', { name: START_BUTTON }).click();
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click({ timeout: 5000 });
  await expect(page.getByText('Langkah 3 / 4', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);
}

const BOTTLE_CAIRAN_KIMIA = 'Botol berisi limbah cair kimia';
const TABUNG_CAIRAN = 'Tabung reaksi berisi sisa cairan';
const KERTAS = 'Tumpukan kertas bersih';
const CAWAN_PETRI_LIMBAH = 'Cawan petri berisi media agar bekas';
const BOTOL_AKUADES_LIMBAH = 'Botol berisi sisa akuades';
const BIN_NON_INFEKSIUS = 'Tempat sampah non-infeksius';
const BIN_INFEKSIUS = 'Tempat sampah infeksius/biologis';
const BIN_CAIR = 'Tempat pembuangan limbah cair';

async function gotoStep4(page: Page): Promise<void> {
  await gotoStep3(page);
  await page.getByRole('button', { name: SPRAY_BOTTLE }).click();
  await page.getByRole('button', { name: CLOTH }).click();
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click({ timeout: 5000 });
  await expect(page.getByText('Langkah 4 / 4', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);
}

async function center(locator: ReturnType<Page['getByRole']>) {
  const box = (await locator.boundingBox())!;
  expect(box).not.toBeNull();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test('opens on Langkah 1 with all four objects clickable and the idle frame', async ({ page }) => {
  await gotoStage(page);

  await expect(page.getByText('PROSEDUR', { exact: true })).toBeVisible();
  await expect(page.getByText('Langkah 1 / 4', { exact: true })).toBeVisible();
  await expect(page.getByText('Mengidentifikasi Limbah Biologis', { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      'Limbah biologis merupakan sisa kegiatan laboratorium yang telah kontak dengan kultur atau bahan biologis sehingga memerlukan penanganan khusus sebelum dibuang.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText('Klik media atau biakan bekas yang termasuk limbah biologis.', { exact: true }),
  ).toBeVisible();

  for (const name of [PETRI, RACK, PAPER, BOTTLE]) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }

  expect(await backgroundFrame(page)).toBe('1');
  await expect(page.getByRole('group', { name: 'Identifikasi berhasil!' })).not.toBeAttached();
});

test('clicking a decoy is refused out loud and leaves every object on the bench', async ({ page }) => {
  await gotoStage(page);

  await page.getByRole('button', { name: PAPER }).click();
  await expect(page.locator('[aria-live="polite"]')).toHaveText('Itu bukan limbah biologis - biarkan di meja.');
  await expect(page.getByRole('button', { name: PAPER })).toBeVisible();
  expect(await backgroundFrame(page)).toBe('1');

  await page.getByRole('button', { name: BOTTLE }).click();
  await expect(page.locator('[aria-live="polite"]')).toHaveText('Itu bukan limbah biologis - biarkan di meja.');
  expect(await backgroundFrame(page)).toBe('1');
});

test('identifying one correct object marks it and announces progress, without ending the step', async ({ page }) => {
  await gotoStage(page);

  await page.getByRole('button', { name: PETRI }).click();
  await expect(page.locator('[aria-live="polite"]')).toHaveText('1 dari 2 limbah biologis teridentifikasi.');
  // The clicked hotspot is gone (already found), its sibling and both decoys remain.
  await expect(page.getByRole('button', { name: PETRI })).not.toBeAttached();
  await expect(page.getByRole('button', { name: RACK })).toBeVisible();
  await expect(page.getByRole('button', { name: PAPER })).toBeVisible();
  await expect(page.getByRole('button', { name: BOTTLE })).toBeVisible();
  expect(await backgroundFrame(page)).toBe('1');
  await expect(page.getByRole('group', { name: 'Identifikasi berhasil!' })).not.toBeAttached();
});

test('identifying both correct objects swaps the scene, raises the note, and LANJUT advances to Langkah 2', async ({
  page,
}) => {
  await gotoStage(page);

  await page.getByRole('button', { name: PETRI }).click();
  await page.getByRole('button', { name: RACK }).click();

  const note = page.getByRole('group', { name: 'Identifikasi berhasil!' });
  await expect(note).toBeVisible({ timeout: 4000 });
  await expect(page.getByText('Anda siap melanjutkan ke langkah berikutnya.', { exact: true })).toBeVisible();
  expect(await backgroundFrame(page)).toBe('2');
  await waitForMotionSettled(page);

  // Same note-card geometry every other Stage's success note uses (Figma
  // bottom edge 1001.159 of 1080).
  const stage = await page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });
  const box = (await note.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(stage.top + stage.h + 1);
  const relBottom = ((box.y + box.height - stage.top) / stage.h) * 1080;
  expect(Math.abs(relBottom - 1001.159)).toBeLessThan(4);

  // Steps advance in place: Langkah 2 is authored now, so LANJUT walks the
  // Screen on rather than falling through to Missions.
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
  await expect(page.getByText('Langkah 2 / 4', { exact: true })).toBeVisible();
  await expect(page.getByText('Mendekontaminasi Limbah Biologis', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Identifikasi berhasil!' })).not.toBeAttached();
});

test('clickable objects keep a 44x44 touch target and stay clear of the procedure card', async ({ page }) => {
  await gotoStage(page);

  const card = (await page
    .getByText(
      'Limbah biologis merupakan sisa kegiatan laboratorium yang telah kontak dengan kultur atau bahan biologis sehingga memerlukan penanganan khusus sebelum dibuang.',
      { exact: true },
    )
    .boundingBox())!;

  for (const name of [PETRI, RACK, PAPER, BOTTLE]) {
    const box = (await page.getByRole('button', { name }).boundingBox())!;
    expect(box.width, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${name} height`).toBeGreaterThanOrEqual(44);
    expect(box.x, `${name} behind procedure card`).toBeGreaterThan(card.x + card.width);
  }
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

  const title = (await page.getByRole('heading', { name: 'PENGELOLAAN LIMBAH LABORATORIUM' }).boundingBox())!;
  const subtitle = (await page.getByText('Lakukan prosedur dengan urutan yang benar', { exact: true }).boundingBox())!;
  expect(title.x, 'title overlaps back button').toBeGreaterThanOrEqual(boxes[1].x + boxes[1].width);
  expect(subtitle.x + subtitle.width, 'subtitle overlaps sound icon').toBeLessThanOrEqual(boxes[2].x);
});

test('the floating hint card lands on its Figma coordinates', async ({ page }) => {
  await gotoStage(page);

  const stage = await page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });

  // Floating card sits at x=1437, y=221.17 (Figma group 305:624); the tab
  // itself is offset dx=98 from the card's own left edge, the same position
  // Stage 2 and Stage 4's own Langkah 1 hint cards use.
  const box = (await page.getByTestId('floating-step-tab').boundingBox())!;
  const x = ((box.x - stage.left) / stage.w) * 1920;
  const y = ((box.y - stage.top) / stage.h) * 1080;
  expect(Math.abs(x - (1437 + 98)), 'hint tab x').toBeLessThan(6);
  expect(Math.abs(y - 221.17), 'hint tab y').toBeLessThan(6);
});

test('progress is announced through the live region, not only shown as a checkmark', async ({ page }) => {
  await gotoStage(page);
  const live = page.locator('[aria-live="polite"]');

  await expect(live).toHaveText('0 dari 2 limbah biologis teridentifikasi.');
  await page.getByRole('button', { name: RACK }).click();
  await expect(live).toHaveText('1 dari 2 limbah biologis teridentifikasi.');
  await page.getByRole('button', { name: PETRI }).click();
  await expect(live).toHaveText(/Identifikasi berhasil!/);
});

// ---------------------------------------------------------------------------
// Langkah 2 "Mendekontaminasi Limbah Biologis" - Figma frames "6.2 - A/B/C".
// Load the bin into the autoclave (drag, or tap-then-tap), then press the
// autoclave's own start button.
// ---------------------------------------------------------------------------

test('Langkah 2 opens with the bin on the bench, the autoclave door as the only target, and the idle frame', async ({
  page,
}) => {
  await gotoStep2(page);

  await expect(
    page.getByText(
      'Dekontaminasi dilakukan pada media atau biakan bekas sebelum dibuang untuk mengurangi risiko biologis dari sisa kegiatan laboratorium.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText('Seret wadah limbah biologis ke dalam autoklaf.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: BIN })).toBeVisible();
  await expect(page.getByRole('button', { name: AUTOCLAVE_DOOR })).toBeDisabled();
  expect(await backgroundFrame(page)).toBe('1');
  await expect(page.getByRole('button', { name: START_BUTTON })).not.toBeAttached();
});

test('dragging the bin onto the autoclave loads it and switches the card to the start instruction', async ({ page }) => {
  await gotoStep2(page);

  const from = await center(page.getByRole('button', { name: BIN }));
  const to = await center(page.getByRole('button', { name: AUTOCLAVE_DOOR }));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 16 });
  await page.mouse.up();

  await expect(page.getByRole('button', { name: BIN })).not.toBeAttached();
  await expect(page.getByRole('button', { name: AUTOCLAVE_DOOR })).not.toBeAttached();
  await expect(
    page.getByText('Klik tombol autoklaf untuk memulai proses dekontaminasi sesuai SOP laboratorium.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: START_BUTTON })).toBeVisible();
  expect(await backgroundFrame(page)).toBe('2');
});

test('a drag released away from the autoclave does not load the bin', async ({ page }) => {
  await gotoStep2(page);

  const from = await center(page.getByRole('button', { name: BIN }));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 40, from.y - 300, { steps: 12 });
  await page.mouse.up();

  await expect(page.getByRole('button', { name: BIN })).toBeVisible();
  expect(await backgroundFrame(page)).toBe('1');
});

test('the bin can be loaded by tapping it, then tapping the autoclave (keyboard-equivalent path)', async ({ page }) => {
  await gotoStep2(page);

  await expect(page.getByRole('button', { name: AUTOCLAVE_DOOR })).toBeDisabled();
  await page.getByRole('button', { name: BIN }).click();
  await expect(page.getByRole('button', { name: AUTOCLAVE_DOOR })).toBeEnabled();

  await page.getByRole('button', { name: AUTOCLAVE_DOOR }).click();
  await expect(page.getByRole('button', { name: START_BUTTON })).toBeVisible();
  expect(await backgroundFrame(page)).toBe('2');
});

test('pressing the start button closes the door, raises the note, and LANJUT advances to Langkah 3', async ({ page }) => {
  await gotoStep2(page);
  await page.getByRole('button', { name: BIN }).click();
  await page.getByRole('button', { name: AUTOCLAVE_DOOR }).click();

  await page.getByRole('button', { name: START_BUTTON }).click();
  expect(await backgroundFrame(page)).toBe('3');

  const note = page.getByRole('group', { name: 'Dekontaminasi selesai!' });
  await expect(note).toBeVisible({ timeout: 4000 });
  await expect(page.getByText('Anda siap melanjutkan ke langkah berikutnya.', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);

  const stage = await page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });
  const box = (await note.boundingBox())!;
  const relBottom = ((box.y + box.height - stage.top) / stage.h) * 1080;
  expect(Math.abs(relBottom - 1001.159)).toBeLessThan(4);

  // Steps advance in place: Langkah 3 is authored now, so LANJUT walks the
  // Screen on rather than falling through to Missions.
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
  await expect(page.getByText('Langkah 3 / 4', { exact: true })).toBeVisible();
  await expect(page.getByText('Mendesinfeksi Area Kerja', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Dekontaminasi selesai!' })).not.toBeAttached();
});

test('Langkah 2 progress is announced through the live region at every phase', async ({ page }) => {
  await gotoStep2(page);
  const live = page.locator('[aria-live="polite"]');

  await expect(live).toHaveText(/Wadah limbah biologis belum dimasukkan ke autoklaf\./);
  await page.getByRole('button', { name: BIN }).click();
  await page.getByRole('button', { name: AUTOCLAVE_DOOR }).click();
  await expect(live).toHaveText(/Wadah limbah biologis sudah di dalam autoklaf\./);
  await page.getByRole('button', { name: START_BUTTON }).click();
  await expect(live).toHaveText(/Dekontaminasi selesai!/);
});

test('Langkah 2 hotspots keep a 44x44 touch target and the floating card lands on its Figma coordinates', async ({
  page,
}) => {
  await gotoStep2(page);

  for (const name of [BIN, AUTOCLAVE_DOOR]) {
    const box = (await page.getByRole('button', { name }).boundingBox())!;
    expect(box.width, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${name} height`).toBeGreaterThanOrEqual(44);
  }

  const stage = await page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });
  const box = (await page.getByTestId('floating-step-tab').boundingBox())!;
  const x = ((box.x - stage.left) / stage.w) * 1920;
  const y = ((box.y - stage.top) / stage.h) * 1080;
  expect(Math.abs(x - (1437 + 98)), 'hint tab x').toBeLessThan(6);
  expect(Math.abs(y - 221.17), 'hint tab y').toBeLessThan(6);
});

// ---------------------------------------------------------------------------
// Langkah 3 "Mendesinfeksi Area Kerja" - Figma frames "6.3 - A/B/C". Click the
// disinfectant bottle, then the cloth - two beats, one hotspot on screen at a
// time.
// ---------------------------------------------------------------------------

test('Langkah 3 opens with only the bottle clickable and the idle frame', async ({ page }) => {
  await gotoStep3(page);

  await expect(
    page.getByText(
      'Desinfeksi dilakukan setelah kegiatan laboratorium untuk membantu mengendalikan mikroorganisme pada permukaan kerja dan menjaga area tetap bersih.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText('Bersihkan permukaan meja kerja menggunakan larutan desinfektan yang sesuai.', { exact: true })).toBeVisible();
  await expect(page.getByText('Klik botol desinfektan, lalu aplikasikan pada permukaan meja kerja.', { exact: true })).toBeVisible();

  await expect(page.getByRole('button', { name: SPRAY_BOTTLE })).toBeVisible();
  await expect(page.getByRole('button', { name: CLOTH })).not.toBeAttached();
  expect(await backgroundFrame(page)).toBe('1');
  await expect(page.getByRole('group', { name: 'Desinfeksi selesai!' })).not.toBeAttached();
});

test('clicking the bottle sprays the bench and hands the hotspot to the cloth', async ({ page }) => {
  await gotoStep3(page);

  await page.getByRole('button', { name: SPRAY_BOTTLE }).click();

  await expect(page.getByRole('button', { name: SPRAY_BOTTLE })).not.toBeAttached();
  await expect(page.getByRole('button', { name: CLOTH })).toBeVisible();
  await expect(page.getByText('Usap permukaan meja hingga seluruh area kerja selesai dibersihkan.', { exact: true })).toBeVisible();
  expect(await backgroundFrame(page)).toBe('2');
  await expect(page.getByRole('group', { name: 'Desinfeksi selesai!' })).not.toBeAttached();
});

test('wiping the bench finishes the step, raises the note, and LANJUT advances to Langkah 4', async ({ page }) => {
  await gotoStep3(page);

  await page.getByRole('button', { name: SPRAY_BOTTLE }).click();
  await page.getByRole('button', { name: CLOTH }).click();
  expect(await backgroundFrame(page)).toBe('3');

  const note = page.getByRole('group', { name: 'Desinfeksi selesai!' });
  await expect(note).toBeVisible({ timeout: 4000 });
  await expect(page.getByText('Anda siap melanjutkan ke langkah berikutnya.', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);

  const stage = await page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });
  const box = (await note.boundingBox())!;
  const relBottom = ((box.y + box.height - stage.top) / stage.h) * 1080;
  expect(Math.abs(relBottom - 1001.159)).toBeLessThan(4);

  // Steps advance in place: Langkah 4 is authored now, so LANJUT walks the
  // Screen on rather than falling through to Missions.
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
  await expect(page.getByText('Langkah 4 / 4', { exact: true })).toBeVisible();
  await expect(page.getByText('Memilah Limbah Laboratorium', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Desinfeksi selesai!' })).not.toBeAttached();
});

test('Langkah 3 progress is announced through the live region', async ({ page }) => {
  await gotoStep3(page);
  const live = page.locator('[aria-live="polite"]');

  await expect(live).toHaveText('Tindakan 0 dari 2 selesai. Berikutnya: Botol semprot desinfektan.');
  await page.getByRole('button', { name: SPRAY_BOTTLE }).click();
  await expect(live).toHaveText('Tindakan 1 dari 2 selesai. Berikutnya: Tumpukan kain lap.');
  await page.getByRole('button', { name: CLOTH }).click();
  await expect(live).toHaveText(/Desinfeksi selesai!/);
});

test('Langkah 3 hotspot keeps a 44x44 touch target and stays clear of the procedure card', async ({ page }) => {
  await gotoStep3(page);

  const card = (await page
    .getByText('Desinfeksi dilakukan setelah kegiatan laboratorium untuk membantu mengendalikan mikroorganisme pada permukaan kerja dan menjaga area tetap bersih.', {
      exact: true,
    })
    .boundingBox())!;

  const bottle = (await page.getByRole('button', { name: SPRAY_BOTTLE }).boundingBox())!;
  expect(bottle.width, 'bottle width').toBeGreaterThanOrEqual(44);
  expect(bottle.height, 'bottle height').toBeGreaterThanOrEqual(44);
  expect(bottle.x, 'bottle behind procedure card').toBeGreaterThan(card.x + card.width);

  await page.getByRole('button', { name: SPRAY_BOTTLE }).click();
  const cloth = (await page.getByRole('button', { name: CLOTH }).boundingBox())!;
  expect(cloth.width, 'cloth width').toBeGreaterThanOrEqual(44);
  expect(cloth.height, 'cloth height').toBeGreaterThanOrEqual(44);
});

test('Langkah 3 floating card lands on its Figma coordinates', async ({ page }) => {
  await gotoStep3(page);

  const stage = await page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });
  const box = (await page.getByTestId('floating-step-tab').boundingBox())!;
  const x = ((box.x - stage.left) / stage.w) * 1920;
  const y = ((box.y - stage.top) / stage.h) * 1080;
  expect(Math.abs(x - (1437 + 98)), 'hint tab x').toBeLessThan(6);
  expect(Math.abs(y - 221.17), 'hint tab y').toBeLessThan(6);
});

// ---------------------------------------------------------------------------
// Langkah 4 "Memilah Limbah Laboratorium" - Figma frames "6.4 - A/B". Drag
// five items into the three bins matching their waste category. Both the
// PROSEDUR card and the hint card move to the right of the bench in this
// frame, leaving the bins room on the left.
// ---------------------------------------------------------------------------

test('Langkah 4 opens with all five items on the bench and every bin disabled until armed', async ({ page }) => {
  await gotoStep4(page);

  await expect(
    page.getByText('Pemilahan dilakukan untuk memisahkan limbah berdasarkan jenisnya agar setiap limbah dapat ditangani dan dibuang dengan cara yang sesuai.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('Kelompokkan setiap limbah ke tempat penampungan yang sesuai berdasarkan jenisnya.', { exact: true })).toBeVisible();
  await expect(page.getByText('Seret setiap limbah ke tempat penampungan yang sesuai.', { exact: true })).toBeVisible();

  for (const name of [BOTTLE_CAIRAN_KIMIA, TABUNG_CAIRAN, KERTAS, CAWAN_PETRI_LIMBAH, BOTOL_AKUADES_LIMBAH]) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }
  for (const name of [BIN_NON_INFEKSIUS, BIN_INFEKSIUS, BIN_CAIR]) {
    await expect(page.getByRole('button', { name })).toBeDisabled();
  }
  expect(await backgroundFrame(page)).toBe('1');
  await expect(page.getByRole('group', { name: 'PENGELOLAAN LIMBAH SELESAI!' })).not.toBeAttached();
});

test('dragging an item onto its correct bin sorts it, and the wrong bin refuses it with a reason', async ({ page }) => {
  await gotoStep4(page);

  // Wrong bin first: paper (non-infeksius) dropped on the liquid bin.
  const paperFrom = await center(page.getByRole('button', { name: KERTAS }));
  const wrongTo = await center(page.getByRole('button', { name: BIN_CAIR }));
  await page.mouse.move(paperFrom.x, paperFrom.y);
  await page.mouse.down();
  await page.mouse.move(wrongTo.x, wrongTo.y, { steps: 16 });
  await page.mouse.up();

  await expect(page.locator('[aria-live="polite"]')).toHaveText('Tumpukan kertas bersih adalah limbah non-infeksius, bukan cair.');
  await expect(page.getByRole('button', { name: KERTAS })).toBeVisible();

  // Correct bin: same item onto the non-infeksius bin.
  const correctTo = await center(page.getByRole('button', { name: BIN_NON_INFEKSIUS }));
  await page.mouse.move(paperFrom.x, paperFrom.y);
  await page.mouse.down();
  await page.mouse.move(correctTo.x, correctTo.y, { steps: 16 });
  await page.mouse.up();

  await expect(page.getByRole('button', { name: KERTAS })).not.toBeAttached();
  await expect(page.locator('[aria-live="polite"]')).toHaveText('1 dari 5 limbah sudah dipilah.');
});

test('an item can be sorted by tapping it, then tapping its bin (keyboard-equivalent path)', async ({ page }) => {
  await gotoStep4(page);

  await expect(page.getByRole('button', { name: BIN_INFEKSIUS })).toBeDisabled();
  await page.getByRole('button', { name: CAWAN_PETRI_LIMBAH }).click();
  await expect(page.getByRole('button', { name: BIN_INFEKSIUS })).toBeEnabled();

  await page.getByRole('button', { name: BIN_INFEKSIUS }).click();
  await expect(page.getByRole('button', { name: CAWAN_PETRI_LIMBAH })).not.toBeAttached();
});

test('sorting every item finishes the step, raises the note, and LANJUT returns to Missions', async ({ page }) => {
  await gotoStep4(page);

  async function drag(itemName: string, binName: string) {
    const from = await center(page.getByRole('button', { name: itemName }));
    const to = await center(page.getByRole('button', { name: binName }));
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 16 });
    await page.mouse.up();
  }

  await drag(BOTTLE_CAIRAN_KIMIA, BIN_CAIR);
  await drag(TABUNG_CAIRAN, BIN_CAIR);
  await drag(KERTAS, BIN_NON_INFEKSIUS);
  await drag(CAWAN_PETRI_LIMBAH, BIN_INFEKSIUS);
  await drag(BOTOL_AKUADES_LIMBAH, BIN_CAIR);

  expect(await backgroundFrame(page)).toBe('2');
  const note = page.getByRole('group', { name: 'PENGELOLAAN LIMBAH SELESAI!' });
  await expect(note).toBeVisible({ timeout: 4000 });
  await expect(page.getByText('Seluruh limbah telah ditangani sesuai prosedur laboratorium.', { exact: true })).toBeVisible();
  await waitForMotionSettled(page);

  const stage = await page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });
  const box = (await note.boundingBox())!;
  const relBottom = ((box.y + box.height - stage.top) / stage.h) * 1080;
  expect(Math.abs(relBottom - 1001.159)).toBeLessThan(4);

  // Langkah 4 is the last authored step, so LANJUT falls through to Missions
  // and marks the whole Misi 3 finished.
  await page.getByRole('button', { name: 'Lanjut ke langkah berikutnya' }).click();
  await expect(page.getByAltText(/Dashboard SteriLab/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: /^Ulangi Misi 3:/ })).toBeVisible();
});

test('Langkah 4 progress is announced through the live region', async ({ page }) => {
  await gotoStep4(page);
  const live = page.locator('[aria-live="polite"]');

  await expect(live).toHaveText('0 dari 5 limbah sudah dipilah.');
  await page.getByRole('button', { name: KERTAS }).click();
  await page.getByRole('button', { name: BIN_NON_INFEKSIUS }).click();
  await expect(live).toHaveText('1 dari 5 limbah sudah dipilah.');
});

test('Langkah 4 items and bins keep a 44x44 touch target, and both cards land on their Figma coordinates', async ({
  page,
}) => {
  await gotoStep4(page);

  for (const name of [BOTTLE_CAIRAN_KIMIA, TABUNG_CAIRAN, KERTAS, CAWAN_PETRI_LIMBAH, BOTOL_AKUADES_LIMBAH, BIN_NON_INFEKSIUS, BIN_INFEKSIUS, BIN_CAIR]) {
    const box = (await page.getByRole('button', { name }).boundingBox())!;
    expect(box.width, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${name} height`).toBeGreaterThanOrEqual(44);
  }

  const stage = await page.evaluate(() => {
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
    const h = Math.min(window.innerHeight, (window.innerWidth * 9) / 16);
    return { w, h, left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 };
  });

  // Both cards sit on the right in this frame (ProcedureCard's `position`
  // override, Figma group 313:1960 for PROSEDUR at x=1356.096, y=471.96,
  // width=506.572). "PROSEDUR" itself is centred inside the card, so its own
  // centre-x - not its left edge - is what lines up with the card's centre.
  const prosedur = (await page.getByText('PROSEDUR', { exact: true }).boundingBox())!;
  const prosedurCenterX = ((prosedur.x + prosedur.width / 2 - stage.left) / stage.w) * 1920;
  const prosedurY = ((prosedur.y - stage.top) / stage.h) * 1080;
  expect(Math.abs(prosedurCenterX - (1356.096 + 506.572 / 2)), 'PROSEDUR centre x').toBeLessThan(8);
  expect(Math.abs(prosedurY - 493.9), 'PROSEDUR y').toBeLessThan(8);

  // Tab origin is the floating group's own top (Figma group 311:1643 inset
  // top, 17.87% of 1080 = 193.0) - the white card below it starts at
  // top-[215px], 22px lower.
  const tab = (await page.getByTestId('floating-step-tab').boundingBox())!;
  const tabX = ((tab.x - stage.left) / stage.w) * 1920;
  const tabY = ((tab.y - stage.top) / stage.h) * 1080;
  expect(Math.abs(tabX - (1390 + 98)), 'hint tab x').toBeLessThan(8);
  expect(Math.abs(tabY - 193), 'hint tab y').toBeLessThan(8);
});
