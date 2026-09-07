import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { DecontaminateStep } from '../../../../../data/stages/pengelolaanLimbah';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 2 - "Mendekontaminasi Limbah Biologis" (Figma frames "6.2 - A/B/C").
// Pick up the bin of biological waste (already sorted in Langkah 1) and load
// it into the autoclave, then press the autoclave's own start button to run
// the cycle. Two beats, two Figma plates: the drop (A -> B) and the press
// (B -> C) - there is no fourth plate for "mid-cycle", so the door-closed art
// is the feedback for the button press itself.
//
// The drop is a real drag, same dual path as Stage 4's APD equip
// (teknik-aseptik/Prosedur02MemakaiApd.tsx): a pointer drag for a mouse or a
// finger, and a tap-the-bin-then-tap-the-autoclave path for the keyboard and
// anyone who finds dragging awkward. Only one item and one target this time,
// so there is no socket map to search - just one drop rect to hit-test.

const HINT_CARD = { x: 1437, y: 221.17, width: 426 };
const HINT_PILL = { dx: 98 };
const HINT_BODY = { dy: 242 - 221.17, minHeight: 247 - (242 - 221.17) };

// The bin's own rendered art is the only source for a drag ghost and the
// card's preview thumbnail - there is no standalone icon file for it (unlike
// Stage 4's APD pieces), so both crop the same idle background photo down to
// its bin region instead of inventing new art. Sized to Figma's own preview
// (node 310:1130's mask group, 234.907x115.935); laid out in the card's flex
// flow rather than at its exact dx/dy, same trade every dot row and rule on
// this stage already makes.
const THUMB = { width: 234.907, height: 115.935 };
const FULL_FRAME_PX = 1920;

const DRAG_THRESHOLD_PX = 6;
const DROP_PADDING_PX = 24;
const GHOST_WIDTH_PX = 96;
// The lit-button plate needs to be on screen before the note card starts
// rising, or the Analyst reads "Dekontaminasi selesai" over a door still
// swinging shut.
const SETTLE_MS = 620;

interface DragState {
  x: number;
  y: number;
  coarse: boolean;
}

export function Prosedur02MendekontaminasiLimbahBiologis({ step, runtime }: ProcedureProps<DecontaminateStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [loaded, setLoaded] = useState(false);
  const [held, setHeld] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);
  const dropRef = useRef<HTMLButtonElement | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const after = useTimeouts();

  // Layout, not passive: pressing the start button is the one moment the art
  // may change on its own (the door closing), and it has to change in the
  // same commit as the press.
  useLayoutEffect(() => {
    const frame = started
      ? { src: step.doneBackground, alt: step.doneBackgroundAlt }
      : loaded
        ? { src: step.loadedBackground, alt: step.loadedBackgroundAlt }
        : { src: step.initialBackground, alt: step.initialBackgroundAlt };
    setFrame({ ...frame, rect: step.backgroundRect });
  }, [setFrame, started, loaded, step]);

  useEffect(() => {
    if (started) {
      setMessage(`${step.successTitle} ${step.successBody}`);
      return;
    }
    if (loaded) {
      setMessage(`Wadah limbah biologis sudah di dalam autoklaf. ${step.startInstruction}`);
      return;
    }
    setMessage(`Wadah limbah biologis belum dimasukkan ke autoklaf. ${step.dragInstruction}`);
  }, [setMessage, started, loaded, step]);

  const load = () => {
    if (loaded) return;
    playClick();
    setHeld(false);
    setLoaded(true);
  };

  const handleStart = () => {
    if (started) return;
    playClick();
    setStarted(true);
    if (prefersReducedMotion()) {
      complete();
      return;
    }
    after(SETTLE_MS, complete);
  };

  const handleBinClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (loaded) return;
    playClick();
    setHeld((current) => !current);
  };

  const handleBinPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (loaded || !event.isPrimary) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOriginRef.current = { x: event.clientX, y: event.clientY, moved: false };
    setDrag({ x: event.clientX, y: event.clientY, coarse: event.pointerType !== 'mouse' });
  };

  const hitsDropTarget = (x: number, y: number): boolean => {
    const box = dropRef.current?.getBoundingClientRect();
    if (!box) return false;
    return (
      x >= box.left - DROP_PADDING_PX &&
      x <= box.right + DROP_PADDING_PX &&
      y >= box.top - DROP_PADDING_PX &&
      y <= box.bottom + DROP_PADDING_PX
    );
  };

  const handleBinPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const origin = dragOriginRef.current;
    if (!origin) return;
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > DRAG_THRESHOLD_PX) origin.moved = true;
    setDrag((current) => (current ? { ...current, x: event.clientX, y: event.clientY } : current));
    setOver(origin.moved && hitsDropTarget(event.clientX, event.clientY));
  };

  const handleBinPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const origin = dragOriginRef.current;
    dragOriginRef.current = null;
    setDrag(null);
    setOver(false);
    if (!origin || !origin.moved) return;
    suppressClickRef.current = true;
    if (hitsDropTarget(event.clientX, event.clientY)) load();
  };

  const handleBinPointerCancel = () => {
    dragOriginRef.current = null;
    setDrag(null);
    setOver(false);
  };

  const armed = held || drag !== null;

  return (
    <>
      {!loaded && !exiting ? (
        <>
          <button
            type="button"
            onClick={handleBinClick}
            onPointerDown={handleBinPointerDown}
            onPointerMove={handleBinPointerMove}
            onPointerUp={handleBinPointerUp}
            onPointerCancel={handleBinPointerCancel}
            onLostPointerCapture={handleBinPointerCancel}
            aria-pressed={armed}
            aria-label={held ? `${step.binAccessibleName}, terpilih - pilih autoklaf untuk meletakkannya` : step.binAccessibleName}
            className={armed ? undefined : 'sterilab-hotspot-pulse'}
            style={{
              position: 'absolute',
              left: S(step.binRect.x),
              top: S(step.binRect.y),
              width: `max(44px, ${S(step.binRect.width)})`,
              height: `max(44px, ${S(step.binRect.height)})`,
              zIndex: 3,
              padding: 0,
              border: `max(2px, 0.156cqw) solid ${COLOR.hotspotBorder}`,
              borderRadius: S(18),
              background: held ? 'rgba(109, 215, 253, 0.4)' : 'rgba(255, 255, 255, 0.34)',
              opacity: drag ? 0.35 : 1,
              cursor: 'grab',
              touchAction: 'none',
              transition: 'background 160ms ease-out, opacity 160ms ease-out',
            }}
          />

          <button
            type="button"
            ref={dropRef}
            onClick={() => (held ? load() : undefined)}
            disabled={!armed}
            aria-label={step.autoclaveDropAccessibleName}
            className={armed && !over ? 'sterilab-hotspot-pulse' : undefined}
            style={{
              position: 'absolute',
              left: S(step.autoclaveDropRect.x),
              top: S(step.autoclaveDropRect.y),
              width: S(step.autoclaveDropRect.width),
              height: S(step.autoclaveDropRect.height),
              zIndex: 2,
              padding: 0,
              border: `max(2px, 0.156cqw) ${over ? 'solid' : 'dashed'} ${COLOR.hotspotBorder}`,
              borderRadius: S(18),
              background: over ? 'rgba(109, 215, 253, 0.4)' : 'rgba(255, 255, 255, 0.2)',
              cursor: armed ? 'pointer' : 'default',
              transition: 'background 160ms ease-out, border-style 160ms ease-out',
            }}
          />

          {drag ? (
            <div
              aria-hidden="true"
              style={{
                position: 'fixed',
                left: drag.x,
                top: drag.y,
                width: GHOST_WIDTH_PX,
                aspectRatio: `${step.binRect.width} / ${step.binRect.height}`,
                transform: `translate(-50%, ${drag.coarse ? '-115%' : '-50%'}) scale(1.08)`,
                pointerEvents: 'none',
                zIndex: 20,
                borderRadius: 8,
                boxShadow: '0 6px 14px rgba(4, 72, 139, 0.35)',
                ...cropStyle(step.initialBackground, step.binRect, GHOST_WIDTH_PX, 'px'),
              }}
            />
          ) : null}
        </>
      ) : null}

      {loaded && !started && !exiting ? (
        <button
          type="button"
          onClick={handleStart}
          aria-label={step.startButtonAccessibleName}
          className="sterilab-hotspot-pulse"
          style={{
            position: 'absolute',
            left: S(step.startButtonRect.x),
            top: S(step.startButtonRect.y),
            width: `max(44px, ${S(step.startButtonRect.width)})`,
            height: `max(44px, ${S(step.startButtonRect.height)})`,
            // Above the floating card (zIndex 4), not below it like every other
            // hotspot on this stage: the button's design position sits only
            // 20 design px under the card's own bottom edge, in the same
            // column - a gap a floored (T()) font's extra line-height can
            // close on a narrow viewport, so the button must win hit-testing
            // even where the card's own box has grown to cover it.
            zIndex: 5,
            padding: 0,
            border: `max(2px, 0.156cqw) solid ${COLOR.hotspotBorder}`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.34)',
            cursor: 'pointer',
            transition: 'background 160ms ease-out',
          }}
          onPointerOver={(e) => (e.currentTarget.style.background = 'rgba(109, 215, 253, 0.4)')}
          onPointerOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.34)')}
        />
      ) : null}

      <HintCard step={step} loaded={loaded} animation={runtime.cardAnimation} />
    </>
  );
}

// Crops one design-space rect out of a full 1920x1080 background photo,
// returned as a background-image style - used for both the card's static
// preview thumbnail (sized in cqw, matching every other measurement on this
// stage) and the drag ghost (sized in fixed px, since it follows the pointer
// in viewport space rather than the safe layer's container query).
function cropStyle(
  src: string,
  rect: { x: number; y: number; width: number; height: number },
  displaySize: number,
  unit: 'cqw' | 'px',
): { backgroundImage: string; backgroundSize: string; backgroundPosition: string; backgroundRepeat: string } {
  const scale = displaySize / rect.width;
  // The 'cqw' branch has to go through S() itself (design px -> percent of
  // the safe layer, /1920*100) rather than just appending the unit: a raw
  // `${designPx * scale}cqw` is ~19x too large, since it skips that /1920
  // and reads the number as already being a percent of the container.
  const size = (designPx: number) => (unit === 'cqw' ? S(designPx * scale) : `${designPx * scale}px`);
  return {
    backgroundImage: `url(${src})`,
    backgroundSize: `${size(FULL_FRAME_PX)} ${size(1080)}`,
    backgroundPosition: `-${size(rect.x)} -${size(rect.y)}`,
    backgroundRepeat: 'no-repeat',
  };
}

// Prosedur 2's floating card (Figma group "LANGKAH 6", node 309:879 /
// 310:1005 / 310:1140): the same tab and white card as every other
// procedure's, carrying a preview thumbnail of the bin only while it is
// still on the bench (Figma node 310:1130's mask group) - once it is loaded
// the card matches Langkah 1's plain shape.
function HintCard({ step, loaded, animation }: { step: DecontaminateStep; loaded: boolean; animation: Animation }) {
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: S(14),
          padding: `${S(28)} ${S(24)}`,
        }}
      >
        <span
          style={{
            ...textBase,
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(18, 9),
            fontWeight: 500,
            color: COLOR.navy,
          }}
        >
          {step.hint}
        </span>

        <span
          style={{
            width: '100%',
            height: 'max(1px, 0.078cqw)',
            background: COLOR.divider,
          }}
        />

        <span
          style={{
            ...textBase,
            alignSelf: 'flex-start',
            fontSize: T(18, 9),
            fontWeight: 800,
            color: COLOR.navy,
          }}
        >
          {step.instructionLabel}
        </span>
        <span
          style={{
            ...textBase,
            marginTop: S(-8),
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(18, 9),
            fontWeight: 500,
            color: COLOR.navy,
          }}
        >
          {loaded ? step.startInstruction : step.dragInstruction}
        </span>

        {!loaded ? (
          <div
            aria-hidden="true"
            style={{
              marginTop: S(6),
              width: S(THUMB.width),
              maxWidth: '100%',
              aspectRatio: `${THUMB.width} / ${THUMB.height}`,
              borderRadius: S(12),
              flex: 'none',
              ...cropStyle(step.initialBackground, step.binRect, THUMB.width, 'cqw'),
            }}
          />
        ) : null}
      </div>

      <FloatingTab label={step.eyebrow} dx={HINT_PILL.dx} />
    </div>
  );
}
