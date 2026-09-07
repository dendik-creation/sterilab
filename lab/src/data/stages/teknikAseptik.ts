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
import benchDirtyUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_3/backgrounds/1.png';
import benchCleaningUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_3/backgrounds/2.png';
import benchCleanUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_3/backgrounds/3.png';
import alcoholSprayUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_3/alcohol_spray.png';
import clothUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_3/cloth.png';
import burnerUnlitUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_4/backgrounds/1.png';
import burnerLitUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_4/backgrounds/2.png';
import oseIdleUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_5/backgrounds/1.png';
import oseHeatingUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_5/backgrounds/2.png';
import oseCoolingUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_5/backgrounds/3.png';
import jarumOseUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_5/jarum_ose.png';
import inoculateBenchUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_6/backgrounds/1.png';
import inoculateOpenLidUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_6/backgrounds/2.png';
import inoculateSamplingUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_6/backgrounds/3.png';
import inoculateTransferUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_6/backgrounds/4.png';
import inoculateClosedUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_6/backgrounds/5.png';
import inoculateLabeledUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_6/backgrounds/6.png';
import inoculateIncubatorUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_6/backgrounds/7.png';
import labelMarkerUrl from '../../../assets/images/02_scenes/04_01_teknik_kerja_aseptik/step_6/label_marker.png';

// Data for Stage 4 "Teknik Kerja Aseptik" (Figma "Sterilab-APHP" canvas 42:678
// "Scene 04: Prosedur Panjang Teknik Kerja Aseptik"). Every number here is a
// coordinate on that canvas' own 1920x1080 frame, so the Screen can convert it
// with a single design-px -> stage-length helper instead of hand-tuned
// percentages per element.
//
// All six are now authored: Langkah 1 (frame 42:679), Langkah 2 (58:2),
// Langkah 3 (61:541), Langkah 4 (61:542), Langkah 5 (61:543) and Langkah 6
// (61:544 / 256:443 / 256:582 / 256:711 / 258:840 / 258:975 / 259:21, the seven
// "LANGKAH 6 NEW" plates).
//
// The counter/dot row reads "N / 6" because Stage 4 is cut to six procedures
// (ADR-0006, which supersedes ADR-0004's eleven). Three sources disagreed on
// the count: the Figma canvas ships frames LANGKAH 1..12, ADR-0004 and the PRD
// specify 11 linear steps, and the product decision is 6 - which PRD steps
// fold together was a content decision, not a layout one.
export const TOTAL_STEPS = 6;

// Which procedure a step is, independent of its position in the list. The
// Screen picks a workspace component by this id (see
// presentation/pages/stages/teknik-aseptik/steps/index.tsx), so authoring
// LANGKAH 3 is a new id here, a new entry there, and nothing else.
export type ProcedureId =
  | 'cuci-tangan'
  | 'memakai-apd'
  | 'bersihkan-meja'
  | 'nyalakan-bunsen'
  | 'memijarkan-ose'
  | 'menginokulasi-kultur';

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

// One plate of Langkah 3's art, plus the bench top painted into it.
//
// The surface travels with the plate rather than sitting once on the step:
// BG_LANGKAH_3's three rasters are not registered to each other, and the bench
// is painted 44 design px higher on plate 2 than on plate 1. A single rect
// would leave the grime and the sweep strip floating above the table for the
// whole wipe phase.
//
// Each rect is measured off its own 1920x1080 raster - the bench is painted
// into the background, so it has no Figma node to read bounds from. The slab is
// a trapezoid in perspective; the rect is its narrower back edge, so every part
// of it lands on painted table.
//
// Both ends are then clipped to the gap between the two cards, which sit above
// the strip: the PROSEDUR card ends at 556.489 and the floating card starts at
// 1428.65. The painted slab reaches x 506 on every plate, but a strip that
// started there would put its first segment underneath the PROSEDUR card, where
// a press lands on the card and never reaches the bench at all.
export interface CleanFrame {
  src: string;
  alt: string;
  surface: Rect;
}

// Langkah 3's shape: two passes over one surface with two different tools -
// spray every segment of the bench, then scrub each segment clean.
export interface CleanStep extends BaseStep {
  kind: 'clean';
  // Copy inside the floating card, one line per phase. The frame only writes
  // the spray line (it draws a single illustration); the wipe line is the
  // second half of the procedure the Analyst is actually asked to do.
  sprayHint: string;
  wipeHint: string;
  // Announced when a tool is dropped somewhere that is not the bench.
  offSurfaceCorrection: string;
  // One plate per phase, in phase order: spray (bench dirty, Analyst idle),
  // wipe (Analyst spraying and wiping), done (bench clean, thumbs up). That is
  // what BG_LANGKAH_3's three stacked rasters draw, so the art advances with
  // the procedure instead of holding one illustration for all of it.
  frames: [CleanFrame, CleanFrame, CleanFrame];
  // How many segments the strip is divided into. Five, because the narrowest
  // strip is 828 design px wide and the 44px touch floor at 568px viewport
  // works out at 148.7 design px - five segments are 165.6 each and clear it,
  // six would be 138 and miss it.
  segments: number;
  // Scrubs per segment. Two, so "usap berulang" is literally true: one sweep
  // across and one back.
  wipePasses: number;
  tools: { spray: CleanTool; cloth: CleanTool };
}

// One draggable tool, sized from its own export (each carries 8 design px of
// transparent padding per side, like the Langkah 2 items).
export interface CleanTool {
  id: 'spray' | 'cloth';
  name: string;
  // Spoken form for the tool's own control in the card.
  accessibleName: string;
  src: string;
  width: number;
  height: number;
}

// One plate of Langkah 4's art, plus the burner painted into it.
//
// The lamp travels with the plate for the same reason Langkah 3's bench does:
// BG_LANGKAH_5's two rasters are not registered to each other. The lamp is
// painted 11 design px further left on the lit plate than on the unlit one, so
// one rect for both would hang the hit area - and the flame standing on the
// wick - off the side of the burner the moment the art advances.
//
// Both rects are measured off their own 1920x1080 raster: the burner is painted
// into the background, so it has no Figma node to read bounds from.
export interface BunsenFrame {
  src: string;
  alt: string;
  // Glass reservoir plus metal collar - the object the Analyst clicks, and what
  // the cap has to be dropped on.
  tube: Rect;
  // Top of the wick, where the braid clears the collar. The flame is anchored
  // here by its base rather than by its centre, so growing it lifts the tip
  // instead of sinking the flame into the metal.
  wick: { x: number; y: number };
}

// One size the flame passes through on its way to burning steadily. Sizes are
// design px on the 1920x1080 frame; `holdMs` is how long this size stays up
// before the next one takes over, and is unused on the last stage.
export interface FlameStage {
  id: 'kindling' | 'growing' | 'stable';
  width: number;
  height: number;
  message: string;
  holdMs: number;
}

// The cap, and where it comes to rest once the burner is covered: over the
// wick, its rim sitting on the collar at y 518.
export interface BunsenCap {
  name: string;
  accessibleName: string;
  // Announced while the flame is still coming up and the cap may not be used.
  lockedName: string;
  rest: Rect;
}

// How the flame painted into the lit plate is taken off screen.
//
// The plate draws its own flame at x 932..949, y 447..497, and a raster cannot
// be blown out. The cap covers the lower half of it - which is what a cap
// physically does - and this covers the rest: a strip of the analyst's coat,
// copied out of the *same* plate and stacked over the flame's top.
//
// Copied rather than painted flat, because the coat is not flat there: its
// front edge is a blue seam running vertically through x 929..930, straight
// behind the flame, and a plain white rectangle would cut a hole in that line.
// `donor` is a clean band of the same columns (below the coat's button at y
// ~424..434, above the flame at 447), repeated down the strip - the seam is
// vertical, so every repeat of the band lines up with the one above it.
export interface FlamePatch {
  rect: Rect;
  donor: { y: number; height: number };
}

// Langkah 4's shape: light the burner, let it settle into a steady flame, then
// put it out with the cap.
//
// Nothing in the interaction is a PNG. The step ships two background plates and
// nothing else, so the flame, the cap and the wisp of smoke are drawn in the
// workspace (SVG) instead of being composited from art: a painted flame could
// not grow, and a painted cap could not be carried to the burner without
// leaving a copy of itself behind on the bench.
export interface BunsenStep extends BaseStep {
  kind: 'bunsen';
  // Copy of the floating card on the right, verbatim from frame 61:542. It
  // describes both halves of the procedure, so it stays put while the phase
  // changes underneath it.
  hint: string;
  // Spoken form of the burner control, one per phase it can be used in.
  igniteName: string;
  extinguishName: string;
  // Announced when the cap is released somewhere that is not the burner.
  offTargetCorrection: string;
  // Unlit plate first, lit plate second - the order the procedure walks them.
  frames: [BunsenFrame, BunsenFrame];
  flameStages: [FlameStage, FlameStage, FlameStage];
  cap: BunsenCap;
  flamePatch: FlamePatch;
}

// One plate of Langkah 5's art. Unlike Langkah 3 and 4, the bunsen itself never
// moves between the three plates (measured off each raster: flame + collar
// both sit within a few px of the same box on all three) - only the analyst's
// hands and the loop's own glow change - so a single `target` rect on the step
// covers every plate instead of one rect per frame.
export interface OseFrame {
  src: string;
  alt: string;
}

// The jarum ose tool tile in the floating card, sized from its own export (8
// design px of transparent padding per side, like every other tool tile).
export interface OseTool {
  name: string;
  accessibleName: string;
  src: string;
  width: number;
  height: number;
}

// Langkah 5's shape: drag the loop to the flame (or activate the flame control
// directly, like Langkah 4's tube), hold it there until it glows red, then hold
// it clear until it cools. Figma frame 61:543 "LANGKAH 5 NEW" - the card copy
// is verbatim from its text nodes (232:1585..232:1589).
export interface SterilizeStep extends BaseStep {
  kind: 'sterilize';
  hint: string;
  tool: OseTool;
  // Where the loop has to land: the flame and the metal collar under it,
  // measured off backgrounds/1.png (x 899..972, y 587..759 across all three
  // plates) with a margin so a floored touch target still lands on it.
  target: Rect;
  // Announced when the loop is dropped somewhere that is not the flame.
  offTargetCorrection: string;
  // How long the loop stays glowing before it is deemed cool enough to use.
  heatMs: number;
  coolMs: number;
  // Idle (bunsen lit, hands empty) first, heating (loop held in the flame,
  // glowing) second, cooling (loop held clear, dulled) third. `idle` is shown
  // again once cooling finishes: the loop has been put down, so the room reads
  // the same as before the Analyst picked it up.
  frames: [OseFrame, OseFrame, OseFrame];
}

// One plate of Langkah 6's art. Unlike Langkah 3/4/5, every one of its six
// actions changes what is sitting on the bench (a dish opens, a sample moves,
// a lid closes, a label appears, the dish leaves for the incubator), so - like
// Langkah 1 - each plate is its own flattened export rather than a shared
// prop drawn over one background.
export interface InoculateFrame {
  src: string;
  alt: string;
}

// A plain object already on the bench: click it and the workspace cuts to the
// next plate. Four of Langkah 6's six actions are this shape (open the dish,
// take the sample, move it to the media, close the lid) - the object is baked
// into the plate's own art, so there is no separate tool asset to drag.
export interface InoculateClickAction {
  kind: 'click';
  accessibleName: string;
  hotspot: Rect;
}

// A tool tile inside the floating card has to be dropped on a target rect in
// the scene, exactly like Langkah 5's loop. Labelling is the one action in
// Langkah 6 with a real isolated asset to drag (Figma node 258:972) rather
// than an object painted into the plate.
export interface InoculateDragAction {
  kind: 'drag';
  tool: { src: string; width: number; height: number; accessibleName: string };
  target: Rect;
  offTargetCorrection: string;
}

export type InoculateAction = InoculateClickAction | InoculateDragAction;

// Card copy for one action: the descriptive sentence Figma writes above the
// divider, and the short imperative line below it ("Instruksi :").
export interface InoculatePhaseCopy {
  hint: string;
  instructionLabel: string;
}

// Langkah 6's shape: a six-action chain across seven plates - open the culture
// vessel, pick up a sample with the loop, transfer it to fresh media, reseal
// both vessels, label the new media, then move it to the incubator. Figma
// frames 61:544, 256:443, 256:582, 256:711, 258:840, 258:975, 259:21 ("LANGKAH
// 6 NEW (1)".."(7)") - the card copy on each is verbatim from its own text
// nodes.
//
// The sixth action ("Drag media baru... ke incubator") is authored as a click
// rather than a drag: Figma's card shows a preview of the labelled dish at
// node 258:986, but that node is an empty mask over the shared background
// raster (a 1.3KB export, no pixels of its own) rather than an isolated
// sprite - there is nothing to render as a ghost while it is carried. Clicking
// the incubator itself (Figma's own drop-target rect) asks for the same
// action without inventing art the design does not actually ship.
export interface InoculateStep extends BaseStep {
  kind: 'inoculate';
  actions: [
    InoculateClickAction,
    InoculateClickAction,
    InoculateClickAction,
    InoculateClickAction,
    InoculateDragAction,
    InoculateClickAction,
  ];
  // One plate per action, plus the opening one: frames[n] is shown once n
  // actions have landed.
  frames: [
    InoculateFrame,
    InoculateFrame,
    InoculateFrame,
    InoculateFrame,
    InoculateFrame,
    InoculateFrame,
    InoculateFrame,
  ];
  phaseCopy: [
    InoculatePhaseCopy,
    InoculatePhaseCopy,
    InoculatePhaseCopy,
    InoculatePhaseCopy,
    InoculatePhaseCopy,
    InoculatePhaseCopy,
  ];
}

export type ProcedureStep = SequenceStep | EquipStep | CleanStep | BunsenStep | SterilizeStep | InoculateStep;

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

// The three plates of BG_LANGKAH_3 (229:11 / 229:12 / 229:13), in phase order.
// The bench rects are measured off each raster: the painted slab sits at
// y 635..694 on the first, y 591..659 on the second and y 607..676 on the
// third, so the strip has to move with the plate.
const CLEAN_BENCH_FRAMES: [CleanFrame, CleanFrame, CleanFrame] = [
  {
    src: benchDirtyUrl,
    alt: 'Meja kerja laboratorium di tengah ruangan dengan permukaan yang masih kotor berdebu, analis berdiri di belakangnya',
    surface: { x: 566, y: 635, width: 828, height: 59 },
  },
  {
    src: benchCleaningUrl,
    alt: 'Analis menyemprotkan alkohol 70% ke meja kerja dan mengusapnya dengan lap',
    surface: { x: 566, y: 591, width: 843, height: 68 },
  },
  {
    src: benchCleanUrl,
    alt: 'Meja kerja laboratorium yang sudah bersih mengkilap, analis mengacungkan jempol',
    surface: { x: 566, y: 607, width: 837, height: 69 },
  },
];

// Bench-cleaning: spray the whole bench with 70% alcohol, then wipe it down.
// Figma frame 61:541 "LANGKAH 3 NEW" - the card copy is verbatim from its text
// nodes (242:292 / 242:294 / 242:293 and the hint at 229:474).
export const CLEAN_BENCH_STEP: CleanStep = {
  kind: 'clean',
  id: 'bersihkan-meja',
  n: 3,
  eyebrow: 'Langkah 3',
  title: 'Membersihkan Meja Kerja',
  description:
    'Bersihkan permukaan meja menggunakan alkohol 70% untuk mengurangi risiko kontaminasi sebelum memulai pekerjaan.',
  sprayHint:
    'Semprot Permukaan Meja: Tarik (drag) botol spray alkohol 70% ke arah meja kerja, lalu sapukan ke kiri dan ke kanan hingga seluruh permukaan tersemprot.',
  wipeHint:
    'Usap Permukaan Meja: Tarik (drag) lap ke meja kerja, lalu usap bolak-balik hingga seluruh area kerja bersih.',
  offSurfaceCorrection: 'Arahkan ke permukaan meja kerja - hanya meja yang perlu dibersihkan.',
  // Deliberately not opening with "Ruang laboratorium": Case's own artwork
  // already carries that phrase, and tests/case.ts matches it to know it has
  // landed on Case.
  initialBackground: CLEAN_BENCH_FRAMES[0].src,
  initialBackgroundAlt: CLEAN_BENCH_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  frames: CLEAN_BENCH_FRAMES,
  segments: 5,
  wipePasses: 2,
  successTitle: 'Meja kerja telah dibersihkan!',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
  tools: {
    spray: {
      id: 'spray',
      name: 'Botol spray alkohol 70%',
      accessibleName: 'Botol spray alkohol 70%, seret ke meja kerja',
      src: alcoholSprayUrl,
      width: 123,
      height: 190,
    },
    cloth: {
      id: 'cloth',
      name: 'Lap pembersih',
      accessibleName: 'Lap pembersih, seret ke meja kerja',
      src: clothUrl,
      width: 170,
      height: 128,
    },
  },
};

// The two plates of BG_LANGKAH_5 (231:610 / 231:611), in procedure order. The
// lamp sits at x 905..1000 on the first and x 893..988 on the second, and its
// wick tip - the braid where it clears the collar - at (951, 494) and
// (939, 499).
const BURNER_FRAMES: [BunsenFrame, BunsenFrame] = [
  {
    src: burnerUnlitUrl,
    alt: 'Analis memegang korek api yang menyala di atas sumbu bunsen spirtus yang masih padam di meja kerja',
    tube: { x: 905, y: 512, width: 95, height: 120 },
    wick: { x: 951, y: 494 },
  },
  {
    src: burnerLitUrl,
    alt: 'Bunsen spirtus menyala dengan api biru kekuningan dan analis mengacungkan jempol',
    tube: { x: 893, y: 512, width: 95, height: 116 },
    wick: { x: 939, y: 499 },
  },
];

// Lighting the burner: click the tube, wait for the flame to come up, then cap
// it. Figma frame 61:542 "LANGKAH 4 NEW" - the card copy is verbatim from its
// text nodes (242:320 / 242:322 / 242:321) and the hint from the floating card.
//
// The flame does not arrive in one beat. "Hingga menyala stabil dengan warna
// biru kekuningan" is a statement about *waiting*: a spirit lamp catches small
// and yellow, and only settles into a steady blue-based flame once the wick is
// drawing properly. Each stage is announced, so the wait carries information
// rather than being a delay - and the art advances with it, the lit plate
// landing exactly when the flame becomes steady.
export const LIGHT_BUNSEN_STEP: BunsenStep = {
  kind: 'bunsen',
  id: 'nyalakan-bunsen',
  n: 4,
  eyebrow: 'Langkah 4',
  title: 'Menyalakan Bunsen',
  description:
    'Bunsen spirtus menggunakan bahan bakar cair (spirtus) yang lebih aman, mudah digunakan, dan cocok untuk praktikum di laboratorium sekolah.',
  hint: 'Klik tabung bunsen spirtus untuk menyalakan apinya hingga menyala stabil dengan warna biru kekuningan, lalu gunakan penutup untuk memadamkannya setelah selesai digunakan.',
  igniteName: 'Nyalakan bunsen spirtus dengan korek api',
  extinguishName: 'Tutup bunsen spirtus dengan penutup untuk memadamkan api',
  offTargetCorrection: 'Arahkan penutup ke tabung bunsen - hanya bunsen yang perlu ditutup.',
  initialBackground: BURNER_FRAMES[0].src,
  initialBackgroundAlt: BURNER_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  frames: BURNER_FRAMES,
  flameStages: [
    {
      id: 'kindling',
      width: 16,
      height: 26,
      message: 'Api mulai menyala, nyalanya masih kecil.',
      holdMs: 620,
    },
    {
      id: 'growing',
      width: 24,
      height: 52,
      message: 'Api membesar, nyalanya masih bergoyang dan belum stabil.',
      holdMs: 700,
    },
    {
      id: 'stable',
      width: 32,
      height: 76,
      message:
        'Api menyala stabil dengan warna biru kekuningan. Gunakan penutup untuk memadamkannya setelah selesai digunakan.',
      holdMs: 0,
    },
  ],
  cap: {
    name: 'Penutup bunsen',
    accessibleName: 'Penutup bunsen, seret ke tabung bunsen',
    lockedName: 'Penutup bunsen, tersedia setelah api menyala stabil',
    // Sleeved over the wick, its rim sunk into the collar (518..548) rather
    // than perched on top of it, and proportioned like the cap the plate paints
    // on the bench beside the lamp (27 x 47).
    rest: { x: 922, y: 484, width: 36, height: 52 },
  },
  // The painted flame, covered with the coat behind it. The strip runs the
  // flame's whole height (447..497) rather than stopping where the cap's dome
  // starts: the dome is narrow at the top, and the flame is at its widest just
  // beside those shoulders, so a shorter strip leaves two specks of fire either
  // side of the cap.
  flamePatch: {
    rect: { x: 920, y: 442, width: 40, height: 56 },
    donor: { y: 436, height: 10 },
  },
  // Verbatim from the frame's note card. It names what the step is for -
  // getting the burner lit - and stays that way even though the closing beat
  // puts the flame back out: capping a burner you have finished with is part of
  // using it, not a second achievement.
  successTitle: 'Bunsen telah menyala!',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
};

// Langkah 5's three plates, in procedure order. The bunsen sits still across
// all three (unlike Langkah 3/4's props), so there is one `TARGET` rather than
// one per plate.
const OSE_FRAMES: [OseFrame, OseFrame, OseFrame] = [
  {
    src: oseIdleUrl,
    alt: 'Analis berdiri dengan tangan di sisi tubuh di depan bunsen spirtus yang menyala, penutup bunsen diletakkan di sebelahnya',
    // Same idle plate is shown again once the loop has cooled.
  },
  {
    src: oseHeatingUrl,
    alt: 'Analis memegang jarum ose dan mengarahkan ujung kawatnya yang memijar merah ke dalam api bunsen',
  },
  {
    src: oseCoolingUrl,
    alt: 'Analis mengangkat jarum ose menjauh dari api bunsen, ujung kawatnya sudah tidak memijar lagi',
  },
];

// Flame + metal collar, measured off backgrounds/1.png: flame x 905..955,
// y 587..679; collar x 899..972, y 710..759 - the same box (within a few px)
// on all three plates, since the bunsen itself does not move here.
const OSE_TARGET: Rect = { x: 890, y: 580, width: 95, height: 190 };

// Sterilizing the inoculating loop: heat it in the flame until it glows red,
// then hold it clear until it cools, before it touches a culture. Figma frame
// 61:543 "LANGKAH 5 NEW" - the card copy is verbatim from its text nodes
// (232:1585..232:1589), and the eyebrow paragraph (242:349/242:350) matches the
// PROSEDUR card's own description/title.
export const STERILIZE_OSE_STEP: SterilizeStep = {
  kind: 'sterilize',
  id: 'memijarkan-ose',
  n: 5,
  eyebrow: 'Langkah 5',
  title: 'Memijarkan Jarum Ose',
  description:
    'Jarum ose adalah alat berbentuk kawat kecil dengan ujung bulat (ose) yang digunakan untuk mengambil dan memindahkan kultur mikroorganisme.',
  hint: 'Tarik dan arahkan ujung jarum ose ke bagian atas api bunsen hingga seluruh kawat memijar merah, lalu diamkan sejenak hingga mendingin sebelum digunakan untuk mengambil kultur mikroba.',
  offTargetCorrection: 'Arahkan jarum ose ke atas api bunsen - hanya bagian ini yang perlu dipanaskan.',
  initialBackground: OSE_FRAMES[0].src,
  initialBackgroundAlt: OSE_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  frames: OSE_FRAMES,
  target: OSE_TARGET,
  heatMs: 900,
  coolMs: 900,
  successTitle: 'Jarum ose telah disterilkan!',
  successBody: 'Anda siap melanjutkan ke langkah berikutnya.',
  tool: {
    name: 'Jarum ose',
    accessibleName: 'Jarum ose, seret ke atas api bunsen',
    src: jarumOseUrl,
    width: 142,
    height: 137,
  },
};

// Langkah 6's seven plates, in procedure order.
const INOCULATE_FRAMES: InoculateStep['frames'] = [
  {
    src: inoculateBenchUrl,
    alt: 'Analis berdiri di depan bunsen menyala dengan cawan kultur, media steril, dan jarum ose tersedia di meja kerja',
  },
  {
    src: inoculateOpenLidUrl,
    alt: 'Analis membuka wadah kultur secara aseptik di dekat nyala api bunsen',
  },
  {
    src: inoculateSamplingUrl,
    alt: 'Analis mengambil sampel dari cawan kultur menggunakan jarum ose steril',
  },
  {
    src: inoculateTransferUrl,
    alt: 'Analis memindahkan inokulum ke media kultur steril di dekat nyala api',
  },
  {
    src: inoculateClosedUrl,
    alt: 'Analis menutup kembali wadah kultur dan media setelah inokulasi selesai',
  },
  {
    src: inoculateLabeledUrl,
    alt: 'Media yang telah diinokulasi kini diberi label identitas sampel, jenis media, dan tanggal',
  },
  {
    src: inoculateIncubatorUrl,
    alt: 'Analis menempatkan media yang telah diinokulasi ke dalam inkubator',
  },
];

// Hotspots and drop targets, measured off the highlight boxes Figma itself
// draws on each plate (e.g. node 256:167 on plate 1: x=377, y=830, w=199,
// h=165) rather than eyeballed off the art.
export const MENGINOKULASI_KULTUR_STEP: InoculateStep = {
  kind: 'inoculate',
  id: 'menginokulasi-kultur',
  n: 6,
  eyebrow: 'Langkah 6',
  title: 'Mengambil dan Menginokulasi Kultur',
  description:
    'Inokulasi adalah proses pemindahan mikroorganisme dari kultur asal ke media pertumbuhan baru secara aseptik untuk memperbanyak atau memurnikan biakan tanpa adanya kontaminasi dari lingkungan sekitar.',
  initialBackground: INOCULATE_FRAMES[0].src,
  initialBackgroundAlt: INOCULATE_FRAMES[0].alt,
  backgroundRect: FULL_FRAME,
  frames: INOCULATE_FRAMES,
  actions: [
    { kind: 'click', accessibleName: 'Buka wadah kultur secara aseptik di dekat nyala api', hotspot: { x: 377, y: 830, width: 199, height: 165 } },
    { kind: 'click', accessibleName: 'Ambil sampel menggunakan jarum ose steril', hotspot: { x: 1090, y: 791, width: 434, height: 199 } },
    { kind: 'click', accessibleName: 'Pindahkan inokulum ke media kultur steril', hotspot: { x: 555, y: 883, width: 234, height: 129 } },
    { kind: 'click', accessibleName: 'Tutup kembali wadah kultur dan media', hotspot: { x: 950, y: 636, width: 234, height: 129 } },
    {
      kind: 'drag',
      tool: {
        src: labelMarkerUrl,
        width: 216,
        height: 144,
        accessibleName: 'Label dan spidol, seret ke media yang telah diinokulasi sampel',
      },
      target: { x: 576, y: 854, width: 234, height: 129 },
      offTargetCorrection: 'Arahkan label ke media yang telah diinokulasi sampel - hanya media ini yang perlu diberi label.',
    },
    { kind: 'click', accessibleName: 'Simpan media yang telah diinokulasi ke dalam inkubator', hotspot: { x: 1125, y: 278, width: 330, height: 351 } },
  ],
  phaseCopy: [
    { hint: 'Buka wadah kultur secara aseptik di dekat nyala api.', instructionLabel: 'Klik kultur / sampel' },
    { hint: 'Ambil sampel menggunakan jarum ose steril.', instructionLabel: 'Klik jarum ose steril' },
    { hint: 'Pindahkan inokulum ke media kultur steril menggunakan teknik aseptik.', instructionLabel: 'Klik media steril' },
    { hint: 'Tutup kembali wadah kultur dan media setelah proses inokulasi selesai.', instructionLabel: 'Klik tutup cawan petri' },
    {
      hint: 'Beri label pada media agar sampel dapat diidentifikasi dengan benar.',
      instructionLabel: 'Drag label dan marker ke media baru yang sudah diinokulasi sampel',
    },
    {
      hint: 'Tempatkan media yang telah diinokulasi ke dalam inkubator sesuai prosedur.',
      instructionLabel: 'Klik media untuk menempatkannya ke dalam inkubator',
    },
  ],
  successTitle: 'Inokulasi kultur berhasil!',
  successBody: 'Anda telah menyelesaikan semua tahap teknik kerja aseptik.',
};

// The LANJUT button walks this array, so authoring another LANGKAH is a data
// change.
export const PROCEDURE_STEPS: ProcedureStep[] = [
  HAND_WASH_STEP,
  WEAR_PPE_STEP,
  CLEAN_BENCH_STEP,
  LIGHT_BUNSEN_STEP,
  STERILIZE_OSE_STEP,
  MENGINOKULASI_KULTUR_STEP,
];
