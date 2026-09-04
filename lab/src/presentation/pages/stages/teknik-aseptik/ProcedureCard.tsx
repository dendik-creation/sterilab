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
const COUNTER_PILL_HEIGHT = 44.936;
const COUNTER_PILL = { width: 262.468, height: COUNTER_PILL_HEIGHT };
// Marker row, authored twice by design. The twelve-step frame drew 29.814 dots
// on a 39.744 pitch - twelve of those plus their eleven gaps come to 466.998,
// filling the 467.068 rule to within 0.07 design px. The six-step frame
// (61:541 "LANGKAH 3 NEW") redraws the row rather than thinning it: 41.16 dots
// at x = 122.665 / 189 / 253 / 315.914 / 380.331 / 444.747, a 64.4165 pitch,
// spanning 363.24 - and its midpoint, 304.286, is the card's own centre to
// three decimals. So the row is centred at both counts; only its size and
// pitch are per-count, and these are the six-step numbers the Stage ships.
const DOT_SIZE = 41.16;
const DOT_GAP = 64.4165 - DOT_SIZE;
const DOT_ROW_SPAN = TOTAL_STEPS * DOT_SIZE + (TOTAL_STEPS - 1) * DOT_GAP; // 363.24 at six
const RULE_WIDTH = 467.068;
// Counter pill bottom (313 + 44.936) to the dot row (382.395), and the dot row
// to the first rule (452.401).
const DOT_ROW_MARGIN = 382.395 - (313 + COUNTER_PILL_HEIGHT);
const RULE_AFTER_DOTS = 452.401 - (382.395 + DOT_SIZE);

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

        <Rule marginTop={showDots ? RULE_AFTER_DOTS : 24} />

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
// Centred, not spread: the six markers span 363.24 of the 467.068 rule, and the
// frame centres that group on the card. `space-between` would push them to the
// rule's ends - a 104 design px stretch the design does not draw - so the row
// is laid out at its authored pitch and centred, which also reproduces the
// twelve-step row exactly (there, span and rule are the same length, so
// centring and spreading agree).
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
              // 18px on a 41.16 circle in the six-step frame (the twelve-step
              // one set 20 on a 29.814 circle - a much tighter fit).
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
