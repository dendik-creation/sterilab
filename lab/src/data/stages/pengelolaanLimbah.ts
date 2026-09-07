import bgIdleUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_1/backgrounds/1.png';
import bgDoneUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_1/backgrounds/2.png';
import bgAutoclaveIdleUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_2/backgrounds/1.png';
import bgAutoclaveLoadedUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_2/backgrounds/2.png';
import bgAutoclaveDoneUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_2/backgrounds/3.png';
import bgDesinfeksiIdleUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_3/backgrounds/1.png';
import bgDesinfeksiSprayingUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_3/backgrounds/2.png';
import bgDesinfeksiDoneUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_3/backgrounds/3.png';
import bgSortIdleUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_4/backgrounds/1.png';
import bgSortDoneUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_4/backgrounds/2.png';
import itemBotolCairanKimiaUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_4/items/botol-cairan-kimia.png';
import itemTabungCairanUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_4/items/tabung-cairan.png';
import itemKertasUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_4/items/kertas.png';
import itemCawanPetriUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_4/items/cawan-petri.png';
import itemBotolAkuadesUrl from '../../../assets/images/02_scenes/04_03_pengelolaan_limbah_laboratorium/step_4/items/botol-akuades.png';

// Data for Stage 3 "Pengelolaan Limbah Laboratorium" (Figma "Sterilab-APHP"
// frames "6.1 - A/B", "6.2 - A/B/C", "6.3 - A/B/C" and "6.4 - A/B", node-id
// 305-616). Every number here is a coordinate on that canvas' own 1920x1080
// frame, converted with the same S()/T() helpers Stage 2 (kulturMikroba.ts)
// and Stage 4 (teknikAseptik.ts) use, so a new LANGKAH is a data change
// rather than a layout one.
//
// All four Langkah are authored now (the Figma frames' own "PROSEDUR" card
// reads "Langkah 4 / 4") - this stage is complete.
export const TOTAL_STEPS = 4;

export type ProcedureId =
  | 'mengidentifikasi-limbah-biologis'
  | 'mendekontaminasi-limbah-biologis'
  | 'mendesinfeksi-area-kerja'
  | 'memilah-limbah-laboratorium';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const FULL_FRAME: Rect = { x: 0, y: 0, width: 1920, height: 1080 };

interface BaseStep {
  id: ProcedureId;
  n: number;
  eyebrow: string;
  title: string;
  description: string;
  initialBackground: string;
  initialBackgroundAlt: string;
  backgroundRect: Rect;
  successTitle: string;
  successBody: string;
}

// One object on the bench the Analyst can click, and whether it is a correct
// answer or a distractor. Figma frame "6.1 - A" draws all four with the same
// dashed highlight box (nodes 305:623, 309:874/875/876) - the identification
// itself, not the art, is what tells them apart.
export interface IdentifyTarget {
  id: string;
  rect: Rect;
  accessibleName: string;
}

// Langkah 1's shape: click every object on the bench that counts as
// biological waste (the used petri dish and the test-tube rack), leaving the
// clean paper and the aquades bottle alone. Figma frames "6.1 - A" (idle,
// four dashed hotspot boxes) and "6.1 - B" (both correct items already
// swept into the yellow biohazard bin, success note baked into the frame as
// a reference for the shell's own SuccessNote).
export interface IdentifyStep extends BaseStep {
  kind: 'identify';
  hint: string;
  instructionLabel: string;
  instruction: string;
  targets: IdentifyTarget[];
  decoys: IdentifyTarget[];
  // Announced when the Analyst clicks a decoy - generic on purpose, the same
  // one message for either non-biological item.
  wrongMessage: string;
  doneBackground: string;
  doneBackgroundAlt: string;
}

// Langkah 2's shape: pick up the bin of already-identified biological waste
// and load it into the autoclave, then press the autoclave's own start
// button to run the decontamination cycle. Figma frames "6.2 - A" (idle, the
// bin still on the bench, the open autoclave door drawn as the drop target),
// "6.2 - B" (bin loaded into the open autoclave, the start button drawn as
// the next hotspot) and "6.2 - C" (door closed, hand on the lit button,
// success note baked into the frame as a reference for the shell's own
// SuccessNote).
//
// The bin itself carries no dashed hotspot box in Figma (only the autoclave
// door does) - there is exactly one draggable object this time, so the
// design leaves it to the art rather than drawing a redundant box. binRect
// below is measured off the rendered frame instead of a Figma node for that
// reason.
export interface DecontaminateStep extends BaseStep {
  kind: 'decontaminate';
  hint: string;
  instructionLabel: string;
  dragInstruction: string;
  startInstruction: string;
  binRect: Rect;
  binAccessibleName: string;
  autoclaveDropRect: Rect;
  autoclaveDropAccessibleName: string;
  loadedBackground: string;
  loadedBackgroundAlt: string;
  startButtonRect: Rect;
  startButtonAccessibleName: string;
  doneBackground: string;
  doneBackgroundAlt: string;
}

// One click in a fixed sequence of two: click the object, the scene advances
// to the next plate and the card swaps to the next instruction. Same shape
// as Stage 4's Langkah 1 (Cuci Tangan: sabun -> tangan -> air), just two
// beats instead of three.
export interface SequenceAction {
  id: string;
  rect: Rect;
  accessibleName: string;
  instruction: string;
  frame: { src: string; alt: string };
}

// Langkah 3's shape: click the disinfectant bottle to spray the bench, then
// click the cloth to wipe it down. Figma frames "6.3 - A" (idle, bottle is
// the hotspot), "6.3 - B" (bottle in hand, bench sprayed, cloth is the next
// hotspot) and "6.3 - C" (bench wiped clean, success note baked into the
// frame as a reference for the shell's own SuccessNote).
export interface SequenceStep extends BaseStep {
  kind: 'sequence';
  hint: string;
  instructionLabel: string;
  actions: SequenceAction[];
}

// The three categories every item on the bench sorts into, matching the
// three bins painted into the Figma art (black/general, yellow/biohazard,
// red/liquid) and the requirement doc's own 3a/3b/3c split.
export type WasteBinId = 'non-infeksius' | 'infeksius' | 'cair';

export interface SortBin {
  id: WasteBinId;
  // Short category name, used to build the wrong-drop correction message
  // ("X adalah limbah <label>, bukan <label>.").
  label: string;
  rect: Rect;
  accessibleName: string;
}

export interface SortItem {
  id: string;
  rect: Rect;
  accessibleName: string;
  bin: WasteBinId;
  // The item's own cut-out art (Figma's "removebg-preview" sprite, sliced
  // into one file per item) - drawn as its own layer on top of the empty-
  // bench background rather than baked in, so a correctly sorted item can
  // simply stop rendering instead of needing a fifth background plate for
  // every combination of what has been sorted so far.
  src: string;
}

// Langkah 4's shape: drag every item on the bench into the bin matching its
// waste category. Figma frames "6.4 - A" (idle, five items on the bench,
// three empty bins) and "6.4 - B" (bench empty, Analyst giving a thumbs up,
// success note baked into the frame as a reference for the shell's own
// SuccessNote). Both the PROSEDUR card and this hint card sit on the right
// in this frame - the bins need the left side of the bench Langkah 1-3
// never had to share.
export interface SortStep extends BaseStep {
  kind: 'sort';
  hint: string;
  instructionLabel: string;
  instruction: string;
  items: SortItem[];
  bins: SortBin[];
  doneBackground: string;
  doneBackgroundAlt: string;
}

export type ProcedureStep = IdentifyStep | DecontaminateStep | SequenceStep | SortStep;

export const PROCEDURE_STEPS: ProcedureStep[] = [
  {
    kind: 'identify',
    id: 'mengidentifikasi-limbah-biologis',
    n: 1,
    eyebrow: 'Langkah 1',
    title: 'Mengidentifikasi Limbah Biologis',
    description:
      'Limbah biologis merupakan sisa kegiatan laboratorium yang telah kontak dengan kultur atau bahan biologis sehingga memerlukan penanganan khusus sebelum dibuang.',
    initialBackground: bgIdleUrl,
    initialBackgroundAlt:
      'Meja kerja dengan cawan petri berisi media agar bekas, rak tabung reaksi, selembar kertas dan botol akuades.',
    backgroundRect: FULL_FRAME,
    successTitle: 'Identifikasi berhasil!',
    successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
    hint: 'Identifikasi media atau biakan bekas yang perlu didekontaminasi sebelum dibuang.',
    instructionLabel: 'Instruksi :',
    instruction: 'Klik media atau biakan bekas yang termasuk limbah biologis.',
    targets: [
      { id: 'cawan-petri', rect: { x: 527, y: 820, width: 209, height: 193 }, accessibleName: 'Cawan petri berisi media agar bekas' },
      { id: 'rak-tabung', rect: { x: 771, y: 740, width: 209, height: 245 }, accessibleName: 'Rak tabung reaksi berisi biakan bekas' },
    ],
    decoys: [
      { id: 'kertas', rect: { x: 1015, y: 820, width: 309, height: 197 }, accessibleName: 'Selembar kertas bersih' },
      { id: 'botol-akuades', rect: { x: 1359, y: 724, width: 156, height: 261 }, accessibleName: 'Botol akuades' },
    ],
    wrongMessage: 'Itu bukan limbah biologis - biarkan di meja.',
    doneBackground: bgDoneUrl,
    doneBackgroundAlt:
      'Cawan petri dan rak tabung reaksi telah dipindahkan ke kotak kuning limbah biohazard; kertas dan botol akuades tetap di meja.',
  },
  {
    kind: 'decontaminate',
    id: 'mendekontaminasi-limbah-biologis',
    n: 2,
    eyebrow: 'Langkah 2',
    title: 'Mendekontaminasi Limbah Biologis',
    description:
      'Dekontaminasi dilakukan pada media atau biakan bekas sebelum dibuang untuk mengurangi risiko biologis dari sisa kegiatan laboratorium.',
    initialBackground: bgAutoclaveIdleUrl,
    initialBackgroundAlt:
      'Meja kerja dengan kotak kuning limbah biohazard berisi cawan petri dan tabung reaksi, di samping autoklaf dengan pintu terbuka.',
    backgroundRect: FULL_FRAME,
    successTitle: 'Dekontaminasi selesai!',
    successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
    hint: 'Tempatkan limbah biologis pada wadah yang sesuai, kemudian lakukan proses dekontaminasi menggunakan autoklaf.',
    instructionLabel: 'Instruksi :',
    dragInstruction: 'Seret wadah limbah biologis ke dalam autoklaf.',
    startInstruction: 'Klik tombol autoklaf untuk memulai proses dekontaminasi sesuai SOP laboratorium.',
    binRect: { x: 440, y: 795, width: 400, height: 205 },
    binAccessibleName: 'Kotak kuning limbah biohazard di atas meja',
    autoclaveDropRect: { x: 1127, y: 263, width: 304, height: 353 },
    autoclaveDropAccessibleName: 'Autoklaf dengan pintu terbuka',
    loadedBackground: bgAutoclaveLoadedUrl,
    loadedBackgroundAlt: 'Kotak kuning limbah biohazard telah dimasukkan ke dalam autoklaf dengan pintu masih terbuka.',
    startButtonRect: { x: 1492, y: 496, width: 119, height: 119 },
    startButtonAccessibleName: 'Tombol mulai autoklaf',
    doneBackground: bgAutoclaveDoneUrl,
    doneBackgroundAlt: 'Pintu autoklaf tertutup dan tombol mulai menyala setelah proses dekontaminasi dijalankan.',
  },
  {
    kind: 'sequence',
    id: 'mendesinfeksi-area-kerja',
    n: 3,
    eyebrow: 'Langkah 3',
    title: 'Mendesinfeksi Area Kerja',
    description:
      'Desinfeksi dilakukan setelah kegiatan laboratorium untuk membantu mengendalikan mikroorganisme pada permukaan kerja dan menjaga area tetap bersih.',
    initialBackground: bgDesinfeksiIdleUrl,
    initialBackgroundAlt:
      'Meja kerja dengan botol semprot desinfektan dan tumpukan kain lap, siap untuk membersihkan permukaan meja.',
    backgroundRect: FULL_FRAME,
    successTitle: 'Desinfeksi selesai!',
    successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
    hint: 'Bersihkan permukaan meja kerja menggunakan larutan desinfektan yang sesuai.',
    instructionLabel: 'Instruksi :',
    actions: [
      {
        id: 'semprot-desinfektan',
        rect: { x: 771, y: 701, width: 156, height: 261 },
        accessibleName: 'Botol semprot desinfektan',
        instruction: 'Klik botol desinfektan, lalu aplikasikan pada permukaan meja kerja.',
        frame: {
          src: bgDesinfeksiSprayingUrl,
          alt: 'Analis memegang botol semprot dan menyemprotkan larutan desinfektan pada permukaan meja kerja.',
        },
      },
      {
        id: 'usap-meja',
        rect: { x: 1195, y: 792, width: 260, height: 174 },
        accessibleName: 'Tumpukan kain lap',
        instruction: 'Usap permukaan meja hingga seluruh area kerja selesai dibersihkan.',
        frame: {
          src: bgDesinfeksiDoneUrl,
          alt: 'Analis mengusap permukaan meja kerja dengan kain lap hingga bersih dari larutan desinfektan.',
        },
      },
    ],
  },
  {
    kind: 'sort',
    id: 'memilah-limbah-laboratorium',
    n: 4,
    eyebrow: 'Langkah 4',
    title: 'Memilah Limbah Laboratorium',
    description:
      'Pemilahan dilakukan untuk memisahkan limbah berdasarkan jenisnya agar setiap limbah dapat ditangani dan dibuang dengan cara yang sesuai.',
    initialBackground: bgSortIdleUrl,
    initialBackgroundAlt: 'Meja kerja dengan lima limbah yang belum dipilah, di samping tiga tempat penampungan kosong.',
    backgroundRect: FULL_FRAME,
    successTitle: 'PENGELOLAAN LIMBAH SELESAI!',
    successBody: 'Seluruh limbah telah ditangani sesuai prosedur laboratorium.',
    hint: 'Kelompokkan setiap limbah ke tempat penampungan yang sesuai berdasarkan jenisnya.',
    instructionLabel: 'Instruksi :',
    instruction: 'Seret setiap limbah ke tempat penampungan yang sesuai.',
    bins: [
      { id: 'non-infeksius', label: 'non-infeksius', rect: { x: 30, y: 550, width: 200, height: 245 }, accessibleName: 'Tempat sampah non-infeksius' },
      { id: 'infeksius', label: 'infeksius/biologis', rect: { x: 255, y: 550, width: 205, height: 245 }, accessibleName: 'Tempat sampah infeksius/biologis' },
      { id: 'cair', label: 'cair', rect: { x: 480, y: 550, width: 200, height: 245 }, accessibleName: 'Tempat pembuangan limbah cair' },
    ],
    items: [
      {
        id: 'botol-cairan-kimia',
        rect: { x: 96, y: 792, width: 141, height: 196 },
        accessibleName: 'Botol berisi limbah cair kimia',
        bin: 'cair',
        src: itemBotolCairanKimiaUrl,
      },
      {
        id: 'tabung-cairan',
        rect: { x: 290, y: 821, width: 94, height: 167 },
        accessibleName: 'Tabung reaksi berisi sisa cairan',
        bin: 'cair',
        src: itemTabungCairanUrl,
      },
      {
        id: 'kertas',
        rect: { x: 436, y: 859, width: 254, height: 129 },
        accessibleName: 'Tumpukan kertas bersih',
        bin: 'non-infeksius',
        src: itemKertasUrl,
      },
      {
        id: 'cawan-petri',
        rect: { x: 743, y: 877, width: 155, height: 111 },
        accessibleName: 'Cawan petri berisi media agar bekas',
        bin: 'infeksius',
        src: itemCawanPetriUrl,
      },
      {
        id: 'botol-akuades',
        rect: { x: 948, y: 792, width: 141, height: 196 },
        accessibleName: 'Botol berisi sisa akuades',
        bin: 'cair',
        src: itemBotolAkuadesUrl,
      },
    ],
    doneBackground: bgSortDoneUrl,
    doneBackgroundAlt: 'Meja kerja kosong dengan Analis memberi tanda jempol setelah seluruh limbah dipilah ke tempat yang sesuai.',
  },
];
