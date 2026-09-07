import { COLOR, CARD_RADIUS, CARD_SHADOW, S, T, textBase } from './geometry';
import type { Animation } from './geometry';
import { TOTAL_STEPS } from '../../../../data/stages/kulturMikroba';
import type { ProcedureStep } from '../../../../data/stages/kulturMikroba';

// Same tracking card as Stage 4's (teknik-aseptik/ProcedureCard.tsx) - see
// there for the full derivation of every measurement below, none of which
// changed for this stage's frame.
const PROCEDURE_CARD = { x: 49.917, y: 219.623, width: 506.572, bannerHeight: 425.848 };
const PROCEDURE_HEAD_HEIGHT = 289.581 - 219.623;
const PROCEDURE_BODY_MIN_HEIGHT = 390.613;
const COUNTER_PILL_HEIGHT = 44.936;
const COUNTER_PILL = { width: 262.468, height: COUNTER_PILL_HEIGHT };
const DOT_SIZE = 41.16;
const DOT_GAP = 64.4165 - DOT_SIZE;
const DOT_ROW_SPAN = TOTAL_STEPS * DOT_SIZE + (TOTAL_STEPS - 1) * DOT_GAP;
const RULE_WIDTH = 467.068;
const DOT_ROW_MARGIN = 382.395 - (313 + COUNTER_PILL_HEIGHT);
const RULE_AFTER_DOTS = 452.401 - (382.395 + DOT_SIZE);

export function ProcedureCard({
  step,
  showDots,
  animation,
}: {
  step: ProcedureStep;
  showDots: boolean;
  animation: Animation;
}) {
  return (
    <div
      className={animation.className}
      style={{
        position: 'absolute',
        left: S(PROCEDURE_CARD.x),
        top: S(PROCEDURE_CARD.y),
        width: S(PROCEDURE_CARD.width),
        zIndex: 4,
        animationDelay: `${animation.delay}ms`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          minHeight: S(PROCEDURE_CARD.bannerHeight),
          background: COLOR.navy,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: S(22),
        }}
      >
        <span style={{ ...textBase, fontSize: T(37, 13), fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.01em' }}>
          PROSEDUR
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          marginTop: S(PROCEDURE_HEAD_HEIGHT),
          minHeight: S(PROCEDURE_BODY_MIN_HEIGHT),
          background: '#FFFFFF',
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: `${S(22.954)} ${S(20)} ${S(49.9)}`,
        }}
      >
        <span
          style={{
            ...textBase,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: S(COUNTER_PILL.width),
            minHeight: S(COUNTER_PILL.height),
            padding: `0 ${S(24)}`,
            borderRadius: 999,
            background: COLOR.pillBlue,
            color: '#FFFFFF',
            fontSize: T(25, 10),
            fontWeight: 700,
          }}
        >
          {`Langkah ${step.n} / ${TOTAL_STEPS}`}
        </span>

        {showDots ? <StepDots current={step.n} /> : null}

        <Rule marginTop={showDots ? RULE_AFTER_DOTS : 24} />

        <span style={{ ...textBase, marginTop: S(26), fontSize: T(24, 10), fontWeight: 700, color: COLOR.pillBlue }}>
          {step.eyebrow}
        </span>
        <span style={{ ...textBase, marginTop: S(8), fontSize: T(37, 14), fontWeight: 800, color: COLOR.titleNavy }}>
          {step.title}
        </span>

        <Rule marginTop={25} />

        <span
          style={{
            ...textBase,
            marginTop: S(34),
            maxWidth: S(345),
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(20, 9),
            fontWeight: 500,
            color: COLOR.body,
          }}
        >
          {step.description}
        </span>

        {/* Figma node 283:280 - only Langkah 1's card carries this target
            line, styled like the eyebrow above it. */}
        {step.target ? (
          <span
            style={{
              ...textBase,
              marginTop: S(20),
              textAlign: 'center',
              fontSize: T(24, 10),
              fontWeight: 800,
              color: COLOR.pillBlue,
            }}
          >
            {step.target}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Rule({ marginTop }: { marginTop: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        marginTop: S(marginTop),
        width: S(RULE_WIDTH),
        maxWidth: '100%',
        height: 'max(1px, 0.078cqw)',
        background: COLOR.divider,
        flex: 'none',
      }}
    />
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        marginTop: S(DOT_ROW_MARGIN),
        display: 'flex',
        gap: S(DOT_GAP),
        width: S(DOT_ROW_SPAN),
        maxWidth: '100%',
        justifyContent: 'center',
      }}
      data-testid="step-dots"
    >
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const n = index + 1;
        const active = n === current;
        return (
          <span
            key={n}
            style={{
              ...textBase,
              width: S(DOT_SIZE),
              height: S(DOT_SIZE),
              flex: 'none',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: active ? COLOR.navy : COLOR.dotIdleFill,
              border: active ? 'none' : `max(1px, 0.078cqw) solid ${COLOR.dotIdleRing}`,
              color: active ? '#FFFFFF' : COLOR.dotIdleText,
              fontSize: T(18, 8),
              fontWeight: 700,
            }}
          >
            {n}
          </span>
        );
      })}
    </span>
  );
}
