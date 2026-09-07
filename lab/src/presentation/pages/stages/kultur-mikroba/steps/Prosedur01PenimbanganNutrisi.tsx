import { useEffect, useLayoutEffect, useState } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { WeighFrame, WeighStep } from '../../../../../data/stages/kulturMikroba';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { ClickHotspot } from '../ClickHotspot';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 1 - "Penimbangan Bahan Nutrisi" (Figma frames "5.1 - A/B/C").
// Click the jar, add one increment to the scale, repeat until the target
// weight is reached; the art cuts to the next plate each time the weight
// crosses in or out of zero, and again once it reaches the target.
//
// Everything the procedure owns lives here: the running weight, which plate
// that implies, and when the step is done. The shell knows none of it.

const HINT_CARD = { x: 1437, y: 221.17, width: 426 };
const HINT_PILL = { dx: 98 };
const HINT_BODY = { dy: 242 - 221.17, minHeight: 247 - (242 - 221.17) };

// The done plate needs to be on screen before the note card starts rising, or
// the Analyst reads "Penimbangan berhasil" over a scale still mid-scoop.
const SETTLE_MS = 620;

// Digital scale LCD readout, centred over the display (Figma nodes 283:279 /
// 283:405 / 283:530 - left drifts a few px per plate purely from Figma's own
// per-string kerning, so a single centred point covers all three instead of
// three near-identical hand-picked offsets).
const READOUT = { x: 922, y: 889 };

function frameFor(step: WeighStep, weight: number): WeighFrame {
  if (weight <= 0) return step.frames[0];
  if (weight >= step.targetGrams) return step.frames[2];
  return step.frames[1];
}

// Trims the trailing zero the LCD itself never shows ("0", "4.5", "7").
function readoutText(weight: number): string {
  return Number(weight.toFixed(1)).toString();
}

// Indonesian comma form used by the step's own copy ("Target: ... 7,0 g").
function spokenGrams(weight: number): string {
  return `${weight.toFixed(1).replace('.', ',')} g`;
}

export function Prosedur01PenimbanganNutrisi({ step, runtime }: ProcedureProps<WeighStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [weight, setWeight] = useState(0);
  const [settled, setSettled] = useState(false);
  const after = useTimeouts();

  const frame = frameFor(step, weight);
  const atTarget = weight >= step.targetGrams;

  // Layout, not passive: the art is the feedback for the click that just
  // landed, so it has to be swapped in the same commit as the state update.
  useLayoutEffect(() => {
    setFrame({ src: frame.src, alt: frame.alt, rect: step.backgroundRect });
  }, [setFrame, frame, step.backgroundRect]);

  useEffect(() => {
    setMessage(
      atTarget
        ? `${step.successTitle}. ${step.successBody}`
        : `${spokenGrams(weight)} dari ${spokenGrams(step.targetGrams)} ${step.ingredientAccessibleName} ditambahkan.`,
    );
  }, [setMessage, atTarget, weight, step]);

  const handleAdd = () => {
    if (atTarget || settled) return;
    playClick();
    const next = Math.min(step.targetGrams, Math.round((weight + step.incrementGrams) * 10) / 10);
    setWeight(next);
    if (next < step.targetGrams) return;
    setSettled(true);
    if (prefersReducedMotion()) {
      complete();
      return;
    }
    after(SETTLE_MS, complete);
  };

  return (
    <>
      {frame.hotspot && !exiting && !settled ? (
        <ClickHotspot rect={frame.hotspot} accessibleName={step.ingredientAccessibleName} onSelect={handleAdd} />
      ) : null}

      <span
        aria-hidden="true"
        style={{
          ...textBase,
          position: 'absolute',
          left: S(READOUT.x),
          top: S(READOUT.y),
          transform: 'translateX(-50%)',
          fontSize: T(32, 14),
          fontWeight: 800,
          color: '#FFFFFF',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {readoutText(weight)}
      </span>

      <HintCard step={step} animation={runtime.cardAnimation} />
    </>
  );
}

// Prosedur 1's floating card (Figma group "LANGKAH 6", node 280:18): a blue
// tab overlapping a bordered white card with the task description, an
// "Instruksi :" label and the click instruction below it.
function HintCard({ step, animation }: { step: WeighStep; animation: Animation }) {
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
