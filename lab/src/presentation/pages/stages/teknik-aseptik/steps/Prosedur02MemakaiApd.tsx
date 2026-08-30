import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import checkboxCheckedUrl from '../../../../../../assets/images/01_reusable/icons/checkbox_checked.png';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { ApdItem, ApdPlacement, EquipStep } from '../../../../../data/stages/teknikAseptik';
import { CARD_RADIUS, CARD_SHADOW, COLOR, FLOATING_TAB, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 2 - "Memakai APD" (Figma frame 58:2). Carry each of the six pieces
// of protective equipment from the grid onto the matching part of the analyst,
// then confirm.
//
// The Figma frame draws this as a checklist - tick six boxes, press Selesai -
// and that is what this used to be on a phone, because six drop targets did not
// fit on an analyst who is ~67 CSS px wide at 568x320. They do now: the sockets
// are laid out so the two crowded ones step off the body and point back at it
// with a leader line (see the socket table in data/stages/teknikAseptik.ts), and
// the drag is one pointer-event path with no viewport branch in it. A phone and
// a desktop run exactly the same interaction, which is also the only version
// that teaches *where* each item goes rather than only that it exists.

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
  badge: 39.677,
  rowGap: 5,
  // Row 0: badge above the art (Figma checkbox row at y=331.724, art ink
  // centred on y=475). Row 1 mirrors it, badge below (y=695.394).
  row0Gap: 18.755,
  row0ArtHeight: 170,
  row1Gap: 29.39,
  row1ArtHeight: 101,
};
const APD_CONFIRM = { minWidth: 199.95, height: 44.937, dy: 775.634 - APD_GRID.bottom };
const APD_CARD_PAD_BOTTOM = 847.596 - (775.634 + APD_CONFIRM.height);

// Drop target on the analyst, floored to 44px like every other hit area.
const SOCKET_SIZE = 84;
// How far outside a socket still counts as a drop on it, as a multiple of its
// radius. A 44px circle under a fingertip is smaller than the finger covering
// it, so a strict hit test loses drops that were visually on target. Widening
// cannot send an item to the wrong body part: the *nearest* socket in range
// wins, and a drop out of range of every socket is simply refused.
const DROP_TOLERANCE = 1.6;
// Pointer travel that turns a press into a drag rather than a select.
const DRAG_THRESHOLD_PX = 6;
const CORRECTION_MS = 3200;
// The suited-up art has to be on screen before the note card starts rising.
const SETTLE_MS = 620;

interface DragState {
  id: string;
  x: number;
  y: number;
  // Touch and pen drags lift the ghost clear of the finger; a mouse cursor is
  // small enough to keep it centred.
  coarse: boolean;
}

export function Prosedur02MemakaiApd({ step, runtime }: ProcedureProps<EquipStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  // Which items are on the analyst, which one is picked up, which one is under
  // the pointer right now, and whether Selesai has been pressed (the only
  // moment the art can change).
  const [placed, setPlaced] = useState<string[]>([]);
  const [held, setHeld] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [correction, setCorrection] = useState<string | null>(null);
  const socketsRef = useRef(new Map<string, HTMLElement>());
  const dragOriginRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const correctionTimerRef = useRef(0);
  const after = useTimeouts();

  useEffect(() => () => window.clearTimeout(correctionTimerRef.current), []);

  // Layout, not passive: Selesai is the one moment the art may change, and it
  // has to change in the same commit as the press rather than a paint later.
  useLayoutEffect(() => {
    setFrame({
      src: confirmed ? step.completedBackground : step.initialBackground,
      alt: confirmed ? step.completedBackgroundAlt : step.initialBackgroundAlt,
      rect: step.backgroundRect,
    });
  }, [setFrame, confirmed, step]);

  useEffect(() => {
    if (confirmed) {
      setMessage(`${step.successTitle} ${step.successBody}`);
      return;
    }
    if (correction) {
      setMessage(correction);
      return;
    }
    setMessage(
      placed.length >= step.items.length
        ? `Seluruh APD terpasang. Tekan ${step.confirmLabel} untuk melanjutkan.`
        : `${placed.length} dari ${step.items.length} APD terpasang.`,
    );
  }, [setMessage, confirmed, correction, placed, step]);

  const showCorrection = (message: string) => {
    setCorrection(message);
    window.clearTimeout(correctionTimerRef.current);
    correctionTimerRef.current = window.setTimeout(() => setCorrection(null), CORRECTION_MS);
  };

  // One place where an item meets a socket, whichever way it got there: a drop
  // at the end of a drag, a tap on a socket after picking an item up, or the
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

  // Tap path, kept alongside the drag for the keyboard and for anyone who finds
  // dragging awkward: pick an item up, then tap the body part it belongs on.
  const handleItemClick = (item: ApdItem) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (confirmed) return;
    if (placed.includes(item.id)) {
      unequip(item);
      return;
    }
    playClick();
    setHeld((current) => (current === item.id ? null : item.id));
  };

  const handleItemPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, item: ApdItem) => {
    if (confirmed || placed.includes(item.id) || !event.isPrimary) return;
    // Capture on the tile itself, so a finger that slides off it (which it will
    // - the analyst is on the other side of the stage) keeps sending moves here
    // instead of dropping the drag the moment it leaves the button.
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOriginRef.current = { x: event.clientX, y: event.clientY, moved: false };
    setDrag({ id: item.id, x: event.clientX, y: event.clientY, coarse: event.pointerType !== 'mouse' });
  };

  const handleItemPointerMove = (event: ReactPointerEvent<HTMLButtonElement>, item: ApdItem) => {
    const origin = dragOriginRef.current;
    if (!origin || drag?.id !== item.id) return;
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > DRAG_THRESHOLD_PX) origin.moved = true;
    setDrag({ id: item.id, x: event.clientX, y: event.clientY, coarse: drag.coarse });
    setOver(origin.moved ? (socketAt(socketsRef.current, step.items, event.clientX, event.clientY)?.id ?? null) : null);
  };

  const handleItemPointerUp = (event: ReactPointerEvent<HTMLButtonElement>, item: ApdItem) => {
    const origin = dragOriginRef.current;
    dragOriginRef.current = null;
    setDrag(null);
    setOver(null);
    if (!origin || !origin.moved) return;
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
    setOver(null);
  };

  const handleConfirm = () => {
    if (placed.length < step.items.length || confirmed) return;
    playClick();
    setHeld(null);
    setConfirmed(true);
    if (prefersReducedMotion()) {
      complete();
      return;
    }
    after(SETTLE_MS, complete);
  };

  const dragItem = step.items.find((item) => item.id === drag?.id) ?? null;
  const heldItem = step.items.find((item) => item.id === held) ?? null;

  return (
    <>
      {!confirmed && !exiting
        ? step.items.map((item) => (
            <ApdSocket
              key={item.id}
              item={item}
              // Two authored layouts, not one scaled one: a 44px-floored circle
              // on a 568px stage is nearly twice its designed size, so the set
              // that fits the analyst at desktop sizes has to come apart below
              // the breakpoint. See the socket table in data/stages.
              placement={runtime.isMobile ? item.placement.compact : item.placement.wide}
              filled={placed.includes(item.id)}
              armed={held !== null || drag !== null}
              hovered={over === item.id}
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

      <ApdCard
        step={step}
        placed={placed}
        held={held}
        dragging={drag?.id ?? null}
        correction={correction}
        confirmed={confirmed}
        animation={runtime.cardAnimation}
        onItemClick={handleItemClick}
        onItemPointerDown={handleItemPointerDown}
        onItemPointerMove={handleItemPointerMove}
        onItemPointerUp={handleItemPointerUp}
        onItemPointerCancel={handleItemPointerCancel}
        onConfirm={handleConfirm}
      />

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
            width: `max(56px, ${S(dragItem.width)})`,
            transform: `translate(-50%, ${drag.coarse ? '-115%' : '-50%'}) scale(1.08)`,
            pointerEvents: 'none',
            zIndex: 20,
            filter: 'drop-shadow(0 0.4cqw 0.8cqw rgba(4, 72, 139, 0.35))',
          }}
        />
      ) : null}
    </>
  );
}

// Which socket, if any, a released pointer counts as landing on. Kept out of
// the component so the drop rule is one readable function: the nearest socket
// within DROP_TOLERANCE of its own radius wins, and nothing else counts.
function socketAt(
  sockets: Map<string, HTMLElement>,
  items: ApdItem[],
  clientX: number,
  clientY: number,
): ApdItem | null {
  let best: ApdItem | null = null;
  let bestDistance = Infinity;
  for (const item of items) {
    const element = sockets.get(item.id);
    if (!element) continue;
    const box = element.getBoundingClientRect();
    const distance = Math.hypot(clientX - (box.left + box.width / 2), clientY - (box.top + box.height / 2));
    if (distance > (box.width / 2) * DROP_TOLERANCE || distance >= bestDistance) continue;
    bestDistance = distance;
    best = item;
  }
  return best;
}

// Prosedur 2's floating card (Figma group 62:799): the same tab and white card
// as Prosedur 1's, carrying the 3x2 APD grid and the Selesai button.
function ApdCard({
  step,
  placed,
  held,
  dragging,
  correction,
  confirmed,
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
  animation: Animation;
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

// One cell of the APD grid, and the source of one drag. Row 0 stacks the badge
// above the art and row 1 below it, mirroring the Figma frame;
// `column-reverse` keeps the DOM order (badge, then art) identical in both so a
// screen reader reads them the same way round.
function ApdCell({
  item,
  placed,
  held,
  dragging,
  confirmed,
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
  onClick: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: () => void;
}) {
  const artHeight = item.row === 0 ? APD_GRID.row0ArtHeight : APD_GRID.row1ArtHeight;
  const label = placed
    ? `${item.name} sudah terpasang di ${item.bodyPart.toLowerCase()}`
    : `${item.name}, seret ke ${item.bodyPart.toLowerCase()} analis`;

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
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
        cursor: confirmed ? 'default' : placed ? 'pointer' : 'grab',
        // The art follows the pointer instead; leaving the tile's own copy up
        // would read as two of the same item.
        opacity: dragging ? 0.35 : 1,
        // Without this a touch drag scrolls (or rubber-bands) the page instead
        // of moving the item - the single most common way a drag "does not work
        // on mobile".
        touchAction: 'none',
        transition: 'background 160ms ease-out, opacity 160ms ease-out',
      }}
    >
      {placed ? (
        <img
          src={checkboxCheckedUrl}
          alt=""
          aria-hidden="true"
          style={{
            width: `max(14px, ${S(APD_GRID.badge)})`,
            height: `max(14px, ${S(APD_GRID.badge)})`,
            flex: 'none',
          }}
        />
      ) : (
        <DragBadge active={held} />
      )}
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

// What the empty checkbox used to be. The step is a drag now, so the slot that
// reported "not ticked yet" reports "this one is draggable" instead - the grip
// is the only thing on the tile that says so before the Analyst tries it.
function DragBadge({ active }: { active: boolean }) {
  const size = `max(14px, ${S(APD_GRID.badge)})`;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: `max(1.5px, 0.1cqw) ${active ? 'solid' : 'dashed'} ${COLOR.pillBlue}`,
        background: active ? COLOR.pillBlue : 'rgba(52, 113, 199, 0.10)',
        transition: 'background 160ms ease-out',
      }}
    >
      <svg viewBox="0 0 12 12" style={{ width: '58%', height: '58%', display: 'block' }} focusable="false">
        {[3, 6, 9].map((cy) =>
          [4, 8].map((cx) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.05" fill={active ? '#FFFFFF' : COLOR.pillBlue} />
          )),
        )}
      </svg>
    </span>
  );
}

// A drop target on the analyst. Unlabelled on purpose - knowing that goggles go
// over the eyes and not over the mouth is the thing this procedure is teaching -
// but its accessible name spells the body part out, so the keyboard/screen
// reader path is not a guessing game.
function ApdSocket({
  item,
  placement,
  filled,
  armed,
  hovered,
  registerRef,
  onSelect,
}: {
  item: ApdItem;
  placement: ApdPlacement;
  filled: boolean;
  armed: boolean;
  hovered: boolean;
  registerRef: (element: HTMLElement | null) => void;
  onSelect: () => void;
}) {
  const { socket, anchor } = placement;
  // A socket that had to stand off its body part to keep a floored circle's
  // worth of clearance from its neighbour: the hairline and the dot at its end
  // are what say "this spot", not the circle's own position.
  const leader = anchor
    ? {
        length: Math.hypot(anchor.x - socket.x, anchor.y - socket.y),
        angle: (Math.atan2(anchor.y - socket.y, anchor.x - socket.x) * 180) / Math.PI,
      }
    : null;

  return (
    <>
      {leader ? (
        <>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: S(socket.x),
              top: S(socket.y),
              width: S(leader.length),
              height: 'max(2px, 0.13cqw)',
              background: filled ? 'rgba(0, 140, 59, 0.75)' : 'rgba(4, 72, 139, 0.7)',
              transformOrigin: '0 50%',
              transform: `translateY(-50%) rotate(${leader.angle}deg)`,
              zIndex: 2,
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: S(anchor!.x),
              top: S(anchor!.y),
              width: `max(6px, ${S(12)})`,
              height: `max(6px, ${S(12)})`,
              borderRadius: '50%',
              background: filled ? COLOR.successGreen : COLOR.navy,
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
        className={armed && !filled && !hovered ? 'sterilab-hotspot-pulse' : undefined}
        style={{
          position: 'absolute',
          left: S(socket.x),
          top: S(socket.y),
          transform: `translate(-50%, -50%) scale(${hovered ? 1.12 : 1})`,
          width: `max(44px, ${S(SOCKET_SIZE)})`,
          height: `max(44px, ${S(SOCKET_SIZE)})`,
          zIndex: 3,
          padding: 0,
          borderRadius: '50%',
          border: filled
            ? `max(2px, 0.156cqw) solid ${COLOR.successGreen}`
            : `max(2px, 0.156cqw) ${hovered ? 'solid' : 'dashed'} ${COLOR.navy}`,
          background: filled
            ? 'rgba(255, 255, 255, 0.92)'
            : hovered
              ? 'rgba(52, 113, 199, 0.32)'
              : 'rgba(255, 255, 255, 0.34)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: armed || filled ? 'pointer' : 'default',
          transition: 'background 160ms ease-out, border-color 160ms ease-out, transform 160ms ease-out',
        }}
      >
        {filled ? (
          <img src={item.src} alt="" aria-hidden="true" style={{ width: '68%', height: 'auto', pointerEvents: 'none' }} />
        ) : null}
      </button>
    </>
  );
}
