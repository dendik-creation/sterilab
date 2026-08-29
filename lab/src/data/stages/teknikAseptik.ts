import bg1Url from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_1/backgrounds/1.png';
import bg2Url from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_1/backgrounds/2.png';
import bg3Url from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_1/backgrounds/3.png';
import bg4Url from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_1/backgrounds/4.png';
import soapUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_1/soap.png';
import lockerPlainUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_2/backgounds/1.png';
import lockerSuitedUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_2/backgounds/2.png';
import labCoatUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_2/lab_coat.png';
import gogglesUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_2/safety_goggles.png';
import glovesUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_2/gloves.png';
import faceMaskUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_2/face_mask.png';
import safetyShoesUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_2/safety_shoes.png';
import swimCapUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_2/swim_cap.png';

// Data for Stage 4 "Teknik Kerja Aseptik" (Figma "Sterilab-APHP" canvas 42:678
// "Scene 04: Prosedur Panjang Teknik Kerja Aseptik"). Every number here is a
// coordinate on that canvas' own 1920x1080 frame, so the Screen can convert it
// with a single design-px -> stage-length helper instead of hand-tuned
// percentages per element.
//
// Langkah 1 (frame 42:679) and Langkah 2 (frame 58:2) are authored. The
// counter/dot row reads "N / 12" because the canvas ships frames LANGKAH 1..12 -
// but the 11-step list in TASKS.md > Screen 9 disagrees with that 12, so the
// remaining steps are deliberately left unauthored rather than invented here.
export const TOTAL_STEPS = 12;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Where the workspace art sits on the frame. Langkah 1's frames are full-bleed
// 1920x1080; Langkah 2's are 1920x975 hung below the header band (Figma
// BG_LANGKAH_2 at y=105.184), so the rect travels with the step instead of
// being assumed.
const FULL_FRAME: Rect = { x: 0, y: 0, width: 1920, height: 1080 };
const BELOW_HEADER: Rect = { x: 0, y: 105.184, width: 1920, height: 974.816 };

// One object the Analyst has to click, in the order the procedure requires.
// The pill is the on-screen instruction ("1. Klik sabun"); `hotspot` is the
// art it points at, and `background` is the frame the workspace cuts to once
// the action lands.
export interface StepAction {
  id: string;
  // 1-based position in this step's click order.
  order: number;
  pillLabel: string;
  // Spoken/announced form - the pill text alone ("1. Klik sabun") reads as an
  // instruction rather than as a control's name.
  accessibleName: string;
  hotspot: Rect;
  // Figma bounds of the instruction pill. Only the center is used for
  // placement: the pill sizes itself from its own text so a floored font on a
  // small viewport widens the pill instead of overflowing it.
  pill: Rect;
  background: string;
}

// One piece of protective equipment in Langkah 2. It lives in two places at
// once: a cell of the 3x2 grid inside the floating card (row/col), and a socket
// on the analyst's body that it has to be dropped onto. `anchor` is the point
// the socket is *about* - only set when the socket had to be nudged off the
// body part to keep two sockets from overlapping, and a leader line is drawn to
// it so the offset still reads as "this spot".
export interface ApdItem {
  id: string;
  name: string;
  // Body part the item belongs to, in the wording used for both the socket's
  // accessible name and the correction message.
  bodyPart: string;
  src: string;
  // Natural size of the exported PNG in design px. Each export carries 8px of
  // transparent padding on every side, so drawing it at this size reproduces
  // the ink box Figma renders.
  width: number;
  height: number;
  row: 0 | 1;
  col: 0 | 1 | 2;
  socket: { x: number; y: number };
  anchor?: { x: number; y: number };
}

interface BaseStep {
  n: number;
  // Blue eyebrow above the title inside the PROSEDUR card.
  eyebrow: string;
  title: string;
  description: string;
  // Frame shown before anything in this step has been done, and where it sits.
  initialBackground: string;
  initialBackgroundAlt: string;
  backgroundRect: Rect;
  // Note card that rises in once the step is complete.
  successTitle: string;
  successBody: string;
}

// Langkah 1's shape: click the right object next, and the art cuts to the next
// frame each time.
export interface SequenceStep extends BaseStep {
  kind: 'sequence';
  // Copy of the floating card on the right.
  hint: string;
  actions: StepAction[];
}

// Langkah 2's shape: fit every item of PPE onto the analyst, then confirm.
export interface EquipStep extends BaseStep {
  kind: 'equip';
  // Copy above the grid inside the floating card.
  prompt: string;
  confirmLabel: string;
  items: ApdItem[];
  // Only frame 2 exists for this step: the analyst is drawn either in plain
  // clothes or fully suited, so the art can only change once, on confirm.
  completedBackground: string;
  completedBackgroundAlt: string;
}

export type ProcedureStep = SequenceStep | EquipStep;

// Wash-hands sequence: the four backgrounds are used in file order (1 dirty ->
// 2 lathered -> 3 rinsing -> 4 clean), so the frame index is simply the number
// of actions completed so far.
export const HAND_WASH_STEP: SequenceStep = {
  kind: 'sequence',
  n: 1,
  eyebrow: 'Langkah 1',
  title: 'Cuci tangan',
  description: 'Cuci tangan dengan sabun hingga bersih sebelum memulai pekerjaan.',
  hint: 'Klik sabun, lalu tangan, kemudian air untuk mencuci tangan dengan benar.',
  initialBackground: bg1Url,
  initialBackgroundAlt:
    'Wastafel laboratorium dengan kran air, dua telapak tangan beranalis jas lab, dan botol sabun antiseptik di sisi kiri',
  backgroundRect: FULL_FRAME,
  successTitle: 'Tangan telah dibersihkan!',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
  actions: [
    {
      id: 'sabun',
      order: 1,
      pillLabel: '1.  Klik sabun',
      accessibleName: 'Ambil sabun antiseptik',
      hotspot: { x: 625.711, y: 420.957, width: 117.35, height: 176.026 },
      pill: { x: 583.288, y: 358.358, width: 205.521, height: 54.616 },
      background: bg2Url,
    },
    {
      id: 'tangan',
      order: 2,
      pillLabel: '2.  Klik tangan',
      accessibleName: 'Gosok kedua telapak tangan',
      hotspot: { x: 800, y: 455, width: 300, height: 290 },
      pill: { x: 828.431, y: 686.214, width: 211.138, height: 54.615 },
      background: bg3Url,
    },
    {
      id: 'kran',
      order: 3,
      pillLabel: '3.  Klik Kran Air',
      accessibleName: 'Buka kran air dan bilas tangan',
      hotspot: { x: 1015, y: 262, width: 240, height: 330 },
      pill: { x: 1183.908, y: 424.075, width: 220.84, height: 54.615 },
      background: bg4Url,
    },
  ],
};

// The soap bottle is a separate layer in Figma (node 60:303) - the background
// frames never contain it, so it is rendered on top of whichever frame is live.
export const SOAP_ART = { src: soapUrl, rect: HAND_WASH_STEP.actions[0].hotspot };

// Socket centres were measured off backgrounds/1.png (1920x975) and shifted by
// the art's own y offset (105.184), so they land on the analyst rather than on
// a percentage that happens to look right at 16:9.
//
// A socket is an 84x84 design-px square at every viewport that shows one
// (>=1024px, where 84 design px is already past the 44px floor), so every pair
// of centres has to differ by >=84 in x or in y - and the head carries three of
// them within ~140px. Kepala is lifted just above the crown and Wajah pushed
// clear of the jaw, which is far enough off the mouth to need an `anchor` the
// Screen draws a leader line to; Mata still covers the eyes directly.
export const WEAR_PPE_STEP: EquipStep = {
  kind: 'equip',
  n: 2,
  eyebrow: 'Langkah 2',
  title: 'Memakai APD',
  description: 'Kenakan seluruh alat pelindung diri sebelum memasuki area kerja aseptik.',
  prompt: 'Pilih semua APD secara lengkap :',
  confirmLabel: 'Selesai',
  initialBackground: lockerPlainUrl,
  initialBackgroundAlt:
    'Ruang ganti laboratorium dengan loker terbuka dan seorang analis berdiri mengenakan pakaian harian',
  completedBackground: lockerSuitedUrl,
  completedBackgroundAlt:
    'Analis yang sama kini mengenakan penutup kepala, kacamata pelindung, masker, jas laboratorium, sarung tangan, dan sepatu keselamatan',
  backgroundRect: BELOW_HEADER,
  successTitle: 'Seluruh APD telah dipakai!',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
  items: [
    {
      id: 'lab-coat',
      name: 'Jas laboratorium',
      bodyPart: 'Badan',
      src: labCoatUrl,
      width: 156,
      height: 186,
      row: 0,
      col: 0,
      socket: { x: 935, y: 530 },
    },
    {
      id: 'goggles',
      name: 'Kacamata pelindung',
      bodyPart: 'Mata',
      src: gogglesUrl,
      width: 163,
      height: 96,
      row: 0,
      col: 1,
      socket: { x: 900, y: 330 },
    },
    {
      id: 'gloves',
      name: 'Sarung tangan',
      bodyPart: 'Tangan',
      src: glovesUrl,
      width: 139,
      height: 145,
      row: 0,
      col: 2,
      socket: { x: 843, y: 673 },
    },
    {
      id: 'face-mask',
      name: 'Masker wajah',
      bodyPart: 'Wajah',
      src: faceMaskUrl,
      width: 151,
      height: 93,
      row: 1,
      col: 0,
      socket: { x: 1020, y: 400 },
      anchor: { x: 938, y: 396 },
    },
    {
      id: 'safety-shoes',
      name: 'Sepatu keselamatan',
      bodyPart: 'Kaki',
      src: safetyShoesUrl,
      width: 162,
      height: 117,
      row: 1,
      col: 1,
      socket: { x: 930, y: 1005 },
    },
    {
      id: 'swim-cap',
      name: 'Penutup kepala',
      bodyPart: 'Kepala',
      src: swimCapUrl,
      width: 132,
      height: 102,
      row: 1,
      col: 2,
      socket: { x: 925, y: 215 },
    },
  ],
};

// The LANJUT button walks this array, so authoring LANGKAH 3 is a data change.
export const PROCEDURE_STEPS: ProcedureStep[] = [HAND_WASH_STEP, WEAR_PPE_STEP];
