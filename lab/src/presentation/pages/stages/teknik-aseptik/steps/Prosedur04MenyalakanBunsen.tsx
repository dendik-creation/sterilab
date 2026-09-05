import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, MutableRefObject, PointerEvent as ReactPointerEvent } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { BunsenCap, BunsenFrame, BunsenStep, FlamePatch, Rect } from '../../../../../data/stages/teknikAseptik';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 4 - "Menyalakan Bunsen" (Figma frame 61:542 "LANGKAH 4 NEW"). Click
// the tube to light the burner, wait for the flame to settle into a steady
// blue-yellow, then cap it once the work is done.
//
// The step's whole interaction is drawn, not composited. BG_LANGKAH_5 ships two
// plates - analyst holding a lit match over a dark wick, and analyst giving a
// thumbs up over a burning lamp - and nothing else: no flame layer, no cap
// sprite. So the flame is an SVG anchored to the plate's own wick, and it is
// the flame, not the artwork, that grows through the three stages the copy
// promises ("hingga menyala stabil").
//
// The lit plate's flame *is* painted in, and a raster cannot be blown out. That
// is why the cap is sized the way it is in the data: putting the burner out
// means covering the painted flame with the cap, which is exactly what capping
// a spirit lamp does. Nothing here relies on the two plates lining up - each
// reads its own burner rect - because they do not (the lamp shifts 11 design px
// between them).
//
// Two ways in, like Langkah 3: drag the cap out of the card onto the burner, or
// activate the burner control itself. The second is the keyboard/tap path, so
// the step is completable with Enter alone.

// Langkah 4's floating card (Figma group 231:1064): same x and width as every
// other procedure's, and the design's own body is short - one paragraph. Ours
// carries the cap under it, so the body grows from a minimum rather than being
// fixed to the frame's 199.
const CARD = { x: 1428.649, y: 221.17, width: 443.377 };
const CARD_TAB_DX = 106.668;
const CARD_BODY_DY = 16.875;
const CARD_BODY_MIN_HEIGHT = 199.5;
const CARD_TEXT_WIDTH = 346.081;
const CARD_GAP = 22;
const PANEL = { width: 240.352, height: 168 };

// How long the cap takes to travel from the Analyst's hand to the burner, and
// the beat after that before the note card starts rising - the flame has to be
// visibly out before the Analyst reads that the step is done.
const CAP_MS = 520;
const SETTLE_MS = 620;
const CORRECTION_MS = 3200;
// Pointer travel that separates a drag of the cap from a plain press on it.
const DRAG_THRESHOLD_PX = 6;

// unlit -> igniting (flame growing) -> stable (steady flame, cap unlocked) ->
// capping (cap travelling) -> done.
type Phase = 'unlit' | 'igniting' | 'stable' | 'capping' | 'done';

interface DragState {
  x: number;
  y: number;
  // Touch and pen lift the cap clear of the finger; a mouse cursor is small
  // enough to keep it centred.
  coarse: boolean;
  moved: boolean;
}

export function Prosedur04MenyalakanBunsen({ step, runtime }: ProcedureProps<BunsenStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [phase, setPhase] = useState<Phase>('unlit');
  // Which of the three flame sizes is live. Only meaningful once the burner is
  // lit; it stops at the last stage, which is what "stable" means.
  const [stageIndex, setStageIndex] = useState(0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [overTube, setOverTube] = useState(false);
  const [correction, setCorrection] = useState<string | null>(null);
  const tubeRef = useRef<HTMLButtonElement | null>(null);
  const tubeBoxRef = useRef<DOMRect | null>(null);
  const suppressClickRef = useRef(false);
  const correctionTimerRef = useRef(0);
  const after = useTimeouts();

  // The unlit plate is the workspace until the flame is steady; the lit plate
  // lands on the same beat the flame stops growing, so the room confirms the
  // wait rather than the overlay having to.
  const frame: BunsenFrame = phase === 'unlit' || phase === 'igniting' ? step.frames[0] : step.frames[1];
  const flame = step.flameStages[stageIndex];
  const canIgnite = !exiting && phase === 'unlit';
  const canCap = !exiting && phase === 'stable';

  // Layout, not passive: swapping to the lit plate is the feedback for the
  // flame settling, so it has to land in the same commit as the flame's own
  // size change rather than a paint later.
  useLayoutEffect(() => {
    setFrame({ src: frame.src, alt: frame.alt, rect: step.backgroundRect });
  }, [setFrame, frame.src, frame.alt, step.backgroundRect]);

  useEffect(() => () => window.clearTimeout(correctionTimerRef.current), []);

  useEffect(() => {
    if (phase === 'capping' || phase === 'done') {
      setMessage(`Api bunsen dipadamkan dengan penutup. ${step.successTitle} ${step.successBody}`);
      return;
    }
    if (correction) {
      setMessage(correction);
      return;
    }
    if (phase === 'unlit') {
      setMessage('Bunsen spirtus belum menyala. Klik tabung bunsen untuk menyalakannya.');
      return;
    }
    setMessage(flame.message);
  }, [setMessage, phase, correction, flame.message, step.successTitle, step.successBody]);

  // Fires once, on the commit that finishes the capping animation.
  const doneRef = useRef(false);
  useEffect(() => {
    if (phase !== 'done' || doneRef.current) return;
    doneRef.current = true;
    if (prefersReducedMotion()) {
      complete();
      return;
    }
    after(SETTLE_MS, complete);
  }, [phase, complete, after]);

  const showCorrection = useCallback((message: string) => {
    setCorrection(message);
    window.clearTimeout(correctionTimerRef.current);
    correctionTimerRef.current = window.setTimeout(() => setCorrection(null), CORRECTION_MS);
  }, []);

  const ignite = () => {
    if (!canIgnite) return;
    playClick();
    setCorrection(null);
    // With motion reduced there is nothing to watch grow, so the wait would be
    // a plain delay: the flame arrives steady and the lit plate with it.
    if (prefersReducedMotion()) {
      setStageIndex(step.flameStages.length - 1);
      setPhase('stable');
      return;
    }
    setPhase('igniting');
    setStageIndex(0);
    after(step.flameStages[0].holdMs, () => setStageIndex(1));
    after(step.flameStages[0].holdMs + step.flameStages[1].holdMs, () => {
      setStageIndex(2);
      setPhase('stable');
    });
  };

  const cap = () => {
    if (!canCap) return;
    playClick();
    setCorrection(null);
    if (prefersReducedMotion()) {
      setPhase('done');
      return;
    }
    setPhase('capping');
    after(CAP_MS, () => setPhase('done'));
  };

  const handleTubeClick = () => {
    // A drag that started on the cap tile and ended on the burner already
    // capped it; the click that follows the release must not count twice.
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (phase === 'unlit') ignite();
    else if (phase === 'stable') cap();
  };

  // The burner's box, measured once per drag. Nothing moves it mid-drag - the
  // plate only advances when the flame settles, which cannot happen while the
  // cap is being carried - so one read per press is enough.
  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!canCap || !event.isPrimary) return;
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    tubeBoxRef.current = tubeRef.current?.getBoundingClientRect() ?? null;
    setDrag({ x: event.clientX, y: event.clientY, coarse: event.pointerType !== 'mouse', moved: false });
  };

  const overTubeAt = (clientX: number, clientY: number): boolean => {
    const box = tubeBoxRef.current;
    if (!box) return false;
    return clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom;
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    setDrag((current) => {
      if (!current) return current;
      const moved =
        current.moved ||
        Math.abs(event.clientX - current.x) > DRAG_THRESHOLD_PX ||
        Math.abs(event.clientY - current.y) > DRAG_THRESHOLD_PX;
      return { x: event.clientX, y: event.clientY, coarse: event.pointerType !== 'mouse', moved };
    });
    setOverTube(overTubeAt(event.clientX, event.clientY));
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = drag;
    setDrag(null);
    setOverTube(false);
    if (!current) return;
    if (overTubeAt(event.clientX, event.clientY)) {
      suppressClickRef.current = true;
      cap();
      return;
    }
    // A press that never went anywhere is not a miss - it is someone tapping
    // the tile to find out what it is, and the tile's own name answers that.
    if (current.moved) showCorrection(step.offTargetCorrection);
  };

  const cancelDrag = () => {
    setDrag(null);
    setOverTube(false);
  };

  return (
    <>
      <Burner
        step={step}
        frame={frame}
        phase={phase}
        flameWidth={flame.width}
        flameHeight={flame.height}
        armed={canIgnite || canCap}
        highlighted={overTube}
        tubeRef={tubeRef}
        onSelect={handleTubeClick}
        onPointerUp={endDrag}
      />

      <BunsenCard
        step={step}
        unlocked={canCap}
        held={drag !== null}
        correction={correction}
        animation={runtime.cardAnimation}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
      />

      {/* Follows the pointer for the length of the drag. Rendered outside both
          the card and the burner so nothing clips it, and inert so it never
          eats the move events that decide where it is being dropped. */}
      {drag ? <CapGhost cap={step.cap} drag={drag} /> : null}
    </>
  );
}

// The burner: the flame standing on the wick, the cap once it has been used,
// and the control that does both. Everything is laid out inside the plate's own
// rects, so it moves with the art rather than with a percentage that happens to
// look right on one of the two.
function Burner({
  step,
  frame,
  phase,
  flameWidth,
  flameHeight,
  armed,
  highlighted,
  tubeRef,
  onSelect,
  onPointerUp,
}: {
  step: BunsenStep;
  frame: BunsenFrame;
  phase: Phase;
  flameWidth: number;
  flameHeight: number;
  armed: boolean;
  highlighted: boolean;
  tubeRef: MutableRefObject<HTMLButtonElement | null>;
  onSelect: () => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}) {
  const showFlame = phase === 'igniting' || phase === 'stable';
  const showCap = phase === 'capping' || phase === 'done';
  const label =
    phase === 'unlit'
      ? step.igniteName
      : phase === 'stable'
        ? step.extinguishName
        : phase === 'igniting'
          ? 'Api bunsen sedang menyala, tunggu sampai stabil'
          : 'Bunsen spirtus sudah dipadamkan';

  return (
    <>
      {showFlame ? (
        <Flame
          wick={frame.wick}
          width={flameWidth}
          height={flameHeight}
          steady={phase === 'stable'}
        />
      ) : null}

      {/* The half of the plate's own flame the cap does not reach. Painted in,
          so it has to be covered rather than faded - see FlamePatch in
          data/stages/teknikAseptik.ts. */}
      {showCap ? <PaintedFlamePatch src={step.frames[1].src} patch={step.flamePatch} /> : null}
      {showCap ? <RestingCap cap={step.cap} dropping={phase === 'capping'} /> : null}
      {showCap ? <Smoke rest={step.cap.rest} /> : null}

      <button
        type="button"
        ref={tubeRef}
        onClick={onSelect}
        onPointerUp={onPointerUp}
        disabled={!armed}
        aria-label={label}
        className={armed ? 'sterilab-hotspot-pulse' : undefined}
        style={{
          position: 'absolute',
          left: S(frame.tube.x + frame.tube.width / 2),
          top: S(frame.tube.y + frame.tube.height / 2),
          transform: 'translate(-50%, -50%)',
          width: `max(44px, ${S(frame.tube.width)})`,
          height: `max(44px, ${S(frame.tube.height)})`,
          zIndex: 3,
          padding: 0,
          border: armed ? `max(2px, 0.156cqw) solid rgba(52, 113, 199, 0.6)` : 'none',
          borderRadius: S(18),
          background: armed
            ? highlighted
              ? 'rgba(109, 215, 253, 0.34)'
              : 'rgba(109, 215, 253, 0.1)'
            : 'transparent',
          cursor: armed ? 'pointer' : 'default',
          // Without this a touch drag that ends on the burner scrolls the page
          // instead of dropping the cap.
          touchAction: 'none',
          transition: 'background 160ms ease-out',
        }}
        onPointerOver={(e) => {
          if (armed && !highlighted) e.currentTarget.style.background = 'rgba(109, 215, 253, 0.3)';
        }}
        onPointerOut={(e) => {
          if (armed && !highlighted) e.currentTarget.style.background = 'rgba(109, 215, 253, 0.1)';
        }}
      />
    </>
  );
}

// The flame, anchored by its base to the wick. Two elements: the outer one
// carries the anchor and the size (so growing it is a transition on width and
// height, not on a transform the flicker would overwrite), the inner one only
// flickers.
//
// Decorative: every fact it carries - lit, how far along, steady - is in the
// live region and in the burner control's own name.
function Flame({
  wick,
  width,
  height,
  steady,
}: {
  wick: { x: number; y: number };
  width: number;
  height: number;
  steady: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="bunsen-flame"
      data-steady={steady ? 'true' : 'false'}
      style={{
        position: 'absolute',
        left: S(wick.x),
        top: S(wick.y),
        width: S(width),
        height: S(height),
        transform: 'translate(-50%, -100%)',
        zIndex: 2,
        pointerEvents: 'none',
        transition: 'width 320ms ease-out, height 320ms ease-out',
      }}
    >
      <div
        className={steady ? 'sterilab-flame' : 'sterilab-flame-waver'}
        style={{ width: '100%', height: '100%', transformOrigin: '50% 100%' }}
      >
        <svg
          viewBox="0 0 64 152"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: '100%' }}
          focusable="false"
        >
          <defs>
            {/* Blue tip, yellow body, warm base - the palette the lit plate
                paints (sampled: #9FD7F8 at the tip, #FEE766 through the middle,
                #57C1F8 at the wick), so the drawn flame and the painted one
                read as the same fire. */}
            <linearGradient id="sterilab-flame-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9FD7F8" />
              <stop offset="14%" stopColor="#FFE694" />
              <stop offset="45%" stopColor="#FEC64A" />
              <stop offset="100%" stopColor="#FB8F1D" />
            </linearGradient>
            <linearGradient id="sterilab-flame-core" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BEEFFE" />
              <stop offset="100%" stopColor="#3C9CE8" />
            </linearGradient>
          </defs>
          {/* Opaque on purpose: on the lit plate this sits directly over the
              flame painted into the raster, and a translucent fill would show
              two flames at once. */}
          <path
            d="M32 2 C 41 34, 57 64, 57 96 C 57 129, 46 150, 32 150 C 18 150, 7 129, 7 96 C 7 64, 23 34, 32 2 Z"
            fill="url(#sterilab-flame-body)"
          />
          <path
            d="M32 62 C 39 86, 45 108, 43 125 C 41 141, 36 150, 32 150 C 28 150, 23 141, 21 125 C 19 108, 25 86, 32 62 Z"
            fill="url(#sterilab-flame-core)"
          />
          <ellipse cx="32" cy="130" rx="7" ry="15" fill="#E9F6FF" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}

// A strip of the analyst's coat, cut out of the lit plate itself and drawn over
// the flame that plate paints.
//
// Faded in over the cap's descent rather than cut in: the flame dimming as the
// cap comes down is what "smothered" looks like, where an instant swap would
// read as the fire vanishing a beat before anything reached it.
//
// One band stretched down the strip rather than several stacked copies: on a
// 568px-wide stage a design px is a third of a CSS px, and stacked bands round
// to leave hairline gaps between them - which on this strip means specks of the
// flame showing through. The band is a flat piece of coat, so stretching it is
// invisible, and the blue seam running down it is vertical: it survives being
// scaled in y.
function PaintedFlamePatch({ src, patch }: { src: string; patch: FlamePatch }) {
  return (
    <div
      aria-hidden="true"
      data-testid="bunsen-flame-patch"
      className="sterilab-fade-in"
      style={{
        position: 'absolute',
        left: S(patch.rect.x),
        top: S(patch.rect.y),
        width: S(patch.rect.width),
        height: S(patch.rect.height),
        overflow: 'hidden',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: S(patch.donor.height),
          transform: `scaleY(${patch.rect.height / patch.donor.height})`,
          transformOrigin: '50% 0',
          // The plate at its own scale, offset so this window lands on the
          // donor band: the same columns as the strip, a few px higher up.
          backgroundImage: `url(${src})`,
          backgroundSize: `${S(1920)} ${S(1080)}`,
          backgroundPosition: `-${S(patch.rect.x)} -${S(patch.donor.y)}`,
        }}
      />
    </div>
  );
}

// The cap, once it has been brought to the burner: over the wick, rim on the
// collar, sized by the step's own `rest` rect.
function RestingCap({ cap, dropping }: { cap: BunsenCap; dropping: boolean }) {
  return (
    <div
      aria-hidden="true"
      data-testid="bunsen-cap-placed"
      className={dropping ? 'sterilab-cap-drop' : undefined}
      style={{
        position: 'absolute',
        left: S(cap.rest.x),
        top: S(cap.rest.y),
        width: S(cap.rest.width),
        height: S(cap.rest.height),
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <CapArt />
    </div>
  );
}

// The wisp left behind when the flame goes out. Short-lived and self-fading:
// it is the only thing that says the burner was burning a moment ago, since the
// cap hides the flame rather than the flame shrinking away.
function Smoke({ rest }: { rest: Rect }) {
  return (
    <div
      aria-hidden="true"
      className="sterilab-smoke"
      style={{
        position: 'absolute',
        left: S(rest.x + rest.width / 2),
        top: S(rest.y + 6),
        width: S(rest.width * 0.8),
        height: S(rest.height * 0.75),
        transform: 'translate(-50%, -100%)',
        transformOrigin: '50% 100%',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 40 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }} focusable="false">
        <g fill="#C9D4E2">
          <ellipse cx="20" cy="48" rx="8" ry="7" opacity="0.55" />
          <ellipse cx="16" cy="33" rx="7" ry="6" opacity="0.42" />
          <ellipse cx="23" cy="19" rx="6" ry="5" opacity="0.3" />
          <ellipse cx="18" cy="8" rx="4.5" ry="4" opacity="0.18" />
        </g>
      </svg>
    </div>
  );
}

// The cap riding the pointer while it is being carried to the burner.
function CapGhost({ cap, drag }: { cap: BunsenCap; drag: DragState }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: drag.x,
        top: drag.y,
        width: `max(32px, ${S(cap.rest.width)})`,
        height: `max(46px, ${S(cap.rest.height)})`,
        transform: `translate(-50%, ${drag.coarse ? '-115%' : '-50%'})`,
        filter: 'drop-shadow(0 0.4cqw 0.8cqw rgba(4, 72, 139, 0.35))',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <CapArt />
    </div>
  );
}

// The cap itself, drawn rather than exported: the step ships backgrounds only,
// and the cap has to be shown at three different sizes (card tile, pointer
// ghost, resting on the burner) without going soft. Colours are the painted
// cap's own (#F6F9FC body, #DDE6F3 shading).
function CapArt({ style }: { style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 36 52"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: '100%', ...style }}
      focusable="false"
      aria-hidden="true"
    >
      <path
        d="M4 16 C 4 7, 10 2, 18 2 C 26 2, 32 7, 32 16 L 32 42 C 32 47, 26 49, 18 49 C 10 49, 4 47, 4 42 Z"
        fill="#F6F9FC"
        stroke="#C3D2E5"
        strokeWidth="1.8"
      />
      <ellipse cx="18" cy="42" rx="14" ry="5" fill="#E7EEF7" stroke="#C3D2E5" strokeWidth="1.4" />
      <rect x="9" y="12" width="4" height="26" rx="2" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
}

// Prosedur 4's floating card (Figma group 231:1064): the shared tab and white
// card, carrying the frame's instruction and the cap the Analyst drags out.
function BunsenCard({
  step,
  unlocked,
  held,
  correction,
  animation,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  step: BunsenStep;
  unlocked: boolean;
  held: boolean;
  correction: string | null;
  animation: Animation;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
}) {
  return (
    <div
      className={animation.className}
      style={{
        position: 'absolute',
        left: S(CARD.x),
        top: S(CARD.y),
        width: S(CARD.width),
        zIndex: 4,
        animationDelay: `${animation.delay}ms`,
      }}
    >
      <div
        style={{
          marginTop: S(CARD_BODY_DY),
          minHeight: S(CARD_BODY_MIN_HEIGHT),
          background: '#FFFFFF',
          border: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: S(CARD_GAP),
          padding: `${S(34)} ${S(18)} ${S(22)}`,
        }}
      >
        <span
          style={{
            ...textBase,
            maxWidth: S(CARD_TEXT_WIDTH),
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(19, 9),
            fontWeight: 500,
            color: COLOR.navy,
          }}
        >
          {step.hint}
        </span>

        <CapPanel
          cap={step.cap}
          unlocked={unlocked}
          held={held}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />

        {/* Reserved in flow rather than overlaid, so a correction cannot shove
            the panel it is explaining. Announced through the Screen's own live
            region, so it is hidden from the accessibility tree here rather than
            being read twice. */}
        <span
          aria-hidden="true"
          className={correction ? 'sterilab-nudge' : undefined}
          style={{
            ...textBase,
            minHeight: T(17, 9),
            maxWidth: S(CARD_TEXT_WIDTH),
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

      <FloatingTab label={step.eyebrow} dx={CARD_TAB_DX} />
    </div>
  );
}

// The light panel holding the cap, styled like Langkah 3's tool panel. The cap
// stays in it, dimmed and named as unavailable, until the flame is steady:
// capping a burner that is still catching is the mistake the phase order is
// there to prevent, so the tool says so rather than silently doing nothing.
//
// Dragging it out is a pointer gesture; activating it from the keyboard does
// nothing on its own, which is why its name sends the Analyst to the burner
// control instead.
function CapPanel({
  cap,
  unlocked,
  held,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  cap: BunsenCap;
  unlocked: boolean;
  held: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
}) {
  return (
    <div
      style={{
        width: S(PANEL.width),
        maxWidth: '100%',
        minHeight: `max(64px, ${S(PANEL.height)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: S(16),
        background: '#EAF4FD',
        border: `max(1px, 0.078cqw) solid ${COLOR.divider}`,
      }}
    >
      <span
        role="img"
        aria-label={unlocked ? cap.accessibleName : cap.lockedName}
        data-testid="tool-cap"
        onPointerDown={unlocked ? onPointerDown : undefined}
        onPointerMove={unlocked ? onPointerMove : undefined}
        onPointerUp={unlocked ? onPointerUp : undefined}
        onPointerCancel={unlocked ? onPointerCancel : undefined}
        onLostPointerCapture={unlocked ? onPointerCancel : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
          minHeight: 44,
          // Floors that keep the cap's own proportions (36 x 52): a 44px-wide
          // tile with a 44px-tall floor would squash it into a lid.
          width: `max(48px, ${S(cap.rest.width * 1.7)})`,
          height: `max(70px, ${S(cap.rest.height * 1.7)})`,
          cursor: unlocked ? 'grab' : 'default',
          opacity: held ? 0.35 : unlocked ? 1 : 0.4,
          touchAction: 'none',
          transition: 'opacity 160ms ease-out',
        }}
      >
        <CapArt />
      </span>
    </div>
  );
}
