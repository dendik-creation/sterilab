import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { SortBin, SortItem, SortStep, WasteBinId } from '../../../../../data/stages/pengelolaanLimbah';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 4 - "Memilah Limbah Laboratorium" (Figma frames "6.4 - A/B"). Drag
// each of the five items on the bench into the bin matching its waste
// category - the same dual drag/tap path as Stage 4's APD equip
// (teknik-aseptik/Prosedur02MemakaiApd.tsx), generalised from one item and
// one target to five items and three targets.
//
// Figma's background photo for this frame never shows the items at all -
// they are five separate cut-out sprites layered on top of an otherwise
// empty bench (Figma nodes 313:1879-1883, "removebg-preview"), so a sorted
// item disappearing from the table is simply that layer no longer being
// drawn, not a hack standing in for missing art the way the checkmark badge
// in Langkah 1 is.

// HINT_CARD.y is the floating tab's own origin (Figma group 311:1643's inset
// top, 17.87% of 1080 = 193.0) - not the white card's top (explicitly
// top-[215px]), which sits 22px below it. Getting those two swapped once
// left the tab overlapping the card's own first line of text.
const HINT_CARD = { x: 1390, y: 193, width: 426 };
const HINT_PILL = { dx: 98 };
const HINT_BODY = { dy: 215 - 193, minHeight: 234 };

const DRAG_THRESHOLD_PX = 6;
const DROP_PADDING_PX = 20;
const GHOST_WIDTH_PX = 84;
// The thumbs-up plate needs to be on screen before the note card starts
// rising, or the Analyst reads "Pengelolaan limbah selesai" over a bench
// that still has something on it.
const SETTLE_MS = 620;

interface DragState {
  id: string;
  x: number;
  y: number;
  coarse: boolean;
}

export function Prosedur04MemilahLimbahLaboratorium({ step, runtime }: ProcedureProps<SortStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [placed, setPlaced] = useState<string[]>([]);
  const [held, setHeld] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [over, setOver] = useState<WasteBinId | null>(null);
  const [correction, setCorrection] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  const binRefs = useRef(new Map<WasteBinId, HTMLElement>());
  const dragOriginRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const correctionTimerRef = useRef(0);
  const after = useTimeouts();

  const allPlaced = placed.length >= step.items.length;
  const binLabel = (id: WasteBinId) => step.bins.find((bin) => bin.id === id)?.label ?? id;

  useEffect(() => () => window.clearTimeout(correctionTimerRef.current), []);

  // Layout, not passive: the art is the feedback for the drop that just
  // landed, so it has to swap in the same commit as the state update - same
  // reason every other procedure on this stage uses useLayoutEffect here.
  useLayoutEffect(() => {
    setFrame({
      src: settled ? step.doneBackground : step.initialBackground,
      alt: settled ? step.doneBackgroundAlt : step.initialBackgroundAlt,
      rect: step.backgroundRect,
    });
  }, [setFrame, settled, step]);

  useEffect(() => {
    if (settled) {
      setMessage(`${step.successTitle} ${step.successBody}`);
      return;
    }
    if (correction) {
      setMessage(correction);
      return;
    }
    setMessage(`${placed.length} dari ${step.items.length} limbah sudah dipilah.`);
  }, [setMessage, settled, correction, placed, step]);

  const showCorrection = (message: string) => {
    setCorrection(message);
    window.clearTimeout(correctionTimerRef.current);
    correctionTimerRef.current = window.setTimeout(() => setCorrection(null), 3200);
  };

  // One place where an item meets a bin, whichever way it got there: a drop
  // at the end of a drag, or a tap on a bin after picking an item up.
  const place = (item: SortItem, bin: SortBin) => {
    if (allPlaced || placed.includes(item.id)) return;
    if (item.bin !== bin.id) {
      // Wrong bin is refused, but refused out loud - a silent snap-back
      // would not teach which category the item actually belongs to.
      showCorrection(`${item.accessibleName} adalah limbah ${binLabel(item.bin)}, bukan ${bin.label}.`);
      return;
    }
    playClick();
    setCorrection(null);
    setHeld(null);
    const next = [...placed, item.id];
    setPlaced(next);
    if (next.length < step.items.length) return;
    setSettled(true);
    if (prefersReducedMotion()) {
      complete();
      return;
    }
    after(SETTLE_MS, complete);
  };

  const handleItemClick = (item: SortItem) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (allPlaced) return;
    playClick();
    setHeld((current) => (current === item.id ? null : item.id));
  };

  const handleItemPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, item: SortItem) => {
    if (allPlaced || !event.isPrimary) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOriginRef.current = { x: event.clientX, y: event.clientY, moved: false };
    setDrag({ id: item.id, x: event.clientX, y: event.clientY, coarse: event.pointerType !== 'mouse' });
  };

  const binAt = (x: number, y: number): SortBin | null => {
    for (const bin of step.bins) {
      const box = binRefs.current.get(bin.id)?.getBoundingClientRect();
      if (!box) continue;
      if (x >= box.left - DROP_PADDING_PX && x <= box.right + DROP_PADDING_PX && y >= box.top - DROP_PADDING_PX && y <= box.bottom + DROP_PADDING_PX) {
        return bin;
      }
    }
    return null;
  };

  const handleItemPointerMove = (event: ReactPointerEvent<HTMLButtonElement>, item: SortItem) => {
    const origin = dragOriginRef.current;
    if (!origin || drag?.id !== item.id) return;
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > DRAG_THRESHOLD_PX) origin.moved = true;
    setDrag({ id: item.id, x: event.clientX, y: event.clientY, coarse: drag.coarse });
    setOver(origin.moved ? (binAt(event.clientX, event.clientY)?.id ?? null) : null);
  };

  const handleItemPointerUp = (event: ReactPointerEvent<HTMLButtonElement>, item: SortItem) => {
    const origin = dragOriginRef.current;
    dragOriginRef.current = null;
    setDrag(null);
    setOver(null);
    if (!origin || !origin.moved) return;
    suppressClickRef.current = true;
    const bin = binAt(event.clientX, event.clientY);
    if (bin) place(item, bin);
  };

  const handleItemPointerCancel = () => {
    dragOriginRef.current = null;
    setDrag(null);
    setOver(null);
  };

  const armed = held !== null || drag !== null;
  const heldItem = step.items.find((item) => item.id === held) ?? null;
  const dragItem = step.items.find((item) => item.id === drag?.id) ?? null;

  return (
    <>
      {!allPlaced && !exiting
        ? step.items
            .filter((item) => !placed.includes(item.id))
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                onPointerDown={(event) => handleItemPointerDown(event, item)}
                onPointerMove={(event) => handleItemPointerMove(event, item)}
                onPointerUp={(event) => handleItemPointerUp(event, item)}
                onPointerCancel={handleItemPointerCancel}
                onLostPointerCapture={handleItemPointerCancel}
                aria-pressed={held === item.id}
                aria-label={held === item.id ? `${item.accessibleName}, terpilih - pilih tempat sampah yang sesuai` : item.accessibleName}
                className={held === item.id || drag?.id === item.id ? undefined : 'sterilab-hotspot-pulse'}
                style={{
                  position: 'absolute',
                  left: S(item.rect.x),
                  top: S(item.rect.y),
                  width: `max(44px, ${S(item.rect.width)})`,
                  height: `max(44px, ${S(item.rect.height)})`,
                  zIndex: 3,
                  padding: 0,
                  border: 'none',
                  borderRadius: S(12),
                  background: 'transparent',
                  cursor: 'grab',
                  opacity: drag?.id === item.id ? 0.35 : 1,
                  transform: held === item.id ? 'scale(1.06)' : 'scale(1)',
                  filter: held === item.id ? 'drop-shadow(0 0 0.6cqw rgba(109, 215, 253, 0.9))' : 'none',
                  touchAction: 'none',
                  transition: 'transform 160ms ease-out, opacity 160ms ease-out, filter 160ms ease-out',
                }}
              >
                <img src={item.src} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
              </button>
            ))
        : null}

      {!allPlaced && !exiting
        ? step.bins.map((bin) => (
            <button
              key={bin.id}
              type="button"
              ref={(element) => {
                if (element) binRefs.current.set(bin.id, element);
                else binRefs.current.delete(bin.id);
              }}
              onClick={() => {
                if (heldItem) place(heldItem, bin);
              }}
              disabled={!armed}
              aria-label={bin.accessibleName}
              className={armed && over !== bin.id ? 'sterilab-hotspot-pulse' : undefined}
              style={{
                position: 'absolute',
                left: S(bin.rect.x),
                top: S(bin.rect.y),
                width: S(bin.rect.width),
                height: S(bin.rect.height),
                zIndex: 2,
                padding: 0,
                border: `max(2px, 0.156cqw) ${over === bin.id ? 'solid' : 'dashed'} ${COLOR.hotspotBorder}`,
                borderRadius: S(18),
                background: over === bin.id ? 'rgba(109, 215, 253, 0.4)' : 'rgba(255, 255, 255, 0.16)',
                cursor: armed ? 'pointer' : 'default',
                transition: 'background 160ms ease-out, border-style 160ms ease-out',
              }}
            />
          ))
        : null}

      {/* Follows the pointer while an item is being dragged. Rendered outside
          the item itself so it is never clipped, and inert so it never eats
          the pointerup that decides where the item lands. */}
      {drag && dragItem ? (
        <img
          src={dragItem.src}
          alt=""
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: drag.x,
            top: drag.y,
            width: `max(56px, ${GHOST_WIDTH_PX}px)`,
            transform: `translate(-50%, ${drag.coarse ? '-115%' : '-50%'}) scale(1.08)`,
            pointerEvents: 'none',
            zIndex: 20,
            filter: 'drop-shadow(0 0.4cqw 0.8cqw rgba(4, 72, 139, 0.35))',
          }}
        />
      ) : null}

      <HintCard step={step} animation={runtime.cardAnimation} />
    </>
  );
}

// Prosedur 4's floating card (Figma group "LANGKAH 6", node 311:1643 /
// 313:1892) - same tab and white card as every other procedure's, just
// moved to the right of the bench alongside the PROSEDUR card (see
// ProcedureCard.tsx's `position` override).
function HintCard({ step, animation }: { step: SortStep; animation: Animation }) {
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
          {step.instruction}
        </span>
      </div>

      <FloatingTab label={step.eyebrow} dx={HINT_PILL.dx} />
    </div>
  );
}
