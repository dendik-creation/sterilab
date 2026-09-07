import mainBgmUrl from '../../../assets/sounds/01_reusable/long/main_bgm.ogg';
import { isAudioEnabled, onAudioEnabledChange } from './audioSettings';
import { rampVolume } from './fade';

// Single looping background-music track for the whole app (not per-Phaser-
// scene - ADR-0001 scopes Phaser to the 5 Stage canvases only). Started once
// from SplashPage after asset preload and never paused/restarted on Screen
// navigation, since <html>/<body> never unmount. Mute state stays in sync
// with the bgm on/off buttons across every Screen via onAudioEnabledChange.
let audio: HTMLAudioElement | null = null;
let started = false;

// Ducking (Case lowers the loop under its hook narration and restores it on
// the way out). Volume is a separate axis from `muted`: the sound on/off
// button owns `muted`, a Screen owns the duck, and neither clobbers the other.
const FULL_VOLUME = 1;
const DUCKED_VOLUME = 0.10;
const RAMP_MS = 400;

function ensureAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(mainBgmUrl);
    audio.loop = true;
    audio.volume = FULL_VOLUME;
    audio.muted = !isAudioEnabled();
    // Lives in the document rather than as a detached `new Audio()` object so
    // its state (volume, muted, paused) is observable - both to a human with
    // devtools open and to the Playwright specs that assert the Case duck
    // actually happened.
    audio.dataset.sterilabBgm = 'true';
    audio.hidden = true;
    document.body.appendChild(audio);
    onAudioEnabledChange((enabled) => {
      if (audio) audio.muted = !enabled;
    });
  }
  return audio;
}

export function startGlobalBgm(): void {
  if (started) return;
  started = true;
  const el = ensureAudio();
  void el.play().catch(() => {
    // Autoplay can still be blocked in some browsers even muted - retry once
    // on the next user interaction rather than losing the loop forever.
    started = false;
    const retry = () => {
      window.removeEventListener('pointerdown', retry);
      window.removeEventListener('keydown', retry);
      startGlobalBgm();
    };
    window.addEventListener('pointerdown', retry, { once: true });
    window.addEventListener('keydown', retry, { once: true });
  });
}

// Ramped rather than stepped: a hard cut to 15% under a narration that is
// itself fading in reads as a glitch, and a hard cut back on Screen change
// reads as the music restarting.
export function duckGlobalBgm(): void {
  rampVolume(ensureAudio(), DUCKED_VOLUME, RAMP_MS);
}

export function restoreGlobalBgm(): void {
  rampVolume(ensureAudio(), FULL_VOLUME, RAMP_MS);
}

// Evaluasi's own stop/resume: unlike duck/restore (music keeps playing under
// the surface), the loop is fully paused while Evaluasi runs its own
// work_theme track, and un-paused once the Analyst leaves that Screen.
export function stopGlobalBgmFaded(ms = RAMP_MS): void {
  const el = ensureAudio();
  rampVolume(el, 0, ms, () => el.pause());
}

export function resumeGlobalBgmFaded(ms = RAMP_MS): void {
  const el = ensureAudio();
  if (el.paused) void el.play().catch(() => {});
  rampVolume(el, FULL_VOLUME, ms);
}
