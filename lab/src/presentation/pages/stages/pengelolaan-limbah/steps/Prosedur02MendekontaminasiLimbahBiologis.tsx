import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { DecontaminateStep } from '../../../../../data/stages/pengelolaanLimbah';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 2 keeps the existing pointer drag and tap-to-place interaction.

const HINT_CARD = { x: 1437, y: 221.17, width: 426 };
const HINT_PILL = { dx: 98 };
const HINT_BODY = { dy: 242 - 221.17, minHeight: 247 - (242 - 221.17) };

const THUMB = { width: 234.907, height: 115.935 };

const DRAG_THRESHOLD_PX = 6;
const DROP_PADDING_PX = 24;
const GHOST_WIDTH_PX = 180;
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
      setMessage(`Tray stainless steel berisi limbah biologis sudah di dalam autoklaf. ${step.startInstruction}`);
      return;
    }
    setMessage(`Tray stainless steel berisi limbah biologis belum dimasukkan ke autoklaf. ${step.dragInstruction}`);
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

  const handleTrayClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (loaded) return;
    playClick();
    setHeld((current) => !current);
  };

  const handleTrayPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
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

  const handleTrayPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const origin = dragOriginRef.current;
    if (!origin) return;
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > DRAG_THRESHOLD_PX) origin.moved = true;
    setDrag((current) => (current ? { ...current, x: event.clientX, y: event.clientY } : current));
    setOver(origin.moved && hitsDropTarget(event.clientX, event.clientY));
  };

  const handleTrayPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const origin = dragOriginRef.current;
    dragOriginRef.current = null;
    setDrag(null);
    setOver(false);
    if (!origin || !origin.moved) return;
    suppressClickRef.current = true;
    if (hitsDropTarget(event.clientX, event.clientY)) load();
  };

  const handleTrayPointerCancel = () => {
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
            onClick={handleTrayClick}
            onPointerDown={handleTrayPointerDown}
            onPointerMove={handleTrayPointerMove}
            onPointerUp={handleTrayPointerUp}
            onPointerCancel={handleTrayPointerCancel}
            onLostPointerCapture={handleTrayPointerCancel}
            aria-pressed={armed}
            aria-label={held ? `${step.trayAccessibleName}, terpilih - pilih autoklaf untuk meletakkannya` : step.trayAccessibleName}
            className={armed ? undefined : 'sterilab-hotspot-pulse'}
            style={{
              position: 'absolute',
              left: S(step.trayRect.x),
              top: S(step.trayRect.y),
              width: `max(44px, ${S(step.trayRect.width)})`,
              height: `max(44px, ${S(step.trayRect.height)})`,
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
              border: `max(2px, 0.156cqw) dashed ${over ? '#1769D2' : '#2F80ED'}`,
              borderRadius: S(18),
              background: over ? 'rgba(47, 128, 237, 0.12)' : 'rgba(47, 128, 237, 0.04)',
              cursor: armed ? 'pointer' : 'default',
              boxShadow: over ? '0 0 14px rgba(47, 128, 237, 0.35)' : 'none',
              transition: 'background 160ms ease-out, border-color 160ms ease-out, box-shadow 160ms ease-out',
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
                transform: `translate(-50%, ${drag.coarse ? '-115%' : '-50%'}) scale(1.08)`,
                pointerEvents: 'none',
                zIndex: 20,
                boxShadow: '0 6px 14px rgba(4, 72, 139, 0.35)',
              }}
            >
              <img src={step.dragObjectSrc} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
            </div>
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

// Prosedur 2's floating card (Figma group "LANGKAH 6", node 309:879 /
// 310:1005 / 310:1140): the same tab and white card as every other
// procedure's, carrying the supplied tray preview only while it is still on
// the bench - once it is loaded the card matches Langkah 1's plain shape.
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
          <img
            aria-hidden="true"
            data-testid="stainless-tray-preview"
            src={step.previewSrc}
            alt=""
            style={{
              marginTop: S(6),
              width: S(THUMB.width),
              maxWidth: '100%',
              height: S(THUMB.height),
              borderRadius: S(12),
              flex: 'none',
              objectFit: 'contain',
            }}
          />
        ) : null}
      </div>

      <FloatingTab label={step.eyebrow} dx={HINT_PILL.dx} />
    </div>
  );
}
