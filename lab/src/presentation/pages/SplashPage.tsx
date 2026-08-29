import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import splashBgUrl from '../../../assets/images/02_scenes/01_splash/splash_bg.png';
import mainLogoUrl from '../../../assets/images/00_identity/main_logo.png';
import touchAnythingUrl from '../../../assets/images/02_scenes/01_splash/touch_anything.png';
import homeBgUrl from '../../../assets/images/02_scenes/02_home/home_bg.png';
import greetingUrl from '../../../assets/images/02_scenes/02_home/greeting.png';
import exploreBtnUrl from '../../../assets/images/02_scenes/02_home/explore_btn.png';
import bgmOnBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import exitBtnUrl from '../../../assets/images/01_reusable/buttons/exit_button.png';
import clickSfxUrl from '../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../core/audio/audioSettings';
import { prefersReducedMotion } from '../../core/a11y/motion';
import { Stage } from '../components/Stage';
import { IconButton } from '../components/IconButton';

// Screen 1 - Splash & Cover, merged into a single Screen/component (was two
// chained Phaser scenes, BootScene -> HomeScene; ADR-0001 scopes Phaser to
// the 5 Stage canvases only, so this is now plain DOM/React - see
// docs/adr/0005-single-path-spa-navigation.md). Figma "Sterilab-APHP" nodes
// 9:500 (Loading), 9:501 (After Loading), 2:3 (Home).
type Phase = 'loading' | 'touch' | 'home';

const MIN_LOADING_DISPLAY_MS = 1000;

// Home phase exit ("Mulai Menjelajah"): every element bubbles back out
// before the Screen actually switches to Case, mirroring the entrance -
// matches HomeScene.ts's old bubbleInExit() Phaser tween, ported to CSS.
const HOME_ELEMENT_COUNT = 5; // logo, greeting, explore, exit, sound
const HOME_EXIT_STAGGER_MS = 120;
const HOME_EXIT_DURATION_MS = 550;
const HOME_EXIT_TOTAL_MS = (HOME_ELEMENT_COUNT - 1) * HOME_EXIT_STAGGER_MS + HOME_EXIT_DURATION_MS;

// Preloaded so the Home phase (shown immediately after the touch-anywhere
// tap, no further wait) never pops its art in mid-decode.
const PRELOAD_IMAGE_URLS = [
  splashBgUrl,
  mainLogoUrl,
  touchAnythingUrl,
  homeBgUrl,
  greetingUrl,
  exploreBtnUrl,
  bgmOnBtnUrl,
  bgmOffBtnUrl,
  exitBtnUrl,
];

function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // one broken asset must not block the whole app
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}

// Must run synchronously inside the tap/click/keydown handler - browsers
// only grant the Fullscreen API within a real user-gesture call stack. Once
// granted here it persists across every later Screen (no more requests, no
// re-entry) because Screen navigation never unmounts <html>/<body>.
function requestFullscreenOnce(): void {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen().catch(() => {
      // Fullscreen can be denied (iOS Safari, embedded iframe, etc) - the
      // app must keep working windowed rather than block on this.
    });
  }
}

// Centers a child at (top,left) via a static wrapper - keeps translate(-50%,
// -50%) positioning on a *different* element than the one the bubble-in/pulse
// animation puts its own `transform: scale(...)` on, so the two transforms
// never fight over the same `transform` property (and reduced-motion can
// zero the inner animation without losing the outer centering).
function Centered({ top, left, width, children }: { top: string; left: string; width?: string; children: ReactNode }) {
  const style: CSSProperties = { position: 'absolute', top, left, transform: 'translate(-50%, -50%)' };
  if (width) style.width = width;
  return <div style={style}>{children}</div>;
}

export function SplashPage() {
  const { goTo } = useNavigation();
  const [phase, setPhase] = useState<Phase>('loading');
  const [percent, setPercent] = useState(0);
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [homeExiting, setHomeExiting] = useState(false);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const assetsReadyRef = useRef(false);
  const minDisplayElapsedRef = useRef(false);
  const exitTimeoutRef = useRef(0);

  useEffect(() => () => window.clearTimeout(exitTimeoutRef.current), []);

  // Called from whichever of the two independent gates below (real asset
  // preload, floored display timer) finishes second - not a synchronizing
  // effect watching both, since that would fire an extra render for no reason.
  const tryProceedToTouch = () => {
    if (assetsReadyRef.current && minDisplayElapsedRef.current) setPhase('touch');
  };

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSfxUrl);
  }, []);

  const playClick = () => {
    if (!isAudioEnabled()) return;
    const audio = clickAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  // Real preload gate - the bar reaching 100% and the phase actually
  // advancing are decoupled from raw byte progress the same way the old
  // Phaser tween was (mock progress animation, floored display time).
  useEffect(() => {
    let cancelled = false;
    preloadImages(PRELOAD_IMAGE_URLS).then(() => {
      if (cancelled) return;
      assetsReadyRef.current = true;
      tryProceedToTouch();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let raf = 0;
    let holdTimeout = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / MIN_LOADING_DISPLAY_MS);
      const eased = Math.sin((t * Math.PI) / 2); // Sine.easeOut
      setPercent(t < 1 ? Math.round(eased * 100) : 100);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // Hold "100% Memuat Konten" on screen for a beat instead of flipping
      // phase the instant the tween ends - otherwise the Analyst (and any
      // observer) never actually sees it reach 100, only ~90-something.
      holdTimeout = window.setTimeout(() => {
        minDisplayElapsedRef.current = true;
        tryProceedToTouch();
      }, 200);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(holdTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdvance = () => {
    playClick();
    requestFullscreenOnce();
    setPhase('home');
  };

  const handleAdvanceKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleAdvance();
    }
  };

  const handleToggleSound = () => {
    const enabled = toggleAudioEnabled();
    setAudioOn(enabled);
    if (enabled) playClick();
  };

  const handleExplore = () => {
    if (homeExiting) return;
    playClick();
    if (prefersReducedMotion()) {
      goTo('case');
      return;
    }
    setHomeExiting(true);
    exitTimeoutRef.current = window.setTimeout(() => goTo('case'), HOME_EXIT_TOTAL_MS);
  };

  const handleExit = () => {
    playClick();
    window.close();
  };

  if (phase === 'home') {
    return (
      <Stage
        background={
          <img
            src={homeBgUrl}
            alt="Laboratorium mikrobiologi pangan modern dengan analis ber-APD, mikroskop, dan Laminar Air Flow"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        }
      >
        <Centered top="44.4%" left="50%" width="57.1%">
          <img
            src={mainLogoUrl}
            alt="SteriLab"
            className={homeExiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'}
            style={{ width: '100%', display: 'block', animationDelay: '0ms' }}
          />
        </Centered>

        <Centered top="66%" left="50%" width="61%">
          <img
            src={greetingUrl}
            alt="Halo, Analis! Selamat datang di SteriLab - laboratorium maya tempat kamu akan menginvestigasi dugaan keracunan makanan sebagai analis mikrobiologi pangan."
            className={homeExiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'}
            style={{ width: '100%', display: 'block', animationDelay: '120ms' }}
          />
        </Centered>

        <Centered top="81.2%" left="50%" width="max(220px, 28.5%)">
          <BubbleButton src={exploreBtnUrl} alt="Mulai Menjelajah" delayMs={240} exiting={homeExiting} onClick={handleExplore} />
        </Centered>

        <Centered top="93.2%" left="7.76%" width="max(88px, 10.5%)">
          <BubbleButton src={exitBtnUrl} alt="Keluar" delayMs={360} exiting={homeExiting} onClick={handleExit} />
        </Centered>

        <IconButton
          src={audioOn ? bgmOnBtnUrl : bgmOffBtnUrl}
          alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
          label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
          top="3.53%"
          left="93.93%"
          size="3.79%"
          animationClassName={homeExiting ? 'sterilab-bubble-out' : undefined}
          animationDelayMs={homeExiting ? 480 : undefined}
          onClick={handleToggleSound}
        />
      </Stage>
    );
  }

  return (
    <Stage
      background={
        <img
          src={splashBgUrl}
          alt="Laboratorium mikrobiologi pangan modern dengan analis ber-APD, mikroskop, dan Laminar Air Flow"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      }
    >
      <Centered top="32%" left="50%" width="60%">
        <img src={mainLogoUrl} alt="SteriLab" className="sterilab-bubble-in" style={{ width: '100%', display: 'block', animationDelay: '150ms' }} />
      </Centered>

      {phase === 'loading' && (
        <Centered top="62%" left="50%" width="37.5%">
          <div className="sterilab-bubble-in" style={{ animationDelay: '300ms' }}>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Memuat konten"
              style={{
                position: 'relative',
                width: '100%',
                height: 'max(10px, 2.4cqw)',
                borderRadius: 999,
                background: '#BEF0FF',
                border: '3px solid #F5FFFF',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, width: `${percent}%`, borderRadius: 999, background: '#005ACD' }} />
            </div>
            <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 'max(12px, 1.25cqw)', color: '#005ACD', fontWeight: 600 }}>
              {percent}% Memuat Konten
            </p>
          </div>
        </Centered>
      )}

      {phase === 'touch' && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Ketuk di mana saja untuk melanjutkan"
          onPointerDown={handleAdvance}
          onKeyDown={handleAdvanceKeyDown}
          style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
        >
          <Centered top="62%" left="50%" width="4%">
            <img
              src={touchAnythingUrl}
              alt=""
              aria-hidden="true"
              className="sterilab-bubble-in sterilab-pulse-scale"
              style={{ width: '100%', display: 'block' }}
            />
          </Centered>
          <Centered top="75%" left="50%">
            <p
              className="sterilab-bubble-in"
              style={{
                margin: 0,
                fontSize: 'max(14px, 1.41cqw)',
                color: '#005ACD',
                fontWeight: 600,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              Ketuk di mana saja untuk melanjutkan
            </p>
          </Centered>
        </div>
      )}
    </Stage>
  );
}

function BubbleButton({
  src,
  alt,
  delayMs,
  exiting,
  onClick,
}: {
  src: string;
  alt: string;
  delayMs: number;
  exiting?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={alt}
      className={exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'}
      style={{
        animationDelay: `${delayMs}ms`,
        display: 'block',
        width: '100%',
        border: 'none',
        padding: 0,
        background: 'transparent',
        cursor: 'pointer',
        transition: 'transform 120ms ease-out, filter 120ms ease-out',
      }}
      onPointerOver={(e: PointerEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = 'scale(1.08)')}
      onPointerOut={(e: PointerEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = 'scale(1)')}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => (e.currentTarget.style.filter = 'brightness(0.92)')}
      onPointerUp={(e: PointerEvent<HTMLButtonElement>) => (e.currentTarget.style.filter = 'brightness(1)')}
    >
      <img src={src} alt="" aria-hidden="true" style={{ width: '100%', display: 'block' }} />
    </button>
  );
}
