// Shared volume-ramp primitive for every fade in the app (bgmPlayer's global
// duck/restore, and any Screen-local track like Evaluasi's work_theme). One
// rAF loop per element, canceled and replaced rather than stacked if a new
// ramp starts before the last one finished - otherwise two competing loops
// fight over the same `.volume` and the audible result stutters.
const rampFrames = new WeakMap<HTMLAudioElement, number>();

export function rampVolume(el: HTMLAudioElement, target: number, ms: number, onDone?: () => void): void {
  const existing = rampFrames.get(el);
  if (existing) cancelAnimationFrame(existing);

  const from = el.volume;
  if (from === target || ms <= 0) {
    el.volume = target;
    onDone?.();
    return;
  }

  const startedAt = performance.now();
  const step = () => {
    const t = Math.min(1, (performance.now() - startedAt) / ms);
    el.volume = from + (target - from) * t;
    if (t < 1) {
      rampFrames.set(el, requestAnimationFrame(step));
    } else {
      rampFrames.delete(el);
      onDone?.();
    }
  };
  rampFrames.set(el, requestAnimationFrame(step));
}
