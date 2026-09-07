import { useEffect, useLayoutEffect, useState } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { AssembleStep } from '../../../../../data/stages/kulturMikroba';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { ClickHotspot } from '../ClickHotspot';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 6 - "Menuangkan Media" (Figma frames "5.6 - A/B/C/D"). Pour the
// sterile media from the Erlenmeyer into each Petri dish before it sets - a
// straight three-click chain, the same shape as Prosedur 4's own assembly
// sequence: click the right object next and the art cuts to the next plate.
// This is the stage's last Langkah, so the finished plate's success note is
// also the whole Stage's own completion note.
//
// Everything the procedure owns lives here: how many actions have landed,
// which plate that implies, and when the step is done. The shell knows none
// of it.

const HINT_CARD = { x: 1437, y: 221.17, width: 426 };
const HINT_PILL = { dx: 98 };
const HINT_BODY = { dy: 242 - 221.17, minHeight: 244 - (242 - 221.17) };

// The finished plate needs to be on screen before the note card starts
// rising, or the Analyst reads "Pembuatan media berhasil!" over dishes that
// still look like they're mid-pour.
const SETTLE_MS = 460;

export function Prosedur06MenuangkanMedia({ step, runtime }: ProcedureProps<AssembleStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [doneCount, setDoneCount] = useState(0);
  const after = useTimeouts();

  const frame = step.frames[doneCount];
  const finished = doneCount >= step.frames.length - 1;

  // Layout, not passive: the art is the feedback for the click that just
  // landed, so it has to be swapped in the same commit as the state update.
  useLayoutEffect(() => {
    setFrame({ src: frame.src, alt: frame.alt, rect: step.backgroundRect });
  }, [setFrame, frame, step.backgroundRect]);

  useEffect(() => {
    setMessage(
      finished
        ? `${step.successTitle} ${step.successBody}`
        : `Tindakan ${doneCount} dari ${step.frames.length - 1} selesai. Berikutnya: ${frame.hotspotAccessibleName}.`,
    );
  }, [setMessage, finished, doneCount, frame, step]);

  const handleAction = () => {
    if (finished) return;
    playClick();
    const next = doneCount + 1;
    if (next < step.frames.length - 1) {
      setDoneCount(next);
      return;
    }
    // Last click: land on the finished plate, then let it settle before the
    // note card rises.
    setDoneCount(next);
    if (prefersReducedMotion()) {
      complete();
      return;
    }
    after(SETTLE_MS, complete);
  };

  return (
    <>
      {frame.hotspot && frame.hotspotAccessibleName && !exiting ? (
        <ClickHotspot rect={frame.hotspot} accessibleName={frame.hotspotAccessibleName} onSelect={handleAction} />
      ) : null}

      <HintCard step={step} animation={runtime.cardAnimation} />
    </>
  );
}

// Same floating card shape as Prosedur 1-5's own (Figma group "LANGKAH 6"):
// a blue tab overlapping a bordered white card with the task description, an
// "Instruksi :" label and the click instruction below it.
function HintCard({ step, animation }: { step: AssembleStep; animation: Animation }) {
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

        <span style={{ width: '100%', height: 'max(1px, 0.078cqw)', background: COLOR.divider }} />

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
