import mainBgmUrl from '../../../assets/sounds/01_reusable/long/main_bgm.ogg';
import { isAudioEnabled, onAudioEnabledChange } from './audioSettings';

// Single looping background-music track for the whole app (not per-Phaser-
// scene - ADR-0001 scopes Phaser to the 5 Stage canvases only). Started once
// from SplashPage after asset preload and never paused/restarted on Screen
// navigation, since <html>/<body> never unmount. Mute state stays in sync
// with the bgm on/off buttons across every Screen via onAudioEnabledChange.
let audio: HTMLAudioElement | null = null;
let started = false;

function ensureAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(mainBgmUrl);
    audio.loop = true;
    audio.muted = !isAudioEnabled();
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
