import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import homeBtnUrl from '../../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import checkSuccessUrl from '../../../../assets/images/01_reusable/icons/check_success.png';
import arrowRightUrl from '../../../../assets/images/01_reusable/icons/arrow_right.png';
import checkboxCheckedUrl from '../../../../assets/images/01_reusable/icons/checkbox_checked.png';
import checkboxUncheckedUrl from '../../../../assets/images/01_reusable/icons/checkbox_unchecked.png';
import clickSfxUrl from '../../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../core/audio/audioSettings';
import { prefersReducedMotion } from '../../../core/a11y/motion';
import { PROCEDURE_STEPS, SOAP_ART, TOTAL_STEPS } from '../../../data/stages/teknikAseptik';
import type { ApdItem, EquipStep, ProcedureStep, Rect, SequenceStep, StepAction } from '../../../data/stages/teknikAseptik';
import { Stage } from '../../components/Stage';
import { IconButton } from '../../components/IconButton';
import { useIsMobile } from '../../hooks/useIsMobile';

// Stage 4 - Teknik Kerja Aseptik. Figma "Sterilab-APHP" canvas 42:678, frames
// 42:679 "LANGKAH 1" (cuci tangan) and 58:2 "LANGKAH 2" (memakai APD), both
// 1920x1080.
//
// Unlike Case/Missions this Screen's copy is real DOM text, not baked into the
// art: the procedure card is live state (which step, what is done), so it has
// to be selectable, translatable and reachable by a screen reader. That means
// every length is derived from the Figma frame with S()/T() below rather than
// being a hand-picked percentage.
//
// Everything - background art included - lives in Stage's *safe* (contain)
// layer. Hit areas, instruction pills and the APD sockets all have to line up
// with features painted into the art, and Stage's two layers only agree at 16:9
// (see the comment in components/Stage.tsx): at 1024x768 a cover-layer point
// drifts ~50px from the same percentage in the contain layer, which would slide
// a pill off its object or a socket off the analyst's face. Stage's
// `background` therefore gets a blurred copy of the same frame, purely so the
// letterboxed edges on non-16:9 viewports read as bleed instead of bars.

// Design px on the 1920x1080 frame -> a length on the stage. Stage's safe
// layer is a container (`containerType: inline-size`), so 1cqw is 1% of its
// width; the layer is always 16:9, so the same conversion is valid vertically.
const S = (designPx: number) => `${(designPx / 1920) * 100}cqw`;

// Same, with a floor. Text that scaled purely with the stage would render at
// ~6px on the smallest supported landscape viewport (568x320), so every type
// size gets a minimum. Boxes that hold floored text size themselves from their
// content or use minHeight, never a fixed height, so the floor widens/heightens
// the box instead of overflowing it.
const T = (designPx: number, floorPx: number) => `max(${floorPx}px, ${(designPx / 1920) * 100}cqw)`;

const COLOR = {
  navy: '#04488B',
  pillBlue: '#3471C7',
  band: '#F1F8FE',
  divider: '#B2C7DB',
  dotIdleFill: '#ECEFF5',
  dotIdleRing: '#7A9CC4',
  dotIdleText: '#232D84',
  body: '#1C1B1A',
  successGreen: '#008C3B',
  ctaBlue: '#357EC1',
  ctaBlueEdge: '#1F6FB5',
  ctaShadow: '#75CBF1',
  correction: '#A8321F',
} as const;

// Top bar. Same Figma x/y as Missions (home 47.974, back 146.103, sound
// 1803.486, all 72.783 square of 1920) and the same floors: IconButton pins
// every icon to a 44x44 WCAG 2.2 AA target, which on a 568px-wide viewport is
// ~2x its designed size, so the offsets have to be floored/capped too or the
// icons collide on the left and leave the stage on the right.
const HOME_LEFT = 'max(12px, 2.499%)';
const BACK_LEFT = 'max(64px, 7.609%)';
const SOUND_LEFT = 'min(93.931%, 100% - 52px)';
const TOP_BAR_TOP = '3.574%';
const ICON_SIZE = '3.791%';

// Figma geometry, grouped the way the frame groups it.
//
// The band is floored at 60px because IconButton floors its icons to a 44x44
// touch target: on a 568x320 viewport the designed band is only ~44px tall and
// the icons would hang out of the bottom of it. The title block is floored the
// same way - at 568px the designed x=264 lands at 78px, inside the widened back
// button (which ends at 108px), so it starts at 116px instead.
const HEADER_BAND_HEIGHT = 'max(60px, 7.682cqw)'; // 147.5 of 1080
const HEADER_TEXT_LEFT = `max(116px, ${(264 / 1920) * 100}cqw)`;
// Title box (line-height 1) to subtitle box, derived from the frame's two ink
// boxes: title cap top 42, subtitle cap top 85.868.
const HEADER_TEXT_GAP = 10.3;

const PROCEDURE_CARD = { x: 49.917, y: 219.623, width: 506.572, bannerHeight: 425.848 };
const PROCEDURE_HEAD_HEIGHT = 289.581 - 219.623; // visible blue band above the white card
const PROCEDURE_BODY_MIN_HEIGHT = 390.613;
const COUNTER_PILL = { width: 262.468, height: 44.936 };
const DOT_SIZE = 29.814;
const DOT_GAP = 39.744 - DOT_SIZE;
const RULE_WIDTH = 467.068;

// Both floating cards on the right share the same tab: a blue pill hung over
// the card's top edge at y=221.17, 230.042 x 44.936.
const FLOATING_TAB = { y: 221.17, width: 230.042, height: 44.936 };

const HINT_CARD = { x: 1428.649, y: 221.17, width: 443.377 };
const HINT_PILL = { dx: 106.668 };
const HINT_BODY = { dy: 16.875, minHeight: 124.496, textWidth: 330.871 };

// Langkah 2's card (Figma group 62:799) is taller and wider than Langkah 1's
// because it carries the 3x2 APD grid.
const APD_CARD = { x: 1347.524, y: 238.045, width: 524.502, minHeight: 609.551 };
const APD_PILL_DX = 1494.754 - APD_CARD.x;
const APD_PROMPT_DY = 288.865 - APD_CARD.y;

// The grid is laid out as a real CSS grid rather than six absolute boxes: on a
// small viewport the 44px touch-target floor makes a cell taller than Figma
// draws it, and a grid row grows to fit where an absolute box would overlap its
// neighbour. The numbers below are the gaps that put the cells back on their
// Figma coordinates at desktop sizes (grid origin 1372.662, 331.724).
const APD_GRID = {
  x: 1372.662,
  y: 331.724,
  width: 474.163,
  bottom: 734.915,
  checkbox: 39.677,
  rowGap: 5,
  // Row 0: checkbox above the art (Figma checkbox row at y=331.724, art ink
  // centred on y=475). Row 1 mirrors it, checkbox below (y=695.394).
  row0Gap: 18.755,
  row0ArtHeight: 170,
  row1Gap: 29.39,
  row1ArtHeight: 101,
};
const APD_CONFIRM = { minWidth: 199.95, height: 44.937, dy: 775.634 - APD_GRID.bottom };
const APD_CARD_PAD_BOTTOM = 847.596 - (775.634 + APD_CONFIRM.height);

// Drop target on the analyst. Floored to 44px like every other hit area; the
// socket centres in the step data are spaced so two floored sockets never
// overlap, down to the smallest viewport that shows them (1024px wide).
const SOCKET_SIZE = 84;
// Pointer travel that turns a press into a drag rather than a select.
const DRAG_THRESHOLD_PX = 6;
const CORRECTION_MS = 3200;

// Anchored by its bottom edge (1001.159 of 1080), not its top: on a small
// viewport the floored copy and the 44px-floored LANJUT button make this card
// roughly twice its designed height, and growing downwards would push it off
// the bottom of the stage.
const NOTE_CARD = { x: 572.476, bottom: 1080 - 1001.159, width: 775.048, minHeight: 108.87 };
const NOTE_CHECK = { dx: 21.54, dy: 19.592, size: 71.72 };
const NOTE_TEXT = { dx: 110.856 };
const NOTE_CTA = { dx: 547.457, dy: 29.002, minWidth: 200.931, height: 52.1 };

const CARD_RADIUS = 24;
const HAIRLINE = 2;

// Entrance ladder, then the exact reverse on the way out - same 110ms stagger
// and bubble in/out pairing as Splash, Case and Missions.
const STAGGER_MS = 110;
const BUBBLE_MS = 550;
const ENTER_STEPS = 3; // top bar + header text, procedure card, floating card
const EXIT_TOTAL_MS = ENTER_STEPS * STAGGER_MS + BUBBLE_MS;
const enterDelay = (step: number) => step * STAGGER_MS;
const exitDelay = (step: number) => (ENTER_STEPS - step) * STAGGER_MS;

// The finished background needs to be on screen before the note card starts
// rising, or the Analyst reads "Tangan telah dibersihkan!" over hands that are
// still under the tap.
const SETTLE_MS = 620;

const CARD_SHADOW = '0 0.6cqw 1.6cqw rgba(4, 72, 139, 0.22)';

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export function TeknikAseptikPage() {
  const { goBack, goTo } = useNavigation();
  const isMobile = useIsMobile();
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [exiting, setExiting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  // Langkah 1: how many of the step's actions have landed - also the index of
  // the background frame, since the four frames are authored in click order.
  const [doneCount, setDoneCount] = useState(0);
  // Langkah 2: which items are on the analyst, which one is picked up, and
  // whether Selesai has been pressed (the only moment the art can change).
  const [placed, setPlaced] = useState<string[]>([]);
  const [held, setHeld] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [correction, setCorrection] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const socketsRef = useRef(new Map<string, HTMLElement>());
  const dragOriginRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const correctionTimerRef = useRef(0);

  const step: ProcedureStep = PROCEDURE_STEPS[stepIndex];

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSfxUrl);
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(window.clearTimeout);
  }, []);

  const after = (ms: number, run: () => void) => {
    timeoutsRef.current.push(window.setTimeout(run, ms));
  };

  const playClick = () => {
    if (!isAudioEnabled()) return;
    const audio = clickAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  const handleToggleSound = () => {
    const enabled = toggleAudioEnabled();
    setAudioOn(enabled);
    if (enabled) playClick();
  };

  // Every way off this Screen runs the exit transition first, so the reverse
  // stagger plays for home/back/LANJUT alike instead of only one of them.
  const leaveTo = (navigate: () => void) => {
    if (exiting) return;
    playClick();
    if (prefersReducedMotion()) {
      navigate();
      return;
    }
    setExiting(true);
    after(EXIT_TOTAL_MS, navigate);
  };

  const handleAction = (action: StepAction) => {
    if (step.kind !== 'sequence' || action.order !== doneCount + 1) return;
    playClick();
    const next = doneCount + 1;
    setDoneCount(next);
    if (next < step.actions.length) return;
    if (prefersReducedMotion()) {
      setShowNote(true);
      return;
    }
    after(SETTLE_MS, () => setShowNote(true));
  };

  const showCorrection = (message: string) => {
    setCorrection(message);
    window.clearTimeout(correctionTimerRef.current);
    correctionTimerRef.current = window.setTimeout(() => setCorrection(null), CORRECTION_MS);
  };

  // One place where an item meets a socket, whichever way it got there: a drop
  // at the end of a drag, a click on a socket after picking an item up, or the
  // keyboard doing the same thing with Enter.
  const equip = (item: ApdItem, socketItem: ApdItem) => {
    if (confirmed) return;
    if (item.id !== socketItem.id) {
      // Wrong body part is refused, but it is refused *out loud*: a silent
      // snap-back teaches nothing about why the item belongs elsewhere.
      showCorrection(
        `${item.name} dipakai di ${item.bodyPart.toLowerCase()}, bukan di ${socketItem.bodyPart.toLowerCase()}.`,
      );
      return;
    }
    playClick();
    setCorrection(null);
    setHeld(null);
    setPlaced((current) => (current.includes(item.id) ? current : [...current, item.id]));
  };

  const unequip = (item: ApdItem) => {
    if (confirmed) return;
    playClick();
    setPlaced((current) => current.filter((id) => id !== item.id));
  };

  // Mobile has no sockets to aim at (six 44px targets will not fit on a
  // 67-CSS-px-wide analyst), so the grid cell itself is the control and a tap
  // puts the item on or takes it off.
  const toggleItem = (item: ApdItem) => {
    if (confirmed) return;
    if (placed.includes(item.id)) {
      unequip(item);
      return;
    }
    playClick();
    setPlaced((current) => [...current, item.id]);
  };

  const handleItemClick = (item: ApdItem) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (confirmed) return;
    if (isMobile) {
      toggleItem(item);
      return;
    }
    if (placed.includes(item.id)) {
      unequip(item);
      return;
    }
    playClick();
    setHeld((current) => (current === item.id ? null : item.id));
  };

  const handleItemPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, item: ApdItem) => {
    if (isMobile || confirmed || placed.includes(item.id) || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOriginRef.current = { x: event.clientX, y: event.clientY, moved: false };
    setDrag({ id: item.id, x: event.clientX, y: event.clientY });
  };

  const handleItemPointerMove = (event: ReactPointerEvent<HTMLButtonElement>, item: ApdItem) => {
    const origin = dragOriginRef.current;
    if (!origin || drag?.id !== item.id) return;
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > DRAG_THRESHOLD_PX) origin.moved = true;
    setDrag({ id: item.id, x: event.clientX, y: event.clientY });
  };

  const handleItemPointerUp = (event: ReactPointerEvent<HTMLButtonElement>, item: ApdItem) => {
    const origin = dragOriginRef.current;
    dragOriginRef.current = null;
    setDrag(null);
    if (!origin || !origin.moved || step.kind !== 'equip') return;
    // A real drag never also counts as a click on the tile it started from.
    suppressClickRef.current = true;
    const target = socketAt(socketsRef.current, step.items, event.clientX, event.clientY);
    if (target) equip(item, target);
  };

  // A cancelled pointer (browser gesture, lost capture) must not leave a ghost
  // stuck to the cursor with no way to drop it.
  const handleItemPointerCancel = () => {
    dragOriginRef.current = null;
    setDrag(null);
  };

  const handleConfirm = () => {
    if (step.kind !== 'equip' || placed.length < step.items.length || confirmed) return;
    playClick();
    setHeld(null);
    setConfirmed(true);
    if (prefersReducedMotion()) {
      setShowNote(true);
      return;
    }
    after(SETTLE_MS, () => setShowNote(true));
  };

  // Advances through PROCEDURE_STEPS in place; only the last authored step
  // falls through to Missions rather than dead-ending on an empty workspace.
  const handleContinue = () => {
    if (PROCEDURE_STEPS[stepIndex + 1]) {
      playClick();
      setShowNote(false);
      setDoneCount(0);
      setPlaced([]);
      setHeld(null);
      setConfirmed(false);
      setCorrection(null);
      setStepIndex(stepIndex + 1);
      return;
    }
    leaveTo(goBack);
  };

  const anim = (step_: number) => ({
    className: exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in',
    delay: exiting ? exitDelay(step_) : enterDelay(step_),
  });

  const background =
    step.kind === 'sequence'
      ? doneCount === 0
        ? step.initialBackground
        : step.actions[doneCount - 1].background
      : confirmed
        ? step.completedBackground
        : step.initialBackground;
  const backgroundAlt =
    step.kind === 'equip' && confirmed ? step.completedBackgroundAlt : step.initialBackgroundAlt;

  const heldItem = step.kind === 'equip' ? (step.items.find((item) => item.id === held) ?? null) : null;
  const dragItem = step.kind === 'equip' ? (step.items.find((item) => item.id === drag?.id) ?? null) : null;

  return (
    <Stage
      background={
        // Blurred bleed only - the crisp, aligned copy lives in the safe layer
        // below. Hidden entirely on a 16:9 viewport.
        <img
          src={background}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(28px) brightness(0.92)',
            transform: 'scale(1.06)',
          }}
        />
      }
    >
      <img
        src={background}
        alt={backgroundAlt}
        style={{ position: 'absolute', ...rectStyle(step.backgroundRect), objectFit: 'cover' }}
      />

      {step.kind === 'sequence' ? (
        <>
          {/* The soap bottle is its own Figma layer (60:303); the background
              frames never contain it, so it rides on top of whichever frame is
              live. */}
          <img
            src={SOAP_ART.src}
            alt=""
            aria-hidden="true"
            style={{ position: 'absolute', ...rectStyle(SOAP_ART.rect) }}
          />

          {step.actions.map((action) => (
            <Hotspot
              key={action.id}
              action={action}
              active={!exiting && action.order === doneCount + 1}
              done={action.order <= doneCount}
              onSelect={() => handleAction(action)}
            />
          ))}

          {step.actions
            // Progressive reveal: a pill appears when its action becomes the
            // next one, and stays (dimmed, trail off) once done, so the
            // finished order is still readable at the end of the step.
            .filter((action) => action.order <= doneCount + 1)
            .map((action) => (
              <HelperPill key={action.id} action={action} done={action.order <= doneCount} />
            ))}
        </>
      ) : null}

      {step.kind === 'equip' && !isMobile && !confirmed && !exiting
        ? step.items.map((item) => (
            <ApdSocket
              key={item.id}
              item={item}
              filled={placed.includes(item.id)}
              armed={held !== null || drag !== null}
              registerRef={(element) => {
                if (element) socketsRef.current.set(item.id, element);
                else socketsRef.current.delete(item.id);
              }}
              onSelect={() => {
                if (placed.includes(item.id)) {
                  unequip(item);
                  return;
                }
                if (heldItem) equip(heldItem, item);
              }}
            />
          ))
        : null}

      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_BAND_HEIGHT,
          background: COLOR.band,
          borderBottom: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
          display: 'flex',
          alignItems: 'center',
          // Above the pills (3): once a floored font widens a pill on a small
          // viewport it can reach the chrome, and the chrome has to win.
          zIndex: 5,
        }}
      >
        {/* Normal flow rather than two ink boxes: the pair has to stay centred
            in a band whose height is floored on small viewports, and the two
            floored font sizes have to push each other apart instead of
            overlapping at fixed offsets. */}
        <div
          className={anim(0).className}
          style={{
            marginLeft: HEADER_TEXT_LEFT,
            display: 'flex',
            flexDirection: 'column',
            gap: S(HEADER_TEXT_GAP),
            whiteSpace: 'nowrap',
            animationDelay: `${anim(0).delay}ms`,
          }}
        >
          <h1 style={{ ...textBase, fontSize: T(38, 15), fontWeight: 800, color: COLOR.navy }}>TEKNIK KERJA ASEPTIK</h1>
          <p style={{ ...textBase, fontSize: T(25, 10), fontWeight: 500, color: COLOR.navy }}>
            Lakukan prosedur dengan urutan yang benar
          </p>
        </div>
      </header>

      <IconButton
        src={homeBtnUrl}
        alt="Menu Utama"
        label="Menu Utama"
        top={TOP_BAR_TOP}
        left={HOME_LEFT}
        size={ICON_SIZE}
        animationClassName={anim(0).className}
        animationDelayMs={anim(0).delay}
        zIndex={6}
        onClick={() => leaveTo(() => goTo('splash'))}
      />
      <IconButton
        src={backBtnUrl}
        alt="Kembali"
        label="Kembali"
        top={TOP_BAR_TOP}
        left={BACK_LEFT}
        size={ICON_SIZE}
        animationClassName={anim(0).className}
        animationDelayMs={anim(0).delay}
        zIndex={6}
        onClick={() => leaveTo(goBack)}
      />
      <IconButton
        src={audioOn ? bgmOnBtnUrl : bgmOffBtnUrl}
        alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        top={TOP_BAR_TOP}
        left={SOUND_LEFT}
        size={ICON_SIZE}
        animationClassName={anim(0).className}
        animationDelayMs={anim(0).delay}
        zIndex={6}
        onClick={handleToggleSound}
      />

      <ProcedureCard step={step} showDots={!isMobile} animation={anim(1)} />

      {step.kind === 'sequence' ? (
        <HintCard step={step} animation={anim(2)} />
      ) : (
        <ApdCard
          step={step}
          placed={placed}
          held={held}
          dragging={drag?.id ?? null}
          correction={correction}
          confirmed={confirmed}
          isMobile={isMobile}
          animation={anim(2)}
          onItemClick={handleItemClick}
          onItemPointerDown={handleItemPointerDown}
          onItemPointerMove={handleItemPointerMove}
          onItemPointerUp={handleItemPointerUp}
          onItemPointerCancel={handleItemPointerCancel}
          onConfirm={handleConfirm}
        />
      )}

      {/* Follows the pointer while an item is being dragged. Rendered outside
          the card so it is not clipped by it, and inert so it never eats the
          pointerup that decides where the item lands. */}
      {drag && dragItem ? (
        <img
          src={dragItem.src}
          alt=""
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: drag.x,
            top: drag.y,
            width: S(dragItem.width),
            transform: 'translate(-50%, -50%) scale(1.08)',
            pointerEvents: 'none',
            zIndex: 20,
            filter: 'drop-shadow(0 0.4cqw 0.8cqw rgba(4, 72, 139, 0.35))',
          }}
        />
      ) : null}

      {showNote && !exiting ? <SuccessNote step={step} onContinue={handleContinue} /> : null}

      {/* Progress feedback has to reach a screen reader too, not only the art
          swapping underneath (TASKS.md > Aturan Lintas Screen, live region). */}
      <p aria-live="polite" style={srOnly}>
        {liveMessage(step, { doneCount, placed, confirmed, correction })}
      </p>
    </Stage>
  );
}

// Which socket, if any, is under a released pointer. Kept out of the component
// so the drop rule is one readable function: the socket you are actually over
// wins, and nothing else counts as a drop.
function socketAt(
  sockets: Map<string, HTMLElement>,
  items: ApdItem[],
  clientX: number,
  clientY: number,
): ApdItem | null {
  for (const item of items) {
    const element = sockets.get(item.id);
    if (!element) continue;
    const box = element.getBoundingClientRect();
    if (clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom) return item;
  }
  return null;
}

function liveMessage(
  step: ProcedureStep,
  state: { doneCount: number; placed: string[]; confirmed: boolean; correction: string | null },
): string {
  if (step.kind === 'sequence') {
    if (state.doneCount >= step.actions.length) return `${step.successTitle} ${step.successBody}`;
    const next = step.actions[state.doneCount];
    return `Tindakan ${state.doneCount} dari ${step.actions.length} selesai. Berikutnya: ${next.accessibleName}.`;
  }
  if (state.confirmed) return `${step.successTitle} ${step.successBody}`;
  if (state.correction) return state.correction;
  if (state.placed.length >= step.items.length) {
    return `Seluruh APD terpasang. Tekan ${step.confirmLabel} untuk melanjutkan.`;
  }
  return `${state.placed.length} dari ${step.items.length} APD terpasang.`;
}

// Shared type reset for the DOM copy: line-height 1 keeps a text box the same
// height as its font size, which is what makes the Figma ink boxes below line
// up without per-element nudging.
const textBase: CSSProperties = {
  margin: 0,
  lineHeight: 1,
  fontFamily: 'inherit',
};

function rectStyle(rect: Rect): CSSProperties {
  return { left: S(rect.x), top: S(rect.y), width: S(rect.width), height: S(rect.height) };
}

// The tracking card on the left (Figma group 60:139 / 62:682): a blue banner
// with the white body card overlapping it. The body is a flex column so a
// floored font pushes the card taller rather than spilling out of it.
function ProcedureCard({
  step,
  showDots,
  animation,
}: {
  step: ProcedureStep;
  showDots: boolean;
  animation: { className: string; delay: number };
}) {
  return (
    <div
      className={animation.className}
      style={{
        position: 'absolute',
        left: S(PROCEDURE_CARD.x),
        top: S(PROCEDURE_CARD.y),
        width: S(PROCEDURE_CARD.width),
        zIndex: 4,
        animationDelay: `${animation.delay}ms`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          minHeight: S(PROCEDURE_CARD.bannerHeight),
          background: COLOR.navy,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: S(22),
        }}
      >
        <span style={{ ...textBase, fontSize: T(37, 13), fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.01em' }}>
          PROSEDUR
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          marginTop: S(PROCEDURE_HEAD_HEIGHT),
          minHeight: S(PROCEDURE_BODY_MIN_HEIGHT),
          background: '#FFFFFF',
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: `${S(22.954)} ${S(20)} ${S(49.9)}`,
        }}
      >
        <span
          style={{
            ...textBase,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: S(COUNTER_PILL.width),
            minHeight: S(COUNTER_PILL.height),
            padding: `0 ${S(24)}`,
            borderRadius: 999,
            background: COLOR.pillBlue,
            color: '#FFFFFF',
            fontSize: T(25, 10),
            fontWeight: 700,
          }}
        >
          {`Langkah ${step.n} / ${TOTAL_STEPS}`}
        </span>

        {showDots ? <StepDots current={step.n} /> : null}

        <Rule marginTop={showDots ? 25.944 : 24} />

        <span style={{ ...textBase, marginTop: S(26), fontSize: T(24, 10), fontWeight: 700, color: COLOR.pillBlue }}>
          {step.eyebrow}
        </span>
        <span style={{ ...textBase, marginTop: S(8), fontSize: T(37, 14), fontWeight: 800, color: COLOR.navy }}>
          {step.title}
        </span>

        <Rule marginTop={25} />

        <span
          style={{
            ...textBase,
            marginTop: S(34),
            maxWidth: S(345),
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(20, 9),
            fontWeight: 500,
            color: COLOR.body,
          }}
        >
          {step.description}
        </span>
      </div>
    </div>
  );
}

function Rule({ marginTop }: { marginTop: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        marginTop: S(marginTop),
        width: S(RULE_WIDTH),
        maxWidth: '100%',
        height: 'max(1px, 0.078cqw)',
        background: COLOR.divider,
        flex: 'none',
      }}
    />
  );
}

// The 12 step markers (Figma group 60:249). Decorative: the same "Langkah N /
// 12" fact is already in the pill above as real text, which is why the row can
// be dropped wholesale below the mobile breakpoint - at 568px wide each dot
// would be ~8.8 CSS px, too small to read the number inside it.
function StepDots({ current }: { current: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        marginTop: S(18.796),
        display: 'flex',
        gap: S(DOT_GAP),
        width: S(RULE_WIDTH),
        justifyContent: 'space-between',
      }}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const n = index + 1;
        const active = n === current;
        return (
          <span
            key={n}
            style={{
              ...textBase,
              width: S(DOT_SIZE),
              height: S(DOT_SIZE),
              flex: 'none',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: active ? COLOR.navy : COLOR.dotIdleFill,
              border: active ? 'none' : `max(1px, 0.078cqw) solid ${COLOR.dotIdleRing}`,
              color: active ? '#FFFFFF' : COLOR.dotIdleText,
              fontSize: T(20, 7),
              fontWeight: 700,
            }}
          >
            {n}
          </span>
        );
      })}
    </span>
  );
}

// The blue tab hung over the top edge of either floating card.
function FloatingTab({ label, dx }: { label: string; dx: number }) {
  return (
    <span
      style={{
        ...textBase,
        position: 'absolute',
        top: 0,
        left: S(dx),
        minWidth: S(FLOATING_TAB.width),
        minHeight: S(FLOATING_TAB.height),
        padding: `0 ${S(24)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        background: COLOR.pillBlue,
        color: '#FFFFFF',
        fontSize: T(25, 10),
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

// Langkah 1's floating card (Figma group 60:304): a blue tab overlapping the
// top edge of a bordered white card holding one line of instruction.
function HintCard({ step, animation }: { step: SequenceStep; animation: { className: string; delay: number } }) {
  return (
    <div
      className={animation.className}
      style={{
        position: 'absolute',
        left: S(HINT_CARD.x),
        top: S(HINT_CARD.y),
        width: S(HINT_CARD.width),
        zIndex: 4,
        animationDelay: `${animation.delay}ms`,
      }}
    >
      <div
        style={{
          marginTop: S(HINT_BODY.dy),
          minHeight: S(HINT_BODY.minHeight),
          background: '#FFFFFF',
          border: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${S(34)} ${S(18)} ${S(18)}`,
        }}
      >
        <span
          style={{
            ...textBase,
            maxWidth: S(HINT_BODY.textWidth + 45),
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(20, 9),
            fontWeight: 500,
            color: COLOR.navy,
          }}
        >
          {step.hint}
        </span>
      </div>

      <FloatingTab label={step.eyebrow} dx={HINT_PILL.dx} />
    </div>
  );
}

// Langkah 2's floating card (Figma group 62:799): the same tab and white card,
// carrying the 3x2 APD grid and the Selesai button.
//
// The Figma frame drives this purely as a checklist - tick six boxes, press
// Selesai. That flow survives here as the mobile path and as the confirm step,
// but on a viewport wide enough to aim at (>=1024px) the grid is also the
// source of a drag: each item has to be carried to the matching socket on the
// analyst, so the Analyst has to know *where* each item goes, not only that it
// exists. The two paths share one state, one Selesai button and one outcome.
function ApdCard({
  step,
  placed,
  held,
  dragging,
  correction,
  confirmed,
  isMobile,
  animation,
  onItemClick,
  onItemPointerDown,
  onItemPointerMove,
  onItemPointerUp,
  onItemPointerCancel,
  onConfirm,
}: {
  step: EquipStep;
  placed: string[];
  held: string | null;
  dragging: string | null;
  correction: string | null;
  confirmed: boolean;
  isMobile: boolean;
  animation: { className: string; delay: number };
  onItemClick: (item: ApdItem) => void;
  onItemPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, item: ApdItem) => void;
  onItemPointerMove: (event: ReactPointerEvent<HTMLButtonElement>, item: ApdItem) => void;
  onItemPointerUp: (event: ReactPointerEvent<HTMLButtonElement>, item: ApdItem) => void;
  onItemPointerCancel: () => void;
  onConfirm: () => void;
}) {
  const complete = placed.length >= step.items.length;
  const cells = [...step.items].sort((a, b) => a.row - b.row || a.col - b.col);

  return (
    <div
      className={animation.className}
      style={{
        position: 'absolute',
        left: S(APD_CARD.x),
        top: S(FLOATING_TAB.y),
        width: S(APD_CARD.width),
        zIndex: 4,
        animationDelay: `${animation.delay}ms`,
      }}
    >
      <div
        style={{
          marginTop: S(APD_CARD.y - FLOATING_TAB.y),
          minHeight: S(APD_CARD.minHeight),
          background: '#FFFFFF',
          border: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: `${S(APD_PROMPT_DY)} ${S(16)} ${S(APD_CARD_PAD_BOTTOM)}`,
        }}
      >
        <span
          style={{
            ...textBase,
            textAlign: 'center',
            fontSize: T(19, 9),
            fontWeight: 600,
            color: COLOR.navy,
          }}
        >
          {step.prompt}
        </span>

        <div
          style={{
            marginTop: S(APD_GRID.y - (APD_PROMPT_DY + APD_CARD.y) - 19),
            width: S(APD_GRID.width),
            maxWidth: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            rowGap: S(APD_GRID.rowGap),
          }}
        >
          {cells.map((item) => (
            <ApdCell
              key={item.id}
              item={item}
              placed={placed.includes(item.id)}
              held={held === item.id}
              dragging={dragging === item.id}
              confirmed={confirmed}
              isMobile={isMobile}
              onClick={() => onItemClick(item)}
              onPointerDown={(event) => onItemPointerDown(event, item)}
              onPointerMove={(event) => onItemPointerMove(event, item)}
              onPointerUp={(event) => onItemPointerUp(event, item)}
              onPointerCancel={onItemPointerCancel}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onConfirm}
          disabled={!complete || confirmed}
          style={{
            ...textBase,
            marginTop: S(APD_CONFIRM.dy),
            minWidth: `max(88px, ${S(APD_CONFIRM.minWidth)})`,
            minHeight: `max(44px, ${S(APD_CONFIRM.height)})`,
            padding: `0 ${S(20)}`,
            borderRadius: 999,
            border: 'none',
            background: complete && !confirmed ? COLOR.pillBlue : COLOR.divider,
            color: '#FFFFFF',
            fontSize: T(25, 11),
            fontWeight: 700,
            cursor: complete && !confirmed ? 'pointer' : 'default',
            transition: 'background 180ms ease-out',
          }}
        >
          {step.confirmLabel}
        </button>

        {/* Reserved in flow rather than overlaid: the correction has to be able
            to appear without shifting the grid it is explaining. Announced
            through the Screen's own live region, so it is hidden from the
            accessibility tree here to avoid saying it twice. */}
        <span
          aria-hidden="true"
          className={correction ? 'sterilab-nudge' : undefined}
          style={{
            ...textBase,
            marginTop: S(12),
            minHeight: T(17, 9),
            maxWidth: S(APD_GRID.width),
            textAlign: 'center',
            lineHeight: 1.3,
            fontSize: T(17, 9),
            fontWeight: 600,
            color: COLOR.correction,
            opacity: correction ? 1 : 0,
            transition: 'opacity 180ms ease-out',
          }}
        >
          {correction ?? ''}
        </span>
      </div>

      <FloatingTab label={step.eyebrow} dx={APD_PILL_DX} />
    </div>
  );
}

// One cell of the APD grid. Row 0 stacks the checkbox above the art and row 1
// below it, mirroring the Figma frame; `column-reverse` keeps the DOM order
// (checkbox, then art) identical in both so a screen reader reads them the
// same way round.
function ApdCell({
  item,
  placed,
  held,
  dragging,
  confirmed,
  isMobile,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  item: ApdItem;
  placed: boolean;
  held: boolean;
  dragging: boolean;
  confirmed: boolean;
  isMobile: boolean;
  onClick: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: () => void;
}) {
  const artHeight = item.row === 0 ? APD_GRID.row0ArtHeight : APD_GRID.row1ArtHeight;
  const label = placed
    ? `${item.name} sudah terpasang di ${item.bodyPart.toLowerCase()}`
    : isMobile
      ? `${item.name}, pasang pada ${item.bodyPart.toLowerCase()}`
      : `${item.name}, seret ke ${item.bodyPart.toLowerCase()} analis`;

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      disabled={confirmed}
      aria-pressed={placed || held}
      aria-label={label}
      style={{
        display: 'flex',
        flexDirection: item.row === 0 ? 'column' : 'column-reverse',
        alignItems: 'center',
        gap: S(item.row === 0 ? APD_GRID.row0Gap : APD_GRID.row1Gap),
        minWidth: 44,
        minHeight: 44,
        padding: 0,
        border: 'none',
        borderRadius: S(14),
        background: held ? 'rgba(52, 113, 199, 0.12)' : 'transparent',
        cursor: confirmed ? 'default' : placed ? 'pointer' : isMobile ? 'pointer' : 'grab',
        // The art follows the pointer instead; leaving the tile's own copy up
        // would read as two of the same item.
        opacity: dragging ? 0.35 : 1,
        touchAction: 'none',
        transition: 'background 160ms ease-out, opacity 160ms ease-out',
      }}
    >
      <img
        src={placed ? checkboxCheckedUrl : checkboxUncheckedUrl}
        alt=""
        aria-hidden="true"
        style={{
          width: `max(12px, ${S(APD_GRID.checkbox)})`,
          height: `max(12px, ${S(APD_GRID.checkbox)})`,
          flex: 'none',
        }}
      />
      <span
        style={{
          height: `max(30px, ${S(artHeight)})`,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={item.src}
          alt=""
          aria-hidden="true"
          style={{
            width: `min(${S(item.width)}, 100%)`,
            height: 'auto',
            // Placed items stay legible in the grid but read as spent.
            opacity: placed ? 0.4 : 1,
            transition: 'opacity 200ms ease-out',
            pointerEvents: 'none',
          }}
        />
      </span>
    </button>
  );
}

// A drop target on the analyst. Unlabelled on purpose - knowing that goggles
// go over the eyes and not over the mouth is the thing Langkah 2 is teaching -
// but its accessible name spells the body part out, so the keyboard/screen
// reader path is not a guessing game.
function ApdSocket({
  item,
  filled,
  armed,
  registerRef,
  onSelect,
}: {
  item: ApdItem;
  filled: boolean;
  armed: boolean;
  registerRef: (element: HTMLElement | null) => void;
  onSelect: () => void;
}) {
  const leader = item.anchor
    ? {
        length: Math.hypot(item.anchor.x - item.socket.x, item.anchor.y - item.socket.y),
        angle: (Math.atan2(item.anchor.y - item.socket.y, item.anchor.x - item.socket.x) * 180) / Math.PI,
      }
    : null;

  return (
    <>
      {/* Wajah has to clear the jaw to keep 84 design px from Mata, so it ends
          up beside the face rather than on the mouth. The hairline and the dot
          at its end are what say "this spot", not the circle's own position. */}
      {leader ? (
        <>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: S(item.socket.x),
              top: S(item.socket.y),
              width: S(leader.length),
              height: 'max(2px, 0.13cqw)',
              background: 'rgba(4, 72, 139, 0.7)',
              transformOrigin: '0 50%',
              transform: `translateY(-50%) rotate(${leader.angle}deg)`,
              zIndex: 2,
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: S(item.anchor!.x),
              top: S(item.anchor!.y),
              width: `max(6px, ${S(12)})`,
              height: `max(6px, ${S(12)})`,
              borderRadius: '50%',
              background: COLOR.navy,
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}
          />
        </>
      ) : null}

      <button
        type="button"
        ref={registerRef}
        onClick={onSelect}
        disabled={!armed && !filled}
        aria-label={
          filled
            ? `${item.name} terpasang di ${item.bodyPart.toLowerCase()}. Lepas.`
            : `Pasang APD pada ${item.bodyPart.toLowerCase()} analis`
        }
        className={armed && !filled ? 'sterilab-hotspot-pulse' : undefined}
        style={{
          position: 'absolute',
          left: S(item.socket.x),
          top: S(item.socket.y),
          transform: 'translate(-50%, -50%)',
          width: `max(44px, ${S(SOCKET_SIZE)})`,
          height: `max(44px, ${S(SOCKET_SIZE)})`,
          zIndex: 3,
          padding: 0,
          borderRadius: '50%',
          border: filled
            ? `max(2px, 0.156cqw) solid ${COLOR.successGreen}`
            : `max(2px, 0.156cqw) dashed ${COLOR.navy}`,
          background: filled ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.34)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: armed || filled ? 'pointer' : 'default',
          transition: 'background 160ms ease-out, border-color 160ms ease-out',
        }}
      >
        {filled ? (
          <img
            src={item.src}
            alt=""
            aria-hidden="true"
            style={{ width: '68%', height: 'auto', pointerEvents: 'none' }}
          />
        ) : null}
      </button>
    </>
  );
}

// One instruction pill (Figma groups 60:384 / 60:401 / 60:419). Positioned by
// its Figma centre rather than its top-left corner: the label sizes the pill,
// so a floored font on a small viewport grows it outwards from the object it
// points at instead of shifting off it.
function HelperPill({ action, done }: { action: StepAction; done: boolean }) {
  const center = { x: action.pill.x + action.pill.width / 2, y: action.pill.y + action.pill.height / 2 };

  return (
    <div
      style={{
        position: 'absolute',
        left: S(center.x),
        top: S(center.y),
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      <div className="sterilab-bubble-in" style={{ opacity: done ? 0.55 : 1, transition: 'opacity 260ms ease-out' }}>
        {/* Wrapper is the border trail: transparent, clipped to a pill, with a
            conic sweep spinning inside. Its padding is the visible ring. */}
        <div
          className={done ? undefined : 'sterilab-trail'}
          style={{ padding: S(5), borderRadius: 999, position: 'relative' }}
        >
          <span
            style={{
              ...textBase,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: S(action.pill.width - 10),
              minHeight: S(action.pill.height - 10),
              padding: `0 ${S(26)}`,
              whiteSpace: 'nowrap',
              borderRadius: 999,
              background: '#FFFFFF',
              border: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
              color: COLOR.navy,
              fontSize: T(23, 11),
              fontWeight: 700,
            }}
          >
            {action.pillLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

// A clickable object in the workspace. Transparent over the art, so the only
// affordance is the pulsing ring - and the hit area is floored to 44x44 so it
// stays a legal touch target on a 568px-wide viewport.
function Hotspot({
  action,
  active,
  done,
  onSelect,
}: {
  action: StepAction;
  active: boolean;
  done: boolean;
  onSelect: () => void;
}) {
  const center = { x: action.hotspot.x + action.hotspot.width / 2, y: action.hotspot.y + action.hotspot.height / 2 };

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!active}
      aria-label={done ? `${action.accessibleName} - selesai` : action.accessibleName}
      className={active ? 'sterilab-hotspot-pulse' : undefined}
      style={{
        position: 'absolute',
        left: S(center.x),
        top: S(center.y),
        transform: 'translate(-50%, -50%)',
        width: `max(44px, ${S(action.hotspot.width)})`,
        height: `max(44px, ${S(action.hotspot.height)})`,
        zIndex: 2,
        padding: 0,
        border: active ? `max(2px, 0.156cqw) solid rgba(52, 113, 199, 0.6)` : 'none',
        borderRadius: S(18),
        background: active ? 'rgba(109, 215, 253, 0.1)' : 'transparent',
        cursor: active ? 'pointer' : 'default',
        transition: 'background 160ms ease-out',
      }}
      onPointerOver={(e) => {
        if (active) e.currentTarget.style.background = 'rgba(109, 215, 253, 0.3)';
      }}
      onPointerOut={(e) => {
        if (active) e.currentTarget.style.background = 'rgba(109, 215, 253, 0.1)';
      }}
    />
  );
}

// The note card (Figma groups 60:438 / 62:854). Rises in from below the stage
// edge once the step is complete - reuses the same keyframes as the Missions
// note card rather than adding a second rise/fall pair.
function SuccessNote({ step, onContinue }: { step: ProcedureStep; onContinue: () => void }) {
  return (
    <div
      className="sterilab-rise-in-fade"
      role="group"
      aria-label={step.successTitle}
      style={{
        position: 'absolute',
        left: S(NOTE_CARD.x),
        bottom: S(NOTE_CARD.bottom),
        width: S(NOTE_CARD.width),
        minHeight: S(NOTE_CARD.minHeight),
        zIndex: 6,
        background: '#FFFFFF',
        border: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
        borderRadius: S(CARD_RADIUS),
        boxShadow: CARD_SHADOW,
        display: 'flex',
        alignItems: 'center',
        gap: S(18),
        padding: `${S(14)} ${S(26)} ${S(14)} ${S(NOTE_CHECK.dx)}`,
      }}
    >
      <img
        src={checkSuccessUrl}
        alt=""
        aria-hidden="true"
        style={{ width: S(NOTE_CHECK.size), height: S(NOTE_CHECK.size), flex: 'none' }}
      />

      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: S(9),
          flex: 1,
          // Figma puts the copy at x=683.332 - the gap left over once the icon
          // (at x=594.016, 71.72 wide) and the card's own left padding are
          // accounted for.
          marginLeft: S(NOTE_TEXT.dx - NOTE_CHECK.dx - NOTE_CHECK.size - 18),
        }}
      >
        <span style={{ ...textBase, fontSize: T(24, 11), fontWeight: 800, color: COLOR.successGreen }}>
          {step.successTitle}
        </span>
        <span style={{ ...textBase, fontSize: T(19, 9), fontWeight: 500, color: COLOR.navy }}>{step.successBody}</span>
      </span>

      <ContinueButton onClick={onContinue} />
    </div>
  );
}


function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Lanjut ke langkah berikutnya"
      style={{
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: S(14),
        minWidth: `max(88px, ${S(NOTE_CTA.minWidth)})`,
        minHeight: `max(44px, ${S(NOTE_CTA.height)})`,
        padding: `0 ${S(22)}`,
        borderRadius: 999,
        border: `${T(HAIRLINE, 1)} solid ${COLOR.ctaBlueEdge}`,
        background: COLOR.ctaBlue,
        boxShadow: `${S(3)} ${S(4)} 0 ${COLOR.ctaShadow}`,
        color: '#FFFFFF',
        fontFamily: 'inherit',
        fontSize: T(26, 12),
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        transition: 'transform 120ms ease-out, filter 120ms ease-out',
      }}
      onPointerOver={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
      onPointerOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onPointerDown={(e) => (e.currentTarget.style.filter = 'brightness(0.93)')}
      onPointerUp={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
    >
      LANJUT
      <img src={arrowRightUrl} alt="" aria-hidden="true" style={{ width: S(30), height: S(17), display: 'block' }} />
    </button>
  );
}
