import { useEffect, useLayoutEffect, useState } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { DissolveFrame, DissolveStep } from '../../../../../data/stages/kulturMikroba';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { ClickHotspot } from '../ClickHotspot';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 2 - "Melarutkan Media" (Figma frames "5.2 - A/B/C/D"). Pour the
// aquades, turn on the hotplate, then wait for the media to heat and
// dissolve - the art cuts to the next plate on each click, and again on its
// own once the heating plate has held long enough.
//
// Everything the procedure owns lives here: which phase this is, which plate
// that implies, and when the step is done. The shell knows none of it.

type Phase = 'idle' | 'poured' | 'heating' | 'done';

const HINT_CARD = { x: 1437, y: 221.17, width: 426 };
const HINT_PILL = { dx: 98 };
const HINT_BODY = { dy: 242 - 221.17, minHeight: 247 - (242 - 221.17) };

const PHASE_INDEX: Record<Phase, number> = { idle: 0, poured: 1, heating: 2, done: 3 };

export function Prosedur02MelarutkanMedia({ step, runtime }: ProcedureProps<DissolveStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [phase, setPhase] = useState<Phase>('idle');
  const after = useTimeouts();

  const frame: DissolveFrame = step.frames[PHASE_INDEX[phase]];

  // Layout, not passive: the art is the feedback for the click that just
  // landed, so it has to be swapped in the same commit as the phase change.
  useLayoutEffect(() => {
    setFrame({ src: frame.src, alt: frame.alt, rect: step.backgroundRect });
  }, [setFrame, frame, step.backgroundRect]);

  useEffect(() => {
    const message =
      phase === 'idle'
        ? step.pourAccessibleName
        : phase === 'poured'
          ? step.hotplateAccessibleName
          : phase === 'heating'
            ? step.heatingMessage
            : `${step.successTitle} ${step.successBody}`;
    setMessage(message);
  }, [setMessage, phase, step]);

  const handlePour = () => {
    if (phase !== 'idle') return;
    playClick();
    setPhase('poured');
  };

  const handleIgnite = () => {
    if (phase !== 'poured') return;
    playClick();
    setPhase('heating');
    if (prefersReducedMotion()) {
      setPhase('done');
      complete();
      return;
    }
    after(step.heatMs, () => {
      setPhase('done');
      complete();
    });
  };

  const hotspotHandler = phase === 'idle' ? handlePour : phase === 'poured' ? handleIgnite : null;
  const hotspotAccessibleName = phase === 'idle' ? step.pourAccessibleName : step.hotplateAccessibleName;

  return (
    <>
      {frame.hotspot && hotspotHandler && !exiting ? (
        <ClickHotspot rect={frame.hotspot} accessibleName={hotspotAccessibleName} onSelect={hotspotHandler} />
      ) : null}

      <HintCard step={step} animation={runtime.cardAnimation} />
    </>
  );
}


// Same floating card shape as Prosedur 1's own (Figma group "LANGKAH 6"):
// a blue tab overlapping a bordered white card with the task description, an
// "Instruksi :" label and the click instruction below it.
function HintCard({ step, animation }: { step: DissolveStep; animation: Animation }) {
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
