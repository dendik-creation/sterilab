import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import evaluationBgUrl from '../../../../assets/images/02_scenes/04_04_evaluasi/backgrounds/evaluasi_bg.png';
import mascotUrl from '../../../../assets/images/00_identity/mascot.png';
import mission1Url from '../../../../assets/images/02_scenes/04_04_evaluasi/04_04_00_pilih_misi/card-misi-1.png';
import mission2Url from '../../../../assets/images/02_scenes/04_04_evaluasi/04_04_00_pilih_misi/card-misi-2.png';
import mission3Url from '../../../../assets/images/02_scenes/04_04_evaluasi/04_04_00_pilih_misi/card-misi-3.png';
import mission4Url from '../../../../assets/images/02_scenes/04_04_evaluasi/04_04_00_pilih_misi/card-misi-4.png';
import startBtnUrl from '../../../../assets/images/02_scenes/04_levels/start_btn.png';
import lockedBtnUrl from '../../../../assets/images/02_scenes/04_levels/locked_btn.png';
import homeBtnUrl from '../../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import clickSfxUrl from '../../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../core/audio/audioSettings';
import { prefersReducedMotion } from '../../../core/a11y/motion';
import { EVALUATION_MISSION_COUNT, evaluationMissionStatusFor, getCompletedEvaluationMissionCount, onEvaluationProgressChange } from '../../../core/progress/evaluationProgress';
import { Stage } from '../../components/Stage';
import { IconButton } from '../../components/IconButton';
import { COLOR, S, T, textBase } from '../stages/teknik-aseptik/geometry';

const HOME_LEFT = 'max(12px, 2.499%)';
const BACK_LEFT = 'max(64px, 7.609%)';
const SOUND_LEFT = 'min(93.931%, 100% - 52px)';
const TOP_BAR_TOP = '3.574%';
const ICON_SIZE = '3.791%';
const HEADER_BAND_HEIGHT = 'max(60px, 7.682cqw)';
const HEADER_TEXT_LEFT = `max(116px, ${S(264)})`;
const HEADER_TEXT_GAP = 10.3;
const CARD_TOPS = [S(192), S(607)];
const STAGGER_MS = 110;
const BUBBLE_MS = 550;
const ENTER_STEPS = 5;
const EXIT_TOTAL_MS = ENTER_STEPS * STAGGER_MS + BUBBLE_MS;

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

type Mission = {
  n: number;
  src: string;
  title: string;
  left: string;
  width: string;
  aspect: string;
};

const MISSIONS: Mission[] = [
  { n: 1, src: mission1Url, title: 'Temukan Kesalahan', left: '23.125%', width: '25.514%', aspect: '493 / 387' },
  { n: 2, src: mission2Url, title: 'Susun Prosedur PDA', left: '50.833%', width: '26.042%', aspect: '504 / 387' },
  { n: 3, src: mission3Url, title: 'Investigasi Mutu Media', left: '23.125%', width: '25.729%', aspect: '494 / 393' },
  { n: 4, src: mission4Url, title: 'Evaluasi Limbah', left: '50.833%', width: '26.146%', aspect: '502 / 392' },
];

const enterDelay = (step: number) => step * STAGGER_MS;
const exitDelay = (step: number) => (ENTER_STEPS - step) * STAGGER_MS;

export function EvaluationPage() {
  const { goBack, goTo } = useNavigation();
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [exiting, setExiting] = useState(false);
  const [startedMission, setStartedMission] = useState<number | null>(null);
  const [completedMissions, setCompletedMissions] = useState(getCompletedEvaluationMissionCount);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const exitTimerRef = useRef(0);

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSfxUrl);
    return () => window.clearTimeout(exitTimerRef.current);
  }, []);

  useEffect(() => onEvaluationProgressChange(setCompletedMissions), []);

  const playClick = () => {
    if (!isAudioEnabled() || !clickAudioRef.current) return;
    clickAudioRef.current.currentTime = 0;
    void clickAudioRef.current.play().catch(() => {});
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

  const animation = (step: number) => ({
    className: exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in',
    delay: exiting ? exitDelay(step) : enterDelay(step),
  });

  return (
    <Stage
      background={
        <img
          src={evaluationBgUrl}
          alt="Laboratorium mikrobiologi SteriLab"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      }
    >
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_BAND_HEIGHT,
          background: COLOR.band,
          borderBottom: `${T(2, 1)} solid ${COLOR.navy}`,
          display: 'flex',
          alignItems: 'center',
          zIndex: 5,
        }}
      >
        <div
          className={animation(0).className}
          style={{
            marginLeft: HEADER_TEXT_LEFT,
            display: 'flex',
            flexDirection: 'column',
            gap: S(HEADER_TEXT_GAP),
            whiteSpace: 'nowrap',
            animationDelay: `${animation(0).delay}ms`,
          }}
        >
          <h1 style={{ ...textBase, fontSize: T(38, 15), fontWeight: 800, color: COLOR.navy }}>EVALUASI STERILAB</h1>
          <p style={{ ...textBase, fontSize: T(25, 10), fontWeight: 500, color: COLOR.navy }}>
            Selesaikan empat misi untuk menguji kemampuanmu dalam menerapkan prosedur laboratorium mikrobiologi.
          </p>
        </div>
      </header>
      <img src={mascotUrl} alt="" aria-hidden="true" style={{ position: 'absolute', left: '77.76%', top: '26.389%', width: '22.917%', zIndex: 2 }} />

      <p style={srOnly}>Selesaikan empat misi untuk menguji kemampuanmu dalam menerapkan prosedur laboratorium mikrobiologi.</p>

      <IconButton src={homeBtnUrl} alt="Menu Utama" label="Menu Utama" top={TOP_BAR_TOP} left={HOME_LEFT} size={ICON_SIZE} animationClassName={animation(0).className} animationDelayMs={animation(0).delay} zIndex={6} onClick={() => leaveTo(() => goTo('splash'))} />
      <IconButton src={backBtnUrl} alt="Kembali" label="Kembali" top={TOP_BAR_TOP} left={BACK_LEFT} size={ICON_SIZE} animationClassName={animation(0).className} animationDelayMs={animation(0).delay} zIndex={6} onClick={() => leaveTo(goBack)} />
      <IconButton
        src={audioOn ? bgmOnBtnUrl : bgmOffBtnUrl}
        alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        top={TOP_BAR_TOP}
        left={SOUND_LEFT}
        size={ICON_SIZE}
        animationClassName={animation(0).className}
        animationDelayMs={animation(0).delay}
        zIndex={6}
        onClick={() => {
          const enabled = toggleAudioEnabled();
          setAudioOn(enabled);
          if (enabled) playClick();
        }}
      />

      <ProgressCard animation={animation(1)} completed={completedMissions} />
      {MISSIONS.map((mission, index) => (
        <MissionCard
          key={mission.n}
          mission={mission}
          status={evaluationMissionStatusFor(completedMissions, mission.n)}
          started={startedMission === mission.n}
          animation={animation(index + 1)}
           top={CARD_TOPS[Math.floor(index / 2)]}
          onStart={() => {
            setStartedMission(mission.n);
             if (mission.n === 1) leaveTo(() => goTo('evaluation-mission-1'));
              if (mission.n === 2) leaveTo(() => goTo('evaluation-mission-2'));
              if (mission.n === 3) leaveTo(() => goTo('evaluation-mission-3'));
              if (mission.n === 4) leaveTo(() => goTo('evaluation-mission-4'));
          }}
        />
      ))}

      <p
        className={exiting ? 'sterilab-fall-out-fade' : 'sterilab-rise-in-fade'}
        style={{ ...srOnly, animationDelay: `${exiting ? exitDelay(ENTER_STEPS) : enterDelay(ENTER_STEPS)}ms` }}
        aria-live="polite"
      >
        {startedMission ? `Misi ${startedMission} dipilih.` : ''}
      </p>
    </Stage>
  );
}

function ProgressCard({ animation, completed }: { animation: { className: string; delay: number }; completed: number }) {
  return (
    <div className={animation.className} style={{ position: 'absolute', left: '1.563%', top: '45.648%', width: '19.845%', zIndex: 4, animationDelay: `${animation.delay}ms` }}>
      <div style={{ background: '#04488B', borderRadius: '1.51cqw 1.51cqw 0 0', padding: '3.2% 0', textAlign: 'center' }}>
        <span style={progressText}>PROGRESS EVALUASI</span>
      </div>
      <div style={{ background: '#FFFFFF', borderRadius: '0 0 1.51cqw 1.51cqw', padding: '8% 8% 8.5%' }}>
        <div style={{ margin: '0 auto 8%', width: '60%', borderRadius: 999, background: '#3471C7', padding: '3% 0', textAlign: 'center' }}>
          <span data-testid="evaluation-progress-count" role="status" style={progressText}>{completed}/{EVALUATION_MISSION_COUNT} misi selesai</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[1, 2, 3, 4].map((n) => {
            const status = evaluationMissionStatusFor(completed, n);
            return (
              <span
                key={n}
                data-testid={`evaluation-progress-mission-${n}`}
                data-status={status}
                aria-label={`Misi ${n}: ${status}`}
                style={{ ...dotText, background: status === 'completed' ? '#008C3B' : status === 'available' ? '#C3E5FE' : 'transparent', borderColor: status === 'completed' ? '#008C3B' : status === 'available' ? '#3471C7' : '#7A9CC4', color: status === 'completed' ? '#FFFFFF' : '#232D84' }}
              >
                {n}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MissionCard({ mission, status, started, animation, top, onStart }: { mission: Mission; status: 'completed' | 'available' | 'locked'; started: boolean; animation: { className: string; delay: number }; top: string; onStart: () => void }) {
  const locked = status === 'locked';
  return (
    <div className={animation.className} style={{ position: 'absolute', top, left: mission.left, width: mission.width, zIndex: 3, animationDelay: `${animation.delay}ms` }}>
      <button
        type="button"
        disabled={locked}
        data-testid={`evaluation-mission-card-${mission.n}`}
        data-status={status}
        aria-label={locked ? `Misi ${mission.n}: ${mission.title}, terkunci` : status === 'completed' ? `Ulangi Misi ${mission.n}: ${mission.title}` : `Mulai Misi ${mission.n}: ${mission.title}`}
        onClick={locked ? undefined : onStart}
        style={{ display: 'block', width: '100%', aspectRatio: mission.aspect, padding: 0, border: 0, background: 'transparent', cursor: locked ? 'not-allowed' : 'pointer', transition: 'transform 120ms ease-out, filter 120ms ease-out' }}
        onPointerOver={(event) => { if (!locked) event.currentTarget.style.transform = 'scale(1.015)'; }}
        onPointerOut={(event) => { event.currentTarget.style.transform = 'scale(1)'; }}
        onPointerDown={(event) => { if (!locked) event.currentTarget.style.filter = 'brightness(.94)'; }}
        onPointerUp={(event) => { event.currentTarget.style.filter = 'brightness(1)'; }}
      >
        <img src={mission.src} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block' }} />
        <img
          src={locked ? lockedBtnUrl : startBtnUrl}
          alt=""
          aria-hidden="true"
          style={{ position: 'absolute', top: '84%', left: '50%', width: locked ? '28.8%' : '27.8%', transform: 'translateX(-50%)', display: 'block' }}
        />
      </button>
      {started ? <span style={srOnly}>Misi dipilih</span> : null}
    </div>
  );
}

const progressText: CSSProperties = { color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif", fontSize: 'max(10px, 1.25cqw)', fontWeight: 800, lineHeight: 1 };
const dotText: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.35cqw', aspectRatio: '1', border: 'max(1px, .08cqw) solid #7A9CC4', borderRadius: '50%', color: '#232D84', fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif", fontSize: 'max(10px, 1.1cqw)', fontWeight: 700 };
