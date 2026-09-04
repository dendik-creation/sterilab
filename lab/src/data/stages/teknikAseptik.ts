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
// Langkah 1 (frame 42:679) and Langkah 2 (frame 58:2) are authored.
//
// The counter/dot row reads "N / 6" because Stage 4 is being cut to six
// procedures. Three sources disagreed on the count: the Figma canvas ships
// frames LANGKAH 1..12, ADR-0004 and the PRD specify 11 linear steps, and the
// product decision is 6 - the nine PRD steps after "pakai APD" fold into four.
// Six is the number the Screen is built for; the remaining four are left
// unauthored here rather than invented, because *which* PRD steps fold
// together is a content decision, not a layout one. ADR-0004 still says 11 and
// has to be superseded before Langkah 3 is written.
export const TOTAL_STEPS = 6;

// Which procedure a step is, independent of its position in the list. The
// Screen picks a workspace component by this id (see
// presentation/pages/stages/teknik-aseptik/steps/index.tsx), so authoring
// LANGKAH 3 is a new id here, a new entry there, and nothing else.
export type ProcedureId = 'cuci-tangan' | 'memakai-apd';

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

// Where one item's drop target sits. `anchor` is the point the socket is
// *about* - only set when the socket had to step off the body part to keep two
// sockets from overlapping, and the Screen draws a leader line to it so the
// offset still reads as "this spot".
export interface ApdPlacement {
  socket: { x: number; y: number };
  anchor?: { x: number; y: number };
}

// The same six targets, laid out twice. A socket is `max(44px, 84 design px)`,
// so on a 568px-wide stage the 44px touch floor blows it up to 149 design px -
// nearly twice its designed size - and a layout that packs six of them onto the
// analyst at desktop sizes would have them overlapping into one unaimable blob.
// `wide` is the layout for >=1024px (five of the six sit directly on the body
// part they name); `compact` is the same set pulled apart far enough that two
// floored circles cannot touch.
export interface ApdPlacements {
  wide: ApdPlacement;
  compact: ApdPlacement;
}

// One piece of protective equipment in Langkah 2. It lives in two places at
// once: a cell of the 3x2 grid inside the floating card (row/col), and a socket
// on the analyst's body that it has to be dragged onto.
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
  placement: ApdPlacements;
}

interface BaseStep {
  id: ProcedureId;
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
  id: 'cuci-tangan',
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
// a percentage that happens to look right at 16:9. The landmarks that matter,
// in frame coordinates: crown 258, eyes 342, mouth 381, chest 495, left hand
// (842, 680), sandals 1005.
//
// A socket is `max(44px, 84 design px)` square, and that floor is what sets the
// layout - twice, because it bites at completely different scales:
//
// `wide` (>=1024px): the circle is its designed 84 design px, so two centres
// only have to differ by 84 in x or in y. That is enough room to sit Kepala on
// the crown, Mata on the eyes, Badan on the chest, Tangan on the left hand and
// Kaki on the sandals. Only Wajah cannot fit - the mouth is 39 design px below
// the eyes - so it steps out to the analyst's right and carries an `anchor`
// back to the cheek, which the Screen draws a leader line to. Closest pair is
// Kepala/Mata at 96.
//
// `compact` (<1024px): on a 568px-wide stage 44 CSS px *is* 149 design px, so
// the whole head group has to come apart. Kepala keeps the crown, Mata steps
// left and Wajah steps right, both with leader lines; Badan drops to the belt
// line to clear them. Closest pair is 164, which holds down to a 515px-wide
// stage - below the 568px floor the app supports at all.
//
// Landmarks both layouts are measured against, in frame coordinates: crown 258,
// eyes 342, mouth 381, chest 495, left hand (842, 680), sandals 1005.
export const WEAR_PPE_STEP: EquipStep = {
  kind: 'equip',
  id: 'memakai-apd',
  n: 2,
  eyebrow: 'Langkah 2',
  title: 'Memakai APD',
  description: 'Kenakan seluruh alat pelindung diri sebelum memasuki area kerja aseptik.',
  // Figma writes this as "Pilih semua APD secara lengkap :", which describes a
  // checklist. The step is a drag onto the analyst on every viewport now, so
  // the prompt has to say what the Analyst is actually being asked to do.
  prompt: 'Seret setiap APD ke tubuh analis :',
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
      placement: {
        // Centre of the shirt, between the collar and the belt.
        wide: { socket: { x: 934, y: 500 } },
        // Dropped to the belt line, to clear the two head sockets that have
        // stepped out sideways at this size.
        compact: { socket: { x: 934, y: 520 } },
      },
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
      placement: {
        // Over the eyes, a touch low so the circle keeps 96 design px from
        // Kepala's on the crown.
        wide: { socket: { x: 934, y: 348 } },
        // Left of the head, level with the eyes; the leader line lands on the
        // analyst's left temple.
        compact: { socket: { x: 770, y: 342 }, anchor: { x: 900, y: 342 } },
      },
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
      // Directly on the analyst's left hand at either size.
      placement: { wide: { socket: { x: 842, y: 682 } }, compact: { socket: { x: 842, y: 682 } } },
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
      // The one socket that cannot sit on its body part at any size: the mouth
      // is 39 design px below the eyes, and no two circles fit that close. It
      // steps out to the analyst's right and the leader line lands on the cheek.
      placement: {
        wide: { socket: { x: 1052, y: 392 }, anchor: { x: 968, y: 383 } },
        compact: { socket: { x: 1098, y: 392 }, anchor: { x: 966, y: 381 } },
      },
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
      // On the sandals, a touch above their centre so the floored circle still
      // clears the bottom edge of the stage at 568x320.
      placement: { wide: { socket: { x: 934, y: 1002 } }, compact: { socket: { x: 934, y: 1000 } } },
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
      // On the crown - the circle straddles the hairline (frame y 258) rather
      // than floating clear of it in the empty space above the head.
      placement: { wide: { socket: { x: 934, y: 252 } }, compact: { socket: { x: 934, y: 276 } } },
    },
  ],
};

// The LANJUT button walks this array, so authoring LANGKAH 3 is a data change.
export const PROCEDURE_STEPS: ProcedureStep[] = [HAND_WASH_STEP, WEAR_PPE_STEP];
