import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { CleanStep, CleanTool } from '../../../../../data/stages/teknikAseptik';
import { CARD_RADIUS, CARD_SHADOW, COLOR, FLOATING_TAB, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 3 - "Membersihkan Meja Kerja" (Figma frame 61:541 "LANGKAH 3 NEW").
// Spray the bench with 70% alcohol, then wipe it down: two passes over the same
// strip with two different tools, and the strip is only clean once every
// segment has been sprayed once and scrubbed `wipePasses` times.
//
// The gesture is the point of this step. A stroke is applied *while the pointer
// moves*, not on release, so dragging left and right across the bench is what
// cleans it - which is why a segment is booked per stroke *direction* rather
// than per pointerdown: sweeping right marks each segment it crosses, and only
// reversing lets that same segment take its second scrub. That is "usap
// bolak-balik" expressed as a rule instead of as a timer.
//
// Two things can start a stroke: the tool tile in the card (drag it out, like
// Langkah 2's APD) and the bench itself (press and sweep, which is what a
// finger reaches for first). Both run the same code path. The keyboard/tap path
// is the segment buttons: each activation applies the live tool once, so the
// step is completable with Enter alone and no pointer at all.

// Langkah 3's floating card (Figma group 229:458): same x and width as Langkah
// 1's, taller because it carries the tool panel.
const CARD = { x: 1428.65, y: 220.129, width: 443.376, minHeight: 440.063 };
const CARD_TAB_DX = 1535.317 - CARD.x;
const CARD_BODY_DY = 237.005 - CARD.y;
const CARD_BODY_MIN_HEIGHT = 423.187;
// Paragraph 229:474 at y 287.823, tool panel 229:593 at y 402.252 (240.352 x
// 228.007), card body bottom 660.192.
const CARD_PAD_TOP = 287.823 - 237.005;
const CARD_TEXT_WIDTH = 346.081;
const CARD_GAP = 402.252 - (287.823 + 89.606);
const PANEL = { width: 240.352, height: 228.007 };
const CARD_PAD_BOTTOM = 660.192 - (402.252 + PANEL.height);

// Pointer travel that separates a sweep from a tap.
const STROKE_THRESHOLD_PX = 6;
// Deadzone before a horizontal reversal counts as a new sweep, so a wobbling
// finger cannot scrub a segment twice without actually going back over it.
const REVERSAL_PX = 18;
const CORRECTION_MS = 3200;
// The last segment has to finish clearing before the note card starts rising.
const SETTLE_MS = 620;

type Phase = 'spray' | 'wipe' | 'done';

interface Cell {
  sprayed: boolean;
  wipes: number;
}

interface DragState {
  x: number;
  y: number;
  // Touch and pen lift the tool clear of the finger; a mouse cursor is small
  // enough to keep it centred.
  coarse: boolean;
}

interface Stroke {
  dir: -1 | 0 | 1;
  // Where the press landed. `moved` is measured from here and never from the
  // previous sample: a steady drag reports ~5px per pointermove, so a
  // sample-to-sample threshold is one a real sweep never crosses.
  originX: number;
  // Furthest point reached in the current direction. A reversal is measured
  // back from this, so a sweep that overshoots and returns is one pass out and
  // one pass back rather than several.
  extremeX: number;
  moved: boolean;
  // Segments already applied in the current sweep. Cleared on every reversal.
  applied: Set<number>;
  // Last segment the pointer was seen on, or null if it was off the bench.
  // A fast flick only reports a handful of pointermove samples, so the sweep
  // fills in every segment between two samples instead of only cleaning the
  // ones a sample happened to land on - which is exactly the difference
  // between a careful drag and a real one on a phone.
  lastIndex: number | null;
}

export function Prosedur03MembersihkanMeja({ step, runtime }: ProcedureProps<CleanStep>) {
  const { exiting, playClick, setMessage, complete } = runtime;
  // One array, not one per tool: whether a segment may be wiped depends on
  // whether *every* segment has been sprayed, and a stroke can apply to several
  // segments between two renders. Splitting that across two states would read
  // one of them stale halfway through a sweep.
  const [cells, setCells] = useState<Cell[]>(() =>
    Array.from({ length: step.segments }, () => ({ sprayed: false, wipes: 0 })),
  );
  const [drag, setDrag] = useState<DragState | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [correction, setCorrection] = useState<string | null>(null);
  const segmentsRef = useRef(new Map<number, HTMLElement>());
  const rectsRef = useRef<{ index: number; box: DOMRect }[]>([]);
  const strokeRef = useRef<Stroke | null>(null);
  const suppressClickRef = useRef(false);
  const correctionTimerRef = useRef(0);
  const after = useTimeouts();

  const sprayedCount = cells.filter((cell) => cell.sprayed).length;
  const wipedCount = cells.filter((cell) => cell.wipes >= step.wipePasses).length;
  const phase: Phase =
    sprayedCount < step.segments ? 'spray' : wipedCount < step.segments ? 'wipe' : 'done';
  const tool = phase === 'wipe' ? step.tools.cloth : step.tools.spray;

  useEffect(() => () => window.clearTimeout(correctionTimerRef.current), []);

  // The click SFX belongs to progress, not to the state updater: an updater can
  // legitimately run twice (StrictMode) and would then double the sound.
  const progressRef = useRef(-1);
  useEffect(() => {
    const progress = sprayedCount + wipedCount;
    const previous = progressRef.current;
    progressRef.current = progress;
    if (previous >= 0 && progress > previous) playClick();
  }, [sprayedCount, wipedCount, playClick]);

  useEffect(() => {
    if (phase === 'done') {
      setMessage(`${step.successTitle} ${step.successBody}`);
      return;
    }
    if (correction) {
      setMessage(correction);
      return;
    }
    setMessage(
      phase === 'spray'
        ? `${sprayedCount} dari ${step.segments} bagian meja tersemprot alkohol.`
        : `${wipedCount} dari ${step.segments} bagian meja selesai diusap.`,
    );
  }, [setMessage, phase, correction, sprayedCount, wipedCount, step]);

  // Fires once, on the commit that finishes the last segment.
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

  // The one place a tool meets a segment, however it got there: mid-sweep, on a
  // tap, or on Enter. Which tool applies is read from the state being updated,
  // so a single sweep that finishes the spraying cannot also start wiping with
  // a phase it captured one render ago.
  const applyTo = useCallback(
    (index: number) => {
      if (exiting) return;
      setCorrection(null);
      setCells((current) => {
        // Spraying is the first pass over the whole bench, not an optional one:
        // nothing may be wiped until every segment is wet.
        if (!current.every((cell) => cell.sprayed)) {
          if (current[index].sprayed) return current;
          const next = [...current];
          next[index] = { ...next[index], sprayed: true };
          return next;
        }
        if (current[index].wipes >= step.wipePasses) return current;
        const next = [...current];
        next[index] = { ...next[index], wipes: next[index].wipes + 1 };
        return next;
      });
    },
    [exiting, step.wipePasses],
  );

  // Segment boxes, measured once per stroke. `getBoundingClientRect` forces
  // layout, and a sweep asks "which segment am I on" on every pointermove -
  // five reads per move at 60-120 moves a second is a layout thrash the step
  // does not need. Nothing moves the segments mid-stroke: they are absolutely
  // positioned on the Stage, so neither the card growing nor a segment
  // repainting can shift them.
  const measureSegments = () => {
    rectsRef.current = [...segmentsRef.current].map(([index, element]) => ({
      index,
      box: element.getBoundingClientRect(),
    }));
  };

  const segmentAt = (clientX: number, clientY: number): number | null => {
    for (const { index, box } of rectsRef.current) {
      if (clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom) {
        return index;
      }
    }
    return null;
  };

  const startStroke = (event: ReactPointerEvent<HTMLElement>) => {
    if (exiting || phase === 'done' || !event.isPrimary) return;
    // A sweep that started on the tool tile never produces a click on a
    // segment, so the suppress flag it sets would otherwise sit armed and eat
    // the Analyst's next real tap. Every click is preceded by its own press, so
    // clearing here can never swallow a live one.
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    measureSegments();
    strokeRef.current = {
      dir: 0,
      originX: event.clientX,
      extremeX: event.clientX,
      moved: false,
      applied: new Set(),
      lastIndex: null,
    };
    setDrag({ x: event.clientX, y: event.clientY, coarse: event.pointerType !== 'mouse' });
  };

  const moveStroke = (event: ReactPointerEvent<HTMLElement>) => {
    const stroke = strokeRef.current;
    if (!stroke) return;
    const x = event.clientX;
    if (Math.abs(x - stroke.originX) > STROKE_THRESHOLD_PX) stroke.moved = true;

    if (stroke.dir === 0) {
      if (stroke.moved) {
        stroke.dir = x >= stroke.originX ? 1 : -1;
        stroke.extremeX = x;
      }
    } else if ((x - stroke.extremeX) * stroke.dir > 0) {
      // Still going the same way.
      stroke.extremeX = x;
    } else if (Math.abs(x - stroke.extremeX) > REVERSAL_PX) {
      // Turned back: a new pass, so every segment it re-crosses counts again.
      stroke.dir = stroke.dir === 1 ? -1 : 1;
      stroke.extremeX = x;
      stroke.applied.clear();
      stroke.lastIndex = null;
    }

    setDrag({ x: event.clientX, y: event.clientY, coarse: event.pointerType !== 'mouse' });
    const index = segmentAt(event.clientX, event.clientY);
    setOver(index);
    if (index === null) {
      stroke.lastIndex = null;
      return;
    }
    if (!stroke.moved) return;
    // Everything between the previous sample and this one, so a flick cannot
    // leave untouched segments behind the pointer. Segments tile the strip
    // without gaps (a floored one only ever overlaps its neighbour), so the
    // span is exactly what the pointer swept over.
    const from = stroke.lastIndex ?? index;
    for (let i = Math.min(from, index); i <= Math.max(from, index); i += 1) {
      if (stroke.applied.has(i)) continue;
      stroke.applied.add(i);
      applyTo(i);
    }
    stroke.lastIndex = index;
  };

  const endStroke = (event: ReactPointerEvent<HTMLElement>) => {
    const stroke = strokeRef.current;
    strokeRef.current = null;
    setDrag(null);
    setOver(null);
    if (!stroke) return;
    if (stroke.moved) {
      // A real sweep never also counts as a click on whatever it started from.
      suppressClickRef.current = true;
      if (stroke.applied.size === 0) showCorrection(step.offSurfaceCorrection);
      return;
    }
    // A press that never moved, released off the bench, is a miss worth
    // explaining rather than swallowing.
    if (segmentAt(event.clientX, event.clientY) === null && stroke.applied.size === 0) {
      showCorrection(step.offSurfaceCorrection);
    }
  };

  const cancelStroke = () => {
    strokeRef.current = null;
    setDrag(null);
    setOver(null);
  };

  const handleSegmentClick = (index: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    applyTo(index);
  };

  const cardAnimation = runtime.cardAnimation;
  const segmentWidth = step.surface.width / step.segments;

  return (
    <>
      <Bench
        step={step}
        cells={cells}
        phase={phase}
        over={over}
        active={!exiting && phase !== 'done'}
        segmentWidth={segmentWidth}
        registerRef={(index, element) => {
          if (element) segmentsRef.current.set(index, element);
          else segmentsRef.current.delete(index);
        }}
        onSelect={handleSegmentClick}
        onPointerDown={startStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerCancel={cancelStroke}
      />

      <CleaningCard
        step={step}
        tool={tool}
        phase={phase}
        held={drag !== null}
        correction={correction}
        animation={cardAnimation}
        onPointerDown={startStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerCancel={cancelStroke}
      />

      {/* Follows the pointer for the length of a stroke. Rendered outside both
          the card and the bench so nothing clips it, and inert so it never eats
          the move events that decide which segment is being cleaned. */}
      {drag && phase !== 'done' ? <ToolGhost tool={tool} drag={drag} spraying={phase === 'spray'} /> : null}
    </>
  );
}

// The bench top: the grime that has to come off, and the segment controls that
// take it off. Both are laid out inside the measured surface rect, so they move
// with the art rather than with a percentage that happens to look right.
function Bench({
  step,
  cells,
  phase,
  over,
  active,
  segmentWidth,
  registerRef,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  step: CleanStep;
  cells: Cell[];
  phase: Phase;
  over: number | null;
  active: boolean;
  segmentWidth: number;
  registerRef: (index: number, element: HTMLElement | null) => void;
  onSelect: (index: number) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
}) {
  const { surface } = step;

  return (
    <>
      {/* Grime, clipped to the painted slab. Purely decorative: every fact it
          carries is also in the live region and in each segment's own
          accessible name. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: S(surface.x),
          top: S(surface.y),
          width: S(surface.width),
          height: S(surface.height),
          overflow: 'hidden',
          borderRadius: S(6),
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {cells.map((cell, index) => (
          <Grime
            key={index}
            index={index}
            width={segmentWidth}
            height={surface.height}
            sprayed={cell.sprayed}
            wiped={cell.wipes / step.wipePasses}
          />
        ))}
      </div>

      {/* One outline for the whole strip, not one per segment: five dashed
          boxes side by side read as stripes painted on the bench rather than
          as "sweep along here". The segments underneath stay separate controls
          - this only says where they are. */}
      {active ? (
        <span
          aria-hidden="true"
          className="sterilab-hotspot-pulse"
          style={{
            position: 'absolute',
            left: S(surface.x),
            top: S(surface.y),
            width: S(surface.width),
            height: S(surface.height),
            // No 44px floor here, unlike the segment buttons underneath: this
            // outline is decorative, and a floored one on a 568px-wide stage
            // would stand ~2.5x taller than the painted slab and read as a box
            // drawn across the back counter.
            borderRadius: S(6),
            border: `max(2px, 0.156cqw) dashed rgba(109, 215, 253, 0.85)`,
            background: 'rgba(109, 215, 253, 0.1)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      ) : null}

      {cells.map((cell, index) => {
        const wiped = cell.wipes >= step.wipePasses;
        const isNext = phase === 'spray' ? !cell.sprayed : !wiped;
        return (
          <Segment
            key={index}
            index={index}
            step={step}
            width={segmentWidth}
            sprayed={cell.sprayed}
            wipes={cell.wipes}
            phase={phase}
            active={active}
            armed={active && isNext}
            hovered={over === index}
            registerRef={(element) => registerRef(index, element)}
            onSelect={() => onSelect(index)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          />
        );
      })}
    </>
  );
}

// One segment's worth of dirt. Three fixed blobs per segment rather than random
// ones, so the same segment looks the same on every render and a screenshot
// diff stays meaningful.
function Grime({
  index,
  width,
  height,
  sprayed,
  wiped,
}: {
  index: number;
  width: number;
  height: number;
  sprayed: boolean;
  wiped: number;
}) {
  // Deterministic per segment - the same segment looks the same on every
  // render, so a screenshot diff still means something. Smudges are wide and
  // shallow rather than round: residue on a bench sits in streaks, and circles
  // at this size read as gravel.
  const smudges = useMemo(() => {
    const seeds = [0.1, 0.27, 0.45, 0.62, 0.79, 0.92];
    return seeds.map((t, i) => {
      const k = (index * 3 + i * 5) % 7;
      return {
        cx: (t + (k % 3) * 0.018) * width,
        cy: (0.28 + (k % 4) * 0.16) * height,
        rx: (0.055 + (k % 3) * 0.022) * width,
        ry: (0.09 + (k % 2) * 0.05) * height,
        rotate: k % 2 === 0 ? -6 : 5,
        opacity: 0.2 + (k % 3) * 0.07,
      };
    });
  }, [index, width, height]);

  const specks = useMemo(() => {
    const seeds = [0.18, 0.36, 0.54, 0.71, 0.87];
    return seeds.map((t, i) => {
      const k = (index * 5 + i * 3) % 9;
      return {
        cx: (t + (k % 4) * 0.012) * width,
        cy: (0.2 + (k % 5) * 0.14) * height,
        r: (0.012 + (k % 2) * 0.008) * width,
        opacity: 0.28 + (k % 3) * 0.08,
      };
    });
  }, [index, width, height]);

  return (
    <div
      style={{
        position: 'absolute',
        left: S(index * width),
        top: 0,
        width: S(width),
        height: S(height),
        // Wiping fades the segment out; spraying only wets it.
        opacity: 1 - wiped,
        transition: 'opacity 260ms ease-out',
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        focusable="false"
      >
        {smudges.map((smudge, i) => (
          <ellipse
            key={`smudge-${i}`}
            cx={smudge.cx}
            cy={smudge.cy}
            rx={smudge.rx}
            ry={smudge.ry}
            fill="#CBBDA2"
            opacity={smudge.opacity * (sprayed ? 0.62 : 1)}
            transform={`rotate(${smudge.rotate} ${smudge.cx} ${smudge.cy})`}
          />
        ))}
        {specks.map((speck, i) => (
          <circle
            key={`speck-${i}`}
            cx={speck.cx}
            cy={speck.cy}
            r={speck.r}
            fill="#9C8B6E"
            opacity={speck.opacity * (sprayed ? 0.6 : 1)}
          />
        ))}
        {/* Sprayed but not yet wiped: the alcohol sits on the surface as a
            sheen, so "wet" is visibly not the same state as "clean". */}
        {sprayed ? <rect x="0" y="0" width={width} height={height} fill="#BFE6FA" opacity="0.26" /> : null}
      </svg>
    </div>
  );
}

// A segment of the bench. Transparent over the art - the grime is the only
// thing that should read as "dirty" - but a real button, so the whole step is
// completable from the keyboard. Floored to a 44x44 touch target like every
// other hit area on this Screen, which on the shortest supported viewport makes
// it taller than the painted slab; that is deliberate, and the grime above is
// what stays inside the slab.
function Segment({
  index,
  step,
  width,
  sprayed,
  wipes,
  phase,
  active,
  armed,
  hovered,
  registerRef,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  index: number;
  step: CleanStep;
  width: number;
  sprayed: boolean;
  wipes: number;
  phase: Phase;
  active: boolean;
  armed: boolean;
  hovered: boolean;
  registerRef: (element: HTMLElement | null) => void;
  onSelect: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
}) {
  const { surface } = step;
  const wiped = wipes >= step.wipePasses;
  const position = `Bagian meja ${index + 1} dari ${step.segments}`;
  const label = wiped
    ? `${position} - sudah bersih`
    : phase === 'wipe'
      ? `${position} - usap dengan lap, ${wipes} dari ${step.wipePasses} usapan`
      : sprayed
        ? `${position} - sudah disemprot alkohol`
        : `${position} - semprot dengan alkohol 70%`;

  return (
    <button
      type="button"
      ref={registerRef}
      onClick={onSelect}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
      disabled={!active}
      aria-label={label}
      style={{
        position: 'absolute',
        left: S(surface.x + index * width + width / 2),
        top: S(surface.y + surface.height / 2),
        transform: 'translate(-50%, -50%)',
        width: `max(44px, ${S(width)})`,
        height: `max(44px, ${S(surface.height)})`,
        zIndex: 3,
        padding: 0,
        borderRadius: S(6),
        border: 'none',
        // The strip outline above says where to sweep; a segment only lights up
        // while the pointer is actually on it, and only while it still has
        // something left to do.
        background: hovered && armed ? 'rgba(109, 215, 253, 0.34)' : 'transparent',
        cursor: active ? (wiped ? 'default' : 'grab') : 'default',
        // Without this a touch sweep scrolls the page instead of cleaning the
        // bench - the single most common way a drag "does not work on mobile".
        touchAction: 'none',
        transition: 'background 160ms ease-out, border-color 160ms ease-out',
      }}
    />
  );
}

// The tool riding the pointer, plus the spray cone while the bottle is live.
function ToolGhost({ tool, drag, spraying }: { tool: CleanTool; drag: DragState; spraying: boolean }) {
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
      {spraying ? (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '78%',
            width: `max(48px, ${S(120)})`,
            height: `max(30px, ${S(74)})`,
            transform: 'translate(-10%, -50%)',
            background: 'radial-gradient(circle at 0% 50%, rgba(143, 211, 244, 0.75), rgba(143, 211, 244, 0) 70%)',
            borderRadius: '50%',
          }}
        />
      ) : null}
      <img
        src={tool.src}
        alt=""
        style={{
          position: 'relative',
          width: `max(56px, ${S(tool.width)})`,
          height: 'auto',
          display: 'block',
          transform: 'scale(1.06)',
          filter: 'drop-shadow(0 0.4cqw 0.8cqw rgba(4, 72, 139, 0.35))',
        }}
      />
    </div>
  );
}

// Prosedur 3's floating card (Figma group 229:458): the shared tab and white
// card, carrying the phase's instruction and the tool the Analyst drags out.
function CleaningCard({
  step,
  tool,
  phase,
  held,
  correction,
  animation,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  step: CleanStep;
  tool: CleanTool;
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
        top: S(FLOATING_TAB.y),
        width: S(CARD.width),
        zIndex: 4,
        animationDelay: `${animation.delay}ms`,
      }}
    >
      <div
        style={{
          marginTop: S(CARD_BODY_DY - (FLOATING_TAB.y - CARD.y)),
          minHeight: S(CARD_BODY_MIN_HEIGHT),
          background: '#FFFFFF',
          border: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: S(CARD_GAP),
          padding: `${S(CARD_PAD_TOP)} ${S(18)} ${S(CARD_PAD_BOTTOM)}`,
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
          {phase === 'wipe' ? step.wipeHint : step.sprayHint}
        </span>

        <ToolPanel
          tool={tool}
          done={phase === 'done'}
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

// The light panel holding the live tool (Figma group 229:593). The tool itself
// is a button so it can be dragged out with a pointer *and* announced properly;
// activating it from the keyboard does nothing on its own, which is why its
// accessible description sends the Analyst to the bench controls instead.
function ToolPanel({
  tool,
  done,
  held,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  tool: CleanTool;
  done: boolean;
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
        aria-label={tool.name}
        data-testid={`tool-${tool.id}`}
        onPointerDown={done ? undefined : onPointerDown}
        onPointerMove={done ? undefined : onPointerMove}
        onPointerUp={done ? undefined : onPointerUp}
        onPointerCancel={done ? undefined : onPointerCancel}
        onLostPointerCapture={done ? undefined : onPointerCancel}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
          minHeight: 44,
          cursor: done ? 'default' : 'grab',
          opacity: held ? 0.35 : 1,
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
