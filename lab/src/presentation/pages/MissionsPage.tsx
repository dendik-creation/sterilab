import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import levelsBgUrl from '../../../assets/images/02_scenes/04_levels/levels_bg.png';
import level1CardUrl from '../../../assets/images/02_scenes/04_levels/level_1_card.png';
import level2CardUrl from '../../../assets/images/02_scenes/04_levels/level_2_card.png';
import level3CardUrl from '../../../assets/images/02_scenes/04_levels/level_3_card.png';
import level4CardUrl from '../../../assets/images/02_scenes/04_levels/level_4_card.png';
import level5CardUrl from '../../../assets/images/02_scenes/04_levels/level_5_card.png';
import startBtnUrl from '../../../assets/images/02_scenes/04_levels/start_btn.png';
import lockedBtnUrl from '../../../assets/images/02_scenes/04_levels/locked_btn.png';
import noteCardUrl from '../../../assets/images/02_scenes/04_levels/note_card.png';
import homeBtnUrl from '../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import clickSfxUrl from '../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../app/navigation';
import type { ScreenId, ScreenParams } from '../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../core/audio/audioSettings';
import { prefersReducedMotion } from '../../core/a11y/motion';
import { getCompletedLevelCount, levelStatusFor, onLevelProgressChange } from '../../core/progress/levelProgress';
import type { LevelStatus } from '../../core/progress/levelProgress';
import { Stage } from '../components/Stage';
import { IconButton } from '../components/IconButton';

// Screen 5 - Missions, the lab dashboard the Analyst navigates from. Figma
// "Sterilab-APHP" node 29:2435 "Scene 03: Navigasi (Menu Utama)", frame 42:36
// (1920x1080). levels_bg.png already bakes the "Selamat datang di dashboard
// STERILAB" heading and its paragraph, so nothing here re-renders that copy -
// the only sliced pieces are the five numbered menu cards, their MULAI /
// TERKUNCI pills, and the bottom note card, each placed at that frame's own
// x/y as a percentage of the 1920x1080 canvas (Stage keeps both its layers on
// the same 16:9 box, so a canvas percentage lands on the same point in either).
interface LevelDef {
  n: number;
  src: string;
  // Card title exactly as baked into the art - used for the accessible name,
  // never re-rendered as text on top of the image.
  title: string;
  screen: ScreenId;
  params?: ScreenParams;
  // Figma group x / intrinsic asset width, both over the 1920px canvas. Card 1
  // exports 3px narrower than its siblings (its Figma group bounds exclude the
  // duplicated drop-shadow layer), hence the per-card width rather than one
  // shared value.
  leftPct: string;
  widthPct: string;
  aspect: string;
}

const LEVELS: LevelDef[] = [
  {
    n: 1,
    src: level1CardUrl,
    title: 'Teknik Kerja Aseptik',
    screen: 'stage',
    params: { stageId: 'teknik-aseptik' },
    leftPct: '13.171%',
    widthPct: '13.229%',
    aspect: '254 / 430',
  },
  {
    n: 2,
    src: level2CardUrl,
    title: 'Pembuatan Media Kultur Mikroba',
    screen: 'stage',
    params: { stageId: 'media-kultur' },
    leftPct: '28.332%',
    widthPct: '13.385%',
    aspect: '257 / 430',
  },
  {
    n: 3,
    src: level3CardUrl,
    title: 'Pengelolaan Limbah Laboratorium',
    screen: 'stage',
    params: { stageId: 'pengelolaan-limbah' },
    leftPct: '43.493%',
    widthPct: '13.385%',
    aspect: '257 / 430',
  },
  {
    n: 4,
    src: level4CardUrl,
    title: 'Evaluasi',
    screen: 'evaluation',
    leftPct: '58.655%',
    widthPct: '13.385%',
    aspect: '257 / 430',
  },
  {
    n: 5,
    src: level5CardUrl,
    title: 'Refleksi',
    screen: 'reflection',
    leftPct: '73.816%',
    widthPct: '13.385%',
    aspect: '257 / 430',
  },
];

// Figma 42:36: every card sits at y=421.195 of 1080, and every MULAI /
// TERKUNCI pill at y=787.783 - i.e. 85.25% down the card's own 430px height.
const CARD_TOP = '39%';
const PILL_TOP = '85.25%';

// Bottom note card (Figma group 42:677, x=617.487 y=962.149, asset 688x96).
const NOTE_LEFT = '32.161%';
const NOTE_TOP = '89.088%';
const NOTE_WIDTH = '35.833%';

// Staggered entrance, then the exact reverse on the way out (top bar first in
// / last out, then cards 1-5, then the note card). Mirrors SplashPage's Home
// exit: the Screen holds its content on screen for the full transition instead
// of swapping out from under a still-visible UI.
const STAGGER_MS = 110;
const BUBBLE_MS = 550;
const ENTER_STEPS = 1 + LEVELS.length; // top bar, then each card
// The top bar is last out, so it - not the note card's 600ms fall - sets when
// the Screen may actually swap.
const EXIT_TOTAL_MS = ENTER_STEPS * STAGGER_MS + BUBBLE_MS;

const enterDelay = (step: number) => step * STAGGER_MS;
// Exit runs the same ladder backwards: the note card (last in) leaves first.
const exitDelay = (step: number) => (ENTER_STEPS - step) * STAGGER_MS;

// The top-bar percentages come straight from Figma (home x=47.974, back
// x=146.103, sound x=1803.486, all 72.78px square on 1920), but IconButton
// floors every icon to a 44px WCAG 2.2 AA touch target - on the smallest
// supported landscape viewport (568x320) that floor makes the icons ~2x their
// designed size, so the raw percentages would overlap each other on the left
// and push the sound icon past the right edge. Each offset is floored/capped
// the same way the size is, so the bar degrades instead of colliding.
const HOME_LEFT = 'max(12px, 2.499%)';
const BACK_LEFT = 'max(64px, 7.609%)';
const SOUND_LEFT = 'min(93.931%, 100% - 52px)';
const TOP_BAR_TOP = '3.574%';
const ICON_SIZE = '3.791%';

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

export function MissionsPage() {
  const { goTo, goBack } = useNavigation();
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [completed, setCompleted] = useState(getCompletedLevelCount);
  const [exiting, setExiting] = useState(false);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const exitTimeoutRef = useRef(0);

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSfxUrl);
  }, []);

  // A Stage screen can mark its menu completed while this Screen is still
  // mounted in the navigation stack, so the unlock state is subscribed to
  // rather than read once.
  useEffect(() => onLevelProgressChange(setCompleted), []);

  useEffect(() => () => window.clearTimeout(exitTimeoutRef.current), []);

  const playClick = () => {
    if (!isAudioEnabled()) return;
    const audio = clickAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  const handleToggleSound = () => {
    const enabled = toggleAudioEnabled();
    setAudioOn(enabled);
    if (enabled) playClick();
  };

  // Every way off this Screen runs the exit transition first - otherwise the
  // reverse-stagger only ever plays for one of the three exits.
  const leaveTo = (navigate: () => void) => {
    if (exiting) return;
    playClick();
    if (prefersReducedMotion()) {
      navigate();
      return;
    }
    setExiting(true);
    exitTimeoutRef.current = window.setTimeout(navigate, EXIT_TOTAL_MS);
  };

  return (
    <Stage
      background={
        <img
          src={levelsBgUrl}
          alt="Dashboard SteriLab: ruang laboratorium mikrobiologi dengan rak reagen, mikroskop, dan Laminar Air Flow"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      }
    >
      {/* The heading and its paragraph are painted into levels_bg.png, so the
          Screen would otherwise have no heading in the accessibility tree. */}
      <h1 style={srOnly}>
        Selamat datang di dashboard SteriLab. Pilih menu pembelajaran secara berurutan untuk menyelesaikan setiap misi
        sebagai analis laboratorium mikrobiologi.
      </h1>

      <IconButton
        src={homeBtnUrl}
        alt="Menu Utama"
        label="Menu Utama"
        top={TOP_BAR_TOP}
        left={HOME_LEFT}
        size={ICON_SIZE}
        animationClassName={exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'}
        animationDelayMs={exiting ? exitDelay(0) : enterDelay(0)}
        onClick={() => leaveTo(() => goTo('splash'))}
      />
      <IconButton
        src={backBtnUrl}
        alt="Kembali"
        label="Kembali"
        top={TOP_BAR_TOP}
        left={BACK_LEFT}
        size={ICON_SIZE}
        animationClassName={exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'}
        animationDelayMs={exiting ? exitDelay(0) : enterDelay(0)}
        onClick={() => leaveTo(goBack)}
      />
      <IconButton
        src={audioOn ? bgmOnBtnUrl : bgmOffBtnUrl}
        alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        top={TOP_BAR_TOP}
        left={SOUND_LEFT}
        size={ICON_SIZE}
        animationClassName={exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'}
        animationDelayMs={exiting ? exitDelay(0) : enterDelay(0)}
        onClick={handleToggleSound}
      />

      {LEVELS.map((level, index) => (
        <LevelCard
          key={level.n}
          level={level}
          status={levelStatusFor(completed, level.n)}
          exiting={exiting}
          delayMs={exiting ? exitDelay(index + 1) : enterDelay(index + 1)}
          onSelect={() => leaveTo(() => goTo(level.screen, level.params))}
        />
      ))}

      <div
        className={exiting ? 'sterilab-fall-out-fade' : 'sterilab-rise-in-fade'}
        style={{
          position: 'absolute',
          top: NOTE_TOP,
          left: NOTE_LEFT,
          width: NOTE_WIDTH,
          animationDelay: `${exiting ? exitDelay(ENTER_STEPS) : enterDelay(ENTER_STEPS)}ms`,
        }}
      >
        <img
          src={noteCardUrl}
          alt="Selesaikan setiap menu secara berurutan untuk membuka misi berikutnya."
          style={{ width: '100%', display: 'block', aspectRatio: '688 / 96' }}
        />
      </div>
    </Stage>
  );
}

// One menu card. The whole card is the control, not just the MULAI pill: at
// 568x320 that pill renders ~40x12 CSS px, well under the 44x44 touch target,
// while the card itself never drops below ~76x127.
function LevelCard({
  level,
  status,
  exiting,
  delayMs,
  onSelect,
}: {
  level: LevelDef;
  status: LevelStatus;
  exiting: boolean;
  delayMs: number;
  onSelect: () => void;
}) {
  const locked = status === 'locked';
  const pillSrc = locked ? lockedBtnUrl : startBtnUrl;
  // Both pills are 41px tall; TERKUNCI is 142px wide against the card's 257,
  // MULAI 137px against card 1's 254 - so the ratio is per-pill, not shared.
  const pillWidth = locked ? '55.25%' : level.n === 1 ? '53.937%' : '55.253%';
  const pillAspect = locked ? '142 / 41' : '137 / 41';

  // "Terkunci" must say why, not just look grey (TASKS.md > Screen 5).
  const label = locked
    ? `Misi ${level.n}: ${level.title} - terkunci. Selesaikan Misi ${level.n - 1} lebih dulu.`
    : status === 'completed'
      ? `Ulangi Misi ${level.n}: ${level.title}`
      : `Mulai Misi ${level.n}: ${level.title}`;

  return (
    // Outer element owns the entrance/exit animation, inner button owns the
    // hover/press transform - a running animation with `both` fill would
    // otherwise override an inline `transform` set on the same element.
    <div
      className={exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'}
      style={{
        position: 'absolute',
        top: CARD_TOP,
        left: level.leftPct,
        width: level.widthPct,
        animationDelay: `${delayMs}ms`,
      }}
    >
      <button
        type="button"
        onClick={locked ? undefined : onSelect}
        disabled={locked}
        aria-label={label}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          aspectRatio: level.aspect,
          border: 'none',
          padding: 0,
          background: 'transparent',
          cursor: locked ? 'not-allowed' : 'pointer',
          transition: 'transform 120ms ease-out, filter 120ms ease-out',
        }}
        onPointerOver={(e) => {
          if (!locked) e.currentTarget.style.transform = 'scale(1.035)';
        }}
        onPointerOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onPointerDown={(e) => {
          if (!locked) e.currentTarget.style.filter = 'brightness(0.94)';
        }}
        onPointerUp={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        <img src={level.src} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block' }} />
        <img
          src={pillSrc}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: PILL_TOP,
            left: '50%',
            transform: 'translateX(-50%)',
            width: pillWidth,
            aspectRatio: pillAspect,
            display: 'block',
          }}
        />
      </button>
    </div>
  );
}
