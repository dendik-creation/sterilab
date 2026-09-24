import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { InoculateAction, InoculateStep, Rect } from '../../../../../data/stages/teknikAseptik';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, rectStyle, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 6 - "Mengambil dan Menginokulasi Kultur". Six ordered actions take
// inoculum from the source petri dish to one slant-agar tube, then close,
// label, and incubate that tube. The revised plates are composited art, so the
// only overlays remain the existing click targets and draggable tools.

const CARD = { x: 1428.649, y: 221.17, width: 443.377 };
const CARD_TAB_DX = 106.668;
const CARD_BODY_DY = 16.875;
const CARD_TEXT_WIDTH = 346.081;

const CORRECTION_MS = 3200;
// The room has to visibly settle on the final plate before the note card
// starts rising, like every other procedure's close.
const SETTLE_MS = 620;
const DRAG_THRESHOLD_PX = 6;
// Sampling's own cover-fade (200-300ms per the revision) and how long its
// success line holds the correction slot before the ordinary "Berikutnya:"
// copy would naturally take back over on the next action.
const SAMPLE_FADE_MS = 260;
const SAMPLE_BANNER_MS = 2600;

interface DragState {
  x: number;
  y: number;
  coarse: boolean;
  moved: boolean;
}

export function Prosedur06MenginokulasiKultur({ step, runtime }: ProcedureProps<InoculateStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [doneCount, setDoneCount] = useState(0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [overTarget, setOverTarget] = useState(false);
  const [correction, setCorrection] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [fadeCover, setFadeCover] = useState<{ src: string; alt: string } | null>(null);
  const targetRef = useRef<HTMLButtonElement | null>(null);
  const targetBoxRef = useRef<DOMRect | null>(null);
  const suppressClickRef = useRef(false);
  const correctionTimerRef = useRef(0);
  const bannerTimerRef = useRef(0);
  const fadeTimerRef = useRef(0);
  const after = useTimeouts();

  const frame = step.frames[doneCount];
  const action: InoculateAction | undefined = step.actions[doneCount];
  const finished = doneCount >= step.actions.length;

  useLayoutEffect(() => {
    setFrame({ src: frame.src, alt: frame.alt, rect: step.backgroundRect });
  }, [setFrame, frame.src, frame.alt, step.backgroundRect]);

  useEffect(
    () => () => {
      window.clearTimeout(correctionTimerRef.current);
      window.clearTimeout(bannerTimerRef.current);
      window.clearTimeout(fadeTimerRef.current);
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
    // successBanner is a visible-card flash only (see InstructionCard's
    // sample-feedback slot) - the aria-live announcement stays the plain
    // per-action progress line every other Langkah 6 action already uses, so
    // screen-reader guidance to the *next* action is never held up behind it.
    const name = action!.kind === 'click' ? action!.accessibleName : action!.tool.accessibleName;
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
    setSuccessBanner(null);
    window.clearTimeout(correctionTimerRef.current);
    correctionTimerRef.current = window.setTimeout(() => setCorrection(null), CORRECTION_MS);
  };

  const advance = () => {
    if (finished || exiting) return;
    playClick();
    setCorrection(null);

    // Sampling's own beat: cover the outgoing plate and hold a green success
    // line over the ordinary "Berikutnya:" copy for a moment, instead of the
    // hard cut every other action in this chain uses.
    if (action?.kind === 'drag' && action.successFeedback) {
      setFadeCover({ src: frame.src, alt: frame.alt });
      window.clearTimeout(fadeTimerRef.current);
      if (prefersReducedMotion()) {
        setFadeCover(null);
      } else {
        fadeTimerRef.current = window.setTimeout(() => setFadeCover(null), SAMPLE_FADE_MS);
      }

      setSuccessBanner(action.successFeedback);
      window.clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = window.setTimeout(() => setSuccessBanner(null), SAMPLE_BANNER_MS);
    } else {
      setSuccessBanner(null);
    }

    setDoneCount((count) => count + 1);
  };

  if (!action) {
    return (
      <>
        <InstructionCard step={step} phase={doneCount - 1} correction={null} animation={runtime.cardAnimation} />
        <SampleFadeCover cover={fadeCover} rect={step.backgroundRect} />
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
          successBanner={successBanner}
          animation={runtime.cardAnimation}
        />
        <SampleFadeCover cover={fadeCover} rect={step.backgroundRect} />
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
    setDrag({ x: event.clientX, y: event.clientY, coarse: event.pointerType !== 'mouse', moved: false });
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
      advance();
      return;
    }
    if (current.moved) showCorrection(action.offTargetCorrection);
  };

  const cancelDrag = () => {
    setDrag(null);
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
      <DropTarget
        action={action}
        armed={!exiting}
        highlighted={overTarget}
        targetRef={targetRef}
        onSelect={handleTargetClick}
        onPointerUp={endDrag}
      />

      <InstructionCard
        step={step}
        phase={doneCount}
        correction={correction}
        successBanner={successBanner}
        animation={runtime.cardAnimation}
        drag={{
          tool: action.tool,
          held: drag !== null,
          onPointerDown: startDrag,
          onPointerMove: moveDrag,
          onPointerUp: endDrag,
          onPointerCancel: cancelDrag,
        }}
      />

      {drag ? <DragGhost src={action.tool.src} width={action.tool.width} drag={drag} /> : null}
      <SampleFadeCover cover={fadeCover} rect={step.backgroundRect} />
    </>
  );
}

// Sampling's cover-fade: the outgoing plate held on top of the new one
// (already swapped in underneath via setFrame) and animated to transparent,
// so the ready -> sampling change reads as a 200-300ms crossfade rather than
// a hard cut. Local to this one action - Stage's shared background <img>
// (every other Langkah's swap) is untouched.
function SampleFadeCover({ cover, rect }: { cover: { src: string; alt: string } | null; rect: Rect }) {
  if (!cover) return null;
  return (
    <img
      src={cover.src}
      alt=""
      aria-hidden="true"
      className="sterilab-sample-crossfade"
      style={{ position: 'absolute', ...rectStyle(rect), objectFit: 'cover', zIndex: 3, pointerEvents: 'none' }}
    />
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
        // Above the PROSEDUR card (4): three of this step's objects (the
        // culture dish, the selected tube, the label's drop zone) sit design px
        // away from its right edge (556.489) that a floored 44px button
        // still clears at desktop, but the card's own long description wraps
        // tall enough on the smallest supported phone (568x320) to reach
        // down to them, and a floored hotspot is wide enough there to dip
        // back under it. Winning that overlap is worth the rare cosmetic
        // overlap; losing the click is not.
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

// A drag target (the source culture or inoculated tube), sized from its revised
// plate. It is also a real button, like Langkah 5's flame, so the action
// stays completable from the keyboard alone.
function DropTarget({
  action,
  armed,
  highlighted,
  targetRef,
  onSelect,
  onPointerUp,
}: {
  action: Extract<InoculateAction, { kind: 'drag' }>;
  armed: boolean;
  highlighted: boolean;
  targetRef: MutableRefObject<HTMLButtonElement | null>;
  onSelect: () => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}) {
  const { target } = action;

  return (
    <button
      type="button"
      ref={targetRef}
      onClick={onSelect}
      onPointerUp={onPointerUp}
      disabled={!armed}
      aria-label={action.tool.accessibleName}
      data-procedure-state={action.state}
      className={armed ? 'sterilab-hotspot-pulse' : undefined}
      style={{
        position: 'absolute',
        left: S(target.x + target.width / 2),
        top: S(target.y + target.height / 2),
        transform: 'translate(-50%, -50%)',
        width: `max(44px, ${S(target.width)})`,
        height: `max(44px, ${S(target.height)})`,
        // Same reasoning as ClickHotspot's zIndex: this target sits close
        // enough to the PROSEDUR card's right edge to need to win over it.
        zIndex: 5,
        padding: 0,
        border: armed ? `max(2px, 0.156cqw) solid rgba(52, 113, 199, 0.6)` : 'none',
        borderRadius: S(18),
        background: armed
          ? highlighted
            ? 'rgba(109, 215, 253, 0.34)'
            : 'rgba(109, 215, 253, 0.1)'
          : 'transparent',
        cursor: armed ? 'pointer' : 'default',
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

function DragGhost({ src, width, drag }: { src: string; width: number; drag: DragState }) {
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
        src={src}
        alt=""
        style={{
          width: `max(48px, ${S(width)})`,
          height: 'auto',
          display: 'block',
          transform: 'scale(1.06)',
          filter: 'drop-shadow(0 0.4cqw 0.8cqw rgba(4, 72, 139, 0.35))',
        }}
      />
    </div>
  );
}

// The floating card, shared shape across every plate: the hint sentence Figma
// writes above the divider, then the short "Instruksi :" line below it, and -
// only while the label action is live - the draggable tile itself.
function InstructionCard({
  step,
  phase,
  correction,
  successBanner = null,
  animation,
  drag,
}: {
  step: InoculateStep;
  phase: number;
  correction: string | null;
  successBanner?: string | null;
  animation: Animation;
  drag?: {
    tool: { src: string; width: number; height: number; accessibleName: string };
    held: boolean;
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: () => void;
  };
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

        {drag ? (
          <span
            role="img"
            aria-label={drag.tool.accessibleName}
            data-testid="tool-label-marker"
            onPointerDown={drag.onPointerDown}
            onPointerMove={drag.onPointerMove}
            onPointerUp={drag.onPointerUp}
            onPointerCancel={drag.onPointerCancel}
            onLostPointerCapture={drag.onPointerCancel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 44,
              minHeight: 44,
              width: `max(88px, ${S(drag.tool.width)})`,
              height: 'auto',
              cursor: 'grab',
              opacity: drag.held ? 0.35 : 1,
              touchAction: 'none',
              transition: 'opacity 160ms ease-out',
            }}
          >
            <img
              src={drag.tool.src}
              alt=""
              style={{ width: `min(${S(drag.tool.width)}, 100%)`, height: 'auto', display: 'block', pointerEvents: 'none' }}
            />
          </span>
        ) : null}

        <span
          aria-hidden="true"
          data-testid="sample-feedback"
          className={correction ? 'sterilab-nudge' : undefined}
          style={{
            ...textBase,
            minHeight: T(17, 9),
            maxWidth: S(CARD_TEXT_WIDTH),
            textAlign: 'center',
            lineHeight: 1.3,
            fontSize: T(17, 9),
            fontWeight: 600,
            // Same slot as the off-target correction, in the design system's
            // existing success green rather than a new colour, for the
            // "Sampel kultur berhasil..." line the revision asks for.
            color: correction ? COLOR.correction : COLOR.successGreen,
            opacity: correction || successBanner ? 1 : 0,
            transition: 'opacity 180ms ease-out',
          }}
        >
          {correction ?? successBanner ?? ''}
        </span>
      </div>

      <FloatingTab label={step.eyebrow} dx={CARD_TAB_DX} />
    </div>
  );
}
