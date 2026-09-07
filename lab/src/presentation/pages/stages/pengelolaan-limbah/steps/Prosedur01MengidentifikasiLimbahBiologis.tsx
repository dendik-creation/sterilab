import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import checkSuccessUrl from '../../../../../../assets/images/01_reusable/icons/check_success.png';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { IdentifyStep, IdentifyTarget } from '../../../../../data/stages/pengelolaanLimbah';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { ClickHotspot } from '../ClickHotspot';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 1 - "Mengidentifikasi Limbah Biologis" (Figma frames "6.1 - A/B").
// Click every object on the bench that counts as biological waste - the used
// petri dish and the test-tube rack - and leave the clean paper and the
// aquades bottle alone. There is no partial-progress art (the Figma frames
// only cover idle and done), so a correct click marks that object with a
// checkmark in place rather than swapping the whole scene, and the scene
// itself only changes once both are found.
//
// Clicking a decoy is refused out loud (Stage 4's "correction" pattern, see
// teknik-aseptik's Prosedur02MemakaiApd) rather than silently ignored - a
// wrong guess that does nothing teaches nothing about why it's wrong.

const HINT_CARD = { x: 1437, y: 221.17, width: 426 };
const HINT_PILL = { dx: 98 };
const HINT_BODY = { dy: 242 - 221.17, minHeight: 247 - (242 - 221.17) };

// The done plate needs to be on screen before the note card starts rising, or
// the Analyst reads "Identifikasi berhasil" over a bench still mid-sort.
const SETTLE_MS = 620;
// How long a wrong-click correction stays up before it clears itself.
const CORRECTION_MS = 3200;
const CHECK_BADGE_SIZE = 40;

export function Prosedur01MengidentifikasiLimbahBiologis({ step, runtime }: ProcedureProps<IdentifyStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [found, setFound] = useState<string[]>([]);
  const [correction, setCorrection] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  const correctionTimerRef = useRef(0);
  const after = useTimeouts();

  const allFound = found.length >= step.targets.length;

  useEffect(() => () => window.clearTimeout(correctionTimerRef.current), []);

  // Layout, not passive: the done scene is the feedback for the click that
  // just completed the set, so it has to swap in the same commit.
  useLayoutEffect(() => {
    setFrame({
      src: settled ? step.doneBackground : step.initialBackground,
      alt: settled ? step.doneBackgroundAlt : step.initialBackgroundAlt,
      rect: step.backgroundRect,
    });
  }, [setFrame, settled, step]);

  useEffect(() => {
    if (settled) {
      setMessage(`${step.successTitle} ${step.successBody}`);
      return;
    }
    if (correction) {
      setMessage(correction);
      return;
    }
    setMessage(`${found.length} dari ${step.targets.length} limbah biologis teridentifikasi.`);
  }, [setMessage, settled, correction, found, step]);

  const showCorrection = (message: string) => {
    setCorrection(message);
    window.clearTimeout(correctionTimerRef.current);
    correctionTimerRef.current = window.setTimeout(() => setCorrection(null), CORRECTION_MS);
  };

  const handleTarget = (target: IdentifyTarget) => {
    if (allFound || found.includes(target.id)) return;
    playClick();
    setCorrection(null);
    const next = [...found, target.id];
    setFound(next);
    if (next.length < step.targets.length) return;
    setSettled(true);
    if (prefersReducedMotion()) {
      complete();
      return;
    }
    after(SETTLE_MS, complete);
  };

  const handleDecoy = () => {
    if (allFound) return;
    showCorrection(step.wrongMessage);
  };

  return (
    <>
      {!allFound && !exiting ? (
        <>
          {step.targets
            .filter((target) => !found.includes(target.id))
            .map((target) => (
              <ClickHotspot
                key={target.id}
                rect={target.rect}
                accessibleName={target.accessibleName}
                onSelect={() => handleTarget(target)}
              />
            ))}
          {step.decoys.map((decoy) => (
            <ClickHotspot key={decoy.id} rect={decoy.rect} accessibleName={decoy.accessibleName} onSelect={handleDecoy} />
          ))}
        </>
      ) : null}

      {!settled
        ? step.targets
            .filter((target) => found.includes(target.id))
            .map((target) => <FoundBadge key={target.id} target={target} />)
        : null}

      <HintCard step={step} correction={correction} animation={runtime.cardAnimation} />
    </>
  );
}

// The checkmark left over a correctly identified object while its sibling is
// still on the bench - the only feedback available without a third piece of
// art for "one down, one to go".
function FoundBadge({ target }: { target: IdentifyTarget }) {
  const cx = target.rect.x + target.rect.width / 2;
  const cy = target.rect.y + target.rect.height / 2;
  return (
    <img
      src={checkSuccessUrl}
      alt=""
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: S(cx),
        top: S(cy),
        transform: 'translate(-50%, -50%)',
        width: `max(24px, ${S(CHECK_BADGE_SIZE)})`,
        height: `max(24px, ${S(CHECK_BADGE_SIZE)})`,
        zIndex: 3,
        filter: 'drop-shadow(0 0.15cqw 0.3cqw rgba(0, 0, 0, 0.35))',
      }}
    />
  );
}

// Prosedur 1's floating card (Figma group "LANGKAH 6", node 305:624): a blue
// tab overlapping a bordered white card with the task description, an
// "Instruksi :" label, the click instruction below it, and - unique to this
// procedure - a reserved correction line for a wrong click.
function HintCard({ step, correction, animation }: { step: IdentifyStep; correction: string | null; animation: Animation }) {
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

        {/* Reserved in flow rather than overlaid, same as Stage 4's own
            correction line (teknik-aseptik/Prosedur02MemakaiApd.tsx): it has
            to be able to appear without shifting the instruction above it. */}
        <span
          aria-hidden="true"
          className={correction ? 'sterilab-nudge' : undefined}
          style={{
            ...textBase,
            marginTop: S(-2),
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(17, 8),
            fontWeight: 700,
            color: COLOR.correction,
            opacity: correction ? 1 : 0,
            transition: 'opacity 180ms ease-out',
          }}
        >
          {correction ?? ''}
        </span>
      </div>

      <FloatingTab label={step.eyebrow} dx={HINT_PILL.dx} />
    </div>
  );
}
