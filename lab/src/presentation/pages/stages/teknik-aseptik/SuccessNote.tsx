import arrowRightUrl from '../../../../../assets/images/01_reusable/icons/arrow_right.png';
import checkSuccessUrl from '../../../../../assets/images/01_reusable/icons/check_success.png';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from './geometry';
import type { ProcedureStep } from '../../../../data/stages/teknikAseptik';

// Anchored by its bottom edge (1001.159 of 1080), not its top: on a small
// viewport the floored copy and the 44px-floored LANJUT button make this card
// roughly twice its designed height, and growing downwards would push it off
// the bottom of the stage.
const NOTE_CARD = { x: 572.476, bottom: 1080 - 1001.159, width: 775.048, minHeight: 108.87 };
const NOTE_CHECK = { dx: 21.54, dy: 19.592, size: 71.72 };
const NOTE_TEXT = { dx: 110.856 };
const NOTE_CTA = { dx: 547.457, dy: 29.002, minWidth: 200.931, height: 52.1 };

// The note card (Figma groups 60:438 / 62:854). Rises in from below the stage
// edge once a procedure reports itself complete - reuses the same keyframes as
// the Missions note card rather than adding a second rise/fall pair. Every
// procedure ends this way, so the shell owns it and no procedure renders one.
export function SuccessNote({ step, onContinue }: { step: ProcedureStep; onContinue: () => void }) {
  return (
    <div
      className="sterilab-rise-in-fade"
      role="group"
      aria-label={step.successTitle}
      style={{
        position: 'absolute',
        left: S(NOTE_CARD.x),
        bottom: S(NOTE_CARD.bottom),
        width: S(NOTE_CARD.width),
        minHeight: S(NOTE_CARD.minHeight),
        zIndex: 6,
        background: '#FFFFFF',
        border: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
        borderRadius: S(CARD_RADIUS),
        boxShadow: CARD_SHADOW,
        display: 'flex',
        alignItems: 'center',
        gap: S(18),
        padding: `${S(14)} ${S(26)} ${S(14)} ${S(NOTE_CHECK.dx)}`,
      }}
    >
      <img
        src={checkSuccessUrl}
        alt=""
        aria-hidden="true"
        style={{ width: S(NOTE_CHECK.size), height: S(NOTE_CHECK.size), flex: 'none' }}
      />

      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: S(9),
          flex: 1,
          // Figma puts the copy at x=683.332 - the gap left over once the icon
          // (at x=594.016, 71.72 wide) and the card's own left padding are
          // accounted for.
          marginLeft: S(NOTE_TEXT.dx - NOTE_CHECK.dx - NOTE_CHECK.size - 18),
        }}
      >
        <span style={{ ...textBase, fontSize: T(24, 11), fontWeight: 800, color: COLOR.successGreen }}>
          {step.successTitle}
        </span>
        <span style={{ ...textBase, fontSize: T(19, 9), fontWeight: 500, color: COLOR.navy }}>{step.successBody}</span>
      </span>

      <ContinueButton onClick={onContinue} />
    </div>
  );
}

function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Lanjut ke langkah berikutnya"
      style={{
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: S(14),
        minWidth: `max(88px, ${S(NOTE_CTA.minWidth)})`,
        minHeight: `max(44px, ${S(NOTE_CTA.height)})`,
        padding: `0 ${S(22)}`,
        borderRadius: 999,
        border: `${T(HAIRLINE, 1)} solid ${COLOR.ctaBlueEdge}`,
        background: COLOR.ctaBlue,
        boxShadow: `${S(3)} ${S(4)} 0 ${COLOR.ctaShadow}`,
        color: '#FFFFFF',
        fontFamily: 'inherit',
        fontSize: T(26, 12),
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        transition: 'transform 120ms ease-out, filter 120ms ease-out',
      }}
      onPointerOver={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
      onPointerOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onPointerDown={(e) => (e.currentTarget.style.filter = 'brightness(0.93)')}
      onPointerUp={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
    >
      LANJUT
      <img src={arrowRightUrl} alt="" aria-hidden="true" style={{ width: S(30), height: S(17), display: 'block' }} />
    </button>
  );
}
