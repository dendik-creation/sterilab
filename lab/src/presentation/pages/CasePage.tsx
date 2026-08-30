import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import caseBgUrl from '../../../assets/images/02_scenes/03_case/case_bg.png';
import lanjutBriefingBtnUrl from '../../../assets/images/02_scenes/03_case/lanjut_briefing_btn.png';
import homeBtnUrl from '../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import clickSfxUrl from '../../../assets/sounds/01_reusable/short/click.webm';
import hookNarrationUrl from '../../../assets/sounds/02_scenes/03_case/hook_naration.ogg';
import { useNavigation } from '../../app/navigation';
import { isAudioEnabled, onAudioEnabledChange, toggleAudioEnabled } from '../../core/audio/audioSettings';
import { duckGlobalBgm, restoreGlobalBgm } from '../../core/audio/bgmPlayer';
import { prefersReducedMotion } from '../../core/a11y/motion';
import { palette } from '../../core/theme/palette';
import { Stage } from '../components/Stage';
import { PulseButton } from '../components/PulseButton';
import { IconButton } from '../components/IconButton';

// Staggered entrance on mount, and the exact reverse on the way out - same
// ladder Home (SplashPage) and Missions use, so a Screen change reads as one
// continuous motion instead of a hard cut.
const STAGGER_MS = 110;
const BUBBLE_MS = 550;

// Mount entrance: top bar left-to-right, then the listening badge. The
// "Lanjut Briefing" CTA is not here - it does not exist until the hook
// narration finishes, so its entrance is timed from that `ended` event.
const ENTER_DELAY_MS = { home: 0, back: STAGGER_MS, sound: 2 * STAGGER_MS, badge: 3 * STAGGER_MS } as const;

// Exit runs whatever is currently on screen backwards - last in, first out.
// Exactly one of `badge` / `lanjut` is ever mounted (the badge is the
// narration running, the CTA is the narration finished), so the two orders
// below are the only two shapes this Screen can exit in.
type Piece = 'lanjut' | 'badge' | 'sound' | 'back' | 'home';
const EXIT_ORDER_LISTENING: Piece[] = ['badge', 'sound', 'back', 'home'];
const EXIT_ORDER_READY: Piece[] = ['lanjut', 'sound', 'back', 'home'];

// Top bar geometry from the revised Figma frame 20:1296, which puts home at
// x=47.974, back at x=146.103 and the sound toggle at x=1803.486, all 72.78px
// square on the 1920x1080 canvas. Identical to MissionsPage's numbers, and
// deliberately shared with it: `back` used to sit at a hand-set 9.5% here, so
// the button jumped sideways on the way from Case to Missions.
// IconButton floors every icon to a 44px WCAG 2.2 AA touch target, which on
// 568x320 makes them ~2x their designed size - so each offset is floored/
// capped the same way the size is, or the raw percentages collide on the left
// and push the sound icon off the right edge.
const HOME_LEFT = 'max(12px, 2.499%)';
const BACK_LEFT = 'max(64px, 7.609%)';
const SOUND_LEFT = 'min(93.931%, 100% - 52px)';
const TOP_BAR_TOP = '3.574%';
const ICON_SIZE = '3.791%';

// The narration script this Screen plays, verbatim from
// docs/prd/05-content-and-storyboard.md > Case (Briefing Kasus) > Narasi.
// Present as real text, not just as an audio file: the CTA is gated on the
// narration finishing, so an Analyst who cannot hear it would otherwise be
// waiting out 50 seconds of nothing.
const NARRATION_TRANSCRIPT =
  'Bayangkan terjadi dugaan keracunan makanan setelah beberapa anak SD mengonsumsi produk pangan pada sebuah kegiatan sekolah. ' +
  'Sampel makanan kemudian dikirim ke laboratorium mikrobiologi untuk diteliti lebih lanjut, dan kamu adalah analis laboratorium ' +
  'yang bertugas menangani pengujian tersebut. Tahukah kamu? Satu hasil uji mikrobiologi yang tidak akurat dapat menyebabkan ' +
  'makanan yang berbahaya dinyatakan aman, atau sebaliknya, produk yang sebenarnya aman justru ditarik dari peredaran. ' +
  'Kesalahan sekecil apa pun selama proses pengujian dapat mengubah hasil analisis. Penasaran bagaimana seorang analis ' +
  'laboratorium menghasilkan data yang akurat, valid, dan dapat dipertanggungjawabkan? Yuk, jelajahi SteriLab!';

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

// Case (Briefing Kasus) - Figma "Sterilab-APHP" node 20:1295 "Scene 02: Hook",
// revised frame 20:1296. case_bg.png now bakes the entire "News Update"
// monitor - headline, photo and both body paragraphs - so the Screen has no
// reveal interaction left: the "Baca Selengkapnya" button and the separate
// "Berita Terkini" card (frame 29:1297, now marked unused in Figma) are gone,
// along with their art. What paces the Screen instead is audio: the hook
// narration plays on mount over a ducked BGM, a badge marks it as running,
// and the one CTA appears when it ends.
export function CasePage() {
  const { goTo, goBack } = useNavigation();
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [narrationDone, setNarrationDone] = useState(false);
  const [exiting, setExiting] = useState(false);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const narrationRef = useRef<HTMLAudioElement | null>(null);
  // Latched (never reset) before the pause() in leaveTo, so the play()
  // rejection that pause causes is read as "we stopped it" rather than "it
  // cannot play". The mount effect has its own per-invocation flag for the
  // same job - see the comment there.
  const stoppedByUsRef = useRef(false);
  const exitTimeoutRef = useRef(0);

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSfxUrl);
  }, []);

  useEffect(() => () => window.clearTimeout(exitTimeoutRef.current), []);

  // Duck the global loop for as long as this Screen is mounted and restore it
  // on the way out - the cleanup covers every exit (home, back, CTA) instead
  // of each handler having to remember to undo it.
  useEffect(() => {
    duckGlobalBgm();
    return () => restoreGlobalBgm();
  }, []);

  // The narration runs whether or not sound is on, and mirrors the toggle via
  // `muted`. Gating playback on the setting instead would make the CTA's
  // arrival depend on it: the Analyst would either wait out a silent 50
  // seconds with no way to know why, or skip the beat entirely.
  useEffect(() => {
    const el = narrationRef.current;
    if (!el) return;
    // Per-invocation, deliberately not a ref: React StrictMode runs this
    // effect twice on a dev mount, and a shared ref reset at the top of the
    // second run would already read `false` by the time the *first* run's
    // play() rejection lands - which is exactly the case this flag exists to
    // recognise.
    let cancelled = false;
    el.muted = !isAudioEnabled();
    void el.play().catch(() => {
      // A play() promise also rejects when *we* pause the element, and
      // pausing is what the cleanup below (and leaveTo) does. Only a
      // rejection we did not cause is a real failure: autoplay refused, or
      // the browser cannot decode Ogg Opus. Then, rather than strand the
      // Analyst behind a gate that will never open, hand over the CTA and
      // leave the transcript as the content path.
      if (cancelled || stoppedByUsRef.current) return;
      setNarrationDone(true);
    });
    const stop = onAudioEnabledChange((enabled) => {
      el.muted = !enabled;
    });
    return () => {
      cancelled = true;
      stop();
      el.pause();
    };
  }, []);

  const exitOrder = narrationDone ? EXIT_ORDER_READY : EXIT_ORDER_LISTENING;
  const exitDelay = (piece: Piece) => Math.max(0, exitOrder.indexOf(piece)) * STAGGER_MS;
  const exitTotalMs = (exitOrder.length - 1) * STAGGER_MS + BUBBLE_MS;
  const bubbleClass = exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in';

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

  // Every way off this Screen plays the exit ladder first, then navigates -
  // otherwise the transition would only ever run for whichever exit happened
  // to be wired up.
  const leaveTo = (navigate: () => void) => {
    if (exiting) return;
    playClick();
    stoppedByUsRef.current = true;
    narrationRef.current?.pause();
    if (prefersReducedMotion()) {
      navigate();
      return;
    }
    setExiting(true);
    exitTimeoutRef.current = window.setTimeout(navigate, exitTotalMs);
  };

  // Figma orders the scenes 01 Splash/Home -> 02 Hook (Case) -> 03 Navigasi
  // (Menu Utama, node 29:2435) with no briefing frame in between, so this CTA
  // hands off to Missions. `briefing`/`guide` stay in the ScreenId union for
  // when those Screens get designed; routing here would be a dead end today.
  const handleContinue = () => leaveTo(() => goTo('missions'));

  return (
    <Stage
      background={
        <img
          src={caseBgUrl}
          alt="Ruang laboratorium tempat dua analis menerima sampel makanan, dengan monitor menampilkan berita dugaan keracunan makanan pada kegiatan sekolah"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      }
    >
      {/* Real element rather than a detached `new Audio()`: it makes the one
          thing that paces this Screen inspectable (duration, currentTime,
          ended) instead of hidden inside a closure. */}
      <audio
        ref={narrationRef}
        src={hookNarrationUrl}
        preload="auto"
        data-testid="case-narration"
        onEnded={() => setNarrationDone(true)}
        onError={() => setNarrationDone(true)}
      />

      <h1 style={srOnly}>Studi Kasus: Dugaan Keracunan Makanan pada Kegiatan Sekolah</h1>
      <p style={srOnly}>{NARRATION_TRANSCRIPT}</p>

      {/* Top bar: home / back / sound - reused 01_reusable button art, DOM
          buttons with the same hover/press feedback token as HomeScene. */}
      <IconButton
        src={homeBtnUrl}
        alt="Menu Utama"
        label="Menu Utama"
        top={TOP_BAR_TOP}
        left={HOME_LEFT}
        size={ICON_SIZE}
        animationClassName={bubbleClass}
        animationDelayMs={exiting ? exitDelay('home') : ENTER_DELAY_MS.home}
        onClick={() => leaveTo(() => goTo('splash'))}
      />
      <IconButton
        src={backBtnUrl}
        alt="Kembali"
        label="Kembali"
        top={TOP_BAR_TOP}
        left={BACK_LEFT}
        size={ICON_SIZE}
        animationClassName={bubbleClass}
        animationDelayMs={exiting ? exitDelay('back') : ENTER_DELAY_MS.back}
        onClick={() => leaveTo(goBack)}
      />
      <IconButton
        src={audioOn ? bgmOnBtnUrl : bgmOffBtnUrl}
        alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        top={TOP_BAR_TOP}
        left={SOUND_LEFT}
        size={ICON_SIZE}
        animationClassName={bubbleClass}
        animationDelayMs={exiting ? exitDelay('sound') : ENTER_DELAY_MS.sound}
        onClick={handleToggleSound}
      />

      {/* Why the wait is announced at all: the CTA is deliberately withheld
          for the length of the narration, and an empty bottom edge would read
          as a broken Screen rather than as a beat to listen through. Bottom
          left, so it never lands under the CTA that replaces it. */}
      <div aria-live="polite" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {!narrationDone && <ListeningBadge exiting={exiting} exitDelayMs={exitDelay('badge')} muted={!audioOn} />}
      </div>

      {narrationDone && (
        <PulseButton
          src={lanjutBriefingBtnUrl}
          alt="Lanjut Briefing"
          onClick={handleContinue}
          animationClassName={exiting ? 'sterilab-fade-out' : 'sterilab-rise-in-offscreen'}
          animationDelayMs={exiting ? exitDelay('lanjut') : 0}
          style={{
            top: '84.88%',
            // Centered at every size without touching `transform`, which the
            // rise-in animation on this same wrapper owns. A plain `left: %`
            // would drift off-center once the width hits its floor on a
            // 568px-wide viewport.
            left: 'calc(50% - max(123px, 11.245%))',
            // The floor is set from the *height* this art needs, not from a
            // round number: at 434x79 a 230px-wide button is only 41.9px tall,
            // under the WCAG 2.2 AA 44px target. 246px is the narrowest width
            // that clears it (44 * 434/79 = 241.7, rounded up for the
            // subpixel rounding browsers do on aspect-ratio boxes).
            width: 'max(246px, 22.49%)',
            aspectRatio: '434 / 79',
          }}
        />
      )}
    </Stage>
  );
}

// Bottom-left "still playing" badge. Floors everything in px: at 568x320 a
// percentage-only pill would render ~7px tall with unreadable text.
function ListeningBadge({
  exiting,
  exitDelayMs,
  muted,
}: {
  exiting: boolean;
  exitDelayMs: number;
  muted: boolean;
}) {
  return (
    <div
      className={exiting ? 'sterilab-fade-out' : 'sterilab-rise-in-offscreen'}
      style={{
        position: 'absolute',
        left: 'max(12px, 2.499%)',
        bottom: 'max(12px, 5.5%)',
        animationDelay: `${exiting ? exitDelayMs : ENTER_DELAY_MS.badge}ms`,
        display: 'flex',
        alignItems: 'center',
        gap: 'max(8px, 0.63cqw)',
        padding: 'max(8px, 0.73cqw) max(14px, 1.25cqw)',
        borderRadius: 999,
        background: palette.deepBlue,
        color: palette.offWhite,
        fontSize: 'max(12px, 1.04cqw)',
        fontWeight: 600,
        lineHeight: 1.25,
        letterSpacing: '0.01em',
        boxShadow: '0 6px 18px rgba(6, 54, 104, 0.28)',
        maxWidth: 'min(46%, 420px)',
      }}
    >
      <span
        aria-hidden="true"
        style={{ display: 'flex', alignItems: 'flex-end', gap: 'max(2px, 0.16cqw)', height: 'max(12px, 1.04cqw)' }}
      >
        {[0, 160, 320].map((delay) => (
          <span
            key={delay}
            className="sterilab-eq-bar"
            style={{
              display: 'block',
              width: 'max(3px, 0.21cqw)',
              height: '100%',
              borderRadius: 999,
              background: palette.skyBlue,
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </span>
      <span>{muted ? 'Suara sedang dimatikan' : 'Dengarkan sampai selesai'}</span>
    </div>
  );
}
