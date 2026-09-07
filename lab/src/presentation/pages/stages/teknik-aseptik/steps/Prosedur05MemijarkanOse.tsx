import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { OseFrame, OseTool, SterilizeStep } from '../../../../../data/stages/teknikAseptik';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 5 - "Memijarkan Jarum Ose" (Figma frame 61:543 "LANGKAH 5 NEW").
// Heat the inoculating loop in the bunsen's flame until it glows red, then hold
// it clear until it cools, before it is used to pick up a culture.
//
// The bunsen itself never moves between the step's three plates - measured off
// their own rasters, the flame and its metal collar sit within a few design px
// of the same box on all three - so one `target` rect on the step covers every
// plate, unlike Langkah 3's bench or Langkah 4's lamp. What changes is only the
// analyst's hands and the loop's own glow, which is why the interaction is a
// plain three-plate sequence rather than anything drawn: idle (bunsen lit,
// hands empty) -> heating (loop in the flame, glowing) -> cooling (loop held
// clear, dulled) -> idle again, the loop now put down and the room reading the
// same as before the Analyst picked it up.
//
// Two ways in, like Langkah 4's tube: drag the loop out of the card onto the
// flame, or activate the flame control itself. The second is the
// keyboard/tap path, so the step is completable with Enter alone.

const CARD = { x: 1428.649, y: 221.17, width: 443.377 };
const CARD_TAB_DX = 106.668;
const CARD_BODY_DY = 16.875;
const CARD_BODY_MIN_HEIGHT = 199.5;
const CARD_TEXT_WIDTH = 346.081;
const CARD_GAP = 22;
const PANEL = { width: 240.352, height: 168 };

const CORRECTION_MS = 3200;
// The room has to visibly settle - loop put down, plate back to idle - before
// the note card starts rising.
const SETTLE_MS = 620;
// Pointer travel that separates a drag of the loop from a plain press on it.
const DRAG_THRESHOLD_PX = 6;

const LABEL = {
  idle: 'Panaskan jarum ose di atas api bunsen',
  heating: 'Jarum ose sedang dipijarkan, tunggu sampai memijar merah',
  cooling: 'Jarum ose sedang didinginkan sebelum digunakan',
  done: 'Jarum ose telah disterilkan',
} as const;

type Phase = 'idle' | 'heating' | 'cooling' | 'done';

interface DragState {
  x: number;
  y: number;
  // Touch and pen lift the loop clear of the finger; a mouse cursor is small
  // enough to keep it centred.
  coarse: boolean;
  moved: boolean;
}

export function Prosedur05MemijarkanOse({ step, runtime }: ProcedureProps<SterilizeStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [phase, setPhase] = useState<Phase>('idle');
  const [drag, setDrag] = useState<DragState | null>(null);
  const [overTarget, setOverTarget] = useState(false);
  const [correction, setCorrection] = useState<string | null>(null);
  const targetRef = useRef<HTMLButtonElement | null>(null);
  const targetBoxRef = useRef<DOMRect | null>(null);
  const suppressClickRef = useRef(false);
  const correctionTimerRef = useRef(0);
  const after = useTimeouts();

  // Idle plate first, heating plate while glowing, cooling plate while held
  // clear - and back to the idle plate once cooling finishes, since the loop
  // has been put down by then.
  const frameIndex = phase === 'heating' ? 1 : phase === 'cooling' ? 2 : 0;
  const frame: OseFrame = step.frames[frameIndex];
  const canStart = !exiting && phase === 'idle';

  // Layout, not passive: swapping plates is the feedback for the loop heating
  // and cooling, so it has to land in the same commit the phase changes in.
  useLayoutEffect(() => {
    setFrame({ src: frame.src, alt: frame.alt, rect: step.backgroundRect });
  }, [setFrame, frame.src, frame.alt, step.backgroundRect]);

  useEffect(() => () => window.clearTimeout(correctionTimerRef.current), []);

  useEffect(() => {
    if (phase === 'done') {
      setMessage(`${step.successTitle} ${step.successBody}`);
      return;
    }
    if (correction) {
      setMessage(correction);
      return;
    }
    if (phase === 'heating') {
      setMessage('Jarum ose sedang dipijarkan di atas api hingga kawat memijar merah.');
      return;
    }
    if (phase === 'cooling') {
      setMessage('Jarum ose memijar merah, diamkan sejenak hingga mendingin sebelum digunakan.');
      return;
    }
    setMessage('Bunsen spirtus sudah menyala. Seret jarum ose ke atas api untuk memijarkannya.');
  }, [setMessage, phase, correction, step.successTitle, step.successBody]);

  // Fires once, on the commit that finishes cooling.
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

  const start = () => {
    if (!canStart) return;
    playClick();
    setCorrection(null);
    // With motion reduced there is nothing to watch glow or cool, so the wait
    // would be a plain delay: the loop arrives already sterilized.
    if (prefersReducedMotion()) {
      setPhase('done');
      return;
    }
    setPhase('heating');
    after(step.heatMs, () => setPhase('cooling'));
    after(step.heatMs + step.coolMs, () => setPhase('done'));
  };

  const handleTargetClick = () => {
    // A drag that started on the tool tile and ended on the flame already
    // started the sequence; the click that follows the release must not count
    // twice.
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    start();
  };

  // The target's box, measured once per drag - nothing moves it mid-drag, and
  // the plate only advances once the drag has already landed.
  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!canStart || !event.isPrimary) return;
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    targetBoxRef.current = targetRef.current?.getBoundingClientRect() ?? null;
    setDrag({ x: event.clientX, y: event.clientY, coarse: event.pointerType !== 'mouse', moved: false });
  };

  const overTargetAt = (clientX: number, clientY: number): boolean => {
    const box = targetBoxRef.current;
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
    setOverTarget(overTargetAt(event.clientX, event.clientY));
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = drag;
    setDrag(null);
    setOverTarget(false);
    if (!current) return;
    if (overTargetAt(event.clientX, event.clientY)) {
      suppressClickRef.current = true;
      start();
      return;
    }
    // A press that never went anywhere is not a miss - it is someone tapping
    // the tile to find out what it is, and the tile's own name answers that.
    if (current.moved) showCorrection(step.offTargetCorrection);
  };

  const cancelDrag = () => {
    setDrag(null);
    setOverTarget(false);
  };

  return (
    <>
      <FlameTarget
        step={step}
        phase={phase}
        armed={canStart}
        highlighted={overTarget}
        targetRef={targetRef}
        onSelect={handleTargetClick}
        onPointerUp={endDrag}
      />

      <OseCard
        step={step}
        phase={phase}
        held={drag !== null}
        correction={correction}
        animation={runtime.cardAnimation}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
      />

      {/* Follows the pointer for the length of the drag. Rendered outside both
          the card and the target so nothing clips it, and inert so it never
          eats the move events that decide where it is being dropped. */}
      {drag ? <OseGhost tool={step.tool} drag={drag} /> : null}
    </>
  );
}

// The flame's own hit area: a real button so the whole step is completable
// from the keyboard, sized and placed from the step's own `target` rect rather
// than a percentage that happens to look right.
function FlameTarget({
  step,
  phase,
  armed,
  highlighted,
  targetRef,
  onSelect,
  onPointerUp,
}: {
  step: SterilizeStep;
  phase: Phase;
  armed: boolean;
  highlighted: boolean;
  targetRef: MutableRefObject<HTMLButtonElement | null>;
  onSelect: () => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}) {
  const label = LABEL[phase];
  const { target } = step;

  return (
    <button
      type="button"
      ref={targetRef}
      onClick={onSelect}
      onPointerUp={onPointerUp}
      disabled={!armed}
      aria-label={label}
      className={armed ? 'sterilab-hotspot-pulse' : undefined}
      style={{
        position: 'absolute',
        left: S(target.x + target.width / 2),
        top: S(target.y + target.height / 2),
        transform: 'translate(-50%, -50%)',
        width: `max(44px, ${S(target.width)})`,
        height: `max(44px, ${S(target.height)})`,
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
        // Without this a touch drag that ends on the target scrolls the page
        // instead of dropping the loop.
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
  );
}

// The loop riding the pointer while it is being carried to the flame.
function OseGhost({ tool, drag }: { tool: OseTool; drag: DragState }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: drag.x,
        top: drag.y,
        transform: `translate(-50%, ${drag.coarse ? '-115%' : '-50%'})`,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <img
        src={tool.src}
        alt=""
        style={{
          width: `max(48px, ${S(tool.width)})`,
          height: 'auto',
          display: 'block',
          transform: 'scale(1.06)',
          filter: 'drop-shadow(0 0.4cqw 0.8cqw rgba(4, 72, 139, 0.35))',
        }}
      />
    </div>
  );
}

// Prosedur 5's floating card (Figma group 232:1577): same shared tab and white
// card as every other procedure's, carrying the frame's instruction and the
// loop the Analyst drags out.
function OseCard({
  step,
  phase,
  held,
  correction,
  animation,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  step: SterilizeStep;
  phase: Phase;
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

        <OsePanel
          tool={step.tool}
          idle={phase === 'idle'}
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

// The light panel holding the loop. It stays in the panel, at full opacity,
// until the sequence starts - dragging it out is a pointer gesture; activating
// it from the keyboard does nothing on its own, which is why its accessible
// name sends the Analyst to the flame control instead.
function OsePanel({
  tool,
  idle,
  held,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  tool: OseTool;
  idle: boolean;
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
        aria-label={tool.accessibleName}
        data-testid="tool-jarum-ose"
        onPointerDown={idle ? onPointerDown : undefined}
        onPointerMove={idle ? onPointerMove : undefined}
        onPointerUp={idle ? onPointerUp : undefined}
        onPointerCancel={idle ? onPointerCancel : undefined}
        onLostPointerCapture={idle ? onPointerCancel : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
          minHeight: 44,
          width: `max(56px, ${S(tool.width)})`,
          height: 'auto',
          cursor: idle ? 'grab' : 'default',
          opacity: held ? 0.35 : idle ? 1 : 0.4,
          touchAction: 'none',
          transition: 'opacity 160ms ease-out',
        }}
      >
        <img
          src={tool.src}
          alt=""
          style={{
            width: `min(${S(tool.width)}, 100%)`,
            height: 'auto',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      </span>
    </div>
  );
}
