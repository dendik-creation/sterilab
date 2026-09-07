import { useEffect, useLayoutEffect, useState } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { MeasureFrame, MeasureStep } from '../../../../../data/stages/kulturMikroba';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { ClickHotspot } from '../ClickHotspot';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 3 - "Mengatur pH Media" (Figma frames "5.3 - A/B/C"). Click the pH
// meter, read the measurement, then settle on the result - the art cuts to
// the next plate on the click, and again on its own once the reading has
// held long enough.
//
// Everything the procedure owns lives here: which phase this is, which plate
// that implies, and when the step is done. The shell knows none of it.

type Phase = 'idle' | 'measuring' | 'done';

const HINT_CARD = { x: 1437, y: 221.17, width: 426 };
const HINT_PILL = { dx: 98 };
// Langkah 3's card is shorter than Langkah 1/2's (230 vs 247 design px): the
// instruction text is one line shorter, so the card itself sits ~17px less
// tall rather than leaving a gap at the bottom.
const HINT_BODY = { dy: 242 - 221.17, minHeight: 230 - (242 - 221.17) };

const PHASE_INDEX: Record<Phase, number> = { idle: 0, measuring: 1, done: 2 };

// The pH meter's own LCD readout, centred over its display (Figma nodes
// 288:1452 / 288:1453 - left drifts a few px between the two purely from
// Figma's own per-string kerning, so a single centred point covers both).
const READOUT = { x: 1097, y: 843 };

export function Prosedur03MengaturPh({ step, runtime }: ProcedureProps<MeasureStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [phase, setPhase] = useState<Phase>('idle');
  const after = useTimeouts();

  const frame: MeasureFrame = step.frames[PHASE_INDEX[phase]];

  // Layout, not passive: the art is the feedback for the click that just
  // landed, so it has to be swapped in the same commit as the phase change.
  useLayoutEffect(() => {
    setFrame({ src: frame.src, alt: frame.alt, rect: step.backgroundRect });
  }, [setFrame, frame, step.backgroundRect]);

  useEffect(() => {
    const message =
      phase === 'idle'
        ? step.meterAccessibleName
        : phase === 'measuring'
          ? step.measuringMessage
          : `${step.successTitle} ${step.successBody}`;
    setMessage(message);
  }, [setMessage, phase, step]);

  const handleMeasure = () => {
    if (phase !== 'idle') return;
    playClick();
    setPhase('measuring');
    if (prefersReducedMotion()) {
      setPhase('done');
      complete();
      return;
    }
    after(step.measureMs, () => {
      setPhase('done');
      complete();
    });
  };

  return (
    <>
      {frame.hotspot && phase === 'idle' && !exiting ? (
        <ClickHotspot rect={frame.hotspot} accessibleName={step.meterAccessibleName} onSelect={handleMeasure} />
      ) : null}

      {phase !== 'idle' ? (
        <span
          aria-hidden="true"
          style={{
            ...textBase,
            position: 'absolute',
            left: S(READOUT.x),
            top: S(READOUT.y),
            fontSize: T(17, 8),
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {step.readout}
        </span>
      ) : null}

      <HintCard step={step} animation={runtime.cardAnimation} />
    </>
  );
}

// Same floating card shape as Prosedur 1/2's own (Figma group "LANGKAH 6"):
// a blue tab overlapping a bordered white card with the task description, an
// "Instruksi :" label and the click instruction below it.
function HintCard({ step, animation }: { step: MeasureStep; animation: Animation }) {
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
