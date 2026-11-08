import { useEffect, useRef, useState } from 'react';
import { isAudioEnabled, onAudioEnabledChange } from './audioSettings';
import { duckGlobalBgm, restoreGlobalBgm } from './bgmPlayer';
import cover from '../../../assets/sounds/03_voice_over/1_cover_scene.ogg';
import objectives from '../../../assets/sounds/03_voice_over/1.5_tujuan_scene.ogg';
import hook from '../../../assets/sounds/03_voice_over/2_hook_scene.ogg';
import dashboard from '../../../assets/sounds/03_voice_over/3_dashboard_(stage page)_scene.ogg';
import aseptic from '../../../assets/sounds/03_voice_over/4_teknik_kerja_aseptik.ogg';
import media from '../../../assets/sounds/03_voice_over/5_media_kultur_scene.ogg';
import waste from '../../../assets/sounds/03_voice_over/6_pengelolaan_limbah_scene.ogg';
import evaluation from '../../../assets/sounds/03_voice_over/7_evaluasi.ogg';
import closing from '../../../assets/sounds/03_voice_over/8_all_complete.ogg';

export const voiceSources = { cover, objectives, hook, dashboard, aseptic, media, waste, evaluation, closing };
type VoiceId = keyof typeof voiceSources;
type Status = 'loading' | 'ready' | 'playing' | 'paused' | 'completed' | 'error';
let active: HTMLAudioElement | null = null;
let releaseActive: (() => void) | null = null;

export function stopVoiceOver(): void {
  releaseActive?.();
}

// Coordination follows media events, not scene mounting or play() requests.
export function coordinateVoice(el: HTMLAudioElement, onStop?: () => void): () => void {
  stopVoiceOver();
  active = el;
  el.muted = !isAudioEnabled();
  const sync = () => {
    if (active !== el) return;
    if (!el.paused && !el.ended && !el.muted && el.volume > 0) duckGlobalBgm();
    else restoreGlobalBgm();
  };
  const events = ['playing', 'pause', 'ended', 'volumechange', 'error'] as const;
  events.forEach(event => el.addEventListener(event, sync));
  const unsubscribe = onAudioEnabledChange(enabled => { el.muted = !enabled; sync(); });
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    events.forEach(event => el.removeEventListener(event, sync));
    unsubscribe();
    onStop?.();
    el.pause();
    if (active === el) { active = null; releaseActive = null; restoreGlobalBgm(); }
  };
  releaseActive = release;
  return release;
}

export function useVoiceOver(id: VoiceId | null) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    if (!id) return;
    const el = new Audio(voiceSources[id]);
    el.dataset.sterilabVoice = id;
    el.hidden = true;
    document.body.appendChild(el);
    ref.current = el;
    let cancelled = false;
    setStatus('loading'); setTime(0); setDuration(0);
    const update = () => { setTime(el.currentTime || 0); setDuration(Number.isFinite(el.duration) ? el.duration : 0); };
    const ready = () => { update(); if (el.paused) setStatus('ready'); };
    const playing = () => setStatus('playing');
    const paused = () => { if (!el.ended) setStatus('paused'); };
    const ended = () => { update(); setStatus('completed'); };
    const error = () => setStatus('error');
    el.addEventListener('loadedmetadata', ready);
    el.addEventListener('timeupdate', update);
    el.addEventListener('playing', playing);
    el.addEventListener('pause', paused);
    el.addEventListener('ended', ended);
    el.addEventListener('error', error);
    const stop = coordinateVoice(el, () => {
      cancelled = true;
      el.removeEventListener('loadedmetadata', ready);
      el.removeEventListener('timeupdate', update);
      el.removeEventListener('playing', playing);
      el.removeEventListener('pause', paused);
      el.removeEventListener('ended', ended);
      el.removeEventListener('error', error);
      if (ref.current === el) ref.current = null;
    });
    void el.play().catch(() => { if (!cancelled) setStatus('ready'); });
    return () => { cancelled = true; stop(); el.remove(); if (ref.current === el) ref.current = null; };
  }, [id]);
  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (!el.paused) el.pause();
    else { if (el.ended) el.currentTime = 0; void el.play().catch(() => { if (ref.current === el) setStatus('error'); }); }
  };
  return { status, time, duration, toggle };
}
