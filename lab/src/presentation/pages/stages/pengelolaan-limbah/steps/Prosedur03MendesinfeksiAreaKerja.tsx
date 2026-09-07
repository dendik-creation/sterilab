import { useEffect, useLayoutEffect, useState } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { SequenceStep } from '../../../../../data/stages/pengelolaanLimbah';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { ClickHotspot } from '../ClickHotspot';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 3 - "Mendesinfeksi Area Kerja" (Figma frames "6.3 - A/B/C"). Click
// the disinfectant bottle to spray the bench, then click the cloth to wipe it
// down - two clicks in order, same shape as Stage 4's Langkah 1 (Cuci
// Tangan), just two beats instead of three and one hotspot on screen at a
// time rather than three progressive pills, matching this stage's own
// Langkah 1/2 card (a single right-side hint card whose instruction line
// swaps per phase) instead of Stage 4's floating-pill style.

const HINT_CARD = { x: 1437, y: 221.17, width: 426 };
const HINT_PILL = { dx: 98 };
const HINT_BODY = { dy: 242 - 221.17, minHeight: 247 - (242 - 221.17) };

// The wiped-clean plate needs to be on screen before the note card starts
// rising, or the Analyst reads "Desinfeksi selesai" over a bench still being
// wiped.
const SETTLE_MS = 620;

export function Prosedur03MendesinfeksiAreaKerja({ step, runtime }: ProcedureProps<SequenceStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  // How many of the step's actions have landed - also the index of the
  // background plate, since every plate is authored in click order.
  const [doneCount, setDoneCount] = useState(0);
  const after = useTimeouts();

  const done = doneCount >= step.actions.length;

  // Layout, not passive: the art is the feedback for the click that just
  // landed, so it has to swap in the same commit as the state update. Reads
  // straight off `step` rather than a `frame` local so the effect's deps stay
  // primitives (doneCount, the stable step reference) instead of a fresh
  // object literal every render.
  useLayoutEffect(() => {
    const plate = doneCount === 0 ? { src: step.initialBackground, alt: step.initialBackgroundAlt } : step.actions[doneCount - 1].frame;
    setFrame({ src: plate.src, alt: plate.alt, rect: step.backgroundRect });
  }, [setFrame, doneCount, step]);

  useEffect(() => {
    setMessage(
      done
        ? `${step.successTitle} ${step.successBody}`
        : `Tindakan ${doneCount} dari ${step.actions.length} selesai. Berikutnya: ${step.actions[doneCount].accessibleName}.`,
    );
  }, [setMessage, done, doneCount, step]);

  const handleAction = () => {
    if (done) return;
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

  const current = done ? null : step.actions[doneCount];

  return (
    <>
      {current && !exiting ? (
        <ClickHotspot rect={current.rect} accessibleName={current.accessibleName} onSelect={handleAction} />
      ) : null}

      <HintCard step={step} current={current} animation={runtime.cardAnimation} />
    </>
  );
}

// Prosedur 3's floating card (Figma group "LANGKAH 6", node 310:1263 /
// 311:1391 / 311:1519): the same tab and white card as Langkah 1 and 2's,
// carrying the constant hint text and whichever action's instruction is
// currently pending.
function HintCard({
  step,
  current,
  animation,
}: {
  step: SequenceStep;
  current: SequenceStep['actions'][number] | null;
  animation: Animation;
}) {
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

        {current ? (
          <>
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
              {current.instruction}
            </span>
          </>
        ) : null}
      </div>

      <FloatingTab label={step.eyebrow} dx={HINT_PILL.dx} />
    </div>
  );
}
