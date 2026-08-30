import { useEffect, useLayoutEffect, useState } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import { SOAP_ART } from '../../../../../data/stages/teknikAseptik';
import type { SequenceStep, StepAction } from '../../../../../data/stages/teknikAseptik';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, rectStyle, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 1 - "Cuci tangan" (Figma frame 42:679). Click the right object next
// and the workspace cuts to the next frame; three clicks in order finish the
// step.
//
// Everything the procedure owns lives here: which actions have landed, which
// frame that means, which pills are showing, and when the step is done. The
// shell knows none of it.

const HINT_CARD = { x: 1428.649, y: 221.17, width: 443.377 };
const HINT_PILL = { dx: 106.668 };
const HINT_BODY = { dy: 16.875, minHeight: 124.496, textWidth: 330.871 };

// The finished background needs to be on screen before the note card starts
// rising, or the Analyst reads "Tangan telah dibersihkan!" over hands that are
// still under the tap.
const SETTLE_MS = 620;

export function Prosedur01CuciTangan({ step, runtime }: ProcedureProps<SequenceStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  // How many of the step's actions have landed - also the index of the
  // background frame, since the four frames are authored in click order.
  const [doneCount, setDoneCount] = useState(0);
  const after = useTimeouts();

  const src = doneCount === 0 ? step.initialBackground : step.actions[doneCount - 1].background;

  // Layout, not passive: the art is the feedback for the click that just
  // landed, so it has to be swapped in the same commit. A passive effect would
  // let the browser paint one frame of the *previous* action's art after the
  // click that finished this one.
  useLayoutEffect(() => {
    setFrame({ src, alt: step.initialBackgroundAlt, rect: step.backgroundRect });
  }, [setFrame, src, step.initialBackgroundAlt, step.backgroundRect]);

  useEffect(() => {
    setMessage(
      doneCount >= step.actions.length
        ? `${step.successTitle} ${step.successBody}`
        : `Tindakan ${doneCount} dari ${step.actions.length} selesai. Berikutnya: ${step.actions[doneCount].accessibleName}.`,
    );
  }, [setMessage, doneCount, step]);

  const handleAction = (action: StepAction) => {
    if (action.order !== doneCount + 1) return;
    playClick();
    const next = doneCount + 1;
    setDoneCount(next);
    if (next < step.actions.length) return;
    if (prefersReducedMotion()) {
      complete();
      return;
    }
    after(SETTLE_MS, complete);
  };

  return (
    <>
      {/* The soap bottle is its own Figma layer (60:303); the background frames
          never contain it, so it rides on top of whichever frame is live. */}
      <img src={SOAP_ART.src} alt="" aria-hidden="true" style={{ position: 'absolute', ...rectStyle(SOAP_ART.rect) }} />

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
        // Progressive reveal: a pill appears when its action becomes the next
        // one, and stays (dimmed, trail off) once done, so the finished order is
        // still readable at the end of the step.
        .filter((action) => action.order <= doneCount + 1)
        .map((action) => (
          <HelperPill key={action.id} action={action} done={action.order <= doneCount} />
        ))}

      <HintCard step={step} animation={runtime.cardAnimation} />
    </>
  );
}

// Prosedur 1's floating card (Figma group 60:304): a blue tab overlapping the
// top edge of a bordered white card holding one line of instruction.
function HintCard({ step, animation }: { step: SequenceStep; animation: Animation }) {
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
