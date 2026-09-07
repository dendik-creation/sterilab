import { useCallback, useEffect, useRef, useState } from 'react';
import evaluasiBgUrl from '../../../../assets/images/02_scenes/04_04_evaluasi/backgrounds/evaluasi_bg.png';
import mascotPointingUrl from '../../../../assets/images/00_identity/mascot.png';
import mascotThumbsUpUrl from '../../../../assets/images/00_identity/mascot_thumbs_up.png';
import homeBtnUrl from '../../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import clickSfxUrl from '../../../../assets/sounds/01_reusable/short/click.webm';
import countSfxUrl from '../../../../assets/sounds/02_scenes/05_evaluation/count_effect.ogg';
import workThemeBgmUrl from '../../../../assets/sounds/02_scenes/05_evaluation/work_theme.webm';
import bellSfxUrl from '../../../../assets/sounds/02_scenes/05_evaluation/bell.webm';
import wrongSfxUrl from '../../../../assets/sounds/02_scenes/05_evaluation/quiz_wrong.webm';
import completeSfxUrl from '../../../../assets/sounds/02_scenes/05_evaluation/complete_evaluation.ogg';
import { useNavigation } from '../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../core/audio/audioSettings';
import { markLevelCompleted } from '../../../core/progress/levelProgress';
import { prefersReducedMotion } from '../../../core/a11y/motion';
import { rampVolume } from '../../../core/audio/fade';
import { resumeGlobalBgmFaded, stopGlobalBgmFaded } from '../../../core/audio/bgmPlayer';
import { Stage } from '../../components/Stage';
import { IconButton } from '../../components/IconButton';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ENTER_STEPS, EXIT_TOTAL_MS, HEADER_HEIGHT, S, STAGGER_MS, srOnly, textBase, COLOR } from './geometry';
import { ProgressCard } from './components/ProgressCard';
import { QuestionCard } from './components/QuestionCard';
import { ResultCard } from './components/ResultCard';
import { InstructionCard } from './components/InstructionCard';
import { Countdown } from './components/Countdown';
import { QUESTIONS, TOTAL_QUESTIONS, shuffledQuestions } from './questions';
import type { Question, QuestionOption } from './questions';

// Screen "Evaluasi" - Figma "Sterilab-APHP" canvas "Scene 07: Evaluasi"
// (node 314:2026), extended past the mock's two frames with a "petunjuk"
// screen and a 3-2-1 countdown ahead of "HALAMAN PENGERJAAN SOAL" (neither
// exists in the Figma file, both were requested after the initial slice).
// Level 4 - the last menu card Missions ships (core/progress/levelProgress.ts
// > LEVEL_COUNT); marking it complete closes out the whole progression the
// same way a Stage marks its own menu complete.
const LEVEL_NUMBER = 4;

const HOME_LEFT = 'max(12px, 2.499%)';
const BACK_LEFT = 'max(64px, 7.609%)';
const SOUND_LEFT = 'min(93.931%, 100% - 52px)';
const TOP_BAR_TOP = '3.574%';
const ICON_SIZE = '3.791%';

const COUNTDOWN_START = 3;
const COUNTDOWN_STEP_MS = 900;
const THEME_FADE_IN_MS = 700;
const THEME_FADE_OUT_MS = 200;
const GLOBAL_BGM_STOP_MS = 400;
const GLOBAL_BGM_RESUME_MS = 400;
const GLOBAL_BGM_QUICK_RESUME_MS = 150;

type Phase = 'instructions' | 'countdown' | 'soal' | 'hasil';

const enterDelay = (step: number) => step * STAGGER_MS;
const exitDelay = (step: number) => (ENTER_STEPS - step) * STAGGER_MS;

export function EvaluationPage() {
  const { goBack, goTo } = useNavigation();
  const isMobile = useIsMobile();
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [exiting, setExiting] = useState(false);
  const [phase, setPhase] = useState<Phase>('instructions');
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_START);
  const [questionList, setQuestionList] = useState<Question[]>(QUESTIONS);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuestionOption['key']>>({});
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const countAudioRef = useRef<HTMLAudioElement | null>(null);
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);
  const completeAudioRef = useRef<HTMLAudioElement | null>(null);
  const themeAudioRef = useRef<HTMLAudioElement | null>(null);
  const exitTimerRef = useRef(0);
  // True from the moment the global loop is stopped (countdown start) until
  // it's explicitly resumed (SELESAI) - the unmount cleanup below checks this
  // so leaving mid-quiz via Home/Back can't strand the app in silence.
  const globalBgmStoppedRef = useRef(false);
  // Guards the countdown-finished branch below against firing its side
  // effects (starting work_theme) more than once per attempt, whatever the
  // exact cause - reset on every "Mulai Evaluasi" so a replay still starts it.
  const themeStartedRef = useRef(false);

  const question = questionList[index];
  const selectedKey = answers[question.id];
  const answered = selectedKey !== undefined;
  const answeredCount = Object.keys(answers).length;
  const correctCount = questionList.reduce((n, q) => (answers[q.id] === q.correctKey ? n + 1 : n), 0);

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSfxUrl);
    countAudioRef.current = new Audio(countSfxUrl);
    bellAudioRef.current = new Audio(bellSfxUrl);
    wrongAudioRef.current = new Audio(wrongSfxUrl);
    completeAudioRef.current = new Audio(completeSfxUrl);
    const theme = new Audio(workThemeBgmUrl);
    theme.loop = true;
    themeAudioRef.current = theme;
  }, []);

  // Leaving this Screen by any route (Home, Back, browser navigation, or the
  // unmount that follows SELESAI's own transition) must never strand the
  // global loop stopped or the evaluation theme still playing underneath the
  // next Screen.
  useEffect(
    () => () => {
      window.clearTimeout(exitTimerRef.current);
      if (globalBgmStoppedRef.current) {
        globalBgmStoppedRef.current = false;
        resumeGlobalBgmFaded(GLOBAL_BGM_QUICK_RESUME_MS);
      }
      themeAudioRef.current?.pause();
    },
    [],
  );

  const playSfx = useCallback((ref: React.RefObject<HTMLAudioElement | null>) => {
    if (!isAudioEnabled()) return;
    const audio = ref.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }, []);

  const playClick = useCallback(() => playSfx(clickAudioRef), [playSfx]);

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

  // "Mulai Evaluasi": shuffle a fresh order, silence the global loop (faded,
  // not a hard cut), and hand off to the countdown effect below.
  const handleStartEvaluation = () => {
    playClick();
    setQuestionList(shuffledQuestions());
    setIndex(0);
    setAnswers({});
    globalBgmStoppedRef.current = true;
    themeStartedRef.current = false;
    stopGlobalBgmFaded(GLOBAL_BGM_STOP_MS);
    setCountdownValue(COUNTDOWN_START);
    setPhase('countdown');
  };

  // Ticks 3 -> 2 -> 1 (each tick replays Countdown's rise-in-fade via its own
  // `key`, per COUNTDOWN_STEP_MS) then hands off to the first soal, starting
  // the evaluation's own theme with a fade-in.
  //
  // The "reached zero" side effects (setPhase, starting work_theme) live in
  // the setInterval callback's own body, tracked with a plain closure
  // variable - NOT inside the setCountdownValue *updater function* passed to
  // it. React 18 StrictMode double-invokes updater functions in development
  // to catch impure ones, and an updater that starts audio as a side effect
  // gets that audio started twice; a plain value passed to setState (or a
  // side effect that merely sits beside the setState call) isn't re-invoked.
  useEffect(() => {
    if (phase !== 'countdown') return;
    let ticksElapsed = 0;
    const id = window.setInterval(() => {
      ticksElapsed += 1;
      if (ticksElapsed >= COUNTDOWN_START) {
        window.clearInterval(id);
        setPhase('soal');
        if (!themeStartedRef.current) {
          themeStartedRef.current = true;
          const theme = themeAudioRef.current;
          if (theme) {
            theme.currentTime = 0;
            theme.volume = 0;
            theme.muted = !isAudioEnabled();
            void theme.play().catch(() => {});
            rampVolume(theme, 1, THEME_FADE_IN_MS);
          }
        }
        return;
      }
      setCountdownValue(COUNTDOWN_START - ticksElapsed);
    }, COUNTDOWN_STEP_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  // Deduped by digit (not a bare mount effect) so StrictMode replaying this
  // effect for the same countdownValue is a no-op, while a genuine 3 -> 2 -> 1
  // change still beeps every time.
  const lastCountedRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== 'countdown') {
      lastCountedRef.current = null;
      return;
    }
    if (lastCountedRef.current === countdownValue) return;
    lastCountedRef.current = countdownValue;
    playSfx(countAudioRef);
  }, [phase, countdownValue, playSfx]);

  const handleSelect = (key: QuestionOption['key']) => {
    if (answered) return;
    playSfx(key === question.correctKey ? bellAudioRef : wrongAudioRef);
    setAnswers((prev) => ({ ...prev, [question.id]: key }));
  };

  const handleNext = () => {
    if (!answered) return;
    playClick();
    if (index + 1 < TOTAL_QUESTIONS) {
      setIndex(index + 1);
      return;
    }
    const theme = themeAudioRef.current;
    if (theme) rampVolume(theme, 0, THEME_FADE_OUT_MS, () => theme.pause());
    playSfx(completeAudioRef);
    setPhase('hasil');
  };

  const handleFinish = () => {
    globalBgmStoppedRef.current = false;
    resumeGlobalBgmFaded(GLOBAL_BGM_RESUME_MS);
    markLevelCompleted(LEVEL_NUMBER);
    leaveTo(goBack);
  };

  const anim = (rung: number) => ({
    className: exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in',
    delay: exiting ? exitDelay(rung) : enterDelay(rung),
  });

  return (
    <Stage
      background={
        <img
          src={evaluasiBgUrl}
          alt="Laboratorium mikrobiologi SteriLab"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      }
    >
      <>
        <header
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: HEADER_HEIGHT,
            background: COLOR.band,
            borderBottom: `max(1px, 0.104cqw) solid ${COLOR.navy}`,
            display: 'flex',
            alignItems: 'center',
            zIndex: 5,
          }}
        >
          <div
            className={anim(0).className}
            style={{
              marginLeft: `max(116px, ${S(264)})`,
              display: 'flex',
              flexDirection: 'column',
              gap: S(10.3),
              whiteSpace: 'nowrap',
              animationDelay: `${anim(0).delay}ms`,
            }}
          >
            <h1 style={{ ...textBase, fontSize: 'max(20px, max(15px, 1.875cqw))', fontWeight: 800, color: COLOR.navy }}>
              EVALUASI STERILAB
            </h1>
            <p style={{ ...textBase, fontSize: 'max(13px, max(10px, 1.25cqw))', fontWeight: 500, color: COLOR.navy }}>
              Ukur pemahamanmu setelah menyelesaikan praktik
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

        {phase === 'instructions' ? (
          <>
            <InstructionCard animation={anim(1)} onStart={handleStartEvaluation} />
            {!isMobile ? (
              <img
                src={mascotPointingUrl}
                alt=""
                aria-hidden="true"
                className={anim(1).className}
                style={{
                  position: 'absolute',
                  left: S(1591),
                  top: S(285),
                  width: S(440),
                  animationDelay: `${anim(1).delay}ms`,
                }}
              />
            ) : null}
          </>
        ) : null}

        {phase === 'countdown' ? (
          <Countdown key={countdownValue} value={countdownValue} animated={!prefersReducedMotion()} />
        ) : null}

        {phase === 'soal' ? (
          <>
            <ProgressCard
              current={index + 1}
              answeredCount={answeredCount}
              showDots={!isMobile}
              animation={anim(1)}
            />
            <QuestionCard
              key={question.id}
              question={question}
              index={index + 1}
              selectedKey={selectedKey}
              answered={answered}
              animation={anim(2)}
              onSelect={handleSelect}
              onNext={handleNext}
            />
            {!isMobile ? (
              <img
                src={mascotPointingUrl}
                alt=""
                aria-hidden="true"
                className={anim(2).className}
                style={{
                  position: 'absolute',
                  left: S(1591),
                  top: S(285),
                  width: S(440),
                  animationDelay: `${anim(2).delay}ms`,
                }}
              />
            ) : null}
            <p aria-live="polite" style={srOnly}>
              {answered
                ? selectedKey === question.correctKey
                  ? `Soal ${index + 1}: jawaban benar.`
                  : `Soal ${index + 1}: jawaban kurang tepat. Jawaban benar ${question.correctKey}.`
                : ''}
            </p>
          </>
        ) : null}

        {phase === 'hasil' ? (
          <>
            <ResultCard correctCount={correctCount} animation={anim(1)} />
            {!isMobile ? (
              <img
                src={mascotThumbsUpUrl}
                alt=""
                aria-hidden="true"
                className={anim(1).className}
                style={{
                  position: 'absolute',
                  left: S(1387),
                  top: S(273),
                  width: S(473),
                  animationDelay: `${anim(1).delay}ms`,
                }}
              />
            ) : null}
            <div style={{ position: 'absolute', left: '50%', top: S(668), transform: 'translateX(-50%)', zIndex: 5 }}>
              {/* Centering transform and bubble animation split across two
                  elements - see QuestionCard's identical split for why. */}
              <button
                type="button"
                className={anim(2).className}
                onClick={handleFinish}
                style={{
                  ...textBase,
                  display: 'block',
                  animationDelay: `${anim(2).delay}ms`,
                  padding: `${S(18)} ${S(40)}`,
                  borderRadius: 999,
                  border: 'none',
                  background: COLOR.ctaBlue,
                  color: '#FFFFFF',
                  fontSize: 'max(14px, max(11px, 1.667cqw))',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                SELESAI →
              </button>
            </div>
            <p aria-live="polite" style={srOnly}>
              {`Skor akhir ${correctCount * 10} dari 100, ${correctCount} dari ${TOTAL_QUESTIONS} jawaban benar.`}
            </p>
          </>
        ) : null}
      </>
    </Stage>
  );
}
