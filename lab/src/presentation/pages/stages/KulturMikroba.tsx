import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import homeBtnUrl from '../../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import clickSfxUrl from '../../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../core/audio/audioSettings';
import { markLevelCompleted } from '../../../core/progress/levelProgress';
import { prefersReducedMotion } from '../../../core/a11y/motion';
import { PROCEDURE_STEPS } from '../../../data/stages/kulturMikroba';
import type { ProcedureStep } from '../../../data/stages/kulturMikroba';
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
} from './kultur-mikroba/geometry';
import { ProcedureCard } from './kultur-mikroba/ProcedureCard';
import { SuccessNote } from './kultur-mikroba/SuccessNote';
import { PROCEDURES } from './kultur-mikroba/steps';
import type { ProcedureFrame, ProcedureRuntime } from './kultur-mikroba/types';

// Stage 2 - Pembuatan Media Kultur Mikroba. Figma "Sterilab-APHP" frames
// "5.1 - A/B/C" (node-id 262-2), 1920x1080. Only Langkah 1 is authored so far
// (see data/stages/kulturMikroba.ts); the shell already walks PROCEDURE_STEPS
// generically, so the remaining five arrive as data + a workspace component
// each, exactly like Stage 4's teknik-aseptik.
//
// This file is the *shell*, and only the shell - same split as
// TeknikAseptikPage.tsx: the top bar, the PROSEDUR tracking card, the success
// note, the live region and the walk through PROCEDURE_STEPS. The workspace in
// the middle is a component of its own under kultur-mikroba/steps/, picked by
// the step's id.

const HOME_LEFT = 'max(12px, 2.499%)';
const BACK_LEFT = 'max(64px, 7.609%)';
const SOUND_LEFT = 'min(93.931%, 100% - 52px)';
const TOP_BAR_TOP = '3.574%';
const ICON_SIZE = '3.791%';

const HEADER_BAND_HEIGHT = 'max(60px, 7.682cqw)';
const HEADER_TEXT_LEFT = `max(116px, ${(264 / 1920) * 100}cqw)`;
const HEADER_TEXT_GAP = 10.3;

// The level Missions unlocks once this Stage's last authored step finishes
// (core/progress/levelProgress.ts: 1 = Teknik Kerja Aseptik, 2 = Pembuatan
// Media Kultur Mikroba).
const LEVEL_NUMBER = 2;

const enterDelay = (step: number) => step * STAGGER_MS;
const exitDelay = (step: number) => (ENTER_STEPS - step) * STAGGER_MS;

const initialFrame = (step: ProcedureStep): ProcedureFrame => ({
  src: step.initialBackground,
  alt: step.initialBackgroundAlt,
  rect: step.backgroundRect,
});

export function KulturMikroba() {
  const { goBack, goTo } = useNavigation();
  const isMobile = useIsMobile();
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [exiting, setExiting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showNote, setShowNote] = useState(false);
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
    markLevelCompleted(LEVEL_NUMBER);
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
      resetKey={frame.src}
      background={
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
          zIndex: 5,
        }}
      >
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
          <h1 style={{ ...textBase, fontSize: T(38, 15), fontWeight: 800, color: COLOR.navy }}>
            PEMBUATAN MEDIA KULTUR MIKROBA
          </h1>
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

      <ProcedureWorkspace key={step.id} step={step} runtime={runtime} />

      {showNote && !exiting ? <SuccessNote step={step} onContinue={handleContinue} /> : null}

      <p aria-live="polite" style={srOnly}>
        {message}
      </p>
    </Stage>
  );
}

function ProcedureWorkspace({ step, runtime }: { step: ProcedureStep; runtime: ProcedureRuntime }) {
  return <>{PROCEDURES[step.id]({ step, runtime })}</>;
}
