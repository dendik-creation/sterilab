import { COLOR, CARD_RADIUS, CARD_SHADOW, S, T, textBase } from './geometry';
import type { Animation } from './geometry';
import { TOTAL_STEPS } from '../../../../data/stages/teknikAseptik';
import type { ProcedureStep } from '../../../../data/stages/teknikAseptik';

// Figma geometry for the tracking card on the left (group 60:139 / 62:682): a
// blue banner with the white body card overlapping it. The body is a flex
// column so a floored font pushes the card taller rather than spilling out.
const PROCEDURE_CARD = { x: 49.917, y: 219.623, width: 506.572, bannerHeight: 425.848 };
const PROCEDURE_HEAD_HEIGHT = 289.581 - 219.623; // visible blue band above the white card
const PROCEDURE_BODY_MIN_HEIGHT = 390.613;
const COUNTER_PILL = { width: 262.468, height: 44.936 };
// Figma draws the marker row for twelve steps: 29.814 dots on a 39.744 pitch.
// That is not an arbitrary pair - twelve of them plus their eleven gaps come to
// 466.998, which is the 467.068 rule above and below them to within 0.07 design
// px. The row is therefore *designed* to span the rule exactly at twelve, and
// the dot keeps its authored size at any other count (see StepDots).
const DOT_SIZE = 29.814;
const DOT_GAP = 39.744 - DOT_SIZE;
const RULE_WIDTH = 467.068;

// The one piece of chrome every one of Stage 4's procedures shares: which step
// this is, what it is called, and what it asks for. Nothing in here is
// procedure-specific, which is why it lives beside the shell rather than inside
// any single procedure.
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

        <Rule marginTop={showDots ? 25.944 : 24} />

        <span style={{ ...textBase, marginTop: S(26), fontSize: T(24, 10), fontWeight: 700, color: COLOR.pillBlue }}>
          {step.eyebrow}
        </span>
        <span style={{ ...textBase, marginTop: S(8), fontSize: T(37, 14), fontWeight: 800, color: COLOR.navy }}>
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

// One marker per step (Figma group 60:249). Decorative: the same "Langkah N /
// 6" fact is already in the pill above as real text, which is why the row can
// be dropped wholesale below the mobile breakpoint - at 568px wide each dot
// would be ~8.8 CSS px, too small to read the number inside it.
//
// Centred rather than spread across the rule: the dots hold their authored size
// and pitch, and the group sits under the counter pill. At twelve steps that is
// the Figma row unchanged (the group is the rule width to within 0.07 design
// px, so there is nothing left for `space-between` to distribute). Below twelve
// it is the whole point - six dots pushed to the ends of the rule would sit
// 57.6 design px apart, nearly six times their authored gap, reading as six
// stray dots instead of one progress row.
function StepDots({ current }: { current: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        marginTop: S(18.796),
        display: 'flex',
        gap: S(DOT_GAP),
        width: S(RULE_WIDTH),
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
              fontSize: T(20, 7),
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
