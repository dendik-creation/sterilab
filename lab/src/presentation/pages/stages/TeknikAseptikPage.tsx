import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import homeBtnUrl from '../../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import clickSfxUrl from '../../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../core/audio/audioSettings';
import { prefersReducedMotion } from '../../../core/a11y/motion';
import { PROCEDURE_STEPS } from '../../../data/stages/teknikAseptik';
import type { ProcedureStep } from '../../../data/stages/teknikAseptik';
import { Stage } from '../../components/Stage';
import { IconButton } from '../../components/IconButton';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  COLOR,
  ENTER_STEPS,
  EXIT_TOTAL_MS,
  HAIRLINE,
  S,
  STAGGER_MS,
  T,
  rectStyle,
  srOnly,
  textBase,
} from './teknik-aseptik/geometry';
import { ProcedureCard } from './teknik-aseptik/ProcedureCard';
import { SuccessNote } from './teknik-aseptik/SuccessNote';
import { PROCEDURES } from './teknik-aseptik/steps';
import type { ProcedureFrame, ProcedureRuntime } from './teknik-aseptik/types';

// Stage 4 - Teknik Kerja Aseptik. Figma "Sterilab-APHP" canvas 42:678, whose
// LANGKAH frames are all 1920x1080. The canvas draws twelve of them; the Stage
// ships six (see TOTAL_STEPS in data/stages/teknikAseptik.ts).
//
// This file is the *shell*, and only the shell: the top bar, the PROSEDUR
// tracking card, the success note, the live region and the walk through
// PROCEDURE_STEPS. The workspace in the middle - the part that differs between
// every procedure - is a component of its own under teknik-aseptik/steps/,
// picked by the step's id. See teknik-aseptik/types.ts for the contract between
// the two halves and teknik-aseptik/steps/index.tsx for the registry.
//
// Unlike Case/Missions this Screen's copy is real DOM text, not baked into the
// art: the procedure card is live state (which step, what is done), so it has
// to be selectable, translatable and reachable by a screen reader. That means
// every length is derived from the Figma frame with the S()/T() helpers in
// teknik-aseptik/geometry.ts rather than being a hand-picked percentage.
//
// Everything - background art included - lives in Stage's *safe* (contain)
// layer. Hit areas, instruction pills and the APD sockets all have to line up
// with features painted into the art, and Stage's two layers only agree at 16:9
// (see the comment in components/Stage.tsx): at 1024x768 a cover-layer point
// drifts ~50px from the same percentage in the contain layer, which would slide
// a pill off its object or a socket off the analyst's face. Stage's
// `background` therefore gets a blurred copy of the same frame, purely so the
// letterboxed edges on non-16:9 viewports read as bleed instead of bars.

// Top bar. Same Figma x/y as Missions (home 47.974, back 146.103, sound
// 1803.486, all 72.783 square of 1920) and the same floors: IconButton pins
// every icon to a 44x44 WCAG 2.2 AA target, which on a 568px-wide viewport is
// ~2x its designed size, so the offsets have to be floored/capped too or the
// icons collide on the left and leave the stage on the right.
const HOME_LEFT = 'max(12px, 2.499%)';
const BACK_LEFT = 'max(64px, 7.609%)';
const SOUND_LEFT = 'min(93.931%, 100% - 52px)';
const TOP_BAR_TOP = '3.574%';
const ICON_SIZE = '3.791%';

// The band is floored at 60px because IconButton floors its icons to a 44x44
// touch target: on a 568x320 viewport the designed band is only ~44px tall and
// the icons would hang out of the bottom of it. The title block is floored the
// same way - at 568px the designed x=264 lands at 78px, inside the widened back
// button (which ends at 108px), so it starts at 116px instead.
const HEADER_BAND_HEIGHT = 'max(60px, 7.682cqw)'; // 147.5 of 1080
const HEADER_TEXT_LEFT = `max(116px, ${(264 / 1920) * 100}cqw)`;
// Title box (line-height 1) to subtitle box, derived from the frame's two ink
// boxes: title cap top 42, subtitle cap top 85.868.
const HEADER_TEXT_GAP = 10.3;

const enterDelay = (step: number) => step * STAGGER_MS;
const exitDelay = (step: number) => (ENTER_STEPS - step) * STAGGER_MS;

const initialFrame = (step: ProcedureStep): ProcedureFrame => ({
  src: step.initialBackground,
  alt: step.initialBackgroundAlt,
  rect: step.backgroundRect,
});

export function TeknikAseptikPage() {
  const { goBack, goTo } = useNavigation();
  const isMobile = useIsMobile();
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [exiting, setExiting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showNote, setShowNote] = useState(false);
  // What the live procedure is reporting up. Both are tagged with the step they
  // came from and fall back to the step's own opening state, so advancing to the
  // next procedure cannot show a frame of the previous one's art for a tick
  // while React gets round to the new procedure's effects.
  const [reported, setReported] = useState<{ index: number; frame?: ProcedureFrame; message?: string } | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const exitTimerRef = useRef(0);

  const step: ProcedureStep = PROCEDURE_STEPS[stepIndex];
  const current = reported?.index === stepIndex ? reported : null;
  const frame = current?.frame ?? initialFrame(step);
  const message = current?.message ?? '';

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSfxUrl);
  }, []);

  useEffect(() => () => window.clearTimeout(exitTimerRef.current), []);

  const playClick = useCallback(() => {
    if (!isAudioEnabled()) return;
    const audio = clickAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }, []);

  // Bound to the step that is live when they are handed down, and otherwise
  // stable: a procedure calls them from an effect, so an identity that churned
  // on every re-render of this component would re-run that effect on every
  // click. A procedure is remounted when the step changes (see the `key`
  // below), so it always picks up the pair belonging to its own step.
  const setFrame = useCallback((next: ProcedureFrame) => {
    setReported((prev) => ({ index: stepIndex, message: prev?.index === stepIndex ? prev.message : undefined, frame: next }));
  }, [stepIndex]);

  const setMessage = useCallback((next: string) => {
    setReported((prev) => ({ index: stepIndex, frame: prev?.index === stepIndex ? prev.frame : undefined, message: next }));
  }, [stepIndex]);

  const complete = useCallback(() => setShowNote(true), []);

  const handleToggleSound = () => {
    const enabled = toggleAudioEnabled();
    setAudioOn(enabled);
    if (enabled) playClick();
  };

  // Every way off this Screen runs the exit transition first, so the reverse
  // stagger plays for home/back/LANJUT alike instead of only one of them.
  const leaveTo = (navigate: () => void) => {
    if (exiting) return;
    playClick();
    if (prefersReducedMotion()) {
      navigate();
      return;
    }
    setExiting(true);
    exitTimerRef.current = window.setTimeout(navigate, EXIT_TOTAL_MS);
  };

  // Advances through PROCEDURE_STEPS in place; only the last authored step
  // falls through to Missions rather than dead-ending on an empty workspace.
  const handleContinue = () => {
    if (PROCEDURE_STEPS[stepIndex + 1]) {
      playClick();
      setShowNote(false);
      setStepIndex(stepIndex + 1);
      return;
    }
    leaveTo(goBack);
  };

  const anim = (rung: number) => ({
    className: exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in',
    delay: exiting ? exitDelay(rung) : enterDelay(rung),
  });

  const cardAnimation = anim(2);
  const runtime: ProcedureRuntime = useMemo(
    () => ({
      isMobile,
      exiting,
      cardAnimation: { className: cardAnimation.className, delay: cardAnimation.delay },
      playClick,
      setFrame,
      setMessage,
      complete,
    }),
    [isMobile, exiting, cardAnimation.className, cardAnimation.delay, playClick, setFrame, setMessage, complete],
  );

  return (
    <Stage
      background={
        // Blurred bleed only - the crisp, aligned copy lives in the safe layer
        // below. Hidden entirely on a 16:9 viewport.
        <img
          src={frame.src}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(28px) brightness(0.92)',
            transform: 'scale(1.06)',
          }}
        />
      }
    >
      <img
        src={frame.src}
        alt={frame.alt}
        style={{ position: 'absolute', ...rectStyle(frame.rect), objectFit: 'cover' }}
      />

      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_BAND_HEIGHT,
          background: COLOR.band,
          borderBottom: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
          display: 'flex',
          alignItems: 'center',
          // Above the pills (3): once a floored font widens a pill on a small
          // viewport it can reach the chrome, and the chrome has to win.
          zIndex: 5,
        }}
      >
        {/* Normal flow rather than two ink boxes: the pair has to stay centred
            in a band whose height is floored on small viewports, and the two
            floored font sizes have to push each other apart instead of
            overlapping at fixed offsets. */}
        <div
          className={anim(0).className}
          style={{
            marginLeft: HEADER_TEXT_LEFT,
            display: 'flex',
            flexDirection: 'column',
            gap: S(HEADER_TEXT_GAP),
            whiteSpace: 'nowrap',
            animationDelay: `${anim(0).delay}ms`,
          }}
        >
          <h1 style={{ ...textBase, fontSize: T(38, 15), fontWeight: 800, color: COLOR.navy }}>TEKNIK KERJA ASEPTIK</h1>
          <p style={{ ...textBase, fontSize: T(25, 10), fontWeight: 500, color: COLOR.navy }}>
            Lakukan prosedur dengan urutan yang benar
          </p>
        </div>
      </header>

      <IconButton
        src={homeBtnUrl}
        alt="Menu Utama"
        label="Menu Utama"
        top={TOP_BAR_TOP}
        left={HOME_LEFT}
        size={ICON_SIZE}
        animationClassName={anim(0).className}
        animationDelayMs={anim(0).delay}
        zIndex={6}
        onClick={() => leaveTo(() => goTo('splash'))}
      />
      <IconButton
        src={backBtnUrl}
        alt="Kembali"
        label="Kembali"
        top={TOP_BAR_TOP}
        left={BACK_LEFT}
        size={ICON_SIZE}
        animationClassName={anim(0).className}
        animationDelayMs={anim(0).delay}
        zIndex={6}
        onClick={() => leaveTo(goBack)}
      />
      <IconButton
        src={audioOn ? bgmOnBtnUrl : bgmOffBtnUrl}
        alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        top={TOP_BAR_TOP}
        left={SOUND_LEFT}
        size={ICON_SIZE}
        animationClassName={anim(0).className}
        animationDelayMs={anim(0).delay}
        zIndex={6}
        onClick={handleToggleSound}
      />

      <ProcedureCard step={step} showDots={!isMobile} animation={anim(1)} />

      {/* The workspace for this one procedure: its hit areas, its drop targets
          and its own floating card, all owned by the component the id maps to.
          Rendered after the chrome so the reading and tab order is "where am I"
          (top bar, PROSEDUR card) before "what do I do" - painting order is
          settled by z-index, not by this. Keyed by id so advancing the Screen
          unmounts the finished procedure's state instead of carrying it into
          the next one. */}
      <ProcedureWorkspace key={step.id} step={step} runtime={runtime} />

      {showNote && !exiting ? <SuccessNote step={step} onContinue={handleContinue} /> : null}

      {/* Progress feedback has to reach a screen reader too, not only the art
          swapping underneath (TASKS.md > Aturan Lintas Screen, live region). */}
      <p aria-live="polite" style={srOnly}>
        {message}
      </p>
    </Stage>
  );
}

function ProcedureWorkspace({ step, runtime }: { step: ProcedureStep; runtime: ProcedureRuntime }) {
  return <>{PROCEDURES[step.id]({ step, runtime })}</>;
}
