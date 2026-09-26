import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { InoculateAction, InoculateStep } from '../../../../../data/stages/teknikAseptik';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 6 - "Mengambil dan Menginokulasi Kultur". Six ordered actions take
// culture from the Petri source to a solid slant-agar tube near the flame, then
// close and label it, return it to the rack, and incubate that whole rack. The
// revised plates are composited art, so every overlay is an interaction guide,
// never a duplicate visual object.

const CARD = { x: 1428.649, y: 221.17, width: 443.377 };
const CARD_TAB_DX = 106.668;
const CARD_BODY_DY = 16.875;
const CARD_TEXT_WIDTH = 346.081;

const CORRECTION_MS = 3200;
// The room has to visibly settle on the final plate before the note card
// starts rising, like every other procedure's close.
const SETTLE_MS = 620;
const DRAG_THRESHOLD_PX = 6;

interface DragState {
  x: number;
  y: number;
  moved: boolean;
}

export function Prosedur06MenginokulasiKultur({ step, runtime }: ProcedureProps<InoculateStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [doneCount, setDoneCount] = useState(0);
  const [overTarget, setOverTarget] = useState(false);
  const [correction, setCorrection] = useState<string | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const targetBoxRef = useRef<DOMRect | null>(null);
  // Pointer events can be batched more slowly than a browser's synthetic
  // click. Keep the drag origin outside React state so a failed drag cannot be
  // mistaken for the source button's keyboard/click fallback.
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const correctionTimerRef = useRef(0);
  const after = useTimeouts();

  // There are six plates for six actions. The last plate remains on screen
  // while the final rack-to-incubator action settles and success feedback rises.
  const frame = step.frames[Math.min(doneCount, step.frames.length - 1)];
  const action: InoculateAction | undefined = step.actions[doneCount];
  const finished = doneCount >= step.actions.length;

  useLayoutEffect(() => {
    setFrame({ src: frame.src, alt: frame.alt, rect: step.backgroundRect });
  }, [setFrame, frame.src, frame.alt, step.backgroundRect]);

  useEffect(
    () => () => {
      window.clearTimeout(correctionTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (finished) {
      setMessage(`${step.successTitle} ${step.successBody}`);
      return;
    }
    if (correction) {
      setMessage(correction);
      return;
    }
    const name = action!.accessibleName;
    setMessage(`Tindakan ${doneCount} dari ${step.actions.length} selesai. Berikutnya: ${name}.`);
  }, [setMessage, finished, correction, doneCount, step, action]);

  const doneRef = useRef(false);
  useEffect(() => {
    if (!finished || doneRef.current) return;
    doneRef.current = true;
    if (prefersReducedMotion()) {
      complete();
      return;
    }
    after(SETTLE_MS, complete);
  }, [finished, complete, after]);

  const showCorrection = (message: string) => {
    setCorrection(message);
    window.clearTimeout(correctionTimerRef.current);
    correctionTimerRef.current = window.setTimeout(() => setCorrection(null), CORRECTION_MS);
  };

  const advance = () => {
    if (finished || exiting) return;
    playClick();
    setCorrection(null);
    setDoneCount((count) => count + 1);
  };

  if (!action) {
    return (
      <>
        <InstructionCard step={step} phase={doneCount - 1} correction={null} animation={runtime.cardAnimation} />
      </>
    );
  }

  if (action.kind === 'click') {
    return (
      <>
        <ClickHotspot armed={!exiting} action={action} onSelect={advance} />
        <InstructionCard
          step={step}
          phase={doneCount}
          correction={correction}
          animation={runtime.cardAnimation}
        />
      </>
    );
  }

  const overTargetAt = (clientX: number, clientY: number): boolean => {
    const box = targetBoxRef.current;
    if (!box) return false;
    return clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom;
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (exiting || !event.isPrimary) return;
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    targetBoxRef.current = targetRef.current?.getBoundingClientRect() ?? null;
    const origin = { x: event.clientX, y: event.clientY, moved: false };
    dragRef.current = origin;
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = dragRef.current;
    if (!current) return;
    const moved =
      current.moved ||
      Math.abs(event.clientX - current.x) > DRAG_THRESHOLD_PX ||
      Math.abs(event.clientY - current.y) > DRAG_THRESHOLD_PX;
    const next = { x: event.clientX, y: event.clientY, moved };
    dragRef.current = next;
    setOverTarget(overTargetAt(event.clientX, event.clientY));
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = dragRef.current;
    dragRef.current = null;
    setOverTarget(false);
    if (!current) return;
    // Do not let a release after any actual drag fall through into onClick.
    // A stationary press still falls through for keyboard/click accessibility.
    if (current.moved) suppressClickRef.current = true;
    if (overTargetAt(event.clientX, event.clientY)) {
      suppressClickRef.current = true;
      advance();
      return;
    }
    if (current.moved) showCorrection(action.offTargetCorrection);
  };

  const cancelDrag = () => {
    dragRef.current = null;
    setOverTarget(false);
  };

  const handleTargetClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    advance();
  };

  return (
    <>
      <SceneDrag
        action={action}
        armed={!exiting}
        highlighted={overTarget}
        targetRef={targetRef}
        onSelect={handleTargetClick}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
      />

      <InstructionCard
        step={step}
        phase={doneCount}
        correction={correction}
        animation={runtime.cardAnimation}
      />
    </>
  );
}

// A plain object baked into the plate's own art - transparent over it, floored
// to a 44x44 touch target, same shape as Langkah 1's hotspots.
function ClickHotspot({
  armed,
  action,
  onSelect,
}: {
  armed: boolean;
  action: Extract<InoculateAction, { kind: 'click' }>;
  onSelect: () => void;
}) {
  const center = { x: action.hotspot.x + action.hotspot.width / 2, y: action.hotspot.y + action.hotspot.height / 2 };

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!armed}
      aria-label={action.accessibleName}
      data-procedure-state={action.state}
      className={armed ? 'sterilab-hotspot-pulse' : undefined}
      style={{
        position: 'absolute',
        left: S(center.x),
        top: S(center.y),
        transform: 'translate(-50%, -50%)',
        width: `max(44px, ${S(action.hotspot.width)})`,
        height: `max(44px, ${S(action.hotspot.height)})`,
        // The selected tube and the tube-label band can sit close to chrome
        // once the 44px touch floor applies on a small landscape screen. Keep
        // the active object above the cards rather than making it unclickable.
        zIndex: 5,
        padding: 0,
        border: armed ? `max(2px, 0.156cqw) solid rgba(52, 113, 199, 0.6)` : 'none',
        borderRadius: S(18),
        background: armed ? 'rgba(109, 215, 253, 0.1)' : 'transparent',
        cursor: armed ? 'pointer' : 'default',
        transition: 'background 160ms ease-out',
      }}
      onPointerOver={(e) => {
        if (armed) e.currentTarget.style.background = 'rgba(109, 215, 253, 0.3)';
      }}
      onPointerOut={(e) => {
        if (armed) e.currentTarget.style.background = 'rgba(109, 215, 253, 0.1)';
      }}
    />
  );
}

// Drag a baked-in source to a baked-in target. Unlike the old floating-card
// sprite, this keeps the visual loop, tube, rack, and incubator singular while
// preserving the existing pointer-capture drag behaviour and keyboard fallback.
function SceneDrag({
  action,
  armed,
  highlighted,
  targetRef,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  action: Extract<InoculateAction, { kind: 'drag' }>;
  armed: boolean;
  highlighted: boolean;
  targetRef: MutableRefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
}) {
  const sourceCenter = { x: action.source.x + action.source.width / 2, y: action.source.y + action.source.height / 2 };
  const targetCenter = { x: action.target.x + action.target.width / 2, y: action.target.y + action.target.height / 2 };

  return (
    <>
      <div
        ref={targetRef}
        aria-hidden="true"
        data-testid={`procedure6-${action.state}-target`}
        data-procedure-state={action.state}
        className={armed && !highlighted ? 'sterilab-hotspot-pulse' : undefined}
        style={{
          position: 'absolute',
          left: S(targetCenter.x),
          top: S(targetCenter.y),
          transform: 'translate(-50%, -50%)',
          width: `max(44px, ${S(action.target.width)})`,
          height: `max(44px, ${S(action.target.height)})`,
          zIndex: 4,
          border: armed ? `max(2px, 0.156cqw) solid rgba(52, 113, 199, 0.6)` : 'none',
          borderRadius: S(18),
          background: armed
            ? highlighted
              ? 'rgba(109, 215, 253, 0.34)'
              : 'rgba(109, 215, 253, 0.08)'
            : 'transparent',
          pointerEvents: 'none',
          transition: 'background 160ms ease-out',
        }}
      />
      <button
        type="button"
        onClick={onSelect}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
        disabled={!armed}
        aria-label={action.accessibleName}
        data-testid={`procedure6-${action.state}-source`}
        data-procedure-state={action.state}
        className={armed ? 'sterilab-hotspot-pulse' : undefined}
        style={{
          position: 'absolute',
          left: S(sourceCenter.x),
          top: S(sourceCenter.y),
          transform: 'translate(-50%, -50%)',
          width: `max(44px, ${S(action.source.width)})`,
          height: `max(44px, ${S(action.source.height)})`,
          zIndex: 5,
          padding: 0,
          border: armed ? `max(2px, 0.156cqw) solid rgba(52, 113, 199, 0.6)` : 'none',
          borderRadius: S(18),
          background: armed ? 'rgba(109, 215, 253, 0.06)' : 'transparent',
          cursor: armed ? 'grab' : 'default',
          touchAction: 'none',
          transition: 'background 160ms ease-out',
        }}
        onPointerOver={(event) => {
          if (armed) event.currentTarget.style.background = 'rgba(109, 215, 253, 0.22)';
        }}
        onPointerOut={(event) => {
          if (armed) event.currentTarget.style.background = 'rgba(109, 215, 253, 0.06)';
        }}
      />
    </>
  );
}

// The floating card remains the shared hint/instruction component for every
// internal state; objects to manipulate are already painted into the plate.
function InstructionCard({
  step,
  phase,
  correction,
  animation,
}: {
  step: InoculateStep;
  phase: number;
  correction: string | null;
  animation: Animation;
}) {
  const copy = step.phaseCopy[Math.min(phase, step.phaseCopy.length - 1)];

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
          background: '#FFFFFF',
          border: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: S(16),
          padding: `${S(34)} ${S(18)} ${S(22)}`,
        }}
      >
        <span
          style={{
            ...textBase,
            maxWidth: S(CARD_TEXT_WIDTH),
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(18, 9),
            fontWeight: 500,
            color: COLOR.navy,
          }}
        >
          {copy.hint}
        </span>

        <span aria-hidden="true" style={{ width: '100%', height: T(HAIRLINE, 1) as string, background: COLOR.divider }} />

        <span style={{ ...textBase, fontSize: T(18, 9), fontWeight: 800, color: COLOR.navy }}>Instruksi :</span>
        <span
          style={{
            ...textBase,
            maxWidth: S(CARD_TEXT_WIDTH),
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(18, 9),
            fontWeight: 500,
            color: COLOR.navy,
          }}
        >
          {copy.instructionLabel}
        </span>

        <span
          aria-hidden="true"
          data-testid="procedure6-feedback"
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
