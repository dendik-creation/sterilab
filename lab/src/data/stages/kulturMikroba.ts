import bgIdleUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_1/backgrounds/1.png';
import bgActiveUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_1/backgrounds/2.png';
import bgDoneUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_1/backgrounds/3.png';
import bgPourUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_2/backgrounds/1.png';
import bgPouredUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_2/backgrounds/2.png';
import bgHeatingUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_2/backgrounds/3.png';
import bgDissolvedUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_2/backgrounds/4.png';
import bgMeterIdleUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_3/backgrounds/1.png';
import bgMeasuringUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_3/backgrounds/2.png';
import bgPhOkUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_3/backgrounds/3.png';
import bgFlaskIdleUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_4/backgrounds/1.png';
import bgFlaskPouredUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_4/backgrounds/2.png';
import bgFlaskPluggedUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_4/backgrounds/3.png';
import bgFlaskWrappedUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_4/backgrounds/4.png';
import bgAutoklafIdleUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_5/backgrounds/1.png';
import bgAutoklafLoadedUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_5/backgrounds/2.png';
import bgAutoklafDoneUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_5/backgrounds/3.png';
import autoklafPanelUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_5/autoclave_panel.png';
import mulaiProsesBtnUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_5/mulai_proses_btn.png';
import bgPetriIdleUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_6/backgrounds/1.png';
import bgPetriStartedUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_6/backgrounds/2.png';
import bgPetriPouringUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_6/backgrounds/3.png';
import bgPetriDoneUrl from '../../../assets/images/02_scenes/04_02_pembuatan_kultur_mikroba/step_6/backgrounds/4.png';

// Data for Stage 2 "Pembuatan Media Kultur Mikroba" (Figma "Sterilab-APHP"
// frames "5.1 - A/B/C", "5.2 - A/B/C/D", "5.3 - A/B/C", "5.4 - A/B/C/D",
// "5.5 - A/B/C" and "5.6 - A/B/C/D", node-id 262-2). Every number here is a
// coordinate on that canvas' own 1920x1080 frame, converted with the same
// S()/T() helpers Stage 4 (teknikAseptik.ts) uses, so a new LANGKAH is a data
// change rather than a layout one.
//
// All six Langkah are authored - this stage is complete.
export const TOTAL_STEPS = 6;

export type ProcedureId =
  | 'penimbangan-nutrisi'
  | 'melarutkan-media'
  | 'mengatur-ph'
  | 'menyiapkan-sterilisasi'
  | 'mensterilisasi-media'
  | 'menuangkan-media';

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
  // Blue line under the description (Figma node 283:280 "Target: Buat 250 mL
  // Nutrient Agar") - unique to Langkah 1's card, so it is optional rather
  // than every procedure having to invent one.
  target?: string;
  initialBackground: string;
  initialBackgroundAlt: string;
  backgroundRect: Rect;
  successTitle: string;
  successBody: string;
}

// One plate of the weighing animation, plus the jar's own clickable area on
// that plate. The jar sits at a slightly different x on the idle and active
// plates (measured off Figma's own highlight boxes, nodes 280:111 and
// 285:916), so the hotspot travels with the plate instead of one rect
// assumed to fit both. The done plate carries none: the action is finished,
// so nothing on it is clickable any more.
export interface WeighFrame {
  src: string;
  alt: string;
  hotspot?: Rect;
}

// Langkah 1's shape: click the ingredient, add it to the scale in fixed
// increments, and stop once the target weight is reached. Figma frames
// "5.1 - A" (0 g, idle), "5.1 - B" (mid-weigh) and "5.1 - C" (target reached,
// success note already drawn into the frame as a reference for the shell's
// own SuccessNote).
export interface WeighStep extends BaseStep {
  kind: 'weigh';
  hint: string;
  instructionLabel: string;
  instruction: string;
  ingredientAccessibleName: string;
  targetGrams: number;
  incrementGrams: number;
  frames: [WeighFrame, WeighFrame, WeighFrame];
}

// One plate of the dissolving animation, plus whichever object on it is
// clickable next. Only the idle plate (the aquades bottle) and the poured
// plate (the hotplate) carry a hotspot - the heating plate advances on its
// own after `heatMs`, and the done plate ends the step.
export interface DissolveFrame {
  src: string;
  alt: string;
  hotspot?: Rect;
}

// Langkah 2's shape: pour the aquades, turn on the hotplate, then wait for
// the media to heat and dissolve into a homogeneous solution. Figma frames
// "5.2 - A" (idle), "5.2 - B" (poured, hotplate off), "5.2 - C" (heating,
// stirred - no hotspot, times out on its own) and "5.2 - D" (dissolved,
// success note already drawn into the frame as a reference for the shell's
// own SuccessNote).
export interface DissolveStep extends BaseStep {
  kind: 'dissolve';
  hint: string;
  instructionLabel: string;
  instruction: string;
  pourAccessibleName: string;
  hotplateAccessibleName: string;
  // Announced for the whole heating plate - there is nothing left to click,
  // so this is the only feedback a screen reader gets while it plays out.
  heatingMessage: string;
  heatMs: number;
  frames: [DissolveFrame, DissolveFrame, DissolveFrame, DissolveFrame];
}

// One plate of the pH-measurement animation, plus whichever object on it is
// clickable next. Only the idle plate (the pH meter) carries a hotspot - the
// measuring plate advances on its own after `measureMs`, and the done plate
// ends the step.
export interface MeasureFrame {
  src: string;
  alt: string;
  hotspot?: Rect;
}

// Langkah 3's shape: click the pH meter, read the measurement, then settle on
// the result. Figma frames "5.3 - A" (idle), "5.3 - B" (probe dipped, meter
// reading the target pH - no hotspot, times out on its own) and "5.3 - C"
// (in range, success note already drawn into the frame as a reference for
// the shell's own SuccessNote).
export interface MeasureStep extends BaseStep {
  kind: 'measure';
  hint: string;
  instructionLabel: string;
  instruction: string;
  meterAccessibleName: string;
  // Announced for the whole measuring plate - there is nothing left to
  // click, so this is the only feedback a screen reader gets while the
  // reading settles.
  measuringMessage: string;
  // The reading the meter's own LCD shows once dipped ("pH 7,0") - baked as a
  // DOM overlay rather than into the art, like the digital scale in Langkah 1.
  readout: string;
  measureMs: number;
  frames: [MeasureFrame, MeasureFrame, MeasureFrame];
}

// One plate of the assembly sequence, plus the object on it that starts the
// next action. Each of the first three plates carries its own hotspot (and
// that hotspot's own accessible name, since the object it points at changes
// every plate - Erlenmeyer, then kapas, then kertas timah); the last plate
// carries neither, and ends the step.
export interface AssembleFrame {
  src: string;
  alt: string;
  hotspot?: Rect;
  hotspotAccessibleName?: string;
}

// Langkah 4's shape: a three-click chain across four plates - pour the media
// into the Erlenmeyer, plug it with cotton wool, then wrap the mouth in foil.
// Figma frames "5.4 - A" (idle), "5.4 - B" (poured), "5.4 - C" (plugged) and
// "5.4 - D" (wrapped, success note already drawn into the frame as a
// reference for the shell's own SuccessNote). Unlike Langkah 2/3 nothing here
// times out on its own - every plate change is a direct click, the same
// shape as Stage 4's own HAND_WASH_STEP.
export interface AssembleStep extends BaseStep {
  kind: 'assemble';
  hint: string;
  instructionLabel: string;
  instruction: string;
  frames: [AssembleFrame, AssembleFrame, AssembleFrame, AssembleFrame];
}

// One plate of the sterilizing sequence, plus whichever object on it is
// clickable next. The idle plate carries the Erlenmeyer/autoklaf-door
// hotspot; the loaded plate carries the "Mulai Proses" button hotspot (and
// keeps showing it, unclickable, while the autoklaf runs - the art itself
// doesn't change for that wait, only the panel's own readout does); the done
// plate carries none.
export interface SterilizeFrame {
  src: string;
  alt: string;
  hotspot?: Rect;
}

// Langkah 5's shape: load the Erlenmeyer into the autoklaf, start the run,
// then wait for sterilization to finish. Figma frames "5.5 - A" (idle door
// open), "5.5 - B" (Erlenmeyer loaded, control panel showing suhu/waktu and
// a "Mulai Proses" button - no dedicated art for the run itself, so this
// plate stays on screen while it times out on its own) and "5.5 - C" (door
// closed, done - success note already drawn into the frame as a reference
// for the shell's own SuccessNote).
export interface SterilizeStep extends BaseStep {
  kind: 'sterilize';
  hint: string;
  instructionLabel: string;
  instruction: string;
  loadAccessibleName: string;
  startAccessibleName: string;
  // Announced once the run has started - there is nothing left to click, so
  // this is the only feedback a screen reader gets while it plays out.
  sterilizingMessage: string;
  // Announced when the Analyst tries "Mulai Proses" outside the expected
  // range - the button itself only goes greyscale, so this is the only
  // feedback a screen reader gets for that rejection.
  outOfRangeMessage: string;
  // Suhu control (Figma nodes 298:2594 label / 302:156 value, "-"/"+" at
  // ~1232,838 and ~1380,838 in the panel). Starts outside the expected value
  // so the Analyst has to dial it in rather than just confirming a default.
  temperatureUnit: string;
  temperatureMin: number;
  temperatureMax: number;
  temperatureDefault: number;
  temperatureStep: number;
  temperatureTarget: number;
  // Waktu control (Figma nodes 298:2595 label / 302:157 value, "-"/"+" at
  // ~1596,838 and ~1745,838 in the panel) - same shape as suhu, but the
  // expected value is a range (15-20) rather than one exact number.
  durationUnit: string;
  durationMin: number;
  durationMax: number;
  durationDefault: number;
  durationStep: number;
  durationTargetMin: number;
  durationTargetMax: number;
  // The floating control panel (Figma node 298:2579, "298:2577" group) and
  // its "Mulai Proses" button (node 298:2596) - two separate raster overlays
  // laid over the loaded plate rather than baked into its own background,
  // since neither exists on the idle or done plates.
  panelSrc: string;
  panelRect: Rect;
  startButtonSrc: string;
  startButtonRect: Rect;
  // The "-"/"+" hit-boxes over the panel graphic (it has no highlight boxes
  // of its own in Figma, unlike the load/start hotspots - measured off the
  // panel's own art instead).
  temperatureMinusRect: Rect;
  temperaturePlusRect: Rect;
  durationMinusRect: Rect;
  durationPlusRect: Rect;
  sterilizeMs: number;
  frames: [SterilizeFrame, SterilizeFrame, SterilizeFrame];
}

export type ProcedureStep = WeighStep | DissolveStep | MeasureStep | AssembleStep | SterilizeStep;

// Jar hotspots measured off Figma's own highlight boxes: node 280:111 on the
// idle plate (left 483, top 719, 234x264) and 285:916 on the active plate
// (left 555, same top/size) - the jar is drawn ~72 design px further right
// once it is open and being scooped from.
const WEIGH_FRAMES: [WeighFrame, WeighFrame, WeighFrame] = [
  {
    src: bgIdleUrl,
    alt: 'Analis berdiri di meja kerja dengan toples Nutrient Agar tertutup di samping neraca digital yang menunjukkan angka 0',
    hotspot: { x: 483, y: 719, width: 234, height: 264 },
  },
  {
    src: bgActiveUrl,
    alt: 'Analis menyendok bubuk Nutrient Agar dari toples yang terbuka ke wadah timbang di atas neraca digital',
    hotspot: { x: 555, y: 719, width: 234, height: 264 },
  },
  {
    src: bgDoneUrl,
    alt: 'Wadah timbang berisi 7,0 gram Nutrient Agar di atas neraca digital, dengan catatan penimbangan berhasil',
  },
];

export const PENIMBANGAN_NUTRISI_STEP: WeighStep = {
  kind: 'weigh',
  id: 'penimbangan-nutrisi',
  n: 1,
  eyebrow: 'Langkah 1',
  title: 'Penimbangan Bahan Nutrisi',
  description:
    'Penimbangan dilakukan untuk memperoleh jumlah bahan media yang sesuai dengan volume media yang akan dibuat.',
  target: 'Target: Buat 250 mL Nutrient Agar',
  initialBackground: WEIGH_FRAMES[0].src,
  initialBackgroundAlt: WEIGH_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  hint: 'Timbang Nutrient Agar sesuai takaran yang telah ditentukan menggunakan neraca digital.',
  instructionLabel: 'Instruksi :',
  instruction: 'Klik bahan Nutrient Agar, lalu tambahkan ke wadah timbang hingga mencapai 7,0 g.',
  ingredientAccessibleName: 'Nutrient Agar, klik untuk menambahkan ke wadah timbang',
  targetGrams: 7,
  incrementGrams: 0.5,
  frames: WEIGH_FRAMES,
  successTitle: 'Penimbangan berhasil 7,0 g',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
};

// Hotspots measured off Figma's own highlight boxes: node 285:917 on the idle
// plate (the aquades bottle, left 483, top 666, 234x322 - taller than
// Langkah 1's jar box since the bottle itself is taller) and 285:918 on the
// poured plate (the hotplate, left 1147, top 750, 399x240).
const DISSOLVE_FRAMES: [DissolveFrame, DissolveFrame, DissolveFrame, DissolveFrame] = [
  {
    src: bgPourUrl,
    alt: 'Analis berdiri di meja kerja dengan botol aquades tertutup di samping labu erlenmeyer berisi bubuk Nutrient Agar dan hotplate yang masih mati',
    hotspot: { x: 483, y: 666, width: 234, height: 322 },
  },
  {
    src: bgPouredUrl,
    alt: 'Analis menuangkan aquades dari botol ke dalam labu erlenmeyer berisi Nutrient Agar di atas hotplate yang masih mati',
    hotspot: { x: 1147, y: 750, width: 399, height: 240 },
  },
  {
    src: bgHeatingUrl,
    alt: 'Analis mengaduk larutan Nutrient Agar dengan batang pengaduk di atas hotplate yang menyala',
  },
  {
    src: bgDissolvedUrl,
    alt: 'Larutan Nutrient Agar berwarna kuning bening dan homogen di atas hotplate, dengan catatan pelarutan berhasil',
  },
];

export const MELARUTKAN_MEDIA_STEP: DissolveStep = {
  kind: 'dissolve',
  id: 'melarutkan-media',
  n: 2,
  eyebrow: 'Langkah 2',
  title: 'Melarutkan Media',
  description: 'Pelarutan bertujuan mencampurkan bahan media dengan aquades hingga terbentuk larutan yang homogen.',
  initialBackground: DISSOLVE_FRAMES[0].src,
  initialBackgroundAlt: DISSOLVE_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  hint: 'Tambahkan aquades ke bahan yang telah ditimbang, kemudian panaskan dan aduk hingga media larut sempurna.',
  instructionLabel: 'Instruksi :',
  instruction: 'Tuangkan aquades, lalu nyalakan hotplate dan aduk media hingga homogen.',
  pourAccessibleName: 'Aquades, klik untuk menuangkan ke labu erlenmeyer',
  hotplateAccessibleName: 'Hotplate, klik untuk menyalakan dan memanaskan media',
  heatingMessage: 'Media sedang dipanaskan dan diaduk hingga larut sempurna.',
  heatMs: 1600,
  frames: DISSOLVE_FRAMES,
  successTitle: 'Media telah larut dan homogen!',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
};

// Hotspot measured off Figma's own highlight box: node 288:1298 on the idle
// plate (the pH meter unit, left 1203, top 633, 222x338).
const MEASURE_FRAMES: [MeasureFrame, MeasureFrame, MeasureFrame] = [
  {
    src: bgMeterIdleUrl,
    alt: 'Analis berdiri di meja kerja dengan labu erlenmeyer berisi larutan Nutrient Agar di samping pH meter yang masih mati',
    hotspot: { x: 1203, y: 633, width: 222, height: 338 },
  },
  {
    src: bgMeasuringUrl,
    alt: 'Analis mencelupkan probe pH meter ke dalam larutan Nutrient Agar, layar pH meter menunjukkan angka pH 7,0',
  },
  {
    src: bgPhOkUrl,
    alt: 'Analis mengacungkan jempol dengan probe pH meter tercelup di larutan yang menunjukkan pH 7,0, dengan catatan pH telah sesuai',
  },
];

export const MENGATUR_PH_STEP: MeasureStep = {
  kind: 'measure',
  id: 'mengatur-ph',
  n: 3,
  eyebrow: 'Langkah 3',
  title: 'Mengatur pH Media',
  description: 'Pengukuran pH dilakukan untuk memastikan tingkat keasaman media berada pada rentang yang sesuai.',
  initialBackground: MEASURE_FRAMES[0].src,
  initialBackgroundAlt: MEASURE_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  hint: 'Ukur pH media menggunakan pH meter dan sesuaikan hingga mencapai rentang pH 6,8–7,2.',
  instructionLabel: 'Instruksi :',
  instruction: 'Klik pH meter, lalu ukur pH larutan media.',
  meterAccessibleName: 'pH meter, klik untuk mengukur pH larutan media',
  measuringMessage: 'pH media sedang diukur menggunakan pH meter.',
  readout: 'pH 7,0',
  measureMs: 1400,
  frames: MEASURE_FRAMES,
  successTitle: 'pH telah sesuai!',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
};

// Hotspots measured off Figma's own highlight boxes: node 294:2065 on the
// idle plate (the Erlenmeyer, left 796, top 652, 222x338), 294:2067 on the
// poured plate (the cotton wool, left 1078, top 851, 170x116) and 294:2068 on
// the plugged plate (the foil sheet, left 1204, top 803, 398x194).
const ASSEMBLE_FRAMES: [AssembleFrame, AssembleFrame, AssembleFrame, AssembleFrame] = [
  {
    src: bgFlaskIdleUrl,
    alt: 'Analis berdiri di meja kerja dengan gelas ukur berisi larutan Nutrient Agar di samping labu Erlenmeyer kosong, kapas, dan kertas timah',
    hotspot: { x: 796, y: 652, width: 222, height: 338 },
    hotspotAccessibleName: 'Erlenmeyer, klik untuk menuangkan media ke dalamnya',
  },
  {
    src: bgFlaskPouredUrl,
    alt: 'Analis menuangkan larutan Nutrient Agar dari gelas ukur ke dalam labu Erlenmeyer',
    hotspot: { x: 1078, y: 851, width: 170, height: 116 },
    hotspotAccessibleName: 'Kapas, klik untuk menyumbat mulut Erlenmeyer',
  },
  {
    src: bgFlaskPluggedUrl,
    alt: 'Analis menyumbat mulut labu Erlenmeyer berisi media dengan kapas',
    hotspot: { x: 1204, y: 803, width: 398, height: 194 },
    hotspotAccessibleName: 'Kertas timah, klik untuk membungkus mulut Erlenmeyer',
  },
  {
    src: bgFlaskWrappedUrl,
    alt: 'Labu Erlenmeyer berisi media yang telah disumbat kapas dan dibungkus kertas timah, dengan catatan media siap disterilisasi',
  },
];

export const MENYIAPKAN_STERILISASI_STEP: AssembleStep = {
  kind: 'assemble',
  id: 'menyiapkan-sterilisasi',
  n: 4,
  eyebrow: 'Langkah 4',
  title: 'Menyiapkan Media untuk Sterilisasi',
  description:
    'Media perlu ditempatkan dalam wadah yang sesuai dan ditutup sebelum proses sterilisasi dilakukan.',
  initialBackground: ASSEMBLE_FRAMES[0].src,
  initialBackgroundAlt: ASSEMBLE_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  hint: 'Masukkan media ke dalam Erlenmeyer, kemudian tutup menggunakan kapas dan kertas timah.',
  instructionLabel: 'Instruksi :',
  instruction: 'Klik Erlenmeyer, lalu pasang kapas dan kertas timah pada bagian mulutnya.',
  frames: ASSEMBLE_FRAMES,
  successTitle: 'Media siap disterilisasi!',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
};

// Hotspots measured off Figma's own highlight boxes: node 297:2229 on the
// idle plate (the Erlenmeyer and open autoklaf door, left 968, top 242,
// 398x470). The loaded plate has no highlight box of its own in Figma - its
// hotspot is the "Mulai Proses" button's own raster asset, sized to match.
const STERILIZE_FRAMES: [SterilizeFrame, SterilizeFrame, SterilizeFrame] = [
  {
    src: bgAutoklafIdleUrl,
    alt: 'Analis berdiri di depan autoklaf dengan pintu terbuka, memegang labu Erlenmeyer berisi media yang telah disumbat kapas dan dibungkus kertas timah',
    hotspot: { x: 968, y: 242, width: 398, height: 470 },
  },
  {
    src: bgAutoklafLoadedUrl,
    alt: 'Analis memasukkan labu Erlenmeyer ke dalam rak autoklaf yang pintunya masih terbuka, dengan panel suhu dan waktu sterilisasi mengambang di sampingnya',
    hotspot: { x: 1301.86, y: 906.62, width: 329.704, height: 109.901 },
  },
  {
    src: bgAutoklafDoneUrl,
    alt: 'Autoklaf tertutup dan menyala menunjukkan suhu dan waktu sterilisasi di layarnya, dengan catatan sterilisasi berhasil',
  },
];

export const MENSTERILISASI_MEDIA_STEP: SterilizeStep = {
  kind: 'sterilize',
  id: 'mensterilisasi-media',
  n: 5,
  eyebrow: 'Langkah 5',
  title: 'Mensterilisasi Media',
  description: 'Sterilisasi dilakukan untuk menyiapkan media sebelum digunakan pada proses kultur mikroba.',
  initialBackground: STERILIZE_FRAMES[0].src,
  initialBackgroundAlt: STERILIZE_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  hint: 'Masukkan Erlenmeyer ke dalam autoklaf dan lakukan sterilisasi sesuai parameter yang ditentukan.',
  instructionLabel: 'Instruksi :',
  instruction: 'Masukkan Erlenmeyer ke autoklaf, lalu atur suhu 121°C selama 15–20 menit.',
  loadAccessibleName: 'Erlenmeyer, klik untuk memasukkan ke dalam autoklaf',
  startAccessibleName: 'Mulai Proses, klik untuk memulai sterilisasi',
  sterilizingMessage: 'Media sedang disterilisasi di dalam autoklaf sesuai suhu dan waktu yang diatur.',
  outOfRangeMessage: 'Atur suhu ke 121°C dan waktu ke rentang 15-20 menit sebelum memulai proses.',
  temperatureUnit: '°C',
  temperatureMin: 0,
  temperatureMax: 121,
  temperatureDefault: 115,
  temperatureStep: 1,
  temperatureTarget: 121,
  durationUnit: ' min',
  durationMin: 0,
  durationMax: 20,
  durationDefault: 4,
  durationStep: 2,
  durationTargetMin: 15,
  durationTargetMax: 20,
  panelSrc: autoklafPanelUrl,
  panelRect: { x: 1075, y: 629, width: 782.992, height: 391.496 },
  startButtonSrc: mulaiProsesBtnUrl,
  startButtonRect: { x: 1301.86, y: 906.62, width: 329.704, height: 109.901 },
  temperatureMinusRect: { x: 1231.6, y: 838.4, width: 70.5, height: 66.6 },
  temperaturePlusRect: { x: 1380.3, y: 838.4, width: 70.5, height: 66.6 },
  durationMinusRect: { x: 1595.6, y: 838.4, width: 70.5, height: 66.6 },
  durationPlusRect: { x: 1744.4, y: 838.4, width: 70.5, height: 66.6 },
  sterilizeMs: 1800,
  frames: STERILIZE_FRAMES,
  successTitle: 'Media telah disterilisasi',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
};

// Hotspots measured off Figma's own highlight boxes: node 305:612 on the
// idle plate (the Erlenmeyer and closed dishes, left 997, top 839, 524x165),
// 305:614 on the started plate (the Erlenmeyer, now held over the first open
// dish, left 599, top 702, 209x269) and 305:615 on the pouring plate (the
// whole pour - Erlenmeyer and first dish together, left 655, top 588,
// 430x371).
const MENUANGKAN_FRAMES: [AssembleFrame, AssembleFrame, AssembleFrame, AssembleFrame] = [
  {
    src: bgPetriIdleUrl,
    alt: 'Analis berdiri di meja kerja dengan labu Erlenmeyer berisi media steril di samping empat cawan Petri kosong yang masih tertutup',
    hotspot: { x: 997, y: 839, width: 524, height: 165 },
    hotspotAccessibleName: 'Erlenmeyer, klik untuk mulai menuangkan media ke cawan Petri',
  },
  {
    src: bgPetriStartedUrl,
    alt: 'Analis memegang tutup cawan Petri sambil mulai menuangkan media dari labu Erlenmeyer ke cawan Petri pertama yang terbuka',
    hotspot: { x: 599, y: 702, width: 209, height: 269 },
    hotspotAccessibleName: 'Erlenmeyer, klik untuk melanjutkan menuangkan media ke cawan Petri',
  },
  {
    src: bgPetriPouringUrl,
    alt: 'Analis menuangkan media dari labu Erlenmeyer ke cawan Petri pertama, dengan keempat cawan Petri berisi media steril',
    hotspot: { x: 655, y: 588, width: 430, height: 371 },
    hotspotAccessibleName: 'Cawan Petri, klik untuk menuntaskan penuangan media',
  },
  {
    src: bgPetriDoneUrl,
    alt: 'Analis mengacungkan jempol di meja kerja dengan empat cawan Petri berisi media steril, dengan catatan pembuatan media berhasil',
  },
];

export const MENUANGKAN_MEDIA_STEP: AssembleStep = {
  kind: 'assemble',
  id: 'menuangkan-media',
  n: 6,
  eyebrow: 'Langkah 6',
  title: 'Menuangkan Media',
  description: 'Media steril dituangkan ke dalam cawan Petri secara aseptik sebelum media memadat.',
  initialBackground: MENUANGKAN_FRAMES[0].src,
  initialBackgroundAlt: MENUANGKAN_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  hint: 'Tuangkan media steril dari Erlenmeyer ke dalam cawan Petri secara hati-hati dan aseptik.',
  instructionLabel: 'Instruksi :',
  instruction: 'Klik Erlenmeyer, lalu tuangkan media ke dalam cawan Petri.',
  frames: MENUANGKAN_FRAMES,
  successTitle: 'Pembuatan media berhasil!',
  successBody: 'Anda telah menyelesaikan semua tahap pembuatan media kultur.',
};

export const PROCEDURE_STEPS: ProcedureStep[] = [
  PENIMBANGAN_NUTRISI_STEP,
  MELARUTKAN_MEDIA_STEP,
  MENGATUR_PH_STEP,
  MENYIAPKAN_STERILISASI_STEP,
  MENSTERILISASI_MEDIA_STEP,
  MENUANGKAN_MEDIA_STEP,
];
